import { REALMS } from '../../../constants/index.js';
import { getBreathModeMultipliers } from '../../../content/tuning/cultivationTuning.js';
import {
  clampRealmIndexToSemesterSlice,
  getGateTransitionItemIdForRealmIndex,
  getNextLiveRealm,
  isAtSemesterCap,
} from '../../../systems/progression/runtime/index.js';
import {
  getBreathModeSemantics,
  getFocusModeSemantics,
  getPathDoctrineProfile,
  getPathDoctrineSummary,
} from '../../../systems/doctrine/index.js';
import { adaptSpiritRootDoctrineToSemanticView } from '../../../systems/doctrine/spiritRootDoctrineSemanticAdapter.js';
import { getAffinityStatus } from '../../../systems/heartLaw/heartLawLogic.js';
import { buildCultivationConsumableReadModel } from '../../../systems/consumables/cultivationConsumableEffects.js';
import { CULTIVATION_CONSUMABLE_FAMILY_REGISTRY } from '../../../systems/consumables/cultivationConsumableTypes.js';
import { buildLiveRunCompassSurface, buildRunCompassCompactSurface } from '../../../systems/ui/runCompass/index.js';
import type { RunCompassActionLine } from '../../../systems/ui/runCompass/index.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { SpiritRootElement, SpiritRootGrade } from '../../../types/index.js';
import { D, formatNumber } from '../../../utils/numbers.js';
import {
  CULTIVATION_EXACT_FIXTURE_COPY,
  CULTIVATION_EXACT_ROOT_TEST_ID,
  CULTIVATION_EXACT_SURFACE_ID,
  CULTIVATION_EXACT_SURFACE_VERSION,
  createCultivationExactShellFlags,
  createCultivationExactVisualFlags,
} from './cultivationExactPresentation.js';
import type {
  BuildCultivationExactSurfaceOptions,
  CultivationBreakthroughReadinessSurfaceV1,
  CultivationButtonSurface,
  CultivationDrawerSurface,
  CultivationExactActivityState,
  CultivationExactBuildSnapshot,
  CultivationExactDrawerId,
  CultivationExactFxQuality,
  CultivationExactSurfaceMode,
  CultivationExactSurfaceV1,
  CultivationRibbonCellSurface,
} from './cultivationExactTypes.js';

const SPIRIT_ROOT_GRADES: Record<SpiritRootGrade, string> = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
};

const SPIRIT_ROOT_ELEMENTS: Record<SpiritRootElement, string> = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  metal: 'Metal',
  wood: 'Wood',
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function formatPercentValue(value: number, max: number): string {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return '0%';
  return `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`;
}

function formatRateLabel(baseRate: string, multiplier: number): { ribbon: string; rail: string; value: string } {
  const effective = D(baseRate || '0').times(Number.isFinite(multiplier) ? multiplier : 1);
  const value = formatNumber(effective);
  return {
    ribbon: `${value} / s`,
    rail: `+${value}/s`,
    value,
  };
}

function ratioPercent(current: string, required: string): number {
  const needed = D(required || '0');
  if (needed.lessThanOrEqualTo(0)) return 0;
  return clampPercent(D(current || '0').div(needed).times(100).toNumber());
}

function missingQiLabel(snapshot: CultivationExactBuildSnapshot): string {
  const missing = D(snapshot.breakthroughRequirement || '0').minus(snapshot.qi || '0');
  return formatNumber(missing.isNegative() ? 0 : missing);
}

function hasEnoughQi(snapshot: CultivationExactBuildSnapshot): boolean {
  return D(snapshot.qi || '0').greaterThanOrEqualTo(D(snapshot.breakthroughRequirement || '0'));
}

function hasGateToken(snapshot: CultivationExactBuildSnapshot): boolean {
  return !snapshot.requiredGateItemId || snapshot.requiredGateItemCount > 0;
}

function isRealmEdge(snapshot: CultivationExactBuildSnapshot): boolean {
  return snapshot.realm.substage >= snapshot.realmSubstages;
}

function isMajorRealmTransition(snapshot: CultivationExactBuildSnapshot): boolean {
  return Boolean(snapshot.requiredGateItemId) ||
    (isRealmEdge(snapshot) && !snapshot.atContentCap && Boolean(snapshot.nextRealmName));
}

