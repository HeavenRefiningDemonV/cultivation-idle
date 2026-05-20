import { useUIStore, type GameTab } from '../../../stores/uiStore.js';
import type { LiveWorldModuleKey } from '../../../content/index.js';
import type { IconId } from '../../../ui/icons/index.js';
import { getShellTabLabel, getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';
import { useActivityStore, type ActiveActivity } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useProfessionStore, type ForgeJob } from '../../../stores/professionStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import {
  buildLiveRunCompassSurface,
  buildLiveRunCompassSurfaceV2,
  type RunCompassActionLine,
  type RunCompassInfoLine,
  type RunCompassRouteV2,
  type RunCompassSurfaceV2,
} from '../runCompass/index.js';
import {
  applyDaoMandateVisibility,
  buildLiveDaoMandateSurfaceV1,
  pickDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
  type DaoMandateEffectiveMotionMode,
  type DaoMandateGuidanceProfile,
  type DaoMandateGuidanceSettings,
  type DaoMandateSurfaceV1,
} from '../daoMandate/index.js';
import { buildStatusTroubleshootingSurface, type StatusTroubleshootingSurface } from './statusTroubleshootingSurface.js';
import { D, formatNumber, formatPercentFromValue } from '../../../utils/numbers.js';

export type StatusRouteTarget =
  | { kind: 'tab'; tab: GameTab }
  | { kind: 'world_module'; cityId: string; moduleKey: LiveWorldModuleKey }
  | { kind: 'none'; reason: string };

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type StatusRequirementKind =
  | 'qi'
  | 'gate_item'
  | 'required_item'
  | 'healing'
  | 'forge'
  | 'loadout'
  | 'technique'
  | 'manual'
  | 'currency'
  | 'safety_net'
  | 'city_unlock'
  | 'prestige'
  | 'content_cap'
  | 'activity'
  | 'unknown';

export interface StatusActionSurface {
  id: string;
  label: string;
  detail: string;
  destinationLabel: string;
  target: StatusRouteTarget;
  disabled: boolean;
  disabledReason: string | null;
  tone: StatusTone;
  source: 'run_compass' | 'readiness' | 'economy' | 'activity' | 'prestige' | 'fallback';
}

export interface StatusFactRow {
  id: string;
  label: string;
  value?: string;
  detail: string;
  tone: StatusTone;
  icon: IconId;
  source: string;
}

export interface StatusRequirementRow {
  id: string;
  kind: StatusRequirementKind;
  label: string;
  detail: string;
  gapLabel: string | null;
  priorityLabel: string | null;
  tone: StatusTone;
  icon: IconId;
  action: StatusActionSurface | null;
  disabledReason: string | null;
  source: 'trial_lifecycle' | 'readiness' | 'economy' | 'build' | 'pouch' | 'prestige' | 'content_cap';
}

export interface StatusMilestoneNode {
  id: string;
  label: string;
  detail: string;
  state: 'done' | 'current' | 'locked' | 'future' | 'warning';
  icon: IconId;
}

export interface StatusCurrentWorkSurface {
  foregroundActivity: {
    label: string;
    detail: string;
    tone: StatusTone;
    icon: IconId;
    target: StatusRouteTarget | null;
  };
  activeCombat: StatusFactRow | null;
  trackedBounty: StatusFactRow | null;
  expeditions: StatusFactRow | null;
  queues: StatusFactRow[];
}

export interface StatusDashboardSurfaceV1 {
  meta: {
    rootTestId: 'status-dashboard';
    mode: 'live';
    contentLoaded: boolean;
    generatedAt: number;
    debugNotes: string[];
  };
  mandate: {
    raw: DaoMandateSurfaceV1;
    visible: DaoMandateSurfaceV1;
    settings: DaoMandateGuidanceSettings;
    profile: DaoMandateGuidanceProfile;
    motionMode: DaoMandateEffectiveMotionMode;
    generatedAt: number;
  };
  hero: {
    realmName: string;
    stageText: string;
    pathLabel: string;
    heartLawLabel: string;
    spiritRootLabel: string;
    archetypeLabel: string;
    nextMajorGoalLabel: string;
    nextMajorGoalDetail: string;
    biggestShortfallLabel: string;
    primaryAction: StatusActionSurface | null;
  };
  metrics: StatusFactRow[];
  milestone: {
    title: string;
    detail: string;
    readinessLabel: string;
    tone: StatusTone;
    nodes: StatusMilestoneNode[];
  };
  currentWork: StatusCurrentWorkSurface;
  readiness: {
    title: string;
    stateLabel: string;
    diagnosisLabel: string;
    postureLabel: string;
    rows: StatusFactRow[];
  };
  requirements: {
    title: string;
    rows: StatusRequirementRow[];
    emptyState: StatusFactRow | null;
  };
  bestNextActions: StatusActionSurface[];
  safetyNet: {
    title: string;
    stateLabel: string;
    progressLabel: string;
    rows: StatusFactRow[];
    action: StatusActionSurface | null;
  };
  runCompass: {
    milestoneLabel: string;
    primaryBlockerLabel: string;
    primaryRouteLabel: string;
    recentDeltas: StatusFactRow[];
  };
  identity: {
    rows: StatusFactRow[];
    spiritRootElement: string;
    spiritRootTone: string;
  };
  preparation: {
    rows: StatusFactRow[];
    buildRows: StatusFactRow[];
  };
}

const FILLER_FRAGMENTS = [
  'Waiting',
  'Stay the course',
  'No additional action needed right now.',
  'No stronger corrective route is surfaced right now.',
];

const MODULE_BY_ACTIVITY: Partial<Record<ActiveActivity['type'], LiveWorldModuleKey>> = {
  outskirts: 'outskirts',
  trial: 'gateTrial',
  ruins: 'ruins',
  forge: 'forge',
};

function hasFillerCopy(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => value ? FILLER_FRAGMENTS.some((fragment) => value.includes(fragment)) : false);
}

