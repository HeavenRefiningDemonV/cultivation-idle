import type { CultivationPath } from '../types';

/**
 * Path Perk represents a special ability or bonus unlocked for a specific cultivation path
 */
export interface PathPerk {
  id: string;
  name: string;
  description: string;
  effect: {
    stat: string;
    value: number;
  };
  requiredRealm: number;
  path: CultivationPath;
}

/**
 * All available path perks organized by path and realm
 */
export const PATH_PERKS: PathPerk[] = [
  // ===== HEAVEN PATH PERKS =====
  // Foundation Realm (1)
  {
    id: 'heaven_realm1_a',
    name: 'Qi Resonance',
    description: '+15% idle Qi generation',
    effect: {
      stat: 'qiMultiplier',
      value: 0.15,
    },
    requiredRealm: 1,
    path: 'heaven',
  },
  {
    id: 'heaven_realm1_b',
    name: 'Spirit Strike',
    description: '+10% attack damage',
    effect: {
      stat: 'atkMultiplier',
      value: 0.1,
    },
    requiredRealm: 1,
    path: 'heaven',
  },
  {
    id: 'heaven_realm1_c',
    name: 'Ethereal Presence',
    description: '+8% dodge chance',
    effect: {
      stat: 'dodge',
      value: 8,
    },
    requiredRealm: 1,
    path: 'heaven',
  },

  // Core Formation (2)
  {
    id: 'heaven_realm2_a',
    name: 'Heavenly Insight',
    description: '+20% idle Qi generation',
    effect: {
      stat: 'qiMultiplier',
      value: 0.2,
    },
    requiredRealm: 2,
    path: 'heaven',
  },
  {
    id: 'heaven_realm2_b',
    name: 'Critical Mastery',
    description: '+15% critical hit chance',
    effect: {
      stat: 'crit',
      value: 15,
    },
    requiredRealm: 2,
    path: 'heaven',
  },
  {
    id: 'heaven_realm2_c',
    name: 'Spirit Burst',
    description: '+25% critical damage',
    effect: {
      stat: 'critDmg',
      value: 25,
    },
    requiredRealm: 2,
    path: 'heaven',
  },

  // Golden Core (3)
  {
    id: 'heaven_realm3_a',
    name: 'Celestial Harmony',
    description: '+30% idle Qi generation',
    effect: {
      stat: 'qiMultiplier',
      value: 0.3,
    },
    requiredRealm: 3,
    path: 'heaven',
  },
  {
    id: 'heaven_realm3_b',
    name: 'Heaven\'s Wrath',
    description: '+20% attack damage',
    effect: {
      stat: 'atkMultiplier',
      value: 0.2,
    },
    requiredRealm: 3,
    path: 'heaven',
  },
  {
    id: 'heaven_realm3_c',
    name: 'Divine Protection',
    description: '+15% HP (compensates glass cannon)',
    effect: {
      stat: 'hpMultiplier',
      value: 0.15,
    },
    requiredRealm: 3,
    path: 'heaven',
  },

  // ===== EARTH PATH PERKS =====
  // Foundation Realm (1)
  {
    id: 'earth_realm1_a',
    name: 'Stone Skin',
    description: '+12% defense',
    effect: {
      stat: 'defMultiplier',
      value: 0.12,
    },
    requiredRealm: 1,
    path: 'earth',
  },
  {
    id: 'earth_realm1_b',
    name: 'Mountain\'s Endurance',
    description: '+15% maximum HP',
    effect: {
      stat: 'hpMultiplier',
      value: 0.15,
    },
    requiredRealm: 1,
    path: 'earth',
  },
  {
    id: 'earth_realm1_c',
    name: 'Steady Cultivation',
    description: '+10% HP regeneration',
    effect: {
      stat: 'regenMultiplier',
      value: 0.1,
    },
    requiredRealm: 1,
    path: 'earth',
  },

  // Core Formation (2)
  {
    id: 'earth_realm2_a',
    name: 'Diamond Body',
    description: '+20% defense',
    effect: {
      stat: 'defMultiplier',
      value: 0.2,
    },
    requiredRealm: 2,
    path: 'earth',
  },
  {
    id: 'earth_realm2_b',
    name: 'Unyielding Will',
    description: '+25% maximum HP',
    effect: {
      stat: 'hpMultiplier',
      value: 0.25,
    },
    requiredRealm: 2,
    path: 'earth',
  },
  {
    id: 'earth_realm2_c',
    name: 'Earthen Strike',
    description: '+12% attack damage (compensates penalty)',
    effect: {
      stat: 'atkMultiplier',
      value: 0.12,
    },
    requiredRealm: 2,
    path: 'earth',
  },

  // Golden Core (3)
  {
    id: 'earth_realm3_a',
    name: 'Fortress of the Ancients',
    description: '+30% defense',
    effect: {
      stat: 'defMultiplier',
      value: 0.3,
    },
    requiredRealm: 3,
    path: 'earth',
  },
  {
    id: 'earth_realm3_b',
    name: 'Titan\'s Vigor',
    description: '+35% maximum HP',
    effect: {
      stat: 'hpMultiplier',
      value: 0.35,
    },
    requiredRealm: 3,
    path: 'earth',
  },
  {
    id: 'earth_realm3_c',
    name: 'Grounded Energy',
    description: '+15% idle Qi generation',
    effect: {
      stat: 'qiMultiplier',
      value: 0.15,
    },
    requiredRealm: 3,
    path: 'earth',
  },

  // ===== MARTIAL PATH PERKS =====
  // Foundation Realm (1)
  {
    id: 'martial_realm1_a',
    name: 'Blade Mastery',
    description: '+12% attack damage',
    effect: {
      stat: 'atkMultiplier',
      value: 0.12,
    },
    requiredRealm: 1,
    path: 'martial',
  },
  {
    id: 'martial_realm1_b',
    name: 'Battle Hardened',
    description: '+10% maximum HP',
    effect: {
      stat: 'hpMultiplier',
      value: 0.1,
    },
    requiredRealm: 1,
    path: 'martial',
  },
  {
    id: 'martial_realm1_c',
    name: 'Swift Strikes',
    description: '+8% critical hit chance',
    effect: {
      stat: 'crit',
      value: 8,
    },
    requiredRealm: 1,
    path: 'martial',
  },

  // Core Formation (2)
  {
    id: 'martial_realm2_a',
    name: 'Deadly Precision',
    description: '+20% attack damage',
    effect: {
      stat: 'atkMultiplier',
      value: 0.2,
    },
    requiredRealm: 2,
    path: 'martial',
  },
  {
    id: 'martial_realm2_b',
    name: 'Devastating Blow',
    description: '+30% critical damage',
    effect: {
      stat: 'critDmg',
      value: 30,
    },
    requiredRealm: 2,
    path: 'martial',
  },
  {
    id: 'martial_realm2_c',
    name: 'Warrior\'s Focus',
    description: '+15% idle Qi generation',
    effect: {
      stat: 'qiMultiplier',
      value: 0.15,
    },
    requiredRealm: 2,
    path: 'martial',
  },

  // Golden Core (3)
  {
    id: 'martial_realm3_a',
    name: 'Legendary Warrior',
    description: '+30% attack damage',
    effect: {
      stat: 'atkMultiplier',
      value: 0.3,
    },
    requiredRealm: 3,
    path: 'martial',
  },
  {
    id: 'martial_realm3_b',
    name: 'Berserker\'s Rage',
    description: '+20% critical hit chance',
    effect: {
      stat: 'crit',
      value: 20,
    },
    requiredRealm: 3,
    path: 'martial',
  },
  {
    id: 'martial_realm3_c',
    name: 'Iron Constitution',
    description: '+20% maximum HP and +10% defense',
    effect: {
      stat: 'hpMultiplier',
      value: 0.2,
    },
    requiredRealm: 3,
    path: 'martial',
  },
];

/**
 * Get available perks for a specific path and realm
 */
export function getAvailablePerks(
  path: CultivationPath | null,
  realmIndex: number
): PathPerk[] {
  if (!path) return [];

  return PATH_PERKS.filter(
    (perk) => perk.path === path && perk.requiredRealm === realmIndex
  );
}

/**
 * Get a perk by its ID
 */
export function getPerkById(perkId: string): PathPerk | undefined {
  return PATH_PERKS.find((perk) => perk.id === perkId);
}
