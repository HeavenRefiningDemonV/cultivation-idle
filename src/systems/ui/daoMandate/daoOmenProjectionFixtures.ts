import type {
  DaoMandateGuidanceProfile,
  DaoMandateObstruction,
  DaoMandateRoute,
  DaoMandateRouteSource,
  DaoMandateState,
  DaoMandateSurfaceV1,
  DaoMandateTone,
  DaoReadinessLedger,
  DaoReadinessRow,
  DaoRecentOmen,
  DaoRequirementBucket,
  DaoRequirementLedger,
  DaoRequirementRow,
  DaoRequirementState,
  DaoReincarnationCounselSurface,
  DaoSafetyNetSurface,
  DaoSourceMapEntry,
} from './daoMandateTypes.js';

export const DAO_OMEN_PROJECTION_FIXTURE_STATES = [
  'life_setup_missing_path',
  'qi_short_before_realm_edge',
  'gate_proof_missing_attemptable',
  'medicine_floor_short',
  'forge_floor_shortfall',
  'doctrine_gap',
  'merit_reserve_low',
  'source_drought_herbs',
  'attemptable_gate_viable',
  'attemptable_gate_risky',
  'repeated_underprepared_failure',
  'safety_net_ready',
  'breakthrough_ready',
  'prestige_viable_not_recommended',
  'content_cap_reached',
] as const;

export type DaoOmenProjectionFixtureState = typeof DAO_OMEN_PROJECTION_FIXTURE_STATES[number];

const GENERATED_AT = 1_777_101;
const CITY_ID = 'city_pinewind_hamlet';
const CITY_NAME = 'Pinewind Hamlet';

