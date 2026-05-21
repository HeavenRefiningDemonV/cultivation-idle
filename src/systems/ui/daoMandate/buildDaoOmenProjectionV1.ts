import type {
  DaoMandateObstructionKind,
  DaoMandateRoute,
  DaoMandateRouteTarget,
  DaoMandateScreenId,
  DaoMandateState,
  DaoMandateSurfaceV1,
  DaoRecentOmen,
  DaoRequirementRow,
} from './daoMandateTypes.js';
import type {
  DaoCurrentOmenV1,
  DaoOmenDirectRouteReason,
  DaoOmenKind,
  DaoOmenLifeStage,
  DaoOmenProjectionV1,
  DaoOmenSeverity,
  DaoOmenTone,
  DaoPressureBadgeKind,
  DaoPressureBadgeState,
  DaoPressureBadgeV1,
  DaoProofSealKind,
  DaoProofSealState,
  DaoProofSealV1,
  DaoReflectionKind,
  DaoReflectionV1,
  DaoSourceThreadOptionV1,
  DaoSourceThreadRouteVisibility,
  DaoSourceThreadV1,
} from './daoOmenProjectionTypes.js';

export interface BuildDaoOmenProjectionOptions {
  currentScreen?: DaoMandateScreenId;
  now?: number;
  includeDebug?: boolean;
}

interface OmenCandidate {
  kind: DaoOmenKind;
  priority: number;
  evidenceIds: string[];
  selectedFrom: string;
}

const PROOF_SEAL_LIMIT = 4;
const PRESSURE_BADGE_LIMIT = 4;
const RECENT_OMEN_LIMIT = 3;

const OBSTRUCTION_TO_OMEN_KIND: Partial<Record<DaoMandateObstructionKind, DaoOmenKind>> = {
  life_setup_missing_path: 'life_setup',
  life_setup_missing_heart_law: 'life_setup',
  life_setup_missing_breath_focus: 'life_setup',
  content_cap: 'content_cap',
  prestige_recommended: 'reincarnation_viable',
  breakthrough_qi_short: 'threshold_unreached',
  breakthrough_gate_proof_missing: 'proof_missing',
  gate_not_at_realm_edge: 'threshold_unreached',
  gate_lifecycle_locked: 'proof_missing',
  gate_recent_failure: 'reflection',
  safety_net_available: 'safety_net_ready',
  readiness_shortfall: 'risky_attempt',
  forge_floor_shortfall: 'gear_floor_strained',
  apothecary_prep_shortfall: 'reserve_thin',
  build_correction_gap: 'doctrine_uncertain',
  manual_pavilion_gap: 'doctrine_uncertain',
  bounty_merit_shortfall: 'support_reserve_low',
  expedition_shortage_smoothing: 'support_reserve_low',
  attempt_gate_now: 'attemptable',
  required_item_missing: 'proof_missing',
  source_route_locked: 'source_drought',
  invalid_state: 'life_setup',
  unknown: 'quiet',
  none: 'quiet',
};

const OMEN_PRIORITY: Record<DaoOmenKind, number> = {
  life_setup: 10,
  content_cap: 20,
  reincarnation_viable: 30,
  breakthrough_ready: 40,
  proof_missing: 50,
  threshold_unreached: 60,
  reflection: 70,
  safety_net_ready: 80,
  reserve_thin: 90,
  gear_floor_strained: 91,
  doctrine_uncertain: 92,
  currency_reserve_low: 100,
  support_reserve_low: 101,
  source_drought: 102,
  risky_attempt: 110,
  attemptable: 120,
  quiet: 999,
};

