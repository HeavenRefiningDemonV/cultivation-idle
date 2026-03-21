import type { MigrationFieldTouch, MigrationStep, PlannedMutation } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import type { LiveEconomyContentSnapshot } from '../../../../systems/economy/liveEconomyTypes.js';
import { getLiveAlchemyRecipeVisibility, getLiveEconomyItemVisibility, getLiveForgeBlueprintVisibility } from '../../../../systems/economy/liveEconomyVisibility.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

const addIntegerString = (current: unknown, delta: number): string => {
  const base = typeof current === 'string' && current.trim() ? current.trim() : '0';
  return (BigInt(base) + BigInt(Math.max(0, Math.floor(delta)))).toString();
};

type DeferredRecipeDef = {
  id: string;
  type: 'alchemy' | 'forge';
  inputs: Record<string, number>;
  cost?: { gold?: number; spiritStones?: number; merit?: number };
  outputs: Record<string, number>;
  unlocksAtCityId: string;
  station: 'alchemy' | 'forge';
  timeSec: number;
};

const AUTHORED_DEFERRED_RECIPES: DeferredRecipeDef[] = [
  {
    id: 'alc_reagent_spirit_solvent_t1',
    type: 'alchemy',
    station: 'alchemy',
    unlocksAtCityId: 'city_spirit_cavern_city',
    timeSec: 200,
    inputs: { mat_crystal_shard: 2, mat_aura_residue: 1 },
    outputs: { reagent_spirit_solvent_t1: 1 },
  },
  {
    id: 'alc_tribulation_buffer_t1',
    type: 'alchemy',
    station: 'alchemy',
    unlocksAtCityId: 'city_ironpeak_bastion',
    timeSec: 400,
    inputs: { mat_artifact_shard: 3, mat_soul_ember: 2 },
    outputs: { cons_tribulation_buffer_t1: 1 },
  },
  {
    id: 'forge_jade_core_shell_t1',
    type: 'forge',
    station: 'forge',
    unlocksAtCityId: 'city_spirit_cavern_city',
    timeSec: 600,
    inputs: { mat_artifact_shard: 25, mat_rune_dust: 30, reagent_spirit_solvent_t1: 1 },
    cost: { gold: 150000, spiritStones: 15 },
    outputs: { item_jade_core_shell_t1: 1 },
  },
];

const AUTHORED_DEFERRED_ITEM_REFUNDS: Array<{ itemId: string; refund: { items?: Record<string, number>; currencies?: { gold?: number; spiritStones?: number; merit?: number } } }> = [
  { itemId: 'mat_artifact_shard_bundle', refund: { items: { mat_artifact_shard: 3 } } },
];

function buildSyntheticEconomySnapshot(): LiveEconomyContentSnapshot {
  const itemIds = new Set<string>(AUTHORED_DEFERRED_ITEM_REFUNDS.map((entry) => entry.itemId));
  AUTHORED_DEFERRED_RECIPES.forEach((entry) => {
    Object.keys(entry.inputs ?? {}).forEach((itemId) => itemIds.add(itemId));
    Object.keys(entry.outputs ?? {}).forEach((itemId) => itemIds.add(itemId));
  });

  return {
    cities: [],
    items: [...itemIds].sort().map((id) => ({ id, name: id, category: id.split('_')[0] || 'other' })),
    alchemy_recipes: AUTHORED_DEFERRED_RECIPES.filter((entry) => entry.type === 'alchemy'),
    forge_blueprints: AUTHORED_DEFERRED_RECIPES.filter((entry) => entry.type === 'forge'),
    apothecary_shops: [],
    outskirts: [],
    ruins: [],
    expeditions: { durations: [], types: [], cityYields: [] },
    runes: [],
  };
}