function toTone(input: string | null | undefined): StatusTone {
  const normalized = (input ?? '').toLowerCase();
  if (normalized.includes('ready') || normalized.includes('met') || normalized.includes('resolved') || normalized.includes('available')) return 'success';
  if (normalized.includes('blocked') || normalized.includes('below') || normalized.includes('bad') || normalized.includes('missing') || normalized.includes('under-supported')) return 'danger';
  if (normalized.includes('warning') || normalized.includes('disabled') || normalized.includes('risky') || normalized.includes('short')) return 'warning';
  if (normalized.includes('cap') || normalized.includes('restock') || normalized.includes('visible') || normalized.includes('open')) return 'info';
  return 'muted';
}

function routeLabel(target: StatusRouteTarget): string {
  if (target.kind === 'tab') return getShellTabLabel(target.tab);
  if (target.kind === 'world_module') return getWorldModuleLabel(target.moduleKey);
  return 'Unavailable';
}

function noneTarget(reason: string): StatusRouteTarget {
  return { kind: 'none', reason };
}

function tabAction(args: {
  id: string;
  label: string;
  detail: string;
  tab: GameTab;
  source: StatusActionSurface['source'];
  tone?: StatusTone;
}): StatusActionSurface {
  const target: StatusRouteTarget = { kind: 'tab', tab: args.tab };
  return {
    id: args.id,
    label: args.label,
    detail: args.detail,
    destinationLabel: routeLabel(target),
    target,
    disabled: false,
    disabledReason: null,
    tone: args.tone ?? 'info',
    source: args.source,
  };
}

function moduleAction(args: {
  id: string;
  label: string;
  detail: string;
  moduleKey: LiveWorldModuleKey;
  cityId: string | null;
  source: StatusActionSurface['source'];
  tone?: StatusTone;
}): StatusActionSurface {
  if (!args.cityId) {
    const reason = 'No active city is available for this route.';
    const target = noneTarget(reason);
    return {
      id: args.id,
      label: args.label,
      detail: args.detail,
      destinationLabel: routeLabel(target),
      target,
      disabled: true,
      disabledReason: reason,
      tone: 'muted',
      source: args.source,
    };
  }

  const target: StatusRouteTarget = { kind: 'world_module', cityId: args.cityId, moduleKey: args.moduleKey };
  return {
    id: args.id,
    label: args.label,
    detail: args.detail,
    destinationLabel: routeLabel(target),
    target,
    disabled: false,
    disabledReason: null,
    tone: args.tone ?? 'info',
    source: args.source,
  };
}

function toStatusAction(action: RunCompassActionLine): StatusActionSurface | null {
  if (
    action.id.startsWith('placeholder-') ||
    hasFillerCopy(action.label, action.why, action.destinationLabel)
  ) {
    return null;
  }

  if (!action.target && !action.blockedReason) {
    return null;
  }

  const target: StatusRouteTarget = action.target
    ? action.target.kind === 'tab'
      ? { kind: 'tab', tab: action.target.tab }
      : { kind: 'world_module', cityId: action.target.cityId, moduleKey: action.target.moduleKey }
    : noneTarget(action.blockedReason ?? 'No route is currently available.');

  return {
    id: action.id,
    label: action.label,
    detail: action.why,
    destinationLabel: action.target ? action.destinationLabel : routeLabel(target),
    target,
    disabled: action.blocked || target.kind === 'none',
    disabledReason: action.blockedReason ?? (target.kind === 'none' ? target.reason : null),
    tone: action.blocked || target.kind === 'none' ? 'muted' : 'info',
    source: 'run_compass',
  };
}

function toStatusActionFromRoute(route: RunCompassRouteV2): StatusActionSurface {
  const target: StatusRouteTarget = route.target
    ? route.target.kind === 'tab'
      ? { kind: 'tab', tab: route.target.tab }
      : { kind: 'world_module', cityId: route.target.cityId, moduleKey: route.target.moduleKey }
    : noneTarget(route.blockedReason ?? 'No route is currently available.');

  return {
    id: route.id,
    label: route.label,
    detail: route.detail,
    destinationLabel: route.target ? route.destinationLabel : routeLabel(target),
    target,
    disabled: route.blocked || target.kind === 'none',
    disabledReason: route.blockedReason ?? (target.kind === 'none' ? target.reason : null),
    tone: route.blocked || target.kind === 'none' ? 'muted' : toTone(`${route.label} ${route.detail}`),
    source: route.source === 'economy'
      ? 'economy'
      : route.source === 'prestige'
        ? 'prestige'
        : route.source === 'fallback'
          ? 'fallback'
          : route.source === 'run_delta'
            ? 'activity'
            : 'readiness',
  };
}

function deltaTone(tone: RunCompassSurfaceV2['recentDeltas'][number]['tone']): StatusTone {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  if (tone === 'muted') return 'muted';
  return 'info';
}

function buildRunCompassStatusRows(v2: RunCompassSurfaceV2 | null): StatusDashboardSurfaceV1['runCompass'] {
  return {
    milestoneLabel: v2?.milestone.label ?? 'Current Mandate unavailable',
    primaryBlockerLabel: v2?.primaryBlocker.label ?? 'No command truth available',
    primaryRouteLabel: v2?.primaryRoute.label ?? 'No route available',
    recentDeltas: (v2?.recentDeltas ?? []).slice(0, 3).map((delta): StatusFactRow => ({
      id: `run-delta-${delta.id}`,
      label: delta.label,
      value: delta.rewardSummary ?? undefined,
      detail: delta.memoryLine,
      tone: deltaTone(delta.tone),
      icon: delta.tone === 'success' ? 'taskComplete' : delta.tone === 'warning' || delta.tone === 'danger' ? 'inkWarning' : 'recordSlip',
      source: `runDeltas.${delta.source}`,
    })),
  };
}