const OMEN_COPY: Record<DaoOmenKind, { title: string; detail: string }> = {
  quiet: {
    title: 'No pressure gathered',
    detail: 'No pressure has gathered.',
  },
  life_setup: {
    title: 'Doctrine anchor missing',
    detail: 'This life has no doctrine anchor.',
  },
  threshold_unreached: {
    title: 'Realm edge silent',
    detail: 'The gate remains silent until this realm reaches its edge.',
  },
  proof_missing: {
    title: 'Gate proof unsealed',
    detail: 'The gate proof has not been sealed.',
  },
  reserve_thin: {
    title: 'Survival reserve thin',
    detail: 'Survival reserve looks thin.',
  },
  gear_floor_strained: {
    title: 'Weapon floor pressured',
    detail: 'The weapon floor is under pressure.',
  },
  doctrine_uncertain: {
    title: 'Doctrine expression incomplete',
    detail: 'Doctrine expression looks incomplete.',
  },
  support_reserve_low: {
    title: 'Background support thin',
    detail: 'Background support looks thin.',
  },
  currency_reserve_low: {
    title: 'Mercy reserve low',
    detail: 'The mercy reserve is low.',
  },
  source_drought: {
    title: 'Source thread dry',
    detail: 'A needed source thread has run dry.',
  },
  attemptable: {
    title: 'Gate open',
    detail: 'The gate is open to an attempt.',
  },
  risky_attempt: {
    title: 'Gate open, proof thin',
    detail: 'The gate is open, but one proof feels thin.',
  },
  reflection: {
    title: 'Pattern repeated',
    detail: 'The same pattern has appeared again.',
  },
  safety_net_ready: {
    title: 'Mercy proof ready',
    detail: 'A mercy proof can now be sealed.',
  },
  breakthrough_ready: {
    title: 'Breakthrough proof sealed',
    detail: 'Qi and proof are sealed.',
  },
  reincarnation_viable: {
    title: 'Reincarnation viable',
    detail: 'This life can become permanent progress.',
  },
  content_cap: {
    title: 'Authored chapter complete',
    detail: 'The authored chapter is complete.',
  },
};

export function buildDaoOmenProjectionV1(
  surface: DaoMandateSurfaceV1,
  options: BuildDaoOmenProjectionOptions = {},
): DaoOmenProjectionV1 {
  const notes: string[] = [];
  const selected = selectCurrentOmen(surface, notes);
  const directRouteReason = directRouteReasonFor(selected.kind, surface.primaryRoute);
  const exposedRoute = directRouteReason ? cloneRoute(surface.primaryRoute) : undefined;
  const suppressedRouteIds = exposedRoute ? [] : suppressableRouteIds(surface);
  if (suppressedRouteIds.length > 0) {
    notes.push(`suppressed raw routes for non-hard omen ${selected.kind}: ${suppressedRouteIds.join(',')}`);
  }

  const currentOmen = buildCurrentOmen(surface, selected, directRouteReason, exposedRoute);
  const proofSeals = buildProofSeals(surface, currentOmen, notes);
  const pressureBadges = buildPressureBadges(surface, currentOmen);
  const sourceThreads = buildSourceThreads(surface, currentOmen, options.currentScreen);
  const reflections = buildReflections(surface, currentOmen);
  const hardRoutes = currentOmen.route ? [cloneRoute(currentOmen.route)] : [];

  return {
    projectionVersion: 1,
    generatedAt: options.now ?? surface.meta.generatedAt,
    lifeStage: resolveLifeStage(surface, currentOmen.kind),
    sourceSurface: {
      mode: surface.meta.mode,
      generatedAt: surface.meta.generatedAt,
      confidence: surface.meta.confidence,
      sourceIds: [...surface.meta.sourceIds],
      rawSurfaceId: surface.milestone.id,
    },
    currentOmen,
    proofSeals,
    pressureBadges,
    recentOmens: surface.recentOmens.slice(0, RECENT_OMEN_LIMIT).map(cloneRecentOmen),
    reflections,
    sourceThreads,
    hardRoutes,
    debug: options.includeDebug ? {
      notes,
      selectedPriority: `${selected.priority}:${selected.kind}`,
      suppressedRouteIds,
      fixtureState: fixtureStateFromSurface(surface),
    } : undefined,
  };
}