function route(overrides: Partial<DaoMandateRoute>): DaoMandateRoute {
  return {
    id: 'fixture-route',
    label: 'Inspect Status',
    actionLabel: 'Inspect',
    detail: 'Fixture route for Omen Projection contract tests.',
    destinationLabel: 'Status',
    target: { kind: 'tab', tab: 'status' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'fixture',
    priority: 50,
    activityMode: 'active',
    ...overrides,
  };
}

function obstruction(overrides: {
  kind: DaoMandateObstruction['kind'];
  label: string;
  detail: string;
  severity?: DaoMandateObstruction['severity'];
  source?: DaoMandateRouteSource;
}): DaoMandateObstruction {
  return {
    kind: overrides.kind,
    label: overrides.label,
    detail: overrides.detail,
    severity: overrides.severity ?? 'warning',
    source: overrides.source ?? 'fixture',
    confidence: 'high',
    evidenceIds: [`fixture:obstruction:${overrides.kind}`],
  };
}

function row(overrides: {
  id: string;
  bucket: DaoRequirementBucket;
  label: string;
  detail: string;
  state?: DaoRequirementState;
  tone?: DaoMandateTone;
  route?: DaoMandateRoute | null;
  source?: DaoMandateRouteSource;
  currentLabel?: string | null;
  targetLabel?: string | null;
  proofLine?: string | null;
  sourceLine?: string | null;
  priority?: number;
}): DaoRequirementRow {
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
    proofLine: overrides.proofLine ?? `Fixture proof: ${overrides.id}`,
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

function readinessRow(overrides: {
  id: string;
  label: string;
  detail: string;
  tone?: DaoMandateTone;
  source?: DaoReadinessRow['source'];
  route?: DaoMandateRoute | null;
  currentLabel?: string | null;
  targetLabel?: string | null;
}): DaoReadinessRow {
  return {
    id: overrides.id,
    label: overrides.label,
    detail: overrides.detail,
    currentLabel: overrides.currentLabel ?? null,
    targetLabel: overrides.targetLabel ?? null,
    tone: overrides.tone ?? 'info',
    source: overrides.source ?? 'readiness',
    route: overrides.route ?? null,
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

function sourceThread(overrides: {
  id: string;
  neededThingLabel: string;
  sinkLabel: string;
  problemKind: string;
  route: DaoMandateRoute;
  expectedImpactLabel?: string | null;
}): DaoSourceMapEntry {
  return {
    id: overrides.id,
    neededThingLabel: overrides.neededThingLabel,
    neededThingId: overrides.neededThingLabel.toLowerCase().replace(/\s+/g, '_'),
    problemKind: overrides.problemKind,
    sinkLabel: overrides.sinkLabel,
    expectedImpactLabel: overrides.expectedImpactLabel ?? 'Supports the current proof thread.',
    bestSources: [{
      id: `${overrides.id}:best`,
      label: overrides.route.destinationLabel,
      detail: overrides.route.detail,
      route: overrides.route,
      lockedReason: overrides.route.blocked ? overrides.route.blockedReason ?? 'This source is locked.' : null,
      activityMode: overrides.route.activityMode ?? 'active',
      confidence: 'high',
    }],
    fallbackSources: [],
    route: overrides.route,
  };
}

function recentOmen(overrides: {
  id: string;
  label: string;
  detail: string;
  tone?: DaoMandateTone;
  readinessDeltaLabel?: string | null;
}): DaoRecentOmen {
  return {
    id: overrides.id,
    source: 'failure_reflection',
    timestamp: GENERATED_AT - 10,
    tone: overrides.tone ?? 'warning',
    label: overrides.label,
    detail: overrides.detail,
    memoryLine: overrides.detail,
    rewardSummary: null,
    readinessDeltaLabel: overrides.readinessDeltaLabel ?? null,
  };
}

function baseSurface(args: {
  stateId: DaoOmenProjectionFixtureState;
  profile: DaoMandateGuidanceProfile;
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
  const secondaryRoutes = args.secondaryRoutes ?? [];
  return {
    meta: {
      version: 1,
      generatedAt: GENERATED_AT,
      mode: 'fixture',
      guidanceProfile: args.profile,
      confidence: 'high',
      sourceIds: [`fixture:${args.stateId}`],
      debugNotes: [`Dao Omen Projection fixture: ${args.stateId}`],
    },
    milestone: {
      id: `omen-fixture:${args.stateId}`,
      label: args.milestoneLabel,
      detail: args.milestoneDetail,
      state: args.milestoneState,
      currentRealmLabel: 'Qi Condensation',
      nextRealmLabel: args.nextRealmLabel ?? 'Foundation Establishment',
      currentCityId: CITY_ID,
      currentCityName: CITY_NAME,
      chapterLine: 'Fixture chapter: Pinewind Hamlet',
    },
    obstruction: args.obstruction,
    primaryRoute: args.primaryRoute,
    secondaryRoutes,
    requirementLedger: ledger(args.rows),
    readiness: args.readiness ?? readiness(),
    sourceMap: args.sourceMap ?? [],
    currentWork: {
      foreground: {
        label: 'Fixture foreground',
        detail: 'Projection fixtures are pure raw surfaces.',
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
      adviceLabel: 'Fixture background plan',
      adviceDetail: 'Background routes remain closed unless a later owner opens detail.',
      routes: secondaryRoutes.slice(0, 2),
      offlineProjectionLabel: null,
    },
    safetyNet: args.safetyNet ?? null,
    prestige: args.prestige ?? null,
    recentOmens: args.recentOmens ?? [],
    lessonSlips: [],
    localLens: null,
  };
}

function lifeSetup(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-choose-path',
    label: 'Choose Path',
    actionLabel: 'Open Cultivation',
    detail: 'Choose a cultivation path before gate proof can settle.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    source: 'progression',
    priority: 1,
  });
  return baseSurface({
    stateId: 'life_setup_missing_path',
    profile,
    milestoneState: 'life_setup',
    milestoneLabel: 'Choose a path',
    milestoneDetail: 'This life has not named its doctrine anchor.',
    obstruction: obstruction({
      kind: 'life_setup_missing_path',
      label: 'Path missing',
      detail: 'A path must be chosen before the first gate counsel matters.',
      source: 'progression',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'omen-fixture-path-seal',
        bucket: 'hard_gate',
        label: 'Path seal',
        detail: 'A path has not been chosen.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 1,
      }),
      row({
        id: 'omen-fixture-heart-law-seal',
        bucket: 'hard_gate',
        label: 'Heart Law seal',
        detail: 'A Heart Law has not been anchored.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 2,
      }),
    ],
    readiness: readiness({ label: 'Setup pending' }),
  });
}

function qiShort(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-cultivate-qi',
    label: 'Cultivate Qi',
    actionLabel: 'Open Cultivation',
    detail: 'Refine Qi until the next gate threshold opens.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    expectedDeltaLabel: 'Qi rises toward the realm edge.',
    source: 'progression',
    priority: 10,
  });
  return baseSurface({
    stateId: 'qi_short_before_realm_edge',
    profile,
    milestoneState: 'cultivating',
    milestoneLabel: 'Reach the realm edge',
    milestoneDetail: 'The realm edge has not settled yet.',
    obstruction: obstruction({
      kind: 'breakthrough_qi_short',
      label: 'Qi threshold short',
      detail: 'Qi has not reached the next breakthrough threshold.',
      source: 'progression',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'omen-fixture-realm-edge',
        bucket: 'hard_gate',
        label: 'Realm edge',
        detail: 'The current realm has not reached its edge.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 1,
      }),
      row({
        id: 'omen-fixture-qi-threshold',
        bucket: 'hard_gate',
        label: 'Qi threshold',
        detail: 'Qi is below the next threshold.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'progression',
        priority: 2,
      }),
    ],
    readiness: readiness({
      label: 'Cultivating',
      rows: [
        readinessRow({
          id: 'omen-fixture-qi-row',
          label: 'Qi threshold',
          detail: 'Qi is still short of the gate edge.',
          tone: 'warning',
          route: primaryRoute,
        }),
      ],
    }),
  });
}

