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
  OUTSKIRTS_ENCOUNTER_DEFAULT_ID,
  OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST,
  OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC,
  OUTSKIRTS_MOCKUP_VERSION,
  OUTSKIRTS_PLACEHOLDER_POLICY,
  OUTSKIRTS_REVIEW_COPY,
  OUTSKIRTS_TACTICAL_CELL_ORDER,
  OUTSKIRTS_TARGET_MOCKUP_ID,
} from './outskirtsMockupPresentation.js';
import type {
  OutskirtsEncounterNodeState,
  OutskirtsExactSurfaceV2,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsSurfaceValueSource,
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

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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

function resolveScenicImageSrc(sourceMode: OutskirtsMockupRuntimeSnapshot['sourceMode']): string | null {
  return sourceMode === 'fixture'
    ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC
    : '/assets/background/citystates/city_outskirts.png';
}

function buildEncounterStrip(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsExactSurfaceV2['encounterStrip'] {
  const selected = normalizeEncounterId(snapshot.selectedEncounterId);
  const fallback = snapshot.encounterNodes.find((node) => node.state === 'current')?.id ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID;
  const selectedEncounterId = [selected, normalizeEncounterId(fallback), OUTSKIRTS_ENCOUNTER_DEFAULT_ID]
    .find((id) => OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.some((entry) => entry.id === id)) ?? OUTSKIRTS_ENCOUNTER_DEFAULT_ID;
  const selectedIndex = OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.findIndex((entry) => entry.id === selectedEncounterId);

  return {
    selectedEncounterId,
    leftArrow: { visible: true, enabled: false, ariaLabel: 'Previous encounter (presentation only)' },
    rightArrow: { visible: true, enabled: false, ariaLabel: 'Next encounter (presentation only)' },
    nodes: OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry, index) => {
      const state: OutskirtsEncounterNodeState = index < selectedIndex ? 'completed' : index === selectedIndex ? 'current' : 'future';
      return {
        id: entry.id,
        label: entry.label,
        levelLabel: entry.levelLabel,
        state,
        artKey: state === 'future' ? undefined : entry.artKey,
        silhouetteKey: state === 'future' ? entry.silhouetteKey : undefined,
        isSelected: index === selectedIndex,
        isClickable: false,
        ariaLabel: `${entry.label} ${entry.levelLabel} ${state}`,
      };
    }),
  };
}