function selectCurrentOmen(surface: DaoMandateSurfaceV1, notes: string[]): OmenCandidate {
  const candidates: OmenCandidate[] = [];
  const obstructionKind = OBSTRUCTION_TO_OMEN_KIND[surface.obstruction.kind] ?? 'quiet';
  if (obstructionKind !== 'quiet') {
    candidates.push(candidate(surface, obstructionKind, `obstruction:${surface.obstruction.kind}`));
  }

  if (surface.milestone.state === 'content_cap' || surface.obstruction.kind === 'content_cap') {
    candidates.push(candidate(surface, 'content_cap', 'milestone:content_cap'));
  }

  if (
    surface.prestige &&
    ['viable', 'recommended', 'cap_recommended', 'blocked'].includes(surface.prestige.state)
  ) {
    candidates.push(candidate(
      surface,
      surface.prestige.state === 'cap_recommended' && surface.milestone.state === 'content_cap'
        ? 'content_cap'
        : 'reincarnation_viable',
      `prestige:${surface.prestige.state}`,
    ));
  }

  if (surface.milestone.state === 'breakthrough_pending') {
    candidates.push(candidate(surface, 'breakthrough_ready', 'milestone:breakthrough_pending'));
  }

  if (surface.safetyNet && ['available', 'progressing'].includes(surface.safetyNet.state)) {
    candidates.push(candidate(surface, 'safety_net_ready', `safety:${surface.safetyNet.state}`));
  }

  if (surface.milestone.state === 'attemptable') {
    candidates.push(candidate(
      surface,
      surface.obstruction.kind === 'readiness_shortfall' || /risk|thin/i.test(`${surface.readiness.band} ${surface.readiness.label}`)
        ? 'risky_attempt'
        : 'attemptable',
      `milestone:${surface.milestone.state}`,
    ));
  }

  const selected = (candidates.length > 0 ? candidates : [candidate(surface, 'quiet', 'fallback:quiet')])
    .sort((left, right) => left.priority - right.priority || left.kind.localeCompare(right.kind))[0];
  notes.push(`selected omen from ${selected.selectedFrom}`);
  return selected;
}

function candidate(surface: DaoMandateSurfaceV1, kind: DaoOmenKind, selectedFrom: string): OmenCandidate {
  return {
    kind,
    priority: OMEN_PRIORITY[kind],
    evidenceIds: evidenceIds(surface, selectedFrom),
    selectedFrom,
  };
}

function evidenceIds(surface: DaoMandateSurfaceV1, selectedFrom: string): string[] {
  return [
    selectedFrom,
    `milestone:${surface.milestone.id}`,
    `obstruction:${surface.obstruction.kind}`,
    ...surface.obstruction.evidenceIds,
  ];
}

function buildCurrentOmen(
  surface: DaoMandateSurfaceV1,
  selected: OmenCandidate,
  directRouteReason: DaoOmenDirectRouteReason | null,
  route: DaoMandateRoute | undefined,
): DaoCurrentOmenV1 {
  const copy = OMEN_COPY[selected.kind];
  return {
    id: stableId(`omen:${surface.milestone.id}:${selected.kind}`),
    kind: selected.kind,
    title: copy.title,
    detail: copy.detail,
    severity: severityForOmen(selected.kind),
    iconId: iconForOmen(selected.kind),
    tone: toneForOmen(selected.kind),
    allowDirectRoute: directRouteReason !== null,
    ...(directRouteReason ? { directRouteReason } : {}),
    ...(route ? { route } : {}),
    evidenceIds: selected.evidenceIds,
  };
}

function directRouteReasonFor(kind: DaoOmenKind, route: DaoMandateRoute): DaoOmenDirectRouteReason | null {
  switch (kind) {
    case 'life_setup':
      return 'setup';
    case 'proof_missing':
      return 'hard_lock';
    case 'reflection':
      return 'repeated_failure';
    case 'safety_net_ready':
      return 'safety_net';
    case 'breakthrough_ready':
      return 'breakthrough';
    case 'reincarnation_viable':
      return 'reincarnation';
    case 'content_cap':
      return 'content_cap';
    case 'attemptable':
    case 'risky_attempt':
      return routeTargetsGateTrial(route) ? 'hard_lock' : null;
    default:
      return null;
  }
}

function routeTargetsGateTrial(route: DaoMandateRoute): boolean {
  if (route.target?.kind === 'world_module' && route.target.moduleKey === 'gateTrial') return true;
  return /gate/i.test(`${route.id} ${route.label} ${route.actionLabel} ${route.destinationLabel} ${route.source}`);
}

function suppressableRouteIds(surface: DaoMandateSurfaceV1): string[] {
  return [
    surface.primaryRoute,
    ...surface.secondaryRoutes,
  ]
    .filter((route) => route.target !== null)
    .map((route) => route.id);
}