function inferRequirementKind(line: RunCompassInfoLine): StatusRequirementKind {
  const normalized = `${line.id} ${line.label} ${line.detail}`.toLowerCase();
  if (normalized.includes('qi')) return 'qi';
  if (normalized.includes('gate-item') || normalized.includes('gate item') || normalized.includes('gate proof')) return 'gate_item';
  if (normalized.includes('healing') || normalized.includes('apothecary') || normalized.includes('tonic')) return 'healing';
  if (normalized.includes('forge') || normalized.includes('weapon') || normalized.includes('temper')) return 'forge';
  if (normalized.includes('technique') || normalized.includes('mastery') || normalized.includes('rank') || normalized.includes('rune')) return 'technique';
  if (normalized.includes('manual')) return 'manual';
  if (normalized.includes('merit') || normalized.includes('spirit stone') || normalized.includes('reserve')) return 'currency';
  if (normalized.includes('safety') || normalized.includes('fail')) return 'safety_net';
  if (normalized.includes('cap')) return 'content_cap';
  return 'unknown';
}

function iconForRequirement(kind: StatusRequirementKind): IconId {
  switch (kind) {
    case 'qi': return 'inkSwirl';
    case 'gate_item': return 'foundationPill';
    case 'required_item': return 'artifactShard';
    case 'healing': return 'herbBundle';
    case 'forge': return 'jadeSword';
    case 'loadout': return 'artifactBundle';
    case 'technique': return 'bookHeaven';
    case 'manual': return 'bookMartial';
    case 'currency': return 'prayerBeads';
    case 'safety_net': return 'inkShield';
    case 'city_unlock': return 'placeholderRingLarge';
    case 'prestige': return 'spiritGrass';
    case 'content_cap': return 'taskComplete';
    case 'activity': return 'hourglassProgress';
    case 'unknown': return 'inkWarning';
  }
}

function actionForRequirement(kind: StatusRequirementKind, currentCityId: string | null): StatusActionSurface {
  switch (kind) {
    case 'qi':
      return tabAction({ id: 'requirement-qi', label: 'Cultivate Qi', detail: 'Open cultivation to work toward the next Qi target.', tab: 'cultivation', source: 'readiness' });
    case 'healing':
    case 'currency':
    case 'required_item':
      return moduleAction({ id: `requirement-${kind}`, label: 'Open Apothecary', detail: 'Open the support shop that can close this preparation gap.', moduleKey: 'apothecary', cityId: currentCityId, source: 'economy' });
    case 'forge':
      return moduleAction({ id: 'requirement-forge', label: 'Open Forge', detail: 'Open forge work to raise the permanent equipment floor.', moduleKey: 'forge', cityId: currentCityId, source: 'economy' });
    case 'technique':
    case 'manual':
    case 'loadout':
      return tabAction({ id: `requirement-${kind}`, label: 'Open Techniques', detail: 'Open techniques to close build and loadout gaps.', tab: 'techniques', source: 'readiness' });
    case 'safety_net':
    case 'gate_item':
      return moduleAction({ id: `requirement-${kind}`, label: 'Open Gate Trial', detail: 'Open the gate surface for this gate requirement.', moduleKey: 'gateTrial', cityId: currentCityId, source: 'readiness' });
    case 'prestige':
    case 'content_cap':
      return tabAction({ id: `requirement-${kind}`, label: 'Open Prestige', detail: 'Review permanent progress options.', tab: 'prestige', source: 'prestige' });
    case 'city_unlock':
    case 'activity':
    case 'unknown':
      return tabAction({ id: `requirement-${kind}`, label: 'Open World', detail: 'Open World to inspect the available route.', tab: 'adventure', source: 'fallback' });
  }
}

function splitGapAndPriority(detail: string): { gapLabel: string | null; priorityLabel: string | null } {
  const parts = detail.split(/[•-]/).map((part) => part.trim()).filter(Boolean);
  const gap = parts.find((part) => /^gap/i.test(part)) ?? null;
  const priority = parts.find((part) => /priority/i.test(part)) ?? null;
  return { gapLabel: gap, priorityLabel: priority };
}

function toRequirementRow(line: RunCompassInfoLine, currentCityId: string | null): StatusRequirementRow | null {
  if (
    line.placeholder ||
    line.id.startsWith('placeholder-') ||
    line.id === 'empty' ||
    hasFillerCopy(line.label, line.detail) ||
    /no major blockers/i.test(`${line.label} ${line.detail}`)
  ) {
    return null;
  }

  const kind = inferRequirementKind(line);
  const action = actionForRequirement(kind, currentCityId);
  const { gapLabel, priorityLabel } = splitGapAndPriority(line.detail);

  return {
    id: line.id,
    kind,
    label: line.label,
    detail: line.detail,
    gapLabel,
    priorityLabel,
    tone: line.tone === 'success' ? 'success' : toTone(`${line.label} ${line.detail}`),
    icon: iconForRequirement(kind),
    action,
    disabledReason: action.disabledReason,
    source: 'readiness',
  };
}

