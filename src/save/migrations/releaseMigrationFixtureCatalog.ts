import type { LegacySaveVersionKind } from './saveVersion.js';

export type ReleaseMigrationFixtureGroup = 'primary_risk' | 'compatibility';

export type ReleaseMigrationRiskClassId =
  | 'path_conflict'
  | 'path_alias_backfill'
  | 'gate_item_alias'
  | 'trial_gate_contradiction'
  | 'city_progression_invalid'
  | 'over_cap_realm_slice'
  | 'hidden_prestige_refund'
  | 'partial_reset_residue'
  | 'hidden_craft_outputs'
  | 'offline_timestamp_split'
  | 'current_save_regression'
  | 'legacy_unversioned_source';

export type ReleaseMigrationSemanticSnapshot = {
  fixtureId: string;
  riskClassId: ReleaseMigrationRiskClassId;
  sourceVersion: string;
  sourceVersionKind: LegacySaveVersionKind;
  finalVersion: string;
  selectedPath: string | null;
  realmIndex: number | null;
  realmName: string | null;
  highestRealmReached: number | null;
  currentCityId: string | null;
  unlockedCityIds: string[];
  firstTrialResolution: string | null;
  legacyGateAliasIdsRemaining: string[];
  hiddenPrestigePurchaseIdsRemaining: string[];
  hiddenCraftOutputIdsRemaining: string[];
  offlineTimestampSnapshot: {
    metaLastActiveAtMs: number | null;
    gameLastActiveTime: number | null;
    gameLastTickTime: number | null;
  };
  offlineTimestampsAligned: boolean;
  noFakeCitySix: boolean;
};

export type ReleaseMigrationExpectationResult = {
  key: string;
  pass: boolean;
  expected: string;
  actual: string;
  message: string;
};

export interface ReleaseMigrationFixtureDefinition {
  fixtureId: string;
  fileName: string;
  title: string;
  group: ReleaseMigrationFixtureGroup;
  riskClassId: ReleaseMigrationRiskClassId;
  why: string;
  expectedPrimaryStepIds: string[];
  expectedSourceVersionKind?: LegacySaveVersionKind;
  runtimeSmokeProfile?: string;
  postApplyProfile?: string;
  expectedWarningCodes?: string[];
  expectedErrorCount?: number;
  expectations: {
    selectedPath?: string | null;
    currentCityId?: string | null;
    unlockedCityIdsExact?: string[];
    unlockedCityIdsSubsetOfLiveSlice?: boolean;
    firstTrialResolution?: string;
    maxRealmIndex?: number;
    realmName?: string;
    highestRealmReached?: number;
    noLegacyGateAliasIds?: boolean;
    requireCanonicalGateIds?: string[];
    noHiddenPrestigePurchases?: boolean;
    noHiddenCraftOutputs?: boolean;
    offlineTimestampsAligned?: boolean;
    noFakeCitySix?: boolean;
    finalVersionIsCurrent?: boolean;
    sourceVersionKind?: LegacySaveVersionKind;
    applyIdempotent?: boolean;
  };
}