function gateProofMissing(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = gateRoute('omen-fixture-inspect-gate', 'Inspect Gate Trial');
  return baseSurface({
    stateId: 'gate_proof_missing_attemptable',
    profile,
    milestoneState: 'preparing',
    milestoneLabel: 'Seal the gate proof',
    milestoneDetail: 'Qi is ready, but legal proof is not sealed.',
    obstruction: obstruction({
      kind: 'breakthrough_gate_proof_missing',
      label: 'Gate proof missing',
      detail: 'The legal proof for this gate has not been sealed.',
      source: 'trial_lifecycle',
    }),
    primaryRoute,
    rows: [
      metRow('omen-fixture-realm-edge-ready', 'Realm edge', primaryRoute, 1),
      metRow('omen-fixture-qi-ready', 'Qi threshold', primaryRoute, 2),
      row({
        id: 'omen-fixture-gate-proof-missing',
        bucket: 'hard_gate',
        label: 'Gate proof',
        detail: 'Gate proof is unsealed.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'trial_lifecycle',
        priority: 3,
      }),
    ],
    readiness: readiness({ score: 66, label: 'Proof blocked', band: 'proof_missing' }),
  });
}

function medicineShort(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = moduleRoute('omen-fixture-open-apothecary', 'Open Apothecary', 'Apothecary', 'apothecary', 'economy');
  return pressureSurface({
    stateId: 'medicine_floor_short',
    profile,
    milestoneState: 'preparing',
    obstructionKind: 'apothecary_prep_shortfall',
    obstructionLabel: 'Medicine reserve short',
    obstructionDetail: 'Survival reserve is below the current gate band.',
    primaryRoute,
    rowId: 'omen-fixture-survival-reserve',
    rowLabel: 'Survival reserve',
    rowDetail: 'Medicine reserve is below the current gate band.',
    rowSource: 'economy',
    sourceMap: [sourceThread({
      id: 'omen-fixture-herb-thread',
      neededThingLabel: 'Herbs',
      sinkLabel: 'Medicine reserve',
      problemKind: 'medicine_floor',
      route: primaryRoute,
      expectedImpactLabel: 'Feeds the medicine reserve.',
    })],
    readinessLabel: 'Reserve thin',
    readinessShortfall: 'Survival reserve',
  });
}

function forgeShort(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = moduleRoute('omen-fixture-open-forge', 'Open Forge', 'Forge', 'forge', 'build');
  return pressureSurface({
    stateId: 'forge_floor_shortfall',
    profile,
    milestoneState: 'preparing',
    obstructionKind: 'forge_floor_shortfall',
    obstructionLabel: 'Weapon floor strained',
    obstructionDetail: 'The weapon floor is below the current gate band.',
    primaryRoute,
    rowId: 'omen-fixture-forge-floor',
    rowLabel: 'Forge floor',
    rowDetail: 'The weapon floor is under the expected band.',
    rowSource: 'build',
    readinessLabel: 'Forge strained',
    readinessShortfall: 'Forge floor',
  });
}

