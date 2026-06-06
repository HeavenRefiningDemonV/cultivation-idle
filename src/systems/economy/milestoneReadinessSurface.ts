import type { LiveWorldModuleKey } from '../../content/index.js';
import { getLiveRealmById, getLiveRealmByIndex } from '../progression/runtime/liveRealmProjection.js';
import type { FailureDiagnosis, FailureFixDestination } from '../readiness/failureDiagnosisTypes.js';
import type { GateReadinessResult } from '../readiness/readinessScoringTypes.js';
import { p3ModuleRoute, type P3ModuleKey, type P3Route } from '../world/p3SurfaceTypes.js';
import { getWorldModuleLabel } from '../../ui/text/playerFacingLabels.js';
import type {
  EconomicRecommendationCandidate,
  EconomicRecommendationEngineResult,
  EconomicShortfall,
} from './economicRecommendationTypes.js';
import type { EconomicProblemKind } from './economicProblemKinds.js';
import { buildResourceProvenanceSurface, type ResourceProvenanceSurfaceV1 } from './resourceProvenanceSurface.js';
import type { BestSourceOption } from './bestSourceIndex.js';

export type MilestoneBlockerType =
  | 'cultivation_progress'
  | 'qi_cap'
  | 'realm_stage'
  | 'gate_catalyst'
  | 'gate_trial_state'
  | 'gear_floor'
  | 'healing_floor'
  | 'medicine_pouch'
  | 'technique_loadout'
  | 'manual_coverage'
  | 'material_shortfall'
  | 'currency_shortfall'
  | 'fail_safe'
  | 'city_module_locked'
  | 'prestige_wall'
  | 'content_cap'
  | 'offline_queue_idle'
  | 'unknown';

export type MilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'ready'
  | 'cleared'
  | 'capped'
  | 'prestige_consideration';

export type MilestoneSeverity = 'critical' | 'high' | 'medium' | 'low';
export type MilestoneActivityMode = 'active' | 'background' | 'passive' | 'ledger' | 'meta';
export type MilestoneRelevance = 'primary' | 'secondary' | 'fallback' | 'not_relevant' | 'locked';
export type MilestoneActivityKey =
  | 'cultivation'
  | 'status'
  | 'world'
  | LiveWorldModuleKey
  | 'techniques'
  | 'inventory'
  | 'prestige';

export interface MilestoneSourceOptionSurface {
  moduleKey: LiveWorldModuleKey;
  label: string;
  reason: string;
  activityMode: 'active' | 'background' | 'passive';
  available: boolean;
  blockedReason: string | null;
  expectedYieldLabel: string | null;
  routeAction: P3Route;
}

export interface MilestoneBlockerSurface {
  id: string;
  blockerType: MilestoneBlockerType;
  label: string;
  reason: string;
  currentValue: number | null;
  targetValue: number | null;
  gap: number | null;
  severity: MilestoneSeverity;
  requirementKind: 'hard_requirement' | 'recommended_prep';
  mandatoryBeforeNextGate: boolean;
  bestSource: MilestoneSourceOptionSurface | null;
  fallbackSource: MilestoneSourceOptionSurface | null;
  routeAction: P3Route;
  expectedBenefit: string;
  relatedIds: string[];
  relatedScreenModuleKey: P3ModuleKey | null;
  detailsText: string;
  debug?: {
    problemKind: EconomicProblemKind;
    spendPriorityId: string;
    primaryRecommendedRouteKey: string | null;
  };
}

export interface MilestoneActionSurface {
  id: string;
  label: string;
  destinationModuleKey: LiveWorldModuleKey;
  reason: string;
  expectedBenefit: string;
  activityMode: 'active' | 'background' | 'passive';
  routeAction: P3Route;
  available: boolean;
  blockedReason: string | null;
  relatedIds: string[];
  priorityBand: number;
}

export interface MilestonePrepSurface {
  id: string;
  label: string;
  blockerType: MilestoneBlockerType;
  currentValue: number | null;
  targetValue: number | null;
  expectedBenefit: string;
  routeAction: P3Route;
}

export interface MilestoneSafetyNetSurface {
  label: 'Safety Net';
  reserveStatus: string;
  currentMerit: string;
  targetMeritReserve: string;
  currentSpiritStones: string;
  spiritStoneMinimumReserve: string;
  failSafeThreshold: number;
  failSafeAffordableNow: boolean;
  expectedMeritAfterThreeEligibleDefeats: string;
  routeAction: P3Route;
  reason: string;
}

export interface MilestoneFailureDiagnosisSurface {
  headline: string;
  primary: string;
  secondary: string | null;
  reasons: string[];
  topFixes: Array<{
    label: string;
    destinationModuleKey: P3ModuleKey;
    reason: string;
    routeAction: P3Route;
  }>;
}

