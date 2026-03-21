import { useContentStore } from '../../stores/contentStore.js';
import { getLiveEconomyItemVisibility } from '../economy/liveEconomyVisibility.js';
import type { CultivationConsumableFamily } from './cultivationConsumableTypes.js';
import type { ConsumableUsage } from './consumableCatalog.js';

export type LiveConsumableDomain = 'combat' | 'cultivation';
export type LiveConsumableSourceKind = 'apothecary_shop' | 'alchemy_recipe';

type CanonicalConsumableConfig = {
  itemId: string;
  usage: ConsumableUsage;
  domain: LiveConsumableDomain;
  family?: CultivationConsumableFamily;
};

export interface LiveConsumableRosterEntry extends CanonicalConsumableConfig {
  visibility: ReturnType<typeof getLiveEconomyItemVisibility>;
  isLive: boolean;
  sourceKinds: LiveConsumableSourceKind[];
}

const CANONICAL_CONSUMABLES: readonly CanonicalConsumableConfig[] = [
  { itemId: 'cons_healing_pellet_t1', usage: 'combat_or_world', domain: 'combat' },
  { itemId: 'cons_ironblood_pellet_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_ironblood_pellet_t2', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_windstep_powder_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_windstep_powder_t2', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_ward_salt_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_ward_salt_t2', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_anti_venom_pellet_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_focus_tonic_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_mastery_tonic_t1', usage: 'combat_only', domain: 'combat' },
  { itemId: 'cons_qi_elixir_t1', usage: 'cultivate_only', domain: 'cultivation', family: 'circulation' },
  { itemId: 'cons_qi_elixir_t2', usage: 'cultivate_only', domain: 'cultivation', family: 'circulation' },
  { itemId: 'cons_meridian_warmth_draft_t1', usage: 'cultivate_only', domain: 'cultivation', family: 'warmth' },
  { itemId: 'cons_quiet_breath_tea_t1', usage: 'cultivate_only', domain: 'cultivation', family: 'doctrine' },
  { itemId: 'cons_purity_elixir_t1', usage: 'cultivate_only', domain: 'cultivation', family: 'breakthrough' },
  { itemId: 'cons_tribulation_buffer_t1', usage: 'cultivate_only', domain: 'cultivation', family: 'breakthrough' },
] as const;

const CANONICAL_CONSUMABLE_MAP = new Map(CANONICAL_CONSUMABLES.map((entry) => [entry.itemId, entry]));

function getRuntimeContent() {
  return useContentStore.getState().raw;
}

function collectSourceKinds(itemId: string): LiveConsumableSourceKind[] {
  const content = getRuntimeContent();
  if (!content) return [];

  const sourceKinds: LiveConsumableSourceKind[] = [];
  const inShops = (content.apothecary_shops ?? []).some((shop) =>
    (shop.stock ?? []).some((entry) => entry.itemId === itemId),
  );
  if (inShops) {
    sourceKinds.push('apothecary_shop');
  }

  const inAlchemy = (content.alchemy_recipes ?? []).some((recipe) => Object.keys(recipe.outputs ?? {}).includes(itemId));
  if (inAlchemy) {
    sourceKinds.push('alchemy_recipe');
  }

  return sourceKinds;
}

export function getCanonicalConsumableConfig(itemId: string): CanonicalConsumableConfig | null {
  return CANONICAL_CONSUMABLE_MAP.get(itemId) ?? null;
}

export function getLiveConsumableRosterEntry(itemId: string): LiveConsumableRosterEntry | null {
  const config = getCanonicalConsumableConfig(itemId);
  if (!config) return null;
  const visibility = getLiveEconomyItemVisibility(itemId);
  return {
    ...config,
    visibility,
    isLive: visibility.status === 'visible_live' || visibility.status === 'visible_live_blocked',
    sourceKinds: collectSourceKinds(itemId),
  };
}

export function listConsumableRosterEntries(): LiveConsumableRosterEntry[] {
  return CANONICAL_CONSUMABLES.map((entry) => getLiveConsumableRosterEntry(entry.itemId)).filter(
    (entry): entry is LiveConsumableRosterEntry => Boolean(entry),
  );
}

export function listLiveConsumableRosterEntries(): LiveConsumableRosterEntry[] {
  return listConsumableRosterEntries().filter((entry) => entry.isLive);
}

export function isLiveConsumableItem(itemId: string): boolean {
  return getLiveConsumableRosterEntry(itemId)?.isLive ?? false;
}

export function isLiveCultivationConsumable(itemId: string): boolean {
  const entry = getLiveConsumableRosterEntry(itemId);
  return entry?.isLive === true && entry.domain === 'cultivation';
}

export function isLiveCombatConsumable(itemId: string): boolean {
  const entry = getLiveConsumableRosterEntry(itemId);
  return entry?.isLive === true && entry.domain === 'combat';
}