function buildDeferredCleanupCatalog() {
  const content = buildSyntheticEconomySnapshot();
  const deferredOutputs = new Map<string, { sourceId: string; items?: Record<string, number>; currencies?: { gold?: number; spiritStones?: number; merit?: number } }>();
  const hiddenAlchemyIds = new Set<string>();
  const hiddenForgeIds = new Set<string>();

  content.alchemy_recipes.forEach((recipe) => {
    const visibility = getLiveAlchemyRecipeVisibility(recipe);
    if (visibility.status !== 'hidden_deferred') return;
    const outputId = Object.keys((recipe as DeferredRecipeDef).outputs ?? {}).find((itemId) => getLiveEconomyItemVisibility(itemId).status === 'migration_refund_only');
    if (!outputId) return;
    hiddenAlchemyIds.add(recipe.id);
    deferredOutputs.set(outputId, { sourceId: recipe.id, items: (recipe as DeferredRecipeDef).inputs });
  });

  content.forge_blueprints.forEach((blueprint) => {
    const visibility = getLiveForgeBlueprintVisibility(blueprint, content);
    if (visibility.status !== 'migration_refund_only' && visibility.status !== 'hidden_deferred') return;
    const outputId = (blueprint as DeferredRecipeDef).outputs ? Object.keys((blueprint as DeferredRecipeDef).outputs ?? {})[0] : undefined;
    if (!outputId || getLiveEconomyItemVisibility(outputId).status !== 'migration_refund_only') return;
    hiddenForgeIds.add(blueprint.id);
    deferredOutputs.set(outputId, {
      sourceId: blueprint.id,
      items: (blueprint as DeferredRecipeDef).inputs,
      currencies: (blueprint as DeferredRecipeDef).cost,
    });
  });

  AUTHORED_DEFERRED_ITEM_REFUNDS.forEach((entry) => {
    if (getLiveEconomyItemVisibility(entry.itemId).status === 'migration_refund_only') {
      deferredOutputs.set(entry.itemId, { sourceId: entry.itemId, items: entry.refund.items, currencies: entry.refund.currencies });
    }
  });

  return { deferredOutputs, hiddenAlchemyIds, hiddenForgeIds };
}

const DEFERRED_CLEANUP_CATALOG = buildDeferredCleanupCatalog();