function resolveActivityState(snapshot: CultivationExactBuildSnapshot): CultivationExactActivityState {
  const qiPct = ratioPercent(snapshot.qi, snapshot.breakthroughRequirement);
  if (snapshot.atContentCap) return 'content_cap';
  if (isRealmEdge(snapshot) && snapshot.requiredGateItemId && !hasGateToken(snapshot)) return 'gate_blocked';
  if (hasEnoughQi(snapshot) && hasGateToken(snapshot)) return 'breakthrough_ready';
  if (snapshot.stabilityCap > 0 && snapshot.stability / snapshot.stabilityCap <= 0.12 && snapshot.stability > 0) return 'unstable';
  if (qiPct >= 90 && !hasEnoughQi(snapshot)) return 'near_edge';
  if (snapshot.activeActivityType === 'meditate') return 'cultivating';
  return 'idle';
}

function lotusForState(state: CultivationExactActivityState): CultivationExactSurfaceV1['centerAltar']['lotus'] {
  if (state === 'breakthrough_ready') {
    return { state: 'ready', label: 'Breakthrough Ready', assetId: 'qi_lotus_full' };
  }
  if (state === 'cultivating' || state === 'near_edge') {
    return { state: 'active', label: 'Cultivating', assetId: 'qi_lotus_open' };
  }
  return { state: 'idle', label: 'Idle', assetId: 'qi_lotus_closed' };
}

function dantianStateForActivity(
  activityState: CultivationExactActivityState,
): CultivationExactSurfaceV1['centerAltar']['dantian']['state'] {
  if (activityState === 'breakthrough_ready') return 'ready';
  if (activityState === 'near_edge' || activityState === 'gate_blocked') return 'near_ready';
  if (activityState === 'unstable') return 'unstable';
  if (activityState === 'cultivating') return 'active';
  return 'idle';
}

function findGateAction(actions: RunCompassActionLine[]): RunCompassActionLine | null {
  return actions.find((action) => action.target?.kind === 'world_module' && action.target.moduleKey === 'gateTrial' && !action.blocked) ?? null;
}

function findPrestigeAction(actions: RunCompassActionLine[]): RunCompassActionLine | null {
  return actions.find((action) => action.target?.kind === 'tab' && action.target.tab === 'prestige' && !action.blocked) ?? null;
}

function cultivateToggleButton(snapshot: CultivationExactBuildSnapshot): CultivationButtonSurface {
  const isCultivating = snapshot.activeActivityType === 'meditate';
  return {
    label: isCultivating ? 'Stop Cultivation' : 'Start Cultivation',
    disabled: false,
    tone: isCultivating ? 'stop' : 'cultivate',
    actionKey: isCultivating ? 'stopCultivation' : 'startCultivation',
    reason: isCultivating ? 'Stop the current meditation activity.' : 'Begin meditation through the activity gate.',
  };
}

function resolveCommandDeck(
  snapshot: CultivationExactBuildSnapshot,
  activityState: CultivationExactActivityState,
): CultivationExactSurfaceV1['commandDeck'] {
  const gateAction = findGateAction(snapshot.runCompassActions);
  const prestigeAction = findPrestigeAction(snapshot.runCompassActions);
  const cultivateToggle = cultivateToggleButton(snapshot);
  const gateItemName = snapshot.requiredGateItemName ?? 'Gate item';
  const qiCapLine = `Qi Cap ${formatNumber(snapshot.breakthroughRequirement)}`;

  if (activityState === 'content_cap') {
    return {
      primary: {
        label: prestigeAction || snapshot.canPrestige ? 'Open Prestige' : 'Chapter cap reached',
        disabled: !prestigeAction && !snapshot.canPrestige,
        tone: 'cap',
        actionKey: prestigeAction || snapshot.canPrestige ? 'openPrestige' : 'none',
        reason: prestigeAction?.why ?? 'This life has reached the current content cap.',
        route: { kind: 'tab', tab: 'prestige' },
        runCompassAction: prestigeAction,
      },
      secondary: cultivateToggle,
      supportLine: 'Current chapter cap reached.',
    };
  }

  if (activityState === 'gate_blocked') {
    return {
      primary: {
        label: gateAction ? 'Open Gate Trial' : 'Prepare for Gate',
        disabled: !gateAction,
        tone: 'gate',
        actionKey: 'openGateTrial',
        reason: gateAction?.why ?? `${gateItemName} is required before breakthrough.`,
        route: gateAction?.target ?? undefined,
        runCompassAction: gateAction,
      },
      secondary: cultivateToggle,
      supportLine: `${gateItemName} ${snapshot.requiredGateItemCount}/1`,
    };
  }

  if (activityState === 'breakthrough_ready') {
    return {
      primary: {
        label: 'Break Through',
        disabled: false,
        tone: 'ready',
        actionKey: 'breakThrough',
        reason: 'Qi and gate requirements are ready.',
      },
      secondary: cultivateToggle,
      supportLine: 'Gate and Qi are aligned.',
    };
  }

  return {
    primary: cultivateToggle,
    secondary: {
      label: 'Break Through',
      disabled: true,
      tone: 'quiet',
      actionKey: 'breakThrough',
      reason: isRealmEdge(snapshot) ? `Need ${missingQiLabel(snapshot)} Qi.` : 'Reach the realm edge first.',
    },
    supportLine: qiCapLine,
  };
}

