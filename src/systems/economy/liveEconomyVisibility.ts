import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { LiveEconomyContentSnapshot, LiveEconomyVisibilityDecision } from './liveEconomyTypes.js';

const DEFERRED_ITEM_PREFIXES = ['reagent_spirit_solvent_', 'cons_tribulation_buffer_', 'item_jade_core_'];
const DEFERRED_EXACT_ITEM_IDS = new Set(['mat_artifact_shard_bundle']);

function isDeferredItemId(itemId: string): boolean {
  return DEFERRED_EXACT_ITEM_IDS.has(itemId) || DEFERRED_ITEM_PREFIXES.some((prefix) => itemId.startsWith(prefix)) || itemId.startsWith('tal_');
}

function hasCanonicalForgeRuneForOutput(outputItemId: string, content: LiveEconomyContentSnapshot): boolean {
  return content.forge_blueprints.some((blueprint) => {
    const normalized = normalizeForgeBlueprint(blueprint);
    return normalized.id.startsWith('forge_rune_') && normalized.output?.itemId === outputItemId;
  });
}

export function getLiveEconomyItemVisibility(itemId: string): LiveEconomyVisibilityDecision {
  if (!itemId) return { status: 'unknown', reason: 'missing item id' };


  if (isDeferredItemId(itemId)) {
    return { status: 'migration_refund_only', reason: 'Deferred output remains authored for migration/refund cleanup.' };
  }

  return { status: 'visible_live', reason: 'Item is part of the semester live economy.' };
}

export function getLiveAlchemyRecipeVisibility(
  recipe: LiveEconomyContentSnapshot['alchemy_recipes'][number],
): LiveEconomyVisibilityDecision {
  const outputIds = Object.keys(recipe.outputs ?? {});
  if (outputIds.length === 0) {
    return { status: 'unknown', reason: 'Recipe has no outputs.' };
  }

  const hiddenOutput = outputIds.find((itemId) => getLiveEconomyItemVisibility(itemId).status !== 'visible_live');
  if (hiddenOutput) {
    return {
      status: 'hidden_deferred',
      reason: `Recipe outputs ${hiddenOutput}, which is deferred this semester.`,
    };
  }

  return { status: 'visible_live', reason: 'Recipe outputs a live semester consumable/reagent.' };
}

export function getLiveForgeBlueprintVisibility(
  blueprint: LiveEconomyContentSnapshot['forge_blueprints'][number],
  content: LiveEconomyContentSnapshot,
): LiveEconomyVisibilityDecision {
  const normalized = normalizeForgeBlueprint(blueprint);

  if (normalized.type === 'service') {
    if (normalized.service === 'refine' || normalized.service === 'temper') {
      return { status: 'visible_live', reason: 'Refine/temper services are live this semester.' };
    }
    return { status: 'hidden_deferred', reason: 'Non-refine/temper forge services are deferred this semester.' };
  }

  const outputItemId = normalized.output?.itemId ?? '';
  if (!outputItemId) {
    return { status: 'unknown', reason: 'Craft blueprint has no output item.' };
  }

  if (normalized.id.startsWith('rune_inscription_') && hasCanonicalForgeRuneForOutput(outputItemId, content)) {
    return {
      status: 'migration_refund_only',
      reason: 'Legacy rune inscription blueprint is quarantined because a canonical forge_rune_* blueprint exists.',
    };
  }

  const outputVisibility = getLiveEconomyItemVisibility(outputItemId);
  if (outputVisibility.status !== 'visible_live') {
    return {
      status: outputVisibility.status === 'visible_live_blocked' ? 'hidden_deferred' : outputVisibility.status,
      reason: `Blueprint outputs ${outputItemId}, which is not live-facing this semester.`,
    };
  }

  if (outputItemId.startsWith('rune_')) {
    return { status: 'visible_live', reason: 'Canonical forge rune blueprint is live this semester.' };
  }

  return { status: 'hidden_deferred', reason: 'Non-rune forge craft outputs are deferred this semester.' };
}