function doctrineGap(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-tune-techniques',
    label: 'Tune Techniques',
    actionLabel: 'Open Techniques',
    detail: 'Review doctrine expression before the next gate.',
    destinationLabel: 'Techniques',
    target: { kind: 'tab', tab: 'techniques' },
    source: 'build',
    priority: 10,
  });
  return pressureSurface({
    stateId: 'doctrine_gap',
    profile,
    milestoneState: 'preparing',
    obstructionKind: 'build_correction_gap',
    obstructionLabel: 'Doctrine gap',
    obstructionDetail: 'Doctrine expression is incomplete for the next gate.',
    primaryRoute,
    rowId: 'omen-fixture-doctrine-expression',
    rowLabel: 'Doctrine expression',
    rowDetail: 'Technique posture and manual fit are not fully expressed.',
    rowSource: 'build',
    readinessLabel: 'Doctrine uncertain',
    readinessShortfall: 'Doctrine expression',
  });
}

function meritLow(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = moduleRoute('omen-fixture-open-bounties', 'Open Bounties', 'Bounties', 'bounties', 'economy');
  return pressureSurface({
    stateId: 'merit_reserve_low',
    profile,
    milestoneState: 'preparing',
    obstructionKind: 'bounty_merit_shortfall',
    obstructionLabel: 'Merit reserve low',
    obstructionDetail: 'The mercy reserve is below the current support band.',
    primaryRoute,
    rowId: 'omen-fixture-merit-reserve',
    rowLabel: 'Merit reserve',
    rowDetail: 'Merit support reserve is low.',
    rowSource: 'economy',
    readinessLabel: 'Support low',
    readinessShortfall: 'Merit reserve',
  });
}

function sourceDrought(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = moduleRoute('omen-fixture-launch-expedition', 'Launch Expedition', 'Expeditions', 'expeditions', 'economy');
  return pressureSurface({
    stateId: 'source_drought_herbs',
    profile,
    milestoneState: 'preparing',
    obstructionKind: 'source_route_locked',
    obstructionLabel: 'Herb source dry',
    obstructionDetail: 'A needed herb source thread has run dry.',
    primaryRoute,
    rowId: 'omen-fixture-herb-source',
    rowLabel: 'Herb source thread',
    rowDetail: 'Herbs are not flowing into medicine reserve.',
    rowSource: 'economy',
    readinessLabel: 'Source drought',
    readinessShortfall: 'Herbs',
    sourceMap: [sourceThread({
      id: 'omen-fixture-source-drought-herbs',
      neededThingLabel: 'Herbs',
      sinkLabel: 'Medicine reserve',
      problemKind: 'source_route_locked',
      route: primaryRoute,
      expectedImpactLabel: 'Restores the herb source thread.',
    })],
  });
}

function attemptableGate(profile: DaoMandateGuidanceProfile, risky: boolean): DaoMandateSurfaceV1 {
  const stateId: DaoOmenProjectionFixtureState = risky ? 'attemptable_gate_risky' : 'attemptable_gate_viable';
  const primaryRoute = gateRoute(`omen-fixture-${risky ? 'risky' : 'viable'}-gate`, 'Inspect Gate Trial');
  const rows = [
    metRow('omen-fixture-attempt-realm-edge', 'Realm edge', primaryRoute, 1),
    metRow('omen-fixture-attempt-qi', 'Qi threshold', primaryRoute, 2),
    metRow('omen-fixture-attempt-proof', 'Gate proof', primaryRoute, 3),
  ];
  if (risky) {
    rows.push(row({
      id: 'omen-fixture-attempt-survival-thin',
      bucket: 'readiness_floor',
      label: 'Survival reserve',
      detail: 'Survival reserve is thin but does not lock the gate.',
      state: 'partial',
      tone: 'warning',
      route: moduleRoute('omen-fixture-risky-apothecary', 'Open Apothecary', 'Apothecary', 'apothecary', 'economy'),
      source: 'economy',
      priority: 20,
    }));
  }
  return baseSurface({
    stateId,
    profile,
    milestoneState: 'attemptable',
    milestoneLabel: risky ? 'Gate open with thin proof' : 'Gate open',
    milestoneDetail: risky ? 'The legal gate is open, but one reserve feels thin.' : 'Minimum proof is stable.',
    obstruction: obstruction({
      kind: risky ? 'readiness_shortfall' : 'attempt_gate_now',
      label: risky ? 'Gate viable but thin' : 'Gate can be inspected',
      detail: risky ? 'Minimum proof is met, but one support proof feels thin.' : 'Minimum gate proof is stable.',
      severity: risky ? 'warning' : 'success',
      source: risky ? 'readiness' : 'trial_lifecycle',
    }),
    primaryRoute,
    rows,
    readiness: readiness({
      score: risky ? 54 : 88,
      label: risky ? 'Risky' : 'Viable',
      band: risky ? 'risky' : 'viable',
      primaryShortfallLabel: risky ? 'Survival reserve' : null,
      rows: risky ? [
        readinessRow({
          id: 'omen-fixture-risky-survival-row',
          label: 'Survival reserve',
          detail: 'Thin reserve is subordinate to the legal gate.',
          tone: 'warning',
          route: null,
        }),
      ] : [],
    }),
  });
}