function createTopRibbon(snapshot: CultivationExactBuildSnapshot): CultivationRibbonCellSurface[] {
  const rate = formatRateLabel(snapshot.qiPerSecond, snapshot.breathQiRateMultiplier);
  return [
    {
      id: 'realm',
      label: 'Realm',
      primary: snapshot.realmName,
      secondary: `Stage ${snapshot.realm.substage}`,
      iconKey: 'realm',
      tone: 'neutral',
    },
    {
      id: 'qi',
      label: 'Qi',
      primary: formatNumber(snapshot.qi),
      iconKey: 'qi',
      tone: 'jade',
    },
    {
      id: 'rate',
      label: 'Cultivation Rate',
      primary: rate.ribbon,
      iconKey: 'rate',
      tone: 'gold',
      tooltip: `Base ${formatNumber(snapshot.qiPerSecond)} / s. Breath ${snapshot.breathModeLabel}. Buffs: ${snapshot.activeBuffSummary}`,
    },
    {
      id: 'stability',
      label: 'Stability',
      primary: formatPercentValue(snapshot.stability, snapshot.stabilityCap),
      iconKey: 'stability',
      tone: snapshot.stabilityCap > 0 && snapshot.stability / snapshot.stabilityCap <= 0.2 ? 'warning' : 'cinnabar',
    },
    {
      id: 'foreground',
      label: 'Foreground',
      primary: snapshot.activeActivityLabel,
      iconKey: 'foreground',
      tone: snapshot.activeActivityType === 'meditate' ? 'jade' : 'neutral',
    },
  ];
}

function createLeftSeals(
  snapshot: CultivationExactBuildSnapshot,
  activityState: CultivationExactActivityState,
): CultivationExactSurfaceV1['leftMilestoneSeals'] {
  if (activityState === 'gate_blocked') {
    return [
      { id: 'next', eyebrow: 'Next Milestone', title: 'Gate Seal', iconKey: 'mountain', tone: 'cinnabar', opensDrawer: 'gate' },
      { id: 'need', eyebrow: 'Need', title: snapshot.requiredGateItemName ?? 'Gate item', value: `${snapshot.requiredGateItemCount}/1`, iconKey: 'gate', tone: 'gold', opensDrawer: 'gate' },
      { id: 'action', eyebrow: 'Action', title: 'Open Gate Trial', iconKey: 'meditate', tone: 'jade', opensDrawer: 'gate' },
    ];
  }

  if (activityState === 'content_cap') {
    return [
      { id: 'next', eyebrow: 'Next Milestone', title: 'Chapter Cap', iconKey: 'lotus', tone: 'gold', opensDrawer: 'milestone' },
      { id: 'need', eyebrow: 'Need', title: 'Content Cap', value: 'Reached', iconKey: 'seal', tone: 'cinnabar', opensDrawer: 'milestone' },
      { id: 'action', eyebrow: 'Action', title: 'Open Prestige', iconKey: 'path', tone: 'jade', opensDrawer: 'milestone' },
    ];
  }

  if (activityState === 'breakthrough_ready') {
    return [
      { id: 'next', eyebrow: 'Next Milestone', title: 'Breakthrough', iconKey: 'mountain', tone: 'gold', opensDrawer: 'milestone' },
      { id: 'need', eyebrow: 'Need', title: 'Qi Cap', value: formatNumber(snapshot.breakthroughRequirement), iconKey: 'qi', tone: 'jade', opensDrawer: 'milestone' },
      { id: 'action', eyebrow: 'Action', title: 'Break Through', iconKey: 'meditate', tone: 'jade', opensDrawer: 'milestone' },
    ];
  }

  return [
    { id: 'next', eyebrow: 'Next Milestone', title: 'Push Qi', iconKey: 'mountain', tone: 'cinnabar', opensDrawer: 'milestone' },
    { id: 'need', eyebrow: 'Need', title: 'Qi Cap', value: formatNumber(snapshot.breakthroughRequirement), iconKey: 'qi', tone: 'jade', opensDrawer: 'milestone' },
    { id: 'action', eyebrow: 'Action', title: snapshot.activeActivityType === 'meditate' ? 'Continue Cultivation' : 'Start Cultivation', iconKey: 'meditate', tone: 'gold', opensDrawer: 'milestone' },
  ];
}

