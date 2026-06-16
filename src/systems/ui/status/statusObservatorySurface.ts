import type {
  StatusCauseRowSurface,
  StatusCurrentStateSurfaceV1,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerRequirementRow,
  StatusLedgerSurfaceV1,
  StatusLedgerTone,
} from './statusLedgerTypes.js';
import { buildStatusObservatoryNoLoss } from './statusObservatoryNoLoss.js';
import {
  STATUS_OBSERVATORY_CANOPY_CHARM_GEOMETRY,
  STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY,
  STATUS_OBSERVATORY_CANOPY_VISUAL_STATE_LABELS,
  STATUS_OBSERVATORY_EXPECTED_BRANCHES,
  STATUS_OBSERVATORY_HEART_LAW_CHAPTER_BEAD_COUNT,
  STATUS_OBSERVATORY_MERIDIAN_SHARED_CAUSE_LABELS,
  STATUS_OBSERVATORY_ORGAN_LEGEND,
  STATUS_OBSERVATORY_ORGAN_ORDER,
  STATUS_OBSERVATORY_ROOT_BRIDGE_STATE_LABELS,
  STATUS_OBSERVATORY_ROOT_NOTCH_ORDER,
  STATUS_OBSERVATORY_STAT_LEGEND,
} from './statusObservatoryPresentation.js';
import {
  STATUS_OBSERVATORY_SCHEMA_VERSION,
  STATUS_OBSERVATORY_SOURCE_SCHEMA_VERSION,
  type StatusBottleneckInspectorSurface,
  type StatusBottleneckTalismanSlipSurface,
  type StatusCausalThreadSurface,
  type StatusMeridianCauseStampSurface,
  type StatusMeridianFocusLensSurface,
  type StatusMeridianOrganSurface,
  type StatusObservatoryMetricSealSurface,
  type StatusObservatoryMode,
  type StatusObservatoryNoLossFamily,
  type StatusObservatoryStatNodeSurface,
  type StatusObservatorySurfaceV1,
  type StatusObservatoryVisualState,
  type StatusReserveJarSurface,
  type StatusRootAstrolabeRootId,
  type StatusRootLawBridgeSurface,
  type StatusRouteCharmSurface,
  type StatusSelectedContextSurface,
  type StatusStatBranchSurface,
  type StatusWorkWheelSpokeSurface,
} from './statusObservatoryTypes.js';

type OrganId = keyof StatusCurrentStateSurfaceV1['blocks'];

function flattenStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const entry of value) flattenStrings(entry, output);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) flattenStrings(entry, output);
  }
  return output;
}

/**
 * Classify ONLY from the decree hero + onboarding milestone — the fields that
 * carry the genuine state signal (next goal, main bottleneck, realm, "gate trial
 * failed", "reincarnation", "content cap reached"). Flattening the WHOLE ledger
 * leaked unrelated copy into the match — the Safety-Net capacity counter
 * ("0 / 3 eligible defeats"), debug meta notes, and descriptive sentences like
 * "a missing stat is treated as failed" / "through the existing prestige" — which
 * mis-classified a fresh character as post-failure (or prestige).
 */
function decreeStateText(ledger: StatusLedgerSurfaceV1): string {
  return flattenStrings([ledger.hero, ledger.milestone]).join(' ').replace(/\s+/g, ' ').trim();
}

function classifyVisualState(ledger: StatusLedgerSurfaceV1): {
  visualState: StatusObservatoryVisualState;
  debugNotes: string[];
} {
  const text = decreeStateText(ledger).toLowerCase();
  const notes = ['visualState classified from the decree hero + milestone (not the full ledger text).'];

  if (/content cap|chapter cap|cap reached/.test(text)) {
    return { visualState: 'contentCap', debugNotes: notes };
  }
  if (/gate trial failed|failure added|failed|defeat|after failure/.test(text)) {
    return { visualState: 'postFailure', debugNotes: notes };
  }
  if (/prestige|reincarnation|current life efficiency|next life/.test(text)) {
    return { visualState: 'prestigePressure', debugNotes: notes };
  }
  if (/no major blocker|no active blocker surfaced/.test(text)) {
    return { visualState: 'healthy', debugNotes: notes };
  }
  if (/not reached|blocked|below minimum|below floor|opposed|low|at risk|not secure|stability 0|0 \/ 100/.test(text)) {
    return { visualState: 'blocked', debugNotes: notes };
  }
  return { visualState: 'unknown', debugNotes: notes };
}

function observatoryMode(ledger: StatusLedgerSurfaceV1): StatusObservatoryMode {
  if (ledger.meta.mode === 'live' && ledger.meta.contentLoaded) return 'live';
  return 'fallback';
}

function metricSeal(row: StatusLedgerFactRow): StatusObservatoryMetricSealSurface {
  const value = row.value ?? null;
  return {
    id: row.id,
    label: row.label,
    value,
    detail: row.detail,
    tone: row.tone,
    icon: row.icon,
    sourceLabel: row.sourceLabel,
    ariaLabel: `${row.label}: ${value ?? row.detail}. ${row.sourceLabel}.`,
  };
}

function observationRows(ledger: StatusLedgerSurfaceV1) {
  return ledger.spiritRootObservation.tabs.flatMap((tab) => tab.rows.map((row) => ({ ...row, tabId: tab.id })));
}