export interface SourceSinkHighlightSurface {
  id: string;
  label: string;
  kind: ResourceProvenanceSurfaceV1['kind'];
  purpose: string;
  currentRelevance: string;
  bestSourceLabel: string | null;
  bestSinkLabel: string | null;
  routeAction: P3Route | null;
}

export interface ModuleRoleHighlightSurface {
  activityKey: MilestoneActivityKey;
  label: string;
  roleSubtitle: string;
  roleKind:
    | 'cultivation'
    | 'diagnostic'
    | 'city_hub'
    | 'active_source'
    | 'targeted_source'
    | 'gate'
    | 'build'
    | 'prep'
    | 'gear'
    | 'task'
    | 'background'
    | 'ledger'
    | 'meta';
  activityMode: MilestoneActivityMode;
  primaryOutputs: string[];
  primarySinksSupported: string[];
  currentMilestoneRelevance: MilestoneRelevance;
  currentReason: string;
  routeLabel: string;
  details?: string[];
}

export interface MilestoneReadinessSurfaceV1 {
  schemaVersion: 'milestone-readiness-surface-v1';
  generatedAtMs: number;
  currentCityId: string | null;
  currentCityName: string | null;
  currentRealmId: string;
  currentRealmName: string;
  currentSubstageLabel: string;
  currentMilestone: {
    id: string;
    label: string;
    targetRealmId: string | null;
    targetRealmName: string | null;
    gateId: string | null;
    gateLabel: string | null;
    status: MilestoneStatus;
    summary: string;
  };
  currentBlocker: MilestoneBlockerSurface | null;
  blockers: MilestoneBlockerSurface[];
  bestActions: MilestoneActionSurface[];
  recommendedPrep: MilestonePrepSurface[];
  safetyNet: MilestoneSafetyNetSurface | null;
  failureDiagnosis: MilestoneFailureDiagnosisSurface | null;
  sourceSinkHighlights: SourceSinkHighlightSurface[];
  moduleRoleHighlights: ModuleRoleHighlightSurface[];
  debug?: {
    sourceModules: string[];
    notes: string[];
    unresolvedDataGaps: string[];
  };
}

export interface MilestoneScreenGuidanceSlice {
  headline: string;
  summary: string;
  primaryBlockerId: string | null;
  primaryRoute: P3Route;
  details: string[];
}

export interface MilestoneReadinessScreenGuidance {
  status: MilestoneScreenGuidanceSlice;
  cultivation: MilestoneScreenGuidanceSlice;
  gateTrial: MilestoneScreenGuidanceSlice;
  world: MilestoneScreenGuidanceSlice & { recommendedModuleKey: LiveWorldModuleKey | null };
}

