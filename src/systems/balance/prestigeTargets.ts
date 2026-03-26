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
  apPerHourTargets: {
    core_viable_ap_per_hour: { min: 4, max: 6, status: 'placeholder_for_6_7_prompt_2' },
    nascent_ap_per_hour: { min: 6, max: 8, status: 'placeholder_for_6_7_prompt_2' },
    soul_ap_per_hour: { min: 8, max: 11, status: 'placeholder_for_6_7_prompt_2' },
    cap_ap_per_hour: { min: 11, max: 15, status: 'placeholder_for_6_7_prompt_2' },
  },
} as const;

export function getPrestigeTargets() {
  return PRESTIGE_TARGETS;
}