function observationValue(ledger: StatusLedgerSurfaceV1, idPart: string): string | null {
  const row = observationRows(ledger).find((entry) => entry.id.includes(idPart));
  return row?.value ?? row?.detail ?? null;
}

function currentStateValue(ledger: StatusLedgerSurfaceV1, idPart: string): string | null {
  const rows = Object.values(ledger.currentState.blocks).flatMap((block) => block.detailRows);
  const row = rows.find((entry) => entry.id.includes(idPart) || entry.label.toLowerCase().includes(idPart));
  return row?.value ?? row?.consequence ?? row?.detail ?? null;
}

function toneForBridge(state: StatusRootLawBridgeSurface['state']): StatusLedgerTone {
  if (state === 'aligned') return 'success';
  if (state === 'compatible') return 'jade';
  if (state === 'strained') return 'warning';
  if (state === 'opposed') return 'danger';
  return 'muted';
}

function bridgeForRootLaw(ledger: StatusLedgerSurfaceV1): StatusRootLawBridgeSurface {
  const fit = ledger.spiritRootObservation.fit;
  const bridgeState = (() => {
    if (fit.tier === 'resonant') return 'aligned';
    if (fit.tier === 'compatible' || fit.tier === 'neutral') return 'compatible';
    if (fit.tier === 'strained') return 'strained';
    if (fit.tier === 'opposed') return 'opposed';
    return 'unknown';
  })();
  const bridgeCopy = STATUS_OBSERVATORY_ROOT_BRIDGE_STATE_LABELS[bridgeState];
  const tone = toneForBridge(bridgeState);
  if (fit.tier === 'resonant') {
    return {
      state: bridgeState,
      fitTier: fit.tier,
      label: fit.label,
      detail: fit.summary || bridgeCopy.detail,
      broken: false,
      tone,
      ariaLabel: `${bridgeCopy.label}. ${fit.label}. ${fit.summary || bridgeCopy.detail}`,
    };
  }
  if (fit.tier === 'compatible' || fit.tier === 'neutral') {
    return {
      state: bridgeState,
      fitTier: fit.tier,
      label: fit.label,
      detail: fit.summary || bridgeCopy.detail,
      broken: false,
      tone,
      ariaLabel: `${bridgeCopy.label}. ${fit.label}. ${fit.summary || bridgeCopy.detail}`,
    };
  }
  if (fit.tier === 'strained') {
    return {
      state: bridgeState,
      fitTier: fit.tier,
      label: fit.label,
      detail: fit.summary || bridgeCopy.detail,
      broken: false,
      tone,
      ariaLabel: `${bridgeCopy.label}. ${fit.label}. ${fit.summary || bridgeCopy.detail}`,
    };
  }
  if (fit.tier === 'opposed') {
    return {
      state: bridgeState,
      fitTier: fit.tier,
      label: fit.label,
      detail: fit.summary || bridgeCopy.detail,
      broken: true,
      tone,
      ariaLabel: `${bridgeCopy.label}. ${fit.label}. ${fit.summary || bridgeCopy.detail}`,
    };
  }
  return {
    state: 'unknown',
    fitTier: 'unknown',
    label: 'Unknown fit',
    detail: bridgeCopy.detail,
    broken: false,
    tone,
    ariaLabel: `${bridgeCopy.label}. Unknown fit. ${bridgeCopy.detail}`,
  };
}

function isRootAstrolabeRootId(value: string): value is StatusRootAstrolabeRootId {
  return STATUS_OBSERVATORY_ROOT_NOTCH_ORDER.some((entry) => entry.id === value);
}

function buildRootNotches(ledger: StatusLedgerSurfaceV1): StatusObservatorySurfaceV1['rootLawInstrument']['astrolabe']['notches'] {
  const activeRootId = ledger.identityDoctrine.spiritRoot.element;
  return STATUS_OBSERVATORY_ROOT_NOTCH_ORDER.map((notch) => {
    const active = isRootAstrolabeRootId(activeRootId) && activeRootId === notch.id;
    const tone = active ? ledger.identityDoctrine.spiritRoot.tone : notch.tone;
    return {
      id: notch.id,
      label: notch.label,
      shortLabel: notch.shortLabel,
      angleDeg: notch.angleDeg,
      active,
      tone,
      ariaLabel: `${notch.label}. ${active ? 'Current active Spirit Root.' : 'Visible inactive astrolabe notch.'}`,
    };
  });
}

function procStatusLabel(ledger: StatusLedgerSurfaceV1): string {
  const progression = ledger.spiritRootObservation.progression;
  if (progression.awakening.state === 'dormant' || progression.proc.chancePct <= 0) return 'Inactive';
  return `Ready ${Math.round(progression.proc.chancePct)}%`;
}

function runValidityLabel(ledger: StatusLedgerSurfaceV1): string | null {
  const value = observationValue(ledger, 'fit-lock');
  if (!value) return null;
  const tier = ledger.spiritRootObservation.fit.tier;
  if (tier === 'strained' || tier === 'opposed') return `${value} but ${tier}`;
  return value;
}