function buildProofSeals(
  surface: DaoMandateSurfaceV1,
  currentOmen: DaoCurrentOmenV1,
  notes: string[],
): DaoProofSealV1[] {
  const seals: DaoProofSealV1[] = [];
  const add = (kind: DaoProofSealKind, fallbackState: DaoProofSealState, detail: string): void => {
    if (seals.some((seal) => seal.kind === kind)) return;
    const matchedRow = findRowForProof(surface, kind);
    const state = matchedRow ? proofSealStateFromRow(matchedRow) : fallbackState;
    const routePolicy = routePolicyForProof(kind, currentOmen);
    seals.push({
      id: stableId(`proof:${surface.milestone.id}:${kind}`),
      kind,
      label: proofSealLabel(kind),
      state,
      tone: toneForProofState(state),
      iconId: iconForProofSeal(kind),
      detail,
      ownerScreen: ownerScreenForProof(kind),
      evidenceIds: matchedRow ? [matchedRow.id, ...currentOmen.evidenceIds] : currentOmen.evidenceIds,
      ...(routePolicy === 'direct' && currentOmen.route ? { route: cloneRoute(currentOmen.route) } : {}),
      routePolicy,
    });
  };

  switch (currentOmen.kind) {
    case 'life_setup':
      add('path', 'unsealed', 'The path seal has not settled.');
      add('heart_law', 'unsealed', 'The Heart Law seal has not settled.');
      break;
    case 'threshold_unreached':
      add('realm_edge', 'unsealed', 'The realm edge has not been reached.');
      add('qi_threshold', 'thin', 'Qi has not filled to the threshold.');
      add('gate_proof', 'unknown', 'Gate proof is not the current wall yet.');
      break;
    case 'proof_missing':
      add('realm_edge', 'sealed', 'The realm edge is known.');
      add('qi_threshold', 'sealed', 'Qi threshold proof is known.');
      add('gate_proof', 'unsealed', 'The gate proof has not been sealed.');
      break;
    case 'reserve_thin':
      add('gate_proof', 'sealed', 'Gate proof context is stable enough to read reserve pressure.');
      add('survival_reserve', 'thin', 'Survival reserve is thin.');
      break;
    case 'gear_floor_strained':
      add('gate_proof', 'sealed', 'Gate proof context is stable enough to read gear pressure.');
      add('forge_floor', 'strained', 'The forge floor is under pressure.');
      break;
    case 'doctrine_uncertain':
      add('gate_proof', 'sealed', 'Gate proof context is stable enough to read doctrine pressure.');
      add('doctrine_expression', 'thin', 'Doctrine expression is incomplete.');
      break;
    case 'support_reserve_low':
    case 'currency_reserve_low':
      add('support_reserve', 'thin', 'Support reserve is low.');
      add('gate_proof', 'sealed', 'Gate proof context is stable enough to read support pressure.');
      break;
    case 'source_drought':
      add('source_thread', 'locked', 'A source thread has run dry.');
      add('survival_reserve', 'thin', 'A reserve sink is waiting on that source.');
      break;
    case 'attemptable':
      add('realm_edge', 'sealed', 'The realm edge is sealed.');
      add('qi_threshold', 'sealed', 'Qi threshold proof is sealed.');
      add('gate_proof', 'ready', 'The gate proof is stable.');
      break;
    case 'risky_attempt':
      add('realm_edge', 'sealed', 'The realm edge is sealed.');
      add('gate_proof', 'ready', 'The gate proof is stable.');
      add('survival_reserve', 'thin', 'One support proof feels thin.');
      break;
    case 'reflection':
      add('failure_reflection', 'reflected', 'A repeated gate pattern has been recorded.');
      add(reflectionPressureProof(surface), 'thin', 'The reflected pressure has a matching proof seal.');
      break;
    case 'safety_net_ready':
      add('mercy_seal', 'ready', 'A mercy proof can be sealed.');
      add('gate_proof', 'sealed', 'Gate proof context is available.');
      break;
    case 'breakthrough_ready':
      add('realm_edge', 'sealed', 'The realm edge is sealed.');
      add('qi_threshold', 'sealed', 'Qi threshold proof is sealed.');
      add('gate_proof', 'sealed', 'Gate proof is sealed.');
      break;
    case 'reincarnation_viable':
      add('reincarnation', 'ready', 'This life can become permanent progress.');
      add('gate_proof', 'sealed', 'Current life proof is stable enough to review.');
      break;
    case 'content_cap':
      add('reincarnation', 'cap', 'The authored chapter has reached its handoff.');
      add('gate_proof', 'sealed', 'No future gate is exposed in the authored slice.');
      break;
    case 'quiet':
      add('realm_edge', 'quiet', 'No dominant pressure is active.');
      break;
  }

  if (seals.length > PROOF_SEAL_LIMIT) notes.push('proof seals capped at 4');
  return seals.slice(0, PROOF_SEAL_LIMIT);
}

