import type { LiveWorldModuleKey } from '../../../content/index.js';
import type { GameTab } from '../../../stores/uiStore.js';
import type { TrainingReadOnlySnapshot } from '../../training/index.js';
import type { CultivationMindAlignmentSnapshot } from '../../cultivation/cultivationMindAlignmentResolver.js';
import type {
  StatusActionSurface,
  StatusDashboardSurfaceV1,
  StatusFactRow,
  StatusRouteTarget,
  StatusTone,
} from './statusDashboardSurface.js';
import {
  sanitizeLedgerAction,
  sanitizeStatusLedgerCopy,
  toLedgerTone,
} from './statusLedgerRows.js';
import type {
  StatusCauseRowSurface,
  StatusCauseSeverity,
  StatusCurrentStateBlockState,
  StatusCurrentStateBlockSurface,
  StatusCurrentStateSurfaceV1,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerTone,
} from './statusLedgerTypes.js';
import type { SpiritRootObservationSurfaceV1 } from '../../../features/spiritRootObservation/index.js';

type CurrentStateFactRow = StatusLedgerFactRow | StatusFactRow;

export interface StatusCurrentStateBuildContext {
  currentCityId: string | null;
  cityLabel: string;
  game: {
    qi: string;
    qiPerSecond: string;
    focusMode: string;
    realmIndex: number;
    substage: number;
    breakthroughRequirementLabel: string;
  };
  cultivation: {
    stability: number;
    stabilityCap: number;
    chapter: number;
    breathMode: string;
    daoHeartClarity: number;
    turbulence: number;
  };
  mindAlignment?: CultivationMindAlignmentSnapshot | null;
  spiritRootObservation: SpiritRootObservationSurfaceV1;
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
}

type DashboardWithoutLedger = Omit<StatusDashboardSurfaceV1, 'statusLedger'>;

const BLOCK_ORDER = [
  'cultivation',
  'daoHeart',
  'spiritRoot',
  'training',
  'buildPrep',
  'activeWork',
] as const satisfies readonly (keyof StatusCurrentStateSurfaceV1['blocks'])[];

const BUFF_DEBUFF_PRIORITY = [
  'foreground_gain',
  'breakthrough_risk',
  'expression_cap',
  'gate_readiness',
  'training_fatigue',
  'root_law_fit',
  'heart_law_parity',
] as const;

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function routeLabel(target: StatusRouteTarget): string {
  if (target.kind === 'tab') {
    const labels: Record<GameTab, string> = {
      cultivation: 'Cultivation',
      status: 'Status',
      adventure: 'World',
      inventory: 'Inventory',
      techniques: 'Techniques',
      records: 'Manual Pavilion',
      prestige: 'Prestige Reclaim',
      settings: 'Settings',
    };
    return labels[target.tab];
  }
  if (target.kind === 'world_module') {
    const labels: Record<LiveWorldModuleKey, string> = {
      outskirts: 'Outskirts',
      gateTrial: 'Gate Trial',
      trainingHall: 'Training Hall',
      ruins: 'Ruins',
      apothecary: 'Apothecary',
      manualPavilion: 'Manual Pavilion',
      forge: 'Forge',
      bounties: 'Bounty Board',
      expeditions: 'Expeditions',
    };
    return labels[target.moduleKey];
  }
  if (target.kind === 'status_observation') return 'Spirit Root Observation';
  if (target.kind === 'dao_heart_sanctuary') return 'Dao Heart Sanctuary';
  return 'Unavailable';
}

function tabTarget(tab: GameTab): StatusRouteTarget {
  return { kind: 'tab', tab };
}

function moduleTarget(moduleKey: LiveWorldModuleKey, cityId: string | null): StatusRouteTarget {
  return cityId
    ? { kind: 'world_module', cityId, moduleKey }
    : { kind: 'none', reason: 'No active city is available for this route.' };
}

