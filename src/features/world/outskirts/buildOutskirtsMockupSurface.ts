import { OUTSKIRTS_BEST_USED_WHEN, OUTSKIRTS_BOUNDARY_LINE, OUTSKIRTS_ROLE_TAG, buildOutskirtsActivityRewardReadModel } from '../../../systems/economy/activityRewardReadModel.js';
import { buildCurrentCombatPostureContext, evaluateCurrentCombatPostureFit } from '../../../systems/builds/combatPostureFit.js';
import { evaluateAiProfileFit } from '../../../systems/builds/aiProfileFit.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useOutskirtsStore } from '../../../stores/outskirtsStore.js';
import { useTechniqueStore } from '../../../stores/techniqueStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import type { CombatEvent, CombatLogEntry } from '../../../types/index.js';
import {
  OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL,
  OUTSKIRTS_ALLOWED_PLANNING_SHELL,
  OUTSKIRTS_ENCOUNTER_DEFAULT_ID,
  OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST,
  OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC,
  OUTSKIRTS_MOCKUP_VERSION,
  OUTSKIRTS_PLACEHOLDER_POLICY,
  OUTSKIRTS_REVIEW_COPY,
  OUTSKIRTS_TACTICAL_CELL_ORDER,
  OUTSKIRTS_TARGET_MOCKUP_ID,
} from './outskirtsMockupPresentation.js';
import { isSameOutskirtsActivitySource, isSameOutskirtsCombatSource } from './getOutskirtsModuleViewState.js';
import { resolveOutskirtsEncounterStripArt } from './resolveOutskirtsEncounterStripArt.js';
import { OUTSKIRTS_ASSETS } from './outskirtsAssetRegistry.js';
import { buildOutskirtsFloatingHitsFromCombatFeedback } from './outskirtsCombatFeedback.js';
import { buildOutskirtsCombatStageChips } from './outskirtsCombatChips.js';
import type {
  OutskirtsEncounterNodeState,
  OutskirtsCombatStage,
  OutskirtsCombatStageLogLine,
  OutskirtsCombatLogTone,
  OutskirtsExactSurfaceV2,
  OutskirtsInnerPalacePreview,
  OutskirtsInnerPalacePreviewSlot,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsSurfaceValueSource,
  OutskirtsSurfaceMode,
  OutskirtsTacticalTone,
} from './types.js';

function asText(value: string | null | undefined, fallback: string): { text: string; source: OutskirtsSurfaceValueSource } {
  if (value && value.trim().length > 0) return { text: value, source: 'live' };
  return { text: fallback, source: 'synthetic' };
}

function formatWhole(value: number | string): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;
  return `${Math.max(0, Math.round(numeric)).toLocaleString()}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;
}

function toSafeCombatNumber(value: string | number | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatCombatHpLabel(current: number, max: number): string {
  return `${formatWhole(current)} / ${formatWhole(max)}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeCombatActorKeyPart(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : 'unknown';
}

function mapCombatLogLineTone(type: CombatLogEntry['type']): OutskirtsCombatLogTone {
  if (type === 'enemy') return 'enemy';
  if (type === 'loot') return 'loot';
  if (type === 'victory') return 'victory';
  if (type === 'defeat') return 'defeat';
  if (type === 'player' || type === 'damage') return 'player';
  return 'system';
}

function buildInactiveCombatStage(lifecycle: OutskirtsSurfaceMode = 'planning'): OutskirtsCombatStage {
  return {
    active: false,
    hasLiveCombat: false,
    lifecycle,
    visualContract: 'outskirts-center-combat-theater-v1',
    player: {
      role: 'player',
      side: 'left',
      name: 'Cultivator',
      hpCurrent: 0,
      hpMax: 0,
      hpLabel: '0 / 0',
      hpPct: 0,
      actorImageKey: 'outskirts/actor/cultivator',
      motionState: 'idle',
    },
    enemy: {
      role: 'enemy',
      side: 'right',
      id: null,
      name: '',
      levelLabel: '',
      hpCurrent: 0,
      hpMax: 0,
      hpLabel: '0 / 0',
      hpPct: 0,
      actorImageKey: 'outskirts/enemy/unknown',
      motionState: 'idle',
      isBoss: false,
    },
    versusSeal: { iconKey: 'crossed-swords', label: 'Duel' },
    chips: [],
    logLines: [],
    floatingHits: [],
  };
}

function buildStartingCombatStage(input: {
  lifecycle: OutskirtsSurfaceMode;
  playerHpCurrent: number;
  playerHpMax: number;
  aiProfileLabel: string;
  autoUseOn: boolean;
  killsToBoss: number;
  killsSinceBoss: number;
  isBossFight: boolean;
  activeTechniques: Array<{ id: string; name: string; readyAt: number | null }>;
}): OutskirtsCombatStage {
  const hpMax = Math.max(0, input.playerHpMax);
  const hpCurrent = hpMax > 0 ? Math.min(Math.max(0, input.playerHpCurrent), hpMax) : 0;
  return {
    ...buildInactiveCombatStage(input.lifecycle),
    active: true,
    lifecycle: input.lifecycle,
    player: {
      role: 'player',
      side: 'left',
      name: 'Cultivator',
      hpCurrent,
      hpMax,
      hpLabel: formatCombatHpLabel(hpCurrent, hpMax),
      hpPct: hpMax > 0 ? clampPct((hpCurrent / hpMax) * 100) : 0,
      actorImageKey: 'outskirts/actor/cultivator',
      motionState: hpCurrent <= 0 ? 'defeat' : 'idle',
    },
    enemy: {
      role: 'enemy',
      side: 'right',
      id: null,
      name: 'Seeking foe',
      levelLabel: '',
      hpCurrent: 0,
      hpMax: 0,
      hpLabel: '0 / 0',
      hpPct: 0,
      actorImageKey: 'outskirts/enemy/unknown',
      motionState: 'idle',
      isBoss: input.isBossFight,
    },
    chips: buildOutskirtsCombatStageChips({
      aiProfileLabel: input.aiProfileLabel,
      autoUseEnabled: input.autoUseOn,
      isBossFight: input.isBossFight,
      killsToBoss: input.killsToBoss,
      killsSinceBoss: input.killsSinceBoss,
      activeTechniques: input.activeTechniques,
      now: Date.now(),
      source: 'live',
    }),
  };
}