const ROLE_ENTRIES: readonly ModuleRoleHighlightSurface[] = [
  {
    activityKey: 'cultivation',
    label: 'Cultivation',
    roleSubtitle: 'Sacred center for realm, Qi, stability, and the next threshold.',
    roleKind: 'cultivation',
    activityMode: 'active',
    primaryOutputs: ['Qi', 'realm progress', 'breakthrough handoff'],
    primarySinksSupported: ['Gate catalysts', 'current milestone'],
    currentMilestoneRelevance: 'primary',
    currentReason: 'Shows whether inner progress is ready or support systems still need work.',
    routeLabel: 'Open Cultivation',
  },
  {
    activityKey: 'status',
    label: 'Status',
    roleSubtitle: 'Command ledger for the current milestone, blocker, and best fixes.',
    roleKind: 'diagnostic',
    activityMode: 'ledger',
    primaryOutputs: ['current blocker', 'best improvements', 'safety net status'],
    primarySinksSupported: ['All current milestone decisions'],
    currentMilestoneRelevance: 'primary',
    currentReason: 'Ranks one current fix before secondary options.',
    routeLabel: 'Open Status',
  },
  {
    activityKey: 'world',
    label: 'World',
    roleSubtitle: 'City service network for choosing the right support system.',
    roleKind: 'city_hub',
    activityMode: 'ledger',
    primaryOutputs: ['module routes', 'service availability'],
    primarySinksSupported: ['Current blocker routing'],
    currentMilestoneRelevance: 'primary',
    currentReason: 'Turns the ranked blocker into a concrete city destination.',
    routeLabel: 'Open World',
  },
  {
    activityKey: 'outskirts',
    label: 'Outskirts',
    roleSubtitle: 'Gold, common materials, and low-risk combat repetitions.',
    roleKind: 'active_source',
    activityMode: 'active',
    primaryOutputs: ['Gold', 'common materials', 'safe combat reps'],
    primarySinksSupported: ['Apothecary', 'Forge', 'Safety Net reserves'],
    currentMilestoneRelevance: 'fallback',
    currentReason: 'Best when the current fix is blocked by gold or common materials.',
    routeLabel: 'Open Outskirts',
  },
  {
    activityKey: 'ruins',
    label: 'Ruins',
    roleSubtitle: 'Deterministic targeted-material support for local shortages.',
    roleKind: 'targeted_source',
    activityMode: 'active',
    primaryOutputs: ['targeted materials', 'anchor drops'],
    primarySinksSupported: ['Forge', 'Apothecary', 'local prep'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Best when a specific herb, ore, or local material blocks preparation.',
    routeLabel: 'Open Ruins',
  },
  {
    activityKey: 'gateTrial',
    label: 'Gate Trial',
    roleSubtitle: 'Milestone readiness check, decisive gate, Safety Net, and catalyst source.',
    roleKind: 'gate',
    activityMode: 'active',
    primaryOutputs: ['Gate catalyst', 'failure diagnosis', 'Safety Net progress'],
    primarySinksSupported: ['Breakthrough handoff'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Attempt only when readiness is sufficient or the Safety Net path is honest.',
    routeLabel: 'Open Gate Trial',
  },
  {
    activityKey: 'manualPavilion',
    label: 'Manual Pavilion',
    roleSubtitle: 'Doctrine acquisition for manuals, path fit, and build correction.',
    roleKind: 'build',
    activityMode: 'background',
    primaryOutputs: ['manuals', 'fragments', 'doctrine options'],
    primarySinksSupported: ['Techniques', 'loadout readiness'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Use when the current build needs a new technique route or stronger path fit.',
    routeLabel: 'Open Manual Pavilion',
  },
  {
    activityKey: 'techniques',
    label: 'Techniques',
    roleSubtitle: 'Build expression through learned techniques, loadouts, and AI posture.',
    roleKind: 'build',
    activityMode: 'ledger',
    primaryOutputs: ['equipped techniques', 'loadout posture', 'AI fit'],
    primarySinksSupported: ['Gate combat readiness'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Turns manuals into actual combat behavior for the next gate.',
    routeLabel: 'Open Techniques',
  },
  {
    activityKey: 'apothecary',
    label: 'Apothecary',
    roleSubtitle: 'Preparation room for pouch stock, pills, and immediate survival readiness.',
    roleKind: 'prep',
    activityMode: 'background',
    primaryOutputs: ['Healing Reserve', 'pouch stock', 'prep consumables'],
    primarySinksSupported: ['Gate survival', 'failure recovery'],
    currentMilestoneRelevance: 'primary',
    currentReason: 'Best when the current blocker is recovery, pouch fit, or consumable stock.',
    routeLabel: 'Open Apothecary',
  },
  {
    activityKey: 'forge',
    label: 'Forge',
    roleSubtitle: 'Permanent gear floor and power baseline for gate attempts.',
    roleKind: 'gear',
    activityMode: 'background',
    primaryOutputs: ['Forge Floor', 'refine progress', 'temper progress'],
    primarySinksSupported: ['Gate damage and survival floor'],
    currentMilestoneRelevance: 'primary',
    currentReason: 'Best when the current blocker is weapon, accessory, temper, or rune floor.',
    routeLabel: 'Open Forge',
  },
  {
    activityKey: 'bounties',
    label: 'Bounties',
    roleSubtitle: 'Directed tasks for Merit, support currency, and shortage routing.',
    roleKind: 'task',
    activityMode: 'background',
    primaryOutputs: ['Merit', 'gold', 'support tasks'],
    primarySinksSupported: ['Safety Net reserves', 'support economy'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Best when the current blocker is Merit, reserve currency, or a tracked support task.',
    routeLabel: 'Open Bounties',
  },
  {
    activityKey: 'expeditions',
    label: 'Expeditions',
    roleSubtitle: 'Background shortage relief for herbs, ore, and doctrine support.',
    roleKind: 'background',
    activityMode: 'background',
    primaryOutputs: ['passive material yield', 'shortage smoothing'],
    primarySinksSupported: ['Apothecary', 'Forge', 'Manual Pavilion'],
    currentMilestoneRelevance: 'fallback',
    currentReason: 'Dispatch when a material gap can be filled while foreground work continues elsewhere.',
    routeLabel: 'Open Expeditions',
  },
  {
    activityKey: 'inventory',
    label: 'Inventory',
    roleSubtitle: 'Item ledger for purpose, source, sink, and preparation stock.',
    roleKind: 'ledger',
    activityMode: 'ledger',
    primaryOutputs: ['item purpose', 'provenance', 'current relevance'],
    primarySinksSupported: ['All resource decisions'],
    currentMilestoneRelevance: 'secondary',
    currentReason: 'Explains what each resource is for and where it should go next.',
    routeLabel: 'Open Inventory',
  },
  {
    activityKey: 'prestige',
    label: 'Prestige',
    roleSubtitle: 'Outer-loop reset and long-term acceleration, held until lifetime proof matters.',
    roleKind: 'meta',
    activityMode: 'meta',
    primaryOutputs: ['Ascension Points', 'future acceleration'],
    primarySinksSupported: ['next-life planning'],
    currentMilestoneRelevance: 'not_relevant',
    currentReason: 'Current milestone prep should be resolved before final AP timing advice.',
    routeLabel: 'Open Prestige',
  },
] as const;

const PUBLIC_COPY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bGate proof\b/gi, 'Gate catalyst'],
  [/\bProof Detail\b/gi, 'Gate details'],
  [/\bSource Thread\b/gi, 'Details'],
  [/\bCurrent Omen\b/gi, 'Current Bottleneck'],
  [/\bRecent Omens\b/gi, 'Recent Changes'],
  [/\bDao Mandate Interface\b/gi, 'Settings'],
];

function sanitizeMilestoneCopy(text: string): string {
  return PUBLIC_COPY_REPLACEMENTS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

function problemKindToBlockerType(kind: EconomicProblemKind): MilestoneBlockerType {
  switch (kind) {
    case 'belowHealingFloor':
    case 'belowSpecialtyFloor':
      return 'healing_floor';
    case 'belowCultivationPrepFloor':
    case 'missingGatePrepPackage':
      return 'medicine_pouch';
    case 'belowMinimumForgeFloor':
    case 'belowRecommendedForgeFloor':
      return 'gear_floor';
    case 'belowMeritReserve':
      return 'fail_safe';
    case 'belowSpiritStoneMinimum':
    case 'belowSpiritStoneIdeal':
      return 'currency_shortfall';
    case 'buildCorrectionGap':
      return 'technique_loadout';
    case 'missingCommonMaterial':
    case 'missingTargetedLocalMaterial':
      return 'material_shortfall';
    default:
      return 'unknown';
  }
}

function actionLabel(candidate: EconomicRecommendationCandidate): string {
  const label = getWorldModuleLabel(candidate.destinationModuleKey);
  switch (candidate.actionKind) {
    case 'buy':
      return `${label} - buy stock for the current gate`;
    case 'brew':
      return `${label} - brew missing preparation`;
    case 'farm_outskirts':
      return `${label} - gather gold and common materials`;
    case 'run_ruins':
      return `${label} - run targeted material support`;
    case 'launch_expedition':
      return `${label} - dispatch background shortage relief`;
    case 'claim_bounty':
      return `${label} - build support reserve`;
    case 'craft_forge':
      return `${label} - raise the Forge Floor`;
    case 'route_manual_pavilion':
      return `${label} - find a build-correction manual`;
    case 'attempt_gate':
      return `${label} - attempt when readiness is sufficient`;
    case 'hold_and_cultivate':
      return 'Cultivation - continue inner progress';
    default:
      return label;
  }
}

function expectedBenefitFor(problemKind: EconomicProblemKind): string {
  switch (problemKind) {
    case 'belowHealingFloor':
    case 'belowSpecialtyFloor':
      return 'Raises survival readiness through Healing Reserve and pouch stock.';
    case 'belowCultivationPrepFloor':
    case 'missingGatePrepPackage':
      return 'Completes the gate preparation package before the attempt.';
    case 'belowMinimumForgeFloor':
      return 'Raises the minimum Forge Floor required for the current gate.';
    case 'belowRecommendedForgeFloor':
      return 'Raises the recommended Forge Floor and improves the attempt margin.';
    case 'belowMeritReserve':
      return 'Builds Merit reserve for the Safety Net and support economy.';
    case 'belowSpiritStoneMinimum':
    case 'belowSpiritStoneIdeal':
      return 'Builds support currency reserve for bounded gate fallback costs.';
    case 'buildCorrectionGap':
      return 'Adds doctrine and technique options that can close a build/loadout gap.';
    case 'missingCommonMaterial':
      return 'Restores common materials needed by the next preparation action.';
    case 'missingTargetedLocalMaterial':
      return 'Restores the targeted local material needed by the current sink.';
    default:
      return 'Improves the current milestone readiness surface.';
  }
}

function detailForShortfall(shortfall: EconomicShortfall): string {
  return `${shortfall.label}: ${shortfall.currentValue}/${shortfall.targetValue}, gap ${shortfall.gap}.`;
}

function routeForModule(moduleKey: P3ModuleKey, reason: string, cityId: string | null): P3Route {
  return p3ModuleRoute(moduleKey, reason, cityId);
}

function candidateToSource(
  engine: EconomicRecommendationEngineResult,
  candidate: EconomicRecommendationCandidate,
): MilestoneSourceOptionSurface {
  const routeAction = routeForModule(
    candidate.destinationModuleKey,
    candidate.reasonSummary,
    candidate.destinationCityId ?? engine.snapshot.currentCityId,
  );
  return {
    moduleKey: candidate.destinationModuleKey,
    label: getWorldModuleLabel(candidate.destinationModuleKey),
    reason: candidate.reasonSummary,
    activityMode: candidate.activityMode,
    available: !candidate.blockedReason && routeAction.blocked !== true,
    blockedReason: candidate.blockedReason ?? routeAction.blockedReason ?? null,
    expectedYieldLabel: expectedBenefitFor(candidate.problemKind),
    routeAction,
  };
}

function bestSourceOptionToSource(
  engine: EconomicRecommendationEngineResult,
  option: BestSourceOption,
): MilestoneSourceOptionSurface {
  const routeAction = routeForModule(option.moduleKey, option.reason, option.cityId ?? engine.snapshot.currentCityId);
  return {
    moduleKey: option.moduleKey,
    label: getWorldModuleLabel(option.moduleKey),
    reason: option.shortReason || option.reason,
    activityMode: option.activityMode,
    available: option.currentCityEligible && routeAction.blocked !== true,
    blockedReason: option.currentCityEligible ? routeAction.blockedReason ?? null : option.currentCityEligibilityRule,
    expectedYieldLabel: option.routeDetail,
    routeAction,
  };
}

function fallbackForShortfall(
  engine: EconomicRecommendationEngineResult,
  shortfall: EconomicShortfall,
  bestSource: MilestoneSourceOptionSurface | null,
): MilestoneSourceOptionSurface | null {
  const relatedEntry = shortfall.relatedIds
    .map((id) => engine.snapshot.bestSourceIndex.entriesByTargetId[id])
    .find((entry) => Boolean(entry?.secondarySource));
  const fallback = relatedEntry?.secondarySource ?? null;
  if (fallback && fallback.moduleKey !== bestSource?.moduleKey) return bestSourceOptionToSource(engine, fallback);

  const problem = engine.perProblemRecommendations.find((entry) => entry.shortfall.id === shortfall.id);
  const alternate = problem?.candidates.find((candidate) => candidate.destinationModuleKey !== bestSource?.moduleKey) ?? null;
  return alternate ? candidateToSource(engine, alternate) : fallback ? bestSourceOptionToSource(engine, fallback) : null;
}

function bestSourceForShortfall(
  engine: EconomicRecommendationEngineResult,
  shortfall: EconomicShortfall,
): MilestoneSourceOptionSurface | null {
  const problem = engine.perProblemRecommendations.find((entry) => entry.shortfall.id === shortfall.id);
  const candidate = problem?.candidates.find((entry) => !entry.blockedReason) ?? problem?.candidates[0] ?? null;
  if (candidate) return candidateToSource(engine, candidate);

  const source = shortfall.relatedIds
    .map((id) => engine.snapshot.bestSourceIndex.entriesByTargetId[id])
    .find((entry) => Boolean(entry?.primarySource))
    ?.primarySource ?? null;
  return source ? bestSourceOptionToSource(engine, source) : null;
}

function shortfallToBlocker(
  engine: EconomicRecommendationEngineResult,
  shortfall: EconomicShortfall,
): MilestoneBlockerSurface {
  const bestSource = bestSourceForShortfall(engine, shortfall);
  const fallbackSource = fallbackForShortfall(engine, shortfall, bestSource);
  const routeAction = bestSource?.routeAction
    ?? routeForModule('cultivation', 'Review the current milestone before choosing another route.', engine.snapshot.currentCityId);
  const blockerType = problemKindToBlockerType(shortfall.problemKind);

  return {
    id: shortfall.id,
    blockerType,
    label: shortfall.label,
    reason: detailForShortfall(shortfall),
    currentValue: shortfall.currentValue,
    targetValue: shortfall.targetValue,
    gap: shortfall.gap,
    severity: shortfall.severity,
    requirementKind: shortfall.mandatoryBeforeNextGate ? 'hard_requirement' : 'recommended_prep',
    mandatoryBeforeNextGate: shortfall.mandatoryBeforeNextGate,
    bestSource,
    fallbackSource,
    routeAction,
    expectedBenefit: expectedBenefitFor(shortfall.problemKind),
    relatedIds: [...shortfall.relatedIds],
    relatedScreenModuleKey: bestSource?.moduleKey ?? null,
    detailsText: `${shortfall.mandatoryBeforeNextGate ? 'Required before the current gate' : 'Recommended preparation'}; ${expectedBenefitFor(shortfall.problemKind)}`,
    debug: {
      problemKind: shortfall.problemKind,
      spendPriorityId: shortfall.spendPriorityId,
      primaryRecommendedRouteKey: shortfall.primaryRecommendedRouteKey,
    },
  };
}

function candidateToAction(
  engine: EconomicRecommendationEngineResult,
  candidate: EconomicRecommendationCandidate,
  index: number,
): MilestoneActionSurface {
  const routeAction = routeForModule(
    candidate.destinationModuleKey,
    candidate.reasonSummary,
    candidate.destinationCityId ?? engine.snapshot.currentCityId,
  );
  return {
    id: `action-${index + 1}-${candidate.destinationModuleKey}-${candidate.problemKind}`,
    label: actionLabel(candidate),
    destinationModuleKey: candidate.destinationModuleKey,
    reason: candidate.reasonSummary,
    expectedBenefit: expectedBenefitFor(candidate.problemKind),
    activityMode: candidate.activityMode,
    routeAction,
    available: !candidate.blockedReason && routeAction.blocked !== true,
    blockedReason: candidate.blockedReason ?? routeAction.blockedReason ?? null,
    relatedIds: [...candidate.relatedIds],
    priorityBand: candidate.priorityBand,
  };
}

function buildRecommendedPrep(blockers: readonly MilestoneBlockerSurface[]): MilestonePrepSurface[] {
  return blockers
    .filter((blocker) => blocker.requirementKind === 'recommended_prep')
    .slice(0, 3)
    .map((blocker) => ({
      id: `prep-${blocker.id}`,
      label: blocker.label,
      blockerType: blocker.blockerType,
      currentValue: blocker.currentValue,
      targetValue: blocker.targetValue,
      expectedBenefit: blocker.expectedBenefit,
      routeAction: blocker.routeAction,
    }));
}

function buildSafetyNet(engine: EconomicRecommendationEngineResult): MilestoneSafetyNetSurface | null {
  const support = engine.snapshot.supportEconomy;
  if (!support.nextGateTrialId) return null;
  return {
    label: 'Safety Net',
    reserveStatus: support.reserveStatus,
    currentMerit: support.currentMerit,
    targetMeritReserve: support.targetMeritReserve,
    currentSpiritStones: support.currentSpiritStones,
    spiritStoneMinimumReserve: support.spiritStoneMinimumReserve,
    failSafeThreshold: support.failSafeThreshold,
    failSafeAffordableNow: support.failSafeAffordableNow,
    expectedMeritAfterThreeEligibleDefeats: support.expectedMeritAfterThreeEligibleDefeats,
    routeAction: routeForModule('bounties', 'Build Merit and support reserves for the Safety Net.', engine.snapshot.currentCityId),
    reason: 'Merit and support currency keep the Safety Net honest without changing combat ownership.',
  };
}

function resourceKindFor(id: string): ResourceProvenanceSurfaceV1['kind'] | null {
  if (id === 'gold' || id === 'spiritStones') return 'currency';
  if (id === 'merit') return 'merit';
  if (id.startsWith('frag_') || id.includes('fragment')) return 'fragment';
  if (id.startsWith('manual_')) return 'manual';
  if (id === 'weapon' || id === 'accessory' || id === 'temper' || id === 'runes') return null;
  return 'item';
}

function buildSourceSinkHighlights(
  engine: EconomicRecommendationEngineResult,
  blockers: readonly MilestoneBlockerSurface[],
): SourceSinkHighlightSurface[] {
  const ids = [...new Set(blockers.flatMap((blocker) => blocker.relatedIds))].slice(0, 8);
  return ids.flatMap((id) => {
    const kind = resourceKindFor(id);
    if (!kind) return [];
    const provenance = buildResourceProvenanceSurface({
      content: engine.snapshot.content,
      id,
      kind,
      currentCityId: engine.snapshot.currentCityId,
      currentShortageIds: blockers.flatMap((blocker) => blocker.relatedIds),
      quantity: ['gold', 'merit', 'spiritStones'].includes(id)
        ? Number(engine.snapshot.currencies[id as keyof typeof engine.snapshot.currencies] ?? 0)
        : engine.snapshot.ownedItemCountsById[id] ?? 0,
    });
    return [{
      id: provenance.id,
      label: provenance.displayName,
      kind: provenance.kind,
      purpose: sanitizeMilestoneCopy(provenance.purpose.explanation),
      currentRelevance: sanitizeMilestoneCopy(provenance.currentGateRelevance.line),
      bestSourceLabel: provenance.sourceTags[0]?.label ?? null,
      bestSinkLabel: provenance.sinkTags[0]?.label ? sanitizeMilestoneCopy(provenance.sinkTags[0].label) : null,
      routeAction: provenance.bestSourceRoute ?? provenance.bestSinkRoute ?? null,
    }];
  });
}

function failureDestinationToModule(destination: FailureFixDestination): P3ModuleKey {
  switch (destination) {
    case 'cultivation':
      return 'cultivation';
    case 'techniques':
      return 'techniques';
    case 'forge':
      return 'forge';
    case 'apothecary':
    case 'medicine_pouch':
      return 'apothecary';
    case 'trial':
      return 'gateTrial';
    default:
      return 'techniques';
  }
}

function buildFailureDiagnosisSurface(
  engine: EconomicRecommendationEngineResult,
  failureDiagnosis: FailureDiagnosis | null | undefined,
): MilestoneFailureDiagnosisSurface | null {
  if (!failureDiagnosis) return null;
  return {
    headline: 'Recent failure has a ranked top fix.',
    primary: failureDiagnosis.primary,
    secondary: failureDiagnosis.secondary,
    reasons: [...failureDiagnosis.reasons],
    topFixes: failureDiagnosis.topFixes.map((fix) => {
      const moduleKey = failureDestinationToModule(fix.destination);
      return {
        label: fix.reason,
        destinationModuleKey: moduleKey,
        reason: fix.reason,
        routeAction: routeForModule(moduleKey, fix.reason, engine.snapshot.currentCityId),
      };
    }),
  };
}

function getCityName(engine: EconomicRecommendationEngineResult): string | null {
  const currentCityId = engine.snapshot.currentCityId;
  return currentCityId ? engine.snapshot.content.cities.find((city) => city.id === currentCityId)?.name ?? null : null;
}

function milestoneStatus(engine: EconomicRecommendationEngineResult, readiness?: GateReadinessResult | null): MilestoneStatus {
  if (engine.snapshot.atContentCap) return 'capped';
  if (engine.snapshot.currentGateResolved && engine.orderedShortfalls.length === 0) return 'cleared';
  if (readiness?.overallBand === 'recommended_met' || engine.readinessBand === 'recommended_met') return 'ready';
  if (engine.orderedShortfalls.length > 0) return 'blocked';
  return 'in_progress';
}

function buildMilestoneSummary(
  engine: EconomicRecommendationEngineResult,
  targetRealmName: string | null,
  status: MilestoneStatus,
): string {
  if (status === 'capped') return 'Live content cap reached; preserve progress for the next release slice.';
  if (status === 'ready') return `${targetRealmName ?? 'Next realm'} gate readiness is sufficient for a measured attempt.`;
  const top = engine.orderedShortfalls[0];
  if (top) return `${targetRealmName ?? 'Next realm'} milestone is gated by ${top.label.toLowerCase()}.`;
  return `${targetRealmName ?? 'Next realm'} milestone is in progress.`;
}

function buildMilestoneRoles(
  engine: EconomicRecommendationEngineResult,
  currentBlocker: MilestoneBlockerSurface | null,
): ModuleRoleHighlightSurface[] {
  const summaryByModule = Object.fromEntries(engine.moduleSummaries.map((summary) => [summary.moduleKey, summary]));
  const primaryModule = currentBlocker?.bestSource?.moduleKey ?? engine.topRecommendation?.destinationModuleKey ?? null;
  return ROLE_ENTRIES.map((entry) => {
    const moduleSummary = summaryByModule[entry.activityKey as LiveWorldModuleKey] ?? null;
    const currentMilestoneRelevance: MilestoneRelevance = entry.activityKey === primaryModule
      ? 'primary'
      : moduleSummary
        ? moduleSummary.weight === 'primary' ? 'primary' : moduleSummary.weight === 'secondary' ? 'secondary' : 'fallback'
        : entry.currentMilestoneRelevance;
    return {
      ...entry,
      currentMilestoneRelevance,
      currentReason: moduleSummary?.whyItMatters ?? entry.currentReason,
    };
  });
}

export function getMilestoneActivityRoleEntries(): ModuleRoleHighlightSurface[] {
  return ROLE_ENTRIES.map((entry) => ({ ...entry, primaryOutputs: [...entry.primaryOutputs], primarySinksSupported: [...entry.primarySinksSupported], details: entry.details ? [...entry.details] : undefined }));
}

export function buildMilestoneReadinessSurface(input: {
  engine: EconomicRecommendationEngineResult;
  gateReadiness?: GateReadinessResult | null;
  failureDiagnosis?: FailureDiagnosis | null;
  currentSubstageLabel?: string;
  generatedAtMs?: number;
}): MilestoneReadinessSurfaceV1 {
  const { engine } = input;
  const currentRealm = getLiveRealmByIndex(engine.snapshot.currentRealmIndex);
  const targetTransition = engine.snapshot.phase.nextUnresolvedGateTransition;
  const targetRealm = targetTransition ? getLiveRealmById(targetTransition.toRealmId) : null;
  const gate = targetTransition ? engine.snapshot.content.trials.find((trial) => trial.id === targetTransition.trialId) ?? null : null;
  const blockers = engine.orderedShortfalls.map((shortfall) => shortfallToBlocker(engine, shortfall));
  const bestActions = engine.topRouteCandidates.map((candidate, index) => candidateToAction(engine, candidate, index));
  const currentBlocker = blockers[0] ?? null;
  const status = milestoneStatus(engine, input.gateReadiness ?? null);
  const sourceModules = [...new Set(bestActions.map((action) => action.destinationModuleKey))];
  const unresolvedDataGaps = blockers
    .filter((blocker) => !blocker.bestSource)
    .map((blocker) => `${blocker.id}: no best source resolved`);

  return {
    schemaVersion: 'milestone-readiness-surface-v1',
    generatedAtMs: input.generatedAtMs ?? Date.now(),
    currentCityId: engine.snapshot.currentCityId,
    currentCityName: getCityName(engine),
    currentRealmId: currentRealm.id,
    currentRealmName: currentRealm.name,
    currentSubstageLabel: input.currentSubstageLabel ?? `Gate ${engine.snapshot.currentGateIndex} edge`,
    currentMilestone: {
      id: targetTransition?.id ?? (engine.snapshot.atContentCap ? 'content-cap' : 'current-cultivation'),
      label: targetRealm ? `${targetRealm.name} Gate` : engine.snapshot.atContentCap ? 'Live Content Cap' : 'Current Cultivation Milestone',
      targetRealmId: targetRealm?.id ?? null,
      targetRealmName: targetRealm?.name ?? null,
      gateId: gate?.id ?? targetTransition?.trialId ?? null,
      gateLabel: gate?.name ?? (targetRealm ? `${targetRealm.name} Gate Trial` : null),
      status,
      summary: buildMilestoneSummary(engine, targetRealm?.name ?? null, status),
    },
    currentBlocker,
    blockers,
    bestActions,
    recommendedPrep: buildRecommendedPrep(blockers),
    safetyNet: buildSafetyNet(engine),
    failureDiagnosis: buildFailureDiagnosisSurface(engine, input.failureDiagnosis),
    sourceSinkHighlights: buildSourceSinkHighlights(engine, blockers),
    moduleRoleHighlights: buildMilestoneRoles(engine, currentBlocker),
    debug: {
      sourceModules,
      notes: [
        `economicReadinessBand=${engine.readinessBand}`,
        `majorShortfallCount=${engine.majorShortfallCount}`,
      ],
      unresolvedDataGaps,
    },
  };
}

function defaultRoute(surface: MilestoneReadinessSurfaceV1): P3Route {
  return surface.currentBlocker?.routeAction ?? p3ModuleRoute('cultivation', 'Continue cultivation toward the current milestone.');
}

export function buildMilestoneReadinessScreenGuidance(
  surface: MilestoneReadinessSurfaceV1,
): MilestoneReadinessScreenGuidance {
  const blocker = surface.currentBlocker;
  const route = defaultRoute(surface);
  const blockerLabel = blocker?.label ?? 'No current blocker';
  const routeLabel = route.label;
  return {
    status: {
      headline: surface.currentMilestone.label,
      summary: blocker ? `${blocker.label}. Best Source: ${routeLabel}.` : surface.currentMilestone.summary,
      primaryBlockerId: blocker?.id ?? null,
      primaryRoute: route,
      details: [
        surface.currentMilestone.summary,
        blocker?.detailsText ?? 'Current milestone has no ranked blocker.',
      ],
    },
    cultivation: {
      headline: 'Current Bottleneck',
      summary: blocker ? `${blockerLabel}. ${routeLabel} can help before the next gate.` : surface.currentMilestone.summary,
      primaryBlockerId: blocker?.id ?? null,
      primaryRoute: route,
      details: blocker ? [blocker.expectedBenefit] : [surface.currentMilestone.summary],
    },
    gateTrial: {
      headline: 'Gate Readiness',
      summary: blocker ? `Top Fix: ${routeLabel} - ${blocker.expectedBenefit}` : 'Readiness is sufficient for a measured gate attempt.',
      primaryBlockerId: blocker?.id ?? null,
      primaryRoute: route,
      details: [
        surface.safetyNet?.reason ?? 'Safety Net has no active gate context.',
        blocker?.detailsText ?? surface.currentMilestone.summary,
      ],
    },
    world: {
      headline: 'Recommended City Service',
      summary: surface.bestActions[0]
        ? `${surface.bestActions[0].label}: ${surface.bestActions[0].expectedBenefit}`
        : surface.currentMilestone.summary,
      primaryBlockerId: blocker?.id ?? null,
      primaryRoute: route,
      recommendedModuleKey: surface.bestActions[0]?.destinationModuleKey ?? blocker?.bestSource?.moduleKey ?? null,
      details: surface.bestActions.slice(0, 3).map((action) => action.reason),
    },
  };
}
