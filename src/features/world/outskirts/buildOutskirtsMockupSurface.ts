import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { OUTSKIRTS_BEST_USED_WHEN, OUTSKIRTS_BOUNDARY_LINE } from '../../../systems/economy/activityRewardReadModel.js';
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
import { getOutskirtsMockupPresentation } from './outskirtsMockupPresentation.js';
import type {
  OutskirtsEncounterNodeState,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsMockupSurface,
  OutskirtsSetupEquipmentSlot,
  OutskirtsSeverity,
  OutskirtsSurfaceValue,
  SurfaceValueSource,
} from './types.js';

const CLAMP_MINUTE_GOLD = 70;
const CLAMP_MAX_MINUTE_GOLD = 220;
const MEDICINE_POUCH_CAPACITY = 20;

function toInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function pctLabel(current: number, max: number): string {
  const safeMax = Math.max(1, max);
  const pct = Math.round((current / safeMax) * 100);
  return `${current} / ${safeMax} (${pct}%)`;
}

function asDisplay(text: string, source: SurfaceValueSource, note?: string): OutskirtsSurfaceValue {
  return { text, source, note };
}

function toDangerFromHp(current: number, max: number): { label: string; severity: OutskirtsSeverity } {
  const ratio = max <= 0 ? 0 : current / max;
  if (ratio >= 0.8) return { label: 'Low', severity: 'safe' };
  if (ratio >= 0.55) return { label: 'Guarded', severity: 'watch' };
  if (ratio >= 0.35) return { label: 'Elevated', severity: 'risk' };
  return { label: 'High', severity: 'critical' };
}

function deriveEncounterState(index: number, currentIndex: number): OutskirtsEncounterNodeState {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'future';
}