function buildLiveCombatStageFromStores(input: {
  lifecycle: OutskirtsSurfaceMode;
  playerHp: string | number;
  playerMaxHp: string | number;
  enemyHp: string | number;
  enemyMaxHp: string | number;
  enemy: { id?: string | null; name?: string; level?: number; isBoss?: boolean } | null;
  combatLog: CombatLogEntry[];
  combatEvents: CombatEvent[];
  aiProfileLabel: string;
  autoUseOn: boolean;
  killsToBoss: number;
  killsSinceBoss: number;
  isBossFight: boolean;
  activeTechniques: Array<{ id: string; name: string; readyAt: number | null }>;
  now: number;
}): OutskirtsCombatStage {
  const playerMax = toSafeCombatNumber(input.playerMaxHp);
  const playerCurrentRaw = toSafeCombatNumber(input.playerHp);
  const playerCurrent = playerMax > 0 ? Math.min(playerCurrentRaw, playerMax) : 0;
  const enemyMax = toSafeCombatNumber(input.enemyMaxHp);
  const enemyCurrentRaw = toSafeCombatNumber(input.enemyHp);
  const enemyCurrent = enemyMax > 0 ? Math.min(enemyCurrentRaw, enemyMax) : 0;
  const enemyName = input.enemy?.name?.trim() ? input.enemy.name : 'Unknown Foe';
  const enemyId = input.enemy?.id?.trim() ? input.enemy.id : null;
  const enemyLevelLabel = typeof input.enemy?.level === 'number' && Number.isFinite(input.enemy.level)
    ? `Lv. ${Math.max(1, Math.round(input.enemy.level))}`
    : '';
  const actorKeyPart = normalizeCombatActorKeyPart(enemyId ?? enemyName);
  const logLines: OutskirtsCombatStageLogLine[] = input.combatLog.slice(-3).map((entry, index) => {
    const timestamp = Number.isFinite(entry.timestamp) ? entry.timestamp : null;
    return {
      id: timestamp === null ? `combat-log-live-${index}` : `combat-log-${timestamp}-${index}`,
      text: entry.text,
      tone: mapCombatLogLineTone(entry.type),
      timestamp,
      source: 'live',
    };
  });

  return {
    active: true,
    hasLiveCombat: true,
    lifecycle: input.lifecycle,
    visualContract: 'outskirts-center-combat-theater-v1',
    player: {
      role: 'player',
      side: 'left',
      name: 'Cultivator',
      hpCurrent: playerCurrent,
      hpMax: playerMax,
      hpLabel: formatCombatHpLabel(playerCurrent, playerMax),
      hpPct: playerMax > 0 ? clampPct((playerCurrent / playerMax) * 100) : 0,
      actorImageKey: 'outskirts/actor/cultivator',
      motionState: playerCurrent <= 0 ? 'defeat' : 'idle',
    },
    enemy: {
      role: 'enemy',
      side: 'right',
      id: enemyId,
      name: enemyName,
      levelLabel: enemyLevelLabel,
      hpCurrent: enemyCurrent,
      hpMax: enemyMax,
      hpLabel: formatCombatHpLabel(enemyCurrent, enemyMax),
      hpPct: enemyMax > 0 ? clampPct((enemyCurrent / enemyMax) * 100) : 0,
      actorImageKey: `outskirts/enemy/${actorKeyPart}`,
      motionState: enemyCurrent <= 0 ? 'defeat' : 'idle',
      isBoss: input.isBossFight || Boolean(input.enemy?.isBoss),
    },
    versusSeal: { iconKey: 'crossed-swords', label: 'Duel' },
    chips: buildOutskirtsCombatStageChips({
      aiProfileLabel: input.aiProfileLabel,
      autoUseEnabled: input.autoUseOn,
      isBossFight: input.isBossFight,
      killsToBoss: input.killsToBoss,
      killsSinceBoss: input.killsSinceBoss,
      activeTechniques: input.activeTechniques,
      now: input.now,
      source: 'live',
    }),
    logLines,
    floatingHits: buildOutskirtsFloatingHitsFromCombatFeedback({
      combatEvents: input.combatEvents,
      logLines,
      existingFixtureHits: [],
    }),
  };
}

function cloneCombatStage(stage: OutskirtsCombatStage): OutskirtsCombatStage {
  return {
    ...stage,
    player: { ...stage.player },
    enemy: { ...stage.enemy },
    versusSeal: { ...stage.versusSeal },
    chips: stage.chips.map((chip) => ({ ...chip })),
    logLines: stage.logLines.map((line) => ({ ...line })),
    floatingHits: stage.floatingHits.map((hit) => ({ ...hit })),
  };
}