function statusAction(args: {
  id: string;
  label: string;
  detail: string;
  target: StatusRouteTarget;
  tone?: StatusLedgerTone;
  primary?: boolean;
}): StatusLedgerActionSurface {
  const disabled = args.target.kind === 'none';
  return sanitizeLedgerAction({
    id: args.id,
    label: args.label,
    detail: args.detail,
    destinationLabel: routeLabel(args.target),
    target: args.target,
    disabled,
    disabledReason: disabled && args.target.kind === 'none' ? args.target.reason : null,
    tone: args.tone ?? toLedgerTone(`${args.label} ${args.detail}`),
    primary: args.primary,
    source: 'status',
  });
}

function actionFromDashboard(action: StatusActionSurface | null | undefined, primary = false): StatusLedgerActionSurface | null {
  if (!action) return null;
  return sanitizeLedgerAction({
    ...action,
    value: undefined,
    tone: toLedgerTone(`${action.tone} ${action.label} ${action.detail}`),
    primary,
    source: action.source,
  } as StatusLedgerActionSurface);
}

function severityFromTone(tone: StatusTone | StatusLedgerTone | string | null | undefined): StatusCauseSeverity {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning' || tone === 'gold') return 'warning';
  if (tone === 'success' || tone === 'jade') return 'healthy';
  return 'info';
}

function severityFromMindAlignment(snapshot: CultivationMindAlignmentSnapshot | null | undefined): StatusCauseSeverity {
  const severity = snapshot?.causeRows[0]?.severity;
  if (severity === 'danger') return 'danger';
  if (severity === 'warning') return 'warning';
  if (severity === 'good') return 'healthy';
  return 'info';
}

function stateFromSeverity(severity: StatusCauseSeverity): StatusCurrentStateBlockState {
  if (severity === 'blocked') return 'locked';
  if (severity === 'danger') return 'danger';
  if (severity === 'warning') return 'attention';
  return 'healthy';
}

function strongestState(rows: readonly StatusCauseRowSurface[]): StatusCurrentStateBlockState {
  if (rows.some((row) => row.severity === 'blocked')) return 'locked';
  if (rows.some((row) => row.severity === 'danger')) return 'danger';
  if (rows.some((row) => row.severity === 'warning')) return 'attention';
  if (rows.some((row) => row.severity === 'info')) return 'healthy';
  return 'unknown';
}

function causeRow(args: StatusCauseRowSurface): StatusCauseRowSurface {
  return {
    ...args,
    label: sanitizeStatusLedgerCopy(args.label),
    value: sanitizeStatusLedgerCopy(args.value),
    consequence: sanitizeStatusLedgerCopy(args.consequence),
    detail: sanitizeStatusLedgerCopy(args.detail),
    sourceSystem: sanitizeStatusLedgerCopy(args.sourceSystem),
    primaryFix: args.primaryFix ? sanitizeLedgerAction(args.primaryFix) : null,
  };
}

function rowFromLedgerFact(
  row: CurrentStateFactRow | null | undefined,
  fallback: {
    id: string;
    label: string;
    value: string;
    consequence: string;
    detail: string;
    sourceSystem: string;
    primaryFix: StatusLedgerActionSurface | null;
  },
): StatusCauseRowSurface {
  if (!row) {
    return causeRow({
      id: fallback.id,
      severity: 'info',
      label: fallback.label,
      value: fallback.value,
      consequence: fallback.consequence,
      primaryFix: fallback.primaryFix,
      detail: fallback.detail,
      sourceSystem: fallback.sourceSystem,
    });
  }

  return causeRow({
    id: fallback.id,
    severity: severityFromTone(row.tone),
    label: row.label,
    value: row.value ?? fallback.value,
    consequence: row.detail,
    primaryFix: 'action' in row ? row.action ?? fallback.primaryFix : fallback.primaryFix,
    detail: `${fallback.detail} Source row: ${'sourceLabel' in row ? row.sourceLabel : row.source}.`,
    sourceSystem: fallback.sourceSystem,
  });
}

