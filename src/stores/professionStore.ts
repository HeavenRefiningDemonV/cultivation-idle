import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RewardService } from '../services/rewards';
import { greaterThanOrEqualTo, multiply } from '../utils/numbers';
import { getForgeBlueprint } from './contentStore';
import { useInventoryStore, type CurrencyKey } from './inventoryStore';
import { useContentStore } from './contentStore';
import { useEquipmentStore } from './equipmentStore';
import { useGameStore } from './gameStore';
import { useRecipeMasteryStore } from './recipeMasteryStore';
import { buildAlchemyOutputs, getAlchemyTimeMultiplier, getIdleYieldMultiplierForMastery } from '../systems/crafting/alchemyBonuses';
import { applyRefineService, applyTemperService } from '../services/forgeService';
import { useCityStore } from './cityStore';
import { useBountyStore } from './bountyStore';
import { GameEvents } from '../services/events/GameEvents';

export type AlchemyJob = {
  id: string;
  recipeId: string;
  qty: number;
  startedAt: number;
  endsAt: number;
  cityId: string;
};

export type TalismanJob = {
  id: string;
  recipeId: string;
  qty: number;
  startedAt: number;
  endsAt: number;
  cityId: string;
};

export type ActionResult = { ok: true; result?: unknown } | { ok: false; error: string };

export type ForgeJob = {
  id: string;
  blueprintId: string;
  qty: number;
  startedAt: number;
  endsAt: number;
  targetSlot?: 'weapon' | 'accessory';
  cityId: string;
};

interface ProfessionState {
  alchemyQueue: AlchemyJob[];
  talismanQueue: TalismanJob[];
  forgeQueue: ForgeJob[];
  lastTickAt: number;
  startAlchemy: (recipeId: string, qty: number) => ActionResult;
  startTalisman: (recipeId: string, qty: number) => ActionResult;
  startForge: (blueprintId: string, qty: number, options?: { targetSlot?: ForgeJob['targetSlot'] }) => ActionResult;
  tick: (now: number) => void;
  applyOffline: (now: number) => void;
  claimAlchemy: (jobId: string) => ActionResult;
  claimTalisman: (jobId: string) => ActionResult;
  claimForge: (jobId: string) => ActionResult;
  getForgeJobs: () => ForgeJob[];
  getForgeJobStatus: (job: ForgeJob, now?: number) => { done: boolean; remainingSec: number };
  canStartForge: (
    blueprintId: string,
    qty: number,
    targetSlot?: ForgeJob['targetSlot'],
  ) => { ok: boolean; reason?: string };
}

const makeJobId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const hashSeed = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};
const MAX_ALCHEMY_QTY = 999;
const MAX_TALISMAN_QTY = 999;
const MAX_FORGE_QTY = 999;

const currencyLabels: Record<CurrencyKey, string> = {
  gold: 'Gold',
  spiritStones: 'Spirit Stones',
  merit: 'Merit',
};

const resolveActiveCityId = (): string | null => {
  const cityState = useCityStore.getState();
  return cityState.currentCityId ?? cityState.unlockedCityIds[0] ?? null;
};

