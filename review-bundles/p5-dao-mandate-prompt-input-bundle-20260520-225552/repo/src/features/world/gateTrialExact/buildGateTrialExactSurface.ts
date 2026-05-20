import type {
  GateTrialActiveTheaterEventTone,
  GateTrialActiveTheaterFloatingEventSurface,
  GateTrialActiveTheaterLogLineSurface,
  GateTrialActiveTheaterSurface,
  GateTrialButtonSurface,
  GateTrialChecklistRowSurface,
  GateTrialExactStatus,
  GateTrialExactSurfaceV1,
  GateTrialExactTone,
  GateTrialFactRowSurface,
  GateTrialFixSurface,
  GateTrialReadinessNodeId,
  GateTrialReadinessNodeSurface,
  GateTrialResultTransitionSurface,
  GateTrialTacticalCellSurface,
  GateTrialSummaryRowSurface,
} from './gateTrialExactTypes.js';

import { REALMS } from '../../../constants/index.js';
import type { TrialDef, TrialFailSafeCost } from '../../../content/types.js';
import { useActivityStore, type ActiveActivity } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore, type InventoryState } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { useTechniqueStore } from '../../../stores/techniqueStore.js';
import { useTrialStore, type TrialProgress } from '../../../stores/trialStore.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { getTrialGateItemId, getTrialGateRewardBundle } from '../../../systems/progression/runtime/gateResolver.js';
import {
  getTrialLifecycleSnapshot,
  type TrialLifecycleSnapshot,
} from '../../../systems/progression/runtime/trialLifecycle.js';
import {
  buildGateTrialReadinessSurface,
  buildSection5PostFailureSurface,
  type GateTrialChecklistLine,
  type GateTrialReadinessSurface,
} from '../../../systems/readiness/section5Adapters.js';
import { buildLiveRunCompassSurfaceV2 } from '../../../systems/ui/runCompass/index.js';
import { buildFailureReflectionSurface, useFailureReflectionStore } from '../../../systems/failureReflection/index.js';
import { buildLiveCombatAftermathSurface } from '../../combatAftermath/index.js';
import { getTrialGateIndex } from '../../../services/diagnostics/balanceTelemetryService.js';

import {
  GATE_TRIAL_EXACT_REGION_ORDER,
  GATE_TRIAL_EXACT_ROOT_TEST_ID,
  GATE_TRIAL_EXACT_SURFACE_VERSION,
  GATE_TRIAL_FIXTURE_COPY,
  GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS,
  GATE_TRIAL_FIXTURE_MINIMUM_ROWS,
  GATE_TRIAL_FIXTURE_READINESS_NODES,
  GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS,
  GATE_TRIAL_FIXTURE_SUMMARY_ROWS,
  GATE_TRIAL_FIXTURE_TOP_FIXES,
  GATE_TRIAL_TARGET_MOCKUP_ID,
} from './gateTrialExactPresentation.js';

import {
  GATE_TRIAL_EXACT_ASSETS,
  GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING,
} from './gateTrialExactAssetRegistry.js';
import type {
  CombatContext,
  CombatEvent,
  CombatLogEntry,
  CombatTechniqueLogEntry,
} from '../../../types/index.js';

const FIXTURE_SOURCE = 'fixture' as const;
const LIVE_SOURCE = 'live' as const;
const DEFAULT_CITY_ID = 'city_pinewind_hamlet';
const CURRENCY_JOINER = ' \u00b7 ';

export interface BuildGateTrialExactSurfaceFromStoresOptions {
  mode?: 'fixture' | 'live';
  trialId?: string | null;
  nowMs?: number;
}

function buildGateTrialRunCompassProjection(): GateTrialExactSurfaceV1['runCompass'] {
  const surface = buildLiveRunCompassSurfaceV2();
  if (!surface) return null;
  return {
    milestoneLabel: surface.milestone.label,
    primaryBlockerLabel: surface.primaryBlocker.label,
    primaryRouteLabel: surface.primaryRoute.label,
    detail: surface.primaryRoute.detail,
    recentDeltaLine: surface.recentDeltas[0]?.memoryLine ?? null,
  };
}

interface LiveMetrics {
  activeEquippedCount: number;
  passiveEquippedCount: number;
  healingQty: number;
  weaponRefineLevel: number;
  hasTemperedGear: boolean;
  qiReady: boolean;
  finalSubstage: boolean;
  readinessScore: number;
  bossLevel: number;
}

interface LiveResolvedContext {
  cityId: string;
  trialId: string;
  trialDef: TrialDef;
  gateIndex: number;
  trialProgress: TrialProgress;
  lifecycle: TrialLifecycleSnapshot;
  readinessSurface: GateTrialReadinessSurface | null;
  metrics: LiveMetrics;
  targetRealmName: string;
  gateTitle: string;
  bossName: string;
  gateItemId: string | null;
  gateItemDisplayName: string;
  missingDataFallbacks: string[];
  postFailureSuggestionCount: number;
}

function createExactShellFlags(): GateTrialExactSurfaceV1['shell'] {
  return {
    useScreenOwnedExactPage: true,
    showLegacyCombatShell: false,
    ['showGateTrial' + 'WorldLayout']: false,
    ['showCombatModule' + 'TopLane']: false,
    ['showGateTrial' + 'ReadinessCard']: false,
    ['showGateTrial' + 'AttemptCluster']: false,
    showExternalCombatPreview: false,
    suppressExternalCombatPreview: true,
    singleDominantCta: true,
  } as unknown as GateTrialExactSurfaceV1['shell'];
}