function block(args: Omit<StatusCurrentStateBlockSurface, 'state'> & { state?: StatusCurrentStateBlockState }): StatusCurrentStateBlockSurface {
  return {
    ...args,
    title: sanitizeStatusLedgerCopy(args.title),
    valueLabel: sanitizeStatusLedgerCopy(args.valueLabel),
    consequence: sanitizeStatusLedgerCopy(args.consequence),
    state: args.state ?? strongestState(args.detailRows),
    route: args.route ? sanitizeLedgerAction(args.route) : null,
    detailRows: args.detailRows.map(causeRow),
  };
}

function buildCoreActions(context: StatusCurrentStateBuildContext) {
  return {
    cultivation: statusAction({
      id: 'current-state-route-cultivation',
      label: 'Open Cultivation',
      detail: 'Review Qi, realm, stability, breakthrough state, and cultivation controls.',
      target: tabTarget('cultivation'),
      tone: 'jade',
    }),
    daoHeart: statusAction({
      id: 'current-state-route-dao-heart',
      label: 'Open Dao Heart Sanctuary',
      detail: 'Practice Heart Law, clarity, and turbulence recovery in the Dao Heart Sanctuary.',
      target: { kind: 'dao_heart_sanctuary', tab: 'sanctuary' },
      tone: 'jade',
    }),
    spiritRoot: statusAction({
      id: 'current-state-route-spirit-root-observation',
      label: 'Observe Spirit Root',
      detail: 'Open the Status-owned Spirit Root Observation drawer.',
      target: { kind: 'status_observation', tab: 'fit' },
      tone: 'jade',
    }),
    training: statusAction({
      id: 'current-state-route-training-hall',
      label: 'Open Training Hall',
      detail: 'Review active regimen, fatigue, unlocked stats, and next stat unlock.',
      target: moduleTarget('trainingHall', context.currentCityId),
      tone: 'info',
    }),
    techniques: statusAction({
      id: 'current-state-route-techniques',
      label: 'Tune Techniques',
      detail: 'Review doctrine stock, loadout fit, and technique floors.',
      target: tabTarget('techniques'),
      tone: 'info',
    }),
    forge: statusAction({
      id: 'current-state-route-forge',
      label: 'Open Forge',
      detail: 'Review weapon, refine, temper, rune, and forge-floor pressure.',
      target: moduleTarget('forge', context.currentCityId),
      tone: 'info',
    }),
    apothecary: statusAction({
      id: 'current-state-route-apothecary',
      label: 'Open Apothecary',
      detail: 'Review healing reserve, pouch fit, craft/buy options, and ingredients.',
      target: moduleTarget('apothecary', context.currentCityId),
      tone: 'info',
    }),
    prestige: statusAction({
      id: 'current-state-route-prestige',
      label: 'Open Prestige',
      detail: 'Review reclaim and permanent progress options without claiming from Status.',
      target: tabTarget('prestige'),
      tone: 'gold',
    }),
  };
}

function rootSeverity(observation: SpiritRootObservationSurfaceV1): StatusCauseSeverity {
  if (observation.fit.tier === 'opposed') return 'danger';
  if (observation.fit.tier === 'strained') return 'warning';
  if (observation.fit.tier === 'compatible' || observation.fit.tier === 'resonant') return 'healthy';
  return 'info';
}

function trainingSeverity(snapshot: TrainingReadOnlySnapshot | null | undefined): StatusCauseSeverity {
  if (!snapshot) return 'info';
  if (snapshot.fatigue >= 80) return 'danger';
  if (snapshot.fatigue >= 60) return 'warning';
  return 'healthy';
}

