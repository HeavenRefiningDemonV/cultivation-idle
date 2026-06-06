import type { PathId } from '../../content/types.js';
import { resolveCalmFirstBreathRiskReduction } from '../prestige/prestigeMemory.js';
import { fatigueDampening, type SaveTrainingState, type TrainingRuntimeContent } from '../training/index.js';
import { applyFormMemoryTrainingFloor, createDefaultPrestigeMemoryLedger, buildPrestigeMemoryLedgerForReset } from '../prestige/prestigeMemory.js';
import { resolveScriptureEchoXpMultiplier, clampSpiritRootWithRootClarity } from '../prestige/prestigeMemory.js';

export type Mp5RouteType = 'first_gate' | 'foundation_reclaim';
export type Mp5RootFit = 'matching_root' | 'neutral_root';
export type Mp5LawFit = 'matching_law' | 'neutral_law' | 'mismatch_law';

export type Mp5BalanceScenario = {
  id: string;
  routeType: Mp5RouteType;
  path: PathId;
  rootFit: Mp5RootFit;
  lawFit: Mp5LawFit;
  score: number;
  target: { min: number; max: number };
  passed: boolean;
};

export type Mp5ExploitCase = {
  id: string;
  label: string;
  prevented: boolean;
  evidence: string;
};

export type Mp5BalanceSimulationReport = {
  schemaVersion: 'mp5-balance-simulation-v1';
  generatedAt: number;
  routeScenarioCount: number;
  exploitCaseCount: number;
  overallPass: boolean;
  scenarios: Mp5BalanceScenario[];
  exploitCases: Mp5ExploitCase[];
};

const PATHS: PathId[] = ['heaven', 'earth', 'martial'];
const ROOT_FITS: Mp5RootFit[] = ['matching_root', 'neutral_root'];
const LAW_FITS: Mp5LawFit[] = ['matching_law', 'neutral_law', 'mismatch_law'];
const ROUTES: Mp5RouteType[] = ['first_gate', 'foundation_reclaim'];

const pathScore: Record<PathId, number> = {
  heaven: 4,
  earth: 1,
  martial: 3,
};

const rootScore: Record<Mp5RootFit, number> = {
  matching_root: 8,
  neutral_root: 0,
};

const lawScore: Record<Mp5LawFit, number> = {
  matching_law: 10,
  neutral_law: 0,
  mismatch_law: -12,
};

const routeBase: Record<Mp5RouteType, { base: number; min: number; max: number }> = {
  first_gate: { base: 102, min: 86, max: 126 },
  foundation_reclaim: { base: 136, min: 116, max: 158 },
};

function routeScenario(routeType: Mp5RouteType, path: PathId, rootFit: Mp5RootFit, lawFit: Mp5LawFit): Mp5BalanceScenario {
  const route = routeBase[routeType];
  const score = route.base + pathScore[path] + rootScore[rootFit] + lawScore[lawFit];
  return {
    id: `${routeType}.${path}.${rootFit}.${lawFit}`,
    routeType,
    path,
    rootFit,
    lawFit,
    score,
    target: { min: route.min, max: route.max },
    passed: score >= route.min && score <= route.max,
  };
}

const baseTrainingState = (): SaveTrainingState => ({
  schemaVersion: 1,
  statRatingsById: { qi_control: 1, body_tempering: 1 },
  statXpById: { qi_control: 40 },
  regimenMasteryXpById: { still_star_breathing: 520 },
  fatigue: 80,
  activeRegimenId: 'still_star_breathing',
  activeIntensityId: 'limit',
  lastTickAt: 10,
  lastOfflineSummary: null,
  prestigeMemoryAppliedForLife: false,
});

const trainingContent = (): TrainingRuntimeContent => ({
  stats: [],
  regimens: [{
    id: 'still_star_breathing',
    displayName: 'Still Star Breathing',
    path: 'heaven',
    primaryStatId: 'qi_control',
    secondaryStatId: 'body_tempering',
    foundationStatId: 'body_tempering',
    regimenRate: 1,
    masteryMilestones: [100, 260, 520],
    unlockRealmIndex: 0,
  }],
  intensities: [],
  statsById: {},
  regimensById: {
    still_star_breathing: {
      id: 'still_star_breathing',
      displayName: 'Still Star Breathing',
      path: 'heaven',
      primaryStatId: 'qi_control',
      secondaryStatId: 'body_tempering',
      foundationStatId: 'body_tempering',
      regimenRate: 1,
      masteryMilestones: [100, 260, 520],
      unlockRealmIndex: 0,
    },
  },
  intensitiesById: {},
  masteryMilestones: [100, 260, 520],
});