function parseHpLabel(hpLabel: string): { current: number; max: number } {
  const matches = hpLabel.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!matches) return { current: 0, max: 0 };
  return { current: Number(matches[1].replace(/,/g, '')) || 0, max: Number(matches[2].replace(/,/g, '')) || 0 };
}

function formatDangerCell(snapshot: OutskirtsMockupRuntimeSnapshot): string {
  if (snapshot.sourceMode === 'fixture') return snapshot.dangerLabel;
  const level = snapshot.selectedEncounterLevelLabel.match(/\d+/)?.[0] ?? '1';
  const bossReady = snapshot.killsSinceBoss >= snapshot.killsToBoss;
  const qualitative = bossReady ? 'Boss' : snapshot.safetyChipState === 'safe' ? 'Low' : snapshot.safetyChipState === 'watch' ? 'Watch' : 'Risk';
  return `${qualitative} · Lv. ${level}`;
}

function normalizeEncounterId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parseProgressLabel(progressLabel: string): { current: number; target: number } {
  const matches = progressLabel.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!matches) return { current: 0, target: 0 };
  const current = Number(matches[1].replace(/,/g, '')) || 0;
  const target = Number(matches[2].replace(/,/g, '')) || 0;
  return {
    current: Math.max(0, current),
    target: Math.max(0, target),
  };
}

function resolveScenicImageSrc(sourceMode: OutskirtsMockupRuntimeSnapshot['sourceMode']): string | null {
  return sourceMode === 'fixture'
    ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC
    : OUTSKIRTS_ASSETS.scenic.cityOutskirtsBackdrop;
}

const INNER_PALACE_SLOT_FRAME: ReadonlyArray<Pick<OutskirtsInnerPalacePreviewSlot, 'key' | 'slotType' | 'slotIndex' | 'label'>> = Object.freeze([
  { key: 'active-0', slotType: 'active', slotIndex: 0, label: 'Active I' },
  { key: 'active-1', slotType: 'active', slotIndex: 1, label: 'Active II' },
  { key: 'active-2', slotType: 'active', slotIndex: 2, label: 'Active III' },
  { key: 'active-3', slotType: 'active', slotIndex: 3, label: 'Active IV' },
  { key: 'passive-0', slotType: 'passive', slotIndex: 0, label: 'Passive I' },
  { key: 'passive-1', slotType: 'passive', slotIndex: 1, label: 'Passive II' },
  { key: 'passive-2', slotType: 'passive', slotIndex: 2, label: 'Passive III' },
  { key: 'ultimate-0', slotType: 'ultimate', slotIndex: 0, label: 'Ultimate' },
]);

function sanitizeSlottedTechId(techId: string | null | undefined): string | null {
  if (typeof techId !== 'string') return null;
  const normalized = techId.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveTechniqueName(techniquesById: Record<string, { name?: string } | undefined>, techId: string | null): string | null {
  if (!techId) return null;
  const fallback = techId;
  const name = techniquesById[techId]?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : fallback;
}

function buildInnerPalacePreviewSnapshot(source: OutskirtsSurfaceValueSource): OutskirtsInnerPalacePreview {
  const techniqueStore = useTechniqueStore.getState();
  const currentRealmIndex = useGameStore.getState().realm.index;
  const techniquesById = useContentStore.getState().maps.techniquesById;
  const selectedLoadout = techniqueStore.getSelectedLoadout();
  const progression = techniqueStore.getSlotProgressionSnapshot(currentRealmIndex);
  const activeSlots = selectedLoadout?.slots.active ?? [];
  const passiveSlots = selectedLoadout?.slots.passive ?? [];
  const ultimateSlot = selectedLoadout?.slots.ultimate ?? null;
  const loadoutName = selectedLoadout?.name?.trim() ? selectedLoadout.name : 'Loadout 1';

  const slots = INNER_PALACE_SLOT_FRAME.map((frame): OutskirtsInnerPalacePreviewSlot => {
    const unlocked = frame.slotType === 'active'
      ? frame.slotIndex < progression.unlocked.active
      : frame.slotType === 'passive'
        ? frame.slotIndex < progression.unlocked.passive
        : progression.unlocked.ultimate;
    const rawTechId = frame.slotType === 'active'
      ? activeSlots[frame.slotIndex] ?? null
      : frame.slotType === 'passive'
        ? passiveSlots[frame.slotIndex] ?? null
        : ultimateSlot;
    const techId = sanitizeSlottedTechId(rawTechId);
    const state = unlocked ? (techId ? 'equipped' : 'empty') : 'locked';
    const unlockRequirement = frame.slotType === 'ultimate'
      ? progression.unlockRequirements.ultimate
      : progression.unlockRequirements[frame.slotType][frame.slotIndex];
    return {
      ...frame,
      state,
      techId,
      techniqueName: resolveTechniqueName(techniquesById, techId),
      isUnlocked: unlocked,
      unlockLabel: unlockRequirement?.reasonText,
    };
  });

  const activeEquipped = slots.filter((slot) => slot.slotType === 'active' && slot.state === 'equipped').length;
  const passiveEquipped = slots.filter((slot) => slot.slotType === 'passive' && slot.state === 'equipped').length;
  const ultimateEquipped = slots.some((slot) => slot.slotType === 'ultimate' && slot.state === 'equipped');
  const emptyUnlockedSlots = slots.filter((slot) => slot.state === 'empty').length;
  const footerLine = activeEquipped === 0 && passiveEquipped === 0 && !ultimateEquipped
    ? `${loadoutName} · No techniques slotted`
    : `${loadoutName} · ${activeEquipped} Active · ${passiveEquipped} Passive`;

  return {
    visible: true,
    title: 'Inner Palace',
    subtitle: 'Equipped Techniques',
    loadoutName,
    footerLine,
    emptyUnlockedSlots,
    activeEquipped,
    passiveEquipped,
    ultimateEquipped,
    manageLabel: 'Manage',
    source,
    slots,
  };
}

function cloneInnerPalacePreview(preview: OutskirtsInnerPalacePreview): OutskirtsInnerPalacePreview {
  return {
    ...preview,
    slots: preview.slots.map((slot) => ({ ...slot })),
  };
}

export interface BuildOutskirtsMockupSurfaceOptions {
  previewEncounterId?: string;
  allowEncounterPreviewSelection?: boolean;
  medicinePouchActionEnabled?: boolean;
  activityMode?: OutskirtsSurfaceMode;
}

function resolveProgressionStateByEncounterId(snapshot: OutskirtsMockupRuntimeSnapshot): Record<string, OutskirtsEncounterNodeState> {
  const bySnapshot = new Map(snapshot.encounterNodes.map((entry) => [normalizeEncounterId(entry.id), entry.state] as const));
  return Object.fromEntries(OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry, index) => {
    const normalizedId = normalizeEncounterId(entry.id);
    const fallbackState: OutskirtsEncounterNodeState = index === 0 ? 'current' : 'future';
    return [entry.id, bySnapshot.get(normalizedId) ?? fallbackState];
  }));
}

