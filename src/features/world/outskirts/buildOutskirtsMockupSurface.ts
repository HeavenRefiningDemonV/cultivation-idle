import { OUTSKIRTS_BEST_USED_WHEN, OUTSKIRTS_BOUNDARY_LINE, OUTSKIRTS_ROLE_TAG, buildOutskirtsActivityRewardReadModel } from '../../../systems/economy/activityRewardReadModel.js';
import { buildCurrentCombatPostureContext, evaluateCurrentCombatPostureFit } from '../../../systems/builds/combatPostureFit.js';
import { evaluateAiProfileFit } from '../../../systems/builds/aiProfileFit.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
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
import {
  OUTSKIRTS_ALLOWED_PLANNING_SHELL,
  OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID,
  OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST,
  OUTSKIRTS_MOCKUP_COPY,
  OUTSKIRTS_MOCKUP_VERSION,
  OUTSKIRTS_PLACEHOLDER_POLICY,
  OUTSKIRTS_TACTICAL_CELL_ORDER,
} from './outskirtsMockupPresentation.js';
import type {
  OutskirtsEncounterNodeState,
  OutskirtsMockupEncounterProgressStrip,
  OutskirtsMockupEncounterChainNode,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsMockupSurface,
  OutskirtsSurfaceValueSource,
  OutskirtsTacticalTone,
} from './types.js';

function asText(value: string | null | undefined, fallback: string): { text: string; source: OutskirtsSurfaceValueSource } {
  if (value && value.trim().length > 0) {
    return { text: value, source: 'live' };
  }
  return { text: fallback, source: 'synthetic' };
}

function resolveDangerTone(killsSinceBoss: number, killsToBoss: number): OutskirtsTacticalTone {
  const ratio = killsToBoss <= 0 ? 1 : killsSinceBoss / killsToBoss;
  if (ratio >= 1) return 'warning';
  if (ratio >= 0.7) return 'neutral';
  return 'positive';
}

function resolveSafetyFromPosture(cityId: string): { label: string; state: OutskirtsMockupRuntimeSnapshot['safetyChipState'] } {
  const fit = evaluateCurrentCombatPostureFit('outskirts');
  if (fit.aiFit === 'good' && fit.pouchFit === 'good') return { label: 'Safe', state: 'safe' };
  if (fit.aiFit === 'risky' || fit.pouchFit === 'risky') return { label: 'Watch', state: 'watch' };
  if (fit.aiFit === 'bad' || fit.pouchFit === 'bad') return { label: 'Risk', state: 'risk' };
  return { label: cityId.includes('pinewind') ? 'Watch' : 'Risk', state: 'watch' };
}

function resolveScenicImageSrc(scenicBackgroundKey: string): string | null {
  if (scenicBackgroundKey.startsWith('placeholder/scenic/outskirts-field')) return '/assets/background/citystates/city_outskirts.png';
  if (scenicBackgroundKey.includes('outskirts')) return '/assets/background/citystates/city_outskirts.png';
  return '/assets/background/citystates/city_outskirts.png';
}