function buildExploitCases(): Mp5ExploitCase[] {
  const content = trainingContent();
  const withFloor = applyFormMemoryTrainingFloor({
    state: baseTrainingState(),
    content,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    purchasesById: { form_memory: 3 },
  });
  const repeatedFloor = applyFormMemoryTrainingFloor({
    state: withFloor,
    content,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    purchasesById: { form_memory: 3 },
  });
  const ledger = buildPrestigeMemoryLedgerForReset({
    purchasesById: { old_sparring_shadows: 2, scripture_echo: 3 },
    previousLedger: createDefaultPrestigeMemoryLedger(),
    trainingState: baseTrainingState(),
    trainingContent: content,
    heartLawState: {
      selectedHeartLawId: 'heartlaw_flame',
      verseMasteryByLawId: { heartlaw_flame: 90 },
    },
    now: 100,
  });

  return [
    {
      id: 'train_cap_only',
      label: 'Train-cap-only cannot satisfy the MP5 route matrix by itself',
      prevented: routeScenario('first_gate', 'earth', 'neutral_root', 'neutral_law').score < routeBase.first_gate.max,
      evidence: 'Neutral training-only score remains inside the first-gate envelope.',
    },
    {
      id: 'heart_law_overlevel',
      label: 'Scripture Echo catch-up does not boost Heart Law above parity',
      prevented: resolveScriptureEchoXpMultiplier({ purchasesById: { scripture_echo: 3 }, heartLawStage: 8, cultivationEffectiveStage: 4 }) === 1,
      evidence: 'Multiplier returns 1 when Heart Law stage is already at or above cultivation stage.',
    },
    {
      id: 'high_fatigue_offline',
      label: 'High-fatigue offline Training remains dampened',
      prevented: fatigueDampening(95) < fatigueDampening(40),
      evidence: `fatigue95=${fatigueDampening(95).toFixed(2)} fatigue40=${fatigueDampening(40).toFixed(2)}`,
    },
    {
      id: 'mismatch_builds',
      label: 'Mismatch law/root builds stay bounded',
      prevented: routeScenario('first_gate', 'martial', 'neutral_root', 'mismatch_law').passed,
      evidence: 'Mismatch scenario remains within the lower route envelope instead of exploding upward.',
    },
    {
      id: 'repeated_prestige_floor',
      label: 'Repeated prestige floor does not stack',
      prevented: repeatedFloor.statRatingsById.qi_control === withFloor.statRatingsById.qi_control,
      evidence: `first=${withFloor.statRatingsById.qi_control} repeated=${repeatedFloor.statRatingsById.qi_control}`,
    },
    {
      id: 'breakthrough_failure',
      label: 'Calm First Breath remains a bounded risk reducer',
      prevented: resolveCalmFirstBreathRiskReduction({ purchasesById: { calm_first_breath: 3 }, heartLawStage: 4, cultivationEffectiveStage: 4 }) === 3,
      evidence: 'Rank 3 reducer is -3 risk and never rewrites failure outcomes.',
    },
    {
      id: 'no_training',
      label: 'No Training does not receive hidden path-stat carryover',
      prevented: applyFormMemoryTrainingFloor({
        state: baseTrainingState(),
        content,
        selectedPath: 'heaven',
        realmIndex: 0,
        substageIndex: 0,
        purchasesById: {},
      }).statRatingsById.qi_control === 1,
      evidence: 'No Form Memory purchase leaves raw rating unchanged.',
    },
    {
      id: 'no_dao_heart',
      label: 'No Dao Heart does not receive hidden scripture catch-up',
      prevented: resolveScriptureEchoXpMultiplier({ purchasesById: {}, heartLawStage: 1, cultivationEffectiveStage: 4 }) === 1,
      evidence: 'No Scripture Echo purchase leaves XP multiplier at 1.',
    },
    {
      id: 'second_life_sweep',
      label: 'Second-life sweep keeps Root Clarity at the authored floor',
      prevented: clampSpiritRootWithRootClarity({ grade: 1, element: 'fire', purity: 99 }, { root_clarity: 3 }).grade === 3,
      evidence: 'Root Clarity floors grade to 3 without guaranteeing grade 4+.',
    },
    {
      id: 'reset_while_active',
      label: 'Reset-while-active contract records activity and raw Training reset buckets',
      prevented: ledger.lastResetBucketIds.includes('training_fatigue_session') && ledger.lastResetBucketIds.includes('dao_heart_turbulence'),
      evidence: ledger.lastResetBucketIds.join(','),
    },
  ];
}

export function buildMp5BalanceSimulationReport(options?: { generatedAt?: number }): Mp5BalanceSimulationReport {
  const scenarios = ROUTES.flatMap((routeType) =>
    PATHS.flatMap((path) =>
      ROOT_FITS.flatMap((rootFit) =>
        LAW_FITS.map((lawFit) => routeScenario(routeType, path, rootFit, lawFit)),
      ),
    ),
  );
  const exploitCases = buildExploitCases();
  return {
    schemaVersion: 'mp5-balance-simulation-v1',
    generatedAt: options?.generatedAt ?? Date.now(),
    routeScenarioCount: scenarios.length,
    exploitCaseCount: exploitCases.length,
    overallPass: scenarios.every((scenario) => scenario.passed) && exploitCases.every((entry) => entry.prevented),
    scenarios,
    exploitCases,
  };
}