function buildPressureBadges(surface: DaoMandateSurfaceV1, currentOmen: DaoCurrentOmenV1): DaoPressureBadgeV1[] {
  const badges: DaoPressureBadgeV1[] = [];
  const add = (kind: DaoPressureBadgeKind, state: DaoPressureBadgeState, detail: string): void => {
    if (badges.some((badge) => badge.kind === kind)) return;
    badges.push({
      id: stableId(`pressure:${surface.milestone.id}:${kind}`),
      kind,
      label: pressureBadgeLabel(kind),
      state,
      tone: toneForPressureState(state),
      iconId: iconForPressureBadge(kind),
      detail,
      ownerScreen: ownerScreenForPressure(kind),
      evidenceIds: currentOmen.evidenceIds,
    });
  };

  switch (currentOmen.kind) {
    case 'reserve_thin':
      add('survival', 'thin', 'Survival reserve looks thin.');
      break;
    case 'gear_floor_strained':
      add('forge', 'strained', 'The weapon floor is under pressure.');
      break;
    case 'doctrine_uncertain':
      add('doctrine', 'strained', 'Doctrine expression looks incomplete.');
      break;
    case 'support_reserve_low':
    case 'currency_reserve_low':
      add('support', 'low', 'Background support looks thin.');
      break;
    case 'source_drought':
      add('source', 'thin', 'A needed source thread has run dry.');
      break;
    case 'risky_attempt':
      add(riskyBadgeKind(surface), 'thin', 'One proof feels thin beside the open gate.');
      break;
    default:
      break;
  }

  return badges.slice(0, PRESSURE_BADGE_LIMIT);
}

function buildSourceThreads(
  surface: DaoMandateSurfaceV1,
  currentOmen: DaoCurrentOmenV1,
  currentScreen?: DaoMandateScreenId,
): DaoSourceThreadV1[] {
  return surface.sourceMap.map((entry): DaoSourceThreadV1 => {
    const route = entry.route ?? entry.bestSources[0]?.route ?? null;
    const ownerScreen = ownerScreenFromRoute(route) ?? ownerScreenFromProblem(entry.problemKind);
    const visibility = sourceThreadVisibility(currentOmen, ownerScreen, currentScreen, entry.problemKind);
    return {
      id: stableId(`source-thread:${entry.id}`),
      label: entry.neededThingLabel,
      missingThing: entry.neededThingLabel,
      sinkLabel: entry.sinkLabel,
      evidenceLine: entry.expectedImpactLabel ?? 'Source thread evidence is available in detail.',
      bestSource: entry.bestSources[0] ? sourceOption(entry.bestSources[0]) : null,
      fallbackSources: entry.fallbackSources.map(sourceOption),
      routeVisibility: visibility,
      ownerScreen,
      evidenceIds: [entry.id, ...currentOmen.evidenceIds],
    };
  });
}

function buildReflections(surface: DaoMandateSurfaceV1, currentOmen: DaoCurrentOmenV1): DaoReflectionV1[] {
  if (currentOmen.kind !== 'reflection') return [];
  const text = rowText(allRows(surface));
  const correctionRoute = currentOmen.route ? cloneRoute(currentOmen.route) : undefined;
  return [{
    id: stableId(`reflection:${surface.milestone.id}:${currentOmen.kind}`),
    kind: reflectionKindFromText(text),
    label: 'Repeated gate reflection',
    detail: 'The same pattern has appeared again.',
    tone: 'bronze',
    iconId: 'reflection',
    evidenceIds: currentOmen.evidenceIds,
    ...(correctionRoute ? { correctionRoute } : {}),
  }];
}

function sourceOption(option: {
  id: string;
  label: string;
  detail: string;
  route: DaoMandateRoute | null;
  lockedReason: string | null;
  activityMode: 'active' | 'passive' | 'background';
}): DaoSourceThreadOptionV1 {
  return {
    id: option.id,
    label: option.label,
    detail: option.detail,
    ...(option.route ? { route: cloneRoute(option.route) } : {}),
    lockedReason: option.lockedReason,
    activityMode: option.activityMode,
  };
}

function sourceThreadVisibility(
  currentOmen: DaoCurrentOmenV1,
  ownerScreen: DaoMandateScreenId,
  currentScreen?: DaoMandateScreenId,
  problemKind?: string | null,
): DaoSourceThreadRouteVisibility {
  if (currentScreen && currentScreen === ownerScreen) return 'local_owner';
  if (currentOmen.kind === 'proof_missing' && /proof|gate|required/i.test(problemKind ?? '')) return 'hard_lock';
  if (currentOmen.kind === 'source_drought') return 'drawer';
  return 'drawer';
}