function repeatedFailure(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = moduleRoute('omen-fixture-reflection-forge', 'Open Forge', 'Forge', 'forge', 'failure_reflection');
  const omen = recentOmen({
    id: 'omen-fixture-repeated-underprepared-failure',
    label: 'Repeated gate reflection',
    detail: 'The same underprepared pattern appeared again.',
    readinessDeltaLabel: 'Forge pattern repeated',
  });
  return baseSurface({
    stateId: 'repeated_underprepared_failure',
    profile,
    milestoneState: 'gate_failed',
    milestoneLabel: 'Read the gate reflection',
    milestoneDetail: 'The same failure pattern has repeated.',
    obstruction: obstruction({
      kind: 'gate_recent_failure',
      label: 'Repeated failure pattern',
      detail: 'The same underprepared pattern appeared again.',
      source: 'failure_reflection',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'omen-fixture-failure-reflection',
        bucket: 'recent_omen',
        label: 'Failure reflection',
        detail: 'The gate repeated the same correction pattern.',
        state: 'resolved',
        tone: 'warning',
        route: primaryRoute,
        source: 'failure_reflection',
        priority: 1,
      }),
      row({
        id: 'omen-fixture-reflection-forge-floor',
        bucket: 'readiness_floor',
        label: 'Forge floor',
        detail: 'The repeated pattern points at the weapon floor.',
        state: 'unmet',
        tone: 'warning',
        route: primaryRoute,
        source: 'failure_reflection',
        priority: 2,
      }),
    ],
    readiness: readiness({ score: 42, label: 'Reflection', band: 'failure_pattern' }),
    recentOmens: [omen],
  });
}

function safetyNetReady(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = gateRoute('omen-fixture-safety-net', 'Review Safety Net');
  return baseSurface({
    stateId: 'safety_net_ready',
    profile,
    milestoneState: 'gate_failed',
    milestoneLabel: 'Mercy proof available',
    milestoneDetail: 'A safety net can now be sealed.',
    obstruction: obstruction({
      kind: 'safety_net_available',
      label: 'Safety net available',
      detail: 'A mercy proof can now be sealed.',
      severity: 'success',
      source: 'trial_lifecycle',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'omen-fixture-mercy-seal',
        bucket: 'support_reserve',
        label: 'Mercy seal',
        detail: 'Safety net proof is available.',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'trial_lifecycle',
        priority: 1,
      }),
      metRow('omen-fixture-safety-gate-proof', 'Gate proof', primaryRoute, 2),
    ],
    safetyNet: {
      state: 'available',
      label: 'Mercy proof available',
      detail: 'A safety net can now be sealed.',
      progressLine: 'Eligible proof ready',
      costLine: 'No additional debt for this fixture.',
      reserveLine: 'Merit reserve can carry the seal.',
      route: primaryRoute,
    },
    readiness: readiness({ score: 46, label: 'Mercy ready', band: 'safety_net_available' }),
  });
}

function breakthroughReady(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-breakthrough',
    label: 'Break Through',
    actionLabel: 'Begin Breakthrough',
    detail: 'Qi and gate proof are sealed.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    expectedDeltaLabel: 'Enter Foundation Establishment.',
    source: 'progression',
    priority: 1,
  });
  return baseSurface({
    stateId: 'breakthrough_ready',
    profile,
    milestoneState: 'breakthrough_pending',
    milestoneLabel: 'Breakthrough ready',
    milestoneDetail: 'Qi and proof are sealed.',
    obstruction: obstruction({
      kind: 'none',
      label: 'Proof sealed',
      detail: 'Qi and gate proof are sealed.',
      severity: 'success',
      source: 'progression',
    }),
    primaryRoute,
    rows: [
      metRow('omen-fixture-breakthrough-realm-edge', 'Realm edge', primaryRoute, 1),
      metRow('omen-fixture-breakthrough-qi', 'Qi threshold', primaryRoute, 2),
      metRow('omen-fixture-breakthrough-proof', 'Gate proof', primaryRoute, 3),
    ],
    readiness: readiness({ score: 100, label: 'Ready', band: 'breakthrough_ready' }),
  });
}

