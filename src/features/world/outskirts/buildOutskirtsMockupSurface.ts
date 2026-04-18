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
import { OUTSKIRTS_ALLOWED_PLANNING_SHELL, OUTSKIRTS_MOCKUP_COPY, OUTSKIRTS_MOCKUP_VERSION, OUTSKIRTS_PLACEHOLDER_POLICY, OUTSKIRTS_TACTICAL_CELL_ORDER } from './outskirtsMockupPresentation.js';
import type {
  OutskirtsEncounterNodeState,
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

function buildEncounterNodes(killsSinceBoss: number): OutskirtsMockupEncounterChainNode[] {
  const labels = ['Quiet Glade', 'Rockjaw Boar', 'Snarling Wolf', 'Venomcoil', 'Shade Stalker', 'Mire Serpent'];
  const idx = Math.max(0, Math.min(labels.length - 1, Math.floor((killsSinceBoss / 10) * labels.length)));
  return labels.map((label, index) => {
    const state: OutskirtsEncounterNodeState = index < idx ? 'completed' : index === idx ? 'current' : 'future';
    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      state,
      thumbnailKey: `${OUTSKIRTS_PLACEHOLDER_POLICY.iconFallbackPrefix}${label.toLowerCase().replace(/\s+/g, '-')}`,
      stateLabel: state === 'completed' ? 'Cleared' : state === 'current' ? 'Current' : 'Future',
    };
  });
}

export function buildOutskirtsMockupSurface(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupSurface {
  const fallbacks: string[] = [];
  const unresolved: string[] = [];
  const placeholders = [snapshot.scenicArtKey, snapshot.scenicBackgroundKey].filter((entry) => entry.startsWith('placeholder/'));
  const currentProgressIndex = snapshot.encounterNodes.findIndex((node) => node.state === 'current');

  const medicine = asText(snapshot.medicinePouchLabel, 'No medicine pouch configured');
  if (medicine.source !== 'live') fallbacks.push('medicinePouchLabel');
  const bounty = asText(snapshot.bountyLabel, OUTSKIRTS_MOCKUP_COPY.fallbackBountyLine);
  if (bounty.source !== 'live') fallbacks.push('bountyLabel');

  const tacticalCells = {
    hp: { id: 'hp', label: 'HP', value: snapshot.hpLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'hp', visible: true, reserveWhenEmpty: true },
    danger: { id: 'danger', label: 'Danger', value: snapshot.dangerLabel, tone: resolveDangerTone(snapshot.killsSinceBoss, snapshot.killsToBoss), iconKey: 'danger', visible: true, reserveWhenEmpty: true },
    loadout: { id: 'loadout', label: 'Loadout', value: snapshot.loadoutLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'loadout', visible: true, reserveWhenEmpty: true },
    aiProfile: { id: 'aiProfile', label: 'AI', value: snapshot.aiProfileLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'ai', visible: true, reserveWhenEmpty: true },
    healing: { id: 'healing', label: 'Healing', value: medicine.text, tone: medicine.source === 'live' ? 'positive' : 'warning' as OutskirtsTacticalTone, iconKey: 'healing', visible: true, reserveWhenEmpty: true },
    bounty: { id: 'bounty', label: 'Bounty', value: bounty.text, tone: bounty.source === 'live' ? 'positive' : 'neutral' as OutskirtsTacticalTone, iconKey: 'bounty', visible: true, reserveWhenEmpty: true },
    expedition: { id: 'expedition', label: 'Expedition', value: snapshot.expeditionLabel, tone: 'neutral' as OutskirtsTacticalTone, iconKey: 'expedition', visible: true, reserveWhenEmpty: true },
  } as const;

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
      subtitle: snapshot.pageSubtitle || OUTSKIRTS_MOCKUP_COPY.pageSubtitleFallback,
      areaPlaqueLabel: `${OUTSKIRTS_MOCKUP_COPY.defaultAreaPlaquePrefix} ${snapshot.outskirtsLabel}`,
      roleTag: snapshot.roleTag,
      bestUsedWhen: snapshot.bestUsedWhen,
      boundaryLine: snapshot.boundaryLine,
    },
    topProgress: {
      label: OUTSKIRTS_MOCKUP_COPY.topProgressLabel,
      helperText: `Boss in ${Math.max(0, snapshot.killsToBoss - snapshot.killsSinceBoss)} kills`,
      currentIndex: currentProgressIndex >= 0 ? currentProgressIndex : 0,
      nodes: snapshot.encounterNodes.map((node) => ({ id: node.id, label: node.label, state: node.state })),
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
    actionZone: {
      primaryCtaLabel: OUTSKIRTS_MOCKUP_COPY.fallbackCtaLabel,
      primaryCtaIntent: 'start-hunt',
      primaryCtaTone: 'primary',
      primaryCtaEnabled: Boolean(snapshot.outskirtsId),
      secondaryHints: snapshot.supportHints,
      singleDominantCta: true,
    },
    grindSummary: {
      title: OUTSKIRTS_MOCKUP_COPY.grindSummaryTitle,
      rows: [
        { id: 'kills', label: 'Total Kills', value: `${snapshot.totalKills}`, source: 'live' },
        { id: 'bossCadence', label: 'Boss Cadence', value: `${snapshot.killsSinceBoss} / ${snapshot.killsToBoss}`, source: 'live' },
        { id: 'cadence', label: 'Cadence', value: snapshot.cadenceSupport.value, source: snapshot.cadenceSupport.source },
      ],
      statusLine: snapshot.supportHints[0] ?? OUTSKIRTS_BEST_USED_WHEN,
      reserveWhenEmpty: true,
    },
    shell: OUTSKIRTS_ALLOWED_PLANNING_SHELL,
    debug: {
      missingDataFallbacks: fallbacks,
      placeholderAssetKeysInUse: placeholders,
      unresolvedSourceFields: unresolved,
      notes: ['P1 contract surface only; not wired as live Outskirts owner.'],
    },
  };
}

function summarizeExpeditions(cityId: string): string {
  const active = useExpeditionStore.getState().active.filter((entry) => entry.cityId === cityId);
  if (active.length === 0) return 'No expedition overlap';
  const running = active.filter((entry) => entry.status === 'running').length;
  const complete = active.filter((entry) => entry.status === 'complete').length;
  return `${running} running • ${complete} complete`;
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
    hpLabel: `HP ${formatWhole(gameStats.maxHp)}`,
    dangerLabel: progress.killsSinceBoss >= (outskirts?.killsToBoss ?? 10) ? 'Boss ready' : 'Low-risk route',
    loadoutLabel: selectedLoadoutLabel,
    aiProfile: selectedAiProfile,
    aiProfileLabel: selectedAiProfile[0].toUpperCase() + selectedAiProfile.slice(1),
    attackFocusLabel,
    medicinePouchLabel: pouchName ? `${pouchQty} / 20` : null,
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