function createDoctrineSeals(snapshot: CultivationExactBuildSnapshot): CultivationExactSurfaceV1['rightDoctrineSeals'] {
  return [
    { id: 'path', label: 'Path', value: snapshot.selectedPathLabel, iconKey: 'path', tone: 'path', opensDrawer: 'doctrine' },
    { id: 'spiritRoot', label: 'Spirit Root', value: snapshot.spiritRootLabel, iconKey: 'flame', tone: snapshot.spiritRootElement, opensDrawer: 'doctrine' },
    { id: 'heartLaw', label: 'Heart Law', value: snapshot.heartLawName, iconKey: 'lotus', tone: 'lotus', opensDrawer: 'doctrine' },
    { id: 'verse', label: 'Verse', value: `Chapter ${snapshot.chapter}`, iconKey: 'scroll', tone: 'neutral', opensDrawer: 'doctrine' },
    { id: 'breathFocus', label: 'Breath / Focus', value: snapshot.breathModeLabel === snapshot.focusModeLabel ? snapshot.breathModeLabel : `${snapshot.breathModeLabel} / ${snapshot.focusModeLabel}`, iconKey: 'qi', tone: 'jade', opensDrawer: 'doctrine' },
  ];
}

function createBreakthroughSeal(
  snapshot: CultivationExactBuildSnapshot,
  activityState: CultivationExactActivityState,
): CultivationExactSurfaceV1['breakthroughSeal'] {
  if (activityState === 'content_cap') {
    return { label: 'Chapter Cap', value: 'Reached', state: 'content_cap', routeLabel: 'Prestige' };
  }
  if (activityState === 'gate_blocked') {
    return { label: 'Gate Seal', value: snapshot.requiredGateItemName ?? 'Gate item', state: 'gate_blocked', routeLabel: 'Gate Trial' };
  }
  if (activityState === 'breakthrough_ready') {
    return { label: 'Breakthrough', value: 'Ready', state: 'ready' };
  }
  if (activityState === 'near_edge') {
    return { label: 'Breakthrough', value: 'Approaching Edge', state: 'approaching_edge' };
  }
  return { label: 'Breakthrough', value: snapshot.activeActivityType === 'meditate' ? 'Cultivating' : 'Settled', state: 'cultivating' };
}

function createBreakthroughReadiness(
  snapshot: CultivationExactBuildSnapshot,
  activityState: CultivationExactActivityState,
  commandDeck: CultivationExactSurfaceV1['commandDeck'],
): CultivationBreakthroughReadinessSurfaceV1 {
  const gateItemName = snapshot.requiredGateItemName ?? 'Gate item';
  const qiReady = hasEnoughQi(snapshot);
  const gateReady = hasGateToken(snapshot);
  const realmEdgeReady = isRealmEdge(snapshot) || snapshot.atContentCap || !isMajorRealmTransition(snapshot);
  const state: CultivationBreakthroughReadinessSurfaceV1['state'] =
    activityState === 'content_cap' ? 'content_cap'
      : activityState === 'gate_blocked' ? 'gate_required'
        : activityState === 'breakthrough_ready' ? 'ready'
          : snapshot.canPrestige ? 'prestige_recommended'
            : snapshot.activeActivityType === 'meditate' ? 'cultivating'
              : 'blocked';
  const headline = state === 'ready'
    ? 'Qi and gate requirements are ready.'
    : state === 'gate_required'
      ? `${gateItemName} is still needed.`
      : state === 'content_cap'
        ? 'This chapter has reached its authored cap.'
        : state === 'cultivating'
          ? 'Qi is still gathering toward the next threshold.'
          : 'Reach the realm edge and fill the Qi reservoir.';

  return {
    title: 'Breakthrough Readiness',
    state,
    headline,
    detail: commandDeck.supportLine,
    rows: [
      {
        id: 'qi',
        label: 'Qi',
        value: qiReady ? 'Ready' : `${missingQiLabel(snapshot)} short`,
        tone: qiReady ? 'jade' : 'warning',
      },
      {
        id: 'realm-edge',
        label: 'Realm edge',
        value: realmEdgeReady ? 'Reached' : `Stage ${snapshot.realm.substage}/${snapshot.realmSubstages}`,
        tone: realmEdgeReady ? 'jade' : 'neutral',
      },
      {
        id: 'gate-item',
        label: 'Gate item',
        value: snapshot.requiredGateItemId ? `${gateItemName} ${snapshot.requiredGateItemCount}/1` : 'Not needed now',
        tone: gateReady ? 'jade' : 'warning',
      },
    ],
    primaryAction: commandDeck.primary.actionKey === 'openGateTrial' || commandDeck.primary.actionKey === 'openPrestige'
      ? commandDeck.primary
      : null,
  };
}