function inferAccuracy(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsSurfaceValue {
  const bonus = snapshot.weaponRefineLevel * 2 + snapshot.accessoryRefineLevel;
  return asDisplay(`${70 + bonus}%`, 'synthetic', 'ACC is synthetic until a first-class accuracy stat is exposed.');
}

function inferResistance(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsSurfaceValue {
  const dodge = Math.max(0, Math.round(snapshot.playerStats.dodge));
  return asDisplay(`${Math.min(95, 20 + Math.round(dodge * 0.6))}%`, 'synthetic', 'RES is synthetic until a first-class resistance stat is exposed.');
}

function inferEfficiency(killsSinceBoss: number, killsToBoss: number): OutskirtsSurfaceValue {
  const progress = Math.min(1, Math.max(0, killsSinceBoss / Math.max(1, killsToBoss)));
  const tier = progress >= 0.9 ? 'High' : progress >= 0.5 ? 'Medium' : 'Low';
  return asDisplay(`${tier} (${Math.round(progress * 100)}% boss-cycle progress)`, 'derived');
}

function inferGoldRange(totalKills: number): OutskirtsSurfaceValue {
  const low = Math.max(CLAMP_MINUTE_GOLD, Math.round(totalKills * 1.2) + 90);
  const high = Math.max(low + 20, Math.min(CLAMP_MAX_MINUTE_GOLD, low + 45));
  return asDisplay(`${low}-${high} / min`, 'synthetic', 'Gold range is synthetic for planning-state mockup until a first-class planner range model exists.');
}

function inferGoldPerHour(totalKills: number): OutskirtsSurfaceValue {
  const lowPerMinute = Math.max(CLAMP_MINUTE_GOLD, Math.round(totalKills * 1.2) + 90);
  return asDisplay(`${lowPerMinute * 60} / hr`, 'synthetic', 'Gold/hr is a synthetic projection from planning-state gold-range assumptions.');
}

function formatRange(low: number, high: number): string {
  return `${low.toLocaleString('en-US')} – ${high.toLocaleString('en-US')}`;
}

function inferExpectedGoldRangeText(totalKills: number): string {
  const low = Math.max(900, Math.round(totalKills * 14) + 950);
  const high = Math.max(low + 120, low + 260);
  return formatRange(low, high);
}

function inferTimePerRunText(killsToBoss: number): string {
  const seconds = Math.max(35, Math.min(120, 32 + killsToBoss * 3));
  return `~ ${seconds}s / run`;
}

function inferHourlyYieldText(totalKills: number): string {
  const low = Math.max(1600, Math.round(totalKills * 11) + 1700);
  const high = low + 220;
  return `${formatRange(low, high)} / hour`;
}

function parseTrackedBounty(raw: string | null) {
  const fallback = {
    hasTrackedBounty: false,
    title: 'No tracked bounty',
    objectiveText: 'Track a bounty to monitor Outskirts progress here.',
    progressCurrent: 0,
    progressTarget: 1,
    progressPct: 0,
    iconText: 'S',
  };
  if (!raw) return fallback;
  const match = raw.match(/^(.*?):\s*(\d+)\s*\/\s*(\d+)/);
  if (!match) return { ...fallback, hasTrackedBounty: true, title: raw, objectiveText: 'Progress tracked in the Outskirts.' };
  const current = Number(match[2]);
  const target = Math.max(1, Number(match[3]));
  return {
    hasTrackedBounty: true,
    title: match[1].trim(),
    objectiveText: 'Progress tracked in the Outskirts.',
    progressCurrent: current,
    progressTarget: target,
    progressPct: Math.max(0, Math.min(100, Math.round((current / target) * 100))),
    iconText: 'S',
  };
}

function buildCommonMaterials(commonMaterialsLine: string | null) {
  const labels = (commonMaterialsLine ?? '')
    .replace(/^Common mats:\s*/i, '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4);

  while (labels.length < 4) labels.push('—');

  return labels.map((label, index) => ({
    itemId: label === '—' ? `placeholder-${index + 1}` : `material-${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
    iconText: label === '—' ? '·' : label.slice(0, 1).toUpperCase(),
    isPlaceholder: label === '—',
  })) as [
    { itemId: string; label: string; iconText: string; isPlaceholder: boolean },
    { itemId: string; label: string; iconText: string; isPlaceholder: boolean },
    { itemId: string; label: string; iconText: string; isPlaceholder: boolean },
    { itemId: string; label: string; iconText: string; isPlaceholder: boolean },
  ];
}

function summarizeMedicinePouch(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsSurfaceValue {
  if (snapshot.medicinePouchLine) return asDisplay(snapshot.medicinePouchLine, 'live');
  return asDisplay('No healing consumable equipped', 'derived');
}

function normalizeAiProfile(raw: string | null): OutskirtsSurfaceValue {
  if (!raw) return asDisplay('Balanced', 'derived');
  const normalized = raw
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
  return asDisplay(normalized, 'live');
}

function normalizeAttackFocus(raw: string | null): OutskirtsSurfaceValue {
  if (!raw) return asDisplay('Boss', 'derived');
  switch (raw) {
    case 'lowest_hp':
      return asDisplay('Lowest HP', 'live');
    case 'weakest':
      return asDisplay('Weakest', 'live');
    case 'boss':
      return asDisplay('Boss', 'live');
    default:
      return asDisplay(raw.replace(/[_-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()), 'derived');
  }
}

function inferLoadoutBadge(loadoutName: string | null): OutskirtsSurfaceValue {
  if (!loadoutName) return asDisplay('1', 'derived');
  const match = loadoutName.match(/(\d+)/);
  if (match) return asDisplay(match[1], 'derived');
  return asDisplay('1', 'derived', 'Loadout badge is normalized to a stable set number for the setup card.');
}

function buildEquipmentSlots(snapshot: OutskirtsMockupRuntimeSnapshot): [
  OutskirtsSetupEquipmentSlot,
  OutskirtsSetupEquipmentSlot,
  OutskirtsSetupEquipmentSlot,
  OutskirtsSetupEquipmentSlot,
  OutskirtsSetupEquipmentSlot,
  OutskirtsSetupEquipmentSlot,
] {
  return [
    {
      id: 'weapon',
      label: 'Weapon',
      iconText: 'W',
      isEmpty: !snapshot.weaponName,
      itemName: asDisplay(snapshot.weaponName ?? 'Empty', snapshot.weaponName ? 'live' : 'derived'),
    },
    {
      id: 'armor',
      label: 'Armor',
      iconText: 'A',
      isEmpty: true,
      itemName: asDisplay('Empty', 'derived'),
    },
    {
      id: 'ring',
      label: 'Ring',
      iconText: 'R',
      isEmpty: !snapshot.accessoryName,
      itemName: asDisplay(snapshot.accessoryName ?? 'Empty', snapshot.accessoryName ? 'live' : 'derived'),
    },
    {
      id: 'talisman',
      label: 'Talisman',
      iconText: 'T',
      isEmpty: true,
      itemName: asDisplay('Empty', 'derived'),
    },
    {
      id: 'boots',
      label: 'Boots',
      iconText: 'B',
      isEmpty: true,
      itemName: asDisplay('Empty', 'derived'),
    },
    {
      id: 'charm',
      label: 'Charm',
      iconText: 'C',
      isEmpty: true,
      itemName: asDisplay('Empty', 'derived'),
    },
  ];
}

export function buildOutskirtsMockupSurface(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupSurface {
  const presentation = getOutskirtsMockupPresentation(snapshot.cityId);
  const selectedNode = presentation.encounterNodes.find((entry) => entry.id === presentation.selectedEncounterId)
    ?? presentation.encounterNodes[0];
  const selectedNodeIndex = Math.max(0, presentation.encounterNodes.findIndex((entry) => entry.id === selectedNode.id));

  const hp = toInt(snapshot.playerStats.hp);
  const maxHp = toInt(snapshot.playerStats.maxHp);
  const danger = toDangerFromHp(hp, maxHp);

  const macroTrack = {
    currentNodeId: selectedNode.id,
    nodes: presentation.encounterNodes.map((node, index) => ({
      id: node.id,
      label: node.displayName,
      state: deriveEncounterState(index, selectedNodeIndex),
    })),
  };
  const encounterNodes = presentation.encounterNodes.map((entry, index) => ({
    id: entry.id,
    displayName: entry.displayName,
    displayLevel: entry.displayLevel,
    state: deriveEncounterState(index, selectedNodeIndex),
    thumbnailAssetKey: entry.thumbnailAssetKey,
    scenicBindingKey: entry.scenicBindingKey,
  }));

  const canMoveLeft = selectedNodeIndex > 0;
  const canMoveRight = selectedNodeIndex < encounterNodes.length - 1;

  const loadoutValue = asDisplay(snapshot.selectedLoadoutName ?? 'Loadout 1', snapshot.selectedLoadoutName ? 'live' : 'derived');
  const aiValue = normalizeAiProfile(snapshot.aiProfile);
  const attackFocusValue = normalizeAttackFocus(snapshot.preferredTarget);

  const offenseAtk = `${toInt(snapshot.playerStats.atk)}`;
  const critPct = `${Math.round(snapshot.playerStats.crit)}%`;

  const totalKills = Math.max(0, snapshot.progress.totalKills);
  const killsToBoss = Math.max(1, snapshot.killsToBoss);

  const setupOffense = {
    atk: { id: 'atk', label: 'ATK', value: asDisplay(offenseAtk, 'live') },
    acc: { id: 'acc', label: 'ACC', value: inferAccuracy(snapshot) },
    crit: { id: 'crit', label: 'CRIT', value: asDisplay(critPct, 'live') },
  } as const;

  const setupDefense = {
    hp: { id: 'hp', label: 'HP', value: asDisplay(`${maxHp}`, 'live') },
    eva: { id: 'eva', label: 'EVA', value: asDisplay(`${Math.round(snapshot.playerStats.dodge)}%`, 'derived', 'EVA approximates dodge chance for planning-state preview.') },
    res: { id: 'res', label: 'RES', value: inferResistance(snapshot) },
  } as const;

  return {
    page: {
      title: presentation.screenTitle,
      screenStateLabel: 'Planning State',
      planningStateOnly: true,
      shellFlags: {
        isExactMockupPlannedSurface: true,
        allowsLiveCombatStage: false,
        allowsShellTopLane: false,
      },
    },
    macroTrack,
    tacticalStrip: {
      cells: [
        {
          id: 'hp',
          label: 'HP',
          value: asDisplay(pctLabel(hp, maxHp), 'live'),
          iconKey: 'heart',
          severity: danger.severity,
        },
        {
          id: 'danger',
          label: 'Danger',
          value: asDisplay(danger.label, 'derived'),
          sublabel: asDisplay(`${snapshot.progress.killsSinceBoss} / ${killsToBoss} to boss`, 'derived'),
          iconKey: 'alert',
          severity: danger.severity,
        },
        {
          id: 'loadout',
          label: 'Loadout',
          value: loadoutValue,
          iconKey: 'blade',
        },
        {
          id: 'aiProfile',
          label: 'AI Profile',
          value: aiValue,
          iconKey: 'spark',
        },
        {
          id: 'healing',
          label: 'Healing',
          value: summarizeMedicinePouch(snapshot),
          iconKey: 'flask',
        },
        {
          id: 'bounty',
          label: 'Bounty',
          value: asDisplay(snapshot.trackedBountyLine ?? 'No tracked bounty selected', snapshot.trackedBountyLine ? 'live' : 'derived'),
          iconKey: 'target',
        },
        {
          id: 'expedition',
          label: 'Expedition',
          value: asDisplay(snapshot.expeditionLine, snapshot.expeditionLine === 'No expedition overlap' ? 'derived' : 'live'),
          iconKey: 'map',
        },
      ],
    },
    selectorPlaque: {
      selectorLabel: presentation.selectorLabel,
      subtitle: presentation.subtitle,
      zoneLabel: presentation.zoneLabel,
      source: 'manifest',
    },
    scenicField: {
      scenicPlateAssetKey: presentation.scenicPlateAsset,
      encounterAssetKey: selectedNode.encounterAssetKey ?? `enemy/${selectedNode.id}`,
      cropRouteKey: selectedNode.scenicBindingKey ?? null,
      planningStateOnly: true,
    },
    encounterIdentity: {
      encounterId: selectedNode.id,
      displayName: selectedNode.displayName,
      displayLevel: selectedNode.displayLevel ?? 'Lv. ?',
      chipLabel: danger.severity === 'safe' ? 'Safe' : danger.severity === 'watch' ? 'Guarded' : 'Threat',
      chipSeverity: danger.severity,
    },
    setupCard: {
      title: 'Your Setup',
      loadoutBadge: inferLoadoutBadge(snapshot.selectedLoadoutName),
      primaryRows: [
        { id: 'loadoutSet', label: 'Loadout Set', value: loadoutValue, iconKey: 'loadout' },
        { id: 'aiProfile', label: 'AI Profile', value: aiValue, iconKey: 'ai' },
        { id: 'attackFocus', label: 'Attack Focus', value: attackFocusValue, iconKey: 'focus' },
      ],
      offenseRows: [setupOffense.atk, setupOffense.acc, setupOffense.crit],
      defenseRows: [setupDefense.hp, setupDefense.eva, setupDefense.res],
      medicinePouchRow: {
        label: 'Medicine Pouch',
        iconKey: 'pouch',
        count: asDisplay(`${snapshot.medicinePouchCountCurrent} / ${snapshot.medicinePouchCountCap}`, 'derived'),
        affordanceLabel: '+',
        affordanceEnabled: true,
      },
      equipmentSlots: buildEquipmentSlots(snapshot),
      loadoutSet: loadoutValue,
      aiProfile: aiValue,
      attackFocus: attackFocusValue,
      offense: setupOffense,
      defense: setupDefense,
      medicinePouch: summarizeMedicinePouch(snapshot),
      equipmentGrid: {
        weapon: {
          slotId: 'weapon',
          label: 'Weapon',
          equippedItem: asDisplay(snapshot.weaponName ?? 'None equipped', snapshot.weaponName ? 'live' : 'derived'),
          refineLevel: asDisplay(`+${snapshot.weaponRefineLevel}`, 'live'),
        },
        accessory: {
          slotId: 'accessory',
          label: 'Accessory',
          equippedItem: asDisplay(snapshot.accessoryName ?? 'None equipped', snapshot.accessoryName ? 'live' : 'derived'),
          refineLevel: asDisplay(`+${snapshot.accessoryRefineLevel}`, 'live'),
        },
      },
    },
    expectedRewardsCard: {
      title: 'Expected Rewards',
      goldRangeText: inferExpectedGoldRangeText(totalKills),
      commonMaterials: buildCommonMaterials(snapshot.commonMaterialsLine),
      trackedBounty: parseTrackedBounty(snapshot.trackedBountyLine),
      estimatedEfficiency: {
        timePerRunText: inferTimePerRunText(killsToBoss),
        hourlyYieldText: inferHourlyYieldText(totalKills),
      },
      autoRepeat: {
        enabled: snapshot.autoRepeatEnabled,
        label: 'Auto-Repeat',
        canToggle: true,
        iconText: 'R',
      },
    },
    encounterProgressStrip: {
      leftArrow: {
        visible: true,
        enabled: canMoveLeft,
        ariaLabel: 'Previous encounter',
      },
      rightArrow: {
        visible: true,
        enabled: canMoveRight,
        ariaLabel: 'Next encounter',
      },
      nodes: encounterNodes.map((node) => ({
        id: node.id,
        label: node.displayName,
        displayLevelText: node.displayLevel ?? null,
        state: node.state,
        art: node.thumbnailAssetKey ?? null,
        silhouetteArt: node.scenicBindingKey ?? null,
        isClickable: false,
        isSelected: node.id === selectedNode.id,
        ariaLabel: `${node.displayName}${node.displayLevel ? ` ${node.displayLevel}` : ''}${node.id === selectedNode.id ? ', current' : ''}`,
      })),
    },
    rewardsCard: {
      goldRange: inferGoldRange(totalKills),
      commonMaterials: asDisplay(snapshot.commonMaterialsLine ?? 'Common mats: broad field drops.', snapshot.commonMaterialsLine ? 'live' : 'derived'),
      trackedBountyProgress: asDisplay(snapshot.trackedBountyLine ?? 'No tracked bounty selected', snapshot.trackedBountyLine ? 'live' : 'derived'),
      estimatedEfficiency: inferEfficiency(snapshot.progress.killsSinceBoss, killsToBoss),
      autoRepeatState: asDisplay(snapshot.autoRepeatLine, 'live'),
    },
    encounterStrip: {
      nodes: encounterNodes,
      selectedNodeId: selectedNode.id,
      arrows: {
        canMoveLeft,
        canMoveRight,
      },
    },
    primaryAction: {
      label: snapshot.isOutskirtsActive ? 'Stop' : 'Start',
      enabled: Boolean(snapshot.outskirtsId),
      disabledReason: snapshot.outskirtsId ? null : 'Outskirts module unavailable for current city.',
      binding: {
        actionId: 'outskirts:start',
        routeId: 'world/outskirts',
      },
      styleToken: 'primary-start',
    },
    grindSummary: {
      label: presentation.grindSummaryLabel,
      runs: asDisplay(`${totalKills}`, 'live'),
      goldPerHour: inferGoldPerHour(totalKills),
      mainDrop: asDisplay(snapshot.commonMaterialsLine?.replace('Common mats: ', '') ?? presentation.defaultRoleLine, snapshot.commonMaterialsLine ? 'derived' : 'manifest'),
      areaFilter: asDisplay(OUTSKIRTS_BEST_USED_WHEN, 'live', OUTSKIRTS_BOUNDARY_LINE),
    },
    shell: {
      liveMounted: false,
      owner: 'outskirts-exact-mockup-screen',
    },
    provenance: {
      cityId: snapshot.cityId,
      cityName: snapshot.cityName,
      builtAtIso: new Date().toISOString(),
    },
  };
}

function summarizeTrackedBounty(cityId: string): string | null {
  const tracked = useBountyStore.getState().getTrackedBounty(cityId);
  if (!tracked) return null;
  return `${tracked.title}: ${tracked.progress} / ${tracked.target}${tracked.progress >= tracked.target ? ' • Ready' : ''}`;
}

function summarizeExpeditions(cityId: string): string {
  const active = useExpeditionStore.getState().active.filter((entry) => entry.cityId === cityId);
  if (active.length === 0) return 'No expedition overlap';
  const running = active.filter((entry) => entry.status === 'running').length;
  const complete = active.filter((entry) => entry.status === 'complete').length;
  return `${running} running • ${complete} complete`;
}

function summarizeMedicinePouchFromStore(): string | null {
  const healingSlot = useMedicinePouchStore.getState().slots.healing;
  if (!healingSlot?.enabled) return 'Healing slot disabled';
  if (!healingSlot.equippedItemId) return null;
  const item = useContentStore.getState().maps.itemsById[healingSlot.equippedItemId];
  const itemName = item?.name ?? healingSlot.equippedItemId;
  return `${itemName} (${healingSlot.trigger})`;
}

function resolveCommonMaterialsLine(cityId: string): string | null {
  const outskirtsDef = useContentStore.getState().raw?.outskirts.find((entry) => entry.cityId === cityId);
  if (!outskirtsDef) return null;
  const itemNames = Object.values(outskirtsDef.matPools ?? {})
    .flat()
    .slice(0, 3)
    .map((itemId) => useContentStore.getState().maps.itemsById[itemId]?.name ?? itemId)
    .filter((name, index, all) => all.indexOf(name) === index);
  if (itemNames.length === 0) return null;
  return `Common mats: ${itemNames.join(', ')}`;
}

export function buildOutskirtsMockupRuntimeSnapshotFromStores(cityId?: string): OutskirtsMockupRuntimeSnapshot {
  const content = useContentStore.getState();
  const cityStore = useCityStore.getState();
  const resolvedCityId = cityId ?? cityStore.currentCityId ?? content.citiesSorted[0]?.id ?? 'city_pinewind_hamlet';
  const city = content.maps.citiesById[resolvedCityId];
  const outskirtsId = resolveModuleRef(city ?? null, 'outskirts');
  const outskirtsDef = outskirtsId ? content.maps.outskirtsById[outskirtsId] : null;
  const progress = outskirtsId
    ? useOutskirtsStore.getState().progressByOutskirtsId[outskirtsId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : { killsSinceBoss: 0, totalKills: 0, bossDefeated: false };

  const selectedLoadout = useTechniqueStore.getState().getSelectedLoadout();
  const settings = useUIStore.getState().settings;
  const gameStats = useGameStore.getState().stats;
  const equipment = useEquipmentStore.getState();
  const medicineSlot = useMedicinePouchStore.getState().slots.healing;
  const medicineCurrent = medicineSlot.equippedItemId ? useInventoryStore.getState().getItemCount(medicineSlot.equippedItemId) : 0;

  const weaponName = equipment.equippedWeaponId ? content.maps.itemsById[equipment.equippedWeaponId]?.name ?? equipment.equippedWeaponId : null;
  const accessoryName = equipment.equippedAccessoryId ? content.maps.itemsById[equipment.equippedAccessoryId]?.name ?? equipment.equippedAccessoryId : null;

  return {
    cityId: resolvedCityId,
    cityName: city?.name ?? 'Unknown City',
    outskirtsId,
    killsToBoss: outskirtsDef?.killsToBoss ?? 1,
    progress,
    playerStats: {
      hp: gameStats.hp,
      maxHp: gameStats.maxHp,
      atk: gameStats.atk,
      crit: gameStats.crit,
      dodge: gameStats.dodge,
    },
    selectedLoadoutName: selectedLoadout?.name ?? null,
    aiProfile: settings.combatAIProfile,
    preferredTarget: settings.preferredTarget,
    medicinePouchLine: summarizeMedicinePouchFromStore(),
    medicinePouchCountCurrent: Math.max(0, Math.min(MEDICINE_POUCH_CAPACITY, medicineCurrent)),
    medicinePouchCountCap: MEDICINE_POUCH_CAPACITY,
    trackedBountyLine: summarizeTrackedBounty(resolvedCityId),
    commonMaterialsLine: resolveCommonMaterialsLine(resolvedCityId),
    autoRepeatLine: `Auto-continue ${useOutskirtsStore.getState().autoContinue ? 'On' : 'Off'} • Stop at boss ${useOutskirtsStore.getState().stopAtBoss ? 'On' : 'Off'}`,
    autoRepeatEnabled: useOutskirtsStore.getState().autoContinue,
    expeditionLine: summarizeExpeditions(resolvedCityId),
    weaponName,
    accessoryName,
    weaponRefineLevel: equipment.refineLevelBySlot.weapon,
    accessoryRefineLevel: equipment.refineLevelBySlot.accessory,
    isOutskirtsActive: useActivityStore.getState().active?.type === 'outskirts',
  };
}

export function buildOutskirtsMockupSurfaceFromStores(cityId?: string): OutskirtsMockupSurface {
  return buildOutskirtsMockupSurface(buildOutskirtsMockupRuntimeSnapshotFromStores(cityId));
}