function buildRootAstrolabe(ledger: StatusLedgerSurfaceV1): StatusObservatorySurfaceV1['rootLawInstrument']['astrolabe'] {
  const fit = ledger.spiritRootObservation.fit;
  const spiritRoot = ledger.identityDoctrine.spiritRoot;
  const progression = ledger.spiritRootObservation.progression;
  const routeActions = [
    ledger.identityDoctrine.spiritRoot.observationAction,
    ledger.currentState.blocks.spiritRoot.route,
  ].filter((action): action is StatusLedgerActionSurface => Boolean(action));

  return {
    title: 'Spirit Root Astrolabe',
    spiritRoot,
    activeRootId: spiritRoot.element,
    notches: buildRootNotches(ledger),
    gradeLabel: spiritRoot.gradeLabel,
    purityLabel: spiritRoot.purityLabel,
    totalMultiplierLabel: spiritRoot.totalMultiplierLabel,
    fitLabel: fit.label,
    fitTier: fit.tier,
    // Round the effective expression for display (the raw value can be a long
    // float, e.g. 0.0698958…); the cap stays as-is. Presentation only.
    expressionCapLabel: `${
      typeof fit.effectiveExpression === 'number'
        ? Number(fit.effectiveExpression.toFixed(2))
        : fit.effectiveExpression
    } / ${fit.effects.expressionCap}`,
    proc: {
      name: progression.proc.procName,
      statusLabel: procStatusLabel(ledger),
      cooldownLabel: `CD ${progression.proc.cooldownSec}s`,
    },
    runValidityLabel: runValidityLabel(ledger),
    impactRows: ledger.identityDoctrine.rows.filter((row) => /root|resonance|fit|expression/i.test(`${row.id} ${row.label}`)),
    routeActions,
    ariaLabel: `${spiritRoot.elementLabel} Root. ${spiritRoot.gradeLabel}. ${spiritRoot.purityLabel ?? 'Purity unavailable'}. Fit ${fit.label}.`,
  };
}