function buildEncounterStrip(
  snapshot: OutskirtsMockupRuntimeSnapshot,
  options: BuildOutskirtsMockupSurfaceOptions = {},
): OutskirtsExactSurfaceV2['encounterStrip'] {
  const progressionStateByEncounterId = resolveProgressionStateByEncounterId(snapshot);
  const defaultSelectedId = OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.find((entry) => progressionStateByEncounterId[entry.id] === 'current')?.id
    ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID;
  const selected = normalizeEncounterId(options.previewEncounterId ?? snapshot.selectedEncounterId);
  const selectedEncounterId = [selected, normalizeEncounterId(defaultSelectedId), OUTSKIRTS_ENCOUNTER_DEFAULT_ID]
    .find((id) => OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.some((entry) => entry.id === id)) ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID;
  const selectedIndex = Math.max(0, OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.findIndex((entry) => entry.id === selectedEncounterId));
  const interactive = options.allowEncounterPreviewSelection ?? snapshot.sourceMode === 'stores';

  return {
    selectedEncounterId,
    leftArrow: { visible: true, enabled: interactive && selectedIndex > 0, ariaLabel: 'Preview previous encounter', ornamentVariant: 'parchment' },
    rightArrow: { visible: true, enabled: interactive && selectedIndex < OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.length - 1, ariaLabel: 'Preview next encounter', ornamentVariant: 'parchment' },
    lane: {
      showConnector: true,
      connectorVariant: 'brush',
    },
    nodes: OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry, index) => {
      const state = progressionStateByEncounterId[entry.id];
      const art = resolveOutskirtsEncounterStripArt({ id: entry.id, state, sourceMode: snapshot.sourceMode });
      return {
        id: entry.id,
        label: entry.label,
        levelLabel: entry.levelLabel,
        state,
        artKey: state === 'future' ? undefined : entry.artKey,
        imageSrc: art.imageSrc,
        imagePosition: art.imagePosition,
        silhouetteKey: state === 'future' ? entry.silhouetteKey : undefined,
        silhouetteImageSrc: art.silhouetteImageSrc,
        completionMark: art.completionMark,
        medallionVariant: art.medallionVariant,
        isSelected: index === selectedIndex,
        isClickable: interactive && index !== selectedIndex,
        ariaLabel: `${entry.label} ${entry.levelLabel} ${state}${index === selectedIndex ? ' selected' : ''}`,
      };
    }),
  };
}

