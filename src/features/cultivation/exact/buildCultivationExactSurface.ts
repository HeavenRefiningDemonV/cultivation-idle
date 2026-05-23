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
import {
  buildDaoOmenProjectionV1,
  buildLiveDaoMandateSurfaceV1,
  createDaoMandateFixture,
  createDaoOmenProjectionRawFixture,
  pickDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
  type DaoMandateRoute,
  type DaoOmenProjectionFixtureState,
  type DaoOmenProjectionV1,
  type DaoProofSealV1,
} from '../../../systems/ui/daoMandate/index.js';
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
  CultivationButtonSurface,
  CultivationCompactOmenSurfaceV1,
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

function buildCultivationRawOmenSurface(
  snapshot: CultivationExactBuildSnapshot,
  mode: CultivationExactSurfaceMode,
  projectionMode: 'snapshot' | 'live',
) {
  const uiSettings = useUIStore.getState().settings;
  const guidanceSettings = pickDaoMandateGuidanceSettings(uiSettings);

  if (projectionMode === 'live' && mode !== 'fixture') {
    return buildLiveDaoMandateSurfaceV1({
        currentScreen: 'cultivation',
        guidanceProfile: guidanceSettings.guidanceOath,
      });
  }

  if (mode === 'fixture') {
    return createDaoMandateFixture('cultivating_qi_short', guidanceSettings.guidanceOath);
  }

  return createDaoOmenProjectionRawFixture(resolveCultivationProjectionFixtureState(snapshot), guidanceSettings.guidanceOath);
}

function buildCultivationOmenProjection(
  snapshot: CultivationExactBuildSnapshot,
  mode: CultivationExactSurfaceMode,
  projectionMode: 'snapshot' | 'live',
): DaoOmenProjectionV1 {
  return buildDaoOmenProjectionV1(buildCultivationRawOmenSurface(snapshot, mode, projectionMode), {
    currentScreen: 'cultivation',
    routeContext: 'default',
  });
}

function resolveCultivationProjectionFixtureState(snapshot: CultivationExactBuildSnapshot): DaoOmenProjectionFixtureState {
  const activityState = resolveActivityState(snapshot);

  if (activityState === 'content_cap') return 'content_cap_reached';
  if (activityState === 'breakthrough_ready') return 'breakthrough_ready';
  if (activityState === 'gate_blocked') return 'gate_proof_missing_attemptable';
  return 'qi_short_before_realm_edge';
}

function buildCultivationCompactOmenSurface(
  snapshot: CultivationExactBuildSnapshot,
  mode: CultivationExactSurfaceMode,
  projectionMode: 'snapshot' | 'live',
): CultivationCompactOmenSurfaceV1 {
  const uiSettings = useUIStore.getState().settings;
  const guidanceSettings = pickDaoMandateGuidanceSettings(uiSettings);
  const motionMode = resolveDaoMandateEffectiveMotionMode({
    mandateMotionMode: guidanceSettings.mandateMotionMode,
    storyMotionMode: uiSettings.storyMotionMode,
  });
  const projection = buildCultivationOmenProjection(snapshot, mode, projectionMode);
  const proofSeals = pickCultivationThresholdProofSeals(projection, snapshot);

  return {
    projection,
    currentOmen: projection.currentOmen,
    proofSeals,
    sourceThreads: projection.sourceThreads,
    reflections: projection.reflections,
    motionMode,
    regionLabel: 'Threshold Omen',
    detailSummary: projection.currentOmen.detail,
    detailActionLabel: 'Inspect proof',
    allowedDirectRoute: getCultivationAllowedDirectRoute(projection),
    defaultCopyPolicy: 'symptom_proof_first',
    sourceThreadsOpenByDefault: false,
  };
}