function parseChapterNumber(label: string): number {
  const match = label.match(/\b(\d+)\b/);
  const parsed = match ? Number.parseInt(match[1], 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildChapterBeads(chapterLabel: string): StatusObservatorySurfaceV1['rootLawInstrument']['heartLawSeal']['chapterBeads'] {
  const activeChapter = Math.min(parseChapterNumber(chapterLabel), STATUS_OBSERVATORY_HEART_LAW_CHAPTER_BEAD_COUNT);
  return Array.from({ length: STATUS_OBSERVATORY_HEART_LAW_CHAPTER_BEAD_COUNT }, (_, index) => {
    const chapter = index + 1;
    return {
      id: `chapter-bead-${chapter}`,
      label: `Chapter ${chapter}`,
      active: chapter === activeChapter,
      filled: chapter <= activeChapter,
    };
  });
}

function buildHeartLawSeal(ledger: StatusLedgerSurfaceV1): StatusObservatorySurfaceV1['rootLawInstrument']['heartLawSeal'] {
  const heartLaw = ledger.identityDoctrine.heartLawTile;
  const clarityLabel = currentStateValue(ledger, 'clarity') ?? observationValue(ledger, 'clarity');
  const turbulenceLabel = currentStateValue(ledger, 'turbulence') ?? observationValue(ledger, 'turbulence');
  return {
    title: 'Heart Law Seal',
    heartLawLabel: heartLaw.value,
    chapterLabel: heartLaw.detail,
    chapterBeads: buildChapterBeads(heartLaw.detail),
    daoHeartStateLabel: ledger.currentState.blocks.daoHeart.valueLabel,
    clarityLabel,
    turbulenceLabel,
    routeAction: ledger.currentState.blocks.daoHeart.route,
    ariaLabel: `Heart Law Seal. ${heartLaw.value}. ${heartLaw.detail}. Clarity ${clarityLabel ?? 'unavailable'}. Turbulence ${turbulenceLabel ?? 'unavailable'}.`,
  };
}

function organStateRank(state: StatusMeridianOrganSurface['state']): number {
  if (state === 'danger') return 0;
  if (state === 'attention') return 1;
  if (state === 'locked') return 2;
  if (state === 'unknown') return 3;
  return 4;
}

function buildMeridianOrgans(ledger: StatusLedgerSurfaceV1): StatusMeridianOrganSurface[] {
  return STATUS_OBSERVATORY_ORGAN_ORDER.map((id, index): StatusMeridianOrganSurface => {
    const block = ledger.currentState.blocks[id];
    return {
      id,
      ordinal: (index + 1) as StatusMeridianOrganSurface['ordinal'],
      title: block.title,
      valueLabel: block.valueLabel,
      state: block.state,
      consequence: block.consequence,
      route: block.route,
      detailRows: block.detailRows,
      icon: block.icon,
      ariaLabel: `${index + 1}. ${block.title}: ${block.valueLabel}. State ${block.state}. ${block.consequence}`,
      sourceBlock: block,
    };
  });
}

function selectedOrgan(organs: StatusMeridianOrganSurface[]): StatusMeridianOrganSurface {
  return [...organs].sort((left, right) => {
    const rankDelta = organStateRank(left.state) - organStateRank(right.state);
    if (rankDelta !== 0) return rankDelta;
    return left.ordinal - right.ordinal;
  })[0] ?? organs[0];
}

function buildFocusLens(organ: StatusMeridianOrganSurface): StatusMeridianFocusLensSurface {
  return {
    selectedOrganId: organ.id,
    label: organ.title,
    value: organ.valueLabel,
    consequence: organ.consequence,
    route: organ.route,
    sources: organ.detailRows.map((row) => row.sourceSystem),
  };
}

function severityToTone(row: StatusCauseRowSurface): StatusLedgerTone {
  if (row.severity === 'blocked' || row.severity === 'danger') return 'danger';
  if (row.severity === 'warning') return 'warning';
  if (row.severity === 'healthy') return 'success';
  return 'info';
}

function sharedCauseLabel(row: StatusCauseRowSurface): string {
  return STATUS_OBSERVATORY_MERIDIAN_SHARED_CAUSE_LABELS[
    row.id as keyof typeof STATUS_OBSERVATORY_MERIDIAN_SHARED_CAUSE_LABELS
  ] ?? row.label;
}

function causeStamp(row: StatusCauseRowSurface): StatusMeridianCauseStampSurface {
  const label = sharedCauseLabel(row);
  const detail = row.consequence || row.detail;
  return {
    id: row.id,
    label,
    value: row.value ?? null,
    detail,
    tone: severityToTone(row),
    sourceLabel: row.sourceSystem || 'Status Analysis',
    ariaLabel: `${label}: ${row.value || detail}. Source ${row.sourceSystem || 'Status Analysis'}.`,
  };
}

function statNodeFromSource(stat: StatusLedgerSurfaceV1['namedStats']['allStats'][number]): StatusObservatoryStatNodeSurface {
  const value = `${stat.currentRating} / ${stat.cap}`;
  return {
    id: stat.id,
    displayName: stat.displayName,
    shortLabel: stat.shortLabel,
    label: stat.label,
    detail: stat.detail,
    path: stat.path,
    branchId: stat.branchId,
    category: stat.category,
    tier: stat.tier,
    sourceSystems: [...stat.sourceSystems],
    effectSummary: stat.effectSummary,
    currentRating: stat.currentRating,
    cap: stat.cap,
    capPct: stat.capPct,
    unlockRealmIndex: stat.unlockRealmIndex,
    unlockRealmLabel: stat.unlockRealmLabel,
    lockedReason: stat.lockedReason,
    unlockState: stat.unlockState,
    nodeState: stat.nodeState,
    contributionState: stat.contributionState,
    visible: true,
    weakLink: stat.weakLink,
    weakReason: stat.weakReason,
    tone: stat.tone,
    routeAction: stat.routeAction,
    detailRows: stat.detailRows,
    ariaLabel: `${stat.displayName}. Path ${stat.path}. State ${stat.nodeState}. Value ${value}. ${stat.effectSummary}`,
  };
}

function selectLensDefault(nodes: readonly StatusObservatoryStatNodeSurface[]): string | null {
  return nodes.find((node) => node.weakLink)?.id
    ?? nodes.find((node) => node.nodeState === 'lit')?.id
    ?? nodes[0]?.id
    ?? null;
}

function branchPaths(ledger: StatusLedgerSurfaceV1): StatusStatBranchSurface[] {
  const counts = {
    universal: ledger.namedStats.universal.length,
    heaven: ledger.namedStats.heaven.length,
    earth: ledger.namedStats.earth.length,
    martial: ledger.namedStats.martial.length,
  };
  return STATUS_OBSERVATORY_EXPECTED_BRANCHES.map((branch) => ({
    ...branch,
    actualCount: counts[branch.id],
  }));
}

function causeThreadFromRow(row: StatusCauseRowSurface, index: number): StatusCausalThreadSurface {
  return {
    id: `cause-thread-${row.id || index}`,
    fromFamily: 'meridianVessel',
    fromId: row.id,
    toFamily: 'bottleneckCanopy',
    toId: 'central-edict',
    label: row.label,
    detail: row.consequence || row.detail,
    tone: row.severity === 'danger' || row.severity === 'blocked'
      ? 'danger'
      : row.severity === 'warning'
        ? 'warning'
        : row.severity === 'healthy'
          ? 'success'
          : 'info',
  };
}

function statThread(node: StatusObservatoryStatNodeSurface): StatusCausalThreadSurface {
  return {
    id: `stat-thread-${node.id}`,
    fromFamily: 'statConstellation',
    fromId: node.id,
    toFamily: 'bottleneckCanopy',
    toId: 'central-edict',
    label: node.displayName,
    detail: node.weakReason ?? node.detail,
    tone: node.tone,
  };
}

function visualStateTone(visualState: StatusObservatoryVisualState): StatusLedgerTone {
  if (visualState === 'healthy') return 'success';
  if (visualState === 'prestigePressure' || visualState === 'contentCap') return 'gold';
  if (visualState === 'postFailure' || visualState === 'blocked') return 'danger';
  return 'muted';
}

function blockStateTone(state: StatusCurrentStateSurfaceV1['blocks'][OrganId]['state']): StatusLedgerTone {
  if (state === 'danger') return 'danger';
  if (state === 'attention') return 'warning';
  if (state === 'locked') return 'muted';
  if (state === 'unknown') return 'info';
  return 'success';
}

function blockStateLabel(state: StatusCurrentStateSurfaceV1['blocks'][OrganId]['state']): string {
  if (state === 'danger') return 'At Risk';
  if (state === 'attention') return 'Needs Work';
  if (state === 'locked') return 'Locked';
  if (state === 'unknown') return 'Unknown';
  return 'Stable';
}

function sourceFamilyLabel(family: StatusObservatoryNoLossFamily): string {
  if (family === 'missionRequirements') return 'Mission Requirements';
  if (family === 'currentState') return 'Current State';
  if (family === 'spiritRootObservation') return 'Root / Law Fit';
  if (family === 'namedStats') return 'Named Stats';
  if (family === 'bestImprovements') return 'Best Improvements';
  if (family === 'safetyNet') return 'Safety Net';
  return 'Status Analysis';
}

function routeLabel(action: StatusLedgerActionSurface | null): string | null {
  if (!action) return null;
  return action.destinationLabel ? `${action.label} -> ${action.destinationLabel}` : action.label;
}

function priorityRank(label: string | null): number {
  if (!label) return 4;
  const match = label.match(/\b(\d+)\b/);
  return match ? Number.parseInt(match[1], 10) : 3;
}

function toneRank(tone: StatusLedgerTone): number {
  if (tone === 'danger') return 0;
  if (tone === 'warning') return 1;
  if (tone === 'gold') return 2;
  if (tone === 'jade' || tone === 'success') return 3;
  if (tone === 'info') return 4;
  return 5;
}

function talismanAriaLabel(slip: Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>): string {
  const state = slip.priorityLabel ?? slip.stateLabel ?? slip.sourceLabel;
  const route = slip.routeAction ? ` Route ${slip.routeAction.label}.` : '';
  return `${slip.title}. ${state}. ${slip.detail}.${route}`;
}

function withSlipGeometry(
  slips: readonly Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>[],
): StatusBottleneckTalismanSlipSurface[] {
  return slips.map((slip, index) => {
    const geometry = STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY[index % STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY.length];
    return {
      ...slip,
      geometry,
      ariaLabel: talismanAriaLabel(slip),
    };
  });
}

function requirementSlip(row: StatusLedgerRequirementRow): Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'> {
  return {
    id: `requirement-${row.id}`,
    title: row.label,
    priorityLabel: row.priorityLabel,
    stateLabel: row.gapLabel ?? row.value ?? row.sourceModuleLabel ?? row.sourceLabel,
    detail: row.detail,
    tone: row.tone,
    routeAction: row.action ?? null,
    routeLabel: routeLabel(row.action ?? null),
    sourceFamily: 'missionRequirements',
    sourceLabel: row.sourceModuleLabel ?? row.sourceLabel,
    detailRows: [row],
  };
}

function emptyRequirementSlip(
  row: StatusLedgerFactRow,
  visualState: StatusObservatoryVisualState,
): Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'> {
  return {
    id: 'requirement-empty',
    title: row.label,
    priorityLabel: visualState === 'healthy' ? 'Maintain' : null,
    stateLabel: row.value ?? sourceFamilyLabel('missionRequirements'),
    detail: row.detail,
    tone: row.tone,
    routeAction: row.action ?? null,
    routeLabel: routeLabel(row.action ?? null),
    sourceFamily: 'missionRequirements',
    sourceLabel: row.sourceLabel,
    detailRows: [row],
  };
}