function formatWhole(value: number | string): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;
  return `${Math.max(0, Math.round(numeric))}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;
  const clamped = Math.max(0, Math.min(100, value));
  return `${clamped.toFixed(0)}%`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function parseHpLabel(hpLabel: string): { current: number; max: number } {
  const matches = hpLabel.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!matches) return { current: 0, max: 0 };
  const current = Number(matches[1].replace(/,/g, ''));
  const max = Number(matches[2].replace(/,/g, ''));
  return {
    current: Number.isFinite(current) ? current : 0,
    max: Number.isFinite(max) ? max : 0,
  };
}

function formatHpCell(snapshot: OutskirtsMockupRuntimeSnapshot): { primaryText: string; underlineBarPct: number } {
  const parsed = parseHpLabel(snapshot.hpLabel);
  if (parsed.max > 0) {
    return {
      primaryText: `${formatWhole(parsed.current)} / ${formatWhole(parsed.max)}`,
      underlineBarPct: clamp01(parsed.current / parsed.max) * 100,
    };
  }
  const fallbackMax = Number(snapshot.defenseRows.find((entry) => entry.id === 'hp')?.value ?? 0);
  const normalized = Number.isFinite(fallbackMax) && fallbackMax > 0 ? Math.round(fallbackMax) : 0;
  return {
    primaryText: `${formatWhole(normalized)} / ${formatWhole(normalized)}`,
    underlineBarPct: normalized > 0 ? 100 : 0,
  };
}

function formatDangerCell(snapshot: OutskirtsMockupRuntimeSnapshot): string {
  const level = snapshot.selectedEncounterLevelLabel.match(/\d+/)?.[0] ?? '1';
  const bossReady = snapshot.killsSinceBoss >= snapshot.killsToBoss;
  const qualitative = bossReady ? 'Boss' : snapshot.safetyChipState === 'safe' ? 'Low' : snapshot.safetyChipState === 'watch' ? 'Guarded' : 'Risk';
  return `${qualitative} · Lv. ${level}`;
}

function normalizeLoadoutCell(label: string): string {
  const match = label.match(/set\s*(\d+)/i) ?? label.match(/loadout\s*(\d+)/i) ?? label.match(/(\d+)/);
  return match ? `Set ${match[1]}` : 'Set 1';
}

function normalizeAiProfileCell(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'Balanced';
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}

function formatHealingCell(label: string | null): string {
  if (!label) return '0 / 20';
  const match = label.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!match) return '0 / 20';
  return `${match[1].replace(/,/g, '')} / ${match[2].replace(/,/g, '')}`;
}

function formatBountyCell(label: string | null): string {
  if (!label) return OUTSKIRTS_MOCKUP_COPY.fallbackBountyLine;
  const normalized = label.replace(/\s*:\s*/, ' ').replace(/\s*•.*$/i, '').trim();
  return normalized.length > 24 ? `${normalized.slice(0, 21).trimEnd()}…` : normalized;
}

function formatExpeditionCell(label: string): { primaryText: string; showDot: boolean } {
  const idle = Number(label.match(/(\d+)\s*(idle|complete)/i)?.[1] ?? 0);
  const running = Number(label.match(/(\d+)\s*running/i)?.[1] ?? 0);
  if (idle > 0) return { primaryText: `${idle} Idle`, showDot: true };
  if (running > 0) return { primaryText: `${running} Running`, showDot: false };
  return { primaryText: 'No expedition', showDot: false };
}

function buildEncounterNodes(killsSinceBoss: number): OutskirtsMockupEncounterChainNode[] {
  const idx = Math.max(0, Math.min(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.length - 1, Math.floor((killsSinceBoss / 10) * OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.length)));
  return OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry, index) => {
    const state: OutskirtsEncounterNodeState = index < idx ? 'completed' : index === idx ? 'current' : 'future';
    return {
      id: entry.id,
      label: entry.label,
      state,
      thumbnailKey: `${OUTSKIRTS_PLACEHOLDER_POLICY.iconFallbackPrefix}${entry.id}`,
      stateLabel: state === 'completed' ? 'Cleared' : state === 'current' ? 'Current' : 'Future',
    };
  });
}

function normalizeEncounterId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildEncounterProgressStrip(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupEncounterProgressStrip {
  const selectedId = normalizeEncounterId(snapshot.selectedEncounterId);
  const fallbackCurrentId = snapshot.encounterNodes.find((node) => node.state === 'current')?.id ?? OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID;
  const currentId = [selectedId, normalizeEncounterId(fallbackCurrentId), OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID]
    .find((id) => OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.some((entry) => entry.id === id))
    ?? OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID;
  const currentIndex = OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.findIndex((entry) => entry.id === currentId);

  return {
    leftArrow: {
      visible: true,
      enabled: false,
      ariaLabel: 'Previous encounter (presentation-only; unavailable in P7)',
    },
    rightArrow: {
      visible: true,
      enabled: false,
      ariaLabel: 'Next encounter (presentation-only; unavailable in P7)',
    },
    nodes: OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry, index) => {
      const state: OutskirtsEncounterNodeState = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'future';
      return {
        id: entry.id,
        label: entry.label,
        displayLevelText: entry.displayLevelText,
        state,
        artKey: state === 'future' ? undefined : entry.artKey,
        silhouetteKey: state === 'future' ? entry.silhouetteKey : undefined,
        isSelected: index === currentIndex,
        isClickable: false,
        ariaLabel: `${entry.label} ${entry.displayLevelText ?? ''} ${state}`.trim(),
      };
    }),
  };
}

function buildGrindSummary(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupSurface['grindSummary'] {
  if (snapshot.sourceMode === 'fixture') {
    return {
      visible: true,
      title: OUTSKIRTS_MOCKUP_COPY.grindSummaryTitle,
      runsText: `Runs: ${snapshot.totalKills}`,
      goldPerHourText: 'Gold / hr: 1,900',
      mainDropLabel: 'Wolf Pelt',
      mainDropIconKey: snapshot.scenicArtKey,
      areaFilterText: 'This Area',
      rewardIconKeys: snapshot.expectedRewards.map((entry) => `${OUTSKIRTS_PLACEHOLDER_POLICY.iconFallbackPrefix}${entry.id}`).slice(0, 3),
      progressText: undefined,
    };
  }

  const mainDrop = snapshot.expectedRewards.find((entry) => entry.id !== 'gold')?.value ?? 'Broad field drops';
  const safeRunsPerHour = Math.max(1, Math.round(3600 / 18));
  const estimatedGoldPerHour = Math.max(1, safeRunsPerHour * 150);
  return {
    visible: true,
    title: OUTSKIRTS_MOCKUP_COPY.grindSummaryTitle,
    runsText: `${safeRunsPerHour} runs / hr (est.)`,
    goldPerHourText: `${estimatedGoldPerHour.toLocaleString()} gold / hr (est.)`,
    mainDropLabel: mainDrop,
    mainDropIconKey: snapshot.scenicArtKey,
    areaFilterText: snapshot.boundaryLine,
    rewardIconKeys: snapshot.expectedRewards.map((entry) => `${OUTSKIRTS_PLACEHOLDER_POLICY.iconFallbackPrefix}${entry.id}`).slice(0, 3),
    progressText: `Boss cadence ${snapshot.killsSinceBoss} / ${snapshot.killsToBoss}`,
  };
}

export function buildOutskirtsMockupSurface(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupSurface {
  const fallbacks: string[] = [];
  const unresolved: string[] = [];
  const placeholders = [snapshot.scenicArtKey, snapshot.scenicBackgroundKey].filter((entry) => entry.startsWith('placeholder/'));
  const currentProgressIndex = snapshot.encounterNodes.findIndex((node) => node.state === 'current');

  const medicine = asText(snapshot.medicinePouchLabel, '0 / 20');
  if (medicine.source !== 'live') fallbacks.push('medicinePouchLabel');
  const bounty = asText(snapshot.bountyLabel, OUTSKIRTS_MOCKUP_COPY.fallbackBountyLine);
  if (bounty.source !== 'live') fallbacks.push('bountyLabel');
  const hp = formatHpCell(snapshot);
  const expedition = formatExpeditionCell(snapshot.expeditionLabel);

  const tacticalCells = {
    hp: { id: 'hp', label: 'HP', primaryText: hp.primaryText, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'hp', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: hp.underlineBarPct, reserveAdornmentSpace: true, visible: true },
    danger: { id: 'danger', label: 'Danger', primaryText: formatDangerCell(snapshot), tone: resolveDangerTone(snapshot.killsSinceBoss, snapshot.killsToBoss), iconKey: 'danger', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
    loadout: { id: 'loadout', label: 'Loadout', primaryText: normalizeLoadoutCell(snapshot.loadoutLabel), tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'loadout', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
    aiProfile: { id: 'aiProfile', label: 'AI Profile', primaryText: normalizeAiProfileCell(snapshot.aiProfileLabel), tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'aiProfile', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
    healing: { id: 'healing', label: 'Healing', primaryText: formatHealingCell(medicine.text), tone: medicine.source === 'live' ? 'positive' : 'warning' as OutskirtsTacticalTone, iconKey: 'healing', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
    bounty: { id: 'bounty', label: 'Bounty', primaryText: formatBountyCell(bounty.text), tone: bounty.source === 'live' ? 'positive' : 'neutral' as OutskirtsTacticalTone, iconKey: 'bounty', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
    expedition: { id: 'expedition', label: 'Expedition', primaryText: expedition.primaryText, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'expedition', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: expedition.showDot, showUnderlineBar: false, reserveAdornmentSpace: true, visible: true },
  } as const;

  const ownershipNote = snapshot.isOutskirtsActive
    ? 'Active Outskirts combat still renders the legacy combat shell owner.'
    : 'Planning exact surface is a review fixture and does not change baseline live-screen ownership in P0.';

  return {
    meta: {
      surfaceId: 'outskirts-exact-mockup',
      version: OUTSKIRTS_MOCKUP_VERSION,
      sourceMode: snapshot.sourceMode,
      cityId: snapshot.cityId,
      outskirtsId: snapshot.outskirtsId,
      planningState: true,
      exactMockup: true,
    },
    header: {
      pageTitle: OUTSKIRTS_MOCKUP_COPY.pageTitle,
      subtitle: OUTSKIRTS_MOCKUP_COPY.pageSubtitleFallback,
      areaPlaqueLabel: OUTSKIRTS_MOCKUP_COPY.pageTitle,
      roleTag: snapshot.roleTag,
      bestUsedWhen: snapshot.bestUsedWhen,
      boundaryLine: snapshot.boundaryLine,
    },
    topProgress: {
      label: OUTSKIRTS_MOCKUP_COPY.topProgressLabel,
      helperText: `Boss in ${Math.max(0, snapshot.killsToBoss - snapshot.killsSinceBoss)} kills`,
      decorative: true,
      leftOrnament: 'vine',
      terminalCap: 'temple',
      nodes: snapshot.encounterNodes.map((node, index) => ({
        id: node.id,
        label: node.label,
        state: node.state,
        variant: index === (currentProgressIndex >= 0 ? currentProgressIndex : 0) ? 'active' : 'muted',
      })),
    },
    tacticalStrip: {
      label: 'Tactical Readout',
      cells: OUTSKIRTS_TACTICAL_CELL_ORDER.map((id) => tacticalCells[id]) as OutskirtsMockupSurface['tacticalStrip']['cells'],
    },
    setupCard: {
      title: OUTSKIRTS_MOCKUP_COPY.setupCardTitle,
      loadoutSet: { id: 'loadoutSet', label: 'Loadout Set', value: snapshot.loadoutLabel, source: 'live' },
      aiProfile: { id: 'aiProfile', label: 'AI Profile', value: snapshot.aiProfileLabel, source: 'live' },
      attackFocus: { id: 'attackFocus', label: 'Attack Focus', value: snapshot.attackFocusLabel, source: 'live' },
      offense: snapshot.offenseRows,
      defense: snapshot.defenseRows,
      medicinePouch: { id: 'medicinePouch', label: 'Medicine Pouch', value: medicine.text, source: medicine.source },
      equipmentGrid: snapshot.equipmentGrid,
    },
    rewardsCard: {
      title: OUTSKIRTS_MOCKUP_COPY.rewardsCardTitle,
      expectedRewards: snapshot.expectedRewards,
      guaranteedOrLikely: snapshot.guaranteedOrLikely,
      bountyOverlap: snapshot.bountyOverlap,
      efficiency: snapshot.efficiencyRows,
      cadenceSupport: snapshot.cadenceSupport,
      noPrimaryCta: true,
    },
    encounterHero: {
      selectedEncounterId: snapshot.selectedEncounterId,
      encounterDisplayName: snapshot.selectedEncounterName,
      encounterLevelLabel: snapshot.selectedEncounterLevelLabel,
      safetyChip: { state: snapshot.safetyChipState, label: snapshot.safetyChipLabel },
      scenicArtKey: snapshot.scenicArtKey,
      scenicBackgroundKey: snapshot.scenicBackgroundKey,
      scenicImageSrc: resolveScenicImageSrc(snapshot.scenicBackgroundKey),
      descriptor: snapshot.encounterDescriptor || OUTSKIRTS_MOCKUP_COPY.fallbackEncounterDescriptor,
    },
    encounterChain: {
      nodes: snapshot.encounterNodes,
      canMoveLeft: snapshot.canMoveEncounterLeft,
      canMoveRight: snapshot.canMoveEncounterRight,
      connectorState: snapshot.encounterNodes.every((node) => node.state === 'completed') ? 'complete' : 'partial',
    },
    encounterProgressStrip: buildEncounterProgressStrip(snapshot),
    primaryCta: {
      label: OUTSKIRTS_MOCKUP_COPY.fallbackCtaLabel,
      ariaLabel: 'Start Outskirts hunt',
      visible: true,
      enabled: Boolean(snapshot.outskirtsId) && !snapshot.isOutskirtsActive,
      disabledReason: snapshot.isOutskirtsActive ? 'Outskirts run already active.' : undefined,
      isPrimary: true,
    },
    actionZone: {
      primaryCtaLabel: OUTSKIRTS_MOCKUP_COPY.fallbackCtaLabel,
      primaryCtaIntent: 'start-hunt',
      primaryCtaTone: 'primary',
      primaryCtaEnabled: Boolean(snapshot.outskirtsId),
      secondaryHints: snapshot.supportHints,
      singleDominantCta: true,
    },
    grindSummary: buildGrindSummary(snapshot),
    shell: OUTSKIRTS_ALLOWED_PLANNING_SHELL,
    debug: {
      missingDataFallbacks: fallbacks,
      placeholderAssetKeysInUse: placeholders,
      unresolvedSourceFields: unresolved,
      notes: [ownershipNote],
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
  const posture = evaluateCurrentCombatPostureFit('outskirts');
  const postureContext = buildCurrentCombatPostureContext('outskirts');
  const tracked = useBountyStore.getState().getTrackedBounty(resolvedCityId);
  const trackedText = tracked ? `${tracked.title}: ${tracked.progress} / ${tracked.target}${tracked.progress >= tracked.target ? ' • Ready' : ''}` : null;
  const pouch = useMedicinePouchStore.getState().slots.healing;
  const pouchName = pouch?.equippedItemId ? content.maps.itemsById[pouch.equippedItemId]?.name ?? pouch.equippedItemId : null;
  const pouchQty = pouch?.equippedItemId ? useInventoryStore.getState().getItemCount(pouch.equippedItemId) : 0;
  const gameStats = useGameStore.getState().stats;
  const selectedLoadout = useTechniqueStore.getState().getSelectedLoadout?.();
  const selectedLoadoutName = selectedLoadout?.name ?? 'Loadout 1';
  const selectedAiProfile = selectedLoadout?.aiProfile ?? ui.settings.combatAIProfile;
  const selectedLoadoutMatch = selectedLoadoutName.match(/(\d+)/);
  const selectedLoadoutLabel = selectedLoadoutMatch ? `Set ${selectedLoadoutMatch[1]}` : selectedLoadoutName;
  const attackFocusLabel = ui.settings.preferredTarget === 'boss'
    ? 'Boss'
    : ui.settings.preferredTarget === 'elite'
      ? 'Elite'
      : 'Weakest';

  const aiRecommendation = evaluateAiProfileFit({
    encounterType: 'outskirts',
    aiProfile: selectedAiProfile,
    loadoutSignals: postureContext.loadoutSignals,
    path: postureContext.path,
  });
  const safety = resolveSafetyFromPosture(resolvedCityId);
  const derivedAccuracyPct = aiRecommendation.rating === 'good'
    ? 92
    : aiRecommendation.rating === 'risky'
      ? 86
      : 82;
  const derivedResPct = (() => {
    const defense = Number(gameStats.def);
    if (!Number.isFinite(defense) || defense <= 0) return 0;
    return (defense / (defense + 250)) * 100;
  })();
  const equippedWeaponId = useEquipmentStore.getState().equippedWeaponId;
  const equippedAccessoryId = useEquipmentStore.getState().equippedAccessoryId;
  const resolveItemName = (itemId: string | null): string =>
    itemId ? content.maps.itemsById[itemId]?.name ?? itemId : OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;

  return {
    sourceMode: 'stores',
    cityId: resolvedCityId,
    cityName: city?.name ?? 'Unknown City',
    outskirtsId: outskirts?.id ?? null,
    outskirtsLabel: outskirts?.name ?? 'Outskirts',
    killsSinceBoss: progress.killsSinceBoss,
    killsToBoss: outskirts?.killsToBoss ?? 10,
    totalKills: progress.totalKills,
    isOutskirtsActive: activity?.type === 'outskirts' && activity.cityId === resolvedCityId,
    hpLabel: `${formatWhole(gameStats.maxHp)} / ${formatWhole(gameStats.maxHp)}`,
    dangerLabel: progress.killsSinceBoss >= (outskirts?.killsToBoss ?? 10) ? 'Boss' : 'Low',
    loadoutLabel: selectedLoadoutLabel,
    aiProfile: selectedAiProfile,
    aiProfileLabel: selectedAiProfile[0].toUpperCase() + selectedAiProfile.slice(1),
    attackFocusLabel,
    medicinePouchLabel: pouchName ? `${pouchQty} / 20` : '0 / 20',
    bountyLabel: trackedText,
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
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: resolveItemName(equippedAccessoryId), source: equippedAccessoryId ? 'live' : 'synthetic' },
      { slotId: 'ring', label: 'Ring', iconKey: 'ring', value: resolveItemName(equippedAccessoryId), source: equippedAccessoryId ? 'derived' : 'synthetic' },
      { slotId: 'talisman', label: 'Talisman', iconKey: 'talisman', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
      { slotId: 'boots', label: 'Boots', iconKey: 'boots', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
      { slotId: 'charm', label: 'Charm', iconKey: 'charm', value: OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback, source: 'synthetic' },
    ],
    expectedRewards: [
      { id: 'gold', label: 'Gold', value: 'Steady baseline income', source: 'derived' },
      { id: 'common', label: 'Common Materials', value: rewardModel.keyExpectedOutputs.filter((id) => id !== 'gold').slice(0, 3).join(', ') || 'Broad field drops', source: 'derived' },
    ],
    guaranteedOrLikely: [
      { id: 'role', label: 'Role', value: OUTSKIRTS_ROLE_TAG, source: 'manifest' },
      { id: 'boundary', label: 'Boundary', value: OUTSKIRTS_BOUNDARY_LINE, source: 'manifest' },
    ],
    bountyOverlap: { id: 'bounty', label: 'Tracked Bounty', value: trackedText ?? OUTSKIRTS_MOCKUP_COPY.fallbackBountyLine, source: trackedText ? 'live' : 'synthetic' },
    efficiencyRows: [
      { id: 'best-used', label: 'Best used when', value: OUTSKIRTS_BEST_USED_WHEN, source: 'manifest' },
      { id: 'profile', label: 'AI fit', value: aiRecommendation.rating, source: 'derived' },
    ],
    cadenceSupport: { id: 'cadence', label: 'Cadence', value: `Boss in ${Math.max(0, (outskirts?.killsToBoss ?? 10) - progress.killsSinceBoss)} kills`, source: 'derived' },
    selectedEncounterId: 'quiet-glade',
    selectedEncounterName: 'Field Patrol',
    selectedEncounterLevelLabel: `Lv. ${Math.max(1, (outskirts?.cityIndex ?? 0) * 5 + 10)}`,
    safetyChipState: safety.state,
    safetyChipLabel: safety.label,
    scenicArtKey: OUTSKIRTS_PLACEHOLDER_POLICY.encounterFallbackKey,
    scenicBackgroundKey: OUTSKIRTS_PLACEHOLDER_POLICY.scenicFallbackKey,
    encounterDescriptor: posture.warnings[0] ?? OUTSKIRTS_MOCKUP_COPY.fallbackEncounterDescriptor,
    encounterNodes: buildEncounterNodes(progress.killsSinceBoss),
    canMoveEncounterLeft: false,
    canMoveEncounterRight: true,
    roleTag: rewardModel.roleTag,
    bestUsedWhen: rewardModel.bestUsedWhen,
    boundaryLine: rewardModel.boundaryLine,
    pageSubtitle: OUTSKIRTS_MOCKUP_COPY.pageSubtitleFallback,
    supportHints: [],
  };
}

export function buildOutskirtsMockupSurfaceFromStores(cityId?: string): OutskirtsMockupSurface {
  return buildOutskirtsMockupSurface(buildOutskirtsMockupRuntimeSnapshotFromStores(cityId));
}