function pickCultivationThresholdProofSeals(
  projection: DaoOmenProjectionV1,
  snapshot: CultivationExactBuildSnapshot,
): DaoProofSealV1[] {
  const allowedKinds = new Set<DaoProofSealV1['kind']>([
    'realm_edge',
    'qi_threshold',
    'gate_proof',
    'mercy_seal',
    'reincarnation',
  ]);
  const cap = 3;
  const fallbackSeals = buildFallbackCultivationProofSeals(snapshot, projection);
  const seenKinds = new Set<DaoProofSealV1['kind']>();
  const selected: DaoProofSealV1[] = [];

  for (const seal of [...projection.proofSeals, ...fallbackSeals]) {
    if (!allowedKinds.has(seal.kind) || seenKinds.has(seal.kind)) continue;
    if ((seal.kind === 'mercy_seal' || seal.kind === 'reincarnation') && !isMetaOrMercyOmen(projection.currentOmen.kind)) continue;
    selected.push(seal);
    seenKinds.add(seal.kind);
    if (selected.length >= cap) break;
  }

  return selected;
}

function isMetaOrMercyOmen(kind: DaoOmenProjectionV1['currentOmen']['kind']): boolean {
  return kind === 'safety_net_ready' || kind === 'content_cap' || kind === 'reincarnation_viable';
}

function buildFallbackCultivationProofSeals(
  snapshot: CultivationExactBuildSnapshot,
  projection: DaoOmenProjectionV1,
): DaoProofSealV1[] {
  const qiReady = hasEnoughQi(snapshot);
  const realmEdgeReady = isRealmEdge(snapshot) || snapshot.atContentCap || !isMajorRealmTransition(snapshot);
  const gateReady = hasGateToken(snapshot);
  const gateProofName = snapshot.requiredGateItemName ?? 'Gate Proof';
  const gateRoute = projection.hardRoutes.find((route) => route.target?.kind === 'world_module' && route.target.moduleKey === 'gateTrial')
    ?? (projection.currentOmen.route?.target?.kind === 'world_module' && projection.currentOmen.route.target.moduleKey === 'gateTrial'
      ? projection.currentOmen.route
      : null);

  const qiSeal: DaoProofSealV1 = {
    id: 'cultivation-proof-qi-threshold',
    kind: 'qi_threshold',
    label: 'Qi Reservoir',
    state: qiReady ? 'sealed' : 'thin',
    tone: qiReady ? 'jade' : 'cinnabar',
    iconId: 'qi',
    detail: qiReady
      ? 'Qi threshold proof is sealed.'
      : `The dantian is ${missingQiLabel(snapshot)} Qi short.`,
    ownerScreen: 'cultivation',
    evidenceIds: [`qi:${snapshot.qi}/${snapshot.breakthroughRequirement}`],
    routePolicy: 'hidden',
  };

  const realmSeal: DaoProofSealV1 = {
    id: 'cultivation-proof-realm-edge',
    kind: 'realm_edge',
    label: isMajorRealmTransition(snapshot) ? 'Realm Edge' : 'Current Threshold',
    state: realmEdgeReady ? 'sealed' : 'unsealed',
    tone: realmEdgeReady ? 'jade' : 'cinnabar',
    iconId: 'mountain',
    detail: realmEdgeReady
      ? 'The realm edge is known.'
      : `Stage ${snapshot.realm.substage} of ${snapshot.realmSubstages} has not reached the edge.`,
    ownerScreen: 'cultivation',
    evidenceIds: [`realm:${snapshot.realm.index}:${snapshot.realm.substage}/${snapshot.realmSubstages}`],
    routePolicy: 'hidden',
  };

  const gateSeal: DaoProofSealV1 = {
    id: 'cultivation-proof-gate-proof',
    kind: 'gate_proof',
    label: 'Gate Proof',
    state: snapshot.requiredGateItemId ? (gateReady ? 'sealed' : 'unsealed') : 'quiet',
    tone: snapshot.requiredGateItemId ? (gateReady ? 'jade' : 'cinnabar') : 'ink',
    iconId: 'seal',
    detail: snapshot.requiredGateItemId
      ? gateReady
        ? `${gateProofName} is sealed.`
        : `${gateProofName} remains unsealed.`
      : 'No gate proof is required for this threshold.',
    ownerScreen: 'gateTrial',
    evidenceIds: snapshot.requiredGateItemId
      ? [`gate-proof:${snapshot.requiredGateItemId}:${snapshot.requiredGateItemCount}/1`]
      : ['gate-proof:none'],
    ...(snapshot.requiredGateItemId && !gateReady && gateRoute ? { route: gateRoute } : {}),
    routePolicy: snapshot.requiredGateItemId && !gateReady ? 'direct' : 'hidden',
  };

  const seals = [realmSeal, qiSeal, gateSeal];
  if (snapshot.atContentCap) {
    seals.unshift({
      id: 'cultivation-proof-reincarnation',
      kind: 'reincarnation',
      label: 'Reincarnation',
      state: 'cap',
      tone: 'gold',
      iconId: 'circle',
      detail: 'This chapter has reached its authored handoff.',
      ownerScreen: 'prestige',
      evidenceIds: ['content-cap'],
      ...(projection.currentOmen.route ? { route: projection.currentOmen.route } : {}),
      routePolicy: projection.currentOmen.route ? 'direct' : 'inspect',
    });
  }

  return seals;
}

