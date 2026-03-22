import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { ValidatedContent } from '../../content/validators.js';
import { getKnownLiveEconomyBlocker } from './knownLiveEconomyBlockers.js';
import type { AlchemyRecipeDef, ForgeBlueprintDef, ItemDefLike, LiveEconomyFamily, LiveEconomyRuntimeStatus } from './liveEconomyTypes.js';

const DEFERRED_ITEM_PREFIXES = ['tal_'];
const DEFERRED_ITEM_IDS = new Set<string>([
  'cons_tribulation_buffer_t1',
  'item_jade_core_shell_t1',
  'reagent_spirit_solvent_t1',
  'reagent_spirit_solvent_t2',
  'reagent_soul_ink_t1',
]);

function hasDeferredPrefix(itemId: string): boolean {
  return DEFERRED_ITEM_PREFIXES.some((prefix) => itemId.startsWith(prefix));
}

export function getLiveEconomyItemFamily(item: Pick<ItemDefLike, 'id' | 'category'>): LiveEconomyFamily {
  if (item.category === 'currency') return 'currency';
  if (item.category === 'material') return 'material';
  if (item.category === 'reagent') return 'reagent';
  if (item.category === 'consumable') return 'consumable';
  if (item.category === 'rune') return 'rune';
  return 'other';
}

export function getItemRuntimeStatus(item: Pick<ItemDefLike, 'id' | 'category'>): LiveEconomyRuntimeStatus {
  const blocker = getKnownLiveEconomyBlocker(item.id);
  if (blocker && blocker.entityKind === 'item') return blocker.status;
  if (DEFERRED_ITEM_IDS.has(item.id) || hasDeferredPrefix(item.id) || item.id.includes('jade_core')) {
    return 'migration_refund_only';
  }
  return 'visible_live';
}

function getAlchemyRecipeOutputIds(recipe: Pick<AlchemyRecipeDef, 'outputs'>): string[] {
  return Object.keys(recipe.outputs ?? {});
}

export function getAlchemyRecipeRuntimeStatus(recipe: AlchemyRecipeDef): LiveEconomyRuntimeStatus {
  const outputs = getAlchemyRecipeOutputIds(recipe);
  if (outputs.length === 0) return 'unknown';
  if (outputs.some((itemId) => DEFERRED_ITEM_IDS.has(itemId) || itemId.startsWith('tal_') || itemId.includes('jade_core'))) {
    return 'hidden_deferred';
  }
  return 'visible_live';
}

function hasCanonicalRuneBlueprint(content: Pick<ValidatedContent, 'forge_blueprints'>, runeOutputId: string): boolean {
  return content.forge_blueprints.some((candidate) => {
    if (!candidate.id.startsWith('forge_rune_')) return false;
    return Object.keys(candidate.outputs ?? {}).includes(runeOutputId);
  });
}

export function getForgeBlueprintFamily(
  blueprint: ForgeBlueprintDef,
  content?: Pick<ValidatedContent, 'forge_blueprints'>,
): LiveEconomyFamily {
  const normalized = normalizeForgeBlueprint(blueprint);
  if (normalized.type === 'service' && normalized.service === 'refine') return 'forge_refine';
  if (normalized.type === 'service' && normalized.service === 'temper') return 'forge_temper';
  if (blueprint.id.startsWith('forge_rune_')) return 'forge_rune';
  if (blueprint.id.startsWith('rune_inscription_')) return 'forge_legacy_rune';
  const outputs = Object.keys(blueprint.outputs ?? {});
  if (outputs.some((itemId) => itemId.startsWith('tal_'))) return 'forge_talisman';
  if (blueprint.id.includes('jade_core') || outputs.some((itemId) => itemId.includes('jade_core'))) return 'forge_jade_core';
  if (content && outputs.some((itemId) => hasCanonicalRuneBlueprint(content, itemId))) return 'forge_legacy_rune';
  return 'other';
}

export function getForgeBlueprintRuntimeStatus(
  blueprint: ForgeBlueprintDef,
  content: Pick<ValidatedContent, 'forge_blueprints'>,
): LiveEconomyRuntimeStatus {
  const blocker = getKnownLiveEconomyBlocker(blueprint.id);
  if (blocker && blocker.entityKind === 'forge_blueprint') return blocker.status;

  const family = getForgeBlueprintFamily(blueprint, content);
  if (family === 'forge_refine' || family === 'forge_temper' || family === 'forge_rune') {
    return 'visible_live';
  }
  if (family === 'forge_legacy_rune') {
    return 'migration_refund_only';
  }
  if (family === 'forge_talisman' || family === 'forge_jade_core') {
    return 'hidden_deferred';
  }
  return 'hidden_deferred';
}