function allRows(surface: DaoMandateSurfaceV1): DaoRequirementRow[] {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ];
}

function rowText(rows: DaoRequirementRow[]): string {
  return rows
    .map((row) => `${row.id} ${row.bucket} ${row.label} ${row.detail} ${row.sourceLine ?? ''}`)
    .join(' ')
    .toLowerCase();
}

function findRowForProof(surface: DaoMandateSurfaceV1, kind: DaoProofSealKind): DaoRequirementRow | null {
  const rows = allRows(surface);
  const patterns: Record<DaoProofSealKind, RegExp> = {
    path: /path/,
    heart_law: /heart law/,
    realm_edge: /realm edge|realm/,
    qi_threshold: /qi|threshold/,
    gate_proof: /gate proof|proof/,
    survival_reserve: /survival|medicine|apothecary/,
    forge_floor: /forge|weapon|gear/,
    doctrine_expression: /doctrine|technique|manual|loadout/,
    support_reserve: /support|merit|reserve/,
    source_thread: /source|herb|ore|thread/,
    failure_reflection: /failure|reflection|repeated/,
    mercy_seal: /mercy|safety/,
    reincarnation: /reincarnation|prestige|chapter cap|cap/,
  };
  return rows.find((row) => patterns[kind].test(`${row.id} ${row.label} ${row.detail}`.toLowerCase())) ?? null;
}

function proofSealStateFromRow(row: DaoRequirementRow): DaoProofSealState {
  switch (row.state) {
    case 'met':
      return 'sealed';
    case 'resolved':
      return 'ready';
    case 'partial':
      return 'thin';
    case 'unmet':
      return 'unsealed';
    case 'blocked':
      return 'locked';
    case 'unknown':
      return 'unknown';
  }
}

function routePolicyForProof(
  kind: DaoProofSealKind,
  currentOmen: DaoCurrentOmenV1,
): DaoProofSealV1['routePolicy'] {
  if (!currentOmen.allowDirectRoute) return 'hidden';
  if (['gate_proof', 'mercy_seal', 'reincarnation'].includes(kind)) return 'direct';
  return 'inspect';
}

function reflectionPressureProof(surface: DaoMandateSurfaceV1): DaoProofSealKind {
  const text = rowText(allRows(surface));
  if (/survival|medicine|apothecary/.test(text)) return 'survival_reserve';
  if (/doctrine|technique|manual|loadout/.test(text)) return 'doctrine_expression';
  if (/source|herb|ore/.test(text)) return 'source_thread';
  return 'forge_floor';
}

function riskyBadgeKind(surface: DaoMandateSurfaceV1): DaoPressureBadgeKind {
  const text = `${surface.readiness.primaryShortfallLabel ?? ''} ${rowText(allRows(surface))}`.toLowerCase();
  if (/forge|weapon|gear/.test(text)) return 'forge';
  if (/doctrine|technique|manual|loadout/.test(text)) return 'doctrine';
  if (/source|herb|ore/.test(text)) return 'source';
  if (/merit|support|bounty|expedition/.test(text)) return 'support';
  return 'survival';
}

function reflectionKindFromText(text: string): DaoReflectionKind {
  if (/survival|medicine|apothecary/.test(text)) return 'survival_pattern';
  if (/forge|weapon|gear/.test(text)) return 'forge_pattern';
  if (/doctrine|technique|manual|loadout/.test(text)) return 'doctrine_pattern';
  if (/threshold|qi|realm/.test(text)) return 'threshold_pattern';
  if (/source|herb|ore/.test(text)) return 'source_pattern';
  return 'unknown_pattern';
}

function resolveLifeStage(surface: DaoMandateSurfaceV1, kind: DaoOmenKind): DaoOmenLifeStage {
  switch (kind) {
    case 'life_setup':
      return 'setup';
    case 'threshold_unreached':
      return 'cultivating';
    case 'reserve_thin':
    case 'gear_floor_strained':
    case 'doctrine_uncertain':
    case 'support_reserve_low':
    case 'currency_reserve_low':
    case 'source_drought':
      return 'preparing';
    case 'proof_missing':
    case 'attemptable':
    case 'risky_attempt':
    case 'reflection':
    case 'safety_net_ready':
      return 'gate';
    case 'breakthrough_ready':
      return 'breakthrough';
    case 'reincarnation_viable':
      return 'reincarnation';
    case 'content_cap':
      return 'cap';
    case 'quiet':
      return lifeStageFromMilestone(surface.milestone.state);
  }
}

