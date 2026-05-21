import type { NormalizedForgeBlueprint, ValidatedContent } from '../../../content/index.js';
import { getItemDef, listForgeBlueprints, listForgeBlueprintsForCity, useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useEquipmentStore, type EquipmentSlot } from '../../../stores/equipmentStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCraftSessionStore } from '../../../stores/craftSessionStore.js';
import { greaterThanOrEqualTo } from '../../../utils/numbers.js';
import { buildBestSourceIndex, getBestSourceIndexEntry } from '../../../systems/economy/bestSourceIndex.js';
import { buildLiveDaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';
import {
  buildForgeSurfaceModel,
  getAllowedForgeModes,
  getDefaultForgeMode,
  getForgeSurfaceTabForBlueprint,
  isForgeModeAllowed,
  type ForgeModeOption,
} from '../../../systems/forge/index.js';
import { getLiveForgeFloorReadModel } from '../../../systems/forge/liveForgeFloorStore.js';
import type { ForgeFloorReadModel } from '../../../systems/forge/forgeFloorReadModel.js';
import { getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';
import { FORGE_EXACT_ASSETS, getForgeExactAssetWarnings } from './forgeExactAssetRegistry.js';
import {
  FORGE_EXACT_DEFAULT_CITY_ID,
  FORGE_EXACT_FIXTURE_TRUTH_CELLS,
  FORGE_EXACT_MODES,
  FORGE_EXACT_ROOT_TEST_ID,
  FORGE_EXACT_SURFACE_VERSION,
  FORGE_EXACT_TABS,
  createForgeExactButton,
  getForgeExactModeLabel,
  getForgeExactTabLabel,
} from './forgeExactPresentation.js';
import type {
  ForgeExactActivityMode,
  ForgeExactAssetKey,
  ForgeExactButtonSurface,
  ForgeExactChip,
  ForgeExactFloorNode,
  ForgeExactFloorRail,
  ForgeExactMaterialInspector,
  ForgeExactMaterialRow,
  ForgeExactMode,
  ForgeExactModeRow,
  ForgeExactSourceButton,
  ForgeExactStatus,
  ForgeExactSurfaceMode,
  ForgeExactSurfaceV1,
  ForgeExactTab,
  ForgeExactTabRow,
  ForgeExactToolRow,
  ForgeExactTruthCell,
} from './forgeExactTypes.js';

const FIXTURE_CITY_NAME = 'Pinewind';

interface BuildOptions {
  mode?: ForgeExactSurfaceMode;
  activeTab?: ForgeExactTab;
  activeMode?: ForgeExactMode;
  selectedBlueprintId?: string | null;
  selectedTargetSlot?: EquipmentSlot;
  actionResult?: {
    title: string;
    lines: string[];
  } | null;
  now?: number;
}

function asTopTruth(cells: ForgeExactTruthCell[]): ForgeExactSurfaceV1['topTruthStrip'] {
  return cells.slice(0, 7) as unknown as ForgeExactSurfaceV1['topTruthStrip'];
}

function asFloorNodes(nodes: ForgeExactFloorNode[]): ForgeExactFloorRail['nodes'] {
  return nodes.slice(0, 5) as unknown as ForgeExactFloorRail['nodes'];
}

function statusForFloor(current: number, target: number): ForgeExactStatus {
  if (target <= 0) return 'neutral';
  if (current >= target) return 'met';
  return 'missing';
}

function titleCaseFromId(id: string): string {
  return id
    .replace(/^mat_/u, '')
    .replace(/^rune_/u, 'rune ')
    .split(/[_\s-]+/gu)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function itemName(itemId: string | null | undefined): string {
  if (!itemId) return 'Unknown Item';
  return getItemDef(itemId)?.name ?? titleCaseFromId(itemId);
}

function formatCityForgeName(cityName: string): string {
  const compact = cityName.replace(/\bHamlet\b/iu, '').trim();
  return `${compact || 'City'} Forge`;
}

function gateLabelForCity(content: ValidatedContent | null, cityId: string | null): string {
  const trial = cityId ? content?.trials.find((entry) => entry.cityId === cityId) : null;
  const raw = trial?.gatesToMajorRealm ?? 'foundation';
  const label = titleCaseFromId(raw);
  return label.includes('Gate') ? label : `${label} Gate`;
}

function compactGateLabel(label: string): string {
  const compact = label
    .replace(/\bEstablishment\b/giu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  if (/^Foundation(?:\s+Gate)?$/iu.test(compact)) return 'Foundation Gate';
  return compact;
}

function resolveCityId(inputCityId?: string | null): string | null {
  const content = useContentStore.getState();
  const cityStore = useCityStore.getState();
  if (inputCityId && content.maps.citiesById[inputCityId]) return inputCityId;
  if (cityStore.currentCityId && content.maps.citiesById[cityStore.currentCityId]) return cityStore.currentCityId;
  const firstUnlocked = cityStore.unlockedCityIds.find((id) => content.maps.citiesById[id]);
  if (firstUnlocked) return firstUnlocked;
  return content.citiesSorted[0]?.id ?? FORGE_EXACT_DEFAULT_CITY_ID;
}

function toolRows(): ForgeExactToolRow[] {
  const tiers = useEquipmentStore.getState().getForgeToolTiers();
  return [
    { id: 'hammer', label: 'Hammer', value: `Tier ${tiers.hammer || 1}`, icon: 'metalChunk', status: 'met' },
    { id: 'quench-basin', label: 'Quench Basin', value: `Tier ${tiers.quenchTub || 1}`, icon: 'dustBlue', status: 'met' },
    { id: 'rune-plate', label: 'Rune Plate', value: 'Locked', icon: 'inkLock', status: 'locked' },
  ];
}

function fixtureToolRows(): ForgeExactToolRow[] {
  return [
    { id: 'hammer', label: 'Hammer', value: 'Tier I', icon: 'metalChunk', status: 'met' },
    { id: 'quench-basin', label: 'Quench Basin', value: 'Tier I', icon: 'dustBlue', status: 'met' },
    { id: 'rune-plate', label: 'Rune Plate', value: 'Locked', icon: 'inkLock', status: 'locked' },
  ];
}

function tabIcon(tab: ForgeExactTab) {
  if (tab === 'refine') return 'metalChunk' as const;
  if (tab === 'temper') return 'inkSparkles' as const;
  return 'artifactShard' as const;
}

function tabRows(activeTab: ForgeExactTab): ForgeExactTabRow[] {
  return FORGE_EXACT_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tabIcon(tab.id),
    selected: tab.id === activeTab,
    enabled: true,
    status: tab.id === activeTab ? 'recommended' : 'neutral',
  }));
}

function modeRows(args: {
  activeMode: ForgeExactMode;
  selectedBlueprint: NormalizedForgeBlueprint | null;
  fixture?: boolean;
}): ForgeExactModeRow[] {
  const allowed = args.selectedBlueprint ? getAllowedForgeModes(args.selectedBlueprint) : ['idle', 'assisted'];
  return FORGE_EXACT_MODES.map((mode) => {
    const enabled = args.fixture
      ? mode.id !== 'handsOn'
      : args.selectedBlueprint
        ? allowed.includes(mode.id)
        : mode.id !== 'handsOn';
    const disabledReason =
      enabled ? undefined : mode.id === 'handsOn' && args.selectedBlueprint?.service === 'refine'
          ? 'Temper only'
        : mode.id === 'handsOn'
          ? 'Temper only'
          : 'Unavailable';
    return {
      id: mode.id,
      label: mode.label,
      selected: mode.id === args.activeMode,
      enabled,
      badge: mode.id === 'assisted' && args.activeMode === 'assisted' ? 'Recommended' : undefined,
      note: disabledReason,
      status: mode.id === args.activeMode ? 'recommended' : enabled ? 'neutral' : 'locked',
    };
  });
}

function getBlueprintTargetSlot(blueprint: NormalizedForgeBlueprint | null): EquipmentSlot | undefined {
  if (!blueprint || blueprint.type !== 'service') return undefined;
  const effectTarget = blueprint.effect?.targetSlot;
  if (effectTarget === 'weapon' || effectTarget === 'accessory') return effectTarget;
  return undefined;
}

function pickRecommendedSlot(activeTab: ForgeExactTab, floor: ForgeFloorReadModel): EquipmentSlot {
  if (activeTab === 'temper') {
    const weaponTemper = floor.temperSuccessesBySlot.weapon ?? 0;
    const accessoryTemper = floor.temperSuccessesBySlot.accessory ?? 0;
    return weaponTemper <= accessoryTemper ? 'weapon' : 'accessory';
  }
  const recommendation = floor.nextGateRecommendation;
  const weaponGap = Math.max(0, (recommendation?.weaponRefine ?? 0) - floor.weaponRefineFloor);
  const accessoryGap = Math.max(0, (recommendation?.accessoryRefine ?? 0) - floor.accessoryRefineFloor);
  return weaponGap >= accessoryGap ? 'weapon' : 'accessory';
}

function selectBlueprint(args: {
  visibleBlueprints: NormalizedForgeBlueprint[];
  activeTab: ForgeExactTab;
  selectedBlueprintId?: string | null;
  activeSessionSourceId?: string | null;
  floor: ForgeFloorReadModel;
}): NormalizedForgeBlueprint | null {
  const visibleByTab = args.visibleBlueprints.filter((blueprint) => getForgeSurfaceTabForBlueprint(blueprint) === args.activeTab);
  if (args.activeSessionSourceId) {
    const active = visibleByTab.find((blueprint) => blueprint.id === args.activeSessionSourceId);
    if (active) return active;
  }
  if (args.selectedBlueprintId) {
    const selected = visibleByTab.find((blueprint) => blueprint.id === args.selectedBlueprintId);
    if (selected) return selected;
  }

  const preferredSlot = pickRecommendedSlot(args.activeTab, args.floor);
  const recommended = visibleByTab.find((blueprint) => getBlueprintTargetSlot(blueprint) === preferredSlot);
  return recommended ?? visibleByTab[0] ?? null;
}

function normalizeMode(blueprint: NormalizedForgeBlueprint | null, requestedMode: ForgeExactMode): ForgeExactMode {
  if (!blueprint) return requestedMode === 'handsOn' ? 'idle' : requestedMode;
  return isForgeModeAllowed(blueprint, requestedMode) ? requestedMode : getDefaultForgeMode(blueprint);
}

function queueInfo(now: number) {
  const profession = useProfessionStore.getState();
  const jobs = profession.forgeQueue;
  const readyJob = jobs.find((job) => profession.getForgeJobStatus(job, now).done) ?? null;
  const activeJob = jobs.find((job) => profession.getForgeJobStatus(job, now).status === 'ACTIVE') ?? null;
  const queuedJob = jobs.find((job) => profession.getForgeJobStatus(job, now).status === 'QUEUED') ?? null;
  if (readyJob) return { label: 'Ready', mode: 'readyToClaim' as const, readyJob };
  if (activeJob) return { label: 'Active', mode: 'active' as const, readyJob: null };
  if (queuedJob || jobs.length > 0) return { label: 'Queued', mode: 'queued' as const, readyJob: null };
  return { label: 'Idle', mode: 'planning' as const, readyJob: null };
}

function buildTopTruth(args: {
  content: ValidatedContent | null;
  cityId: string | null;
  floor: ForgeFloorReadModel;
  queueLabel: string;
}): ForgeExactSurfaceV1['topTruthStrip'] {
  const gate = compactGateLabel(args.floor.nextGateRecommendation?.gateLabel ?? gateLabelForCity(args.content, args.cityId));
  const recommendation = args.floor.nextGateRecommendation;
  const weaponTarget = recommendation?.weaponRefine ?? 0;
  const accessoryTarget = recommendation?.accessoryRefine ?? 0;
  const temperTarget = recommendation?.temperSuccesses ?? 0;
  const runeTarget = recommendation?.runeCountRecommended ?? 0;
  const readiness = recommendation
    ? Math.max(
        0,
        Math.min(
          100,
          100
            - Math.max(0, weaponTarget - args.floor.weaponRefineFloor) * 8
            - Math.max(0, accessoryTarget - args.floor.accessoryRefineFloor) * 7
            - Math.max(0, temperTarget - args.floor.temperSuccessTotal) * 10
            - Math.max(0, runeTarget - args.floor.runeTotalCount) * 6,
        ),
      )
    : 100;

  return asTopTruth([
    { id: 'next-test', label: 'Next Test', value: recommendation ? gate : 'No target', icon: 'bookEarth', status: recommendation ? 'neutral' : 'met' },
    { id: 'readiness', label: 'Readiness', value: `${readiness} / 100`, icon: 'foundationPill', status: readiness >= 80 ? 'met' : 'warning' },
    { id: 'weapon-floor', label: 'Weapon Floor', value: `+${args.floor.weaponRefineFloor} / +${weaponTarget || args.floor.weaponRefineFloor}`, icon: 'rustySword', status: statusForFloor(args.floor.weaponRefineFloor, weaponTarget) },
    { id: 'accessory-floor', label: 'Accessory Floor', value: `+${args.floor.accessoryRefineFloor} / +${accessoryTarget || args.floor.accessoryRefineFloor}`, icon: 'prayerBeads', status: statusForFloor(args.floor.accessoryRefineFloor, accessoryTarget) },
    { id: 'temper', label: 'Temper', value: `${args.floor.temperSuccessTotal} / ${temperTarget || args.floor.temperSuccessTotal}`, icon: 'metalChunk', status: statusForFloor(args.floor.temperSuccessTotal, temperTarget) },
    { id: 'rune-target', label: 'Rune Target', value: runeTarget > 0 ? `${args.floor.runeTotalCount} / ${runeTarget}` : 'None', icon: 'artifactShard', status: runeTarget > 0 ? statusForFloor(args.floor.runeTotalCount, runeTarget) : 'neutral' },
    { id: 'queue', label: 'Queue', value: args.queueLabel, icon: args.queueLabel === 'Idle' ? 'hourglassEmpty' : 'hourglassProgress', status: args.queueLabel === 'Idle' ? 'met' : args.queueLabel === 'Ready' ? 'recommended' : 'warning' },
  ]);
}

function centerAssetForTab(tab: ForgeExactTab): ForgeExactAssetKey {
  if (tab === 'temper') return 'temperCenter';
  if (tab === 'runes') return 'runesCenter';
  return 'refineCenter';
}

function ctaVerb(tab: ForgeExactTab, mode: ForgeExactMode): string {
  if (tab === 'temper') {
    if (mode === 'handsOn') return 'Begin Hands-on Temper';
    if (mode === 'assisted') return 'Begin Assisted Temper';
    return 'Start Idle Temper';
  }
  if (tab === 'runes') {
    if (mode === 'handsOn') return 'Inscribe Rune';
    if (mode === 'assisted') return 'Inscribe Assisted Rune';
    return 'Inscribe Idle Rune';
  }
  return mode === 'assisted' ? 'Start Assisted Refine' : 'Start Idle Refine';
}

function secondaryMode(activeMode: ForgeExactMode, allowed: ForgeModeOption[]): ForgeExactMode | null {
  const candidates: ForgeExactMode[] = ['idle', 'assisted', 'handsOn'];
  return candidates.find((mode) => mode !== activeMode && allowed.includes(mode)) ?? null;
}

function floorRail(args: {
  floor: ForgeFloorReadModel;
  activeTab: ForgeExactTab;
  gateLabel: string;
}): ForgeExactFloorRail {
  const recommendation = args.floor.nextGateRecommendation;
  const weaponTarget = recommendation?.weaponRefine ?? args.floor.weaponRefineFloor;
  const accessoryTarget = recommendation?.accessoryRefine ?? args.floor.accessoryRefineFloor;
  const temperTarget = recommendation?.temperSuccesses ?? args.floor.temperSuccessTotal;
  const runeTarget = recommendation?.runeCountRecommended ?? 0;
  const activeId =
    args.activeTab === 'temper'
      ? 'temper'
      : args.activeTab === 'runes'
        ? 'rune'
        : pickRecommendedSlot(args.activeTab, args.floor) === 'weapon'
          ? 'weapon'
          : 'accessory';
  const currentFloor = Math.max(0, Math.min(100, 100
    - Math.max(0, weaponTarget - args.floor.weaponRefineFloor) * 8
    - Math.max(0, accessoryTarget - args.floor.accessoryRefineFloor) * 7
    - Math.max(0, temperTarget - args.floor.temperSuccessTotal) * 10
    - Math.max(0, runeTarget - args.floor.runeTotalCount) * 6));
  const afterRefine = Math.min(100, currentFloor + (activeId === 'weapon' ? 8 : activeId === 'accessory' ? 7 : activeId === 'temper' ? 10 : 6));
  const largestGap = activeId === 'weapon' ? 'Weapon Floor' : activeId === 'accessory' ? 'Accessory Floor' : activeId === 'temper' ? 'Temper' : 'Rune Target';

  return {
    title: 'Permanent Floor',
    nodes: asFloorNodes([
      { id: 'weapon', label: 'Weapon', value: `+${args.floor.weaponRefineFloor} -> +${weaponTarget}`, icon: 'rustySword', status: activeId === 'weapon' ? 'recommended' : statusForFloor(args.floor.weaponRefineFloor, weaponTarget) },
      { id: 'accessory', label: 'Accessory', value: `+${args.floor.accessoryRefineFloor} -> +${accessoryTarget}`, icon: 'prayerBeads', status: activeId === 'accessory' ? 'recommended' : statusForFloor(args.floor.accessoryRefineFloor, accessoryTarget) },
      { id: 'temper', label: 'Temper', value: `${args.floor.temperSuccessTotal} -> ${temperTarget}`, icon: 'metalChunk', status: activeId === 'temper' ? 'recommended' : statusForFloor(args.floor.temperSuccessTotal, temperTarget) },
      { id: 'rune', label: 'Rune Target', value: runeTarget > 0 ? `${args.floor.runeTotalCount} -> ${runeTarget}` : 'None', icon: 'artifactShard', status: activeId === 'rune' ? 'recommended' : runeTarget > 0 ? statusForFloor(args.floor.runeTotalCount, runeTarget) : 'neutral' },
      { id: 'gate', label: compactGateLabel(args.gateLabel), value: 'Target', icon: 'bookEarth', status: 'neutral' },
    ]),
    comparisonLine: `Current Floor: ${currentFloor} / 100   |   After ${getForgeExactTabLabel(args.activeTab)}: ${afterRefine} / 100   |   Largest Gap Fixed: ${largestGap}`,
  };
}

function materialIcon(itemId: string): ForgeExactMaterialRow['icon'] {
  const lower = itemId.toLowerCase();
  if (lower.includes('ore') || lower.includes('iron')) return 'metalChunk';
  if (lower.includes('sand') || lower.includes('dust')) return 'dustGreen';
  if (lower.includes('stone')) return 'dustGray';
  if (lower.includes('leaf') || lower.includes('dew')) return 'spiritGrass';
  if (lower.includes('gold')) return 'placeholderRingSmall';
  return 'artifactShard';
}

function buildMaterialRows(blueprint: NormalizedForgeBlueprint | null): ForgeExactMaterialRow[] {
  if (!blueprint) return [];
  const inventory = useInventoryStore.getState();
  const rows: ForgeExactMaterialRow[] = blueprint.costs.items.map((entry) => {
    const needed = Math.max(0, Math.floor(entry.qty));
    const owned = inventory.getQty(entry.itemId);
    return {
      id: entry.itemId,
      label: itemName(entry.itemId),
      ownedLabel: `${owned}`,
      neededLabel: `${needed}`,
      valueLabel: `${owned} / ${needed}`,
      icon: materialIcon(entry.itemId),
      status: owned >= needed ? 'met' : 'missing',
    };
  });

  if (blueprint.costs.gold > 0) {
    const ownedGold = inventory.currencies.gold ?? '0';
    rows.push({
      id: 'gold',
      label: 'Gold',
      ownedLabel: ownedGold,
      neededLabel: `${blueprint.costs.gold}`,
      valueLabel: `${ownedGold} / ${blueprint.costs.gold}`,
      icon: 'placeholderRingSmall',
      status: greaterThanOrEqualTo(ownedGold, blueprint.costs.gold) ? 'met' : 'missing',
    });
  }
  if (blueprint.costs.spiritStones > 0) {
    const ownedStones = inventory.currencies.spiritStones ?? '0';
    rows.push({
      id: 'spirit-stones',
      label: 'Spirit Stones',
      ownedLabel: ownedStones,
      neededLabel: `${blueprint.costs.spiritStones}`,
      valueLabel: `${ownedStones} / ${blueprint.costs.spiritStones}`,
      icon: 'artifactShard',
      status: greaterThanOrEqualTo(ownedStones, blueprint.costs.spiritStones) ? 'met' : 'missing',
    });
  }

  return rows.slice(0, 4);
}

function sourceButtons(args: {
  content: ValidatedContent | null;
  cityId: string | null;
  blueprint: NormalizedForgeBlueprint | null;
}): ForgeExactSourceButton[] {
  const fallback: Array<{ id: string; label: string; moduleKey: 'outskirts' | 'ruins' | 'expeditions'; icon: ForgeExactSourceButton['icon'] }> = [
    { id: 'outskirts', label: 'Outskirts', moduleKey: 'outskirts', icon: 'bookEarth' },
    { id: 'ruins', label: 'Ruins', moduleKey: 'ruins', icon: 'artifactBundle' },
    { id: 'expeditions', label: 'Expeditions', moduleKey: 'expeditions', icon: 'bookMartial' },
  ];
  if (!args.content || !args.blueprint) {
    return fallback.map((entry) => ({
      ...createForgeExactButton(`source-${entry.id}`, entry.label, 'route-source', {
        variant: 'route',
        route: { cityId: args.cityId, moduleKey: entry.moduleKey },
      }),
      icon: entry.icon,
      intent: 'route-source',
      variant: 'route',
    }));
  }

  const city = args.cityId ? args.content.cities.find((entry) => entry.id === args.cityId) : null;
  const bestIndex = buildBestSourceIndex(args.content);
  const materialTargets = args.blueprint.costs.items
    .map((entry) => getBestSourceIndexEntry(bestIndex, entry.itemId))
    .flatMap((entry) => entry?.sourceOptions ?? [])
    .filter((option) => option.moduleKey === 'outskirts' || option.moduleKey === 'ruins' || option.moduleKey === 'expeditions');
  const deduped = [...materialTargets, ...fallback.map((entry) => ({
    moduleKey: entry.moduleKey,
    cityId: args.cityId,
    shortReason: '',
  }))].filter((entry, index, list) => list.findIndex((candidate) => candidate.moduleKey === entry.moduleKey) === index).slice(0, 3);

  return deduped.map((entry) => {
    const label = entry.moduleKey === 'expeditions' ? 'Expeditions' : getWorldModuleLabel(entry.moduleKey);
    const moduleKey = entry.moduleKey as 'outskirts' | 'ruins' | 'expeditions';
    const targetCityId = entry.cityId ?? args.cityId;
    const routeable = Boolean(targetCityId && city?.modules.includes(moduleKey));
    const icon = fallback.find((item) => item.moduleKey === moduleKey)?.icon ?? 'bookEarth';
    return {
      ...createForgeExactButton(`source-${moduleKey}`, label, 'route-source', {
        variant: 'route',
        enabled: routeable,
        reasonIfDisabled: routeable ? undefined : `${label} is not routeable in this city.`,
        route: { cityId: targetCityId, moduleKey },
      }),
      icon,
      intent: 'route-source',
      variant: 'route',
    };
  });
}

function outputPreview(args: {
  blueprint: NormalizedForgeBlueprint | null;
  activeTab: ForgeExactTab;
  targetSlot: EquipmentSlot;
  floor: ForgeFloorReadModel;
}): ForgeExactMaterialInspector['outputPreview'] {
  if (args.activeTab === 'runes') {
    const outputName = itemName(args.blueprint?.output?.itemId);
    return {
      title: 'Output Preview',
      itemName: outputName,
      itemIcon: 'artifactShard',
      upgradeLabel: 'Rune x1',
      rows: [
        { id: 'family', label: 'Rune Family', before: 'Uncrafted', after: outputName.replace(/^Rune:\s*/u, ''), status: 'recommended' },
        { id: 'techniques', label: 'Technique Fit', before: 'Socket empty', after: 'Socket-ready', status: 'met' },
        { id: 'stability', label: 'Stability', before: 'Safe', after: 'Safe', status: 'met' },
      ],
    };
  }

  if (args.activeTab === 'temper') {
    const current = args.floor.temperSuccessesBySlot[args.targetSlot] ?? 0;
    const baseChance = Number(args.blueprint?.effect?.baseProcChancePct ?? 25);
    return {
      title: 'Output Preview',
      itemName: `${args.targetSlot === 'weapon' ? 'Weapon' : 'Accessory'} Temper`,
      itemIcon: args.targetSlot === 'weapon' ? 'rustySword' : 'prayerBeads',
      upgradeLabel: `${current} -> ${current + 1}`,
      rows: [
        { id: 'chance', label: 'Proc Chance', before: `${baseChance}%`, after: `${baseChance}%+`, status: 'warning' },
        { id: 'affix', label: 'Affix Pool', before: 'Current', after: 'Temper roll', status: 'recommended' },
        { id: 'stability', label: 'Stability', before: 'Safe', after: 'Safe', status: 'met' },
      ],
    };
  }

  const current = args.targetSlot === 'weapon' ? args.floor.weaponRefineFloor : args.floor.accessoryRefineFloor;
  const next = current + 1;
  const target = args.targetSlot === 'weapon'
    ? args.floor.nextGateRecommendation?.weaponRefine ?? next
    : args.floor.nextGateRecommendation?.accessoryRefine ?? next;
  const itemLabel = args.targetSlot === 'weapon' ? 'Equipped Weapon' : 'Equipped Accessory';
  return {
    title: 'Output Preview',
    itemName: itemLabel,
    itemIcon: args.targetSlot === 'weapon' ? 'rustySword' : 'prayerBeads',
    upgradeLabel: `+${current} -> +${next}`,
    rows: [
      { id: 'main-stat', label: args.targetSlot === 'weapon' ? 'ATK' : 'DEF', before: 'Current', after: 'Higher', status: 'recommended' },
      { id: 'floor', label: `Gate ${args.targetSlot === 'weapon' ? 'Weapon' : 'Accessory'} Floor`, before: current >= target ? 'Met' : 'Missing', after: next >= target ? 'Met' : 'Closer', status: next >= target ? 'met' : 'warning' },
      { id: 'stability', label: 'Stability', before: 'Safe', after: 'Safe', status: 'met' },
    ],
  };
}

function buildInspector(args: {
  content: ValidatedContent | null;
  cityId: string | null;
  blueprint: NormalizedForgeBlueprint | null;
  activeTab: ForgeExactTab;
  activeMode: ForgeExactMode;
  targetSlot: EquipmentSlot;
  floor: ForgeFloorReadModel;
}): ForgeExactMaterialInspector {
  const preview = outputPreview(args);
  const modeLabel = getForgeExactModeLabel(args.activeMode);
  const tabLabel = getForgeExactTabLabel(args.activeTab);
  return {
    title: 'Material Inspector',
    materialsTitle: 'Materials',
    materialRows: buildMaterialRows(args.blueprint),
    outputPreview: preview,
    bestSources: {
      title: 'Best Sources',
      buttons: sourceButtons({ content: args.content, cityId: args.cityId, blueprint: args.blueprint }),
    },
    recommendation: {
      title: 'Recommendation',
      headline: `Recommended now: ${modeLabel} ${tabLabel}`,
      reason: args.activeTab === 'refine'
        ? `Reason: ${compactGateLabel(args.floor.nextGateRecommendation?.gateLabel ?? gateLabelForCity(args.content, args.cityId))} ${args.targetSlot === 'weapon' ? 'weapon' : 'accessory'} floor`
        : args.activeTab === 'temper'
          ? 'Reason: permanent temper floor'
          : 'Reason: rune socket readiness',
      status: 'recommended',
    },
  };
}

function buildCenterStage(args: {
  activeTab: ForgeExactTab;
  targetSlot: EquipmentSlot;
  floor: ForgeFloorReadModel;
  actionResult?: BuildOptions['actionResult'];
  activeSessionEmbedded?: boolean;
}): ForgeExactSurfaceV1['centerStage'] {
  const tabLabel = getForgeExactTabLabel(args.activeTab);
  const current = args.targetSlot === 'weapon' ? args.floor.weaponRefineFloor : args.floor.accessoryRefineFloor;
  const target = args.targetSlot === 'weapon'
    ? args.floor.nextGateRecommendation?.weaponRefine ?? current + 1
    : args.floor.nextGateRecommendation?.accessoryRefine ?? current + 1;
  const seal = args.activeTab === 'refine'
    ? {
        kicker: current >= target ? 'MEETS' : 'BELOW',
        title: 'GATE FLOOR',
        stat: `${args.targetSlot === 'weapon' ? 'Weapon' : 'Accessory'} +${current} / +${target}`,
        detail: current >= target ? 'This floor already meets the next gate check' : 'This refine fixes the largest gate gap',
        status: current >= target ? 'met' as const : 'recommended' as const,
      }
    : args.activeTab === 'temper'
      ? {
          kicker: 'TEMPER',
          title: 'FLOOR CHECK',
          stat: `${args.floor.temperSuccessTotal} / ${args.floor.nextGateRecommendation?.temperSuccesses ?? 1}`,
          detail: 'Tempering adds durable affix pressure',
          status: 'warning' as const,
        }
      : {
          kicker: 'RUNE',
          title: 'SEAL PLATE',
          stat: args.floor.runeSummaryLabel === 'No crafted runes yet' ? 'None' : args.floor.runeSummaryLabel,
          detail: 'Inscribe runes for technique sockets',
          status: 'neutral' as const,
        };

  return {
    assetKey: centerAssetForTab(args.activeTab),
    title: `${tabLabel} Stage`,
    subtitle: 'Permanent floor action',
    mood: args.activeTab,
    workpieceLabel: args.activeTab === 'refine'
      ? `${args.targetSlot === 'weapon' ? 'Equipped Weapon' : 'Equipped Accessory'} +${current}`
      : args.activeTab === 'temper'
        ? `${args.targetSlot === 'weapon' ? 'Weapon' : 'Accessory'} Temper ${args.floor.temperSuccessTotal}`
        : 'Rune Seal Plate',
    activeSessionEmbedded: args.activeSessionEmbedded ?? false,
    readinessSeal: seal,
    resultOverlay: args.actionResult
      ? { title: args.actionResult.title, lines: args.actionResult.lines }
      : undefined,
  };
}

function shellFlags() {
  const assetWarnings = getForgeExactAssetWarnings();
  return {
    useScreenOwnedExactPage: true as const,
    showLegacyForgeWorkshop: false as const,
    singleDominantCta: true as const,
    bottomNavVisible: false,
    assetWarnings,
  };
}

export function createForgeExactMockupFixture(
  overrides: Partial<ForgeExactSurfaceV1> = {},
): ForgeExactSurfaceV1 {
  const surface: ForgeExactSurfaceV1 = {
    meta: {
      surfaceId: 'forge-exact',
      version: FORGE_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      cityId: FORGE_EXACT_DEFAULT_CITY_ID,
      cityName: FIXTURE_CITY_NAME,
      activeTab: 'refine',
      activeMode: 'assisted',
      activityMode: 'fixture',
      selectedBlueprintId: null,
      selectedTargetSlot: 'weapon',
      rootTestId: FORGE_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: FORGE_EXACT_ASSETS,
    page: {
      title: 'Forge',
      subtitle: 'Permanent floor workshop',
    },
    topTruthStrip: FORGE_EXACT_FIXTURE_TRUTH_CELLS,
    centerHeader: {
      title: 'Pinewind Forge',
      subtitle: 'Raise the permanent floor for the next gate',
      chips: [
        { id: 'refine-selected', label: 'Refine Selected', status: 'recommended' },
        { id: 'assisted-recommended', label: 'Assisted Recommended', status: 'met' },
        { id: 'gate-floor-check', label: 'Gate Floor Check', status: 'neutral' },
      ],
    },
    leftRail: {
      title: 'Forge Discipline',
      tabs: tabRows('refine'),
      modes: modeRows({ activeMode: 'assisted', selectedBlueprint: null, fixture: true }).map((row) =>
        row.id === 'handsOn' ? { ...row, note: 'Temper only' } : row,
      ),
      tools: fixtureToolRows(),
    },
    centerStage: {
      assetKey: 'refineCenter',
      title: 'Refine Stage',
      subtitle: 'Permanent floor action',
      mood: 'refine',
      workpieceLabel: 'Pinewind Iron Sword +2',
      activeSessionEmbedded: false,
      readinessSeal: {
        kicker: 'BELOW',
        title: 'GATE FLOOR',
        stat: 'Weapon +2 / +3',
        detail: 'This refine fixes the largest gate gap',
        status: 'recommended',
      },
    },
    rightInspector: {
      title: 'Material Inspector',
      materialsTitle: 'Materials',
      materialRows: [
        { id: 'spirit-iron-ore', label: 'Spirit Iron Ore', ownedLabel: '8', neededLabel: '8', valueLabel: '8 / 8', icon: 'metalChunk', status: 'met' },
        { id: 'charcoal-resin', label: 'Charcoal Resin', ownedLabel: '4', neededLabel: '4', valueLabel: '4 / 4', icon: 'dustBrown', status: 'met' },
        { id: 'jade-sand', label: 'Jade Sand', ownedLabel: '2', neededLabel: '2', valueLabel: '2 / 2', icon: 'dustGreen', status: 'met' },
        { id: 'gold', label: 'Gold', ownedLabel: '650', neededLabel: '500', valueLabel: '650 / 500', icon: 'placeholderRingSmall', status: 'met' },
      ],
      outputPreview: {
        title: 'Output Preview',
        itemName: 'Pinewind Iron Sword',
        itemIcon: 'rustySword',
        upgradeLabel: '+2 -> +3',
        rows: [
          { id: 'atk', label: 'ATK', before: '49', after: '56', status: 'recommended' },
          { id: 'gate-weapon-floor', label: 'Gate Weapon Floor', before: 'Missing', after: 'Met', status: 'met' },
          { id: 'stability', label: 'Stability', before: '', after: 'Safe', status: 'met' },
        ],
      },
      bestSources: {
        title: 'Best Sources',
        buttons: [
          { ...createForgeExactButton('source-outskirts', 'Outskirts', 'route-source', { variant: 'route', route: { cityId: FORGE_EXACT_DEFAULT_CITY_ID, moduleKey: 'outskirts' } }), icon: 'bookEarth', intent: 'route-source', variant: 'route' },
          { ...createForgeExactButton('source-ruins', 'Ruins', 'route-source', { variant: 'route', route: { cityId: FORGE_EXACT_DEFAULT_CITY_ID, moduleKey: 'ruins' } }), icon: 'artifactBundle', intent: 'route-source', variant: 'route' },
          { ...createForgeExactButton('source-expeditions', 'Expeditions', 'route-source', { variant: 'route', route: { cityId: FORGE_EXACT_DEFAULT_CITY_ID, moduleKey: 'expeditions' } }), icon: 'bookMartial', intent: 'route-source', variant: 'route' },
        ],
      },
      recommendation: {
        title: 'Recommendation',
        headline: 'Recommended now: Assisted Refine',
        reason: 'Reason: fixture gate weapon floor',
        status: 'recommended',
      },
    },
    floorRail: {
      title: 'Permanent Floor',
      nodes: asFloorNodes([
        { id: 'weapon', label: 'Weapon', value: '+2 -> +3', icon: 'rustySword', status: 'recommended' },
        { id: 'accessory', label: 'Accessory', value: '+1 -> +2', icon: 'prayerBeads', status: 'warning' },
        { id: 'temper', label: 'Temper', value: '0 -> 1', icon: 'metalChunk', status: 'warning' },
        { id: 'rune', label: 'Rune Target', value: 'None', icon: 'artifactShard', status: 'neutral' },
        { id: 'gate', label: 'Foundation Gate', value: 'Target', icon: 'bookEarth', status: 'neutral' },
      ]),
      comparisonLine: 'Current Floor: 68 / 100   |   After Refine: 76 / 100   |   Largest Gap Fixed: Weapon Floor',
    },
    primaryAction: createForgeExactButton('start-assisted-refine', 'Start Assisted Refine', 'start-forge', {
      variant: 'primary',
      mode: 'assisted',
      targetSlot: 'weapon',
    }),
    secondaryActions: [
      createForgeExactButton('start-idle-refine', 'Start Idle Refine', 'start-forge', {
        variant: 'secondary',
        mode: 'idle',
        targetSlot: 'weapon',
      }),
    ],
    debug: {
      notes: ['Fixture values are locked to the Forge Exact mockup. Center/background assets are semantic and may be fallback-backed.'],
    },
  };

  return { ...surface, ...overrides };
}

export function buildForgeExactSurfaceFromStores(
  cityId?: string | null,
  options: BuildOptions = {},
): ForgeExactSurfaceV1 {
  if (options.mode === 'fixture') {
    return createForgeExactMockupFixture({
      meta: {
        ...createForgeExactMockupFixture().meta,
        cityId: cityId ?? FORGE_EXACT_DEFAULT_CITY_ID,
      },
    });
  }

  const now = options.now ?? Date.now();
  const contentStore = useContentStore.getState();
  const content = contentStore.raw;
  const resolvedCityId = resolveCityId(cityId);
  const city = resolvedCityId ? contentStore.maps.citiesById[resolvedCityId] : null;
  const cityName = city?.name ?? 'Pinewind';
  const activeTab = options.activeTab ?? 'refine';
  const floor = getLiveForgeFloorReadModel({ cityId: resolvedCityId });
  const visibleBlueprints = resolvedCityId ? listForgeBlueprintsForCity({ cityId: resolvedCityId }) : listForgeBlueprints();
  const activeSession = useCraftSessionStore.getState().activeSession;
  const selectedBlueprint = selectBlueprint({
    visibleBlueprints,
    activeTab,
    selectedBlueprintId: options.selectedBlueprintId,
    activeSessionSourceId: activeSession?.station === 'forge' ? activeSession.sourceId : null,
    floor,
  });
  const activeMode = normalizeMode(selectedBlueprint, options.activeMode ?? 'assisted');
  const targetSlot =
    options.selectedTargetSlot ??
    getBlueprintTargetSlot(selectedBlueprint) ??
    pickRecommendedSlot(activeTab, floor);
  const queue = queueInfo(now);
  const activeActivity = useActivityStore.getState().active;
  const activeOtherActivity = Boolean(activeActivity && activeActivity.type !== 'forge');
  const canStart = selectedBlueprint
    ? useProfessionStore.getState().canStartForge(selectedBlueprint.id, 1, selectedBlueprint.type === 'service' ? targetSlot : undefined)
    : { ok: false, reason: 'No visible Forge blueprint' };
  const allowedModes: ForgeModeOption[] = selectedBlueprint ? getAllowedForgeModes(selectedBlueprint) : ['idle', 'assisted'];
  const modeAllowed = selectedBlueprint ? allowedModes.includes(activeMode) : false;
  const activeSessionEmbedded = activeSession?.station === 'forge';
  const activityMode: ForgeExactActivityMode =
    options.actionResult ? 'result'
      : queue.mode === 'readyToClaim' ? 'readyToClaim'
      : activeSessionEmbedded ? 'active'
      : queue.mode === 'queued' || queue.mode === 'active' ? queue.mode
      : !selectedBlueprint || !canStart.ok || activeOtherActivity || !modeAllowed ? 'blocked'
      : 'planning';
  const gateLabel = floor.nextGateRecommendation?.gateLabel ?? gateLabelForCity(content, resolvedCityId);
  const surfaceModel = buildForgeSurfaceModel({ blueprints: visibleBlueprints, activeTab, floor });
  const materialRows = buildMaterialRows(selectedBlueprint);
  const missingMaterial = materialRows.find((row) => row.status === 'missing');
  const primaryLabel = queue.readyJob ? 'Claim Result' : ctaVerb(activeTab, activeMode);
  const primaryEnabled = queue.readyJob
    ? true
    : Boolean(selectedBlueprint && canStart.ok && modeAllowed && !activeOtherActivity);
  const primaryAction = createForgeExactButton(queue.readyJob ? `claim-${queue.readyJob.id}` : `start-${activeMode}-${activeTab}`, primaryLabel, queue.readyJob ? 'claim-forge' : 'start-forge', {
    variant: 'primary',
    enabled: primaryEnabled,
    reasonIfDisabled: activeOtherActivity ? 'Finish the active activity first.' : canStart.ok ? undefined : canStart.reason ?? missingMaterial?.label,
    mode: activeMode,
    targetSlot,
  });
  const secondary = secondaryMode(activeMode, allowedModes);
  const secondaryActions: ForgeExactButtonSurface[] = secondary
    ? [
        createForgeExactButton(`start-${secondary}-${activeTab}`, ctaVerb(activeTab, secondary), 'start-forge', {
          variant: 'secondary',
          enabled: Boolean(selectedBlueprint && canStart.ok && !activeOtherActivity),
          reasonIfDisabled: activeOtherActivity ? 'Finish the active activity first.' : canStart.reason,
          mode: secondary,
          targetSlot,
        }),
      ]
    : [];

  return {
    meta: {
      surfaceId: 'forge-exact',
      version: FORGE_EXACT_SURFACE_VERSION,
      mode: 'live',
      cityId: resolvedCityId,
      cityName,
      activeTab,
      activeMode,
      activityMode,
      selectedBlueprintId: selectedBlueprint?.id ?? null,
      selectedTargetSlot: targetSlot,
      readyJobId: queue.readyJob?.id ?? null,
      rootTestId: FORGE_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: FORGE_EXACT_ASSETS,
    page: {
      title: 'Forge',
      subtitle: 'Permanent floor workshop',
    },
    topTruthStrip: buildTopTruth({ content, cityId: resolvedCityId, floor, queueLabel: queue.label }),
    centerHeader: {
      title: formatCityForgeName(cityName),
      subtitle: 'Raise the permanent floor for the next gate',
      chips: [
        { id: `${activeTab}-selected`, label: `${getForgeExactTabLabel(activeTab)} Selected`, status: 'recommended' },
        { id: `${activeMode}-recommended`, label: `${getForgeExactModeLabel(activeMode)} Recommended`, status: 'met' },
        { id: 'gate-floor-check', label: 'Gate Floor Check', status: 'neutral' },
      ] satisfies ForgeExactChip[],
    },
    leftRail: {
      title: 'Forge Discipline',
      tabs: tabRows(activeTab).map((tab) => ({
        ...tab,
        enabled: surfaceModel.tabs.some((surfaceTab) => surfaceTab.id === tab.id && surfaceTab.count > 0),
        description: `${surfaceModel.tabs.find((surfaceTab) => surfaceTab.id === tab.id)?.count ?? 0} visible`,
      })),
      modes: modeRows({ activeMode, selectedBlueprint }),
      tools: toolRows(),
    },
    centerStage: buildCenterStage({
      activeTab,
      targetSlot,
      floor,
      actionResult: options.actionResult,
      activeSessionEmbedded,
    }),
    rightInspector: buildInspector({
      content,
      cityId: resolvedCityId,
      blueprint: selectedBlueprint,
      activeTab,
      activeMode,
      targetSlot,
      floor,
    }),
    floorRail: floorRail({ floor, activeTab, gateLabel }),
    primaryAction,
    secondaryActions,
    mandateSourceSink: buildLiveDaoMandateModuleSourceSinkProjection({
      currentCityId: resolvedCityId,
      currentModuleKey: 'forge',
      currentScreen: 'forge',
    }),
    debug: {
      notes: [
        'Live Forge Exact surface is built from visible live Forge getters, floor read model, inventory, queue, and mode policy.',
        ...(selectedBlueprint && !canStart.ok ? [`Start blocked: ${canStart.reason ?? 'unknown'}`] : []),
      ],
      visibleBlueprintIds: visibleBlueprints.map((blueprint) => blueprint.id),
      hiddenBlueprintLeakCheck: ['formation_plate_basic', 'forge_jade_core_shell_t1', 'rune_inscription_basic']
        .filter((id) => visibleBlueprints.some((blueprint) => blueprint.id === id)),
    },
  };
}
