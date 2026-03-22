import type { LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import type { CultivationPath } from '../../types/index.js';
import type { EconomicProblemKind } from './economicProblemKinds.js';
import type { BestSourceIndex } from './bestSourceIndex.js';
import type { EconomicDestinationFamily } from './problemDestinationPolicy.js';
import type { EconomicPhaseSnapshot } from './economicPhaseResolver.js';
import type { SpendPriorityId, SpendOrderPolicySnapshot } from './spendOrderPolicy.js';
import type { ForgeFloorReadModel } from '../forge/forgeFloorReadModel.js';
import type { SupportEconomyReadModel } from './supportEconomyReadModel.js';
import type { MissingMaterialRouteOption } from './missingMaterialRouteResolver.js';

export type EconomicReadinessBand = 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';
export type EconomicShortfallSeverity = 'critical' | 'high' | 'medium' | 'low';
export type EconomicRecommendationActionKind =
  | 'buy'
  | 'brew'
  | 'farm_outskirts'
  | 'run_ruins'
  | 'launch_expedition'
  | 'claim_bounty'
  | 'craft_forge'
  | 'route_manual_pavilion'
  | 'attempt_gate'
  | 'hold_and_cultivate';
export type EconomicRecommendationBenefitCategory =
  | 'consumable_floor'
  | 'forge_floor'
  | 'support_reserve'
  | 'gate_prep'
  | 'targeted_material'
  | 'build_correction'
  | 'milestone';
export type EconomicPriorityBand = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface EconomicSnapshotShopLine {
  shopId: string;
  stockId: string;
  itemId: string;
  dailyLimit: number | null;
  purchasedToday: number;
  remainingToday: number | null;
}

export interface EconomicSnapshotExpeditionState {
  slots: number;
  activeRunCount: number;
  availableSlotCount: number;
  activeRunTypeIds: string[];
  activeOriginCityIds: string[];
}

export interface EconomicRuntimeSnapshot {
  content: ValidatedContent;
  phase: EconomicPhaseSnapshot;
  spendPolicy: SpendOrderPolicySnapshot;
  bestSourceIndex: BestSourceIndex;
  currentCityId: string | null;
  currentCityIndex: number;
  unlockedCityIds: readonly string[];
  currentModuleKey: string | null;
  currentModuleAvailability: readonly LiveWorldModuleKey[];
  selectedPath: CultivationPath | null;
  currentRealmId: string;
  currentRealmIndex: number;
  currentGateIndex: number;
  currentGateResolved: boolean;
  nextUnresolvedGateTransitionId: string | null;
  atContentCap: boolean;
  currencies: {
    gold: string;
    merit: string;
    spiritStones: string;
  };
  ownedItemCountsById: Record<string, number>;
  currentCityShop: {
    cityId: string | null;
    lines: EconomicSnapshotShopLine[];
    purchasedTodayByStockId: Record<string, number>;
  };
  forgeFloor: ForgeFloorReadModel;
  supportEconomy: SupportEconomyReadModel;
  expeditionState: EconomicSnapshotExpeditionState;
  availableModuleKeys: readonly LiveWorldModuleKey[];
}

export interface EconomicShortfall {
  id: string;
  problemKind: EconomicProblemKind;
  severity: EconomicShortfallSeverity;
  currentValue: number;
  targetValue: number;
  gap: number;
  mandatoryBeforeNextGate: boolean;
  spendPriorityId: SpendPriorityId;
  priorityBand: EconomicPriorityBand;
  primaryDestinationFamily: EconomicDestinationFamily;
  primaryRecommendedRouteKey: string | null;
  label: string;
  relatedIds: string[];
  benefitCategory: EconomicRecommendationBenefitCategory;
}

export interface EconomicRecommendationCandidate {
  actionKind: EconomicRecommendationActionKind;
  destinationModuleKey: LiveWorldModuleKey;
  destinationCityId: string | null;
  routeType: EconomicDestinationFamily | 'hold_and_cultivate';
  reasonSummary: string;
  blockedReason: string | null;
  priorityBand: EconomicPriorityBand;
  relatedIds: string[];
  expectedBenefitCategory: EconomicRecommendationBenefitCategory;
  activityMode: 'active' | 'passive' | 'background';
  problemKind: EconomicProblemKind;
}

export interface EconomicProblemRecommendation {
  shortfall: EconomicShortfall;
  candidates: EconomicRecommendationCandidate[];
  routeOptions: MissingMaterialRouteOption[];
}

export interface ModuleRecommendationSummary {
  moduleKey: LiveWorldModuleKey;
  weight: 'primary' | 'secondary' | 'optional';
  helpsSolveProblemKind: EconomicProblemKind | null;
  whyItMatters: string;
  topReason: string;
  relatedIds: string[];
}

export interface EconomicRecommendationEngineResult {
  snapshot: EconomicRuntimeSnapshot;
  orderedShortfalls: EconomicShortfall[];
  topRecommendation: EconomicRecommendationCandidate | null;
  topRouteCandidates: EconomicRecommendationCandidate[];
  perProblemRecommendations: EconomicProblemRecommendation[];
  moduleSummaries: ModuleRecommendationSummary[];
  readinessBand: EconomicReadinessBand;
  majorShortfallCount: number;
}