function getCultivationAllowedDirectRoute(projection: DaoOmenProjectionV1): DaoMandateRoute | null {
  if (projection.currentOmen.allowDirectRoute && projection.currentOmen.route) {
    return projection.currentOmen.route;
  }
  return projection.hardRoutes.find((route) => Boolean(route.target)) ?? null;
}

function buildCultivationOmenDrawerRows(compactOmen: CultivationCompactOmenSurfaceV1): CultivationDrawerSurface['rows'] {
  return [
    {
      id: 'omen',
      label: compactOmen.currentOmen.title,
      value: compactOmen.currentOmen.detail,
      tone: compactOmen.currentOmen.tone === 'cinnabar' ? 'warning' : compactOmen.currentOmen.tone === 'gold' ? 'gold' : 'jade',
    },
    ...compactOmen.proofSeals.map((seal): CultivationDrawerSurface['rows'][number] => ({
      id: seal.id,
      label: seal.label,
      value: seal.detail,
      tone: seal.tone === 'cinnabar' ? 'warning' : seal.tone === 'gold' ? 'gold' : seal.tone === 'jade' ? 'jade' : 'neutral',
    })),
  ];
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
  const gateProofName = snapshot.requiredGateItemName ?? 'Gate Proof';
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
        reason: gateAction?.why ?? `${gateProofName} is required before breakthrough.`,
        route: gateAction?.target ?? undefined,
        runCompassAction: gateAction,
      },
      secondary: cultivateToggle,
      supportLine: `${gateProofName} ${snapshot.requiredGateItemCount}/1`,
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
      { id: 'need', eyebrow: 'Need', title: snapshot.requiredGateItemName ?? 'Gate Proof', value: `${snapshot.requiredGateItemCount}/1`, iconKey: 'gate', tone: 'gold', opensDrawer: 'gate' },
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
    return { label: 'Gate Seal', value: snapshot.requiredGateItemName ?? 'Gate Proof', state: 'gate_blocked', routeLabel: 'Gate Trial' };
  }
  if (activityState === 'breakthrough_ready') {
    return { label: 'Breakthrough', value: 'Ready', state: 'ready' };
  }
  if (activityState === 'near_edge') {
    return { label: 'Breakthrough', value: 'Approaching Edge', state: 'approaching_edge' };
  }
  return { label: 'Breakthrough', value: snapshot.activeActivityType === 'meditate' ? 'Cultivating' : 'Settled', state: 'cultivating' };
}

