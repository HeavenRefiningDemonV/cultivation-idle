import type { MigrationFieldTouch, MigrationStep, PlannedMutation } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';
import {
  getHiddenCraftRefundDefinitionByOutputItemId,
  getHiddenCraftRefundDefinitionBySourceId,
  listHiddenCraftOutputItemIds,
} from '../../../../systems/economy/index.js';

type MutableRecord = Record<string, unknown>;

type RefundTotals = {
  items: Record<string, number>;
  currencies: Record<string, number>;
};

const HIDDEN_OUTPUT_ITEM_IDS = new Set(listHiddenCraftOutputItemIds());

const asRecord = (value: unknown): MutableRecord => (isRecord(value) ? (value as MutableRecord) : {});
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

function addItem(refunds: RefundTotals, itemId: string, qty: number) {
  if (!itemId || qty <= 0) return;
  refunds.items[itemId] = (refunds.items[itemId] ?? 0) + qty;
}

function addCurrency(refunds: RefundTotals, key: string, amount: number) {
  if (!key || amount <= 0) return;
  refunds.currencies[key] = (refunds.currencies[key] ?? 0) + amount;
}

function refundDefinition(refunds: RefundTotals, sourceId: string, crafts: number) {
  if (crafts <= 0) return;
  const definition = getHiddenCraftRefundDefinitionBySourceId(sourceId);
  if (!definition) return;
  definition.inputs.forEach((entry) => addItem(refunds, entry.itemId, entry.qty * crafts));
  Object.entries(definition.costs).forEach(([key, value]) => addCurrency(refunds, key, (value ?? 0) * crafts));
}

function refundHiddenInventoryItem(refunds: RefundTotals, itemId: string, quantity: number) {
  const definition = getHiddenCraftRefundDefinitionByOutputItemId(itemId);
  if (!definition?.output) return;
  const crafts = Math.floor(quantity / Math.max(1, definition.output.qty));
  refundDefinition(refunds, definition.sourceId, crafts);
}

function collapseHiddenRefundItems(refunds: RefundTotals) {
  const pending = Object.entries(refunds.items)
    .filter(([itemId, qty]) => HIDDEN_OUTPUT_ITEM_IDS.has(itemId) && qty > 0)
    .map(([itemId]) => itemId);

  while (pending.length > 0) {
    const itemId = pending.pop();
    if (!itemId) continue;
    const quantity = refunds.items[itemId] ?? 0;
    if (quantity <= 0 || !HIDDEN_OUTPUT_ITEM_IDS.has(itemId)) continue;

    delete refunds.items[itemId];
    const before = { ...refunds.items };
    refundHiddenInventoryItem(refunds, itemId, quantity);

    Object.entries(refunds.items).forEach(([nestedItemId, nestedQty]) => {
      if (!HIDDEN_OUTPUT_ITEM_IDS.has(nestedItemId) || nestedQty <= 0) return;
      const previousQty = before[nestedItemId] ?? 0;
      if (nestedQty > previousQty) pending.push(nestedItemId);
    });
  }
}

function applyRefunds(next: MutableRecord, refunds: RefundTotals) {
  const inventoryState = asRecord(next.inventoryState);
  const items = asRecord(inventoryState.items);
  const currencies = asRecord(inventoryState.currencies);

  Object.entries(refunds.items).forEach(([itemId, qty]) => {
    items[itemId] = toNumber(items[itemId]) + qty;
  });

  Object.entries(refunds.currencies).forEach(([key, amount]) => {
    currencies[key] = (toNumber(currencies[key]) + amount).toString();
  });

  inventoryState.items = items;
  inventoryState.currencies = currencies;
  next.inventoryState = inventoryState;
}