function createDrawers(
  snapshot: CultivationExactBuildSnapshot,
  commandDeck: CultivationExactSurfaceV1['commandDeck'],
): CultivationExactSurfaceV1['drawers'] {
  const gateItemName = snapshot.requiredGateItemName ?? 'Gate item';
  const milestone: CultivationDrawerSurface = {
    id: 'milestone',
    side: 'left',
    title: 'Milestone Details',
    subtitle: snapshot.nextRealmName ? `${snapshot.realmName} toward ${snapshot.nextRealmName}` : snapshot.realmName,
    rows: [
      { id: 'realm', label: 'Realm', value: `${snapshot.realmName}, Stage ${snapshot.realm.substage}` },
      { id: 'qi', label: 'Qi', value: `${formatNumber(snapshot.qi)} / ${formatNumber(snapshot.breakthroughRequirement)}`, tone: hasEnoughQi(snapshot) ? 'jade' : 'neutral' },
      { id: 'gate', label: 'Gate item', value: snapshot.requiredGateItemId ? `${gateItemName} ${snapshot.requiredGateItemCount}/1` : 'No gate item is needed now', tone: hasGateToken(snapshot) ? 'jade' : 'warning' },
      { id: 'buffs', label: 'Cultivation buffs', value: snapshot.activeBuffSummary, tone: snapshot.activeBuffSummary === 'No active cultivation tonics.' ? 'muted' : 'gold' },
    ],
    runCompass: snapshot.runCompassFull ?? null,
  };

  const doctrine: CultivationDrawerSurface = {
    id: 'doctrine',
    side: 'right',
    title: 'Doctrine Details',
    subtitle: snapshot.selectedPathSummary,
    rows: [
      { id: 'path', label: 'Path', value: snapshot.selectedPathLabel },
      { id: 'root', label: 'Spirit Root', value: `${snapshot.spiritRootLabel} - ${snapshot.spiritRootDetail}` },
      { id: 'heart-law', label: 'Heart Law', value: snapshot.heartLawDetail },
      { id: 'resonance', label: snapshot.resonanceLine, value: snapshot.resonanceDetail },
      { id: 'breath-focus', label: 'Breath / Focus', value: `${snapshot.breathModeLabel} / ${snapshot.focusModeLabel}` },
    ],
    verse: {
      chapter: snapshot.chapter,
      comprehension: snapshot.comprehension,
      requirement: snapshot.comprehensionRequirement,
      title: snapshot.heartLawName === 'No Heart Law selected'
        ? 'Choose a Heart Law to unlock verse progress.'
        : `${snapshot.heartLawName} verse progress`,
      isComplete: snapshot.comprehensionRequirement <= 0 && snapshot.heartLawName !== 'No Heart Law selected',
      placeholderLabel: snapshot.heartLawName === 'No Heart Law selected' ? 'Heart Law Needed' : undefined,
      placeholderValue: snapshot.heartLawName === 'No Heart Law selected' ? 'Choose a Heart Law to begin verse progress.' : undefined,
    },
  };

  const gate: CultivationDrawerSurface = {
    id: 'gate',
    side: 'left',
    title: 'Gate Seal',
    subtitle: snapshot.requiredGateItemId ? `${gateItemName} required before breakthrough.` : 'No gate item is required for this step.',
    rows: [
      { id: 'gate-item', label: gateItemName, value: snapshot.requiredGateItemId ? `${snapshot.requiredGateItemCount}/1` : 'Ready', tone: hasGateToken(snapshot) ? 'jade' : 'warning' },
      { id: 'qi', label: 'Qi', value: hasEnoughQi(snapshot) ? 'Ready' : `${missingQiLabel(snapshot)} short`, tone: hasEnoughQi(snapshot) ? 'jade' : 'warning' },
    ],
    action: commandDeck.primary.actionKey === 'openGateTrial' ? commandDeck.primary : undefined,
    runCompass: snapshot.runCompassFull ?? null,
  };

  const buffs: CultivationDrawerSurface = {
    id: 'buffs',
    side: 'left',
    title: 'Cultivation Buffs',
    rows: [
      { id: 'active', label: 'Active support', value: snapshot.activeBuffSummary, tone: snapshot.activeBuffSummary === 'No active cultivation tonics.' ? 'muted' : 'gold' },
    ],
  };

  const lifeCycle: CultivationDrawerSurface = {
    id: 'lifeCycle',
    side: 'right',
    title: 'Prestige Route',
    subtitle: snapshot.atContentCap ? 'Prestige is the next long arc.' : 'Quiet until the chapter cap is reached.',
    rows: [
      { id: 'status', label: 'State', value: snapshot.atContentCap ? 'Active' : 'Inactive', tone: snapshot.atContentCap ? 'gold' : 'muted' },
      { id: 'route', label: 'Route', value: snapshot.canPrestige ? 'Prestige' : 'Not unlocked yet', tone: snapshot.canPrestige ? 'jade' : 'muted' },
    ],
    action: commandDeck.primary.actionKey === 'openPrestige' ? commandDeck.primary : undefined,
  };

  return { milestone, doctrine, gate, buffs, lifeCycle };
}