function currentStateSlip(
  id: OrganId,
  block: StatusCurrentStateSurfaceV1['blocks'][OrganId],
): Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'> {
  return {
    id: `current-state-${id}`,
    title: block.title,
    priorityLabel: block.state === 'danger' ? 'Priority 1' : block.state === 'attention' ? 'Priority 2' : null,
    stateLabel: blockStateLabel(block.state),
    detail: block.consequence,
    tone: blockStateTone(block.state),
    routeAction: block.route,
    routeLabel: routeLabel(block.route),
    sourceFamily: 'currentState',
    sourceLabel: 'Current State',
    detailRows: [...block.detailRows],
  };
}

function rootLawSlip(
  ledger: StatusLedgerSurfaceV1,
  bridge: StatusRootLawBridgeSurface,
): Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'> {
  const rows = [
    ...ledger.currentState.blocks.spiritRoot.detailRows,
    ...ledger.identityDoctrine.rows.filter((row) => /root|law|fit|resonance/i.test(`${row.id} ${row.label}`)),
  ].slice(0, 4);
  const route = ledger.currentState.blocks.spiritRoot.route ?? ledger.identityDoctrine.spiritRoot.observationAction;
  return {
    id: 'root-law-fit',
    title: 'Root / Law fit',
    priorityLabel: bridge.broken ? 'Risk' : null,
    stateLabel: bridge.label,
    detail: bridge.detail,
    tone: bridge.tone,
    routeAction: route,
    routeLabel: routeLabel(route),
    sourceFamily: 'spiritRootObservation',
    sourceLabel: 'Root / Law Fit',
    detailRows: rows.length > 0 ? rows : ledger.currentState.blocks.spiritRoot.detailRows,
  };
}

