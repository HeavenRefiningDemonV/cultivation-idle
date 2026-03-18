import type { GateTransitionId, MajorRealmId, ProgressionContract } from '../../../src/systems/progression/contract/index.js';

export type GateResolutionState = 'cleared' | 'bypassed';

export type ScenarioKind =
  | 'fresh_life'
  | 'pre_first_gate'
  | 'post_first_gate'
  | 'prestige_ready'
  | 'cap_reached'
  | 'legacy_alias';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface ProgressionScenario {
  kind: ScenarioKind;
  description: string;
  pathState: {
    selectedPath: 'heaven' | 'earth' | 'martial' | null;
    lifePathAlias: 'heaven' | 'earth' | 'martial' | null;
  };
  realmState: {
    currentRealm: MajorRealmId;
    enteredRealms: MajorRealmId[];
  };
  gateState: {
    resolutionByTransitionId: Partial<Record<GateTransitionId, GateResolutionState>>;
    resolvedTransitionIds: GateTransitionId[];
    inventoryGateItems: Record<string, number>;
    pendingBreakthroughTo: MajorRealmId | null;
  };
  cityState: {
    currentCityId: string | null;
    unlockedCityIds: string[];
    selectedModuleByCity: Record<string, string>;
  };
  prestigeState: {
    ready: boolean;
    projectedAP: number;
  };
  offlineState: {
    pipelineId: string;
    maxCatchupSeconds: number;
    efficiencyModel: string;
  };
  notes: string[];
}

export interface ScenarioBuildContext {
  contract: ProgressionContract;
}

export type ScenarioOverrides = DeepPartial<ProgressionScenario>;
