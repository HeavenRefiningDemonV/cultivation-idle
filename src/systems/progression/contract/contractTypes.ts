export type MajorRealmId =
  | 'qi_condensation'
  | 'foundation_establishment'
  | 'core_formation'
  | 'nascent_soul'
  | 'soul_formation'
  | 'spirit_severing';

export type GateItemId =
  | 'gate_foundation_pill'
  | 'gate_core_catalyst'
  | 'gate_core_stabilizer'
  | 'gate_soul_condensate'
  | 'gate_severing_seal';

export type TrialId =
  | 'trial_novices_clearing'
  | 'trial_stone_core_sanctum'
  | 'trial_patriarchs_seal'
  | 'trial_soul_lantern_vault'
  | 'trial_severing_court';

export type CityId =
  | 'city_pinewind_hamlet'
  | 'city_stonecrag_town'
  | 'city_spirit_cavern_city'
  | 'city_lotusford'
  | 'city_ironpeak_bastion';

export type DeferredSystemId =
  | 'ascension_realms'
  | 'post_severing_cities'
  | 'advanced_trial_branches'
  | 'cross_city_world_events';

export type GateTransitionId = `${MajorRealmId}_to_${MajorRealmId}`;

export type DriftAliasRecord = {
  canonical: string;
  aliases: string[];
};

export interface SemesterSliceContract {
  id: 'semester_0';
  label: string;
  liveMajorRealms: MajorRealmId[];
  liveTrialIds: TrialId[];
  liveCityIds: CityId[];
  contentCapRealm: MajorRealmId;
}

export interface GateTransitionContract {
  id: GateTransitionId;
  fromRealmId: MajorRealmId;
  toRealmId: MajorRealmId;
  trialId: TrialId;
  gateItemId: GateItemId;
  cityId?: CityId;
}

export interface CityUnlockContract {
  cityId: CityId;
  unlockOnRealmEntry: MajorRealmId;
}

export interface ContentCapContract {
  realmId: MajorRealmId;
  state: 'end_of_slice';
}

export interface OfflineProgressionContract {
  pipelineId: 'offline_progression_v1';
  appliesTo: Array<'cultivation' | 'queued_actions' | 'expeditions'>;
  excludes: Array<'combat'>;
  maxCatchupSeconds: number;
  efficiencyModel: 'full_for_supported_systems';
}

export interface PathTruthContract {
  canonicalField: 'selectedPath';
  legacyAliases: ['lifePath'];
}

export interface PrestigeClassificationHookSet {
  classifyNode: (nodeId: string) => 'live' | 'deferred' | 'unknown';
}

export interface ResetClassificationHookSet {
  classifyKey: (key: string) => 'per_life' | 'permanent' | 'hybrid' | 'unknown';
}

export interface ProgressionContract {
  semesterSlice: SemesterSliceContract;
  majorRealms: Record<MajorRealmId, { id: MajorRealmId; index: number }>;
  gateTransitions: GateTransitionContract[];
  cityUnlocks: CityUnlockContract[];
  contentCap: ContentCapContract;
  deferredSystems: DeferredSystemId[];
  pathTruth: PathTruthContract;
  offline: OfflineProgressionContract;
  prestigeHooks: PrestigeClassificationHookSet;
  resetHooks: ResetClassificationHookSet;
  aliases: {
    gateItems: DriftAliasRecord[];
    failSafeFieldAliases: DriftAliasRecord[];
  };
}

export interface ProgressionAuthoredContent {
  economy: { majorRealms: Array<{ id: string; index: number }> };
  cities: Array<{ id: string; unlockMajorRealm: string }>;
  trials: Array<{
    id: string;
    cityId: string;
    gatesToMajorRealm?: string;
    gateItemId: string;
    eligibilityRule?: { fromMajorRealm?: string } | string;
    failSafe?: unknown;
    failSafePurchase?: unknown;
  }>;
  items: { items: Array<{ id: string }> };
  prestigeStore?: { upgrades?: Array<{ id: string }> };
}