export function buildOutskirtsMockupSurface(
  snapshot: OutskirtsMockupRuntimeSnapshot,
  options: BuildOutskirtsMockupSurfaceOptions = {},
): OutskirtsExactSurfaceV2 {
  const activityMode = options.activityMode ?? (snapshot.isOutskirtsActive ? 'active' : 'planning');
  const combatStage = cloneCombatStage(snapshot.combatStage);
  const missingDataFallbacks: string[] = [];
  const unresolvedLiveSourceNotes: string[] = [];
  const placeholderAssetKeysInUse = [snapshot.scenicArtKey, snapshot.scenicBackgroundKey].filter((k) => k.startsWith('placeholder/'));

  const medicine = asText(snapshot.medicinePouchLabel, '0 / 20');
  const bounty = asText(snapshot.bountyLabel, 'No tracked bounty');
  if (medicine.source !== 'live') missingDataFallbacks.push('medicinePouchLabel');
  if (bounty.source !== 'live') missingDataFallbacks.push('bountyLabel');

  const hp = parseHpLabel(combatStage.hasLiveCombat ? combatStage.player.hpLabel : snapshot.hpLabel);
  const hpPrimary = hp.max > 0 ? `${formatWhole(hp.current)} / ${formatWhole(hp.max)}` : (combatStage.hasLiveCombat ? combatStage.player.hpLabel : snapshot.hpLabel);
  const bountyProgress = parseProgressLabel(snapshot.trackedBountyProgress);
  const encounterStrip = buildEncounterStrip(snapshot, options);
  const topNodes = encounterStrip.nodes;
  const selectedEncounter = encounterStrip.nodes.find((entry) => entry.isSelected) ?? encounterStrip.nodes.find((entry) => entry.state === 'current');
  const selectedManifestNode = OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.find((entry) => entry.id === selectedEncounter?.id);
  const autoRepeatEnabled = snapshot.autoRepeatEnabled ?? /^on$/i.test(snapshot.autoRepeatLabel);

  const tacticalCells = {
    hp: { id: 'hp', label: 'HP', primaryText: hpPrimary, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'hp', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: clamp01(hp.max > 0 ? hp.current / hp.max : 1) * 100, visible: true, reserveAdornmentSpace: true },
    danger: { id: 'danger', label: 'Danger', primaryText: formatDangerCell(snapshot), tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'danger', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    loadout: { id: 'loadout', label: 'Loadout', primaryText: snapshot.loadoutLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'loadout', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    aiProfile: { id: 'aiProfile', label: 'AI Profile', primaryText: snapshot.aiProfileLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'aiProfile', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    healing: { id: 'healing', label: 'Healing', primaryText: medicine.text, tone: medicine.source === 'live' ? 'positive' : 'warning' as OutskirtsTacticalTone, iconKey: 'healing', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    bounty: { id: 'bounty', label: 'Bounty', primaryText: bounty.text, tone: bounty.source === 'live' ? 'positive' : 'neutral' as OutskirtsTacticalTone, iconKey: 'bounty', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    expedition: { id: 'expedition', label: 'Expedition', primaryText: snapshot.expeditionLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'expedition', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: /idle/i.test(snapshot.expeditionLabel), showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
  } as const;

  const notes = [activityMode === 'active'
    ? 'Active Outskirts center stage now renders compact combat status chips; result overlays and expanded controls are deferred to later packets.'
    : 'Planning exact surface is a review fixture and does not change baseline live-screen ownership in P0.'];

  return {
    meta: {
      surfaceId: 'outskirts-exact-mockup',
      version: OUTSKIRTS_MOCKUP_VERSION,
      mode: snapshot.sourceMode === 'fixture' ? 'fixture' : 'live',
      cityId: snapshot.cityId,
      outskirtsId: snapshot.outskirtsId,
      source: snapshot.sourceMode === 'fixture' ? 'fixture' : 'stores',
      targetMockupId: OUTSKIRTS_TARGET_MOCKUP_ID,
      activityMode,
    },
    page: { title: OUTSKIRTS_REVIEW_COPY.pageTitle },
    topRibbon: {
      ariaLabel: 'Outskirts macro progression',
      decorative: true,
      leftOrnament: 'vine',
      terminalCap: 'temple',
      nodes: topNodes.map((node) => ({ id: node.id, label: node.label, state: node.state, variant: node.isSelected ? 'active' : 'muted' })),
      activeNodeId: topNodes.find((node) => node.isSelected)?.id ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID,
    },
    tacticalStrip: {
      ariaLabel: 'Tactical Readout',
      cells: OUTSKIRTS_TACTICAL_CELL_ORDER.map((id) => tacticalCells[id]) as OutskirtsExactSurfaceV2['tacticalStrip']['cells'],
    },
    areaHeader: {
      plaqueLabel: OUTSKIRTS_REVIEW_COPY.pageTitle,
      subtitle: activityMode === 'active' ? 'Quiet Glade hunt in progress' : snapshot.pageSubtitle,
      showDropdownCaret: true,
      hasGroundedSelector: false,
    },
    scenicStage: {
      scenicBackgroundKey: snapshot.scenicBackgroundKey,
      scenicImageSrc: resolveScenicImageSrc(snapshot.sourceMode),
      reviewFixtureImageSrc: snapshot.sourceMode === 'fixture' ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC : null,
      liveFallbackImageSrc: OUTSKIRTS_ASSETS.scenic.cityOutskirtsBackdrop,
      useApprovedMockupCrop: snapshot.sourceMode === 'fixture',
      encounterArtKey: selectedManifestNode?.artKey ?? snapshot.scenicArtKey,
      environmentDescriptor: selectedEncounter ? `${selectedEncounter.label} preview in Outskirts lane.` : snapshot.encounterDescriptor,
    },
    encounterIdentity: {
      selectedEncounterId: selectedEncounter?.id ?? snapshot.selectedEncounterId,
      displayName: selectedEncounter?.label ?? snapshot.selectedEncounterName,
      levelLabel: selectedEncounter?.levelLabel ?? snapshot.selectedEncounterLevelLabel,
      safetyChip: { state: snapshot.safetyChipState, label: snapshot.safetyChipLabel },
    },
    setupCard: {
      title: OUTSKIRTS_REVIEW_COPY.setupCardTitle,
      loadoutRow: { id: 'loadoutSet', label: 'Loadout Set', value: snapshot.loadoutLabel, source: 'live' },
      aiProfileRow: { id: 'aiProfile', label: 'AI Profile', value: snapshot.aiProfileLabel, source: 'live' },
      attackFocusRow: { id: 'attackFocus', label: 'Attack Focus', value: snapshot.attackFocusLabel, source: 'live' },
      offenseRows: snapshot.offenseRows,
      defenseRows: snapshot.defenseRows,
      medicinePouchRow: { id: 'medicinePouch', label: 'Medicine Pouch', value: medicine.text, source: medicine.source },
      medicinePouchActionEnabled: options.medicinePouchActionEnabled ?? snapshot.sourceMode === 'stores',
      equipmentGrid: snapshot.equipmentGrid,
    },
    rewardsCard: {
      title: OUTSKIRTS_REVIEW_COPY.rewardsCardTitle,
      goldHeadline: { label: 'Gold', value: snapshot.rewardsGoldLabel, source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'derived' },
      commonMaterials: {
        title: OUTSKIRTS_REVIEW_COPY.commonMaterialsTitle,
        items: snapshot.rewardMaterialLabels.map((label) => ({
          id: normalizeEncounterId(label), label, iconKey: `${OUTSKIRTS_PLACEHOLDER_POLICY.iconFallbackPrefix}${normalizeEncounterId(label)}`,
          source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'derived',
        })),
      },
      trackedBounty: {
        title: OUTSKIRTS_REVIEW_COPY.trackedBountyTitle,
        itemLabel: snapshot.trackedBountyTitle,
        helperLine: snapshot.trackedBountyHelper,
        progressLabel: snapshot.trackedBountyProgress,
        progressCurrent: bountyProgress.current,
        progressTarget: bountyProgress.target,
        source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'live',
      },
      estimatedEfficiency: {
        title: OUTSKIRTS_REVIEW_COPY.estimatedEfficiencyTitle,
        runTimeLabel: snapshot.efficiencyRunTimeLabel,
        hourlyLabel: snapshot.efficiencyHourlyLabel,
        source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'derived',
      },
      autoRepeat: {
        label: OUTSKIRTS_REVIEW_COPY.autoRepeatLabel,
        value: autoRepeatEnabled ? 'On' : 'Off',
        enabled: autoRepeatEnabled,
        source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'derived',
      },
      innerPalacePreview: snapshot.sourceMode === 'fixture' && snapshot.innerPalacePreview
        ? cloneInnerPalacePreview(snapshot.innerPalacePreview)
        : buildInnerPalacePreviewSnapshot(snapshot.sourceMode === 'fixture' ? 'manifest' : 'live'),
    },
    encounterStrip,
    primaryAction: {
      label: activityMode === 'active' ? 'Stop Hunt' : OUTSKIRTS_REVIEW_COPY.ctaLabel,
      ariaLabel: activityMode === 'active' ? 'Stop Outskirts hunt' : 'Start Outskirts hunt',
      visible: true,
      enabled: activityMode === 'active' ? true : Boolean(snapshot.outskirtsId),
      intent: activityMode === 'active' ? 'stop-hunt' : 'start-hunt',
      singleDominantCta: true,
      isPrimary: true,
      plaqueVariant: 'ornate-gold',
      ornamentVariant: 'leaf-cap',
    },
    combatStage,
    grindSummary: {
      visible: true,
      title: OUTSKIRTS_REVIEW_COPY.grindSummaryTitle,
      scopeChipLabel: OUTSKIRTS_REVIEW_COPY.grindScope,
      runsText: snapshot.sourceMode === 'fixture' ? '128' : `${Math.max(1, Math.round(3600 / 18))}`,
      goldPerHourText: snapshot.sourceMode === 'fixture' ? '1,900' : '1,800',
      mainDropLabel: snapshot.sourceMode === 'fixture' ? 'Wolf Pelt' : (snapshot.rewardMaterialLabels[0] ?? 'Common Material'),
      mainDropIconKey: snapshot.scenicArtKey,
      rows: [
        { id: 'runs', label: 'Runs', value: snapshot.sourceMode === 'fixture' ? '128' : `${Math.max(1, Math.round(3600 / 18))}`, iconKey: 'runs' },
        { id: 'goldPerHour', label: 'Gold / hr', value: snapshot.sourceMode === 'fixture' ? '1,900' : '1,800', iconKey: 'gold' },
        { id: 'mainDrop', label: 'Main Drop', value: snapshot.sourceMode === 'fixture' ? 'Wolf Pelt' : (snapshot.rewardMaterialLabels[0] ?? 'Common Material'), iconKey: 'drop' },
      ],
    },
    shell: activityMode === 'active' ? OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL : OUTSKIRTS_ALLOWED_PLANNING_SHELL,
    debug: {
      missingDataFallbacks,
      placeholderAssetKeysInUse,
      unresolvedLiveSourceNotes,
      supportTruth: {
        roleTag: snapshot.roleTag,
        bestUsedWhen: snapshot.bestUsedWhen,
        boundaryLine: snapshot.boundaryLine,
      },
      notes,
    },
  };
}

function summarizeExpeditions(cityId: string): string {
  const active = useExpeditionStore.getState().active.filter((entry) => entry.cityId === cityId);
  if (active.length === 0) return 'No expedition';
  const running = active.filter((entry) => entry.status === 'running').length;
  const complete = active.filter((entry) => entry.status === 'complete').length;
  if (complete > 0) return `${complete} Idle`;
  if (running > 0) return `${running} Running`;
  return 'No expedition';
}

function buildEncounterNodesFromKills(killsSinceBoss: number): Array<{ id: string; label: string; state: OutskirtsEncounterNodeState }> {
  const idx = Math.max(0, Math.min(OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.length - 1, Math.floor((killsSinceBoss / 10) * OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.length)));
  return OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    state: index < idx ? 'completed' : index === idx ? 'current' : 'future',
  }));
}

export function buildOutskirtsMockupRuntimeSnapshotFromStores(cityId?: string): OutskirtsMockupRuntimeSnapshot {
  const content = useContentStore.getState();
  const ui = useUIStore.getState();
  const cityStore = useCityStore.getState();
  const resolvedCityId = cityId ?? cityStore.currentCityId ?? content.citiesSorted[0]?.id ?? 'city_pinewind_hamlet';
  const city = content.maps.citiesById[resolvedCityId];
  const outskirtsId = resolveModuleRef(city ?? null, 'outskirts');
  const outskirts = outskirtsId ? content.maps.outskirtsById[outskirtsId] : null;
  const progress = outskirtsId
    ? useOutskirtsStore.getState().progressByOutskirtsId[outskirtsId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : { killsSinceBoss: 0, totalKills: 0, bossDefeated: false };

  const rewardModel = content.raw
    ? buildOutskirtsActivityRewardReadModel(content.raw, resolvedCityId)
    : { roleTag: OUTSKIRTS_ROLE_TAG, bestUsedWhen: OUTSKIRTS_BEST_USED_WHEN, boundaryLine: OUTSKIRTS_BOUNDARY_LINE, keyExpectedOutputs: ['gold'] };

  const activity = useActivityStore.getState().active;
  const combatStore = useCombatStore.getState();
  const combatContext = combatStore.combatContext;
  const posture = evaluateCurrentCombatPostureFit('outskirts');
  const postureContext = buildCurrentCombatPostureContext('outskirts');
  const tracked = useBountyStore.getState().getTrackedBounty(resolvedCityId);
  const autoContinue = useOutskirtsStore.getState().autoContinue;
  const pouchSlots = useMedicinePouchStore.getState().slots;
  const pouch = pouchSlots.healing;
  const pouchQty = pouch?.equippedItemId ? useInventoryStore.getState().getItemCount(pouch.equippedItemId) : 0;
  const gameStats = useGameStore.getState().stats;
  const selectedLoadout = useTechniqueStore.getState().getSelectedLoadout?.();
  const selectedLoadoutName = selectedLoadout?.name ?? 'Set 2';
  const selectedAiProfile = selectedLoadout?.aiProfile ?? ui.settings.combatAIProfile;
  const attackFocusLabel = ui.settings.preferredTarget === 'boss' ? 'Boss' : ui.settings.preferredTarget === 'elite' ? 'Elite' : 'Balanced';
  const aiProfileLabel = selectedAiProfile[0].toUpperCase() + selectedAiProfile.slice(1);
  const autoUseOn = Object.values(pouchSlots).some((slot) => Boolean(slot.equippedItemId) && slot.enabled && slot.trigger !== 'manual');
  const now = Date.now();
  const activeTechniqueIds = selectedLoadout?.slots.active
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, 2) ?? [];

  const aiRecommendation = evaluateAiProfileFit({ encounterType: 'outskirts', aiProfile: selectedAiProfile, loadoutSignals: postureContext.loadoutSignals, path: postureContext.path });
  const derivedAccuracyPct = aiRecommendation.rating === 'good' ? 92 : aiRecommendation.rating === 'risky' ? 86 : 82;
  const encounterNodes = buildEncounterNodesFromKills(progress.killsSinceBoss);
  const currentProgressEncounterId = encounterNodes.find((entry) => entry.state === 'current')?.id ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID;
  const derivedResPct = (() => {
    const defense = Number(gameStats.def);
    if (!Number.isFinite(defense) || defense <= 0) return 0;
    return (defense / (defense + 250)) * 100;
  })();
  const equippedWeaponId = useEquipmentStore.getState().equippedWeaponId;
  const equippedAccessoryId = useEquipmentStore.getState().equippedAccessoryId;
  const resolveItemName = (itemId: string | null): string => itemId ? content.maps.itemsById[itemId]?.name ?? itemId : OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;

  const hasSameSourceOutskirtsCombat = isSameOutskirtsCombatSource(resolvedCityId, outskirts?.id ?? null, combatContext);
  const hasSameSourceOutskirtsActivity = isSameOutskirtsActivitySource(resolvedCityId, outskirts?.id ?? null, activity);
  const isOutskirtsActive = hasSameSourceOutskirtsActivity || hasSameSourceOutskirtsCombat;
  const isBossFight = Boolean((combatContext.type === 'outskirts' && combatContext.isBoss) || combatStore.isBoss || combatStore.currentEnemy?.isBoss);
  const activeTechniques = activeTechniqueIds.map((techId) => ({
    id: techId,
    name: content.maps.techniquesById[techId]?.name ?? techId,
    readyAt: hasSameSourceOutskirtsCombat ? (combatStore.techniqueCooldowns[techId] ?? null) : null,
  }));
  const combatStage = (() => {
    if (!isOutskirtsActive) return buildInactiveCombatStage('planning');
    if (hasSameSourceOutskirtsCombat && combatStore.currentEnemy) {
      return buildLiveCombatStageFromStores({
        lifecycle: 'active',
        playerHp: combatStore.playerHP,
        playerMaxHp: combatStore.playerMaxHP,
        enemyHp: combatStore.enemyHP,
        enemyMaxHp: combatStore.enemyMaxHP,
        enemy: combatStore.currentEnemy,
        combatLog: combatStore.combatLog,
        combatEvents: combatStore.events,
        aiProfileLabel,
        autoUseOn,
        killsToBoss: outskirts?.killsToBoss ?? 10,
        killsSinceBoss: progress.killsSinceBoss,
        isBossFight,
        activeTechniques,
        now,
      });
    }
    return buildStartingCombatStage({
      lifecycle: 'active',
      playerHpCurrent: toSafeCombatNumber(gameStats.maxHp),
      playerHpMax: toSafeCombatNumber(gameStats.maxHp),
      aiProfileLabel,
      autoUseOn,
      killsToBoss: outskirts?.killsToBoss ?? 10,
      killsSinceBoss: progress.killsSinceBoss,
      isBossFight,
      activeTechniques,
    });
  })();
  const combatHpLabel = hasSameSourceOutskirtsCombat
    ? combatStage.player.hpLabel
    : `${formatWhole(gameStats.maxHp)} / ${formatWhole(gameStats.maxHp)}`;

  return {
    sourceMode: 'stores',
    cityId: resolvedCityId,
    cityName: city?.name ?? 'Unknown City',
    outskirtsId: outskirts?.id ?? null,
    outskirtsLabel: outskirts?.name ?? 'Outskirts',
    killsSinceBoss: progress.killsSinceBoss,
    killsToBoss: outskirts?.killsToBoss ?? 10,
    totalKills: progress.totalKills,
    isOutskirtsActive,
    hpLabel: combatHpLabel,
    dangerLabel: 'Low',
    loadoutLabel: selectedLoadoutName,
    aiProfile: selectedAiProfile,
    aiProfileLabel,
    attackFocusLabel,
    medicinePouchLabel: `${pouchQty} / 20`,
    bountyLabel: tracked ? `${tracked.title} ${tracked.progress}/${tracked.target}` : null,
    expeditionLabel: summarizeExpeditions(resolvedCityId),
    offenseRows: [
      { id: 'atk', label: 'ATK', value: formatWhole(gameStats.atk), source: 'derived' },
      { id: 'acc', label: 'ACC', value: formatPercent(derivedAccuracyPct), source: 'derived' },
      { id: 'crit', label: 'CRIT', value: formatPercent(gameStats.crit), source: 'derived' },
    ],
    defenseRows: [
      { id: 'hp', label: 'HP', value: formatWhole(gameStats.maxHp), source: 'derived' },
      { id: 'eva', label: 'EVA', value: formatPercent(gameStats.dodge), source: 'derived' },
      { id: 'res', label: 'RES', value: formatPercent(derivedResPct), source: 'derived' },
    ],
    equipmentGrid: [
      { slotId: 'weapon', label: 'Weapon', iconKey: 'weapon', value: resolveItemName(equippedWeaponId), source: equippedWeaponId ? 'live' : 'synthetic' },
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
      { slotId: 'ring', label: 'Ring', iconKey: 'ring', value: resolveItemName(equippedAccessoryId), source: equippedAccessoryId ? 'derived' : 'synthetic' },
      { slotId: 'talisman', label: 'Talisman', iconKey: 'talisman', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
      { slotId: 'boots', label: 'Boots', iconKey: 'boots', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
      { slotId: 'charm', label: 'Charm', iconKey: 'charm', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
    ],
    rewardsGoldLabel: '1,250 – 1,480',
    rewardMaterialLabels: ['Wolf Pelt', 'Beast Bone', 'Green Herb', 'Spirit Stone'],
    trackedBountyTitle: tracked?.title ?? 'None',
    trackedBountyHelper: 'Defeat wolves in the Outskirts',
    trackedBountyProgress: tracked ? `${tracked.progress} / ${tracked.target}` : '0 / 0',
    efficiencyRunTimeLabel: '~45s / run',
    efficiencyHourlyLabel: '1,800 – 2,000 / hour',
    autoRepeatLabel: autoContinue ? 'On' : 'Off',
    autoRepeatEnabled: autoContinue,
    selectedEncounterId: currentProgressEncounterId,
    selectedEncounterName: 'Snarling Wolf',
    selectedEncounterLevelLabel: 'Lv. 11',
    safetyChipState: posture.warnings.length > 0 ? 'watch' : 'safe',
    safetyChipLabel: posture.warnings.length > 0 ? 'Watch' : 'Safe',
    scenicArtKey: OUTSKIRTS_PLACEHOLDER_POLICY.encounterFallbackKey,
    scenicBackgroundKey: OUTSKIRTS_PLACEHOLDER_POLICY.scenicFallbackKey,
    encounterDescriptor: 'Outskirts lane',
    encounterNodes,
    canMoveEncounterLeft: false,
    canMoveEncounterRight: true,
    roleTag: rewardModel.roleTag,
    bestUsedWhen: rewardModel.bestUsedWhen,
    boundaryLine: rewardModel.boundaryLine,
    pageSubtitle: OUTSKIRTS_REVIEW_COPY.subtitle,
    supportHints: [],
    combatStage,
  };
}

export function buildOutskirtsMockupSurfaceFromStores(
  cityId?: string,
  options: BuildOutskirtsMockupSurfaceOptions = {},
): OutskirtsExactSurfaceV2 {
  return buildOutskirtsMockupSurface(buildOutskirtsMockupRuntimeSnapshotFromStores(cityId), options);
}