function createDrawers(
  snapshot: CultivationExactBuildSnapshot,
  commandDeck: CultivationExactSurfaceV1['commandDeck'],
  compactOmen: CultivationCompactOmenSurfaceV1,
): CultivationExactSurfaceV1['drawers'] {
  const gateProofName = snapshot.requiredGateItemName ?? 'Gate Proof';
  const omen: CultivationDrawerSurface = {
    id: 'omen',
    side: 'left',
    title: compactOmen.regionLabel,
    subtitle: compactOmen.detailSummary,
    rows: buildCultivationOmenDrawerRows(compactOmen),
    action: compactOmen.allowedDirectRoute?.target?.kind === 'world_module'
      && compactOmen.allowedDirectRoute.target.moduleKey === 'gateTrial'
      && commandDeck.primary.actionKey === 'openGateTrial'
      ? commandDeck.primary
      : compactOmen.allowedDirectRoute?.target?.kind === 'tab'
        && compactOmen.allowedDirectRoute.target.tab === 'prestige'
        && commandDeck.primary.actionKey === 'openPrestige'
          ? commandDeck.primary
          : undefined,
  };
  const milestone: CultivationDrawerSurface = {
    id: 'milestone',
    side: 'left',
    title: 'Milestone Details',
    subtitle: snapshot.nextRealmName ? `${snapshot.realmName} toward ${snapshot.nextRealmName}` : snapshot.realmName,
    rows: [
      { id: 'realm', label: 'Realm', value: `${snapshot.realmName}, Stage ${snapshot.realm.substage}` },
      { id: 'qi', label: 'Qi', value: `${formatNumber(snapshot.qi)} / ${formatNumber(snapshot.breakthroughRequirement)}`, tone: hasEnoughQi(snapshot) ? 'jade' : 'neutral' },
      { id: 'gate', label: 'Gate', value: snapshot.requiredGateItemId ? `${gateProofName} ${snapshot.requiredGateItemCount}/1` : 'No gate proof needed now', tone: hasGateToken(snapshot) ? 'jade' : 'warning' },
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
      placeholderValue: snapshot.heartLawName === 'No Heart Law selected' ? 'Choose a Heart Law in Dao to begin verse progress.' : undefined,
    },
  };

  const gate: CultivationDrawerSurface = {
    id: 'gate',
    side: 'left',
    title: 'Gate Seal',
    subtitle: snapshot.requiredGateItemId ? `${gateProofName} required before breakthrough.` : 'No gate proof is required for this step.',
    rows: [
      { id: 'proof', label: gateProofName, value: snapshot.requiredGateItemId ? `${snapshot.requiredGateItemCount}/1` : 'Ready', tone: hasGateToken(snapshot) ? 'jade' : 'warning' },
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

  return { omen, milestone, doctrine, gate, buffs, lifeCycle };
}

function createSurface(
  snapshot: CultivationExactBuildSnapshot,
  options: Required<Pick<BuildCultivationExactSurfaceOptions, 'selectedDrawer' | 'reducedMotion' | 'fxQuality'>> & {
    mode: CultivationExactSurfaceMode;
    source: 'fixture' | 'stores';
    projectionMode: 'snapshot' | 'live';
    fixtureDisplayPercent?: number;
  },
): CultivationExactSurfaceV1 {
  const activityState = options.mode === 'fixture' ? 'cultivating' : resolveActivityState(snapshot);
  const qiPct = ratioPercent(snapshot.qi, snapshot.breakthroughRequirement);
  const rate = formatRateLabel(snapshot.qiPerSecond, snapshot.breathQiRateMultiplier);
  const commandDeck = resolveCommandDeck(snapshot, activityState);
  const lotus = lotusForState(activityState);
  const compactOmen = buildCultivationCompactOmenSurface(snapshot, options.mode, options.projectionMode);
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
    compactOmen,
    runCompassCompact: snapshot.runCompassCompact ?? buildRunCompassCompactSurface(snapshot.runCompassFull ?? null),
    lifeCycleWhisper: {
      visible: false,
      active: false,
      label: '',
      route: { kind: 'tab', tab: 'prestige' },
      runCompassAction: null,
    },
    drawers: createDrawers(snapshot, commandDeck, compactOmen),
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
    projectionMode: 'snapshot',
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
    projectionMode: 'snapshot',
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
    projectionMode: 'live',
    selectedDrawer: options.selectedDrawer ?? ('none' satisfies CultivationExactDrawerId),
    reducedMotion: options.reducedMotion ?? false,
    fxQuality: options.fxQuality ?? ('medium' satisfies CultivationExactFxQuality),
  });
}