function buildAdditionalRequirements(troubleshooting: StatusTroubleshootingSurface, currentCityId: string | null): StatusRequirementRow[] {
  const rows: StatusRequirementRow[] = [];

  if (!/no major preparation warning/i.test(troubleshooting.preparation.topWarning)) {
    const kind: StatusRequirementKind = troubleshooting.preparation.topWarning.toLowerCase().includes('consumable') ? 'healing' : 'loadout';
    rows.push({
      id: 'preparation-top-warning',
      kind,
      label: kind === 'healing' ? 'Preparation warning' : 'Loadout warning',
      detail: troubleshooting.preparation.topWarning,
      gapLabel: null,
      priorityLabel: 'Priority 1',
      tone: toTone(troubleshooting.preparation.topWarning),
      icon: iconForRequirement(kind),
      action: actionForRequirement(kind, currentCityId),
      disabledReason: null,
      source: kind === 'healing' ? 'pouch' : 'build',
    });
  }

  if (!/^good$/i.test(troubleshooting.preparation.pouchFit) && !/^ok$/i.test(troubleshooting.preparation.pouchFit)) {
    const kind: StatusRequirementKind = 'healing';
    rows.push({
      id: 'pouch-fit',
      kind,
      label: 'Pouch fit',
      detail: troubleshooting.preparation.pouchFit,
      gapLabel: null,
      priorityLabel: 'Priority 1',
      tone: toTone(troubleshooting.preparation.pouchFit),
      icon: iconForRequirement(kind),
      action: actionForRequirement(kind, currentCityId),
      disabledReason: null,
      source: 'pouch',
    });
  }

  ([
    ['mastery-floor', 'Technique mastery floor', troubleshooting.build.mastery],
    ['rank-floor', 'Technique rank floor', troubleshooting.build.rank],
    ['rune-floor', 'Rune floor', troubleshooting.build.runes],
  ] as const).forEach(([id, label, value]) => {
    if (value === 'Met') return;
    const kind: StatusRequirementKind = id === 'rune-floor' ? 'manual' : 'technique';
    rows.push({
      id,
      kind,
      label,
      detail: value,
      gapLabel: null,
      priorityLabel: 'Priority 2',
      tone: toTone(value),
      icon: iconForRequirement(kind),
      action: actionForRequirement(kind, currentCityId),
      disabledReason: null,
      source: 'build',
    });
  });

  return rows;
}