function primaryBuildPrepAction(
  dashboard: DashboardWithoutLedger,
  actions: ReturnType<typeof buildCoreActions>,
): StatusLedgerActionSurface {
  const text = [
    ...dashboard.preparation.rows,
    ...dashboard.preparation.buildRows,
  ]
    .map((row) => `${row.label} ${row.value ?? ''} ${row.detail}`)
    .join(' ')
    .toLowerCase();

  if (/apothecary|healing|pouch|medicine|consumable|reserve/.test(text)) return actions.apothecary;
  if (/forge|weapon|temper|refine|rune/.test(text)) return actions.forge;
  if (/prestige|reclaim|reincarnation|content cap/.test(text)) return actions.prestige;
  return actions.techniques;
}

function buildSharedRows(
  dashboard: DashboardWithoutLedger,
  context: StatusCurrentStateBuildContext,
  actions: ReturnType<typeof buildCoreActions>,
): {
  heartLawParity: StatusCauseRowSurface;
  rootLawFit: StatusCauseRowSurface;
  trainingFatigue: StatusCauseRowSurface;
  expressionCap: StatusCauseRowSurface;
  gateReadiness: StatusCauseRowSurface;
  breakthroughRisk: StatusCauseRowSurface | null;
  foregroundGain: StatusCauseRowSurface;
} {
  const mind = context.mindAlignment ?? null;
  const parityValue = mind
    ? `${signed(mind.parityDelta)} stages; Qi speed ${signed(mind.speedDeltaPct)}%; risk ${signed(mind.breakthroughRiskDelta)}`
    : 'Unavailable';
  const heartLawFix = mind?.parityDelta && mind.parityDelta < 0
    ? actions.daoHeart
    : mind?.capState === 'overexpressed'
      ? actions.cultivation
      : null;
  const heartLawParity = causeRow({
    id: 'heart_law_parity',
    severity: severityFromMindAlignment(mind),
    label: 'Heart Law Parity',
    value: parityValue,
    consequence: mind?.summaryText ?? 'Heart Law parity is unavailable; Status keeps the row muted rather than inventing risk.',
    primaryFix: heartLawFix,
    detail: mind
      ? `resolveCultivationMindAlignment compares Heart Law level ${mind.heartLawLevel} against cultivation stage ${mind.cultivationStageIndex}; Qi multiplier ${mind.qiRateMultiplier.toFixed(2)}x, Heart Law XP ${mind.heartLawXpMultiplier.toFixed(2)}x.`
      : 'Mind-alignment snapshot was unavailable; Status did not compute a fallback formula in JSX.',
    sourceSystem: 'cultivationMindAlignmentResolver',
  });

  const root = context.spiritRootObservation;
  const rootLawFit = causeRow({
    id: 'root_law_fit',
    severity: rootSeverity(root),
    label: 'Root Law Fit',
    value: root.fit.label,
    consequence: root.fit.summary,
    primaryFix: actions.spiritRoot,
    detail: `Spirit Root Observation owns this fit: cultivation speed ${root.fit.effects.cultivationSpeedMult.toFixed(2)}x, Heart Law XP ${root.fit.effects.heartLawXpMult.toFixed(2)}x, turbulence ${signed(root.fit.effects.turbulenceDeltaPerMinute)} / min.`,
    sourceSystem: 'spiritRootObservationSurface',
  });

  const expressionCap = causeRow({
    id: 'expression_cap',
    severity: root.fit.effects.expressionCap < 75 ? 'warning' : 'info',
    label: 'Expression Cap',
    value: `${root.fit.effectiveExpression}/${root.fit.effects.expressionCap}`,
    consequence: root.fit.effectiveExpression < root.fit.effects.expressionCap
      ? 'Current root expression has room to improve under the fit cap.'
      : `Current fit caps expression at ${root.fit.effects.expressionCap}%.`,
    primaryFix: actions.spiritRoot,
    detail: 'Spirit Root Observation effects tab owns the expression cap and current expression row.',
    sourceSystem: 'spiritRootProgressionResolver',
  });

  const training = context.trainingSnapshot ?? null;
  const trainingFatigue = causeRow({
    id: 'training_fatigue',
    severity: trainingSeverity(training),
    label: 'Training Fatigue',
    value: training ? `${Math.round(training.fatigue)}% (${training.fatigueTier})` : 'Unavailable',
    consequence: training
      ? training.fatigue >= 80
        ? 'Training fatigue is high enough to downgrade harsh practice intensity.'
        : training.fatigue >= 60
          ? 'Training fatigue is damping path training; ease pressure before pushing harder.'
          : 'Training fatigue is not currently pressuring the foundation.'
      : 'Training content is unavailable; Status keeps Training muted and routeable.',
    primaryFix: actions.training,
    detail: training
      ? `Training read-only snapshot reports dampening ${training.fatigueDampening.toFixed(2)}x and active intensity ${training.activeIntensity?.displayName ?? 'none'}.`
      : 'Training read-only snapshot was unavailable; no locked future stat is treated as a zero failure.',
    sourceSystem: 'trainingReadOnlySnapshot',
  });

  const gateReadiness = causeRow({
    id: 'gate_readiness',
    severity: severityFromTone(dashboard.readiness.stateLabel),
    label: 'Gate Readiness',
    value: dashboard.readiness.stateLabel,
    consequence: `${dashboard.readiness.diagnosisLabel}: ${dashboard.readiness.postureLabel}`,
    primaryFix: dashboard.hero.primaryAction ? actionFromDashboard(dashboard.hero.primaryAction, true) : actions.cultivation,
    detail: 'Gate readiness remains owned by readiness and trial lifecycle surfaces; Status only shares the row.',
    sourceSystem: 'readinessRuntime',
  });

  const breakthroughRisk = mind && Math.abs(mind.breakthroughRiskDelta) >= 4
    ? causeRow({
      id: 'breakthrough_risk',
      severity: mind.breakthroughRiskDelta >= 18 ? 'danger' : mind.breakthroughRiskDelta > 0 ? 'warning' : 'info',
      label: 'Breakthrough Risk',
      value: signed(mind.breakthroughRiskDelta),
      consequence: mind.breakthroughRiskDelta > 0
        ? 'Breakthrough risk is elevated until doctrine catches up.'
        : 'Breakthrough risk is reduced by current doctrine parity.',
      primaryFix: heartLawFix,
      detail: 'Risk delta is shared from the Heart Law parity resolver.',
      sourceSystem: 'cultivationMindAlignmentResolver',
    })
    : null;

  const foreground = dashboard.currentWork.foregroundActivity;
  const foregroundGain = causeRow({
    id: 'foreground_gain',
    severity: foreground.label === 'No foreground activity' ? 'info' : 'healthy',
    label: 'Foreground Focus',
    value: foreground.label === 'No foreground activity' ? 'Idle' : foreground.label,
    consequence: foreground.detail,
    primaryFix: foreground.target
      ? statusAction({
        id: 'current-state-route-foreground',
        label: 'Open Current Work',
        detail: foreground.detail,
        target: foreground.target,
        tone: toLedgerTone(foreground.tone),
      })
      : null,
    detail: 'ActivityStore remains the single foreground activity source; Status only displays the current row.',
    sourceSystem: 'ActivityStore',
  });

  return {
    heartLawParity,
    rootLawFit,
    trainingFatigue,
    expressionCap,
    gateReadiness,
    breakthroughRisk,
    foregroundGain,
  };
}

