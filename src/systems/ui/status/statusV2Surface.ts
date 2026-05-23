import type { IconId } from '../../../ui/icons/index.js';
import type {
  DaoMandateRoute,
  DaoMandateSurfaceV1,
  DaoRecentOmen,
} from '../daoMandate/index.js';
import {
  buildDaoOmenProjectionV1,
  type DaoCurrentOmenV1,
  type DaoOmenDirectRouteReason,
  type DaoOmenProjectionV1,
  type DaoPressureBadgeV1,
  type DaoProofSealKind,
  type DaoProofSealV1,
  type DaoReflectionV1,
  type DaoSourceThreadV1,
} from '../daoMandate/index.js';
import type {
  StatusCurrentWorkSurface,
  StatusFactRow,
  StatusTone,
} from './statusDashboardSurface.js';
import type { StatusTroubleshootingSurface } from './statusTroubleshootingSurface.js';

export interface StatusV2ActionSurface {
  id: string;
  label: string;
  detail: string;
  route: DaoMandateRoute;
  disabled: boolean;
  disabledReason: string | null;
  source: 'current_omen' | 'proof' | 'source_thread' | 'reflection';
}

export interface StatusV2FactRow {
  id: string;
  label: string;
  value?: string;
  detail: string;
  tone: StatusTone;
  icon: IconId;
  source: string;
}

export interface StatusV2WorkRow extends StatusV2FactRow {
  kind: 'foreground' | 'combat' | 'bounty' | 'expedition' | 'queue';
}

export interface StatusV2RecentOmenRow {
  id: string;
  label: string;
  detail: string;
  tone: StatusTone;
  source: string;
}

export interface StatusV2Surface {
  meta: {
    rootTestId: 'status-v2-root';
    mode: 'live';
    generatedAt: number;
    contentLoaded: boolean;
    debugNotes: string[];
  };
  projection: DaoOmenProjectionV1;
  hero: {
    realmName: string;
    stageText: string;
    pathLabel: string;
    heartLawLabel: string;
    spiritRootLabel: string;
    cityLabel: string;
    archetypeLabel: string;
    omen: DaoCurrentOmenV1;
  };
  metrics: StatusFactRow[];
  cards: {
    currentOmen: {
      title: 'Current Omen';
      omen: DaoCurrentOmenV1;
      action: StatusV2ActionSurface | null;
      inspectLabel: 'Inspect Details';
    };
    gateProof: {
      title: 'Gate Proof';
      seals: DaoProofSealV1[];
      emptyState: string;
    };
    lifeIdentity: {
      title: 'Life Identity';
      rows: StatusV2FactRow[];
    };
    preparationHealth: {
      title: 'Preparation Health';
      badges: DaoPressureBadgeV1[];
      emptyState: string;
    };
    currentWork: {
      title: 'Current Work';
      rows: StatusV2WorkRow[];
      emptyState: string;
    };
    recentOmens: {
      title: 'Recent Omens';
      rows: StatusV2RecentOmenRow[];
      reflections: DaoReflectionV1[];
      emptyState: string;
    };
  };
  drawers: {
    proofDetails: DaoProofSealV1[];
    sourceThreads: DaoSourceThreadV1[];
    reflections: DaoReflectionV1[];
  };
}

export interface BuildStatusV2SurfaceArgs {
  rawMandate: DaoMandateSurfaceV1;
  troubleshooting: StatusTroubleshootingSurface;
  metrics: StatusFactRow[];
  currentWork: StatusCurrentWorkSurface;
  cityLabel: string;
  contentLoaded: boolean;
  generatedAt: number;
  debugNotes: string[];
}

const GATE_PROOF_KIND_ORDER: DaoProofSealKind[] = [
  'realm_edge',
  'qi_threshold',
  'gate_proof',
  'mercy_seal',
  'reincarnation',
  'path',
  'heart_law',
];