function dedupeRequirements(rows: StatusRequirementRow[]): StatusRequirementRow[] {
  const seen = new Set<string>();
  const result: StatusRequirementRow[] = [];
  for (const row of rows) {
    const key = `${row.kind}:${row.label}:${row.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function buildMetrics(): StatusFactRow[] {
  const stats = useGameStore.getState().stats;
  const combatStrength = D(stats.hp).plus(stats.atk).plus(stats.def).plus(stats.crit);
  return [
    { id: 'combat-strength', label: 'Combat Strength', value: formatNumber(combatStrength), detail: 'HP, attack, defense, and crit summarized for scan speed.', tone: 'info', icon: 'jadeSword', source: 'game.stats' },
    { id: 'attack', label: 'Attack', value: formatNumber(stats.atk), detail: 'Current attack from live player stats.', tone: 'info', icon: 'inkBurst', source: 'game.stats' },
    { id: 'defense', label: 'Defense', value: formatNumber(stats.def), detail: 'Current defense from live player stats.', tone: 'info', icon: 'inkShield', source: 'game.stats' },
    { id: 'crit-rate', label: 'Crit Rate', value: formatPercentFromValue(stats.crit, 0), detail: 'Current critical rate from live player stats.', tone: 'info', icon: 'inkBolt', source: 'game.stats' },
  ];
}

function buildMilestoneNodes(args: {
  troubleshooting: StatusTroubleshootingSurface;
  nextGoal: string;
  nextGoalDetail: string;
  contentLoaded: boolean;
}): StatusMilestoneNode[] {
  const game = useGameStore.getState();
  const tone = toTone(args.troubleshooting.readiness.readinessLabel);
  return [
    {
      id: `realm-${game.realm.index}-${game.realm.substage}`,
      label: args.troubleshooting.realmName,
      detail: args.troubleshooting.stageText,
      state: 'done',
      icon: 'placeholderRingSmall',
    },
    {
      id: `gate-${args.troubleshooting.readiness.gateTrialName}`,
      label: args.troubleshooting.readiness.gateTrialName,
      detail: args.troubleshooting.readiness.shortfallLine,
      state: tone === 'danger' || tone === 'warning' ? 'warning' : 'current',
      icon: tone === 'danger' || tone === 'warning' ? 'inkWarning' : 'foundationPill',
    },
    {
      id: `next-${args.nextGoal}`,
      label: args.nextGoal,
      detail: args.nextGoalDetail,
      state: 'future',
      icon: 'taskComplete',
    },
    {
      id: args.contentLoaded ? `path-${args.troubleshooting.pathLabel}` : 'content-loading',
      label: args.contentLoaded ? args.troubleshooting.pathLabel : 'Loading content',
      detail: args.contentLoaded ? args.troubleshooting.archetypeSummary : 'Content packs are not fully loaded yet.',
      state: args.contentLoaded ? 'future' : 'locked',
      icon: args.contentLoaded ? 'bookHeaven' : 'hourglassEmpty',
    },
  ];
}

function activityTarget(activity: ActiveActivity | null, currentCityId: string | null): StatusRouteTarget | null {
  if (!activity) return null;
  if (activity.type === 'meditate') return { kind: 'tab', tab: 'cultivation' };
  const moduleKey = MODULE_BY_ACTIVITY[activity.type];
  if (!moduleKey) return { kind: 'tab', tab: 'adventure' };
  const cityId = typeof activity.cityId === 'string' ? activity.cityId : currentCityId;
  return cityId ? { kind: 'world_module', cityId, moduleKey } : { kind: 'tab', tab: 'adventure' };
}

function formatActivity(activity: ActiveActivity | null, currentCityId: string | null, firstAction: StatusActionSurface | null): StatusCurrentWorkSurface['foregroundActivity'] {
  const target = activityTarget(activity, currentCityId);
  if (!activity) {
    return {
      label: 'No foreground activity',
      detail: firstAction ? `${firstAction.label}: ${firstAction.detail}` : 'Choose a route when the next meaningful action is available.',
      tone: firstAction ? 'info' : 'muted',
      icon: 'hourglassEmpty',
      target,
    };
  }

  switch (activity.type) {
    case 'meditate':
      return { label: 'Cultivating', detail: 'Qi growth is the current foreground activity.', tone: 'success', icon: 'inkSwirl', target };
    case 'outskirts':
      return { label: 'Outskirts', detail: `Working ${typeof activity.sourceId === 'string' ? activity.sourceId : 'the active outskirts route'}.`, tone: 'info', icon: 'placeholderRingLarge', target };
    case 'trial':
      return { label: 'Gate Trial', detail: `Trial route active${typeof activity.sourceId === 'string' ? `: ${activity.sourceId}` : '.'}`, tone: 'warning', icon: 'foundationPill', target };
    case 'ruins':
      return { label: 'Ruins', detail: `Ruin run active${typeof activity.sourceId === 'string' ? `: ${activity.sourceId}` : '.'}`, tone: 'info', icon: 'ancientSeed', target };
    case 'forge':
      return { label: 'Forge', detail: 'Hands-on forge work is the current foreground activity.', tone: 'info', icon: 'jadeSword', target };
  }
}

function buildActiveCombatRow(): StatusFactRow | null {
  const combat = useCombatStore.getState();
  if (!combat.inCombat || !combat.currentEnemy) return null;
  const playerPct = D(combat.playerMaxHP).greaterThan(0) ? D(combat.playerHP).dividedBy(combat.playerMaxHP).times(100) : D(0);
  const enemyPct = D(combat.enemyMaxHP).greaterThan(0) ? D(combat.enemyHP).dividedBy(combat.enemyMaxHP).times(100) : D(0);
  return {
    id: 'active-combat',
    label: combat.currentEnemy.isBoss ? 'Boss combat' : 'Active combat',
    value: combat.currentEnemy.name,
    detail: `Player ${formatNumber(playerPct)}% HP; enemy ${formatNumber(enemyPct)}% HP in ${combat.combatContext.type ?? 'combat'}.`,
    tone: playerPct.lessThan(35) ? 'danger' : combat.currentEnemy.isBoss ? 'warning' : 'info',
    icon: combat.currentEnemy.isBoss ? 'beastBlood' : 'rustySword',
    source: 'combatStore',
  };
}

function buildTrackedBountyRow(currentCityId: string | null): StatusFactRow | null {
  if (!currentCityId) return null;
  const bounty = useBountyStore.getState().getTrackedBounty(currentCityId);
  if (!bounty) return null;
  const complete = bounty.progress >= bounty.target;
  return {
    id: `tracked-bounty-${bounty.instanceId}`,
    label: complete && !bounty.claimed ? 'Bounty claim ready' : 'Tracked bounty',
    value: bounty.title,
    detail: `${bounty.progress} / ${bounty.target} - ${bounty.description}`,
    tone: complete && !bounty.claimed ? 'success' : 'info',
    icon: complete ? 'taskComplete' : 'recordSlip',
    source: 'bountyStore',
  };
}

function buildExpeditionRow(): StatusFactRow | null {
  const expedition = useExpeditionStore.getState();
  const running = expedition.active.filter((run) => run.status === 'running').length;
  const complete = expedition.active.filter((run) => run.status === 'complete').length;
  const idle = Math.max(0, expedition.slots - expedition.active.length);
  if (expedition.slots <= 0) return null;
  return {
    id: 'expeditions',
    label: complete > 0 ? 'Expedition claim ready' : 'Expeditions',
    value: `${running} active / ${complete} claimable / ${idle} idle`,
    detail: complete > 0 ? 'Claim completed expeditions from World.' : 'Use idle expedition slots for background materials.',
    tone: complete > 0 ? 'success' : running > 0 ? 'info' : 'muted',
    icon: complete > 0 ? 'taskComplete' : 'hourglassProgress',
    source: 'expeditionStore',
  };
}

function resolveForgeQueueStatus(job: ForgeJob, now: number): ReturnType<ReturnType<typeof useProfessionStore.getState>['getForgeJobStatus']> {
  return useProfessionStore.getState().getForgeJobStatus(job, now);
}

function buildQueueRows(): StatusFactRow[] {
  const profession = useProfessionStore.getState();
  const now = Date.now();
  const alchemyReady = profession.alchemyQueue.filter((job) => now >= job.endsAt).length;
  const talismanReady = profession.talismanQueue.filter((job) => now >= job.endsAt).length;
  const forgeStatuses = profession.forgeQueue.map((job) => resolveForgeQueueStatus(job, now));
  const forgeReady = forgeStatuses.filter((status) => status.status === 'READY_TO_CLAIM').length;
  const rows: StatusFactRow[] = [];

  if (alchemyReady > 0 || profession.alchemyQueue.length > 0) {
    rows.push({
      id: 'alchemy-queue',
      label: 'Alchemy queue',
      value: alchemyReady > 0 ? `${alchemyReady} ready` : `${profession.alchemyQueue.length} active`,
      detail: alchemyReady > 0 ? 'Claim brewed support items.' : 'Brewing is underway.',
      tone: alchemyReady > 0 ? 'success' : 'info',
      icon: 'herbBundle',
      source: 'professionStore',
    });
  }

  if (talismanReady > 0 || profession.talismanQueue.length > 0) {
    rows.push({
      id: 'talisman-queue',
      label: 'Talisman queue',
      value: talismanReady > 0 ? `${talismanReady} ready` : `${profession.talismanQueue.length} active`,
      detail: talismanReady > 0 ? 'Claim completed talisman work.' : 'Talisman work is underway.',
      tone: talismanReady > 0 ? 'success' : 'info',
      icon: 'prayerBeads',
      source: 'professionStore',
    });
  }

  if (forgeReady > 0 || profession.forgeQueue.length > 0) {
    rows.push({
      id: 'forge-queue',
      label: 'Forge queue',
      value: forgeReady > 0 ? `${forgeReady} ready` : `${profession.forgeQueue.length} active`,
      detail: forgeReady > 0 ? 'Claim completed forge jobs.' : 'Forge work is underway.',
      tone: forgeReady > 0 ? 'success' : 'info',
      icon: 'jadeSword',
      source: 'professionStore',
    });
  }

  return rows;
}

function buildReadinessRows(troubleshooting: StatusTroubleshootingSurface): StatusFactRow[] {
  const rows: StatusFactRow[] = [
    {
      id: 'readiness-state',
      label: 'Current state',
      value: troubleshooting.readiness.readinessLabel,
      detail: troubleshooting.readiness.shortfallLine,
      tone: toTone(troubleshooting.readiness.readinessLabel),
      icon: 'inkShield',
      source: 'statusTroubleshootingSurface.readiness',
    },
    {
      id: 'diagnosis',
      label: 'Diagnosis',
      value: troubleshooting.readiness.diagnosisLabel,
      detail: troubleshooting.shortfall.reason,
      tone: toTone(`${troubleshooting.readiness.diagnosisLabel} ${troubleshooting.shortfall.reason}`),
      icon: 'inkWarning',
      source: 'statusTroubleshootingSurface.readiness',
    },
    {
      id: 'build-posture',
      label: 'Build posture',
      value: troubleshooting.archetypeLabel,
      detail: troubleshooting.archetypeSummary,
      tone: toTone(troubleshooting.archetypeSummary),
      icon: 'artifactBundle',
      source: 'statusTroubleshootingSurface.build',
    },
  ];

  const semanticReasons = [...troubleshooting.readiness.reasons, ...troubleshooting.readiness.warnings]
    .filter((entry, index, all) => entry && all.indexOf(entry) === index)
    .slice(0, 3)
    .map((entry, index): StatusFactRow => ({
      id: `readiness-signal-${index}`,
      label: entry.toLowerCase().includes('consumable') ? 'Consumable policy' : entry.toLowerCase().includes('loadout') ? 'Loadout coverage' : 'Readiness signal',
      detail: entry,
      tone: toTone(entry),
      icon: toTone(entry) === 'danger' ? 'inkWarning' : 'inkBolt',
      source: 'statusTroubleshootingSurface.readiness',
    }));

  return [...rows, ...semanticReasons];
}

function buildIdentityRows(troubleshooting: StatusTroubleshootingSurface): StatusFactRow[] {
  return [
    { id: 'path', label: 'Path', value: troubleshooting.pathLabel, detail: 'Selected cultivation path.', tone: 'info', icon: 'bookHeaven', source: 'statusTroubleshootingSurface.identity' },
    { id: 'heart-law', label: 'Heart Law', value: troubleshooting.identity.heartLawName, detail: troubleshooting.identity.heartLawVerse, tone: 'info', icon: 'bookMartial', source: 'statusTroubleshootingSurface.identity' },
    { id: 'resonance', label: 'Resonance', value: troubleshooting.identity.resonanceLabel, detail: 'Spirit-root affinity against the current heart law.', tone: toTone(troubleshooting.identity.resonanceLabel), icon: 'inkSwirl', source: 'statusTroubleshootingSurface.identity' },
    { id: 'focus', label: 'Focus', value: troubleshooting.identity.focusMode, detail: 'Current focus posture.', tone: 'muted', icon: 'inkBolt', source: 'statusTroubleshootingSurface.identity' },
    { id: 'breath', label: 'Breath', value: troubleshooting.identity.breathMode, detail: 'Current breath posture.', tone: 'muted', icon: 'inkHeart', source: 'statusTroubleshootingSurface.identity' },
  ];
}

function splitLine(label: string, line: string): StatusFactRow {
  const separator = line.indexOf(':');
  const value = separator >= 0 ? line.slice(separator + 1).trim() : line;
  return {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    value,
    detail: line,
    tone: toTone(line),
    icon: label.toLowerCase().includes('merit') || label.toLowerCase().includes('spirit') ? 'prayerBeads' : 'herbBundle',
    source: 'statusTroubleshootingSurface.preparation',
  };
}

function buildPreparationRows(troubleshooting: StatusTroubleshootingSurface): StatusDashboardSurfaceV1['preparation'] {
  return {
    rows: [
      splitLine('Merit Reserve', troubleshooting.preparation.meritReserve),
      splitLine('Spirit Stones Reserve', troubleshooting.preparation.spiritStoneReserve),
      { id: 'pouch', label: 'Pouch', value: troubleshooting.preparation.pouchSummary, detail: 'Combat consumable auto-use and slots.', tone: toTone(troubleshooting.preparation.pouchSummary), icon: 'herbBundle', source: 'statusTroubleshootingSurface.preparation' },
      { id: 'pouch-fit', label: 'Pouch Fit', value: troubleshooting.preparation.pouchFit, detail: troubleshooting.preparation.pouchFit, tone: toTone(troubleshooting.preparation.pouchFit), icon: 'inkHeart', source: 'statusTroubleshootingSurface.preparation' },
      { id: 'top-warning', label: 'Top Warning', value: troubleshooting.preparation.topWarning, detail: troubleshooting.preparation.topWarning, tone: toTone(troubleshooting.preparation.topWarning), icon: 'inkWarning', source: 'statusTroubleshootingSurface.preparation' },
    ],
    buildRows: [
      { id: 'path-alignment', label: 'Path Alignment', value: troubleshooting.build.alignment, detail: 'Build path alignment score.', tone: toTone(troubleshooting.build.alignment), icon: 'inkSwirl', source: 'statusTroubleshootingSurface.build' },
      { id: 'empty-slots', label: 'Empty Slots', value: troubleshooting.build.emptySlots, detail: 'Unlocked technique slots without loadout coverage.', tone: troubleshooting.build.emptySlots === '0' ? 'success' : 'warning', icon: 'artifactBundle', source: 'statusTroubleshootingSurface.build' },
      { id: 'mastery-floor', label: 'Mastery Floor', value: troubleshooting.build.mastery, detail: troubleshooting.build.mastery, tone: toTone(troubleshooting.build.mastery), icon: 'bookHeaven', source: 'statusTroubleshootingSurface.build' },
      { id: 'rank-floor', label: 'Rank Floor', value: troubleshooting.build.rank, detail: troubleshooting.build.rank, tone: toTone(troubleshooting.build.rank), icon: 'bookMartial', source: 'statusTroubleshootingSurface.build' },
      { id: 'rune-floor', label: 'Rune Floor', value: troubleshooting.build.runes, detail: troubleshooting.build.runes, tone: toTone(troubleshooting.build.runes), icon: 'artifactShard', source: 'statusTroubleshootingSurface.build' },
      { id: 'policy-fit', label: 'Policy Fit', value: troubleshooting.build.policyFit, detail: troubleshooting.build.policyFit, tone: toTone(troubleshooting.build.policyFit), icon: 'inkBolt', source: 'statusTroubleshootingSurface.build' },
      { id: 'top-gap', label: 'Top Gap', value: troubleshooting.build.topGap, detail: troubleshooting.build.topGap, tone: toTone(troubleshooting.build.topGap), icon: 'inkWarning', source: 'statusTroubleshootingSurface.build' },
    ],
  };
}

function buildFallbackTroubleshooting(debugNotes: string[]): StatusTroubleshootingSurface {
  debugNotes.push('statusTroubleshootingSurface failed; used minimal game-state fallback.');
  const game = useGameStore.getState();
  return {
    realmName: game.realm.name,
    stageText: `Stage ${game.realm.substage}`,
    pathLabel: game.selectedPath ?? 'No Path selected',
    archetypeLabel: 'Unshaped Build',
    archetypeSummary: 'Build profile is unavailable until the status systems finish loading.',
    shortfall: {
      diagnosisCode: null,
      diagnosisLabel: 'Unavailable',
      reason: 'Status diagnosis is unavailable.',
      headline: 'Status diagnosis is unavailable.',
      topFix: null,
      topFixDetail: null,
    },
    combatStrip: [],
    identity: {
      heartLawName: 'Unavailable',
      heartLawVerse: 'Unavailable',
      resonanceLabel: 'Unavailable',
      spiritRootSummary: { element: 'Dormant', grade: 'Dormant', purity: '0%', totalMultiplier: '1.00x' },
      focusMode: game.focusMode,
      breathMode: 'Unavailable',
    },
    readiness: {
      readinessLabel: 'Unavailable',
      gateTrialName: 'Unavailable',
      diagnosisLabel: 'Unavailable',
      reasons: [],
      warnings: [],
      shortfallLine: 'Status readiness is unavailable.',
    },
    permanentFloor: {
      weaponRefine: 0,
      accessoryRefine: 0,
      temperSuccesses: 0,
      runeSummary: 'Unavailable',
      gateTargetLine: 'Unavailable',
      floorJudgment: 'On floor',
    },
    preparation: {
      meritReserve: 'Merit reserve: unavailable',
      spiritStoneReserve: 'Spirit Stones reserve: unavailable',
      pouchSummary: 'Pouch unavailable',
      pouchFit: 'Unavailable',
      topWarning: 'Preparation state unavailable.',
      gateTokenLine: null,
    },
    build: {
      alignment: '0%',
      emptySlots: '0',
      mastery: 'Unavailable',
      rank: 'Unavailable',
      runes: 'Unavailable',
      policyFit: 'Unavailable',
      topGap: 'Build gap unavailable.',
    },
    safetyNet: {
      state: 'Unavailable',
      progress: 'Safety Net progress unavailable.',
      threshold: 'Unavailable',
      cost: 'Unavailable',
      affordability: 'Unavailable',
      blockedReason: 'Safety Net state unavailable.',
    },
    urgentCardId: null,
  };
}

export function buildStatusDashboardSurface(now = Date.now()): StatusDashboardSurfaceV1 {
  const debugNotes: string[] = [];
  const contentStore = useContentStore.getState();
  const cityState = useCityStore.getState();
  const uiSettings = useUIStore.getState().settings;
  const guidanceSettings = pickDaoMandateGuidanceSettings(uiSettings);
  const rawMandate = buildLiveDaoMandateSurfaceV1({
    currentScreen: 'status',
    guidanceProfile: guidanceSettings.guidanceOath,
  });
  const visibleMandate = applyDaoMandateVisibility(rawMandate, { settings: guidanceSettings });
  const motionMode = resolveDaoMandateEffectiveMotionMode({
    mandateMotionMode: guidanceSettings.mandateMotionMode,
    storyMotionMode: uiSettings.storyMotionMode,
  });
  const currentCityId = cityState.currentCityId ?? cityState.unlockedCityIds[0] ?? null;

  let troubleshooting: StatusTroubleshootingSurface;
  try {
    troubleshooting = buildStatusTroubleshootingSurface();
  } catch (error) {
    debugNotes.push(`statusTroubleshootingSurface error: ${error instanceof Error ? error.message : String(error)}`);
    troubleshooting = buildFallbackTroubleshooting(debugNotes);
  }

  let runCompassV2: ReturnType<typeof buildLiveRunCompassSurfaceV2> = null;
  let runCompass: ReturnType<typeof buildLiveRunCompassSurface> = null;
  try {
    runCompassV2 = buildLiveRunCompassSurfaceV2();
    runCompass = buildLiveRunCompassSurface();
  } catch (error) {
    debugNotes.push(`runCompass error: ${error instanceof Error ? error.message : String(error)}`);
  }

  const bestNextActions = runCompassV2
    ? [
      toStatusActionFromRoute(runCompassV2.primaryRoute),
      ...runCompassV2.secondaryRoutes.map(toStatusActionFromRoute),
    ]
    : (runCompass?.bestNextActions ?? [])
      .map(toStatusAction)
      .filter((action): action is StatusActionSurface => Boolean(action));
  const primaryAction = bestNextActions.find((action) => !action.disabled && action.target.kind !== 'none') ?? null;
  const nextGoal = runCompassV2?.milestone.label ?? runCompass?.milestone.title ?? troubleshooting.readiness.gateTrialName;
  const nextGoalDetail = runCompassV2?.milestone.detail ?? runCompass?.milestone.detail ?? troubleshooting.readiness.shortfallLine;
  const requirementRows = dedupeRequirements([
    ...(runCompassV2 && runCompassV2.primaryBlocker.kind !== 'none'
      ? [{
        id: `run-compass-${runCompassV2.primaryBlocker.kind}`,
        kind: runCompassV2.primaryBlocker.kind === 'content_cap' || runCompassV2.primaryBlocker.kind === 'prestige_recommended' ? 'prestige' as const : 'unknown' as const,
        label: runCompassV2.primaryBlocker.label,
        detail: runCompassV2.primaryBlocker.detail,
        gapLabel: null,
        priorityLabel: 'Primary blocker',
        tone: runCompassV2.primaryBlocker.severity === 'danger'
          ? 'danger' as const
          : runCompassV2.primaryBlocker.severity === 'warning'
            ? 'warning' as const
            : runCompassV2.primaryBlocker.severity === 'success'
              ? 'success' as const
              : 'info' as const,
        icon: runCompassV2.primaryBlocker.kind === 'content_cap' || runCompassV2.primaryBlocker.kind === 'prestige_recommended' ? 'spiritGrass' as const : 'inkWarning' as const,
        action: toStatusActionFromRoute(runCompassV2.primaryRoute),
        disabledReason: runCompassV2.primaryRoute.blockedReason,
        source: runCompassV2.primaryBlocker.source === 'content_cap' ? 'content_cap' as const : runCompassV2.primaryBlocker.source === 'prestige' ? 'prestige' as const : 'readiness' as const,
      }]
      : []),
    ...(runCompass?.missingRequirements ?? []).map((line) => toRequirementRow(line, currentCityId)).filter((row): row is StatusRequirementRow => Boolean(row)),
    ...buildAdditionalRequirements(troubleshooting, currentCityId),
  ]).slice(0, 5);
  const preparation = buildPreparationRows(troubleshooting);
  const activeCombat = buildActiveCombatRow();
  const trackedBounty = buildTrackedBountyRow(currentCityId);
  const expeditions = buildExpeditionRow();
  const queues = buildQueueRows();
  const foregroundActivity = formatActivity(useActivityStore.getState().active, currentCityId, primaryAction);

  void now;

  return {
    meta: {
      rootTestId: 'status-dashboard',
      mode: 'live',
      contentLoaded: contentStore.isLoaded,
      generatedAt: Date.now(),
      debugNotes,
    },
    mandate: {
      raw: rawMandate,
      visible: visibleMandate,
      settings: guidanceSettings,
      profile: guidanceSettings.guidanceOath,
      motionMode,
      generatedAt: rawMandate.meta.generatedAt,
    },
    hero: {
      realmName: troubleshooting.realmName,
      stageText: troubleshooting.stageText,
      pathLabel: troubleshooting.pathLabel,
      heartLawLabel: troubleshooting.identity.heartLawName,
      spiritRootLabel: `${troubleshooting.identity.spiritRootSummary.element} - ${troubleshooting.identity.spiritRootSummary.grade}`,
      archetypeLabel: troubleshooting.archetypeLabel,
      nextMajorGoalLabel: nextGoal,
      nextMajorGoalDetail: nextGoalDetail,
      biggestShortfallLabel: runCompassV2?.primaryBlocker.label ?? troubleshooting.shortfall.headline,
      primaryAction,
    },
    metrics: buildMetrics(),
    milestone: {
      title: nextGoal,
      detail: nextGoalDetail,
      readinessLabel: runCompassV2?.readiness.label ?? runCompass?.milestone.readinessLabel ?? troubleshooting.readiness.readinessLabel,
      tone: toTone(runCompassV2?.readiness.label ?? runCompass?.milestone.readinessLabel ?? troubleshooting.readiness.readinessLabel),
      nodes: buildMilestoneNodes({
        troubleshooting,
        nextGoal,
        nextGoalDetail,
        contentLoaded: contentStore.isLoaded,
      }),
    },
    currentWork: {
      foregroundActivity,
      activeCombat,
      trackedBounty,
      expeditions,
      queues,
    },
    readiness: {
      title: 'Gate Proof Readiness',
      stateLabel: troubleshooting.readiness.readinessLabel,
      diagnosisLabel: troubleshooting.readiness.diagnosisLabel,
      postureLabel: troubleshooting.archetypeSummary,
      rows: buildReadinessRows(troubleshooting),
    },
    requirements: {
      title: 'Mandate Ledger',
      rows: requirementRows,
      emptyState: requirementRows.length === 0
        ? {
          id: 'requirements-empty',
          label: 'No active requirement blocker',
          detail: 'Current readiness checks did not produce a routeable blocker.',
          tone: 'success',
          icon: 'taskComplete',
          source: 'statusDashboardSurface.requirements',
        }
        : null,
    },
    bestNextActions: bestNextActions.slice(0, 4),
    safetyNet: {
      title: 'Safety Net',
      stateLabel: troubleshooting.safetyNet.state,
      progressLabel: troubleshooting.safetyNet.progress,
      rows: [
        { id: 'safety-state', label: 'State', value: troubleshooting.safetyNet.state, detail: troubleshooting.safetyNet.blockedReason, tone: toTone(troubleshooting.safetyNet.state), icon: 'inkShield', source: 'statusTroubleshootingSurface.safetyNet' },
        { id: 'safety-progress', label: 'Progress', value: troubleshooting.safetyNet.progress, detail: troubleshooting.safetyNet.threshold, tone: toTone(troubleshooting.safetyNet.progress), icon: 'hourglassProgress', source: 'statusTroubleshootingSurface.safetyNet' },
        { id: 'safety-cost', label: 'Cost', value: troubleshooting.safetyNet.cost, detail: troubleshooting.safetyNet.affordability, tone: toTone(troubleshooting.safetyNet.affordability), icon: 'prayerBeads', source: 'statusTroubleshootingSurface.safetyNet' },
      ],
      action: actionForRequirement('safety_net', currentCityId),
    },
    runCompass: buildRunCompassStatusRows(runCompassV2),
    identity: {
      rows: buildIdentityRows(troubleshooting),
      spiritRootElement: troubleshooting.identity.spiritRootSummary.element,
      spiritRootTone: troubleshooting.identity.spiritRootSummary.element.toLowerCase(),
    },
    preparation,
  };
}
