export type RewardActivity = 'zone' | 'zoneBoss' | 'dungeon';

export interface RewardProfile {
  renewableValue: string;
  supportItems: string[];
  gearAnchors: string[];
}

export const CURRENT_BRANCH_ACTIVITY_ROLES: Record<RewardActivity, string> = {
  zone: 'Renewable farming loop for raw gold + sellable materials.',
  zoneBoss: 'Low-frequency spike rewards and anchor materials.',
  dungeon: 'Milestone progression rewards with first-clear breakthroughs.',
};

export const CURRENT_BRANCH_ZONE_REWARD_TARGETS: Record<string, RewardProfile> = {
  training_forest: {
    renewableValue: '10-40 gold / kill + common sellables',
    supportItems: ['health_pill', 'spirit_stone'],
    gearAnchors: ['wolf_fang', 'spirit_essence'],
  },
  spirit_cavern: {
    renewableValue: '40-90 gold / kill + uncommon sellables',
    supportItems: ['greater_health_pill', 'spirit_stone'],
    gearAnchors: ['venom_sac', 'stone_core', 'spirit_essence'],
  },
  mystic_mountains: {
    renewableValue: '100-220 gold / kill + rare sellables',
    supportItems: ['supreme_health_pill', 'qi_crystal'],
    gearAnchors: ['beast_core', 'frost_scale', 'celestial_jade'],
  },
};

export const CURRENT_BRANCH_DUNGEON_REWARD_TARGETS: Record<string, {
  firstClearGold: [number, number];
  repeatGold: [number, number];
  milestoneDrop: string;
}> = {
  novice_clearing: {
    firstClearGold: [4000, 7000],
    repeatGold: [800, 1400],
    milestoneDrop: 'foundation_pill',
  },
  stone_core_sanctum: {
    firstClearGold: [16000, 26000],
    repeatGold: [3000, 5000],
    milestoneDrop: 'core_catalyst',
  },
  nascent_soul_chamber: {
    firstClearGold: [42000, 60000],
    repeatGold: [7000, 11000],
    milestoneDrop: 'core_stabilizer',
  },
};

export function getCurrentBranchRewardProfile(zoneId: string): RewardProfile | null {
  return CURRENT_BRANCH_ZONE_REWARD_TARGETS[zoneId] ?? null;
}
