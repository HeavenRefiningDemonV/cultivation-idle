import { D, formatNumber, formatPercentFromValue } from '../../../utils/numbers.js';
import type {
  StatusActionSurface,
  StatusDashboardSurfaceV1,
  StatusFactRow,
  StatusRequirementKind,
  StatusRequirementRow,
} from './statusDashboardSurface.js';
import {
  STATUS_LEDGER_ROW_BUDGETS,
  STATUS_LEDGER_SCHEMA_VERSION,
  STATUS_LEDGER_TITLES,
  sanitizeStatusLedgerCopy,
} from './statusLedgerPresentation.js';
import {
  capRows,
  dedupeFactRows,
  dedupeLedgerActionsByTarget,
  dedupeRequirementRows,
  sanitizeLedgerAction,
  sanitizeLedgerFactRow,
  sanitizeLedgerRequirementRow,
  sortRequirementRows,
  sourceModuleForRequirementKind,
  toLedgerTone,
} from './statusLedgerRows.js';
import type {
  StatusBuildPrepGroupSurface,
  StatusLedgerActionSurface,
  StatusDoctrineTileSurface,
  StatusLedgerFactRow,
  StatusLedgerMilestoneNode,
  StatusLedgerRequirementRow,
  StatusLedgerSurfaceV1,
  StatusLedgerTone,
  StatusSpiritRootElement,
  StatusSpiritRootSurface,
} from './statusLedgerTypes.js';

export interface StatusLedgerBuildContext {
  generatedAt: number;
  contentLoaded: boolean;
  cityLabel: string;
  currentCityId: string | null;
  debugNotes: string[];
  game: {
    qi: string;
    qiPerSecond: string;
    focusMode: string;
    realmIndex: number;
    substage: number;
    stats: {
      hp: string | number;
      atk: string | number;
      def: string | number;
      crit: string | number;
    };
    breakthroughRequirementLabel: string;
  };
  cultivation: {
    stability: number;
    stabilityCap: number;
    chapter: number;
    breathMode: string;
  };
}

function formatSafeNumber(value: string | number): string {
  try {
    return formatNumber(value);
  } catch {
    return String(value);
  }
}

function sourceLabelFromRaw(source: string): string {
  if (source.includes('readiness')) return 'Readiness';
  if (source.includes('preparation') || source.includes('pouch')) return 'Preparation';
  if (source.includes('build')) return 'Build';
  if (source.includes('safetyNet')) return 'Safety Net';
  if (source.includes('currentWork') || source.includes('activityStore')) return 'Current Work';
  if (source.includes('runDeltas')) return 'Recent Changes';
  if (source.includes('game.stats')) return 'Combat Stats';
  if (source.includes('cultivation')) return 'Cultivation';
  if (source.includes('cityStore')) return 'World';
  if (source.includes('bountyStore')) return 'Bounty Board';
  if (source.includes('expeditionStore')) return 'Expedition Support';
  if (source.includes('professionStore')) return 'Profession Queues';
  return 'Status';
}

function rowFromDashboard(row: StatusFactRow, id: string, sourceLabel?: string): StatusLedgerFactRow {
  return sanitizeLedgerFactRow({
    id,
    label: row.label,
    value: row.value ?? null,
    detail: row.detail,
    tone: toLedgerTone(row.tone),
    icon: row.icon,
    sourceLabel: sourceLabel ?? sourceLabelFromRaw(row.source),
    action: null,
  });
}

function factRow(args: StatusLedgerFactRow): StatusLedgerFactRow {
  return sanitizeLedgerFactRow(args);
}

function emptyFactRow(id: string, label: string, detail: string, sourceLabel: string): StatusLedgerFactRow {
  return factRow({
    id,
    label,
    value: null,
    detail,
    tone: 'muted',
    icon: 'recordSlip',
    sourceLabel,
    action: null,
  });
}

function normalizedElementLabel(element: StatusSpiritRootElement): string {
  if (element === 'dormant') return 'Dormant';
  return `${element.slice(0, 1).toUpperCase()}${element.slice(1)}`;
}

function normalizeSpiritRootElement(input: string | null | undefined): StatusSpiritRootElement {
  const normalized = (input ?? '').trim().toLowerCase();
  if (
    normalized === 'fire' ||
    normalized === 'water' ||
    normalized === 'earth' ||
    normalized === 'metal' ||
    normalized === 'wood'
  ) {
    return normalized;
  }
  return 'dormant';
}

function iconForSpiritRootElement(element: StatusSpiritRootElement): StatusSpiritRootSurface['icon'] {
  switch (element) {
    case 'fire':
      return 'inkBurst';
    case 'water':
      return 'inkSwirl';
    case 'earth':
      return 'bookEarth';
    case 'metal':
      return 'metalChunk';
    case 'wood':
      return 'spiritGrass';
    case 'dormant':
      return 'placeholderRingSmall';
  }
}

function rowById(rows: StatusFactRow[], id: string): StatusFactRow | null {
  return rows.find((row) => row.id === id) ?? null;
}

function doctrineTile(args: {
  id: string;
  label: string;
  value: string | null | undefined;
  detail: string | null | undefined;
  icon: StatusDoctrineTileSurface['icon'];
  tone?: StatusLedgerTone;
  accent: NonNullable<StatusDoctrineTileSurface['accent']>;
}): StatusDoctrineTileSurface {
  const value = args.value && args.value.trim().length > 0 ? args.value : 'Unavailable';
  const detail = args.detail && args.detail.trim().length > 0 ? args.detail : value;
  return {
    id: args.id,
    label: sanitizeStatusLedgerCopy(args.label),
    value: sanitizeStatusLedgerCopy(value),
    detail: sanitizeStatusLedgerCopy(detail),
    icon: args.icon,
    tone: args.tone ?? toLedgerTone(`${args.label} ${value} ${detail}`),
    accent: args.accent,
  };
}