function topRows(rows: StatusCauseRowSurface[], limit: number): StatusCauseRowSurface[] {
  const severityRank: Record<StatusCauseSeverity, number> = {
    blocked: 0,
    danger: 1,
    warning: 2,
    info: 3,
    healthy: 4,
  };
  return [...rows]
    .sort((a, b) => {
      const rank = (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9);
      if (rank !== 0) return rank;
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

function uniqueActions(actions: Array<StatusLedgerActionSurface | null | undefined>): StatusLedgerActionSurface[] {
  const byTarget = new Map<string, StatusLedgerActionSurface>();
  for (const action of actions) {
    if (!action) continue;
    const key = JSON.stringify(action.target);
    const existing = byTarget.get(key);
    if (!existing || (existing.disabled && !action.disabled) || (!existing.primary && action.primary)) {
      byTarget.set(key, action);
    }
  }
  return [...byTarget.values()];
}

export function buildStatusCurrentStateSurface(
  dashboard: DashboardWithoutLedger,
  context: StatusCurrentStateBuildContext,
): StatusCurrentStateSurfaceV1 {
  const actions = buildCoreActions(context);
  const shared = buildSharedRows(dashboard, context, actions);
  const buildPrepRoute = primaryBuildPrepAction(dashboard, actions);
  const cultivationRows = [
    causeRow({
      id: 'cultivation_base',
      severity: 'healthy',
      label: 'Cultivation Base',
      value: `${dashboard.hero.realmName} - ${dashboard.hero.stageText}`,
      consequence: `Qi ${context.game.qi}; current flow ${context.game.qiPerSecond} / s toward ${context.game.breakthroughRequirementLabel}.`,
      primaryFix: actions.cultivation,
      detail: 'Realm, substage, Qi, and Qi speed are read from GameStore and cultivation surfaces.',
      sourceSystem: 'GameStore',
    }),
    shared.heartLawParity,
    shared.gateReadiness,
  ];

  const daoRows = [
    shared.heartLawParity,
    causeRow({
      id: 'dao_heart_clarity',
      severity: context.cultivation.daoHeartClarity < 35 ? 'warning' : 'healthy',
      label: 'Dao Heart Clarity',
      value: `${Math.round(context.cultivation.daoHeartClarity)}%`,
      consequence: context.cultivation.daoHeartClarity < 35
        ? 'Low clarity makes doctrine practice more fragile.'
        : 'Clarity is stable for current doctrine work.',
      primaryFix: actions.daoHeart,
      detail: `CultivationStore reports clarity ${context.cultivation.daoHeartClarity}; Status does not mutate practice.`,
      sourceSystem: 'CultivationStore',
    }),
    causeRow({
      id: 'dao_heart_turbulence',
      severity: context.cultivation.turbulence >= 60 ? 'danger' : context.cultivation.turbulence >= 35 ? 'warning' : 'healthy',
      label: 'Turbulence',
      value: `${Math.round(context.cultivation.turbulence)}%`,
      consequence: context.cultivation.turbulence >= 35
        ? 'Turbulence is pressuring Heart Law practice and breakthrough safety.'
        : 'Turbulence is not currently a major pressure.',
      primaryFix: actions.daoHeart,
      detail: 'Dao Heart Sanctuary owns practice choices and turbulence recovery.',
      sourceSystem: 'daoHeartTurbulenceResolver',
    }),
  ];

  const root = context.spiritRootObservation;
  const spiritRows = [
    shared.rootLawFit,
    shared.expressionCap,
    causeRow({
      id: 'root_current_proc',
      severity: 'info',
      label: 'Current Proc',
      value: root.progression.proc.procName,
      consequence: `Root proc cooldown is ${root.progression.proc.cooldownSec}s under the current awakening state.`,
      primaryFix: actions.spiritRoot,
      detail: 'Spirit Root Observation progression tab owns proc name, cooldown, and awakening rows.',
      sourceSystem: 'spiritRootProgressionResolver',
    }),
  ];

  const training = context.trainingSnapshot ?? null;
  const trainingRows = [
    shared.trainingFatigue,
    causeRow({
      id: 'path_foundation',
      severity: training
        ? training.pathFoundation.averageRating <= 0
          ? 'warning'
          : 'healthy'
        : 'info',
      label: 'Path Foundation',
      value: training?.pathFoundation.valueLabel ?? 'Unavailable',
      consequence: training?.currentBottleneck
        ? `${training.currentBottleneck.displayName} is the lowest unlocked Training stat.`
        : 'Only unlocked Training stats are summarized; future stats stay locked, not zeroed.',
      primaryFix: actions.training,
      detail: training
        ? `Training snapshot summarizes ${training.pathStats.length} unlocked stats and ${training.futureStats.length} future locked stats.`
        : 'Training snapshot unavailable; no future Training stat is treated as failed.',
      sourceSystem: 'trainingReadOnlySnapshot',
    }),
    causeRow({
      id: 'training_next_unlock',
      severity: training?.nextUnlock ? 'info' : 'healthy',
      label: 'Next Stat Unlock',
      value: training?.nextUnlock
        ? `${training.nextUnlock.displayName} at ${training.nextUnlock.realmLabel}`
        : 'No locked stat pressure',
      consequence: training?.nextUnlock
        ? `${training.nextUnlock.displayName} opens at ${training.nextUnlock.realmLabel}.`
        : 'Current Training rows only show available current-life foundation truth.',
      primaryFix: actions.training,
      detail: 'Training unlock policy owns locked future stat language.',
      sourceSystem: 'trainingUnlockPolicy',
    }),
  ];

  const prepRows = [
    rowFromLedgerFact(
      dashboard.preparation.rows.find((row) => /pouch|healing|consumable|reserve/i.test(`${row.label} ${row.detail}`)),
      {
        id: 'medicine_charges',
        label: 'Healing Reserve',
        value: 'No warning',
        consequence: 'No healing reserve pressure is currently surfaced.',
        detail: 'Preparation rows own pouch fit and healing reserve evidence.',
        sourceSystem: 'medicineHandlingResolver',
        primaryFix: actions.apothecary,
      },
    ),
    rowFromLedgerFact(
      dashboard.preparation.buildRows.find((row) => /forge|weapon|temper|rune|rank|mastery|loadout|policy/i.test(`${row.label} ${row.detail}`)),
      {
        id: 'build_floor',
        label: 'Build & Forge Floor',
        value: 'Stable',
        consequence: 'No top build floor pressure is currently surfaced.',
        detail: 'Build rows own loadout, technique, forge, and policy fit evidence.',
        sourceSystem: 'statusTroubleshootingSurface.build',
        primaryFix: buildPrepRoute,
      },
    ),
    shared.gateReadiness,
  ];

  const activeRows = [
    shared.foregroundGain,
    rowFromLedgerFact(dashboard.currentWork.activeCombat, {
      id: 'active_combat',
      label: 'Combat',
      value: 'Idle',
      consequence: 'Combat is not running; offline progress will not simulate combat.',
      detail: 'CombatStore remains the only combat simulator/resolver.',
      sourceSystem: 'CombatStore',
      primaryFix: null,
    }),
    rowFromLedgerFact(dashboard.currentWork.expeditions, {
      id: 'active_expeditions',
      label: 'Expeditions',
      value: 'Idle',
      consequence: 'No expedition pressure is surfaced in Current Work.',
      detail: 'ExpeditionStore owns route slots and expected yield.',
      sourceSystem: 'ExpeditionStore',
      primaryFix: moduleTarget('expeditions', context.currentCityId).kind === 'none' ? null : statusAction({
        id: 'current-state-route-expeditions',
        label: 'Open Expeditions',
        detail: 'Review expedition support slots and expected yield.',
        target: moduleTarget('expeditions', context.currentCityId),
        tone: 'info',
      }),
    }),
  ];

  const allSharedRows = [
    shared.heartLawParity,
    shared.rootLawFit,
    shared.trainingFatigue,
    shared.gateReadiness,
    shared.expressionCap,
    shared.foregroundGain,
    ...(shared.breakthroughRisk ? [shared.breakthroughRisk] : []),
  ];
  const buffDebuffRows = [...allSharedRows]
    .filter((row) => BUFF_DEBUFF_PRIORITY.includes(row.id as typeof BUFF_DEBUFF_PRIORITY[number]))
    .sort((a, b) => BUFF_DEBUFF_PRIORITY.indexOf(a.id as typeof BUFF_DEBUFF_PRIORITY[number]) - BUFF_DEBUFF_PRIORITY.indexOf(b.id as typeof BUFF_DEBUFF_PRIORITY[number]));
  const blocks = {
    cultivation: block({
      id: 'current-state-cultivation',
      title: 'Cultivation Body',
      valueLabel: `${dashboard.hero.realmName} - ${dashboard.hero.stageText}`,
      consequence: cultivationRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
        ?? 'Cultivation base and Qi flow are stable enough for the current milestone.',
      route: actions.cultivation,
      detailRows: cultivationRows,
      icon: 'inkSwirl',
    }),
    daoHeart: block({
      id: 'current-state-dao-heart',
      title: 'Mind / Dao Heart',
      valueLabel: `${dashboard.hero.heartLawLabel}; ${shared.heartLawParity.value}`,
      consequence: daoRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
        ?? 'Heart Law, clarity, and turbulence are not currently the main pressure.',
      route: actions.daoHeart,
      detailRows: daoRows,
      icon: 'bookMartial',
    }),
    spiritRoot: {
      ...block({
        id: 'current-state-spirit-root',
        title: 'Spirit Root',
        valueLabel: `${root.profile.displayName}; ${root.fit.label}`,
        consequence: spiritRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
          ?? root.fit.summary,
        route: actions.spiritRoot,
        detailRows: spiritRows,
        icon: 'spiritGrass',
      }),
      observationRoute: 'status-root-observation' as const,
    },
    training: block({
      id: 'current-state-training',
      title: 'Training Foundation',
      valueLabel: training
        ? `${training.pathLabel}; ${training.pathFoundation.valueLabel}; fatigue ${Math.round(training.fatigue)}%`
        : 'Training Hall unavailable',
      consequence: trainingRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
        ?? 'Training foundation is readable from unlocked current-life stats.',
      route: actions.training,
      detailRows: trainingRows,
      icon: 'foundationPill',
    }),
    buildPrep: block({
      id: 'current-state-build-prep',
      title: 'Build / Prep',
      valueLabel: prepRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.value
        ?? 'Loadout and reserves stable',
      consequence: prepRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
        ?? 'Build floors, healing reserve, and gate preparation have no top warning.',
      route: buildPrepRoute,
      detailRows: prepRows,
      icon: 'jadeSword',
    }),
    activeWork: block({
      id: 'current-state-active-work',
      title: 'Active Work',
      valueLabel: shared.foregroundGain.value,
      consequence: activeRows.find((row) => row.severity === 'danger' || row.severity === 'warning')?.consequence
        ?? shared.foregroundGain.consequence,
      route: shared.foregroundGain.primaryFix ?? actions.cultivation,
      detailRows: activeRows,
      icon: 'hourglassProgress',
    }),
  } satisfies StatusCurrentStateSurfaceV1['blocks'];

  const severeRows = topRows(allSharedRows, 5);
  const dashboardActions = dashboard.bestNextActions
    .map((action, index) => actionFromDashboard(action, index === 0))
    .filter((action): action is StatusLedgerActionSurface => Boolean(action));
  const candidateActions = uniqueActions([
    ...severeRows.map((row) => row.primaryFix),
    ...dashboardActions,
    ...BLOCK_ORDER.map((key) => blocks[key].route),
  ]);
  const primary = sanitizeLedgerAction({
    ...(candidateActions.find((action) => !action.disabled) ?? actions.cultivation),
    primary: true,
  });
  const secondary = uniqueActions(candidateActions.filter((action) => JSON.stringify(action.target) !== JSON.stringify(primary.target)))
    .filter((action) => !action.disabled)
    .slice(0, 3);

  return {
    version: 'status-current-state-v1',
    rootTestId: 'status-current-state',
    summary: {
      label: 'Current Bottleneck',
      detail: severeRows[0]?.consequence ?? dashboard.hero.biggestShortfallLabel,
    },
    blocks,
    nextBottleneck: {
      primary,
      secondary,
      detailRows: severeRows,
    },
    sharedCauseRows: allSharedRows,
    buffDebuffRows,
  };
}