function lifeStageFromMilestone(state: DaoMandateState): DaoOmenLifeStage {
  switch (state) {
    case 'life_setup':
      return 'setup';
    case 'cultivating':
      return 'cultivating';
    case 'preparing':
      return 'preparing';
    case 'attemptable':
    case 'gate_active':
    case 'gate_failed':
    case 'gate_resolved':
      return 'gate';
    case 'breakthrough_pending':
    case 'realm_entered':
      return 'breakthrough';
    case 'content_cap':
      return 'cap';
    case 'prestige_recommended':
      return 'reincarnation';
    case 'fallback':
      return 'preparing';
  }
}

function severityForOmen(kind: DaoOmenKind): DaoOmenSeverity {
  switch (kind) {
    case 'quiet':
      return 'quiet';
    case 'reserve_thin':
    case 'gear_floor_strained':
    case 'doctrine_uncertain':
    case 'support_reserve_low':
    case 'currency_reserve_low':
    case 'source_drought':
    case 'risky_attempt':
      return 'thin';
    case 'life_setup':
    case 'threshold_unreached':
    case 'proof_missing':
      return 'locked';
    case 'reflection':
      return 'reflection';
    case 'attemptable':
    case 'safety_net_ready':
    case 'breakthrough_ready':
    case 'reincarnation_viable':
      return 'ready';
    case 'content_cap':
      return 'cap';
  }
}

function toneForOmen(kind: DaoOmenKind): DaoOmenTone {
  switch (kind) {
    case 'quiet':
      return 'ink';
    case 'attemptable':
    case 'safety_net_ready':
    case 'breakthrough_ready':
    case 'reincarnation_viable':
      return 'jade';
    case 'content_cap':
      return 'gold';
    case 'proof_missing':
    case 'life_setup':
    case 'threshold_unreached':
    case 'reflection':
      return 'cinnabar';
    default:
      return 'bronze';
  }
}

function iconForOmen(kind: DaoOmenKind): string {
  const icons: Record<DaoOmenKind, string> = {
    quiet: 'lotus',
    life_setup: 'path',
    threshold_unreached: 'mountain',
    proof_missing: 'seal',
    reserve_thin: 'vial',
    gear_floor_strained: 'hammer',
    doctrine_uncertain: 'scroll',
    support_reserve_low: 'hands',
    currency_reserve_low: 'coins',
    source_drought: 'sprout',
    attemptable: 'gate',
    risky_attempt: 'alertTriangle',
    reflection: 'reflection',
    safety_net_ready: 'shield',
    breakthrough_ready: 'sparkles',
    reincarnation_viable: 'circle',
    content_cap: 'bookOpen',
  };
  return icons[kind];
}

function proofSealLabel(kind: DaoProofSealKind): string {
  const labels: Record<DaoProofSealKind, string> = {
    path: 'Path',
    heart_law: 'Heart Law',
    realm_edge: 'Realm Edge',
    qi_threshold: 'Qi Threshold',
    gate_proof: 'Gate Proof',
    survival_reserve: 'Survival Reserve',
    forge_floor: 'Forge Floor',
    doctrine_expression: 'Doctrine',
    support_reserve: 'Support Reserve',
    source_thread: 'Source Thread',
    failure_reflection: 'Failure Reflection',
    mercy_seal: 'Mercy Seal',
    reincarnation: 'Reincarnation',
  };
  return labels[kind];
}

function pressureBadgeLabel(kind: DaoPressureBadgeKind): string {
  const labels: Record<DaoPressureBadgeKind, string> = {
    survival: 'Survival',
    forge: 'Forge',
    doctrine: 'Doctrine',
    support: 'Support',
    source: 'Source',
  };
  return labels[kind];
}

function ownerScreenForProof(kind: DaoProofSealKind): DaoMandateScreenId {
  const owners: Record<DaoProofSealKind, DaoMandateScreenId> = {
    path: 'cultivation',
    heart_law: 'cultivation',
    realm_edge: 'cultivation',
    qi_threshold: 'cultivation',
    gate_proof: 'gateTrial',
    survival_reserve: 'apothecary',
    forge_floor: 'forge',
    doctrine_expression: 'techniques',
    support_reserve: 'bounties',
    source_thread: 'world',
    failure_reflection: 'gateTrial',
    mercy_seal: 'gateTrial',
    reincarnation: 'prestige',
  };
  return owners[kind];
}