function createSurface(
  snapshot: CultivationExactBuildSnapshot,
  options: Required<Pick<BuildCultivationExactSurfaceOptions, 'selectedDrawer' | 'reducedMotion' | 'fxQuality'>> & {
    mode: CultivationExactSurfaceMode;
    source: 'fixture' | 'stores';
    fixtureDisplayPercent?: number;
  },
): CultivationExactSurfaceV1 {
  const activityState = options.mode === 'fixture' ? 'cultivating' : resolveActivityState(snapshot);
  const qiPct = ratioPercent(snapshot.qi, snapshot.breakthroughRequirement);
  const rate = formatRateLabel(snapshot.qiPerSecond, snapshot.breathQiRateMultiplier);
  const commandDeck = resolveCommandDeck(snapshot, activityState);
  const lotus = lotusForState(activityState);
  const breakthroughReadiness = createBreakthroughReadiness(snapshot, activityState, commandDeck);
  return {
    meta: {
      surfaceId: CULTIVATION_EXACT_SURFACE_ID,
      version: CULTIVATION_EXACT_SURFACE_VERSION,
      rootTestId: CULTIVATION_EXACT_ROOT_TEST_ID,
      mode: options.mode,
      source: options.source,
      activityState,
      reducedMotion: options.reducedMotion,
      fxQuality: options.fxQuality,
      selectedDrawer: options.selectedDrawer,
    },
    shell: createCultivationExactShellFlags(),
    topRibbon: createTopRibbon(snapshot),
    leftMilestoneSeals: createLeftSeals(snapshot, activityState),
    rightDoctrineSeals: createDoctrineSeals(snapshot),
    daoSeal: {
      id: 'dao',
      label: 'Dao',
      value: 'Dao',
      iconKey: 'seal',
      tone: 'cinnabar',
      actionKey: 'openDaoHeart',
    },
    centerAltar: {
      heroAssetId: 'cbg_full',
      dantian: {
        state: dantianStateForActivity(activityState),
        elementAccent: snapshot.spiritRootElement,
        label: lotus.label,
        heartLawTags: snapshot.heartLawTags.length > 0 ? snapshot.heartLawTags : [snapshot.spiritRootElement],
        preserveDantianOrbComponent: true,
      },
      lotus,
      ringLayers: [
        { id: 'outer', tone: 'gold', intensity: activityState === 'breakthrough_ready' ? 'ready' : activityState === 'idle' ? 'quiet' : 'active' },
        { id: 'inner', tone: 'jade', intensity: activityState === 'breakthrough_ready' ? 'ready' : activityState === 'idle' ? 'quiet' : 'active' },
        { id: 'glyphs', tone: 'gold', intensity: activityState === 'breakthrough_ready' ? 'ready' : 'quiet' },
        { id: 'motes', tone: 'jade', intensity: activityState === 'cultivating' || activityState === 'near_edge' ? 'active' : 'quiet' },
        { id: 'mist', tone: 'muted', intensity: 'quiet' },
      ],
      visualFlags: createCultivationExactVisualFlags(),
    },
    breakthroughSeal: createBreakthroughSeal(snapshot, activityState),
    qiRail: {
      currentLabel: formatNumber(snapshot.qi),
      requiredLabel: formatNumber(snapshot.breakthroughRequirement),
      combinedLabel: `Qi ${formatNumber(snapshot.qi)} / ${formatNumber(snapshot.breakthroughRequirement)}`,
      percent: qiPct,
      displayPercent: options.fixtureDisplayPercent,
      rateLabel: rate.rail,
      state: activityState === 'breakthrough_ready' ? 'ready' : activityState === 'near_edge' ? 'near_edge' : 'normal',
    },
    commandDeck,
    breakthroughReadiness,
    runCompassCompact: snapshot.runCompassCompact ?? buildRunCompassCompactSurface(snapshot.runCompassFull ?? null),
    lifeCycleWhisper: {
      visible: false,
      active: false,
      label: '',
      route: { kind: 'tab', tab: 'prestige' },
      runCompassAction: null,
    },
    drawers: createDrawers(snapshot, commandDeck),
    debug: {
      notes: [],
      sourceSummary: [
        `realm=${snapshot.realmName}`,
        `qi=${snapshot.qi}`,
        `activity=${snapshot.activeActivityLabel}`,
      ],
      visualParityWarnings: [],
    },
  };
}