export function buildOutskirtsMockupSurface(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsExactSurfaceV2 {
  const missingDataFallbacks: string[] = [];
  const unresolvedLiveSourceNotes: string[] = [];
  const placeholderAssetKeysInUse = [snapshot.scenicArtKey, snapshot.scenicBackgroundKey].filter((k) => k.startsWith('placeholder/'));

  const medicine = asText(snapshot.medicinePouchLabel, '0 / 20');
  const bounty = asText(snapshot.bountyLabel, 'No tracked bounty');
  if (medicine.source !== 'live') missingDataFallbacks.push('medicinePouchLabel');
  if (bounty.source !== 'live') missingDataFallbacks.push('bountyLabel');

  const hp = parseHpLabel(snapshot.hpLabel);
  const hpPrimary = hp.max > 0 ? `${formatWhole(hp.current)} / ${formatWhole(hp.max)}` : snapshot.hpLabel;
  const topNodes = buildEncounterStrip(snapshot).nodes;

  const tacticalCells = {
    hp: { id: 'hp', label: 'HP', primaryText: hpPrimary, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'hp', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: clamp01(hp.max > 0 ? hp.current / hp.max : 1) * 100, visible: true, reserveAdornmentSpace: true },
    danger: { id: 'danger', label: 'Danger', primaryText: formatDangerCell(snapshot), tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'danger', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    loadout: { id: 'loadout', label: 'Loadout', primaryText: snapshot.loadoutLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'loadout', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    aiProfile: { id: 'aiProfile', label: 'AI Profile', primaryText: snapshot.aiProfileLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'aiProfile', iconKind: 'lucide' as const, showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    healing: { id: 'healing', label: 'Healing', primaryText: medicine.text, tone: medicine.source === 'live' ? 'positive' : 'warning' as OutskirtsTacticalTone, iconKey: 'healing', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    bounty: { id: 'bounty', label: 'Bounty', primaryText: bounty.text, tone: bounty.source === 'live' ? 'positive' : 'neutral' as OutskirtsTacticalTone, iconKey: 'bounty', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
    expedition: { id: 'expedition', label: 'Expedition', primaryText: snapshot.expeditionLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'expedition', iconKind: 'lucide' as const, showCaret: false, showNotificationDot: /idle/i.test(snapshot.expeditionLabel), showUnderlineBar: false, visible: true, reserveAdornmentSpace: true },
  } as const;

  const notes = [snapshot.isOutskirtsActive
    ? 'Active Outskirts combat still renders the legacy combat shell owner.'
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
      subtitle: snapshot.pageSubtitle,
      showDropdownCaret: true,
    },
    scenicStage: {
      scenicBackgroundKey: snapshot.scenicBackgroundKey,
      scenicImageSrc: resolveScenicImageSrc(snapshot.sourceMode),
      reviewFixtureImageSrc: snapshot.sourceMode === 'fixture' ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC : null,
      liveFallbackImageSrc: '/assets/background/citystates/city_outskirts.png',
      useApprovedMockupCrop: snapshot.sourceMode === 'fixture',
      encounterArtKey: snapshot.scenicArtKey,
      environmentDescriptor: snapshot.encounterDescriptor,
    },
    encounterIdentity: {
      selectedEncounterId: snapshot.selectedEncounterId,
      displayName: snapshot.selectedEncounterName,
      levelLabel: snapshot.selectedEncounterLevelLabel,
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
        value: snapshot.autoRepeatLabel,
        enabled: /^on$/i.test(snapshot.autoRepeatLabel),
        source: snapshot.sourceMode === 'fixture' ? 'manifest' : 'derived',
      },
    },
    encounterStrip: buildEncounterStrip(snapshot),
    primaryAction: {
      label: OUTSKIRTS_REVIEW_COPY.ctaLabel,
      ariaLabel: 'Start Outskirts hunt',
      visible: true,
      enabled: Boolean(snapshot.outskirtsId) && !snapshot.isOutskirtsActive,
      intent: 'start-hunt',
      singleDominantCta: true,
      isPrimary: true,
      disabledReason: snapshot.isOutskirtsActive ? 'Outskirts run already active.' : undefined,
    },
    grindSummary: {
      visible: true,
      title: OUTSKIRTS_REVIEW_COPY.grindSummaryTitle,
      scopeChipLabel: OUTSKIRTS_REVIEW_COPY.grindScope,
      runsText: snapshot.sourceMode === 'fixture' ? '128' : `${Math.max(1, Math.round(3600 / 18))}`,
      goldPerHourText: snapshot.sourceMode === 'fixture' ? '1,900' : '1,800',
      mainDropLabel: snapshot.sourceMode === 'fixture' ? 'Wolf Pelt' : (snapshot.rewardMaterialLabels[0] ?? 'Common Material'),
      mainDropIconKey: snapshot.scenicArtKey,
    },
    shell: OUTSKIRTS_ALLOWED_PLANNING_SHELL,
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
  const posture = evaluateCurrentCombatPostureFit('outskirts');
  const postureContext = buildCurrentCombatPostureContext('outskirts');
  const tracked = useBountyStore.getState().getTrackedBounty(resolvedCityId);
  const pouch = useMedicinePouchStore.getState().slots.healing;
  const pouchQty = pouch?.equippedItemId ? useInventoryStore.getState().getItemCount(pouch.equippedItemId) : 0;
  const gameStats = useGameStore.getState().stats;
  const selectedLoadout = useTechniqueStore.getState().getSelectedLoadout?.();
  const selectedLoadoutName = selectedLoadout?.name ?? 'Set 2';
  const selectedAiProfile = selectedLoadout?.aiProfile ?? ui.settings.combatAIProfile;
  const attackFocusLabel = ui.settings.preferredTarget === 'boss' ? 'Boss' : ui.settings.preferredTarget === 'elite' ? 'Elite' : 'Balanced';

  const aiRecommendation = evaluateAiProfileFit({ encounterType: 'outskirts', aiProfile: selectedAiProfile, loadoutSignals: postureContext.loadoutSignals, path: postureContext.path });
  const derivedAccuracyPct = aiRecommendation.rating === 'good' ? 92 : aiRecommendation.rating === 'risky' ? 86 : 82;
  const derivedResPct = (() => {
    const defense = Number(gameStats.def);
    if (!Number.isFinite(defense) || defense <= 0) return 0;
    return (defense / (defense + 250)) * 100;
  })();
  const equippedWeaponId = useEquipmentStore.getState().equippedWeaponId;
  const equippedAccessoryId = useEquipmentStore.getState().equippedAccessoryId;
  const resolveItemName = (itemId: string | null): string => itemId ? content.maps.itemsById[itemId]?.name ?? itemId : OUTSKIRTS_PLACEHOLDER_POLICY.lineFallback;

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
    dangerLabel: 'Low',
    loadoutLabel: selectedLoadoutName,
    aiProfile: selectedAiProfile,
    aiProfileLabel: selectedAiProfile[0].toUpperCase() + selectedAiProfile.slice(1),
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
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: resolveItemName(equippedAccessoryId), source: equippedAccessoryId ? 'live' : 'synthetic' },
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
    autoRepeatLabel: 'On',
    selectedEncounterId: OUTSKIRTS_ENCOUNTER_DEFAULT_ID,
    selectedEncounterName: 'Snarling Wolf',
    selectedEncounterLevelLabel: 'Lv. 11',
    safetyChipState: posture.warnings.length > 0 ? 'watch' : 'safe',
    safetyChipLabel: posture.warnings.length > 0 ? 'Watch' : 'Safe',
    scenicArtKey: OUTSKIRTS_PLACEHOLDER_POLICY.encounterFallbackKey,
    scenicBackgroundKey: OUTSKIRTS_PLACEHOLDER_POLICY.scenicFallbackKey,
    encounterDescriptor: 'Outskirts lane',
    encounterNodes: buildEncounterNodesFromKills(progress.killsSinceBoss),
    canMoveEncounterLeft: false,
    canMoveEncounterRight: true,
    roleTag: rewardModel.roleTag,
    bestUsedWhen: rewardModel.bestUsedWhen,
    boundaryLine: rewardModel.boundaryLine,
    pageSubtitle: OUTSKIRTS_REVIEW_COPY.subtitle,
    supportHints: [],
  };
}

export function buildOutskirtsMockupSurfaceFromStores(cityId?: string): OutskirtsExactSurfaceV2 {
  return buildOutskirtsMockupSurface(buildOutskirtsMockupRuntimeSnapshotFromStores(cityId));
}