export const v2_0_0_refund_hidden_craft_outputs: MigrationStep = {
  id: 'v2_0_0_refund_hidden_craft_outputs',
  title: 'Refund hidden deferred craft outputs',
  description: 'Remove hidden/deferred craft outputs from saves, refund canonical authored costs, and clear stale hidden craft references.',
  kind: 'transform',
  ownerPacket: '3.1',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 75,
  appliesTo: (save) => {
    const inventoryState = asRecord(save.inventoryState);
    const items = asRecord(inventoryState.items);
    if (Object.keys(items).some((itemId) => HIDDEN_OUTPUT_ITEM_IDS.has(itemId) && toNumber(items[itemId]) > 0)) return true;

    const professionState = asRecord(save.professionState);
    const alchemyQueue = asArray<MutableRecord>(professionState.alchemyQueue);
    const talismanQueue = asArray<MutableRecord>(professionState.talismanQueue);
    const forgeQueue = asArray<MutableRecord>(professionState.forgeQueue);
    if (alchemyQueue.some((job) => typeof job.recipeId === 'string' && getHiddenCraftRefundDefinitionBySourceId(job.recipeId))) return true;
    if (talismanQueue.some((job) => typeof job.recipeId === 'string' && getHiddenCraftRefundDefinitionBySourceId(job.recipeId))) return true;
    if (forgeQueue.some((job) => typeof job.blueprintId === 'string' && getHiddenCraftRefundDefinitionBySourceId(job.blueprintId))) return true;

    const craftSessionState = asRecord(save.craftSessionState);
    const activeSession = asRecord(craftSessionState.activeSession);
    if (typeof activeSession.sourceId === 'string' && getHiddenCraftRefundDefinitionBySourceId(activeSession.sourceId)) return true;

    const buffState = asRecord(save.buffState);
    if (asArray<MutableRecord>(buffState.activeTalismans).some((entry) => typeof entry.itemId === 'string' && HIDDEN_OUTPUT_ITEM_IDS.has(entry.itemId))) return true;

    const medicinePouchState = asRecord(save.medicinePouchState);
    const slots = asRecord(medicinePouchState.slots);
    if (Object.values(slots).some((slot) => isRecord(slot) && typeof slot.equippedItemId === 'string' && HIDDEN_OUTPUT_ITEM_IDS.has(slot.equippedItemId))) return true;

    return false;
  },
  run: (save) => {
    const next = cloneSave(save);
    const warnings = [];
    const touched: MigrationFieldTouch[] = [];
    const plannedMutations: PlannedMutation[] = [];
    const refunds: RefundTotals = { items: {}, currencies: {} };
    let removedInventoryCount = 0;
    let removedQueueCount = 0;
    let removedBuffCount = 0;
    let removedMedicineCount = 0;
    let clearedActiveSession = false;
    let didMutate = false;

    const inventoryState = asRecord(next.inventoryState);
    const items = asRecord(inventoryState.items);
    Object.keys(items).forEach((itemId) => {
      const quantity = toNumber(items[itemId]);
      if (!HIDDEN_OUTPUT_ITEM_IDS.has(itemId) || quantity <= 0) return;
      refundHiddenInventoryItem(refunds, itemId, quantity);
      delete items[itemId];
      removedInventoryCount += quantity;
      didMutate = true;
      touched.push(touch(`inventoryState.items.${itemId}`, 'delete', `Removed hidden crafted output x${quantity}.`));
      plannedMutations.push(plan(`inventoryState.items.${itemId}`, '3.1', `Remove hidden crafted output ${itemId}.`, 'delete'));
    });
    inventoryState.items = items;
    next.inventoryState = inventoryState;

    const professionState = asRecord(next.professionState);
    const queueSpecs = [
      ['alchemyQueue', 'recipeId'],
      ['talismanQueue', 'recipeId'],
      ['forgeQueue', 'blueprintId'],
    ] as const;
    queueSpecs.forEach(([queueKey, idKey]) => {
      const queue = asArray<MutableRecord>(professionState[queueKey]);
      const kept = queue.filter((job, index) => {
        const sourceId = typeof job[idKey] === 'string' ? (job[idKey] as string) : '';
        const definition = sourceId ? getHiddenCraftRefundDefinitionBySourceId(sourceId) : undefined;
        if (!definition) return true;
        refundDefinition(refunds, sourceId, Math.max(1, Math.floor(toNumber(job.qty) || 1)));
        removedQueueCount += 1;
        didMutate = true;
        touched.push(touch(`professionState.${queueKey}[${index}]`, 'delete', `Removed hidden craft queue entry ${sourceId}.`));
        plannedMutations.push(plan(`professionState.${queueKey}[${index}]`, '3.1', `Refund and remove hidden craft queue entry ${sourceId}.`, 'delete'));
        return false;
      });
      professionState[queueKey] = kept;
    });
    next.professionState = professionState;

    const craftSessionState = asRecord(next.craftSessionState);
    const activeSession = asRecord(craftSessionState.activeSession);
    if (typeof activeSession.sourceId === 'string' && getHiddenCraftRefundDefinitionBySourceId(activeSession.sourceId)) {
      refundDefinition(refunds, activeSession.sourceId, Math.max(1, Math.floor(toNumber(activeSession.qty) || 1)));
      craftSessionState.activeSession = null;
      next.craftSessionState = craftSessionState;
      clearedActiveSession = true;
      didMutate = true;
      touched.push(touch('craftSessionState.activeSession', 'set', `Cleared hidden craft active session ${activeSession.sourceId}.`));
      plannedMutations.push(plan('craftSessionState.activeSession', '3.1', `Refund and clear hidden craft active session ${activeSession.sourceId}.`));
    }

    const buffState = asRecord(next.buffState);
    const activeTalismans = asArray<MutableRecord>(buffState.activeTalismans);
    const keptTalismans = activeTalismans.filter((entry, index) => {
      const itemId = typeof entry.itemId === 'string' ? entry.itemId : '';
      if (!HIDDEN_OUTPUT_ITEM_IDS.has(itemId)) return true;
      refundHiddenInventoryItem(refunds, itemId, 1);
      removedBuffCount += 1;
      didMutate = true;
      touched.push(touch(`buffState.activeTalismans[${index}]`, 'delete', `Removed hidden active talisman ${itemId}.`));
      plannedMutations.push(plan(`buffState.activeTalismans[${index}]`, '3.1', `Refund and clear hidden active talisman ${itemId}.`, 'delete'));
      return false;
    });
    buffState.activeTalismans = keptTalismans;
    next.buffState = buffState;

    const medicinePouchState = asRecord(next.medicinePouchState);
    const slots = asRecord(medicinePouchState.slots);
    Object.entries(slots).forEach(([slotKey, rawSlot]) => {
      if (!isRecord(rawSlot)) return;
      const equippedItemId = typeof rawSlot.equippedItemId === 'string' ? rawSlot.equippedItemId : null;
      if (!equippedItemId || !HIDDEN_OUTPUT_ITEM_IDS.has(equippedItemId)) return;
      refundHiddenInventoryItem(refunds, equippedItemId, 1);
      rawSlot.equippedItemId = null;
      rawSlot.lastUsedAt = null;
      removedMedicineCount += 1;
      didMutate = true;
      touched.push(touch(`medicinePouchState.slots.${slotKey}.equippedItemId`, 'set', `Cleared hidden equipped item ${equippedItemId}.`));
      plannedMutations.push(plan(`medicinePouchState.slots.${slotKey}.equippedItemId`, '3.1', `Refund and clear hidden equipped item ${equippedItemId}.`));
    });
    medicinePouchState.slots = slots;
    next.medicinePouchState = medicinePouchState;

    if (didMutate) {
      collapseHiddenRefundItems(refunds);
      applyRefunds(next, refunds);
      warnings.push(
        warning(
          'HIDDEN_CRAFT_OUTPUTS_REFUNDED',
          `Hidden craft cleanup removed inventory=${removedInventoryCount}, queueEntries=${removedQueueCount}, activeTalismans=${removedBuffCount}, medicineSlots=${removedMedicineCount}, activeSessionCleared=${clearedActiveSession}.`,
          '3.1',
          'info',
          'inventoryState.items',
        ),
      );
    }

    return createStepResult(
      v2_0_0_refund_hidden_craft_outputs,
      next,
      didMutate
        ? `Refunded hidden craft residue. removedInventory=${removedInventoryCount}; removedQueueEntries=${removedQueueCount}; clearedActiveSession=${clearedActiveSession}; refundedItems=${JSON.stringify(refunds.items)}; refundedCurrencies=${JSON.stringify(refunds.currencies)}.`
        : 'No hidden craft residue detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations, didMutate },
    );
  },
};