export function createCultivationExactMockupFixture(): CultivationExactSurfaceV1 {
  const snapshot: CultivationExactBuildSnapshot = {
    realm: { index: 0, substage: 7, name: CULTIVATION_EXACT_FIXTURE_COPY.realm },
    realmName: CULTIVATION_EXACT_FIXTURE_COPY.realm,
    realmSubstages: 9,
    nextRealmName: 'Foundation Establishment',
    qi: '5500000',
    breakthroughRequirement: '24400000',
    qiPerSecond: '292.25',
    breathQiRateMultiplier: 1,
    breathModeLabel: 'Balanced',
    focusModeLabel: 'Balanced',
    activeActivityType: 'meditate',
    activeActivityLabel: CULTIVATION_EXACT_FIXTURE_COPY.foreground,
    stability: 0,
    stabilityCap: 100,
    selectedPathLabel: CULTIVATION_EXACT_FIXTURE_COPY.path,
    selectedPathSummary: 'Heaven path doctrine.',
    spiritRootLabel: CULTIVATION_EXACT_FIXTURE_COPY.spiritRoot,
    spiritRootDetail: 'Fire root, rare grade.',
    spiritRootElement: 'fire',
    heartLawName: CULTIVATION_EXACT_FIXTURE_COPY.heartLaw,
    heartLawDetail: 'Ember Thread Sutra.',
    heartLawTags: ['fire'],
    chapter: 1,
    comprehension: 0,
    comprehensionRequirement: 10,
    resonanceLine: 'Resonant',
    resonanceDetail: 'The doctrine is aligned with the root.',
    requiredGateItemId: null,
    requiredGateItemName: null,
    requiredGateItemCount: 0,
    atContentCap: false,
    canPrestige: false,
    activeBuffSummary: 'No active cultivation tonics.',
    runCompassActions: [],
    runCompassFull: null,
    runCompassCompact: null,
  };

  return createSurface(snapshot, {
    mode: 'fixture',
    source: 'fixture',
    selectedDrawer: 'none',
    reducedMotion: false,
    fxQuality: 'high',
    fixtureDisplayPercent: 35,
  });
}

export function buildCultivationExactSurfaceFromSnapshots(
  snapshot: CultivationExactBuildSnapshot,
  options: BuildCultivationExactSurfaceOptions = {},
): CultivationExactSurfaceV1 {
  return createSurface(snapshot, {
    mode: options.mode ?? 'live',
    source: 'stores',
    selectedDrawer: options.selectedDrawer ?? 'none',
    reducedMotion: options.reducedMotion ?? false,
    fxQuality: options.fxQuality ?? 'medium',
  });
}