export const v2_0_0_plan_deferred_crafting_output_cleanup: MigrationStep = {
  id: 'v2_0_0_plan_deferred_crafting_output_cleanup',
  title: 'Refund hidden crafted outputs and queued ghost jobs',
  description: 'Use live-economy visibility to refund migration-only crafted outputs, clear queued hidden jobs, and reset incompatible active craft sessions.',
  kind: 'transform',
  ownerPacket: '3.1',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 95,
  appliesTo: (save) => isRecord(save.inventoryState) || isRecord(save.professionState) || isRecord(save.craftSessionState),
  run: (save) => {
    const next = cloneSave(save);
    const inventoryState = isRecord(next.inventoryState) ? next.inventoryState : {};
    const items = isRecord(inventoryState.items) ? (inventoryState.items as Record<string, unknown>) : {};
    const currencies = isRecord(inventoryState.currencies) ? (inventoryState.currencies as Record<string, unknown>) : {};
    const professionState = isRecord(next.professionState) ? next.professionState : {};
    const craftSessionState = isRecord(next.craftSessionState) ? next.craftSessionState : {};
    const warnings = [];
    const touched: MigrationFieldTouch[] = [];
    const plannedMutations: PlannedMutation[] = [];
    const refundedOutputIds: string[] = [];
    let didMutate = false;

    const grantRefund = (sourceLabel: string, qtyMultiplier: number, refund?: { items?: Record<string, number>; currencies?: { gold?: number; spiritStones?: number; merit?: number } }) => {
      Object.entries(refund?.items ?? {}).forEach(([itemId, qty]) => {
        const current = typeof items[itemId] === 'number' ? items[itemId] as number : 0;
        items[itemId] = current + qty * qtyMultiplier;
        touched.push(touch(`inventoryState.items.${itemId}`, 'set', `Refunded ${qty * qtyMultiplier} from ${sourceLabel}.`));
      });
      Object.entries(refund?.currencies ?? {}).forEach(([currencyId, qty]) => {
        if (!isInteger(qty)) return;
        currencies[currencyId] = addIntegerString(currencies[currencyId], qty * qtyMultiplier);
        touched.push(touch(`inventoryState.currencies.${currencyId}`, 'set', `Refunded ${qty * qtyMultiplier} from ${sourceLabel}.`));
      });
    };

    const cleanupDeferredInventoryOutputs = () => {
      let passMutated = false;
      Object.entries({ ...items }).forEach(([itemId, rawQty]) => {
        const qty = typeof rawQty === 'number' ? rawQty : 0;
        const refund = DEFERRED_CLEANUP_CATALOG.deferredOutputs.get(itemId);
        if (qty <= 0 || !refund || getLiveEconomyItemVisibility(itemId).status !== 'migration_refund_only') return;
        grantRefund(itemId, qty, refund);
        delete items[itemId];
        refundedOutputIds.push(itemId);
        touched.push(touch(`inventoryState.items.${itemId}`, 'delete', `Removed hidden crafted output ${itemId} x${qty}.`));
        plannedMutations.push(plan(`inventoryState.items.${itemId}`, '3.1', `Refund and remove hidden crafted output ${itemId}.`, 'delete'));
        didMutate = true;
        passMutated = true;
      });
      return passMutated;
    };

    while (cleanupDeferredInventoryOutputs()) {
      // keep sweeping until no refunded hidden output reappears through nested refunds
    }

    const pruneJobs = <T extends { recipeId?: string; blueprintId?: string; qty?: number }>(jobs: unknown, kind: 'alchemy' | 'forge') => {
      if (!Array.isArray(jobs)) return [] as T[];
      return jobs.filter((job) => {
        if (!isRecord(job)) return true;
        const sourceId = kind === 'alchemy' ? job.recipeId : job.blueprintId;
        if (typeof sourceId !== 'string') return true;
        const hidden = kind === 'alchemy' ? DEFERRED_CLEANUP_CATALOG.hiddenAlchemyIds.has(sourceId) : DEFERRED_CLEANUP_CATALOG.hiddenForgeIds.has(sourceId);
        if (!hidden) return true;
        const refund = [...DEFERRED_CLEANUP_CATALOG.deferredOutputs.values()].find((entry) => entry.sourceId === sourceId);
        grantRefund(`${kind}:${sourceId}`, Math.max(1, Math.floor(Number(job.qty ?? 1))), refund);
        touched.push(touch(`professionState.${kind}Queue`, 'set', `Removed hidden ${kind} job ${sourceId}.`));
        plannedMutations.push(plan(`professionState.${kind}Queue`, '3.1', `Remove hidden queued ${kind} job ${sourceId} and refund inputs.`));
        didMutate = true;
        return false;
      }) as T[];
    };

    professionState.alchemyQueue = pruneJobs(professionState.alchemyQueue, 'alchemy');
    professionState.forgeQueue = pruneJobs(professionState.forgeQueue, 'forge');
    while (cleanupDeferredInventoryOutputs()) {
      // queued job refunds can also produce hidden outputs that must be recursively cleaned
    }

    const activeSession = isRecord(craftSessionState.activeSession) ? craftSessionState.activeSession : null;
    if (activeSession) {
      const station = activeSession.station;
      const sourceId = typeof activeSession.sourceId === 'string' ? activeSession.sourceId : '';
      const hidden = (station === 'alchemy' && DEFERRED_CLEANUP_CATALOG.hiddenAlchemyIds.has(sourceId))
        || (station === 'forge' && DEFERRED_CLEANUP_CATALOG.hiddenForgeIds.has(sourceId));
      if (hidden) {
        const refund = [...DEFERRED_CLEANUP_CATALOG.deferredOutputs.values()].find((entry) => entry.sourceId === sourceId);
        grantRefund(`craftSession:${sourceId}`, Math.max(1, Math.floor(Number(activeSession.qty ?? 1))), refund);
        craftSessionState.activeSession = null;
        touched.push(touch('craftSessionState.activeSession', 'set', `Cleared hidden active craft session ${sourceId}.`));
        plannedMutations.push(plan('craftSessionState.activeSession', '3.1', `Clear hidden active craft session ${sourceId} and refund its payment.`));
        didMutate = true;
      }
    }

    while (cleanupDeferredInventoryOutputs()) {
      // active-session refunds can also reintroduce hidden crafted outputs
    }

    next.inventoryState = { ...inventoryState, items, currencies };
    next.professionState = professionState;
    next.craftSessionState = craftSessionState;

    if (didMutate) {
      warnings.push(
        warning('DEFERRED_CRAFTING_OUTPUTS_DETECTED', `Hidden crafted outputs or jobs were refunded/cleared: ${refundedOutputIds.join(', ') || 'queued_jobs_only'}.`, '3.1', 'warning', 'inventoryState.items'),
      );
    }

    return createStepResult(
      v2_0_0_plan_deferred_crafting_output_cleanup,
      next,
      didMutate ? 'Deferred crafting outputs/jobs were refunded and cleaned up.' : 'No deferred crafting outputs/jobs detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations, didMutate },
    );
  },
};