export function buildStatusV2Surface(args: BuildStatusV2SurfaceArgs): StatusV2Surface {
  const projection = buildDaoOmenProjectionV1(args.rawMandate, {
    currentScreen: 'status',
    routeContext: 'default',
    now: args.generatedAt,
  });
  const proofSeals = selectGateProofSeals(projection.proofSeals);
  const pressureBadges = projection.pressureBadges.slice(0, 3);

  return {
    meta: {
      rootTestId: 'status-v2-root',
      mode: 'live',
      generatedAt: args.generatedAt,
      contentLoaded: args.contentLoaded,
      debugNotes: [...args.debugNotes, ...(projection.debug?.notes ?? [])],
    },
    projection,
    hero: {
      realmName: args.troubleshooting.realmName,
      stageText: args.troubleshooting.stageText,
      pathLabel: args.troubleshooting.pathLabel,
      heartLawLabel: args.troubleshooting.identity.heartLawName,
      spiritRootLabel: `${args.troubleshooting.identity.spiritRootSummary.element} - ${args.troubleshooting.identity.spiritRootSummary.grade}`,
      cityLabel: args.cityLabel,
      archetypeLabel: args.troubleshooting.archetypeLabel,
      omen: projection.currentOmen,
    },
    metrics: args.metrics.slice(0, 4),
    cards: {
      currentOmen: {
        title: 'Current Omen',
        omen: projection.currentOmen,
        action: actionFromCurrentOmen(projection.currentOmen),
        inspectLabel: 'Inspect Details',
      },
      gateProof: {
        title: 'Gate Proof',
        seals: proofSeals,
        emptyState: 'No gate proof pressure is visible.',
      },
      lifeIdentity: {
        title: 'Life Identity',
        rows: buildLifeIdentityRows(args.troubleshooting, args.cityLabel),
      },
      preparationHealth: {
        title: 'Preparation Health',
        badges: pressureBadges,
        emptyState: 'Preparation pressure is quiet.',
      },
      currentWork: {
        title: 'Current Work',
        rows: buildStatusV2WorkRows(args.currentWork),
        emptyState: 'No active work is shaping this life.',
      },
      recentOmens: {
        title: 'Recent Omens',
        rows: projection.recentOmens.slice(0, 3).map(toRecentOmenRow),
        reflections: projection.reflections.slice(0, 2),
        emptyState: 'No recent reflection has changed the surface.',
      },
    },
    drawers: {
      proofDetails: projection.proofSeals,
      sourceThreads: projection.sourceThreads,
      reflections: projection.reflections,
    },
  };
}

export function actionFromProofSeal(seal: DaoProofSealV1): StatusV2ActionSurface | null {
  if (!seal.route || seal.routePolicy === 'hidden') return null;
  return {
    id: `proof-${seal.id}`,
    label: seal.routePolicy === 'direct' ? labelForDirectReason('hard_lock') : 'Inspect Details',
    detail: seal.detail,
    route: seal.route,
    disabled: false,
    disabledReason: null,
    source: 'proof',
  };
}

export function actionFromSourceThread(thread: DaoSourceThreadV1): StatusV2ActionSurface | null {
  if (!['hard_lock', 'local_owner'].includes(thread.routeVisibility)) return null;
  const route = thread.bestSource?.route ?? thread.fallbackSources.find((entry) => entry.route)?.route;
  if (!route) return null;
  return {
    id: `source-thread-${thread.id}`,
    label: thread.routeVisibility === 'hard_lock' ? labelForDirectReason('hard_lock') : 'Inspect Details',
    detail: thread.evidenceLine,
    route,
    disabled: false,
    disabledReason: null,
    source: 'source_thread',
  };
}

export function actionFromReflection(reflection: DaoReflectionV1): StatusV2ActionSurface | null {
  if (!reflection.correctionRoute) return null;
  return {
    id: `reflection-${reflection.id}`,
    label: labelForDirectReason('repeated_failure'),
    detail: reflection.detail,
    route: reflection.correctionRoute,
    disabled: false,
    disabledReason: null,
    source: 'reflection',
  };
}

function actionFromCurrentOmen(omen: DaoCurrentOmenV1): StatusV2ActionSurface | null {
  if (!omen.allowDirectRoute || !omen.route || !omen.directRouteReason) return null;
  return {
    id: `current-omen-${omen.id}`,
    label: labelForDirectReason(omen.directRouteReason),
    detail: omen.detail,
    route: omen.route,
    disabled: false,
    disabledReason: null,
    source: 'current_omen',
  };
}