export const RELEASE_MIGRATION_FIXTURE_CATALOG: readonly ReleaseMigrationFixtureDefinition[] = [
  {
    fixtureId: 'legacy-path-conflict',
    fileName: 'legacy-path-conflict.json',
    title: 'Path conflict resolves to canonical selectedPath',
    group: 'primary_risk',
    riskClassId: 'path_conflict',
    why: 'Legacy lifePath and selectedPath disagree; migration must keep canonical selectedPath truth.',
    expectedPrimaryStepIds: ['v2_0_0_normalize_path_truth'],
    runtimeSmokeProfile: 'migration_only',
    postApplyProfile: 'canonical_path_truth',
    expectations: {
      selectedPath: 'martial',
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-path-only',
    fileName: 'legacy-path-only.json',
    title: 'Legacy lifePath-only saves are backfilled',
    group: 'compatibility',
    riskClassId: 'path_alias_backfill',
    why: 'Older saves may lack selectedPath and rely on lifePath alias only.',
    expectedPrimaryStepIds: ['v2_0_0_normalize_path_truth'],
    runtimeSmokeProfile: 'migration_only',
    postApplyProfile: 'canonical_path_truth',
    expectations: {
      selectedPath: 'earth',
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-gate-item-ids',
    fileName: 'legacy-gate-item-ids.json',
    title: 'Legacy gate item aliases remap to canonical gate_* IDs',
    group: 'primary_risk',
    riskClassId: 'gate_item_alias',
    why: 'Packet 1.3 canonicalized gate item ids; legacy aliases must not survive.',
    expectedPrimaryStepIds: ['v2_0_0_plan_gate_item_alias_migration'],
    postApplyProfile: 'canonical_inventory_gate_items',
    expectations: {
      noLegacyGateAliasIds: true,
      requireCanonicalGateIds: ['gate_foundation_pill', 'gate_core_catalyst'],
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-trial-mismatch',
    fileName: 'legacy-trial-mismatch.json',
    title: 'Trial/gate contradiction normalizes honestly',
    group: 'primary_risk',
    riskClassId: 'trial_gate_contradiction',
    why: 'Packet 1.4 contradiction case must normalize to bypassed without fake clears.',
    expectedPrimaryStepIds: ['v2_0_0_plan_trial_resolution_normalization', 'v2_0_0_normalize_city_progression_state'],
    postApplyProfile: 'first_gate_bypassed_no_fake_clear',
    expectations: {
      firstTrialResolution: 'bypassed',
      currentCityId: 'city_stonecrag_town',
      unlockedCityIdsExact: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      noFakeCitySix: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-city-current-invalid',
    fileName: 'legacy-city-current-invalid.json',
    title: 'Invalid city progression state is normalized in-slice',
    group: 'primary_risk',
    riskClassId: 'city_progression_invalid',
    why: 'Packet 1.5 contradiction where currentCityId is invalid vs unlocked chain.',
    expectedPrimaryStepIds: ['v2_0_0_normalize_city_progression_state'],
    postApplyProfile: 'canonical_city_chain',
    expectations: {
      currentCityId: 'city_lotusford',
      unlockedCityIdsExact: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford'],
      unlockedCityIdsSubsetOfLiveSlice: true,
      noFakeCitySix: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-future-slice',
    fileName: 'legacy-future-slice.json',
    title: 'Over-cap realm progression clamps to Spirit Severing / Ironpeak',
    group: 'primary_risk',
    riskClassId: 'over_cap_realm_slice',
    why: 'Packet 1.1 cap-edge legacy saves must be clamped to live content slice.',
    expectedPrimaryStepIds: ['v2_0_0_clamp_semester_slice', 'v2_0_0_normalize_city_progression_state'],
    postApplyProfile: 'semester_slice_clamped',
    expectations: {
      maxRealmIndex: 5,
      realmName: 'Spirit Severing',
      highestRealmReached: 5,
      currentCityId: 'city_ironpeak_bastion',
      unlockedCityIdsExact: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
      noFakeCitySix: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-hidden-prestige',
    fileName: 'legacy-hidden-prestige.json',
    title: 'Hidden deferred prestige purchases refunded',
    group: 'primary_risk',
    riskClassId: 'hidden_prestige_refund',
    why: 'Packet 1.6 should refund hidden/deferred prestige purchases and clear them.',
    expectedPrimaryStepIds: ['v2_0_0_plan_deferred_prestige_refund'],
    postApplyProfile: 'prestige_refund_applied',
    expectations: {
      noHiddenPrestigePurchases: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-hidden-unsupported-prestige',
    fileName: 'legacy-hidden-unsupported-prestige.json',
    title: 'Hidden unsupported prestige purchases refunded',
    group: 'primary_risk',
    riskClassId: 'hidden_prestige_refund',
    why: 'Packet 1.6 also covers unsupported hidden ap_* purchases from prior content drift.',
    expectedPrimaryStepIds: ['v2_0_0_plan_deferred_prestige_refund'],
    postApplyProfile: 'prestige_refund_applied',
    expectations: {
      noHiddenPrestigePurchases: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-partial-reset-residue',
    fileName: 'legacy-partial-reset-residue.json',
    title: 'Partial reset residue cleaned to Pinewind baseline',
    group: 'primary_risk',
    riskClassId: 'partial_reset_residue',
    why: 'Packet 1.7 must restore clean-life baseline while preserving persistent prestige meta.',
    expectedPrimaryStepIds: ['v2_0_0_plan_partial_reset_residue_cleanup'],
    postApplyProfile: 'clean_new_life_baseline',
    expectations: {
      currentCityId: 'city_pinewind_hamlet',
      unlockedCityIdsExact: ['city_pinewind_hamlet'],
      noFakeCitySix: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-hidden-craft-outputs',
    fileName: 'legacy-hidden-craft-outputs.json',
    title: 'Hidden/deferred craft outputs are refunded and cleared',
    group: 'primary_risk',
    riskClassId: 'hidden_craft_outputs',
    why: 'Packet 3.1 hidden craft cleanup must clear inventory/queues/session/buff/pouch residue.',
    expectedPrimaryStepIds: ['v2_0_0_refund_hidden_craft_outputs'],
    postApplyProfile: 'hidden_craft_residue_cleared',
    expectations: {
      noHiddenCraftOutputs: true,
      applyIdempotent: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'legacy-offline-split',
    fileName: 'legacy-offline-split.json',
    title: 'Split offline timestamps align to canonical latest timestamp',
    group: 'primary_risk',
    riskClassId: 'offline_timestamp_split',
    why: 'Packet 1.8 must normalize split offline metadata surfaces.',
    expectedPrimaryStepIds: ['v2_0_0_plan_offline_unification'],
    postApplyProfile: 'offline_timestamps_aligned',
    expectations: {
      offlineTimestampsAligned: true,
      finalVersionIsCurrent: true,
    },
  },
  {
    fixtureId: 'current-save',
    fileName: 'current-save.json',
    title: 'Current save baseline does not regress',
    group: 'compatibility',
    riskClassId: 'current_save_regression',
    why: 'Canonical current save should stay valid under migration apply path.',
    expectedPrimaryStepIds: [],
    expectedSourceVersionKind: 'current',
    postApplyProfile: 'no_regression_current_save',
    expectations: {
      sourceVersionKind: 'current',
      finalVersionIsCurrent: true,
      noFakeCitySix: true,
    },
  },
  {
    fixtureId: 'legacy-unversioned-save',
    fileName: 'legacy-unversioned-save.json',
    title: 'Legacy unversioned source is detected and migrated',
    group: 'compatibility',
    riskClassId: 'legacy_unversioned_source',
    why: 'Release reporting must expose legacy-unversioned source detection while producing current output.',
    expectedPrimaryStepIds: [],
    expectedSourceVersionKind: 'legacy-unversioned',
    postApplyProfile: 'legacy_source_detected',
    expectations: {
      sourceVersionKind: 'legacy-unversioned',
      finalVersionIsCurrent: true,
    },
  },
] as const;

export const RELEASE_MIGRATION_REQUIRED_RISK_CLASSES: readonly ReleaseMigrationRiskClassId[] = [
  'path_conflict',
  'path_alias_backfill',
  'gate_item_alias',
  'trial_gate_contradiction',
  'city_progression_invalid',
  'over_cap_realm_slice',
  'hidden_prestige_refund',
  'partial_reset_residue',
  'hidden_craft_outputs',
  'offline_timestamp_split',
  'current_save_regression',
  'legacy_unversioned_source',
] as const;

export const RELEASE_MIGRATION_FIXTURE_IDS = RELEASE_MIGRATION_FIXTURE_CATALOG.map((entry) => entry.fixtureId);

export const getReleaseMigrationFixtureDefinition = (fixtureId: string): ReleaseMigrationFixtureDefinition | undefined =>
  RELEASE_MIGRATION_FIXTURE_CATALOG.find((entry) => entry.fixtureId === fixtureId);