export function buildCultivationExactSnapshotFromStores(
  options: BuildCultivationExactSurfaceOptions = {},
): CultivationExactBuildSnapshot {
  const game = useGameStore.getState();
  const cultivation = useCultivationStore.getState();
  const content = useContentStore.getState();
  const inventory = useInventoryStore.getState();
  const prestige = usePrestigeStore.getState();
  const activity = useActivityStore.getState();

  const liveRealmIndex = clampRealmIndexToSemesterSlice(game.realm.index);
  const currentRealm = REALMS[liveRealmIndex] ?? REALMS[0];
  const nextRealm = getNextLiveRealm(liveRealmIndex);
  const realmSubstages = currentRealm?.substages ?? game.realm.substage;
  const atContentCap = isAtSemesterCap(liveRealmIndex);
  const willAdvanceRealm = game.realm.substage >= realmSubstages && !atContentCap;
  const requiredGateItemId = willAdvanceRealm
    ? getGateTransitionItemIdForRealmIndex(content.raw, game.realm.index)
    : null;
  const requiredGateItemName = requiredGateItemId
    ? content.maps.itemsById[requiredGateItemId]?.name ?? titleCase(requiredGateItemId)
    : null;
  const requiredGateItemCount = requiredGateItemId ? inventory.getItemCount(requiredGateItemId) : 0;
  const breathMultipliers = getBreathModeMultipliers(cultivation.breathMode);
  const breathSemantics = getBreathModeSemantics(cultivation.breathMode);
  const focusSemantics = getFocusModeSemantics(game.focusMode);
  const pathProfile = getPathDoctrineProfile(game.selectedPath);
  const spiritRootView = adaptSpiritRootDoctrineToSemanticView(prestige.spiritRoot);
  const heartLawDef = cultivation.selectedHeartLawId
    ? content.maps.heartLawsById[cultivation.selectedHeartLawId] ?? null
    : null;
  const resonance = getAffinityStatus(heartLawDef, prestige.spiritRoot);
  const resonanceLine = resonance.status === 'match'
    ? (resonance.percent >= 10 ? 'Strong Resonance' : 'Resonant')
    : resonance.status === 'mismatch'
      ? 'Mismatched'
      : 'Neutral';
  const active = activity.active;
  const activeActivityLabel = active
    ? active.type === 'meditate'
      ? 'Cultivating'
      : active.type === 'trial'
        ? 'Gate Trial'
        : titleCase(active.type)
    : 'Idle';
  const runCompassFull = options.runCompassFull ?? buildLiveRunCompassSurface();
  const runCompassCompact = buildRunCompassCompactSurface(runCompassFull);
  const buffReadModel = buildCultivationConsumableReadModel(
    cultivation.activeCultivationConsumables,
    options.nowMs ?? Date.now(),
  );
  const activeBuffSummary = buffReadModel.entries.length === 0
    ? 'No active cultivation tonics.'
    : buffReadModel.entries
      .map((entry) => {
        const family = CULTIVATION_CONSUMABLE_FAMILY_REGISTRY[entry.family];
        return `${family.shortLabel}: ${entry.shortLabel}`;
      })
      .join(', ');

  return {
    realm: game.realm,
    realmName: currentRealm?.name ?? game.realm.name,
    realmSubstages,
    nextRealmName: atContentCap ? null : nextRealm?.name ?? null,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    qiPerSecond: game.qiPerSecond,
    breathQiRateMultiplier: breathMultipliers.qiRateMult,
    breathModeLabel: breathSemantics.label,
    focusModeLabel: focusSemantics.label,
    activeActivityType: active?.type ?? null,
    activeActivityLabel,
    stability: cultivation.stability,
    stabilityCap: cultivation.stabilityCap,
    selectedPathLabel: pathProfile?.label ?? 'No Path selected',
    selectedPathSummary: getPathDoctrineSummary(game.selectedPath),
    spiritRootLabel: spiritRootView
      ? `${SPIRIT_ROOT_ELEMENTS[spiritRootView.element]} / ${SPIRIT_ROOT_GRADES[spiritRootView.grade]}`
      : 'Dormant Spirit Root',
    spiritRootDetail: spiritRootView
      ? `${titleCase(spiritRootView.purityBand)} foundation, ${Math.round(spiritRootView.purity)}% purity`
      : 'Your Spirit Root has not manifested yet.',
    spiritRootElement: spiritRootView?.element ?? 'neutral',
    heartLawName: heartLawDef?.name ?? 'No Heart Law selected',
    heartLawDetail: heartLawDef
      ? `${heartLawDef.name}${heartLawDef.archetype ? `, ${titleCase(heartLawDef.archetype)}` : ''}`
      : 'Choose a Heart Law in Dao to unlock verse progress.',
    heartLawTags: (heartLawDef?.daoTags ?? []).map((tag) => tag.toLowerCase()),
    chapter: cultivation.chapter,
    comprehension: cultivation.comprehension,
    comprehensionRequirement: cultivation.getComprehensionRequirementForNextChapter(),
    resonanceLine,
    resonanceDetail: resonance.status === 'none'
      ? 'No active Heart Law or Spirit Root pairing is available yet.'
      : resonance.status === 'mismatch'
        ? 'The pairing works, but its signature affinity is not aligned.'
        : `${resonance.percent}% signature affinity modifier from the current Spirit Root.`,
    requiredGateItemId,
    requiredGateItemName,
    requiredGateItemCount,
    atContentCap,
    canPrestige: prestige.canPrestige(),
    activeBuffSummary,
    runCompassActions: runCompassFull?.bestNextActions ?? [],
    runCompassFull,
    runCompassCompact,
  };
}

export function buildCultivationExactSurfaceFromStores(
  options: BuildCultivationExactSurfaceOptions = {},
): CultivationExactSurfaceV1 {
  if (options.mode === 'fixture') {
    const fixture = createCultivationExactMockupFixture();
    return {
      ...fixture,
      meta: {
        ...fixture.meta,
        selectedDrawer: options.selectedDrawer ?? fixture.meta.selectedDrawer,
        reducedMotion: options.reducedMotion ?? fixture.meta.reducedMotion,
        fxQuality: options.fxQuality ?? fixture.meta.fxQuality,
      },
    };
  }

  const snapshot = buildCultivationExactSnapshotFromStores(options);
  return createSurface(snapshot, {
    mode: 'live',
    source: 'stores',
    selectedDrawer: options.selectedDrawer ?? ('none' satisfies CultivationExactDrawerId),
    reducedMotion: options.reducedMotion ?? false,
    fxQuality: options.fxQuality ?? ('medium' satisfies CultivationExactFxQuality),
  });
}
