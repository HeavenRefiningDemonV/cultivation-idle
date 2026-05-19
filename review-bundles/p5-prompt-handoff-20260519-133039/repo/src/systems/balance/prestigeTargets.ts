export type PrestigeCheckpointId =
  | 'foundation_entry'
  | 'core_entry'
  | 'nascent_entry'
  | 'soul_entry'
  | 'spirit_severing_entry';

export const PRESTIGE_TARGETS = {
  unlock: {
    unlockRealmIndex: 2,
    unlockRealmId: 'core_formation',
    contentCapRealmId: 'spirit_severing',
  },
  policy: {
    timeBonusEnabled: false,
    recommendedResetPolicy: 'content_cap_only',
  },
  apComponents: {
    realmBaseByRealmIndex: {
      0: 0,
      1: 0,
      2: 10,
      3: 24,
      4: 42,
      5: 72,
    },
    maxSubstageBonusByRealmIndex: {
      2: 3,
      3: 6,
      4: 10,
      5: 14,
    },
    resolvedGateBonusPerGate: 1,
    maxResolvedGateCount: 4,
    zeroBeforeUnlock: true,
  },
  checkpointApTargets: {
    foundation_entry: { minAp: 0, maxAp: 0 },
    core_entry: { minAp: 10, maxAp: 14 },
    nascent_entry: { minAp: 24, maxAp: 32 },
    soul_entry: { minAp: 42, maxAp: 56 },
    spirit_severing_entry: { minAp: 72, maxAp: 90 },
  } satisfies Record<PrestigeCheckpointId, { minAp: number; maxAp: number }>,
  apPerHourPolicy: {
    coreFormationApPerHourFloor: 4.4,
    nascentVsCoreMultiplierFloor: 1.05,
    soulVsNascentMultiplierFloor: 0.98,
    capVsSoulMultiplierFloor: 1.05,
  },
  starterSpendCadencePolicy: {
    coreStarterPair: ['ap_idle_qi_mult', 'ap_combat_mult'],
    nascentPivotOptions: ['ap_unlock_heartlaw_t1', 'ap_idle_qi_mult', 'ap_combat_mult'],
    soulPivotOptions: ['ap_extra_technique_slot_1', 'ap_mastery_retention_10'],
    reclaimScoreWeightsByUpgradeId: {
      ap_idle_qi_mult: 5.5,
      ap_combat_mult: 5,
      ap_unlock_heartlaw_t1: 4.2,
      ap_extra_technique_slot_1: 4,
      ap_mastery_retention_10: 3.6,
      ap_mastery_retention_25: 3.2,
      ap_mastery_retention_50: 3,
      ap_offline_efficiency: 1.2,
    },
  },
  reclaimMilestoneTargets: {
    first_viable_core_reset_starter_spend: {
      sourceCheckpoint: 'core_entry',
      milestonesMinutes: {
        gate1Available: { min: 24, max: 35 },
        foundationEntry: { min: 35, max: 50 },
        coreReentry: { min: 95, max: 125 },
      },
    },
    deep_cap_reset_starter_spend: {
      sourceCheckpoint: 'spirit_severing_entry',
      milestonesMinutes: {
        gate1Available: { min: 15, max: 25 },
        foundationEntry: { min: 22, max: 35 },
        coreReentry: { min: 60, max: 90 },
        nascentReentry: { min: 150, max: 220 },
      },
    },
    first_purchase_feel: {
      sourceCheckpoint: 'core_entry',
      minImprovementRatio: 0.15,
      eligibleMilestones: ['gate1Available', 'foundationEntry'],
    },
  },
  visibilityPromotionPolicy: {
    masteryRetentionNodes: ['ap_mastery_retention_10', 'ap_mastery_retention_25', 'ap_mastery_retention_50'],
    unsupportedNodesRemainHidden: [
      'ap_fragment_gain_boost',
      'ap_pavilion_refresh_discount',
      'ap_unlock_alchemy_queue',
      'ap_unlock_forge_queue',
      'ap_unlock_talisman_queue',
      'ap_craft_speed_boost',
      'ap_autosell_filter',
      'ap_autobuy_consumables',
      'ap_loot_filter',
      'ap_auto_retry_bosses',
      'ap_unlock_meridian_hall',
      'ap_unlock_spirit_garden',
      'ap_unlock_jade_core',
      'ap_unlock_pagoda',
      'ap_pagoda_sweep',
      'ap_extra_heartlaw_choice',
    ],
  },
} as const;

export function getPrestigeTargets() {
  return PRESTIGE_TARGETS;
}