function prestigeViable(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-prestige-viable',
    label: 'Review Reincarnation',
    actionLabel: 'Open Reincarnation',
    detail: 'This life can become permanent progress.',
    destinationLabel: 'Prestige',
    target: { kind: 'tab', tab: 'prestige' },
    expectedDeltaLabel: 'Permanent progress can be reviewed.',
    source: 'prestige',
    priority: 1,
  });
  return baseSurface({
    stateId: 'prestige_viable_not_recommended',
    profile,
    milestoneState: 'prestige_recommended',
    milestoneLabel: 'Reincarnation viable',
    milestoneDetail: 'This life can become permanent progress.',
    obstruction: obstruction({
      kind: 'prestige_recommended',
      label: 'Reincarnation viable',
      detail: 'Permanent progress is available to review.',
      severity: 'success',
      source: 'prestige',
    }),
    primaryRoute,
    rows: [
      row({
        id: 'omen-fixture-reincarnation-seal',
        bucket: 'optional_optimization',
        label: 'Reincarnation seal',
        detail: 'This life has enough weight to review permanent progress.',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'prestige',
        priority: 1,
      }),
    ],
    prestige: {
      state: 'viable',
      label: 'Reincarnation viable',
      detail: 'This life can become permanent progress.',
      route: primaryRoute,
      forecastLine: 'Potential AP is available.',
    },
    readiness: readiness({ label: 'Prestige viable', band: 'prestige_viable' }),
  });
}

function contentCap(profile: DaoMandateGuidanceProfile): DaoMandateSurfaceV1 {
  const primaryRoute = route({
    id: 'omen-fixture-content-cap-prestige',
    label: 'Review Reincarnation',
    actionLabel: 'Open Reincarnation',
    detail: 'The authored chapter is complete.',
    destinationLabel: 'Prestige',
    target: { kind: 'tab', tab: 'prestige' },
    expectedDeltaLabel: 'Permanent progress can carry forward.',
    source: 'content_cap',
    priority: 1,
  });
  return baseSurface({
    stateId: 'content_cap_reached',
    profile,
    milestoneState: 'content_cap',
    milestoneLabel: 'Authored chapter complete',
    milestoneDetail: 'The authored chapter is complete.',
    obstruction: obstruction({
      kind: 'content_cap',
      label: 'Authored chapter complete',
      detail: 'No future gate is exposed in the current authored slice.',
      severity: 'success',
      source: 'content_cap',
    }),
    primaryRoute,
    nextRealmLabel: null,
    rows: [
      row({
        id: 'omen-fixture-content-cap-seal',
        bucket: 'hard_gate',
        label: 'Chapter cap',
        detail: 'The current authored chapter is complete.',
        state: 'resolved',
        tone: 'success',
        route: primaryRoute,
        source: 'content_cap',
        priority: 1,
      }),
      row({
        id: 'omen-fixture-content-cap-reincarnation',
        bucket: 'optional_optimization',
        label: 'Reincarnation seal',
        detail: 'Permanent progress is the honest handoff.',
        state: 'met',
        tone: 'success',
        route: primaryRoute,
        source: 'prestige',
        priority: 2,
      }),
    ],
    prestige: {
      state: 'cap_recommended',
      label: 'Reincarnation handoff',
      detail: 'The authored chapter is complete and Reincarnation is the honest continuation.',
      route: primaryRoute,
      forecastLine: 'Permanent progress can carry into the next life.',
    },
    readiness: readiness({ label: 'Cap reached', band: 'content_cap' }),
  });
}

function gateRoute(id: string, label: string): DaoMandateRoute {
  return route({
    id,
    label,
    actionLabel: 'Open Gate Trial',
    detail: 'Inspect legal gate proof and readiness.',
    destinationLabel: 'Gate Trial',
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey: 'gateTrial' },
    expectedDeltaLabel: 'Gate proof can be inspected.',
    source: 'trial_lifecycle',
    priority: 1,
  });
}