function weakLinkSlip(
  node: StatusObservatoryStatNodeSurface,
): Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'> {
  return {
    id: `named-stat-${node.id}`,
    title: node.displayName,
    priorityLabel: node.weakLink ? 'Weak Link' : null,
    stateLabel: node.nodeState,
    detail: node.weakReason ?? node.effectSummary,
    tone: node.tone,
    routeAction: node.routeAction,
    routeLabel: routeLabel(node.routeAction),
    sourceFamily: 'namedStats',
    sourceLabel: 'Named Stats',
    detailRows: [...node.detailRows],
  };
}

function healthyMaintenanceSlips(
  ledger: StatusLedgerSurfaceV1,
): Array<Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>> {
  const blocks = ledger.currentState.blocks;
  return [
    currentStateSlip('cultivation', blocks.cultivation),
    currentStateSlip('buildPrep', blocks.buildPrep),
    currentStateSlip('activeWork', blocks.activeWork),
  ].map((slip) => ({
    ...slip,
    priorityLabel: slip.priorityLabel ?? 'Maintain',
    tone: slip.tone === 'danger' || slip.tone === 'warning' ? slip.tone : 'success',
  }));
}

function chooseCanopySlips(
  visualState: StatusObservatoryVisualState,
  candidates: readonly Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>[],
): Array<Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>> {
  const unique = new Map<string, Omit<StatusBottleneckTalismanSlipSurface, 'ariaLabel' | 'geometry'>>();
  for (const slip of candidates) {
    if (!unique.has(slip.id)) unique.set(slip.id, slip);
  }
  const ordered = [...unique.values()].sort((left, right) => {
    const toneDelta = toneRank(left.tone) - toneRank(right.tone);
    if (toneDelta !== 0) return toneDelta;
    const priorityDelta = priorityRank(left.priorityLabel) - priorityRank(right.priorityLabel);
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title);
  });
  if (visualState === 'healthy') {
    return ordered.slice(0, 5);
  }
  return ordered.slice(0, 6);
}

function buildTalismanSlips(
  ledger: StatusLedgerSurfaceV1,
  visualState: StatusObservatoryVisualState,
  bridge: StatusRootLawBridgeSurface,
  weakLinks: readonly StatusObservatoryStatNodeSurface[],
): StatusBottleneckTalismanSlipSurface[] {
  const requirementSlips = ledger.missionRequirements.rows.map(requirementSlip);
  const emptySlip = ledger.missionRequirements.emptyState
    ? [emptyRequirementSlip(ledger.missionRequirements.emptyState, visualState)]
    : [];
  const blockEntries = Object.entries(ledger.currentState.blocks) as [OrganId, StatusCurrentStateSurfaceV1['blocks'][OrganId]][];
  const currentStateSlips = blockEntries
    .filter(([, block]) => block.state !== 'healthy')
    .map(([id, block]) => currentStateSlip(id, block));
  const maintenanceSlips = healthyMaintenanceSlips(ledger);
  const rootSlip = rootLawSlip(ledger, bridge);
  const weakSlips = weakLinks.slice(0, 2).map(weakLinkSlip);
  const candidateSlips = visualState === 'healthy'
    ? [...maintenanceSlips, rootSlip, ...emptySlip, ...requirementSlips]
    : [...currentStateSlips, rootSlip, ...weakSlips, ...requirementSlips, ...emptySlip, ...maintenanceSlips];

  return withSlipGeometry(chooseCanopySlips(visualState, candidateSlips));
}

function routeCharms(
  ledger: StatusLedgerSurfaceV1,
  slips: readonly StatusBottleneckTalismanSlipSurface[],
): StatusRouteCharmSurface[] {
  const actions = [
    ledger.bestImprovements.primary,
    ...ledger.bestImprovements.rows,
    ledger.currentState.nextBottleneck.primary,
    ...ledger.currentState.nextBottleneck.secondary,
    ...Object.values(ledger.currentState.blocks).map((block) => block.route),
    ...slips.map((slip) => slip.routeAction),
    ledger.safetyNet.action,
  ].filter((action): action is StatusLedgerActionSurface => Boolean(action));
  const seen = new Set<string>();
  return actions
    .filter((action) => {
      if (seen.has(action.id)) return false;
      seen.add(action.id);
      return true;
    })
    .slice(0, STATUS_OBSERVATORY_CANOPY_CHARM_GEOMETRY.length)
    .map((action, index) => ({
      id: `route-charm-${action.id}`,
      label: action.label,
      detail: action.detail,
      action,
      order: index + 1,
      geometry: STATUS_OBSERVATORY_CANOPY_CHARM_GEOMETRY[index],
    }));
}

function chooseDefaultSlipId(slips: readonly StatusBottleneckTalismanSlipSurface[]): string | null {
  return slips.find((slip) => /Priority 1/i.test(slip.priorityLabel ?? '') && (slip.tone === 'danger' || slip.tone === 'warning'))?.id
    ?? slips.find((slip) => slip.tone === 'danger')?.id
    ?? slips.find((slip) => slip.tone === 'warning')?.id
    ?? slips.find((slip) => slip.routeAction)?.id
    ?? slips[0]?.id
    ?? null;
}

