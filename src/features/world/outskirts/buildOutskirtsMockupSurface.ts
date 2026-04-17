import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { OUTSKIRTS_BEST_USED_WHEN, OUTSKIRTS_BOUNDARY_LINE } from '../../../systems/economy/activityRewardReadModel.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useOutskirtsStore } from '../../../stores/outskirtsStore.js';
import { useTechniqueStore } from '../../../stores/techniqueStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { getOutskirtsMockupPresentation } from './outskirtsMockupPresentation.js';
import type {
  OutskirtsEncounterNodeState,
  OutskirtsMockupRuntimeSnapshot,
  OutskirtsMockupSurface,
  OutskirtsSeverity,
  OutskirtsSurfaceValue,
  SurfaceValueSource,
} from './types.js';

const CLAMP_MINUTE_GOLD = 70;
const CLAMP_MAX_MINUTE_GOLD = 220;

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
  const projectedHourly = lowPerMinute * 60;
  return asDisplay(`${projectedHourly} / hr`, 'synthetic', 'Gold/hr is a synthetic projection from planning-state gold-range assumptions.');
}

function summarizeMedicinePouch(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsSurfaceValue {
  if (snapshot.medicinePouchLine) return asDisplay(snapshot.medicinePouchLine, 'live');
  return asDisplay('No healing consumable equipped', 'derived');
}

function resolveMacroTrack(snapshot: OutskirtsMockupRuntimeSnapshot) {
  const target = Math.max(1, snapshot.killsToBoss);
  const ratio = Math.min(1, Math.max(0, snapshot.progress.killsSinceBoss / target));
  const currentNodeId = ratio >= 1 ? 'boss-window' : ratio >= 0.45 ? 'field-control' : 'patrol';
  return {
    currentNodeId,
    nodes: [
      { id: 'patrol', label: 'Patrol', state: (currentNodeId === 'patrol' ? 'current' : 'completed') as const },
      {
        id: 'field-control',
        label: 'Field Control',
        state: (currentNodeId === 'field-control' ? 'current' : currentNodeId === 'boss-window' ? 'completed' : 'future') as const,
      },
      { id: 'boss-window', label: 'Boss Window', state: (currentNodeId === 'boss-window' ? 'current' : 'future') as const },
    ],
  };
}

export function buildOutskirtsMockupSurface(snapshot: OutskirtsMockupRuntimeSnapshot): OutskirtsMockupSurface {
  const presentation = getOutskirtsMockupPresentation(snapshot.cityId);
  const selectedNode = presentation.encounterNodes.find((entry) => entry.id === presentation.selectedEncounterId)
    ?? presentation.encounterNodes[0];
  const selectedNodeIndex = Math.max(0, presentation.encounterNodes.findIndex((entry) => entry.id === selectedNode.id));

  const hp = toInt(snapshot.playerStats.hp);
  const maxHp = toInt(snapshot.playerStats.maxHp);
  const danger = toDangerFromHp(hp, maxHp);

  const macroTrack = resolveMacroTrack(snapshot);
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

  const attackFocusLabel = snapshot.preferredTarget === 'lowest_hp'
    ? 'Lowest HP'
    : snapshot.preferredTarget === 'weakest'
      ? 'Weakest'
      : 'Boss';

  const loadoutName = snapshot.selectedLoadoutName ?? 'Loadout unavailable';
  const aiLabel = snapshot.aiProfile ?? 'balanced';
  const trackingLine = snapshot.trackedBountyLine ?? 'No tracked bounty selected';

  const offenseAtk = `${toInt(snapshot.playerStats.atk)}`;
  const critPct = `${Math.round(snapshot.playerStats.crit)}%`;

  const totalKills = Math.max(0, snapshot.progress.totalKills);
  const killsToBoss = Math.max(1, snapshot.killsToBoss);
  const totalExpeditionRuns = snapshot.expeditionLine;

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
          value: asDisplay(loadoutName, snapshot.selectedLoadoutName ? 'live' : 'derived'),
          iconKey: 'blade',
        },
        {
          id: 'aiProfile',
          label: 'AI Profile',
          value: asDisplay(aiLabel, snapshot.aiProfile ? 'live' : 'derived'),
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
          value: asDisplay(trackingLine, snapshot.trackedBountyLine ? 'live' : 'derived'),
          iconKey: 'target',
        },
        {
          id: 'expedition',
          label: 'Expedition',
          value: asDisplay(totalExpeditionRuns, totalExpeditionRuns === 'No expedition overlap' ? 'derived' : 'live'),
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
      loadoutSet: asDisplay(loadoutName, snapshot.selectedLoadoutName ? 'live' : 'derived'),
      aiProfile: asDisplay(aiLabel, snapshot.aiProfile ? 'live' : 'derived'),
      attackFocus: asDisplay(attackFocusLabel, snapshot.preferredTarget ? 'live' : 'derived'),
      offense: {
        atk: { id: 'atk', label: 'ATK', value: asDisplay(offenseAtk, 'live') },
        acc: { id: 'acc', label: 'ACC', value: inferAccuracy(snapshot) },
        crit: { id: 'crit', label: 'CRIT', value: asDisplay(critPct, 'live') },
      },
      defense: {
        hp: { id: 'hp', label: 'HP', value: asDisplay(`${maxHp}`, 'live') },
        eva: { id: 'eva', label: 'EVA', value: asDisplay(`${Math.round(snapshot.playerStats.dodge)}%`, 'derived', 'EVA approximates dodge chance for planning-state preview.') },
        res: { id: 'res', label: 'RES', value: inferResistance(snapshot) },
      },
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
    rewardsCard: {
      goldRange: inferGoldRange(totalKills),
      commonMaterials: asDisplay(snapshot.commonMaterialsLine ?? 'Common mats: broad field drops.', snapshot.commonMaterialsLine ? 'live' : 'derived'),
      trackedBountyProgress: asDisplay(trackingLine, snapshot.trackedBountyLine ? 'live' : 'derived'),
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
    trackedBountyLine: summarizeTrackedBounty(resolvedCityId),
    commonMaterialsLine: resolveCommonMaterialsLine(resolvedCityId),
    autoRepeatLine: `Auto-continue ${useOutskirtsStore.getState().autoContinue ? 'On' : 'Off'} • Stop at boss ${useOutskirtsStore.getState().stopAtBoss ? 'On' : 'Off'}`,
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