function buildSpiritRootSurface(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusSpiritRootSurface {
  const element = normalizeSpiritRootElement(dashboard.identity.spiritRootElement);
  const elementLabel = normalizedElementLabel(element);
  const spiritRootParts = dashboard.hero.spiritRootLabel.split(/[-/]/);
  const gradeLabel = dashboard.identity.spiritRootGrade?.trim()
    ? dashboard.identity.spiritRootGrade
    : spiritRootParts[1]?.trim() ?? 'Dormant';
  const resonance = rowById(dashboard.identity.rows, 'resonance')?.value ?? null;

  return {
    element,
    elementLabel: sanitizeStatusLedgerCopy(elementLabel),
    gradeLabel: sanitizeStatusLedgerCopy(gradeLabel),
    purityLabel: dashboard.identity.spiritRootPurityLabel
      ? sanitizeStatusLedgerCopy(dashboard.identity.spiritRootPurityLabel)
      : null,
    totalMultiplierLabel: dashboard.identity.spiritRootTotalMultiplierLabel
      ? sanitizeStatusLedgerCopy(dashboard.identity.spiritRootTotalMultiplierLabel)
      : null,
    resonanceLabel: resonance ? sanitizeStatusLedgerCopy(resonance) : null,
    icon: iconForSpiritRootElement(element),
    tone: element === 'dormant' ? 'muted' : 'jade',
  };
}

function buildDoctrineTiles(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): {
  pathTile: StatusDoctrineTileSurface;
  heartLawTile: StatusDoctrineTileSurface;
  focusTile: StatusDoctrineTileSurface;
  breathTile: StatusDoctrineTileSurface;
  cityTile: StatusDoctrineTileSurface;
  resonanceTile: StatusDoctrineTileSurface;
} {
  const path = rowById(dashboard.identity.rows, 'path');
  const heartLaw = rowById(dashboard.identity.rows, 'heart-law');
  const focus = rowById(dashboard.identity.rows, 'focus');
  const breath = rowById(dashboard.identity.rows, 'breath');
  const resonance = rowById(dashboard.identity.rows, 'resonance');

  return {
    pathTile: doctrineTile({
      id: 'doctrine-path',
      label: 'Path',
      value: path?.value ?? dashboard.hero.pathLabel,
      detail: path?.detail ?? 'Selected cultivation path.',
      icon: 'bookHeaven',
      tone: 'gold',
      accent: 'path',
    }),
    heartLawTile: doctrineTile({
      id: 'doctrine-heart-law',
      label: 'Heart Law',
      value: heartLaw?.value ?? dashboard.hero.heartLawLabel,
      detail: heartLaw?.detail ?? `Chapter ${context.cultivation.chapter}`,
      icon: 'bookMartial',
      tone: 'jade',
      accent: 'heartLaw',
    }),
    focusTile: doctrineTile({
      id: 'doctrine-focus',
      label: 'Focus',
      value: focus?.value ?? context.game.focusMode,
      detail: focus?.detail ?? 'Current focus posture.',
      icon: 'inkBolt',
      tone: toLedgerTone(focus?.value ?? context.game.focusMode),
      accent: 'focus',
    }),
    breathTile: doctrineTile({
      id: 'doctrine-breath',
      label: 'Breath',
      value: breath?.value ?? context.cultivation.breathMode,
      detail: breath?.detail ?? 'Current breath posture.',
      icon: 'inkHeart',
      tone: toLedgerTone(breath?.value ?? context.cultivation.breathMode),
      accent: 'breath',
    }),
    cityTile: doctrineTile({
      id: 'doctrine-city',
      label: 'City Anchor',
      value: context.cityLabel,
      detail: 'Current city for services and route availability.',
      icon: 'artifactBundle',
      tone: 'muted',
      accent: 'city',
    }),
    resonanceTile: doctrineTile({
      id: 'doctrine-resonance',
      label: 'Resonance',
      value: resonance?.value ?? 'Unavailable',
      detail: resonance?.detail ?? 'Spirit-root affinity against the current Heart Law.',
      icon: 'inkSwirl',
      tone: toLedgerTone(resonance?.value ?? resonance?.detail),
      accent: 'spiritRoot',
    }),
  };
}

function actionSource(source: StatusActionSurface['source']): StatusLedgerActionSurface['source'] {
  return source;
}

function concreteActionLabel(action: StatusActionSurface): string {
  const text = `${action.label} ${action.detail} ${action.destinationLabel}`.toLowerCase();
  if (/safety|fail-safe|fail safe|bypass|mercy/.test(text)) return 'Use Safety Net';
  if (/pouch/.test(text)) return 'Fit medicine pouch';
  if (/apothecary|healing|consumable|tonic|survival reserve/.test(text)) return 'Restock healing';
  if (/forge|weapon|temper|refine|floor/.test(text)) return 'Refine weapon';
  if (/manual|pavilion/.test(text)) return 'Study doctrine';
  if (/technique|loadout|doctrine|slot|ai|casting/.test(text)) return 'Tune loadout';
  if (/bounty/.test(text)) return 'Track bounty';
  if (/expedition/.test(text)) return 'Assign expedition';
  if (/reincarnation|prestige|chapter cap|content cap/.test(text)) return 'Review Reincarnation';
  if (/attempt.*gate|gate.*attempt/.test(text)) return 'Attempt Gate';
  if (/gate/.test(text)) return 'Open Gate Trial';
  if (/qi|cultivat|dantian/.test(text)) return 'Continue cultivation';
  if (/ruins|outskirts|world/.test(text)) return 'Inspect support route';
  return sanitizeStatusLedgerCopy(action.label);
}

function toLedgerAction(
  action: StatusActionSurface | null,
  options: {
    primary?: boolean;
    source?: StatusLedgerActionSurface['source'];
    label?: string;
    detail?: string;
  } = {},
): StatusLedgerActionSurface | null {
  if (!action) return null;
  return sanitizeLedgerAction({
    id: action.id,
    label: options.label ?? concreteActionLabel(action),
    detail: options.detail ?? action.detail,
    destinationLabel: action.destinationLabel,
    target: action.target,
    disabled: action.disabled,
    disabledReason: action.disabledReason,
    tone: toLedgerTone(`${action.tone} ${action.label} ${action.detail}`),
    primary: options.primary,
    source: options.source ?? actionSource(action.source),
  });
}

function buildImprovementActions(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusLedgerActionSurface[] {
  const converted = dashboard.bestNextActions
    .map((action, index) => toLedgerAction(action, { primary: index === 0 }))
    .filter((action): action is StatusLedgerActionSurface => Boolean(action));
  const deduped = dedupeLedgerActionsByTarget(converted)
    .sort((a, b) => {
      if (a.disabled !== b.disabled) return a.disabled ? 1 : -1;
      if (Boolean(a.primary) !== Boolean(b.primary)) return a.primary ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

  return capRows(deduped, STATUS_LEDGER_ROW_BUDGETS.bestImprovementRowsMax)
    .map((action, index) => sanitizeLedgerAction({
      ...action,
      primary: index === 0 && !action.disabled ? true : undefined,
    }));
}

function buildMetrics(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): StatusLedgerFactRow[] {
  const stabilityCap = Math.max(1, context.cultivation.stabilityCap);
  const stabilityPct = `${Math.round((context.cultivation.stability / stabilityCap) * 100)}%`;
  const rows: StatusLedgerFactRow[] = [
    factRow({
      id: 'metric-qi',
      label: 'Qi',
      value: formatSafeNumber(context.game.qi),
      detail: `Current Qi; next threshold ${context.game.breakthroughRequirementLabel}.`,
      tone: 'jade',
      icon: 'inkSwirl',
      sourceLabel: 'Cultivation',
      action: null,
    }),
    factRow({
      id: 'metric-qi-rate',
      label: 'Qi / s',
      value: `${formatSafeNumber(context.game.qiPerSecond)} / s`,
      detail: 'Current cultivation rate.',
      tone: 'info',
      icon: 'hourglassProgress',
      sourceLabel: 'Cultivation',
      action: null,
    }),
    factRow({
      id: 'metric-stability',
      label: 'Stability',
      value: `${context.cultivation.stability}/${context.cultivation.stabilityCap}`,
      detail: `Current inner stability reserve, about ${stabilityPct}.`,
      tone: context.cultivation.stability <= 0 ? 'warning' : 'jade',
      icon: 'inkHeart',
      sourceLabel: 'Heart Law',
      action: null,
    }),
    factRow({
      id: 'metric-hp',
      label: 'HP',
      value: formatSafeNumber(context.game.stats.hp),
      detail: 'Current health from live player stats.',
      tone: 'info',
      icon: 'inkShield',
      sourceLabel: 'Combat Stats',
      action: null,
    }),
  ];

  for (const metric of dashboard.metrics) {
    const id = metric.id.startsWith('metric-') ? metric.id : `metric-${metric.id}`;
    rows.push(rowFromDashboard(metric, id, 'Combat Stats'));
  }

  rows.push(factRow({
    id: 'metric-foreground',
    label: 'Foreground',
    value: dashboard.currentWork.foregroundActivity.label === 'No foreground activity'
      ? 'Idle'
      : dashboard.currentWork.foregroundActivity.label,
    detail: dashboard.currentWork.foregroundActivity.label === 'No foreground activity'
      ? 'No foreground activity is running.'
      : dashboard.currentWork.foregroundActivity.detail,
    tone: toLedgerTone(dashboard.currentWork.foregroundActivity.tone),
    icon: dashboard.currentWork.foregroundActivity.icon,
    sourceLabel: 'Current Work',
    action: null,
  }));

  return capRows(dedupeFactRows(rows), STATUS_LEDGER_ROW_BUDGETS.metricsMax);
}

function milestoneState(
  state: Omit<StatusDashboardSurfaceV1, 'statusLedger'>['milestone']['nodes'][number]['state'],
  readinessTone: StatusLedgerTone,
): StatusLedgerMilestoneNode['state'] {
  if (state === 'current' && readinessTone === 'success') return 'ready';
  return state;
}

function buildMilestone(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): StatusLedgerSurfaceV1['milestone'] {
  const tone = toLedgerTone(dashboard.milestone.tone);
  const nodes = capRows(dashboard.milestone.nodes.map((node): StatusLedgerMilestoneNode => ({
    ...node,
    label: sanitizeStatusLedgerCopy(node.label),
    detail: sanitizeStatusLedgerCopy(node.detail),
    state: milestoneState(node.state, tone),
  })), STATUS_LEDGER_ROW_BUDGETS.milestoneNodesMax);

  const rows = capRows([
    factRow({
      id: 'milestone-current-realm',
      label: 'Realm Step',
      value: dashboard.hero.realmName,
      detail: dashboard.hero.stageText,
      tone: 'jade',
      icon: 'artifactBundle',
      sourceLabel: 'Cultivation',
      action: null,
    }),
    factRow({
      id: 'milestone-gate-readiness',
      label: 'Gate Readiness',
      value: dashboard.milestone.readinessLabel,
      detail: dashboard.milestone.detail,
      tone,
      icon: 'foundationPill',
      sourceLabel: 'Readiness',
      action: null,
    }),
    factRow({
      id: 'milestone-next-goal',
      label: 'Next Major Goal',
      value: dashboard.hero.nextMajorGoalLabel,
      detail: dashboard.hero.nextMajorGoalDetail,
      tone: 'gold',
      icon: 'taskComplete',
      sourceLabel: 'Milestone',
      action: null,
    }),
    factRow({
      id: 'milestone-main-gap',
      label: 'Main Gap',
      value: dashboard.hero.biggestShortfallLabel,
      detail: dashboard.runCompass.primaryBlockerLabel,
      tone: toLedgerTone(dashboard.hero.biggestShortfallLabel),
      icon: 'inkWarning',
      sourceLabel: 'Status Ledger',
      action: null,
    }),
    factRow({
      id: 'milestone-city',
      label: 'City',
      value: context.cityLabel,
      detail: 'Current city anchor for routes and services.',
      tone: 'muted',
      icon: 'artifactBundle',
      sourceLabel: 'World',
      action: null,
    }),
  ], STATUS_LEDGER_ROW_BUDGETS.milestoneRowsMax);

  return {
    id: 'milestone',
    title: STATUS_LEDGER_TITLES.milestone,
    detail: sanitizeStatusLedgerCopy(dashboard.milestone.detail),
    readinessLabel: sanitizeStatusLedgerCopy(dashboard.milestone.readinessLabel),
    tone,
    nodes,
    rows,
  };
}

function breakthroughTone(label: string): StatusLedgerTone {
  if (/ready|available|viable|met/i.test(label)) return 'success';
  if (/blocked|missing|below|short|too early/i.test(label)) return 'warning';
  if (/cap|exhausted/i.test(label)) return 'gold';
  return 'info';
}

function buildCultivationBase(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): StatusLedgerSurfaceV1['cultivationBase'] {
  const foreground = dashboard.currentWork.foregroundActivity.label === 'No foreground activity'
    ? 'Idle'
    : dashboard.currentWork.foregroundActivity.label;
  const rows = [
    factRow({
      id: 'cultivation-qi-cap',
      label: 'Qi / Qi Cap',
      value: `${formatSafeNumber(context.game.qi)} / ${context.game.breakthroughRequirementLabel}`,
      detail: 'Current Qi against the next breakthrough threshold.',
      tone: 'jade',
      icon: 'inkSwirl',
      sourceLabel: 'Cultivation',
      action: null,
    }),
    factRow({
      id: 'cultivation-qi-rate',
      label: 'Cultivation Rate',
      value: `${formatSafeNumber(context.game.qiPerSecond)} / s`,
      detail: 'Live Qi gain rate.',
      tone: 'info',
      icon: 'hourglassProgress',
      sourceLabel: 'Cultivation',
      action: null,
    }),
    factRow({
      id: 'cultivation-breakthrough',
      label: 'Breakthrough State',
      value: dashboard.milestone.readinessLabel,
      detail: dashboard.milestone.detail,
      tone: breakthroughTone(`${dashboard.milestone.readinessLabel} ${dashboard.milestone.detail}`),
      icon: 'foundationPill',
      sourceLabel: 'Readiness',
      action: null,
    }),
    factRow({
      id: 'cultivation-stability',
      label: 'Stability',
      value: `${context.cultivation.stability}/${context.cultivation.stabilityCap}`,
      detail: 'Inner stability reserve available for cultivation posture.',
      tone: context.cultivation.stability <= 0 ? 'warning' : 'jade',
      icon: 'inkHeart',
      sourceLabel: 'Heart Law',
      action: null,
    }),
    factRow({
      id: 'cultivation-focus-breath',
      label: 'Focus / Breath',
      value: `${dashboard.identity.rows.find((row) => row.id === 'focus')?.value ?? context.game.focusMode} / ${dashboard.identity.rows.find((row) => row.id === 'breath')?.value ?? context.cultivation.breathMode}`,
      detail: 'Current doctrine posture for Qi, stability, and combat support.',
      tone: 'jade',
      icon: 'inkBolt',
      sourceLabel: 'Identity & Doctrine',
      action: null,
    }),
    factRow({
      id: 'cultivation-heart-law-chapter',
      label: 'Heart Law Chapter',
      value: dashboard.hero.heartLawLabel,
      detail: dashboard.identity.rows.find((row) => row.id === 'heart-law')?.detail ?? `Chapter ${context.cultivation.chapter}`,
      tone: 'info',
      icon: 'bookMartial',
      sourceLabel: 'Heart Law',
      action: null,
    }),
    factRow({
      id: 'cultivation-current-activity',
      label: 'Current Cultivation Activity',
      value: foreground,
      detail: foreground === 'Cultivating' ? 'Qi growth is the current foreground activity.' : 'Cultivation is not the foreground activity right now.',
      tone: foreground === 'Cultivating' ? 'success' : 'muted',
      icon: foreground === 'Cultivating' ? 'inkSwirl' : 'hourglassEmpty',
      sourceLabel: 'Current Work',
      action: null,
    }),
  ];

  return {
    id: 'cultivation_base',
    title: STATUS_LEDGER_TITLES.cultivationBase,
    rows: capRows(rows, STATUS_LEDGER_ROW_BUDGETS.cultivationBaseRowsMax),
  };
}

function kindFromText(text: string): StatusRequirementKind {
  const normalized = text.toLowerCase();
  if (/cap|chapter exhausted/.test(normalized)) return 'content_cap';
  if (/prestige|reincarnation/.test(normalized)) return 'prestige';
  if (/gate item|required token|gate token/.test(normalized)) return 'gate_item';
  if (/required item/.test(normalized)) return 'required_item';
  if (/\bqi\b|cultivat|threshold/.test(normalized)) return 'qi';
  if (/healing|pouch|consumable|tonic|apothecary|survival reserve/.test(normalized)) return 'healing';
  if (/forge|weapon|temper|refine|rune floor/.test(normalized)) return 'forge';
  if (/loadout|slot|ai|casting/.test(normalized)) return 'loadout';
  if (/technique|mastery|rank/.test(normalized)) return 'technique';
  if (/manual|doctrine stock|pavilion/.test(normalized)) return 'manual';
  if (/safety|fail-safe|fail safe|defeat|bypass/.test(normalized)) return 'safety_net';
  if (/merit|spirit stone|reserve|currency/.test(normalized)) return 'currency';
  if (/activity|foreground|queue/.test(normalized)) return 'activity';
  return 'unknown';
}

function requirementFromDashboard(row: StatusRequirementRow, prefix = 'mission'): StatusLedgerRequirementRow {
  const sourceModuleLabel = sourceModuleForRequirementKind(row.kind);
  return sanitizeLedgerRequirementRow({
    id: `${prefix}-${row.id}`,
    label: row.label,
    value: null,
    detail: row.detail,
    tone: toLedgerTone(row.tone),
    icon: row.icon,
    sourceLabel: sourceLabelFromRaw(row.source),
    action: toLedgerAction(row.action),
    kind: row.kind,
    gapLabel: row.gapLabel,
    priorityLabel: row.priorityLabel,
    sourceModuleLabel,
  });
}

function requirementFromFactRow(
  row: StatusFactRow,
  id: string,
  priorityLabel: string | null,
): StatusLedgerRequirementRow {
  const kind = kindFromText(`${row.label} ${row.value ?? ''} ${row.detail}`);
  return sanitizeLedgerRequirementRow({
    id,
    label: row.label,
    value: row.value ?? null,
    detail: row.detail,
    tone: toLedgerTone(row.tone),
    icon: row.icon,
    sourceLabel: sourceLabelFromRaw(row.source),
    action: null,
    kind,
    gapLabel: row.value ?? null,
    priorityLabel,
    sourceModuleLabel: sourceModuleForRequirementKind(kind),
  });
}

function buildMissionRequirements(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
): StatusLedgerRequirementRow[] {
  const rows: StatusLedgerRequirementRow[] = [
    ...dashboard.requirements.rows.map((row) => requirementFromDashboard(row)),
  ];

  for (const row of dashboard.readiness.rows) {
    const tone = toLedgerTone(`${row.tone} ${row.value ?? ''} ${row.detail}`);
    if (tone === 'danger' || tone === 'warning') {
      rows.push(requirementFromFactRow(row, `mission-readiness-${row.id}`, 'Priority 1'));
    }
  }

  for (const row of [...dashboard.preparation.rows, ...dashboard.preparation.buildRows]) {
    const tone = toLedgerTone(`${row.tone} ${row.value ?? ''} ${row.detail}`);
    if (tone === 'danger' || tone === 'warning') {
      rows.push(requirementFromFactRow(row, `mission-prep-${row.id}`, 'Priority 2'));
    }
  }

  if (rows.length === 0 && !/no command truth|no active blocker/i.test(dashboard.runCompass.primaryBlockerLabel)) {
    const kind = kindFromText(dashboard.runCompass.primaryBlockerLabel);
    rows.push(sanitizeLedgerRequirementRow({
      id: 'mission-primary-blocker',
      label: 'Current Bottleneck',
      value: dashboard.runCompass.primaryBlockerLabel,
      detail: dashboard.hero.biggestShortfallLabel,
      tone: toLedgerTone(dashboard.runCompass.primaryBlockerLabel),
      icon: 'inkWarning',
      sourceLabel: 'Mission Requirements',
      action: dashboard.hero.primaryAction ? toLedgerAction(dashboard.hero.primaryAction, { primary: true }) : null,
      kind,
      gapLabel: null,
      priorityLabel: 'Primary blocker',
      sourceModuleLabel: sourceModuleForRequirementKind(kind),
    }));
  }

  return capRows(
    sortRequirementRows(dedupeRequirementRows(rows)),
    STATUS_LEDGER_ROW_BUDGETS.missionRequirementRowsMax,
  );
}

function buildSafetyNet(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusLedgerSurfaceV1['safetyNet'] {
  return {
    id: 'safety_net',
    title: STATUS_LEDGER_TITLES.safetyNet,
    rows: capRows(
      dashboard.safetyNet.rows.map((row) => rowFromDashboard(row, `safety-${row.id}`, 'Safety Net')),
      STATUS_LEDGER_ROW_BUDGETS.safetyNetRowsMax,
    ),
    action: toLedgerAction(dashboard.safetyNet.action, { source: 'safety_net' }),
  };
}

function buildIdentityDoctrine(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): StatusLedgerSurfaceV1['identityDoctrine'] {
  const spiritRoot = buildSpiritRootSurface(dashboard);
  const doctrineTiles = buildDoctrineTiles(dashboard, context);
  const rows = [
    ...dashboard.identity.rows.map((row) => rowFromDashboard(row, `identity-${row.id}`, 'Identity & Doctrine')),
    factRow({
      id: 'identity-spirit-root',
      label: 'Spirit Root',
      value: `${spiritRoot.elementLabel} - ${spiritRoot.gradeLabel}`,
      detail: [
        spiritRoot.purityLabel ? `${spiritRoot.purityLabel} purity` : null,
        spiritRoot.totalMultiplierLabel ? `${spiritRoot.totalMultiplierLabel} total multiplier` : null,
        'Root element, grade, and purity shape doctrine fit.',
      ].filter(Boolean).join('; '),
      tone: 'jade',
      icon: spiritRoot.icon,
      sourceLabel: 'Identity & Doctrine',
      action: null,
    }),
    factRow({
      id: 'identity-city',
      label: 'City',
      value: context.cityLabel,
      detail: 'Current city anchor for services and route availability.',
      tone: 'muted',
      icon: 'artifactBundle',
      sourceLabel: 'World',
      action: null,
    }),
  ];

  return {
    id: 'identity_doctrine',
    title: STATUS_LEDGER_TITLES.identityDoctrine,
    rows: capRows(dedupeFactRows(rows), STATUS_LEDGER_ROW_BUDGETS.identityDoctrineRowsMax),
    spiritRootElement: sanitizeStatusLedgerCopy(dashboard.identity.spiritRootElement),
    spiritRootTone: sanitizeStatusLedgerCopy(dashboard.identity.spiritRootTone),
    spiritRoot,
    pathTile: doctrineTiles.pathTile,
    heartLawTile: doctrineTiles.heartLawTile,
    resonanceTile: doctrineTiles.resonanceTile,
    focusTile: doctrineTiles.focusTile,
    breathTile: doctrineTiles.breathTile,
    cityTile: doctrineTiles.cityTile,
  };
}

function buildCurrentWork(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusLedgerSurfaceV1['currentWork'] {
  const foreground = dashboard.currentWork.foregroundActivity;
  const activityTiles: StatusLedgerFactRow[] = [
    factRow({
      id: 'work-tile-foreground',
      label: 'State',
      value: foreground.label === 'No foreground activity' ? 'Idle' : foreground.label,
      detail: foreground.label === 'No foreground activity'
        ? 'No foreground activity is running.'
        : foreground.detail,
      tone: foreground.label === 'No foreground activity' ? 'muted' : toLedgerTone(foreground.tone),
      icon: foreground.icon,
      sourceLabel: 'Current Work',
      action: null,
      display: 'tile',
      importance: 'primary',
    }),
    factRow({
      id: 'work-tile-combat',
      label: 'Combat',
      value: dashboard.currentWork.activeCombat?.value ?? dashboard.currentWork.activeCombat?.label ?? 'Idle',
      detail: dashboard.currentWork.activeCombat?.detail ?? 'No combat is running.',
      tone: dashboard.currentWork.activeCombat ? toLedgerTone(dashboard.currentWork.activeCombat.tone) : 'muted',
      icon: dashboard.currentWork.activeCombat?.icon ?? 'hourglassEmpty',
      sourceLabel: 'Combat',
      action: null,
      display: 'tile',
      importance: 'secondary',
    }),
    factRow({
      id: 'work-tile-bounty',
      label: 'Bounty',
      value: dashboard.currentWork.trackedBounty?.value ?? dashboard.currentWork.trackedBounty?.label ?? 'None tracked',
      detail: dashboard.currentWork.trackedBounty?.detail ?? 'No bounty target is tracked.',
      tone: dashboard.currentWork.trackedBounty ? toLedgerTone(dashboard.currentWork.trackedBounty.tone) : 'muted',
      icon: dashboard.currentWork.trackedBounty?.icon ?? 'recordSlip',
      sourceLabel: 'Bounty Board',
      action: null,
      display: 'tile',
      importance: 'secondary',
    }),
    factRow({
      id: 'work-tile-expeditions',
      label: 'Expeditions',
      value: dashboard.currentWork.expeditions?.value ?? dashboard.currentWork.expeditions?.label ?? 'Idle',
      detail: dashboard.currentWork.expeditions?.detail ?? 'No expedition is active.',
      tone: dashboard.currentWork.expeditions ? toLedgerTone(dashboard.currentWork.expeditions.tone) : 'muted',
      icon: dashboard.currentWork.expeditions?.icon ?? 'hourglassEmpty',
      sourceLabel: 'Expedition Support',
      action: null,
      display: 'tile',
      importance: 'secondary',
    }),
  ];
  const rows: StatusLedgerFactRow[] = [
    factRow({
      id: 'work-foreground',
      label: 'Foreground',
      value: foreground.label === 'No foreground activity' ? 'Idle' : foreground.label,
      detail: foreground.label === 'No foreground activity'
        ? 'No foreground activity is running; choose a route from Best Improvements when ready.'
        : foreground.detail,
      tone: foreground.label === 'No foreground activity' ? 'muted' : toLedgerTone(foreground.tone),
      icon: foreground.icon,
      sourceLabel: 'Activity',
      action: null,
    }),
  ];

  if (dashboard.currentWork.activeCombat) rows.push(rowFromDashboard(dashboard.currentWork.activeCombat, 'work-combat', 'Current Work'));
  if (dashboard.currentWork.trackedBounty) rows.push(rowFromDashboard(dashboard.currentWork.trackedBounty, 'work-bounty', 'Bounty Board'));
  if (dashboard.currentWork.expeditions) rows.push(rowFromDashboard(dashboard.currentWork.expeditions, 'work-expeditions', 'Expedition Support'));
  dashboard.currentWork.queues.forEach((row) => rows.push(rowFromDashboard(row, `work-${row.id}`, 'Profession Queues')));

  return {
    id: 'current_work',
    title: STATUS_LEDGER_TITLES.currentWork,
    activityTiles,
    rows: capRows(dedupeFactRows(rows), STATUS_LEDGER_ROW_BUDGETS.currentWorkRowsMax),
  };
}

function toneRank(tone: StatusLedgerTone): number {
  switch (tone) {
    case 'danger':
      return 0;
    case 'warning':
      return 1;
    case 'gold':
      return 2;
    case 'info':
      return 3;
    case 'jade':
      return 4;
    case 'success':
      return 5;
    case 'muted':
      return 6;
  }
}

function strongestTone(rows: StatusLedgerFactRow[]): StatusLedgerTone {
  return rows.reduce<StatusLedgerTone>((strongest, row) => (
    toneRank(row.tone) < toneRank(strongest) ? row.tone : strongest
  ), 'muted');
}

function rowIsConcern(row: StatusLedgerFactRow): boolean {
  return row.tone === 'danger' || row.tone === 'warning' || /bad|below|disabled|risky|under-supported|empty/i.test(`${row.value ?? ''} ${row.detail}`);
}

function buildBuildPrepGroup(args: {
  title: string;
  icon: StatusBuildPrepGroupSurface['icon'];
  rows: StatusLedgerFactRow[];
  preferredTileIds: string[];
  stableHeadline: string;
}): StatusBuildPrepGroupSurface {
  const preferred = new Set(args.preferredTileIds);
  const tiles = capRows(
    args.rows
      .filter((row) => preferred.has(row.id))
      .map((row): StatusLedgerFactRow => factRow({
        ...row,
        display: 'tile',
        importance: rowIsConcern(row) ? 'primary' : 'secondary',
        maxLines: 2,
      })),
    6,
  );
  const headlineRow = args.rows.find(rowIsConcern) ?? args.rows[0] ?? null;

  return {
    title: args.title,
    headline: sanitizeStatusLedgerCopy(headlineRow?.detail ?? headlineRow?.value ?? args.stableHeadline),
    tone: strongestTone(args.rows),
    icon: args.icon,
    tiles,
    detailRows: args.rows.map((row) => factRow({ ...row, display: 'row', importance: 'detail' })),
  };
}

function buildBuildPreparation(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
): StatusLedgerSurfaceV1['buildPreparation'] {
  const buildRows = capRows(
    dashboard.preparation.buildRows.map((row) => rowFromDashboard(row, `build-${row.id}`, 'Build')),
    STATUS_LEDGER_ROW_BUDGETS.buildRowsMax,
  );
  const reserveRows = capRows(
    dashboard.preparation.rows.map((row) => rowFromDashboard(row, `reserve-${row.id}`, 'Preparation')),
    STATUS_LEDGER_ROW_BUDGETS.reserveRowsMax,
  );
  const warningSource = reserveRows.find((row) => (
    row.id === 'reserve-top-warning' &&
    !/no major preparation warning|unavailable/i.test(`${row.value ?? ''} ${row.detail}`)
  )) ?? buildRows.find((row) => row.id === 'build-top-gap' && !/no top build gap|unavailable/i.test(`${row.value ?? ''} ${row.detail}`)) ?? null;
  const warningAction = toLedgerAction(dashboard.hero.primaryAction, { primary: true })
    ?? toLedgerAction(dashboard.bestNextActions[0] ?? null);
  const topWarning = warningSource
    ? factRow({
      ...warningSource,
      action: warningAction,
      display: 'callout',
      importance: 'primary',
      maxLines: 2,
    })
    : null;

  return {
    id: 'build_preparation',
    title: STATUS_LEDGER_TITLES.buildPreparation,
    build: buildBuildPrepGroup({
      title: 'Build Readiness',
      icon: 'jadeSword',
      rows: buildRows,
      preferredTileIds: [
        'build-path-alignment',
        'build-empty-slots',
        'build-mastery-floor',
        'build-rank-floor',
        'build-rune-floor',
        'build-policy-fit',
      ],
      stableHeadline: 'Build floors are stable.',
    }),
    preparation: buildBuildPrepGroup({
      title: 'Preparation Reserves',
      icon: 'herbBundle',
      rows: reserveRows,
      preferredTileIds: [
        'reserve-merit-reserve',
        'reserve-spirit-stones-reserve',
        'reserve-pouch',
        'reserve-pouch-fit',
      ],
      stableHeadline: 'Preparation reserves are stable.',
    }),
    buildRows,
    reserveRows,
    topWarning,
  };
}

function buildRecentChanges(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusLedgerSurfaceV1['recentChanges'] {
  return {
    id: 'recent_changes',
    title: STATUS_LEDGER_TITLES.recentChanges,
    rows: capRows(
      dashboard.runCompass.recentDeltas.map((row) => rowFromDashboard(row, row.id.replace(/^run-delta-/, 'recent-delta-'), 'Recent Changes')),
      STATUS_LEDGER_ROW_BUDGETS.recentChangesRowsMax,
    ),
    emptyState: emptyFactRow(
      'recent-changes-empty',
      'No recent change recorded',
      'The ledger has no new route, reward, or failure delta to report yet.',
      'Recent Changes',
    ),
  };
}

function buildDetails(dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>): StatusLedgerSurfaceV1['details'] {
  return {
    id: 'details',
    title: STATUS_LEDGER_TITLES.details,
    summary: 'This ledger combines cultivation, gate readiness, build, preparation, current work, safety net, and recent route data.',
    rows: capRows([
      factRow({
        id: 'details-readiness',
        label: 'Gate Readiness',
        value: dashboard.readiness.stateLabel,
        detail: `${dashboard.readiness.diagnosisLabel}: ${dashboard.readiness.postureLabel}`,
        tone: toLedgerTone(dashboard.readiness.stateLabel),
        icon: 'inkShield',
        sourceLabel: 'Readiness',
        action: null,
      }),
      factRow({
        id: 'details-run-compass',
        label: 'Route Signal',
        value: dashboard.runCompass.primaryBlockerLabel,
        detail: `${dashboard.runCompass.milestoneLabel}: ${dashboard.runCompass.primaryRouteLabel}`,
        tone: toLedgerTone(dashboard.runCompass.primaryBlockerLabel),
        icon: 'recordSlip',
        sourceLabel: 'How calculated',
        action: null,
      }),
      factRow({
        id: 'details-build',
        label: 'Build',
        value: dashboard.preparation.buildRows.find((row) => row.id === 'top-gap')?.value ?? null,
        detail: dashboard.preparation.buildRows.find((row) => row.id === 'top-gap')?.detail ?? 'Build rows summarize loadout, technique, and policy fit.',
        tone: toLedgerTone(dashboard.preparation.buildRows.find((row) => row.id === 'top-gap')?.tone),
        icon: 'artifactBundle',
        sourceLabel: 'Build',
        action: null,
      }),
      factRow({
        id: 'details-preparation',
        label: 'Preparation',
        value: dashboard.preparation.rows.find((row) => row.id === 'pouch-fit')?.value ?? null,
        detail: dashboard.preparation.rows.find((row) => row.id === 'top-warning')?.detail ?? 'Preparation rows summarize reserves and pouch fit.',
        tone: toLedgerTone(dashboard.preparation.rows.find((row) => row.id === 'top-warning')?.tone),
        icon: 'herbBundle',
        sourceLabel: 'Preparation',
        action: null,
      }),
      factRow({
        id: 'details-safety-net',
        label: 'Safety Net',
        value: dashboard.safetyNet.stateLabel,
        detail: dashboard.safetyNet.progressLabel,
        tone: toLedgerTone(dashboard.safetyNet.stateLabel),
        icon: 'inkShield',
        sourceLabel: 'Safety Net',
        action: null,
      }),
      factRow({
        id: 'details-current-work',
        label: 'Current Work',
        value: dashboard.currentWork.foregroundActivity.label === 'No foreground activity' ? 'Idle' : dashboard.currentWork.foregroundActivity.label,
        detail: dashboard.currentWork.foregroundActivity.detail,
        tone: toLedgerTone(dashboard.currentWork.foregroundActivity.tone),
        icon: 'hourglassProgress',
        sourceLabel: 'Current Work',
        action: null,
      }),
      factRow({
        id: 'details-recent-changes',
        label: 'Recent Changes',
        value: `${dashboard.runCompass.recentDeltas.length}`,
        detail: dashboard.runCompass.recentDeltas[0]?.detail ?? 'No recent route, reward, or failure delta is recorded.',
        tone: dashboard.runCompass.recentDeltas.length > 0 ? 'info' : 'muted',
        icon: 'recordSlip',
        sourceLabel: 'Recent Changes',
        action: null,
      }),
    ], STATUS_LEDGER_ROW_BUDGETS.detailsRowsMax),
    closedByDefault: true,
  };
}

export function buildStatusLedgerSurfaceFromDashboard(
  dashboard: Omit<StatusDashboardSurfaceV1, 'statusLedger'>,
  context: StatusLedgerBuildContext,
): StatusLedgerSurfaceV1 {
  const bestImprovements = buildImprovementActions(dashboard);
  const primaryAction = bestImprovements.find((action) => action.primary) ?? null;
  const missionRequirements = buildMissionRequirements(dashboard);
  const focusLabel = dashboard.identity.rows.find((row) => row.id === 'focus')?.value ?? context.game.focusMode;
  const breathLabel = dashboard.identity.rows.find((row) => row.id === 'breath')?.value ?? context.cultivation.breathMode;
  const spiritRoot = buildSpiritRootSurface(dashboard);
  const doctrineTiles = buildDoctrineTiles(dashboard, context);

  return {
    meta: {
      rootTestId: 'status-ledger',
      mode: context.contentLoaded ? 'live' : 'fallback',
      generatedAt: context.generatedAt,
      contentLoaded: context.contentLoaded,
      schemaVersion: STATUS_LEDGER_SCHEMA_VERSION,
      debugNotes: [...dashboard.meta.debugNotes, ...context.debugNotes].map(sanitizeStatusLedgerCopy),
    },
    hero: {
      realmName: sanitizeStatusLedgerCopy(dashboard.hero.realmName),
      stageText: sanitizeStatusLedgerCopy(dashboard.hero.stageText),
      pathLabel: sanitizeStatusLedgerCopy(dashboard.hero.pathLabel),
      heartLawLabel: sanitizeStatusLedgerCopy(dashboard.hero.heartLawLabel),
      spiritRootLabel: sanitizeStatusLedgerCopy(dashboard.hero.spiritRootLabel),
      cityLabel: sanitizeStatusLedgerCopy(context.cityLabel),
      focusLabel: sanitizeStatusLedgerCopy(focusLabel),
      breathLabel: sanitizeStatusLedgerCopy(breathLabel),
      nextMajorGoalLabel: sanitizeStatusLedgerCopy(dashboard.hero.nextMajorGoalLabel),
      nextMajorGoalDetail: sanitizeStatusLedgerCopy(dashboard.hero.nextMajorGoalDetail),
      mainBottleneckLabel: sanitizeStatusLedgerCopy(dashboard.hero.biggestShortfallLabel),
      mainBottleneckDetail: sanitizeStatusLedgerCopy(primaryAction?.detail ?? dashboard.runCompass.primaryBlockerLabel),
      primaryAction,
      pathTile: doctrineTiles.pathTile,
      heartLawTile: doctrineTiles.heartLawTile,
      spiritRoot,
      focusTile: doctrineTiles.focusTile,
      breathTile: doctrineTiles.breathTile,
      cityTile: doctrineTiles.cityTile,
    },
    metrics: buildMetrics(dashboard, context),
    milestone: buildMilestone(dashboard, context),
    cultivationBase: buildCultivationBase(dashboard, context),
    missionRequirements: {
      id: 'mission_requirements',
      title: STATUS_LEDGER_TITLES.missionRequirements,
      rows: missionRequirements,
      emptyState: missionRequirements.length === 0
        ? emptyFactRow(
          'mission-requirements-empty',
          'No active blocker surfaced',
          'Current milestone checks are stable; review Current Work and Best Improvements for useful support routes.',
          'Mission Requirements',
        )
        : null,
    },
    bestImprovements: {
      id: 'best_improvements',
      title: STATUS_LEDGER_TITLES.bestImprovements,
      primary: primaryAction,
      rows: bestImprovements,
      emptyState: bestImprovements.length === 0
        ? emptyFactRow(
          'best-improvements-empty',
          'No urgent improvement surfaced',
          'Current milestone checks are stable; keep cultivation or background support running.',
          'Best Improvements',
        )
        : null,
    },
    safetyNet: buildSafetyNet(dashboard),
    identityDoctrine: buildIdentityDoctrine(dashboard, context),
    currentWork: buildCurrentWork(dashboard),
    buildPreparation: buildBuildPreparation(dashboard),
    recentChanges: buildRecentChanges(dashboard),
    details: buildDetails(dashboard),
  };
}