function buildBottleneckInspector(slips: readonly StatusBottleneckTalismanSlipSurface[]): StatusBottleneckInspectorSurface {
  const selectedSlipId = chooseDefaultSlipId(slips);
  const slip = selectedSlipId ? slips.find((entry) => entry.id === selectedSlipId) ?? null : slips[0] ?? null;
  if (!slip) {
    return {
      selectedSlipId: null,
      title: 'No slip selected',
      detail: 'No bottleneck slip is available from the current Status surface.',
      sourceFamily: null,
      sourceLabel: 'Status Analysis',
      priorityLabel: null,
      stateLabel: null,
      tone: 'muted',
      routeAction: null,
      detailRows: [],
    };
  }
  return {
    selectedSlipId: slip.id,
    title: slip.title,
    detail: slip.detail,
    sourceFamily: slip.sourceFamily,
    sourceLabel: slip.sourceLabel,
    priorityLabel: slip.priorityLabel,
    stateLabel: slip.stateLabel,
    tone: slip.tone,
    routeAction: slip.routeAction,
    detailRows: slip.detailRows,
  };
}

function safetySeal(
  ledger: StatusLedgerSurfaceV1,
  visualState: StatusObservatoryVisualState,
): StatusObservatorySurfaceV1['bottleneckCanopy']['safetySeal'] {
  const firstRow = ledger.safetyNet.rows[0] ?? null;
  const progressRow = ledger.safetyNet.rows[1] ?? ledger.safetyNet.rows[0] ?? null;
  return {
    label: ledger.safetyNet.title,
    stateLabel: firstRow?.value ?? firstRow?.detail ?? (visualState === 'healthy' ? 'Not active / not needed' : 'Inactive / unavailable'),
    progressLabel: progressRow?.value ?? progressRow?.detail ?? '0 / threshold',
    tone: firstRow?.tone ?? visualStateTone(visualState),
    action: ledger.safetyNet.action,
    rows: ledger.safetyNet.rows,
  };
}

function reserveJar(row: StatusLedgerFactRow): StatusReserveJarSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value ?? null,
    detail: row.detail,
    tone: row.tone,
    sourceLabel: row.sourceLabel,
  };
}

function workSpoke(row: StatusLedgerFactRow): StatusWorkWheelSpokeSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value ?? null,
    detail: row.detail,
    tone: row.tone,
    route: row.action ?? null,
  };
}

function selectedContext(args: {
  organ: StatusMeridianOrganSurface;
  selectedStat: StatusObservatoryStatNodeSurface | null;
  slips: readonly StatusBottleneckTalismanSlipSurface[];
  bridge: StatusRootLawBridgeSurface;
}): StatusSelectedContextSurface | null {
  if (args.selectedStat?.weakLink) {
    return {
      kind: 'stat',
      id: args.selectedStat.id,
      label: args.selectedStat.displayName,
      detail: args.selectedStat.weakReason ?? args.selectedStat.detail,
    };
  }
  const selectedSlip = args.slips.find((slip) => slip.tone === 'danger' || slip.tone === 'warning') ?? args.slips[0] ?? null;
  if (selectedSlip) {
    return {
      kind: 'talisman',
      id: selectedSlip.id,
      label: selectedSlip.title,
      detail: selectedSlip.detail,
    };
  }
  if (args.bridge.broken) {
    return {
      kind: 'rootLaw',
      id: 'root-law-bridge',
      label: args.bridge.label,
      detail: args.bridge.detail,
    };
  }
  return {
    kind: 'organ',
    id: args.organ.id,
    label: args.organ.title,
    detail: args.organ.consequence,
  };
}