export const useProfessionStore = create<ProfessionState>()(
  immer((set, get) => ({
    alchemyQueue: [],
    talismanQueue: [],
    forgeQueue: [],
    lastTickAt: 0,

    startAlchemy: (recipeId, qty) => {
      const parsedQty = Math.floor(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }
      const amount = Math.min(parsedQty, MAX_ALCHEMY_QTY);

      const contentStore = useContentStore.getState();
      const recipe = contentStore.raw?.alchemy_recipes?.find((entry) => entry.id === recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const durationSec = recipe.timeSec ?? (recipe as { craftTimeSec?: number }).craftTimeSec;
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        return { ok: false, error: 'Invalid recipe time' };
      }

      const cityId = resolveActiveCityId();
      if (!cityId) {
        return { ok: false, error: 'Select a city first' };
      }

      const mastery = useRecipeMasteryStore.getState().getAlchemyMastery(recipeId);
      const timeMultiplier = getAlchemyTimeMultiplier(mastery);

      const inventory = useInventoryStore.getState();
      const inputs = recipe.inputs ?? {};
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const currentQty = inventory.getQty(itemId);
        if (currentQty < requiredQty) {
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Not enough ${itemName}` };
        }
      }

      const costsRaw = (recipe as { costs?: Partial<Record<CurrencyKey, number>> }).costs ?? {};
      const costs: Partial<Record<CurrencyKey, string>> = {};
      (Object.keys(costsRaw) as CurrencyKey[]).forEach((key) => {
        const raw = costsRaw[key];
        if (raw === undefined || raw === null) return;
        try {
          costs[key] = multiply(raw, amount).toString();
        } catch (error) {
          console.warn('[ProfessionStore] Failed to calculate cost', error);
        }
      });

      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const required = costs[key];
        if (!required) continue;
        if (!inventory.canAffordCurrency({ [key]: required })) {
          return { ok: false, error: `Not enough ${currencyLabels[key]}` };
        }
      }

      const removedItems: Array<{ itemId: string; qty: number }> = [];
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const removed = inventory.removeItem(itemId, requiredQty);
        if (!removed) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Missing ${itemName}` };
        }
        removedItems.push({ itemId, qty: requiredQty });
      }

      if (Object.keys(costs).length > 0) {
        const spent = inventory.spendCurrencies(costs);
        if (!spent) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          return { ok: false, error: 'Missing currency' };
        }
      }

      const durationMs = durationSec * amount * timeMultiplier * 1000;
      const now = Date.now();
      const lastJob = get().alchemyQueue.at(-1);
      const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
      const endsAt = startedAt + durationMs;

      set((state) => {
        state.alchemyQueue.push({
          id: makeJobId(),
          recipeId,
          qty: amount,
          startedAt,
          endsAt,
          cityId,
        });
      });

      GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'alchemy', sourceId: recipeId, qty: amount } });

      return { ok: true };
    },

    startTalisman: (recipeId, qty) => {
      const parsedQty = Math.floor(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }
      const amount = Math.min(parsedQty, MAX_TALISMAN_QTY);

      const contentStore = useContentStore.getState();
      const recipe = contentStore.raw?.talisman_recipes?.find((entry) => entry.id === recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      if (recipe.station && recipe.station !== 'talisman') {
        return { ok: false, error: 'Invalid station' };
      }

      const durationSec = recipe.timeSec ?? (recipe as { timeSeconds?: number }).timeSeconds;
      if (!Number.isFinite(durationSec) || durationSec < 0) {
        return { ok: false, error: 'Invalid recipe time' };
      }

      const cityId = resolveActiveCityId();
      if (!cityId) {
        return { ok: false, error: 'Select a city first' };
      }

      const inventory = useInventoryStore.getState();
      const inputs = recipe.inputs ?? {};
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const currentQty = inventory.getQty(itemId);
        if (currentQty < requiredQty) {
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Not enough ${itemName}` };
        }
      }

      const costsRaw =
        (recipe as { costs?: Partial<Record<CurrencyKey, number>> }).costs ??
        (recipe as { cost?: Partial<Record<CurrencyKey, number>> }).cost ??
        {};
      const costs: Partial<Record<CurrencyKey, string>> = {};
      (Object.keys(costsRaw) as CurrencyKey[]).forEach((key) => {
        const raw = costsRaw[key];
        if (raw === undefined || raw === null) return;
        try {
          costs[key] = multiply(Math.max(0, raw), amount).toString();
        } catch (error) {
          console.warn('[ProfessionStore] Failed to calculate talisman cost', error);
        }
      });

      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const required = costs[key];
        if (!required) continue;
        if (!inventory.canAffordCurrency({ [key]: required })) {
          return { ok: false, error: `Not enough ${currencyLabels[key]}` };
        }
      }

      const removedItems: Array<{ itemId: string; qty: number }> = [];
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const removed = inventory.removeItem(itemId, requiredQty);
        if (!removed) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Missing ${itemName}` };
        }
        removedItems.push({ itemId, qty: requiredQty });
      }

      if (Object.keys(costs).length > 0) {
        const spent = inventory.spendCurrencies(costs);
        if (!spent) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          return { ok: false, error: 'Missing currency' };
        }
      }

      const durationMs = Math.max(0, durationSec) * amount * 1000;
      const now = Date.now();
      const lastJob = get().talismanQueue.at(-1);
      const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
      const endsAt = startedAt + durationMs;

      set((state) => {
        state.talismanQueue.push({
          id: makeJobId(),
          recipeId,
          qty: amount,
          startedAt,
          endsAt,
          cityId,
        });
      });

      GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'talisman', sourceId: recipeId, qty: amount } });

      return { ok: true };
    },

    canStartForge: (blueprintId, qty, targetSlot) => {
      const parsedQty = Math.floor(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        return { ok: false, reason: 'Invalid quantity' };
      }
      const amount = Math.min(parsedQty, MAX_FORGE_QTY);

      const blueprint = getForgeBlueprint(blueprintId);
      if (!blueprint) {
        return { ok: false, reason: 'Blueprint not found' };
      }

      if (blueprint.type === 'craft' && !blueprint.output?.itemId) {
        return { ok: false, reason: 'Missing output' };
      }

      if (blueprint.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper')) {
        if (!targetSlot || (targetSlot !== 'weapon' && targetSlot !== 'accessory')) {
          return { ok: false, reason: 'Select a target slot' };
        }
      } else if (blueprint.type === 'service') {
        return { ok: false, reason: 'Unsupported service' };
      }

      const inventory = useInventoryStore.getState();
      const contentStore = useContentStore.getState();
      for (const entry of blueprint.costs.items) {
        if (!entry || !entry.itemId) continue;
        const required = Math.max(0, Math.floor(entry.qty)) * amount;
        if (required <= 0) continue;
        if (inventory.getQty(entry.itemId) < required) {
          const itemName = contentStore.maps.itemsById[entry.itemId]?.name ?? entry.itemId;
          return { ok: false, reason: `Need ${required} ${itemName}` };
        }
      }

      const goldCost = Math.max(0, blueprint.costs.gold) * amount;
      const spiritStoneCost = Math.max(0, blueprint.costs.spiritStones) * amount;
      if (goldCost > 0 && !greaterThanOrEqualTo(inventory.currencies.gold ?? '0', goldCost)) {
        return { ok: false, reason: `Need ${goldCost} Gold` };
      }
      if (spiritStoneCost > 0 && !greaterThanOrEqualTo(inventory.currencies.spiritStones ?? '0', spiritStoneCost)) {
        return { ok: false, reason: `Need ${spiritStoneCost} Spirit Stones` };
      }

      return { ok: true };
    },

    startForge: (blueprintId, qty, options) => {
      const parsedQty = Math.floor(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }
      const amount = Math.min(parsedQty, MAX_FORGE_QTY);

      const blueprint = getForgeBlueprint(blueprintId);
      if (!blueprint) {
        return { ok: false, error: 'Blueprint not found' };
      }

      if (blueprint.type === 'craft' && !blueprint.output?.itemId) {
        return { ok: false, error: 'Missing output' };
      }

      const targetSlot = options?.targetSlot;
      if (blueprint.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper')) {
        if (!targetSlot || (targetSlot !== 'weapon' && targetSlot !== 'accessory')) {
          return { ok: false, error: 'Select a target slot' };
        }
      } else if (blueprint.type === 'service') {
        return { ok: false, error: 'Unsupported service' };
      }

      const cityId = resolveActiveCityId();
      if (!cityId) {
        return { ok: false, error: 'Select a city first' };
      }

      const inventory = useInventoryStore.getState();
      const contentStore = useContentStore.getState();
      for (const entry of blueprint.costs.items) {
        if (!entry || !entry.itemId) continue;
        const required = Math.max(0, Math.floor(entry.qty)) * amount;
        if (required <= 0) continue;
        if (inventory.getQty(entry.itemId) < required) {
          const itemName = contentStore.maps.itemsById[entry.itemId]?.name ?? entry.itemId;
          return { ok: false, error: `Need ${required} ${itemName}` };
        }
      }

      const goldCost = Math.max(0, blueprint.costs.gold) * amount;
      const spiritStoneCost = Math.max(0, blueprint.costs.spiritStones) * amount;
      const costs: Partial<Record<CurrencyKey, string>> = {};
      if (goldCost > 0) costs.gold = goldCost.toString();
      if (spiritStoneCost > 0) costs.spiritStones = spiritStoneCost.toString();
      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const required = costs[key];
        if (!required) continue;
        if (!inventory.canAffordCurrency({ [key]: required })) {
          return { ok: false, error: `Not enough ${currencyLabels[key]}` };
        }
      }

      const removedItems: Array<{ itemId: string; qty: number }> = [];
      for (const entry of blueprint.costs.items) {
        const perJob = Math.max(0, Math.floor(entry.qty));
        if (!entry.itemId || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const removed = inventory.removeItem(entry.itemId, requiredQty);
        if (!removed) {
          removedItems.forEach((item) => {
            inventory.addItem(item.itemId, item.qty);
          });
          return { ok: false, error: `Missing ${entry.itemId}` };
        }
        removedItems.push({ itemId: entry.itemId, qty: requiredQty });
      }

      if (Object.keys(costs).length > 0) {
        const spent = inventory.spendCurrencies(costs);
        if (!spent) {
          removedItems.forEach((item) => {
            inventory.addItem(item.itemId, item.qty);
          });
          return { ok: false, error: 'Missing currency' };
        }
      }

      const durationMs = Math.max(0, blueprint.timeSec) * amount * 1000;
      const now = Date.now();
      const lastJob = get().forgeQueue.at(-1);
      const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
      const endsAt = startedAt + durationMs;

      set((state) => {
        state.forgeQueue.push({
          id: makeJobId(),
          blueprintId,
          qty: amount,
          startedAt,
          endsAt,
          targetSlot,
          cityId,
        });
      });

      GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'forge', sourceId: blueprintId, qty: amount } });

      return { ok: true };
    },

    tick: (now) => {
      const lastTickAt = get().lastTickAt;
      if (now === lastTickAt) return;
      if (now < lastTickAt) {
        set({ lastTickAt: now });
        return;
      }
      set({ lastTickAt: now });
    },

    applyOffline: (now) => {
      get().tick(now);
    },

    claimAlchemy: (jobId) => {
      const job = get().alchemyQueue.find((entry) => entry.id === jobId);
      if (!job) {
        return { ok: false, error: 'Job not found' };
      }

      const now = Date.now();
      if (now < job.endsAt) {
        return { ok: false, error: 'Job not ready' };
      }

      const recipe = useContentStore.getState().raw?.alchemy_recipes?.find((entry) => entry.id === job.recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const mastery = useRecipeMasteryStore.getState().getAlchemyMastery(job.recipeId);
      const items = buildAlchemyOutputs(recipe.outputs, job.qty, getIdleYieldMultiplierForMastery(mastery));

      if (items.length > 0) {
        RewardService.grantRewards({ items }, `Alchemy: ${job.recipeId}`);
      }

      useRecipeMasteryStore.getState().gainAlchemyMastery(job.recipeId, job.qty, 'idle');

      set((state) => {
        state.alchemyQueue = state.alchemyQueue.filter((entry) => entry.id !== jobId);
      });

      GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'alchemy', sourceId: job.recipeId, qty: job.qty } });

      const cityId =
        job.cityId ??
        useCityStore.getState().currentCityId ??
        useCityStore.getState().unlockedCityIds[0] ??
        'city_pinewind_hamlet';
      useBountyStore.getState().recordEvent({ type: 'CRAFT_COMPLETE', cityId, amount: 1 });

      // Manual test checklist:
      // - Queue an Alchemy job in City A, switch cities, and claim to ensure progress counts for City A.
      // - Start an expedition in City A, complete and claim to increment City A's bounty progress.
      // - Reload to confirm tracked bounty and job cityId persist.

      return { ok: true };
    },

    claimTalisman: (jobId) => {
      const job = get().talismanQueue.find((entry) => entry.id === jobId);
      if (!job) {
        return { ok: false, error: 'Job not found' };
      }

      const now = Date.now();
      if (now < job.endsAt) {
        return { ok: false, error: 'Job not ready' };
      }

      const recipe = useContentStore.getState().raw?.talisman_recipes?.find((entry) => entry.id === job.recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const outputs = recipe.outputs ?? {};
      const items = Object.entries(outputs)
        .map(([itemId, baseQty]) => {
          const perJob = Math.floor(baseQty);
          if (!Number.isFinite(perJob) || perJob <= 0) return null;
          return { itemId, qty: perJob * job.qty };
        })
        .filter((entry): entry is { itemId: string; qty: number } => Boolean(entry));

      if (items.length > 0) {
        RewardService.grantRewards({ items }, `Talisman: ${job.recipeId}`);
      }

      set((state) => {
        state.talismanQueue = state.talismanQueue.filter((entry) => entry.id !== jobId);
      });

      GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'talisman', sourceId: job.recipeId, qty: job.qty } });
      GameEvents.emit({ type: 'talisman/craft_result', payload: { ok: true } });

      const cityId =
        job.cityId ??
        useCityStore.getState().currentCityId ??
        useCityStore.getState().unlockedCityIds[0] ??
        'city_pinewind_hamlet';
      useBountyStore.getState().recordEvent({ type: 'CRAFT_COMPLETE', cityId, amount: 1 });

      return { ok: true };
    },

    claimForge: (jobId) => {
      const job = get().forgeQueue.find((entry) => entry.id === jobId);
      if (!job) {
        return { ok: false, error: 'Job not found' };
      }

      const now = Date.now();
      if (now < job.endsAt) {
        return { ok: false, error: 'Job not ready' };
      }

      const blueprint = getForgeBlueprint(job.blueprintId);
      if (!blueprint) {
        return { ok: false, error: 'Blueprint not found' };
      }

      let serviceResult: ReturnType<typeof applyRefineService> | ReturnType<typeof applyTemperService> | null = null;

      if (blueprint.type === 'craft') {
        const outputItem = blueprint.output?.itemId;
        const outputQty = blueprint.output?.qty ?? 1;
        if (outputItem) {
          RewardService.grantRewards(
            { items: [{ itemId: outputItem, qty: Math.max(1, Math.floor(outputQty)) * job.qty }] },
            `Forge: ${job.blueprintId}`,
          );
        }
      }

      if (blueprint.type === 'service' && job.targetSlot) {
        if (blueprint.service === 'refine') {
          serviceResult = applyRefineService({ blueprint, slot: job.targetSlot, qty: job.qty });
          if (!serviceResult.success) {
            GameEvents.emit({ type: 'forge/refine_result', payload: { ok: false } });
            return { ok: false, error: 'Refine failed' };
          }
        } else if (blueprint.service === 'temper') {
          const seed = Math.abs(hashSeed(job.id));
          serviceResult = applyTemperService({ blueprint, slot: job.targetSlot, qty: job.qty, seed });
        }
      }

      set((state) => {
        state.forgeQueue = state.forgeQueue.filter((entry) => entry.id !== jobId);
      });

      GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'forge', sourceId: job.blueprintId, qty: job.qty } });
      if (blueprint.type === 'craft') {
        GameEvents.emit({ type: 'forge/rune_craft_result', payload: { ok: true } });
      }
      if (serviceResult?.type === 'refine') {
        GameEvents.emit({ type: 'forge/refine_result', payload: { ok: Boolean(serviceResult.success) } });
      }
      if (serviceResult?.type === 'temper') {
        GameEvents.emit({ type: 'forge/temper_result', payload: { ok: Boolean(serviceResult.success) } });
      }

      const cityId =
        job.cityId ??
        useCityStore.getState().currentCityId ??
        useCityStore.getState().unlockedCityIds[0] ??
        'city_pinewind_hamlet';
      useBountyStore.getState().recordEvent({ type: 'CRAFT_COMPLETE', cityId, amount: 1 });

      return { ok: true, result: serviceResult ?? undefined };
    },

    getForgeJobs: () => get().forgeQueue,

    getForgeJobStatus: (job, now = Date.now()) => {
      const remainingMs = Math.max(0, job.endsAt - now);
      return {
        done: remainingMs === 0,
        remainingSec: Math.ceil(remainingMs / 1000),
      };
    },
  })),
);