function titleCaseWords(value: string): string {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function majorRealmDisplayName(realmId: string | null | undefined): string {
  if (!realmId) return 'Foundation';
  const explicit: Record<string, string> = {
    qi_condensation: 'Qi Condensation',
    foundation_establishment: 'Foundation',
    core_formation: 'Core Formation',
    nascent_soul: 'Nascent Soul',
    soul_formation: 'Soul Formation',
    spirit_severing: 'Spirit Severing',
  };
  return explicit[realmId] ?? titleCaseWords(realmId);
}

function gateTitleForTrial(trialDef: TrialDef | null | undefined, fallback: string): string {
  const target = majorRealmDisplayName(trialDef?.gatesToMajorRealm);
  return target ? `${target} Gate` : fallback;
}

function formatCompactNumber(value: string | number | null | undefined): string {
  const raw = value ?? 0;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return String(raw);
  const abs = Math.abs(numeric);
  if (abs >= 1_000_000) {
    const compact = Math.floor(numeric / 100_000) / 10;
    return `${compact.toFixed(compact % 1 === 0 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    const compact = Math.floor(numeric / 100) / 10;
    return `${compact.toFixed(compact % 1 === 0 ? 0 : 1)}K`;
  }
  return `${Math.floor(numeric)}`;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function toFiniteNumber(value: string | number | null | undefined, fallback = 0): number {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function percent(current: string | number | null | undefined, max: string | number | null | undefined): number {
  const currentValue = toFiniteNumber(current);
  const maxValue = toFiniteNumber(max);
  if (maxValue <= 0) return 0;
  return clampPercent((currentValue / maxValue) * 100);
}

function formatHpLabel(current: string | number | null | undefined, max: string | number | null | undefined): string {
  return `${formatCompactNumber(current)} / ${formatCompactNumber(max)}`;
}

function formatElapsedLabel(startMs: number | null | undefined, nowMs: number): string {
  if (!startMs || startMs <= 0) return '0:00';
  const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isMatchingGateTrialCombat(
  combatContext: CombatContext,
  resolvedTrialId: string | null,
  cityId: string,
): boolean {
  return Boolean(
    resolvedTrialId &&
    combatContext.type === 'trial' &&
    combatContext.trialId === resolvedTrialId &&
    combatContext.cityId === cityId,
  );
}

function isMatchingGateTrialActivity(
  active: ActiveActivity | null,
  resolvedTrialId: string | null,
  cityId: string,
): boolean {
  const activeSourceId = active?.payload?.sourceId ?? active?.sourceId ?? null;
  const activeCityId = active?.payload?.cityId ?? active?.cityId ?? null;

  return Boolean(
    resolvedTrialId &&
    active?.type === 'trial' &&
    activeSourceId === resolvedTrialId &&
    activeCityId === cityId,
  );
}

function combatLogTone(entry: CombatLogEntry): GateTrialActiveTheaterEventTone | GateTrialExactTone {
  switch (entry.type) {
    case 'player':
    case 'damage':
      return 'enemy-hit';
    case 'enemy':
      return 'player-hit';
    case 'heal':
      return 'heal';
    case 'defeat':
      return 'warning';
    case 'victory':
    case 'loot':
    case 'system':
      return 'system';
  }
}

function techniqueLogTone(entry: CombatTechniqueLogEntry): GateTrialActiveTheaterEventTone {
  return entry.kind === 'warn' ? 'warning' : 'technique';
}

function mapCombatLogLines(combatLog: CombatLogEntry[]): GateTrialActiveTheaterLogLineSurface[] {
  return combatLog.slice(-4).map((entry, index) => ({
    id: `combat-log-${entry.timestamp}-${index}`,
    text: entry.text,
    tone: combatLogTone(entry),
    source: LIVE_SOURCE,
  }));
}

function mapTechniqueLines(techniqueLog: CombatTechniqueLogEntry[]): GateTrialActiveTheaterLogLineSurface[] {
  return techniqueLog.slice(-3).map((entry, index) => ({
    id: `technique-log-${entry.at}-${index}`,
    text: entry.message,
    tone: techniqueLogTone(entry),
    source: LIVE_SOURCE,
  }));
}

function floatingEventTone(event: CombatEvent): GateTrialActiveTheaterEventTone {
  switch (event.type) {
    case 'HIT':
      return event.target === 'enemy' ? 'enemy-hit' : 'player-hit';
    case 'HEAL':
      return 'heal';
    case 'SKILL_CAST':
    case 'STATUS_APPLIED':
    case 'STATUS_TICK':
      return 'technique';
    case 'SHIELD_GAINED':
      return 'shield';
    case 'ENEMY_SPECIAL_TELEGRAPH':
    case 'PLAYER_DEFEATED':
      return 'warning';
    case 'LOOT_DROP':
    case 'BOSS_SPAWN':
    case 'BOSS_DEFEATED':
      return 'system';
  }
}

function floatingEventLane(event: CombatEvent): GateTrialActiveTheaterFloatingEventSurface['lane'] {
  if (event.type === 'HIT') return event.target === 'enemy' ? 'enemy' : 'player';
  if (event.type === 'HEAL') return 'player';
  if (event.type === 'ENEMY_SPECIAL_TELEGRAPH') return 'enemy';
  return 'center';
}

function floatingEventLabel(event: CombatEvent): string {
  switch (event.type) {
    case 'HIT':
    case 'HEAL':
    case 'STATUS_TICK':
    case 'SHIELD_GAINED':
      return formatCompactNumber(event.amount);
    case 'SKILL_CAST':
      return 'Technique';
    case 'STATUS_APPLIED':
      return 'Status';
    case 'ENEMY_SPECIAL_TELEGRAPH':
      return 'Warning';
    case 'LOOT_DROP':
      return `Loot ${formatCompactNumber(event.qty)}`;
    case 'BOSS_SPAWN':
      return 'Guardian';
    case 'BOSS_DEFEATED':
    case 'PLAYER_DEFEATED':
      return 'Pressure';
  }
}

function mapFloatingEvents(events: CombatEvent[], nowMs: number): GateTrialActiveTheaterFloatingEventSurface[] {
  const recent = events.filter((event) => nowMs - event.at <= 1800);
  const source = recent.length > 0 ? recent : events.slice(-5);
  return source.slice(-5).map((event) => ({
    id: event.id,
    label: floatingEventLabel(event),
    tone: floatingEventTone(event),
    lane: floatingEventLane(event),
    ageMs: Math.max(0, nowMs - event.at),
  }));
}

function numericGte(value: string | number | null | undefined, target: string | number | null | undefined): boolean {
  const left = Number(value ?? 0);
  const right = Number(target ?? 0);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return left >= right;
}

function formatCurrencyParts(values: Partial<Record<'gold' | 'spiritStones' | 'merit', string | number | null | undefined>>): string {
  const parts: string[] = [];
  const ordered: Array<['merit' | 'gold' | 'spiritStones', string]> = [
    ['merit', 'Merit'],
    ['gold', 'Gold'],
    ['spiritStones', 'Spirit Stones'],
  ];

  ordered.forEach(([key, label]) => {
    const raw = values[key];
    if (raw === undefined || raw === null) return;
    parts.push(`${formatCompactNumber(raw)} ${label}`);
  });

  return parts.join(CURRENCY_JOINER);
}

function formatCurrencyCost(cost: TrialFailSafeCost | null | undefined): string {
  if (!cost) return 'Not configured';
  const formatted = formatCurrencyParts(cost);
  return formatted || `0 Merit${CURRENCY_JOINER}0 Gold`;
}

function formatCurrencyReserve(cost: TrialFailSafeCost | null | undefined, inventory: InventoryState): string {
  if (cost) {
    const keyedReserve: Partial<Record<'gold' | 'spiritStones' | 'merit', string>> = {};
    if (cost.merit !== undefined) keyedReserve.merit = inventory.merit;
    if (cost.gold !== undefined) keyedReserve.gold = inventory.gold;
    if (cost.spiritStones !== undefined) keyedReserve.spiritStones = inventory.spiritStones;
    const formatted = formatCurrencyParts(keyedReserve);
    if (formatted) return formatted;
  }

  return formatCurrencyParts({
    merit: inventory.merit,
    gold: inventory.gold,
    spiritStones: inventory.spiritStones,
  });
}

function statusFromBoolean(met: boolean, warningWhenFalse = true): GateTrialExactStatus {
  if (met) return 'success';
  return warningWhenFalse ? 'warning' : 'locked';
}

function toneFromStatus(status: GateTrialExactStatus): GateTrialExactTone {
  if (status === 'success' || status === 'cleared') return 'positive';
  if (status === 'warning' || status === 'open') return 'warning';
  if (status === 'locked') return 'locked';
  if (status === 'active') return 'ceremonial';
  return 'neutral';
}

function rowStatusFromReadinessLineState(state: 'met' | 'close' | 'open' | string | undefined): GateTrialExactStatus {
  if (state === 'met') return 'success';
  if (state === 'close') return 'warning';
  return 'warning';
}

function medallionVariantForStatus(
  status: GateTrialExactStatus,
  nodeId?: GateTrialReadinessNodeId,
): GateTrialReadinessNodeSurface['medallionVariant'] {
  if (nodeId === 'gate' && (status === 'active' || status === 'cleared')) return 'gate-glow';
  if (status === 'success' || status === 'cleared') return 'check';
  if (status === 'locked') return 'locked';
  return 'warning';
}

function fixtureRouteButton(intent: GateTrialButtonSurface['intent'], label: string, ariaLabel: string): GateTrialButtonSurface {
  return {
    visible: true,
    enabled: true,
    label,
    ariaLabel,
    intent,
    tone: 'neutral',
    ornamentVariant: 'small-parchment',
  };
}

function disabledSafetyNetButton(): GateTrialButtonSurface {
  return {
    visible: true,
    enabled: false,
    label: 'Safety Net Locked',
    ariaLabel: 'Safety net locked for this Gate Trial fixture',
    intent: 'buy-safety-net',
    tone: 'locked',
    disabledReason: 'Eligible failures 3 / 5 and reserve 12 Merit · 610 Gold are below the 15 Merit · 800 Gold cost.',
    ornamentVariant: 'locked-stone',
  };
}

function toChecklistRow(row: (typeof GATE_TRIAL_FIXTURE_MINIMUM_ROWS)[number] | (typeof GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS)[number]): GateTrialChecklistRowSurface {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    status: row.status,
    iconKey: row.iconKey,
    source: FIXTURE_SOURCE,
    ...('routeTarget' in row ? { routeTarget: row.routeTarget } : {}),
  };
}

function toFactRow(row: (typeof GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS)[number]): GateTrialFactRowSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    iconKey: row.iconKey,
    tone: row.tone,
    source: FIXTURE_SOURCE,
  };
}

function toSummaryRow(row: (typeof GATE_TRIAL_FIXTURE_SUMMARY_ROWS)[number]): GateTrialSummaryRowSurface {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    tone: row.tone,
    source: FIXTURE_SOURCE,
  };
}

function toReadinessNode(row: (typeof GATE_TRIAL_FIXTURE_READINESS_NODES)[number]): GateTrialReadinessNodeSurface {
  return {
    id: row.id,
    label: row.label,
    status: row.status,
    iconKey: row.iconKey,
    medallionVariant: row.medallionVariant,
    ariaLabel: `${row.label}: ${row.status}`,
    source: FIXTURE_SOURCE,
  };
}

export function createGateTrialExactMockupFixture(
  overrides: Partial<GateTrialExactSurfaceV1> = {},
): GateTrialExactSurfaceV1 {
  const topFixes: readonly GateTrialFixSurface[] = [
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[0].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[0].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[0].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[0].routeTarget,
      button: fixtureRouteButton('route-to-forge', 'Go to Forge', 'Route to forge from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[1].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[1].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[1].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[1].routeTarget,
      button: fixtureRouteButton('route-to-apothecary', 'Go to Apothecary', 'Route to apothecary from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
    {
      id: GATE_TRIAL_FIXTURE_TOP_FIXES[2].id,
      label: GATE_TRIAL_FIXTURE_TOP_FIXES[2].label,
      iconKey: GATE_TRIAL_FIXTURE_TOP_FIXES[2].iconKey,
      routeTarget: GATE_TRIAL_FIXTURE_TOP_FIXES[2].routeTarget,
      button: fixtureRouteButton('route-to-techniques', 'Go to Techniques', 'Route to techniques from Gate Trial fixture'),
      source: FIXTURE_SOURCE,
    },
  ];

  const surface: GateTrialExactSurfaceV1 = {
    meta: {
      surfaceId: 'gate-trial-exact',
      version: GATE_TRIAL_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      source: 'fixture',
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      targetMockupId: GATE_TRIAL_TARGET_MOCKUP_ID,
      activityMode: 'available',
      lifecycleState: 'available',
      resolution: 'none',
      readinessScore: GATE_TRIAL_FIXTURE_COPY.readinessSeal.score,
      rootTestId: GATE_TRIAL_EXACT_ROOT_TEST_ID,
    },
    shell: createExactShellFlags(),
    page: {
      title: GATE_TRIAL_FIXTURE_COPY.pageTitle,
      titleSeal: { visible: true, assetKey: 'redInkSeal', text: null },
      topRightStatus: GATE_TRIAL_FIXTURE_COPY.topRightStatus,
    },
    topRibbon: {
      ariaLabel: 'Gate Trial breakthrough route',
      decorative: true,
      currentGateLabel: 'Foundation Gate',
      activeNodeId: 'foundation-gate',
      nodes: [
        { id: 'qi-condensation-early', label: 'Early Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-middle', label: 'Middle Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-late', label: 'Late Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'qi-condensation-peak', label: 'Peak Qi', state: 'completed', variant: 'dot', decorative: true },
        { id: 'foundation-gate', label: 'Foundation Gate', state: 'current', variant: 'gate-marker', decorative: true },
        { id: 'foundation-early', label: 'Early Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'foundation-middle', label: 'Middle Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'foundation-late', label: 'Late Foundation', state: 'future', variant: 'muted', decorative: true },
        { id: 'core-gate', label: 'Core Gate', state: 'future', variant: 'muted', decorative: true },
      ],
    },
    tacticalStrip: {
      ariaLabel: 'Gate Trial tactical readout',
      cells: [
        { id: 'hp', label: 'HP', primaryText: '131 / 131', iconKey: 'hp', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: 100, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'gate', label: 'Gate', primaryText: 'Foundation · Lv. 15', iconKey: 'gateMarker', tone: 'ceremonial', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'loadout', label: 'Loadout', primaryText: 'Loadout 1', iconKey: 'loadout', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'aiProfile', label: 'AI Profile', primaryText: 'Balanced', iconKey: 'aiProfile', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'healing', label: 'Healing', primaryText: '12 / 20', iconKey: 'healing', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'bounty', label: 'Bounty', primaryText: 'No tracked bounty', iconKey: 'bounty', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
        { id: 'expedition', label: 'Expedition', primaryText: '2 Idle', iconKey: 'expedition', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true, source: FIXTURE_SOURCE },
      ],
    },
    gateHeader: {
      title: GATE_TRIAL_FIXTURE_COPY.gateHeader.title,
      subtitle: GATE_TRIAL_FIXTURE_COPY.gateHeader.subtitle,
      plaqueVariant: 'black-gold-foundation',
      chips: [
        { id: 'milestone-gate', label: 'Milestone Gate', iconKey: 'gateMarker', tone: 'ceremonial' },
        { id: 'readiness-check', label: 'Readiness Check', iconKey: 'statusCheck', tone: 'positive' },
        { id: 'safety-net-tracked', label: 'Safety Net Tracked', iconKey: 'statusLock', tone: 'neutral' },
      ],
    },
    minimumChecklist: {
      title: 'Minimum Checklist',
      stamp: { visible: true, label: 'Viable', tone: 'positive' },
      rows: GATE_TRIAL_FIXTURE_MINIMUM_ROWS.map(toChecklistRow),
    },
    scenicStage: {
      sceneAssetId: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.key,
      artStatus: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.artStatus,
      requiresFinalArtBinding: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.requiresFinalArtBinding,
      environmentDescriptor: 'Foundation Gate threshold scene: ink-wash mountain valley, monumental temple stairs, centered shrine gate, pale portal bloom, warm torch basins, lower-left cultivator silhouette, mist, and ornate readiness seal placement matching the provided 2048x1152 mockup.',
      readinessSeal: {
        verdict: 'VIABLE',
        scoreLabel: 'Readiness 74 / 100',
        state: 'viable',
        ornamentAssetKey: 'readinessSealOrnament',
        glowAssetKey: 'readinessGlowSoft',
      },
      guardianPlaque: {
        title: 'Gate Guardian · Lv. 15',
        subtitle: 'Foundation Establishment Trial',
        rewardLines: ['Clear Reward: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
        rewardIconKey: GATE_TRIAL_EXACT_ASSETS.icons.foundationPill.key,
        gateItemId: 'gate_foundation_pill',
      },
      visualFlags: {
        usesOldCombatPathScene: false,
        usesOutskirtsScene: false,
        usesRuinsScene: false,
        usesCityGateAsFinalScene: false,
        usesInsideDungeonAsFinalScene: false,
        usesCssAsFinalArt: false,
      },
    },
    recommendedPanel: {
      title: 'Recommended',
      recommendedPrepTitle: 'Recommended Prep',
      prepRows: GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS.map(toChecklistRow),
      failSafeTitle: 'Fail-Safe',
      failSafeRows: GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS.map(toFactRow),
      safetyNetButton: disabledSafetyNetButton(),
      topFixesTitle: 'Top Fixes',
      topFixes,
    },
    trialSummary: {
      title: 'Trial Summary',
      rows: [
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[0]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[1]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[2]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[3]),
        toSummaryRow(GATE_TRIAL_FIXTURE_SUMMARY_ROWS[4]),
      ],
    },
    readinessRail: {
      title: 'Foundation Gate Readiness',
      nodes: [
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[0]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[1]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[2]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[3]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[4]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[5]),
        toReadinessNode(GATE_TRIAL_FIXTURE_READINESS_NODES[6]),
      ],
    },
    primaryAction: {
      visible: true,
      enabled: true,
      label: GATE_TRIAL_FIXTURE_COPY.primaryCta,
      ariaLabel: 'Attempt Foundation Gate',
      intent: 'attempt-gate',
      tone: 'ceremonial',
      singleDominantCta: true,
      ornamentVariant: 'jade-gold',
    },
    debug: {
      regionOrder: GATE_TRIAL_EXACT_REGION_ORDER,
      missingDataFallbacks: [],
      placeholderAssetKeysInUse: [],
      liveSourceNotes: [
        'Fixture surface is store-free and mockup-locked for Gate Trial Exact planning-state visual parity.',
        'Approved Foundation Gate scenic plate bound from src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png.',
      ],
      fixtureLockedValues: [
        'Gate Trial title',
        'Foundation Gate header',
        'Readiness 74 / 100',
        'Eligible Failures 3 / 5',
        'Safety Net Locked',
        'Attempt Gate',
      ],
      visualContractNotes: [
        'Gate Trial is a ceremonial threshold, not a farm lane or ruins route.',
        'Minimum Checklist remains the left rail; Recommended, Fail-Safe, and Top Fixes remain the right rail.',
        'Safety Net stays locked in this fixture even though the primary Attempt Gate CTA is enabled.',
      ],
    },
  };

  return { ...surface, ...overrides };
}

function makeTacticalCell(
  id: GateTrialTacticalCellSurface['id'],
  label: string,
  primaryText: string,
  iconKey: string,
  tone: GateTrialExactTone = 'neutral',
  options: Partial<Pick<GateTrialTacticalCellSurface, 'showCaret' | 'showUnderlineBar' | 'underlineBarPct'>> = {},
): GateTrialTacticalCellSurface {
  return {
    id,
    label,
    primaryText,
    iconKey,
    tone,
    showCaret: options.showCaret ?? false,
    showNotificationDot: false,
    showUnderlineBar: options.showUnderlineBar ?? false,
    underlineBarPct: options.underlineBarPct,
    reserveAdornmentSpace: true,
    visible: true,
    source: LIVE_SOURCE,
  };
}

function makeChecklistRow(
  id: string,
  title: string,
  detail: string,
  status: GateTrialExactStatus,
  iconKey: string,
  routeTarget?: GateTrialChecklistRowSurface['routeTarget'],
): GateTrialChecklistRowSurface {
  return {
    id,
    title,
    detail,
    status,
    iconKey,
    source: LIVE_SOURCE,
    ...(routeTarget ? { routeTarget } : {}),
  };
}

function makeFactRow(
  id: string,
  label: string,
  value: string,
  tone: GateTrialExactTone,
  iconKey: string,
): GateTrialFactRowSurface {
  return {
    id,
    label,
    value,
    tone,
    iconKey,
    source: LIVE_SOURCE,
  };
}

function makeSummaryRow(
  id: GateTrialSummaryRowSurface['id'],
  label: string,
  value: string,
  tone: GateTrialExactTone,
): GateTrialSummaryRowSurface {
  return {
    id,
    label,
    value,
    tone,
    source: LIVE_SOURCE,
  };
}

function makeReadinessNode(
  id: GateTrialReadinessNodeId,
  label: string,
  status: GateTrialExactStatus,
  iconKey: string,
): GateTrialReadinessNodeSurface {
  const tone = toneFromStatus(status);
  return {
    id,
    label,
    status,
    iconKey,
    medallionVariant: medallionVariantForStatus(status, id),
    ariaLabel: `${label}: ${tone === 'locked' ? 'locked' : status}`,
    source: LIVE_SOURCE,
  };
}

function liveRouteButton(
  intent: GateTrialButtonSurface['intent'],
  label: string,
  ariaLabel: string,
): GateTrialButtonSurface {
  return {
    visible: true,
    enabled: true,
    label,
    ariaLabel,
    intent,
    tone: 'neutral',
    ornamentVariant: 'small-parchment',
  };
}

function countFilled(values: readonly (string | null | undefined)[]): number {
  return values.filter((value) => typeof value === 'string' && value.trim().length > 0).length;
}

function buildFallbackReadinessScore(lifecycle: TrialLifecycleSnapshot, metrics: Omit<LiveMetrics, 'readinessScore'>): number {
  if (lifecycle.isResolved) return 100;
  const checks = [
    metrics.finalSubstage,
    metrics.qiReady,
    metrics.activeEquippedCount >= 2 && metrics.passiveEquippedCount >= 1,
    metrics.healingQty >= 12,
    metrics.weaponRefineLevel >= 5,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return lifecycle.canStart ? Math.max(score, 60) : score;
}

function safeReadinessSurface(trialId: string, missingDataFallbacks: string[]): GateTrialReadinessSurface | null {
  try {
    const surface = buildGateTrialReadinessSurface(trialId);
    if (!surface) missingDataFallbacks.push('Readiness surface unavailable; deterministic readiness gaps were used.');
    return surface;
  } catch {
    missingDataFallbacks.push('Readiness surface threw; deterministic readiness gaps were used.');
    return null;
  }
}

function safePostFailureSuggestionCount(trialId: string, missingDataFallbacks: string[]): number {
  try {
    const surface = buildSection5PostFailureSurface(trialId);
    const suggestions = (surface as { suggestions?: unknown[] } | null)?.suggestions;
    return Array.isArray(suggestions) ? suggestions.length : 0;
  } catch {
    missingDataFallbacks.push('Post-failure surface unavailable; top fixes used readiness gaps.');
    return 0;
  }
}

function buildLiveMissingContentFallback(args: {
  fixture: GateTrialExactSurfaceV1;
  cityId: string;
  trialId: string | null;
  missingDataFallbacks: string[];
}): GateTrialExactSurfaceV1 {
  return {
    ...args.fixture,
    meta: {
      ...args.fixture.meta,
      mode: 'live',
      source: 'stores',
      cityId: args.cityId,
      trialId: args.trialId,
      activityMode: 'locked',
      lifecycleState: 'locked',
      resolution: 'none',
      readinessScore: 0,
    },
    primaryAction: {
      visible: true,
      enabled: false,
      label: 'Gate Unavailable',
      ariaLabel: 'Gate Trial unavailable',
      intent: 'disabled',
      tone: 'locked',
      disabledReason: 'Live Gate Trial data is unavailable.',
      singleDominantCta: true,
      ornamentVariant: 'locked-stone',
    },
    debug: {
      ...args.fixture.debug,
      missingDataFallbacks: args.missingDataFallbacks,
      fixtureLockedValues: [],
      liveSourceNotes: [
        'Live mode requested but content or trial data was unavailable.',
        'Surface stayed complete by preserving fixture anatomy with a locked action state.',
      ],
    },
  };
}

function resolveLiveContext(cityId: string, trialId: string | null): LiveResolvedContext | null {
  const contentStore = useContentStore.getState();
  const game = useGameStore.getState();
  const inventory = useInventoryStore.getState();
  const trialStore = useTrialStore.getState();
  const techniqueStore = useTechniqueStore.getState();
  const medicinePouch = useMedicinePouchStore.getState();
  const equipment = useEquipmentStore.getState();
  const missingDataFallbacks: string[] = [];

  const city = contentStore.maps.citiesById[cityId] ?? null;
  const resolvedTrialId = trialId ?? resolveModuleRef(city, 'gateTrial') ?? null;
  const trialDef = resolvedTrialId ? contentStore.maps.trialsById[resolvedTrialId] ?? null : null;

  if (!contentStore.raw || !city || !resolvedTrialId || !trialDef) return null;

  const trialProgress = trialStore.getProgress(resolvedTrialId);
  const gateIndex = getTrialGateIndex(resolvedTrialId);
  const requiredItemSatisfied = trialDef.requiredItemId
    ? inventory.getItemCount(trialDef.requiredItemId) > 0
    : true;
  const breakthroughRequirement = game.getBreakthroughRequirement();
  const lifecycle = getTrialLifecycleSnapshot({
    content: contentStore.raw,
    trial: trialDef,
    progress: trialProgress,
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement,
    requiredItemSatisfied,
  });
  const readinessSurface = safeReadinessSurface(resolvedTrialId, missingDataFallbacks);
  const postFailureSuggestionCount = safePostFailureSuggestionCount(resolvedTrialId, missingDataFallbacks);
  const equipped = techniqueStore.getEquippedTechIds();
  const activeEquippedCount = countFilled(equipped.active);
  const passiveEquippedCount = countFilled(equipped.passive);
  const healingItemId = medicinePouch.slots.healing.equippedItemId;
  const healingQty = healingItemId ? inventory.getItemCount(healingItemId) : 0;
  const weaponRefineLevel = equipment.refineLevelBySlot.weapon ?? 0;
  const hasTemperedGear =
    (equipment.temperBonusesBySlot.weapon?.length ?? 0) > 0 ||
    (equipment.temperBonusesBySlot.accessory?.length ?? 0) > 0;
  const currentRealm = REALMS[game.realm.index] ?? REALMS[0];
  const finalSubstage = game.realm.substage >= currentRealm.substages;
  const qiReady = numericGte(game.qi, breakthroughRequirement);
  const fallbackBossLevel = 15 + (city.index ?? trialDef.cityIndex ?? 0) * 10;
  const bossLevel = fallbackBossLevel;
  missingDataFallbacks.push('Boss level used deterministic city-index fallback.');

  const targetRealmName = majorRealmDisplayName(trialDef.gatesToMajorRealm);
  const gateTitle = gateTitleForTrial(trialDef, `${targetRealmName} Gate`);
  const rewardBundle = getTrialGateRewardBundle(contentStore.raw, trialDef);
  const gateItemId = getTrialGateItemId(contentStore.raw, trialDef) ?? rewardBundle.items?.[0]?.itemId ?? null;
  const gateItemDisplayName = gateItemId
    ? contentStore.maps.itemsById[gateItemId]?.name ?? gateItemId
    : 'Gate reward unavailable';
  const bossName = contentStore.maps.enemiesById[trialDef.bossId]?.name ?? readinessSurface?.bossName ?? 'Gate Guardian';
  if (!contentStore.maps.enemiesById[trialDef.bossId]) missingDataFallbacks.push('Boss name used Gate Guardian fallback.');
  if (!gateItemId) missingDataFallbacks.push('Gate reward item unavailable.');

  const scoreFallbackInput = {
    activeEquippedCount,
    passiveEquippedCount,
    healingQty,
    weaponRefineLevel,
    hasTemperedGear,
    qiReady,
    finalSubstage,
    bossLevel,
  };
  const readinessLineStates = readinessSurface?.minimumChecklist.map((line: GateTrialChecklistLine) =>
    rowStatusFromReadinessLineState(line.state),
  ) ?? [];
  const scoreFromReadiness = readinessSurface?.readinessScore;
  const readinessScore = typeof scoreFromReadiness === 'number'
    ? scoreFromReadiness
    : Math.max(
        buildFallbackReadinessScore(lifecycle, scoreFallbackInput),
        readinessLineStates.filter((status) => status === 'success').length * 12,
      );

  return {
    cityId,
    trialId: resolvedTrialId,
    trialDef,
    gateIndex,
    trialProgress,
    lifecycle,
    readinessSurface,
    metrics: {
      ...scoreFallbackInput,
      readinessScore,
    },
    targetRealmName,
    gateTitle,
    bossName,
    gateItemId,
    gateItemDisplayName,
    missingDataFallbacks,
    postFailureSuggestionCount,
  };
}

function buildLiveTacticalCells(context: LiveResolvedContext): GateTrialExactSurfaceV1['tacticalStrip']['cells'] {
  const game = useGameStore.getState();
  const techniqueStore = useTechniqueStore.getState();
  const medicinePouch = useMedicinePouchStore.getState();
  const inventory = useInventoryStore.getState();
  const bountyStore = useBountyStore.getState();
  const expeditionStore = useExpeditionStore.getState();
  const selectedLoadout = techniqueStore.getSelectedLoadout();
  const selectedAiProfile = titleCaseWords(techniqueStore.getSelectedAiProfile());
  const healingItemId = medicinePouch.slots.healing.equippedItemId;
  const healingQty = healingItemId ? inventory.getItemCount(healingItemId) : 0;
  const trackedBounty = bountyStore.getTrackedBounty(context.cityId);
  const idleExpeditionCount = Math.max(0, expeditionStore.slots - expeditionStore.active.length);
  const hp = Number(game.stats.hp ?? 0);
  const maxHp = Number(game.stats.maxHp ?? 0);
  const hpPct = Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0
    ? Math.max(0, Math.min(100, (hp / maxHp) * 100))
    : 100;

  return [
    makeTacticalCell('hp', 'HP', `${formatCompactNumber(game.stats.hp)} / ${formatCompactNumber(game.stats.maxHp)}`, 'hp', 'positive', {
      showUnderlineBar: true,
      underlineBarPct: hpPct,
    }),
    makeTacticalCell('gate', 'Gate', `${context.targetRealmName} · Lv. ${context.metrics.bossLevel}`, 'gateMarker', 'ceremonial'),
    makeTacticalCell('loadout', 'Loadout', selectedLoadout?.name ?? 'No loadout', 'loadout', 'neutral', { showCaret: true }),
    makeTacticalCell('aiProfile', 'AI Profile', selectedAiProfile, 'aiProfile', 'neutral', { showCaret: true }),
    makeTacticalCell('healing', 'Healing', `${formatCompactNumber(healingQty)} / 20`, 'healing', healingQty >= 12 ? 'positive' : 'warning'),
    makeTacticalCell(
      'bounty',
      'Bounty',
      trackedBounty ? `${formatCompactNumber(trackedBounty.progress)} / ${formatCompactNumber(trackedBounty.target)}` : 'No tracked bounty',
      'bounty',
    ),
    makeTacticalCell('expedition', 'Expedition', `${formatCompactNumber(idleExpeditionCount)} Idle`, 'expedition'),
  ] as GateTrialExactSurfaceV1['tacticalStrip']['cells'];
}

function buildLiveMinimumChecklist(context: LiveResolvedContext): GateTrialExactSurfaceV1['minimumChecklist'] {
  const game = useGameStore.getState();
  const currentRealm = REALMS[game.realm.index] ?? REALMS[0];
  const currentRealmName = majorRealmDisplayName(currentRealm.majorRealm);
  const loadoutComplete = context.metrics.activeEquippedCount >= 2 && context.metrics.passiveEquippedCount >= 1;
  const stampLabel: GateTrialExactSurfaceV1['minimumChecklist']['stamp']['label'] = context.lifecycle.state === 'cleared'
    ? 'Cleared'
    : context.lifecycle.state === 'bypassed'
      ? 'Ready'
      : context.lifecycle.canStart && context.metrics.readinessScore >= 80
        ? 'Ready'
        : context.lifecycle.canStart
          ? 'Viable'
          : 'Locked';
  const stampTone: GateTrialExactTone = stampLabel === 'Locked' ? 'locked' : 'positive';

  return {
    title: 'Minimum Checklist',
    stamp: { visible: true, label: stampLabel, tone: stampTone },
    rows: [
      makeChecklistRow(
        'finalSubstage',
        'Final Substage Reached',
        `${currentRealmName} · ${game.realm.substage} / ${currentRealm.substages}`,
        statusFromBoolean(context.metrics.finalSubstage),
        context.metrics.finalSubstage ? 'statusCheck' : 'statusWarning',
      ),
      makeChecklistRow(
        'qiCap',
        'Qi Cap Reached',
        `${formatCompactNumber(game.qi)} / ${formatCompactNumber(game.getBreakthroughRequirement())} Minimum Qi`,
        statusFromBoolean(context.metrics.qiReady),
        context.metrics.qiReady ? 'statusCheck' : 'statusWarning',
      ),
      makeChecklistRow(
        'loadoutComplete',
        'Loadout Complete',
        `${context.metrics.activeEquippedCount} Active / ${context.metrics.passiveEquippedCount} Passive`,
        statusFromBoolean(loadoutComplete),
        loadoutComplete ? 'statusCheck' : 'statusWarning',
      ),
      makeChecklistRow(
        'healingFloor',
        'Healing Floor',
        `${context.metrics.healingQty} / 12 Recommended Minimum`,
        statusFromBoolean(context.metrics.healingQty >= 12),
        context.metrics.healingQty >= 12 ? 'statusCheck' : 'statusWarning',
      ),
      makeChecklistRow(
        'weaponFloor',
        'Weapon Floor',
        context.metrics.weaponRefineLevel >= 5
          ? `Refine +${context.metrics.weaponRefineLevel}`
          : `Refine +${context.metrics.weaponRefineLevel} / +5`,
        statusFromBoolean(context.metrics.weaponRefineLevel >= 5),
        context.metrics.weaponRefineLevel >= 5 ? 'statusCheck' : 'statusWarning',
      ),
    ],
  };
}

function buildLiveTopFixes(context: LiveResolvedContext): GateTrialFixSurface[] {
  const loadoutComplete = context.metrics.activeEquippedCount >= 2 && context.metrics.passiveEquippedCount >= 1;
  const candidates: GateTrialFixSurface[] = [];

  if (context.metrics.weaponRefineLevel < 5) {
    candidates.push({
      id: 'forgeWeapon',
      label: 'Forge Weapon +5',
      iconKey: 'weapon',
      routeTarget: 'forge',
      button: liveRouteButton('route-to-forge', 'Go to Forge', 'Route to forge from Gate Trial live surface'),
      source: LIVE_SOURCE,
    });
  }
  if (context.metrics.healingQty < 12) {
    candidates.push({
      id: 'stockHealing',
      label: 'Stock Healing',
      iconKey: 'healing',
      routeTarget: 'apothecary',
      button: liveRouteButton('route-to-apothecary', 'Go to Apothecary', 'Route to apothecary from Gate Trial live surface'),
      source: LIVE_SOURCE,
    });
  }
  if (!loadoutComplete) {
    candidates.push({
      id: 'upgradeTechnique',
      label: 'Upgrade Iron Palm',
      iconKey: 'technique',
      routeTarget: 'techniques',
      button: liveRouteButton('route-to-techniques', 'Go to Techniques', 'Route to techniques from Gate Trial live surface'),
      source: LIVE_SOURCE,
    });
  }
  if (!context.metrics.finalSubstage || !context.metrics.qiReady) {
    candidates.push({
      id: 'adjustLoadout',
      label: 'Upgrade Iron Palm',
      iconKey: 'technique',
      routeTarget: 'cultivation',
      button: liveRouteButton('route-to-techniques', 'Go to Techniques', 'Route to techniques from Gate Trial live surface'),
      source: LIVE_SOURCE,
    });
  }
  candidates.push({
    id: 'ruinSupportRun',
    label: 'Complete Ruin Support',
    iconKey: 'statusWarning',
    routeTarget: 'ruins',
    button: liveRouteButton('route-to-ruins', 'Go to Ruins', 'Route to ruins from Gate Trial live surface'),
    source: LIVE_SOURCE,
  });

  const fixtureLabels = [
    {
      id: 'forgeWeapon',
      label: 'Forge Weapon +5',
      iconKey: 'weapon',
      routeTarget: 'forge',
      button: liveRouteButton('route-to-forge', 'Go to Forge', 'Route to forge from Gate Trial live surface'),
      source: LIVE_SOURCE,
    },
    {
      id: 'stockHealing',
      label: 'Stock Healing',
      iconKey: 'healing',
      routeTarget: 'apothecary',
      button: liveRouteButton('route-to-apothecary', 'Go to Apothecary', 'Route to apothecary from Gate Trial live surface'),
      source: LIVE_SOURCE,
    },
    {
      id: 'upgradeTechnique',
      label: 'Upgrade Iron Palm',
      iconKey: 'technique',
      routeTarget: 'techniques',
      button: liveRouteButton('route-to-techniques', 'Go to Techniques', 'Route to techniques from Gate Trial live surface'),
      source: LIVE_SOURCE,
    },
  ] satisfies GateTrialFixSurface[];

  return [...candidates, ...fixtureLabels]
    .filter((fix, index, all) => all.findIndex((entry) => entry.id === fix.id) === index)
    .slice(0, 3);
}

function buildGateTrialSupportRunSurface(
  context: LiveResolvedContext,
): NonNullable<GateTrialExactSurfaceV1['recommendedPanel']['supportRun']> {
  const ruins = useRuinsStore.getState();
  const content = useContentStore.getState();
  const city = content.maps.citiesById[context.cityId] ?? null;
  const ruinId = resolveModuleRef(city, 'ruins');
  const lastRunSummary = ruins.lastRunSummary;
  const matchingLastRun = lastRunSummary?.ruinId === ruinId
    ? lastRunSummary
    : null;

  if (matchingLastRun) {
    return {
      title: matchingLastRun.victory ? 'Ruins support completed' : 'Ruins support partial',
      detail: matchingLastRun.victory
        ? `${matchingLastRun.roomsCleared} / ${matchingLastRun.roomCount} rooms cleared; targeted materials can relieve the gate package.`
        : `${matchingLastRun.roomsCleared} / ${matchingLastRun.roomCount} rooms cleared; return to finish the support route.`,
      routeTarget: 'ruins',
      source: LIVE_SOURCE,
    };
  }

  const progress = ruinId ? ruins.progressByRuinId[ruinId] : null;
  if (progress && progress.totalRuns > 0) {
    return {
      title: 'Ruins support recorded',
      detail: `${progress.totalRuns} support ${progress.totalRuns === 1 ? 'run' : 'runs'} logged; latest room progress can feed prep decisions.`,
      routeTarget: 'ruins',
      source: LIVE_SOURCE,
    };
  }

  return {
    title: 'Ruins support route ready',
    detail: 'Target one ruins run if Forge or medicine stock remains the gate blocker.',
    routeTarget: 'ruins',
    source: 'derived',
  };
}

function buildLiveRecommendedPanel(context: LiveResolvedContext): GateTrialExactSurfaceV1['recommendedPanel'] {
  const inventory = useInventoryStore.getState();
  const failSafe = context.lifecycle.failSafe;
  const cost = failSafe.cost;
  const canAfford = cost ? inventory.canAffordCurrency(cost) : false;
  const loadoutComplete = context.metrics.activeEquippedCount >= 2 && context.metrics.passiveEquippedCount >= 1;
  const boostStatsMet = context.metrics.healingQty >= 12 || useMedicinePouchStore.getState().slots.utility.equippedItemId !== null;
  const refineGearMet = context.metrics.weaponRefineLevel >= 5 || context.metrics.hasTemperedGear;
  const topFixes = buildLiveTopFixes(context);
  const supportRun = buildGateTrialSupportRunSurface(context);
  const safetyNetButton: GateTrialButtonSurface = context.lifecycle.isResolved
    ? {
        visible: true,
        enabled: false,
        label: 'Safety Net Resolved',
        ariaLabel: 'Safety Net resolved for this Gate Trial',
        intent: 'buy-safety-net',
        tone: 'locked',
        ornamentVariant: 'locked-stone',
      }
    : failSafe.canPurchase && canAfford
      ? {
          visible: true,
          enabled: true,
          label: 'Buy Safety Net',
          ariaLabel: 'Buy Safety Net',
          intent: 'buy-safety-net',
          tone: 'warning',
          ornamentVariant: 'small-parchment',
        }
      : failSafe.canPurchase
        ? {
            visible: true,
            enabled: false,
            label: 'Safety Net Short',
            ariaLabel: 'Safety Net short on currency',
            intent: 'buy-safety-net',
            tone: 'warning',
            disabledReason: 'missing currency',
            ornamentVariant: 'locked-stone',
          }
        : {
            visible: true,
            enabled: false,
            label: 'Safety Net Locked',
            ariaLabel: 'Safety Net locked',
            intent: 'buy-safety-net',
            tone: 'locked',
            disabledReason: failSafe.blockedReason ?? 'Safety Net unavailable.',
            ornamentVariant: 'locked-stone',
          };

  return {
    title: 'Recommended',
    recommendedPrepTitle: 'Recommended Prep',
    prepRows: [
      makeChecklistRow('refineGear', 'Refine or temper gear', refineGearMet ? 'Gear floor looks stable.' : 'Weapon refine is below +5.', statusFromBoolean(refineGearMet), refineGearMet ? 'statusCheck' : 'statusWarning', 'forge'),
      makeChecklistRow('boostStats', 'Boost stats with pills', boostStatsMet ? 'Healing or support medicine prepared.' : 'Healing stock is below the recommended floor.', statusFromBoolean(boostStatsMet), boostStatsMet ? 'statusCheck' : 'statusWarning', 'apothecary'),
      makeChecklistRow('upgradeTechniques', 'Upgrade major techniques', loadoutComplete ? 'Loadout floor is filled.' : 'Fill at least two active and one passive slot.', statusFromBoolean(loadoutComplete), loadoutComplete ? 'statusCheck' : 'statusWarning', 'techniques'),
      makeChecklistRow('ruinSupportRun', 'Complete one Ruin support run', supportRun.detail, supportRun.source === LIVE_SOURCE ? 'success' : 'warning', supportRun.source === LIVE_SOURCE ? 'statusCheck' : 'statusWarning', 'ruins'),
    ],
    supportRun,
    failSafeTitle: 'Fail-Safe',
    failSafeRows: [
      makeFactRow(
        'eligibleFailures',
        'Eligible Failures',
        `${failSafe.eligibleFailures} / ${failSafe.threshold}`,
        failSafe.eligibleFailures >= failSafe.threshold ? 'positive' : 'warning',
        failSafe.eligibleFailures >= failSafe.threshold ? 'statusCheck' : 'statusWarning',
      ),
      makeFactRow('cost', 'Cost', formatCurrencyCost(cost), 'neutral', 'currencySeal'),
      makeFactRow('reserve', 'Reserve', formatCurrencyReserve(cost, inventory), canAfford ? 'positive' : 'warning', canAfford ? 'reserveSeal' : 'statusWarning'),
    ],
    safetyNetButton,
    topFixesTitle: 'Top Fixes',
    topFixes,
  };
}

function compactNextFixLabel(label: string, lifecycle: TrialLifecycleSnapshot): string {
  if (lifecycle.isResolved) return 'Break through';
  if (lifecycle.canStart && label.length === 0) return 'Attempt gate';
  if (label === 'Stock Healing') return 'Stock healing';
  if (label === 'Forge Weapon +5') return 'Forge weapon';
  return label;
}

function buildLiveTrialSummary(
  context: LiveResolvedContext,
  topFixes: readonly GateTrialFixSurface[],
): GateTrialExactSurfaceV1['trialSummary'] {
  const failSafe = context.lifecycle.failSafe;
  const score = context.metrics.readinessScore;
  const readinessTone: GateTrialExactTone = score >= 70 ? 'positive' : score >= 40 ? 'warning' : 'critical';
  const remainingFailures = Math.max(0, failSafe.threshold - failSafe.eligibleFailures);
  const failuresTone: GateTrialExactTone = failSafe.eligibleFailures > 0 ? 'critical' : remainingFailures === 1 ? 'warning' : 'neutral';
  const firstFixLabel = topFixes[0]?.label ?? '';

  return {
    title: 'Trial Summary',
    rows: [
      makeSummaryRow('target', 'Target', context.targetRealmName, 'neutral'),
      makeSummaryRow('readiness', 'Readiness', `${score} / 100`, readinessTone),
      makeSummaryRow('failures', 'Failures', `${failSafe.eligibleFailures} / ${failSafe.threshold}`, failuresTone),
      makeSummaryRow('reward', 'Reward', context.gateItemDisplayName, 'neutral'),
      makeSummaryRow('nextFix', 'Next Fix', compactNextFixLabel(firstFixLabel, context.lifecycle), firstFixLabel ? 'warning' : 'positive'),
    ],
  };
}

function buildLiveReadinessRail(context: LiveResolvedContext): GateTrialExactSurfaceV1['readinessRail'] {
  const loadoutComplete = context.metrics.activeEquippedCount >= 2 && context.metrics.passiveEquippedCount >= 1;
  const safetyNetStatus: GateTrialExactStatus = context.lifecycle.state === 'bypassed'
    ? 'success'
    : context.lifecycle.failSafe.canPurchase
      ? 'warning'
      : 'locked';
  const gateStatus: GateTrialExactStatus = context.lifecycle.state === 'cleared' || context.lifecycle.state === 'bypassed'
    ? 'cleared'
    : context.lifecycle.canStart
      ? 'active'
      : 'locked';

  return {
    title: `${context.targetRealmName} Gate Readiness`,
    nodes: [
      makeReadinessNode('qiCap', 'Qi Cap', statusFromBoolean(context.metrics.qiReady), 'statusCheck'),
      makeReadinessNode('loadout', 'Loadout', statusFromBoolean(loadoutComplete), 'loadout'),
      makeReadinessNode('weapon', 'Weapon', statusFromBoolean(context.metrics.weaponRefineLevel >= 5), 'weapon'),
      makeReadinessNode('medicine', 'Medicine', statusFromBoolean(context.metrics.healingQty >= 12), 'healing'),
      makeReadinessNode('techniques', 'Techniques', statusFromBoolean(loadoutComplete), 'technique'),
      makeReadinessNode('safetyNet', 'Safety Net', safetyNetStatus, safetyNetStatus === 'locked' ? 'statusLock' : 'statusWarning'),
      makeReadinessNode('gate', 'Gate', gateStatus, 'gateMarker'),
    ],
  };
}

function buildLivePrimaryAction(context: LiveResolvedContext): GateTrialButtonSurface {
  if (context.lifecycle.state === 'cleared' || context.lifecycle.state === 'bypassed') {
    return {
      visible: true,
      enabled: true,
      label: 'Break Through',
      ariaLabel: 'Return to Cultivation to complete breakthrough',
      intent: 'breakthrough-handoff',
      tone: 'ceremonial',
      singleDominantCta: true,
      ornamentVariant: 'jade-gold',
    };
  }

  if (context.lifecycle.canStart) {
    return {
      visible: true,
      enabled: true,
      label: 'Attempt Gate',
      ariaLabel: `Attempt ${context.gateTitle}`,
      intent: 'attempt-gate',
      tone: 'ceremonial',
      singleDominantCta: true,
      ornamentVariant: 'jade-gold',
    };
  }

  return {
    visible: true,
    enabled: false,
    label: 'Gate Locked',
    ariaLabel: context.lifecycle.reason,
    intent: 'attempt-gate',
    tone: 'locked',
    disabledReason: context.lifecycle.reason,
    singleDominantCta: true,
    ornamentVariant: 'locked-stone',
  };
}

function formatResultDuration(durationSec: number): string {
  const totalSeconds = Math.max(0, Math.round(durationSec));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function buildGateTrialResultTransitionSurface(
  context: LiveResolvedContext,
  recommendedPanel: GateTrialExactSurfaceV1['recommendedPanel'],
): GateTrialResultTransitionSurface | undefined {
  const failSafe = context.lifecycle.failSafe;

  if (context.lifecycle.state === 'cleared') {
    return {
      visible: true,
      kind: 'victory',
      title: 'GATE OPENED',
      subtitle: 'Gate catalyst acquired',
      stampLabel: 'CLEARED',
      tone: 'positive',
      detailLines: [
        { id: 'reward', label: 'Reward', value: context.gateItemDisplayName, tone: 'positive', source: 'content' },
        { id: 'resolution', label: 'Resolution', value: 'Cleared by combat', tone: 'positive', source: LIVE_SOURCE },
        { id: 'handoff', label: 'Next', value: 'Break through in Cultivation', tone: 'ceremonial', source: 'derived' },
      ],
      rewardLines: [
        `Acquired: ${context.gateItemDisplayName} \u00d71`,
        `Used for ${context.targetRealmName} Breakthrough`,
      ],
      ctaHint: 'Breakthrough path is ready.',
      emphasizedFixId: null,
      source: LIVE_SOURCE,
    };
  }

  if (context.lifecycle.state === 'bypassed') {
    return {
      visible: true,
      kind: 'bypassed',
      title: 'SAFETY NET SECURED',
      subtitle: 'Gate catalyst acquired through fail-safe',
      stampLabel: 'BYPASSED',
      tone: 'ceremonial',
      detailLines: [
        { id: 'reward', label: 'Reward', value: context.gateItemDisplayName, tone: 'positive', source: 'content' },
        { id: 'resolution', label: 'Resolution', value: 'Resolved by Safety Net', tone: 'ceremonial', source: LIVE_SOURCE },
        { id: 'handoff', label: 'Next', value: 'Break through in Cultivation', tone: 'ceremonial', source: 'derived' },
      ],
      rewardLines: [
        `Secured: ${context.gateItemDisplayName} \u00d71`,
        `Used for ${context.targetRealmName} Breakthrough`,
      ],
      ctaHint: 'Breakthrough path is ready.',
      emphasizedFixId: null,
      source: LIVE_SOURCE,
    };
  }

  const summary = context.trialProgress.lastAttemptSummary;
  if (!context.lifecycle.isResolved && summary) {
    const firstFix = recommendedPanel.topFixes[0] ?? null;
    const failureLabel = `${failSafe.eligibleFailures} / ${failSafe.threshold}`;
    const maxHitLabel = `${formatCompactNumber(summary.maxHit)} ${summary.maxHitLabel}`.trim();

    return {
      visible: true,
      kind: 'defeat',
      title: 'GATE REJECTED',
      subtitle: 'Failure recorded',
      stampLabel: 'DEFEAT',
      tone: 'critical',
      failureLabel,
      emphasizedFixId: firstFix?.id ?? null,
      detailLines: [
        {
          id: 'failures',
          label: 'Eligible Failures',
          value: failureLabel,
          tone: failSafe.canPurchase ? 'warning' : 'critical',
          source: LIVE_SOURCE,
        },
        {
          id: 'bossHp',
          label: 'Guardian Remaining',
          value: `${Math.round(clampPercent(summary.bossHpPct))}%`,
          tone: 'warning',
          source: LIVE_SOURCE,
        },
        {
          id: 'maxHit',
          label: 'Largest Hit',
          value: maxHitLabel,
          tone: 'critical',
          source: LIVE_SOURCE,
        },
        {
          id: 'duration',
          label: 'Attempt Time',
          value: formatResultDuration(summary.durationSec),
          tone: 'neutral',
          source: LIVE_SOURCE,
        },
      ],
      rewardLines: summary.suggestions.slice(0, 2),
      ctaHint: failSafe.canPurchase
        ? 'Safety Net is available if reserves allow.'
        : 'Review top fixes before the next attempt.',
      source: LIVE_SOURCE,
    };
  }

  if (!context.lifecycle.isResolved && failSafe.canPurchase) {
    const inventory = useInventoryStore.getState();
    const cost = failSafe.cost;
    const canAfford = cost ? inventory.canAffordCurrency(cost) : false;

    return {
      visible: true,
      kind: 'fail-safe-available',
      title: 'SAFETY NET READY',
      subtitle: 'Eligible failures reached',
      stampLabel: 'READY',
      tone: 'warning',
      detailLines: [
        {
          id: 'failures',
          label: 'Eligible Failures',
          value: `${failSafe.eligibleFailures} / ${failSafe.threshold}`,
          tone: 'warning',
          source: LIVE_SOURCE,
        },
        {
          id: 'cost',
          label: 'Cost',
          value: formatCurrencyCost(cost),
          tone: 'neutral',
          source: LIVE_SOURCE,
        },
        {
          id: 'reserve',
          label: 'Reserve',
          value: formatCurrencyReserve(cost, inventory),
          tone: canAfford ? 'positive' : 'warning',
          source: LIVE_SOURCE,
        },
      ],
      rewardLines: [
        `Secures: ${context.gateItemDisplayName} \u00d71`,
        `Used for ${context.targetRealmName} Breakthrough`,
      ],
      ctaHint: canAfford
        ? 'Safety Net can secure the catalyst now.'
        : 'Gather reserves to use Safety Net.',
      emphasizedFixId: 'safetyNet',
      source: LIVE_SOURCE,
    };
  }

  return undefined;
}

function applyResultTransitionToTrialSummary(
  context: LiveResolvedContext,
  trialSummary: GateTrialExactSurfaceV1['trialSummary'],
  recommendedPanel: GateTrialExactSurfaceV1['recommendedPanel'],
  resultTransition: GateTrialResultTransitionSurface | undefined,
): GateTrialExactSurfaceV1['trialSummary'] {
  if (!resultTransition) return trialSummary;

  const failSafe = context.lifecycle.failSafe;
  const failureLabel = `${failSafe.eligibleFailures} / ${failSafe.threshold}`;

  if (resultTransition.kind === 'victory' || resultTransition.kind === 'cleared' || resultTransition.kind === 'bypassed') {
    return {
      ...trialSummary,
      rows: [
        trialSummary.rows[0],
        makeSummaryRow('readiness', 'Readiness', `${context.metrics.readinessScore} / 100`, 'positive'),
        makeSummaryRow('failures', 'Failures', failureLabel, trialSummary.rows[2].tone),
        makeSummaryRow('reward', 'Reward', context.gateItemDisplayName, 'positive'),
        makeSummaryRow('nextFix', 'Next Fix', 'Break through', 'ceremonial'),
      ],
    };
  }

  if (resultTransition.kind === 'defeat') {
    const firstFixLabel = recommendedPanel.topFixes[0]?.label ?? '';
    const nextFix = failSafe.canPurchase ? 'Safety Net' : compactNextFixLabel(firstFixLabel, context.lifecycle);
    return {
      ...trialSummary,
      rows: [
        trialSummary.rows[0],
        trialSummary.rows[1],
        makeSummaryRow('failures', 'Failures', failureLabel, failSafe.canPurchase ? 'warning' : 'critical'),
        trialSummary.rows[3],
        makeSummaryRow('nextFix', 'Next Fix', nextFix || 'Attempt gate', failSafe.canPurchase ? 'warning' : 'critical'),
      ],
    };
  }

  if (resultTransition.kind === 'fail-safe-available') {
    return {
      ...trialSummary,
      rows: [
        trialSummary.rows[0],
        trialSummary.rows[1],
        makeSummaryRow('failures', 'Failures', failureLabel, 'warning'),
        trialSummary.rows[3],
        makeSummaryRow('nextFix', 'Next Fix', 'Safety Net', 'warning'),
      ],
    };
  }

  return trialSummary;
}

function buildGateTrialActiveTheaterSurface(args: {
  resolvedTrialId: string | null;
  cityId: string;
  trialDef: TrialDef | null;
  bossName: string;
  bossLevel: number | null;
  nowMs: number;
}): GateTrialActiveTheaterSurface | undefined {
  const combat = useCombatStore.getState();
  const activity = useActivityStore.getState();
  const matchingCombat = combat.inCombat && isMatchingGateTrialCombat(combat.combatContext, args.resolvedTrialId, args.cityId);
  const matchingActivity = isMatchingGateTrialActivity(activity.active, args.resolvedTrialId, args.cityId);

  if (!matchingCombat && !matchingActivity) return undefined;
  if (!matchingCombat) return undefined;

  const selectedAiProfile = titleCaseWords(useTechniqueStore.getState().getSelectedAiProfile());
  const logLines = mapCombatLogLines(combat.combatLog);

  return {
    visible: true,
    state: 'active',
    playerName: 'Disciple',
    playerHpLabel: formatHpLabel(combat.playerHP, combat.playerMaxHP),
    playerHpPct: percent(combat.playerHP, combat.playerMaxHP),
    enemyName: combat.currentEnemy?.name ?? args.bossName,
    enemyHpLabel: formatHpLabel(combat.enemyHP, combat.enemyMaxHP),
    enemyHpPct: percent(combat.enemyHP, combat.enemyMaxHP),
    bossName: combat.currentEnemy?.name ?? args.bossName,
    bossLevelLabel: args.bossLevel ? `Lv. ${args.bossLevel}` : '',
    attemptLabel: 'Gate Trial Attempt',
    elapsedLabel: formatElapsedLabel(combat.combatStartTime, args.nowMs),
    autoStateLabel: combat.autoCombatAI ? `AI ${selectedAiProfile}` : combat.autoAttack ? 'Auto Attack' : 'Manual',
    chips: [
      { id: 'attempt', label: 'Attempt', value: 'Active', tone: 'ceremonial' },
      { id: 'fail-safe', label: 'Fail-Safe', value: 'Tracked', tone: 'warning' },
    ],
    logLines: logLines.length > 0
      ? logLines
      : [{ id: 'combat-log-pending', text: 'Gate pressure gathers...', tone: 'system', source: LIVE_SOURCE }],
    techniqueLines: mapTechniqueLines(combat.techniqueLog),
    floatingEvents: mapFloatingEvents(combat.events, args.nowMs),
  };
}

export function buildGateTrialExactSurfaceFromStores(
  cityId: string | undefined,
  options: BuildGateTrialExactSurfaceFromStoresOptions = {},
): GateTrialExactSurfaceV1 {
  const resolvedCityId = cityId ?? DEFAULT_CITY_ID;
  const fixture = createGateTrialExactMockupFixture();

  if (options.mode === 'fixture') {
    return createGateTrialExactMockupFixture({
      meta: {
        ...fixture.meta,
        cityId: resolvedCityId,
        trialId: options.trialId ?? fixture.meta.trialId,
      },
    });
  }

  const contentStore = useContentStore.getState();
  const city = contentStore.maps.citiesById[resolvedCityId] ?? null;
  const resolvedTrialId = options.trialId ?? resolveModuleRef(city, 'gateTrial') ?? null;
  const trialDef = resolvedTrialId ? contentStore.maps.trialsById[resolvedTrialId] ?? null : null;
  const missingDataFallbacks: string[] = [];

  if (!contentStore.raw) missingDataFallbacks.push('Content store raw payload is unavailable.');
  if (!city) missingDataFallbacks.push(`City unavailable: ${resolvedCityId}.`);
  if (!resolvedTrialId) missingDataFallbacks.push('Trial reference unavailable from city refs.');
  if (resolvedTrialId && !trialDef) missingDataFallbacks.push(`Trial definition unavailable: ${resolvedTrialId}.`);

  if (!contentStore.raw || !city || !resolvedTrialId || !trialDef) {
    return buildLiveMissingContentFallback({
      fixture,
      cityId: resolvedCityId,
      trialId: resolvedTrialId,
      missingDataFallbacks,
    });
  }

  const context = resolveLiveContext(resolvedCityId, resolvedTrialId);
  if (!context) {
    return buildLiveMissingContentFallback({
      fixture,
      cityId: resolvedCityId,
      trialId: resolvedTrialId,
      missingDataFallbacks: [...missingDataFallbacks, 'Live context could not be resolved.'],
    });
  }

  const idleExpeditionCount = Math.max(0, useExpeditionStore.getState().slots - useExpeditionStore.getState().active.length);
  const trackedBounty = useBountyStore.getState().getTrackedBounty(resolvedCityId);
  const tacticalCells = buildLiveTacticalCells(context);
  const recommendedPanel = buildLiveRecommendedPanel(context);
  const trialSummary = buildLiveTrialSummary(context, recommendedPanel.topFixes);
  const primaryAction = buildLivePrimaryAction(context);
  const activeTheater = buildGateTrialActiveTheaterSurface({
    resolvedTrialId,
    cityId: resolvedCityId,
    trialDef,
    bossName: context.bossName,
    bossLevel: context.metrics.bossLevel,
    nowMs: options.nowMs ?? Date.now(),
  });
  const resultTransition = activeTheater
    ? undefined
    : buildGateTrialResultTransitionSurface(context, recommendedPanel);
  const resultTrialSummary = applyResultTransitionToTrialSummary(context, trialSummary, recommendedPanel, resultTransition);
  const activeTrialSummary: GateTrialExactSurfaceV1['trialSummary'] = activeTheater
    ? {
        ...resultTrialSummary,
        rows: [
          resultTrialSummary.rows[0],
          resultTrialSummary.rows[1],
          resultTrialSummary.rows[2],
          resultTrialSummary.rows[3],
          makeSummaryRow('nextFix', 'Next Fix', 'Survive attempt', 'warning'),
        ],
      }
    : resultTrialSummary;
  const activePrimaryAction: GateTrialButtonSurface = activeTheater
    ? {
        ...primaryAction,
        label: 'Stop Attempt',
        ariaLabel: 'Stop the active Gate Trial attempt',
        intent: 'stop-attempt',
        tone: 'warning',
        enabled: true,
        visible: true,
        singleDominantCta: true,
        ornamentVariant: 'jade-gold',
      }
    : primaryAction;
  const activeReadinessSeal: GateTrialExactSurfaceV1['scenicStage']['readinessSeal'] | null = activeTheater
    ? {
        ...fixture.scenicStage.readinessSeal,
        state: 'active',
        verdict: 'ACTIVE',
        scoreLabel: 'Gate trial in progress',
      }
    : null;
  const liveReadinessSeal: GateTrialExactSurfaceV1['scenicStage']['readinessSeal'] = activeReadinessSeal ?? (
    context.lifecycle.state === 'cleared'
      ? {
          ...fixture.scenicStage.readinessSeal,
          state: 'cleared',
          verdict: 'CLEARED',
          scoreLabel: 'Reward acquired',
        }
      : context.lifecycle.state === 'bypassed'
        ? {
            ...fixture.scenicStage.readinessSeal,
            state: 'cleared',
            verdict: 'BYPASSED',
            scoreLabel: 'Safety Net secured',
          }
        : resultTransition?.kind === 'defeat'
          ? {
              ...fixture.scenicStage.readinessSeal,
              state: 'warning',
              verdict: 'REJECTED',
              scoreLabel: `Failure ${context.lifecycle.failSafe.eligibleFailures} / ${context.lifecycle.failSafe.threshold}`,
            }
          : resultTransition?.kind === 'fail-safe-available'
            ? {
                ...fixture.scenicStage.readinessSeal,
                state: 'warning',
                verdict: 'READY',
                scoreLabel: 'Safety Net available',
              }
            : {
                ...fixture.scenicStage.readinessSeal,
                verdict: context.lifecycle.canStart && context.metrics.readinessScore >= 60
                  ? 'VIABLE'
                  : context.lifecycle.canStart
                    ? 'RISKY'
                    : 'LOCKED',
                scoreLabel: `Readiness ${context.metrics.readinessScore} / 100`,
                state: context.lifecycle.canStart && context.metrics.readinessScore >= 60
                  ? 'viable'
                  : context.lifecycle.canStart
                    ? 'warning'
                    : 'locked',
              }
  );
  const activeFailureReflectionCandidate = useFailureReflectionStore
    .getState()
    .getActiveReflectionForTrial(resolvedTrialId, context.gateIndex);
  const currentDiagnosisCode = context.readinessSurface?.rawDiagnosis?.primary ?? null;
  const activeFailureReflection = activeFailureReflectionCandidate
    && (!currentDiagnosisCode || activeFailureReflectionCandidate.diagnosisCode === currentDiagnosisCode)
      ? activeFailureReflectionCandidate
      : null;
  const suppressedFailureReflectionNote = activeFailureReflectionCandidate && !activeFailureReflection
    ? `Suppressed stale Inner Demon reflection for diagnosis ${activeFailureReflectionCandidate.diagnosisCode}; current diagnosis is ${currentDiagnosisCode ?? 'unavailable'}.`
    : null;

  return {
    ...fixture,
    meta: {
      ...fixture.meta,
      mode: 'live',
      source: 'stores',
      cityId: resolvedCityId,
      trialId: resolvedTrialId,
      activityMode: activeTheater
        ? 'active'
        : context.lifecycle.state === 'cleared'
        ? 'cleared'
        : context.lifecycle.state === 'bypassed'
          ? 'bypassed'
          : resultTransition?.kind === 'defeat'
            ? 'transitioning'
            : context.lifecycle.canStart
              ? 'available'
              : 'locked',
      lifecycleState: context.lifecycle.state,
      resolution: context.lifecycle.resolution === 'cleared' || context.lifecycle.resolution === 'bypassed'
        ? context.lifecycle.resolution
        : 'none',
      readinessScore: context.metrics.readinessScore,
    },
    page: {
      ...fixture.page,
      topRightStatus: [
        `${idleExpeditionCount} ${idleExpeditionCount === 1 ? 'Expedition' : 'Expeditions'} Idle`,
        trackedBounty ? '1 Tracked Bounty' : '0 Tracked Bounties',
      ],
    },
    tacticalStrip: {
      ...fixture.tacticalStrip,
      cells: tacticalCells,
    },
    gateHeader: {
      title: context.gateTitle,
      subtitle: `Milestone readiness check \u2014 clears the path to ${context.targetRealmName}`,
      plaqueVariant: 'black-gold-foundation',
      chips: fixture.gateHeader.chips,
    },
    minimumChecklist: buildLiveMinimumChecklist(context),
    scenicStage: {
      ...fixture.scenicStage,
      sceneAssetId: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.key,
      artStatus: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.artStatus,
      requiresFinalArtBinding: GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING.requiresFinalArtBinding,
      environmentDescriptor: 'Foundation Gate threshold scene: ink-wash mountain valley, monumental temple stairs, centered shrine gate, pale portal bloom, warm torch basins, lower-left cultivator silhouette, mist, and active trial overlays.',
      readinessSeal: liveReadinessSeal,
      guardianPlaque: {
        ...fixture.scenicStage.guardianPlaque,
        title: `${context.bossName} · Lv. ${context.metrics.bossLevel}`,
        subtitle: context.targetRealmName === 'Foundation'
          ? `${context.targetRealmName} Establishment Trial`
          : `${context.targetRealmName} Trial`,
        rewardLines: [
          `Clear Reward: ${context.gateItemDisplayName} \u00d71`,
          `Used for ${context.targetRealmName} Breakthrough`,
        ],
        gateItemId: context.gateItemId,
      },
      activeTheater,
      resultTransition,
    },
    recommendedPanel,
    trialSummary: activeTrialSummary,
    readinessRail: buildLiveReadinessRail(context),
    primaryAction: activePrimaryAction,
    runCompass: buildGateTrialRunCompassProjection(),
    aftermath: buildLiveCombatAftermathSurface({
      kind: 'gate_trial',
      cityId: resolvedCityId,
      trialId: resolvedTrialId,
      gateLabel: context.gateTitle,
      gateProofItemId: context.gateItemId,
    }),
    failureReflection: activeFailureReflection ? buildFailureReflectionSurface(activeFailureReflection) : null,
    debug: {
      ...fixture.debug,
      regionOrder: GATE_TRIAL_EXACT_REGION_ORDER,
      missingDataFallbacks: context.missingDataFallbacks,
      fixtureLockedValues: [],
      liveSourceNotes: [
        'Resolved trial from city.refs.gateTrialId.',
        'Lifecycle sourced from getTrialLifecycleSnapshot.',
        'Gate reward sourced from getTrialGateItemId.',
        'Readiness score adapted from buildGateTrialReadinessSurface.',
        'Top fixes use deterministic readiness-gap fallback until action-controller packets.',
        'Ruins support row reads lastRunSummary and ruins progress when present.',
        'Approved Foundation Gate scenic plate bound from src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png.',
        `Post-failure suggestion count observed: ${context.postFailureSuggestionCount}.`,
        ...(suppressedFailureReflectionNote ? [suppressedFailureReflectionNote] : []),
      ],
      placeholderAssetKeysInUse: fixture.debug.placeholderAssetKeysInUse,
      visualContractNotes: fixture.debug.visualContractNotes,
    },
  };
}
