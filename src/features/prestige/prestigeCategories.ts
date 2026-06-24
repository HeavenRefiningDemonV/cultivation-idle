import type { PrestigeUpgradeDef } from '../../content/index.js';

export type PrestigeCategoryKey =
  | 'laws'
  | 'combat'
  | 'techniques'
  | 'crafting'
  | 'automation'
  | 'unlocks'
  | 'misc';

export interface PrestigeCategoryDef {
  key: PrestigeCategoryKey;
  title: string;
  subtitle: string;
  iconLabel: string;
  order: number;
}

export const PRESTIGE_CATEGORIES: PrestigeCategoryDef[] = [
  {
    key: 'laws',
    title: 'Heavenly Laws',
    subtitle: 'Idle Qi, offline insight, and heart law access.',
    iconLabel: 'Heavenly Laws',
    order: 1,
  },
  {
    key: 'combat',
    title: 'Martial Ascension',
    subtitle: 'Battle-focused power with live combat impact.',
    iconLabel: 'Combat',
    order: 2,
  },
  {
    key: 'techniques',
    title: 'Secret Techniques',
    subtitle: 'Expand live technique capacity for future runs.',
    iconLabel: 'Techniques',
    order: 3,
  },
  {
    key: 'crafting',
    title: 'Celestial Crafting',
    subtitle: 'Expand queues and accelerate artisan production.',
    iconLabel: 'Crafting',
    order: 4,
  },
  {
    key: 'automation',
    title: 'Endless Routines',
    subtitle: 'Automate upkeep and loot management.',
    iconLabel: 'Automation',
    order: 5,
  },
  {
    key: 'unlocks',
    title: 'Worldly Unlocks',
    subtitle: 'Open new systems, halls, and expeditions.',
    iconLabel: 'Unlocks',
    order: 6,
  },
  {
    key: 'misc',
    title: 'Other Decrees',
    subtitle: 'Unsorted blessings awaiting classification.',
    iconLabel: 'Miscellaneous',
    order: 7,
  },
];

const EXPLICIT_CATEGORY_MAP: Record<string, PrestigeCategoryKey> = {
  ap_idle_qi_mult: 'laws',
  ap_offline_efficiency: 'laws',
  ap_unlock_heartlaw_t1: 'laws',
  ap_unlock_heartlaw_t2: 'laws',
  ap_unlock_heartlaw_t3: 'laws',
  ap_extra_heartlaw_choice: 'laws',
  // MP5 prestige-memory nodes — their content definitions declare category "laws"; listed here too so
  // id-only callers (which can't pass the content category) still classify them correctly.
  form_memory: 'laws',
  scripture_echo: 'laws',
  root_clarity: 'laws',
  calm_first_breath: 'laws',
  old_sparring_shadows: 'laws',
  ap_combat_mult: 'combat',
  ap_auto_retry_bosses: 'combat',
  ap_extra_technique_slot_1: 'techniques',
  ap_extra_technique_slot_2: 'techniques',
  ap_fragment_gain_boost: 'techniques',
  ap_mastery_retention_10: 'techniques',
  ap_mastery_retention_25: 'techniques',
  ap_mastery_retention_50: 'techniques',
  ap_unlock_alchemy_queue: 'crafting',
  ap_unlock_forge_queue: 'crafting',
  ap_unlock_talisman_queue: 'crafting',
  ap_craft_speed_boost: 'crafting',
  ap_autosell_filter: 'automation',
  ap_autobuy_consumables: 'automation',
  ap_loot_filter: 'automation',
  ap_unlock_meridian_hall: 'unlocks',
  ap_unlock_spirit_garden: 'unlocks',
  ap_unlock_jade_core: 'unlocks',
  ap_unlock_pagoda: 'unlocks',
  ap_pagoda_sweep: 'unlocks',
  ap_pavilion_refresh_discount: 'unlocks',
};

const matchesPattern = (upgradeId: string, patterns: string[]) =>
  patterns.some((pattern) => upgradeId.includes(pattern));

const PRESTIGE_CATEGORY_KEY_SET = new Set<string>(PRESTIGE_CATEGORIES.map((category) => category.key));

const isPrestigeCategoryKey = (value: string): value is PrestigeCategoryKey =>
  PRESTIGE_CATEGORY_KEY_SET.has(value);

/**
 * Route a prestige upgrade to a UI category. Prefers the content node's own `category` field when it names a
 * known category (so content authoring is the source of truth); otherwise falls back to the explicit id map
 * and then the id-keyword heuristic. Callers that have the upgrade def should pass `contentCategory`.
 */
export function getPrestigeCategoryKey(upgradeId: string, contentCategory?: string | null): PrestigeCategoryKey {
  if (contentCategory && isPrestigeCategoryKey(contentCategory)) {
    return contentCategory;
  }

  if (EXPLICIT_CATEGORY_MAP[upgradeId]) {
    return EXPLICIT_CATEGORY_MAP[upgradeId];
  }

  if (matchesPattern(upgradeId, ['heartlaw', 'idle_qi', 'offline'])) {
    return 'laws';
  }

  if (matchesPattern(upgradeId, ['combat', 'boss'])) {
    return 'combat';
  }

  if (matchesPattern(upgradeId, ['technique', 'fragment', 'mastery'])) {
    return 'techniques';
  }

  if (matchesPattern(upgradeId, ['alchemy', 'forge', 'talisman', 'craft'])) {
    return 'crafting';
  }

  if (matchesPattern(upgradeId, ['auto', 'loot_filter'])) {
    return 'automation';
  }

  if (matchesPattern(upgradeId, ['unlock', 'pagoda', 'pavilion'])) {
    return 'unlocks';
  }

  return 'misc';
}

export const buildPrestigeCategorySections = (upgrades: PrestigeUpgradeDef[]) => {
  const buckets = new Map<PrestigeCategoryKey, PrestigeUpgradeDef[]>();
  upgrades.forEach((upgrade) => {
    const key = getPrestigeCategoryKey(upgrade.id, upgrade.category);
    const list = buckets.get(key) ?? [];
    list.push(upgrade);
    buckets.set(key, list);
  });

  return PRESTIGE_CATEGORIES
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      category,
      upgrades: buckets.get(category.key) ?? [],
    }))
    .filter((section) => section.upgrades.length > 0);
};