export function buildStatusObservatorySurface(ledger: StatusLedgerSurfaceV1): StatusObservatorySurfaceV1 {
  const noLoss = buildStatusObservatoryNoLoss(ledger);
  const classification = classifyVisualState(ledger);
  const organs = buildMeridianOrgans(ledger);
  const focusOrgan = selectedOrgan(organs);
  const nodes = ledger.namedStats.allStats.map(statNodeFromSource);
  const selectedStatId = selectLensDefault(nodes);
  const selectedStat = selectedStatId ? nodes.find((node) => node.id === selectedStatId) ?? null : null;
  const weakLinks = nodes.filter((node) => node.weakLink);
  const bridge = bridgeForRootLaw(ledger);
  const talismanSlips = buildTalismanSlips(ledger, classification.visualState, bridge, weakLinks);
  const causalThreads = [
    ...ledger.currentState.sharedCauseRows.map(causeThreadFromRow),
    ...weakLinks.map(statThread),
  ];
  const routeCharmSurfaces = routeCharms(ledger, talismanSlips);
  const bottleneckInspector = buildBottleneckInspector(talismanSlips);
  const foreground = ledger.currentWork.activityTiles[0] ?? null;

  return {
    meta: {
      rootTestId: 'status-ledger-root',
      schemaVersion: STATUS_OBSERVATORY_SCHEMA_VERSION,
      sourceSchemaVersion: STATUS_OBSERVATORY_SOURCE_SCHEMA_VERSION,
      mode: observatoryMode(ledger),
      visualState: classification.visualState,
      selectedContext: selectedContext({
        organ: focusOrgan,
        selectedStat,
        slips: talismanSlips,
        bridge,
      }),
      currentPath: ledger.namedStats.currentPath,
      generatedAt: ledger.meta.generatedAt,
      contentLoaded: ledger.meta.contentLoaded,
      debugNotes: [
        ...ledger.meta.debugNotes,
        ...ledger.namedStats.debugNotes,
        ...classification.debugNotes,
      ],
    },
    lifeDecree: {
      rootTestId: 'status-ledger-hero',
      title: classification.visualState === 'prestigePressure' ? 'Life Decree - This Life Record' : 'Life Decree',
      hero: ledger.hero,
      milestone: ledger.milestone,
    },
    vitalsRibbon: {
      rootTestId: 'status-ledger-metrics',
      title: 'Vitals Ribbon',
      metrics: ledger.metrics,
      seals: ledger.metrics.map(metricSeal),
    },
    rootLawInstrument: {
      rootTestId: 'status-root-law-instrument',
      title: 'Root / Law Coupled Instrument',
      astrolabe: buildRootAstrolabe(ledger),
      heartLawSeal: buildHeartLawSeal(ledger),
      bridge,
      spiritRootObservation: ledger.spiritRootObservation,
    },
    meridianVessel: {
      rootTestId: 'status-current-state',
      title: 'Meridian Vessel Compass',
      organs,
      focusLens: buildFocusLens(focusOrgan),
      sharedCauseStamps: ledger.currentState.sharedCauseRows.map(causeStamp),
      sharedCauseRows: ledger.currentState.sharedCauseRows,
      buffDebuffRows: ledger.currentState.buffDebuffRows,
      nextBottleneck: ledger.currentState.nextBottleneck,
      legend: STATUS_OBSERVATORY_ORGAN_LEGEND,
    },
    statConstellation: {
      rootTestId: 'status-stat-constellation',
      title: ledger.namedStats.title,
      subtitle: '28 Named Stats - all paths visible',
      currentPath: ledger.namedStats.currentPath,
      nodes,
      selectedLensDefaultStatId: selectedStatId,
      branchCounts: {
        universal: ledger.namedStats.universal.length,
        heaven: ledger.namedStats.heaven.length,
        earth: ledger.namedStats.earth.length,
        martial: ledger.namedStats.martial.length,
      },
      branchPaths: branchPaths(ledger),
      weakLinks,
      bridgeSockets: ledger.namedStats.bridgeSockets,
      legend: STATUS_OBSERVATORY_STAT_LEGEND,
      causalThreads: weakLinks.map(statThread),
    },
    bottleneckCanopy: {
      rootTestId: 'status-bottleneck-canopy',
      title: 'Bottleneck Talisman Canopy',
      subtitle: 'The node of obstruction and the paths to resolution.',
      centralEdict: {
        label: ledger.hero.mainBottleneckLabel || STATUS_OBSERVATORY_CANOPY_VISUAL_STATE_LABELS[classification.visualState],
        detail: ledger.hero.mainBottleneckDetail,
        sourceLabel: 'Status Analysis',
        visualState: classification.visualState,
        primaryAction: ledger.hero.primaryAction,
      },
      talismanSlips,
      routeCharms: routeCharmSurfaces,
      safetySeal: safetySeal(ledger, classification.visualState),
      causalThreads,
      inspector: bottleneckInspector,
      missionRequirements: ledger.missionRequirements,
      bestImprovements: ledger.bestImprovements,
      safetyNet: ledger.safetyNet,
    },
    buildPreparation: {
      rootTestId: 'status-ledger-build-preparation',
      title: 'Build & Preparation',
      scales: {
        title: 'Build & Preparation Scales',
        build: ledger.buildPreparation.build,
        preparation: ledger.buildPreparation.preparation,
        fulcrumLabel: ledger.buildPreparation.topWarning?.label ?? 'Build readiness',
        lowStateRows: [...ledger.buildPreparation.buildRows, ...ledger.buildPreparation.reserveRows]
          .filter((row) => row.tone === 'danger' || row.tone === 'warning'),
      },
      reserveJars: ledger.buildPreparation.reserveRows.map(reserveJar),
      rows: [...ledger.buildPreparation.buildRows, ...ledger.buildPreparation.reserveRows],
    },
    workWheel: {
      rootTestId: 'status-ledger-current-work',
      title: 'Current Work Wheel',
      foreground,
      spokes: [...ledger.currentWork.activityTiles, ...ledger.currentWork.rows].map(workSpoke),
      rows: ledger.currentWork.rows,
    },
    ledgerRail: {
      rootTestId: 'status-ledger-details',
      title: 'Folded Ledger Rail',
      recentChanges: ledger.recentChanges,
      details: ledger.details,
      noLossFamilies: noLoss.families,
    },
    drawers: {
      spiritRootObservation: ledger.spiritRootObservation,
      calculation: ledger.details,
      recentChanges: ledger.recentChanges,
      buildPreparation: {
        title: 'Build & Preparation Ledger',
        rows: [...ledger.buildPreparation.buildRows, ...ledger.buildPreparation.reserveRows],
        buildRows: ledger.buildPreparation.buildRows,
        reserveRows: ledger.buildPreparation.reserveRows,
      },
      currentWork: {
        title: 'Current Work Ledger',
        foreground,
        spokes: [...ledger.currentWork.activityTiles, ...ledger.currentWork.rows].map(workSpoke),
        rows: ledger.currentWork.rows,
      },
      missionRequirements: ledger.missionRequirements.rows,
      selectedStatLens: selectedStat,
      selectedOrganLens: focusOrgan,
    },
    noLoss,
    rawLedger: ledger,
  };
}