function moduleRoute(
  id: string,
  label: string,
  destinationLabel: string,
  moduleKey: 'apothecary' | 'forge' | 'bounties' | 'expeditions',
  source: DaoMandateRouteSource,
): DaoMandateRoute {
  return route({
    id,
    label,
    actionLabel: label,
    detail: `${destinationLabel} owns this raw source route.`,
    destinationLabel,
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey },
    expectedDeltaLabel: `${destinationLabel} pressure can improve.`,
    source,
    priority: 10,
  });
}

function metRow(id: string, label: string, proofRoute: DaoMandateRoute, priority: number): DaoRequirementRow {
  return row({
    id,
    bucket: 'hard_gate',
    label,
    detail: `${label} is sealed for this fixture.`,
    currentLabel: 'Sealed',
    targetLabel: 'Sealed',
    state: 'met',
    tone: 'success',
    route: proofRoute,
    source: label === 'Gate proof' ? 'trial_lifecycle' : 'progression',
    priority,
  });
}

function pressureSurface(args: {
  stateId: DaoOmenProjectionFixtureState;
  profile: DaoMandateGuidanceProfile;
  milestoneState: DaoMandateState;
  obstructionKind: DaoMandateObstruction['kind'];
  obstructionLabel: string;
  obstructionDetail: string;
  primaryRoute: DaoMandateRoute;
  rowId: string;
  rowLabel: string;
  rowDetail: string;
  rowSource: DaoMandateRouteSource;
  readinessLabel: string;
  readinessShortfall: string;
  sourceMap?: DaoSourceMapEntry[];
}): DaoMandateSurfaceV1 {
  return baseSurface({
    stateId: args.stateId,
    profile: args.profile,
    milestoneState: args.milestoneState,
    milestoneLabel: args.readinessLabel,
    milestoneDetail: args.obstructionDetail,
    obstruction: obstruction({
      kind: args.obstructionKind,
      label: args.obstructionLabel,
      detail: args.obstructionDetail,
      source: args.rowSource,
    }),
    primaryRoute: args.primaryRoute,
    rows: [
      metRow(`omen-fixture-${args.stateId}-gate-proof`, 'Gate proof', args.primaryRoute, 1),
      row({
        id: args.rowId,
        bucket: args.obstructionKind === 'bounty_merit_shortfall' ? 'support_reserve' : args.obstructionKind === 'source_route_locked' ? 'source_route' : 'readiness_floor',
        label: args.rowLabel,
        detail: args.rowDetail,
        state: args.obstructionKind === 'source_route_locked' ? 'blocked' : 'partial',
        tone: 'warning',
        route: args.primaryRoute,
        source: args.rowSource,
        priority: 2,
      }),
    ],
    readiness: readiness({
      score: 44,
      label: args.readinessLabel,
      band: 'thin',
      primaryShortfallLabel: args.readinessShortfall,
      rows: [
        readinessRow({
          id: `${args.rowId}:readiness`,
          label: args.rowLabel,
          detail: args.rowDetail,
          tone: 'warning',
          route: args.primaryRoute,
          source: args.rowSource === 'build' ? 'build' : 'economy',
        }),
      ],
    }),
    sourceMap: args.sourceMap ?? [],
  });
}

export function createDaoOmenProjectionRawFixture(
  state: DaoOmenProjectionFixtureState,
  profile: DaoMandateGuidanceProfile = 'jade',
): DaoMandateSurfaceV1 {
  switch (state) {
    case 'life_setup_missing_path':
      return lifeSetup(profile);
    case 'qi_short_before_realm_edge':
      return qiShort(profile);
    case 'gate_proof_missing_attemptable':
      return gateProofMissing(profile);
    case 'medicine_floor_short':
      return medicineShort(profile);
    case 'forge_floor_shortfall':
      return forgeShort(profile);
    case 'doctrine_gap':
      return doctrineGap(profile);
    case 'merit_reserve_low':
      return meritLow(profile);
    case 'source_drought_herbs':
      return sourceDrought(profile);
    case 'attemptable_gate_viable':
      return attemptableGate(profile, false);
    case 'attemptable_gate_risky':
      return attemptableGate(profile, true);
    case 'repeated_underprepared_failure':
      return repeatedFailure(profile);
    case 'safety_net_ready':
      return safetyNetReady(profile);
    case 'breakthrough_ready':
      return breakthroughReady(profile);
    case 'prestige_viable_not_recommended':
      return prestigeViable(profile);
    case 'content_cap_reached':
      return contentCap(profile);
  }
}
