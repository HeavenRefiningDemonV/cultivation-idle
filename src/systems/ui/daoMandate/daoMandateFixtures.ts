import { applyDaoMandateVisibility, getDefaultDaoMandateGuidanceProfile } from './daoMandateVisibility.js';
import type {
  DaoMandateGuidanceProfile,
  DaoMandateObstruction,
  DaoMandateRoute,
  DaoMandateState,
  DaoMandateSurfaceV1,
  DaoMandateTone,
  DaoReadinessLedger,
  DaoRecentOmen,
  DaoRequirementBucket,
  DaoRequirementLedger,
  DaoRequirementRow,
  DaoRequirementState,
  DaoReincarnationCounselSurface,
  DaoSafetyNetSurface,
  DaoSourceMapEntry,
} from './daoMandateTypes.js';

export const DAO_MANDATE_FIXTURE_STATES = [
  'life_setup',
  'cultivating_qi_short',
  'attemptable_gate',
  'gate_failed',
  'breakthrough_pending',
  'content_cap_prestige_recommended',
] as const;

export type DaoMandateFixtureState = typeof DAO_MANDATE_FIXTURE_STATES[number];

const GENERATED_AT = 1_777_000;
const CITY_ID = 'city_pinewind_hamlet';

function route(overrides: Partial<DaoMandateRoute>): DaoMandateRoute {
  const base: DaoMandateRoute = {
    id: 'fixture-route',
    label: 'Review Status',
    actionLabel: 'Open Status',
    detail: 'Review the current run state.',
    destinationLabel: 'Status',
    target: { kind: 'tab', tab: 'status' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'fixture',
    priority: 50,
  };
  return { ...base, ...overrides };
}

function row(overrides: Partial<DaoRequirementRow> & { id: string; bucket: DaoRequirementBucket; label: string; detail: string }): DaoRequirementRow {
  return {
    id: overrides.id,
    bucket: overrides.bucket,
    label: overrides.label,
    detail: overrides.detail,
    currentLabel: overrides.currentLabel ?? null,
    targetLabel: overrides.targetLabel ?? null,
    state: overrides.state ?? 'partial',
    tone: overrides.tone ?? 'info',
    route: overrides.route ?? null,
    source: overrides.source ?? 'fixture',
    proofLine: overrides.proofLine ?? 'Source: Dao Mandate fixture',
    sourceLine: overrides.sourceLine ?? null,
    priority: overrides.priority ?? 50,
  };
}

function ledger(rows: DaoRequirementRow[]): DaoRequirementLedger {
  return {
    hardGates: rows.filter((entry) => entry.bucket === 'hard_gate'),
    readinessFloors: rows.filter((entry) => entry.bucket === 'readiness_floor'),
    supportReserves: rows.filter((entry) => entry.bucket === 'support_reserve'),
    sourceRoutes: rows.filter((entry) => entry.bucket === 'source_route'),
    optionalOptimizations: rows.filter((entry) => entry.bucket === 'optional_optimization'),
    recentOmens: rows.filter((entry) => entry.bucket === 'recent_omen'),
  };
}

function readiness(overrides: Partial<DaoReadinessLedger> = {}): DaoReadinessLedger {
  return {
    score: null,
    label: 'Not scored',
    band: null,
    diagnosisLabel: null,
    primaryShortfallLabel: null,
    rows: [],
    confidence: 'high',
    ...overrides,
  };
}

function obstruction(args: {
  kind: DaoMandateObstruction['kind'];
  label: string;
  detail: string;
  severity?: DaoMandateObstruction['severity'];
  source?: DaoMandateObstruction['source'];
  tone?: DaoMandateTone;
}): DaoMandateObstruction {
  return {
    kind: args.kind,
    label: args.label,
    detail: args.detail,
    severity: args.severity ?? (args.tone === 'success' ? 'success' : 'warning'),
    source: args.source ?? 'fixture',
    confidence: 'high',
    evidenceIds: [`fixture.${args.kind}`],
  };
}

function sourceMapFromRoute(routeEntry: DaoMandateRoute, neededThingLabel: string): DaoSourceMapEntry {
  return {
    id: `fixture-source-${routeEntry.id}`,
    neededThingLabel,
    neededThingId: null,
    problemKind: null,
    sinkLabel: 'Next gate preparation',
    expectedImpactLabel: routeEntry.expectedDeltaLabel,
    bestSources: [{
      id: `fixture-source-option-${routeEntry.id}`,
      label: routeEntry.label,
      detail: routeEntry.detail,
      route: routeEntry,
      lockedReason: routeEntry.blocked ? routeEntry.blockedReason ?? 'Route is blocked.' : null,
      activityMode: 'active',
      confidence: 'high',
    }],
    fallbackSources: [],
    route: routeEntry,
  };
}

function baseSurface(args: {
  stateId: DaoMandateFixtureState;
  milestoneState: DaoMandateState;
  milestoneLabel: string;
  milestoneDetail: string;
  obstruction: DaoMandateObstruction;
  primaryRoute: DaoMandateRoute;
  rows: DaoRequirementRow[];
  readiness?: DaoReadinessLedger;
  secondaryRoutes?: DaoMandateRoute[];
  sourceMap?: DaoSourceMapEntry[];
  safetyNet?: DaoSafetyNetSurface | null;
  prestige?: DaoReincarnationCounselSurface | null;
  recentOmens?: DaoRecentOmen[];
  nextRealmLabel?: string | null;
}): DaoMandateSurfaceV1 {
  const fixtureLedger = ledger(args.rows);
  return {
    meta: {
      version: 1,
      generatedAt: GENERATED_AT,
      mode: 'fixture',
      guidanceProfile: 'jade',
      confidence: 'high',
      sourceIds: ['fixture'],
      debugNotes: [`Dao Mandate fixture: ${args.stateId}`],
    },
    milestone: {
      id: `fixture:${args.stateId}`,
      label: args.milestoneLabel,
      detail: args.milestoneDetail,
      state: args.milestoneState,
      currentRealmLabel: 'Qi Condensation',
      nextRealmLabel: args.nextRealmLabel ?? 'Foundation Establishment',
      currentCityId: CITY_ID,
      currentCityName: 'Pinewind Hamlet',
      chapterLine: 'Fixture city: Pinewind Hamlet',
    },
    obstruction: args.obstruction,
    primaryRoute: args.primaryRoute,
    secondaryRoutes: args.secondaryRoutes ?? [],
    requirementLedger: fixtureLedger,
    readiness: args.readiness ?? readiness(),
    sourceMap: args.sourceMap ?? [],
    currentWork: {
      foreground: {
        label: 'Fixture foreground',
        detail: 'Fixture surfaces do not read runtime stores.',
        tone: 'muted',
        route: null,
      },
      activeCombat: null,
      trackedBounty: null,
      expeditions: null,
      queues: [],
    },
    backgroundPlan: {
      idleSlotCount: null,
      adviceLabel: 'Fixture background routes',
      adviceDetail: 'Future renderers can show secondary support without changing the primary route.',
      routes: args.secondaryRoutes?.slice(0, 2) ?? [],
      offlineProjectionLabel: null,
    },
    safetyNet: args.safetyNet ?? null,
    prestige: args.prestige ?? null,
    recentOmens: args.recentOmens ?? [],
    lessonSlips: [{
      id: `fixture-slip-${args.stateId}`,
      title: 'Mandate context',
      detail: 'Fixture-only lesson slip for density and profile tests.',
      trigger: args.obstruction.kind,
      relatedRowId: args.rows[0]?.id ?? null,
      route: args.primaryRoute,
      profile: 'jade',
    }],
    localLens: null,
  };
}

function lifeSetupFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-life-setup-cultivation',
    label: 'Choose Path',
    actionLabel: 'Open Cultivation',
    detail: 'Choose a cultivation path before treating gate preparation as stable.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    source: 'progression',
    priority: 1,
  });
  const primaryObstruction = obstruction({
    kind: 'life_setup_missing_path',
    label: 'Path is not selected',
    detail: 'Choose a cultivation path before pushing the first gate.',
    source: 'progression',
  });
  return baseSurface({
    stateId: 'life_setup',
    milestoneState: 'life_setup',
    milestoneLabel: 'Choose your Path',
    milestoneDetail: 'A cultivation path anchors the first life.',
    obstruction: primaryObstruction,
    primaryRoute,
    rows: [
      row({
        id: 'fixture-life-setup-path',
        bucket: 'hard_gate',
        label: 'Choose Path',
        detail: 'A Path must be selected before gate guidance is meaningful.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 1,
      }),
    ],
    readiness: readiness({ label: 'Setup pending', score: null, confidence: 'high' }),
    sourceMap: [],
    recentOmens: [],
  });
}

function cultivatingQiFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-cultivate-qi',
    label: 'Cultivate Qi',
    actionLabel: 'Open Cultivation',
    detail: 'Refine Qi until the next gate threshold opens.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    expectedDeltaLabel: 'Qi and substage progress increase.',
    source: 'progression',
    priority: 20,
  });
  const apothecaryRoute = route({
    id: 'fixture-background-apothecary',
    label: 'Restock Medicine',
    actionLabel: 'Open Apothecary',
    detail: 'Prepare medicine while Qi rises.',
    destinationLabel: 'Apothecary',
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey: 'apothecary' },
    expectedDeltaLabel: 'Medicine reserve improves.',
    source: 'economy',
    priority: 60,
  });
  return baseSurface({
    stateId: 'cultivating_qi_short',
    milestoneState: 'cultivating',
    milestoneLabel: 'Reach Foundation Establishment',
    milestoneDetail: 'Need more Qi before the gate threshold opens.',
    obstruction: obstruction({
      kind: 'breakthrough_qi_short',
      label: 'Qi is short',
      detail: 'Need more Qi before the breakthrough threshold.',
      source: 'progression',
    }),
    primaryRoute,
    secondaryRoutes: [apothecaryRoute],
    sourceMap: [sourceMapFromRoute(apothecaryRoute, 'Medicine reserve')],
    rows: [
      row({
        id: 'fixture-qi-threshold',
        bucket: 'hard_gate',
        label: 'Qi threshold',
        detail: 'Qi must reach the next breakthrough requirement.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 1,
      }),
      row({
        id: 'fixture-background-apothecary-row',
        bucket: 'support_reserve',
        label: 'Medicine reserve',
        detail: 'Medicine support can run while cultivation remains primary.',
        state: 'partial',
        tone: 'info',
        route: apothecaryRoute,
        source: 'economy',
        priority: 40,
      }),
    ],
    readiness: readiness({
      label: 'Cultivating',
      rows: [{
        id: 'fixture-qi-row',
        label: 'Qi threshold',
        detail: 'Qi is below the threshold.',
        currentLabel: 'Short',
        targetLabel: 'Threshold',
        tone: 'warning',
        source: 'readiness',
        route: primaryRoute,
      }],
    }),
  });
}

function attemptableGateFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-attempt-gate',
    label: 'Attempt Gate Trial',
    actionLabel: 'Attempt Gate Trial',
    detail: 'Minimum gate requirements are met. Challenge the threshold.',
    destinationLabel: 'Gate Trial',
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey: 'gateTrial' },
    expectedDeltaLabel: 'Gate result updates.',
    source: 'trial_lifecycle',
    priority: 10,
  });
  return baseSurface({
    stateId: 'attemptable_gate',
    milestoneState: 'attemptable',
    milestoneLabel: 'Resolve Novice Clearing',
    milestoneDetail: 'Minimum gate requirements are met.',
    obstruction: obstruction({
      kind: 'attempt_gate_now',
      label: 'Gate can be attempted',
      detail: 'Minimum gate conditions are satisfied.',
      severity: 'success',
      source: 'trial_lifecycle',
      tone: 'success',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'fixture-gate-available',
        bucket: 'hard_gate',
        label: 'Gate state: Novice Clearing',
        detail: 'Novice Clearing is available for an attempt.',
        currentLabel: 'Available',
        targetLabel: 'Attemptable',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'trial_lifecycle',
        priority: 1,
      }),
      row({
        id: 'fixture-attempt-now',
        bucket: 'optional_optimization',
        label: 'Attempt now',
        detail: 'No hard gate is blocking the attempt.',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'trial_lifecycle',
        priority: 2,
      }),
    ],
    readiness: readiness({
      score: 74,
      label: 'Viable',
      band: 'minimum_met_below_recommended',
      diagnosisLabel: 'Underprepared',
      rows: [{
        id: 'fixture-gate-readiness',
        label: 'Gate readiness',
        detail: 'Minimum floor is met; recommended floor can still improve.',
        currentLabel: 'Minimum met',
        targetLabel: 'Recommended',
        tone: 'info',
        source: 'readiness',
        route: null,
      }],
    }),
  });
}

function gateFailedFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-failure-forge',
    label: 'Refine the Forge Floor',
    actionLabel: 'Open Forge',
    detail: 'The last gate rejection exposed an underforged weapon or floor.',
    destinationLabel: 'Forge',
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey: 'forge' },
    expectedDeltaLabel: 'Forge floor rises before the next attempt.',
    source: 'readiness',
    priority: 20,
  });
  const safetyRoute = route({
    id: 'fixture-safety-net',
    label: 'Review Safety Net',
    actionLabel: 'Open Gate Trial',
    detail: 'Eligible defeats are progressing toward Merit support.',
    destinationLabel: 'Gate Trial',
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey: 'gateTrial' },
    source: 'trial_lifecycle',
    priority: 50,
  });
  const omen: DaoRecentOmen = {
    id: 'fixture-gate-defeat',
    source: 'failure_reflection',
    timestamp: GENERATED_AT - 10,
    tone: 'warning',
    label: 'Gate rejection recorded',
    detail: 'The previous attempt fell short at the forge floor.',
    memoryLine: 'Gate rejection recorded: refine the Forge floor before retrying.',
    rewardSummary: null,
    readinessDeltaLabel: 'Forge shortfall exposed',
  };
  return baseSurface({
    stateId: 'gate_failed',
    milestoneState: 'gate_failed',
    milestoneLabel: 'Recover for Novice Clearing',
    milestoneDetail: 'The last gate attempt exposed a corrective route.',
    obstruction: obstruction({
      kind: 'gate_recent_failure',
      label: 'Recent gate rejection',
      detail: 'Correct the strongest failure pattern before retrying.',
      source: 'readiness',
    }),
    primaryRoute,
    secondaryRoutes: [safetyRoute],
    safetyNet: {
      state: 'progressing',
      label: 'Safety Net reserve',
      detail: 'Eligible defeats are being counted for Merit support.',
      progressLine: 'Eligible defeats 1/3',
      costLine: null,
      reserveLine: null,
      route: safetyRoute,
    },
    recentOmens: [omen],
    rows: [
      row({
        id: 'fixture-gate-failure-correction',
        bucket: 'readiness_floor',
        label: 'Forge correction',
        detail: 'Raise the Forge floor before another gate attempt.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'readiness',
        priority: 1,
      }),
      row({
        id: 'fixture-safety-net-row',
        bucket: 'support_reserve',
        label: 'Safety Net reserve',
        detail: 'Eligible defeats are progressing toward city Merit support.',
        currentLabel: '1/3',
        targetLabel: '3/3',
        state: 'partial',
        tone: 'info',
        route: safetyRoute,
        source: 'trial_lifecycle',
        priority: 2,
      }),
      row({
        id: 'fixture-gate-defeat-omen',
        bucket: 'recent_omen',
        label: omen.label,
        detail: omen.memoryLine,
        state: 'resolved',
        tone: 'warning',
        source: 'run_delta',
        priority: 80,
      }),
    ],
    readiness: readiness({
      score: 48,
      label: 'Recovering',
      diagnosisLabel: 'Underforged',
      primaryShortfallLabel: 'Forge floor below recommended',
    }),
  });
}

function breakthroughPendingFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-breakthrough-ready',
    label: 'Break Through',
    actionLabel: 'Begin Breakthrough',
    detail: 'Gate proof and Qi are ready.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    expectedDeltaLabel: 'Enter Foundation Establishment.',
    source: 'progression',
    priority: 1,
  });
  return baseSurface({
    stateId: 'breakthrough_pending',
    milestoneState: 'breakthrough_pending',
    milestoneLabel: 'Break through to Foundation Establishment',
    milestoneDetail: 'Gate proof is resolved. Breakthrough is next.',
    obstruction: obstruction({
      kind: 'none',
      label: 'Gate proof resolved',
      detail: 'Return to Cultivation and begin the breakthrough.',
      severity: 'success',
      source: 'progression',
      tone: 'success',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'fixture-proof-resolved',
        bucket: 'hard_gate',
        label: 'Gate proof: Gate Foundation Pill',
        detail: 'Gate proof is resolved for breakthrough.',
        currentLabel: 'Resolved',
        targetLabel: 'Foundation Establishment',
        state: 'resolved',
        tone: 'success',
        route: primaryRoute,
        source: 'trial_lifecycle',
        priority: 1,
      }),
      row({
        id: 'fixture-qi-ready',
        bucket: 'hard_gate',
        label: 'Qi threshold',
        detail: 'Qi is ready for breakthrough.',
        currentLabel: 'Ready',
        targetLabel: 'Threshold',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'progression',
        priority: 2,
      }),
    ],
    readiness: readiness({
      score: 100,
      label: 'Ready',
      rows: [{
        id: 'fixture-breakthrough-ready-row',
        label: 'Breakthrough readiness',
        detail: 'Gate proof and Qi are ready.',
        currentLabel: 'Ready',
        targetLabel: 'Begin breakthrough',
        tone: 'success',
        source: 'readiness',
        route: primaryRoute,
      }],
    }),
  });
}

function contentCapFixture(): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'fixture-cap-prestige',
    label: 'Review Reincarnation',
    actionLabel: 'Open Reincarnation',
    detail: 'Current authored chapter complete. Reincarnation is the next durable route.',
    destinationLabel: 'Prestige',
    target: { kind: 'tab', tab: 'prestige' },
    expectedDeltaLabel: 'Life converts into permanent progress.',
    source: 'prestige',
    priority: 1,
  });
  return baseSurface({
    stateId: 'content_cap_prestige_recommended',
    milestoneState: 'prestige_recommended',
    milestoneLabel: 'Current authored chapter complete',
    milestoneDetail: 'No future gate is exposed beyond the live slice.',
    obstruction: obstruction({
      kind: 'prestige_recommended',
      label: 'Reincarnation is the next durable route',
      detail: 'No future gate or city is exposed; review Reincarnation for permanent progress.',
      severity: 'success',
      source: 'prestige',
      tone: 'success',
    }),
    primaryRoute,
    prestige: {
      state: 'cap_recommended',
      label: 'Review Reincarnation',
      detail: 'The authored chapter is complete and Reincarnation is the honest continuation.',
      route: primaryRoute,
      forecastLine: 'Permanent progress can carry into the next life.',
    },
    nextRealmLabel: null,
    rows: [
      row({
        id: 'fixture-content-cap',
        bucket: 'hard_gate',
        label: 'Authored chapter cap',
        detail: 'No future gate or city is exposed in the live slice.',
        state: 'resolved',
        tone: 'success',
        route: primaryRoute,
        source: 'content_cap',
        priority: 1,
      }),
    ],
    readiness: readiness({ label: 'Cap reached', band: 'cap_reached' }),
  });
}

export function createDaoMandateFixture(
  state: DaoMandateFixtureState,
  profile: DaoMandateGuidanceProfile = getDefaultDaoMandateGuidanceProfile(),
): DaoMandateSurfaceV1 {
  const raw = (() => {
    switch (state) {
      case 'life_setup':
        return lifeSetupFixture();
      case 'cultivating_qi_short':
        return cultivatingQiFixture();
      case 'attemptable_gate':
        return attemptableGateFixture();
      case 'gate_failed':
        return gateFailedFixture();
      case 'breakthrough_pending':
        return breakthroughPendingFixture();
      case 'content_cap_prestige_recommended':
        return contentCapFixture();
    }
  })();

  return applyDaoMandateVisibility(raw, { profile });
}
