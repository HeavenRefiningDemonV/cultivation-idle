import type { GameEvent } from '../../../src/services/events/GameEvents.js';
import type { CityId, MajorRealmId, TrialId } from '../../../src/systems/progression/contract/index.js';

export type FreshSaveRouteId = 'normal' | 'cautious' | 'aggressive';

export type FreshSaveRoutePolicy = 'balanced' | 'safety_first' | 'speed_first';

export type FreshSaveRouteAutomationMode = 'automated_smoke_blocking' | 'manual_coverage';

export type FreshSaveCheckpointId =
  | 'life_started'
  | 'path_selected'
  | 'heart_law_selected'
  | 'pinewind_ready'
  | 'gate_1_available'
  | 'gate_1_resolved'
  | 'foundation_entry'
  | 'stonecrag_entered'
  | 'gate_2_available'
  | 'gate_2_resolved'
  | 'core_formation_entry'
  | 'spirit_cavern_entered'
  | 'gate_3_available'
  | 'gate_3_resolved'
  | 'nascent_soul_entry'
  | 'lotusford_entered'
  | 'gate_4_available'
  | 'gate_4_resolved'
  | 'soul_formation_entry'
  | 'ironpeak_entered'
  | 'gate_5_available'
  | 'gate_5_resolved'
  | 'spirit_severing_entry'
  | 'content_cap_reached'
  | 'prestige_advisor_surface_available'
  | 'current_chapter_exhausted_truth_available'
  | 'current_life_summary_available';

export type FreshSaveCheckpointRow = {
  checkpointId: FreshSaveCheckpointId;
  elapsedMsSinceLifeStart: number;
  source: 'event' | 'runner' | 'assertion';
  detail?: string;
};

export type FreshSaveRouteAssistedStep = {
  stepId: string;
  detail: string;
};

export type FreshSaveRouteWarning = {
  code: string;
  message: string;
};

export type FreshSaveRouteFailure = {
  code: string;
  message: string;
  blocker: boolean;
};

export type GateResolutionRow = {
  gateIndex: number;
  trialId: TrialId;
  resolution: 'cleared' | 'bypassed' | 'unresolved';
  attempts: number;
  elapsedMsResolved: number | null;
};

export type FreshSaveProgressionEventRow = {
  eventType: GameEvent['type'];
  elapsedMsSinceLifeStart: number;
  runStartTime: number;
  gateIndex?: number;
  trialId?: string;
  cityId?: string | null;
  fromRealmId?: string;
  toRealmId?: string;
  major?: boolean;
  resolution?: 'cleared' | 'bypassed';
};

export type FreshSaveRouteFinalSnapshot = {
  routeId: FreshSaveRouteId;
  automationMode: FreshSaveRouteAutomationMode;
  representativePath: string;
  runStartTime: number;
  elapsedMsToCap: number | null;
  finalRealmId: MajorRealmId;
  currentCityId: CityId | null;
  unlockedCityIds: CityId[];
  gateResolutionSummary: GateResolutionRow[];
  prestigeAdvisorLabel: string | null;
  currentChapterExhaustedTruth: boolean;
  lifeSummaryAvailable: boolean;
};

export type FreshSaveRouteResult = {
  routeId: FreshSaveRouteId;
  policy: FreshSaveRoutePolicy;
  automationMode: FreshSaveRouteAutomationMode;
  isBlockingSmokeRoute: boolean;
  representativePath: string;
  checkpoints: FreshSaveCheckpointRow[];
  progressionEvents: FreshSaveProgressionEventRow[];
  warnings: FreshSaveRouteWarning[];
  failures: FreshSaveRouteFailure[];
  assistedSteps: FreshSaveRouteAssistedStep[];
  finalSnapshot: FreshSaveRouteFinalSnapshot;
};

export type FreshSaveRouteDefinition = {
  id: FreshSaveRouteId;
  policy: FreshSaveRoutePolicy;
  automationMode: FreshSaveRouteAutomationMode;
  isBlockingSmokeRoute: boolean;
  description: string;
  expectedCheckpoints: readonly FreshSaveCheckpointId[];
  notes?: readonly string[];
};