function labelForDirectReason(reason: DaoOmenDirectRouteReason): string {
  switch (reason) {
    case 'hard_lock':
    case 'safety_net':
      return 'Inspect Gate';
    case 'breakthrough':
      return 'Break Through';
    case 'reincarnation':
    case 'content_cap':
      return 'Review Reincarnation';
    case 'repeated_failure':
      return 'Review Reflection';
    case 'setup':
    case 'player_expanded':
      return 'Inspect Details';
  }
}

function selectGateProofSeals(seals: DaoProofSealV1[]): DaoProofSealV1[] {
  const byId = new Map<string, DaoProofSealV1>();
  for (const kind of GATE_PROOF_KIND_ORDER) {
    for (const seal of seals) {
      if (seal.kind === kind && !byId.has(seal.id)) byId.set(seal.id, seal);
    }
  }
  for (const seal of seals) {
    if (!byId.has(seal.id)) byId.set(seal.id, seal);
  }
  return [...byId.values()].slice(0, 4);
}

function buildLifeIdentityRows(troubleshooting: StatusTroubleshootingSurface, cityLabel: string): StatusV2FactRow[] {
  return [
    { id: 'path', label: 'Path', value: troubleshooting.pathLabel, detail: 'Chosen cultivation road.', tone: 'info', icon: 'bookHeaven', source: 'statusTroubleshootingSurface.identity' },
    { id: 'heart-law', label: 'Heart Law', value: troubleshooting.identity.heartLawName, detail: troubleshooting.identity.heartLawVerse, tone: 'info', icon: 'bookMartial', source: 'statusTroubleshootingSurface.identity' },
    { id: 'spirit-root', label: 'Spirit Root', value: troubleshooting.identity.spiritRootSummary.element, detail: troubleshooting.identity.spiritRootSummary.grade, tone: 'info', icon: 'inkSwirl', source: 'statusTroubleshootingSurface.identity' },
    { id: 'city', label: 'City', value: cityLabel, detail: 'Current city anchor.', tone: 'muted', icon: 'artifactBundle', source: 'cityStore.currentCityId' },
    { id: 'realm', label: 'Realm', value: troubleshooting.realmName, detail: troubleshooting.stageText, tone: 'info', icon: 'foundationPill', source: 'game.realm' },
    { id: 'focus', label: 'Focus', value: troubleshooting.identity.focusMode, detail: 'Current focus posture.', tone: 'muted', icon: 'inkBolt', source: 'game.focusMode' },
  ];
}

function buildStatusV2WorkRows(currentWork: StatusCurrentWorkSurface): StatusV2WorkRow[] {
  const rows: StatusV2WorkRow[] = [];
  if (currentWork.foregroundActivity.label !== 'No foreground activity') {
    rows.push({
      id: 'foreground-activity',
      label: currentWork.foregroundActivity.label,
      value: 'Foreground',
      detail: currentWork.foregroundActivity.detail,
      tone: currentWork.foregroundActivity.tone,
      icon: currentWork.foregroundActivity.icon,
      source: 'activityStore.active',
      kind: 'foreground',
    });
  }

  if (currentWork.activeCombat) rows.push({ ...currentWork.activeCombat, kind: 'combat' });
  if (currentWork.trackedBounty) rows.push({ ...currentWork.trackedBounty, kind: 'bounty' });
  if (currentWork.expeditions && currentWork.expeditions.tone !== 'muted') {
    rows.push({ ...currentWork.expeditions, kind: 'expedition' });
  }

  currentWork.queues.slice(0, Math.max(0, 4 - rows.length)).forEach((row) => {
    rows.push({ ...row, kind: 'queue' });
  });

  return rows.slice(0, 4);
}

function toRecentOmenRow(omen: DaoRecentOmen): StatusV2RecentOmenRow {
  return {
    id: omen.id,
    label: omen.label,
    detail: omen.memoryLine || omen.detail,
    tone: toneFromDaoTone(omen.tone),
    source: omen.source,
  };
}

function toneFromDaoTone(tone: DaoRecentOmen['tone']): StatusTone {
  switch (tone) {
    case 'success':
      return 'success';
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'muted':
      return 'muted';
    case 'info':
    default:
      return 'info';
  }
}
