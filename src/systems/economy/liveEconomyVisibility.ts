import type { ValidatedContent } from '../../content/validators.js';
import { getKnownLiveEconomyBlocker } from './knownLiveEconomyBlockers.js';
import type { AlchemyRecipeDef, ForgeBlueprintDef, ItemDefLike, LiveEconomyFamily, LiveEconomyRuntimeStatus } from './liveEconomyTypes.js';
import { getLiveForgeFamily, getLiveForgeRuntimeStatus } from '../forge/index.js';

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

export function getForgeBlueprintRuntimeStatus(
  blueprint: ForgeBlueprintDef,
  _content: Pick<ValidatedContent, 'forge_blueprints'>,
): LiveEconomyRuntimeStatus {
  const blocker = getKnownLiveEconomyBlocker(blueprint.id);
  if (blocker && blocker.entityKind === 'forge_blueprint') return blocker.status;

  const status = getLiveForgeRuntimeStatus(blueprint);
  return status === 'unknown_invalid' ? 'unknown' : status;
}