function ownerScreenForPressure(kind: DaoPressureBadgeKind): DaoMandateScreenId {
  const owners: Record<DaoPressureBadgeKind, DaoMandateScreenId> = {
    survival: 'apothecary',
    forge: 'forge',
    doctrine: 'techniques',
    support: 'bounties',
    source: 'world',
  };
  return owners[kind];
}

function ownerScreenFromProblem(problemKind: string | null | undefined): DaoMandateScreenId {
  if (/medicine|survival|herb|apothecary/i.test(problemKind ?? '')) return 'apothecary';
  if (/forge|weapon|ore|gear/i.test(problemKind ?? '')) return 'forge';
  if (/manual|technique|doctrine|loadout/i.test(problemKind ?? '')) return 'techniques';
  if (/merit|bounty/i.test(problemKind ?? '')) return 'bounties';
  if (/expedition|source/i.test(problemKind ?? '')) return 'expeditions';
  return 'world';
}

function ownerScreenFromRoute(route: DaoMandateRoute | null): DaoMandateScreenId | null {
  if (!route?.target) return null;
  if (route.target.kind === 'world_module') {
    switch (route.target.moduleKey) {
      case 'gateTrial':
      case 'outskirts':
      case 'ruins':
      case 'apothecary':
      case 'forge':
      case 'manualPavilion':
      case 'bounties':
      case 'expeditions':
        return route.target.moduleKey;
      default:
        return 'world';
    }
  }
  switch (route.target.tab) {
    case 'cultivation':
    case 'status':
    case 'inventory':
    case 'techniques':
    case 'records':
    case 'prestige':
    case 'settings':
      return route.target.tab;
    case 'adventure':
      return 'world';
  }
}

function toneForProofState(state: DaoProofSealState): DaoOmenTone {
  switch (state) {
    case 'sealed':
    case 'ready':
      return 'jade';
    case 'cap':
      return 'gold';
    case 'unsealed':
    case 'locked':
    case 'reflected':
      return 'cinnabar';
    case 'thin':
    case 'strained':
      return 'bronze';
    case 'quiet':
    case 'unknown':
      return 'ink';
  }
}

function toneForPressureState(state: DaoPressureBadgeState): DaoOmenTone {
  switch (state) {
    case 'stable':
    case 'ready':
      return 'jade';
    case 'thin':
    case 'strained':
    case 'low':
      return 'bronze';
    case 'quiet':
    case 'unknown':
      return 'ink';
  }
}

function iconForProofSeal(kind: DaoProofSealKind): string {
  const icons: Record<DaoProofSealKind, string> = {
    path: 'path',
    heart_law: 'heart',
    realm_edge: 'mountain',
    qi_threshold: 'sparkles',
    gate_proof: 'seal',
    survival_reserve: 'vial',
    forge_floor: 'hammer',
    doctrine_expression: 'scroll',
    support_reserve: 'hands',
    source_thread: 'sprout',
    failure_reflection: 'reflection',
    mercy_seal: 'shield',
    reincarnation: 'circle',
  };
  return icons[kind];
}

function iconForPressureBadge(kind: DaoPressureBadgeKind): string {
  const icons: Record<DaoPressureBadgeKind, string> = {
    survival: 'vial',
    forge: 'hammer',
    doctrine: 'scroll',
    support: 'hands',
    source: 'sprout',
  };
  return icons[kind];
}

function cloneRoute(route: DaoMandateRoute): DaoMandateRoute {
  return {
    ...route,
    target: cloneTarget(route.target),
  };
}

function cloneTarget(target: DaoMandateRouteTarget | null): DaoMandateRouteTarget | null {
  if (!target) return null;
  if (target.kind === 'tab') return { kind: 'tab', tab: target.tab };
  return { kind: 'world_module', cityId: target.cityId, moduleKey: target.moduleKey };
}

function cloneRecentOmen(omen: DaoRecentOmen): DaoRecentOmen {
  return { ...omen };
}

function fixtureStateFromSurface(surface: DaoMandateSurfaceV1): string | undefined {
  return surface.milestone.id.startsWith('omen-fixture:')
    ? surface.milestone.id.replace('omen-fixture:', '')
    : undefined;
}

function stableId(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]+/g, '-').replace(/-+/g, '-');
}
