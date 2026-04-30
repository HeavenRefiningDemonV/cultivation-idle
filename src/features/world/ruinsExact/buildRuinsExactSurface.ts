import { useContentStore } from '../../../stores/contentStore.js';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { RUINS_EXACT_REGION_ORDER, RUINS_EXACT_SURFACE_VERSION, RUINS_FIXTURE_COPY, RUINS_TARGET_MOCKUP_ID } from './ruinsExactPresentation.js';
import { buildRuinsRouteNodes } from './ruinsExactRouteNodes.js';
import type { RuinsExactSurfaceV1 } from './types.js';

export interface BuildRuinsExactSurfaceOptions { mode?: 'fixture' | 'live'; cityId?: string; ruinId?: string | null; nowMs?: number }

const shell = { showCombatModuleTopLane: false, showRuinsSummaryCard: false, showRuinsProgress: false, showRuinsCtaZone: false, showCombatPathModule: false, showLargeDuelOverlay: false, showCombatHpBars: false, showGoldPrimaryRewardPanel: false, useScreenOwnedExactPage: true, singleDominantCta: true } as const;

export function createRuinsExactMockupFixture(overrides: Partial<RuinsExactSurfaceV1> = {}): RuinsExactSurfaceV1 {
  const surface: RuinsExactSurfaceV1 = {
    meta: { surfaceId: 'ruins-exact-mockup', version: RUINS_EXACT_SURFACE_VERSION, mode: 'fixture', source: 'fixture', cityId: 'city_pinewind_hamlet', ruinId: 'ruin_hollow_log_den', targetMockupId: RUINS_TARGET_MOCKUP_ID, activityMode: 'active' },
    page: { title: 'Ruins' },
    topRibbon: { ariaLabel: 'Ruins Run Compass', decorative: true, activeNodeId: 'n9', nodes: Array.from({ length: 15 }, (_, i) => ({ id: `n${i + 1}`, label: `${i + 1}`, state: i < 8 ? 'completed' : i === 8 ? 'current' : 'future', variant: i === 8 ? 'active' : 'muted' })) },
    tacticalStrip: { ariaLabel: 'Ruins tactical readout', cells: [
      { id: 'hp', label: 'HP', primaryText: RUINS_FIXTURE_COPY.tactical[0], iconKey: 'hp', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: 100, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'depth', label: 'Depth', primaryText: RUINS_FIXTURE_COPY.tactical[1], iconKey: 'depth', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'loadout', label: 'Loadout', primaryText: RUINS_FIXTURE_COPY.tactical[2], iconKey: 'loadout', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'aiProfile', label: 'AI Profile', primaryText: RUINS_FIXTURE_COPY.tactical[3], iconKey: 'aiProfile', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'healing', label: 'Healing', primaryText: RUINS_FIXTURE_COPY.tactical[4], iconKey: 'healing', tone: 'warning', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'bounty', label: 'Bounty', primaryText: RUINS_FIXTURE_COPY.tactical[5], iconKey: 'bounty', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
      { id: 'expedition', label: 'Expedition', primaryText: RUINS_FIXTURE_COPY.tactical[6], iconKey: 'expedition', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'fixture' },
    ] },
    areaHeader: { plaqueLabel: RUINS_FIXTURE_COPY.plaque, showDropdownCaret: true, subtitle: RUINS_FIXTURE_COPY.subtitle, chips: [{ id: 'targeted-mats', label: 'Targeted Mats' }, { id: 'deterministic-support', label: 'Deterministic Support' }] },
    kitCard: { title: 'Ruin Kit', stamp: { label: 'In Ruin', tone: 'active' }, setupRows: [{ id: 'loadoutSet', label: 'Loadout Set', value: '1', iconKey: 'loadoutSet', source: 'fixture' }, { id: 'aiProfile', label: 'AI Profile', value: 'Balanced', iconKey: 'aiProfile', source: 'fixture' }, { id: 'explorationFocus', label: 'Exploration Focus', value: 'Materials', iconKey: 'explorationFocus', source: 'fixture' }], survivalRows: [{ id: 'hp', label: 'HP', value: '131', iconKey: 'hp', source: 'fixture' }, { id: 'eva', label: 'EVA', value: '10%', iconKey: 'eva', source: 'fixture' }, { id: 'res', label: 'RES', value: '3%', iconKey: 'res', source: 'fixture' }], medicinePouch: { label: 'Medicine Pouch', value: '0 / 20', iconKey: 'medicinePouch', action: { visible: true, enabled: true, label: '+', ariaLabel: 'Open medicine pouch' }, source: 'fixture' }, equipmentGrid: [{ slotId: 'weapon', label: 'Weapon', value: '—', iconKey: 'weapon', source: 'fixture', filled: false }, { slotId: 'manual', label: 'Manual', value: '—', iconKey: 'manual', source: 'fixture', filled: false }, { slotId: 'ring', label: 'Ring', value: '—', iconKey: 'ring', source: 'fixture', filled: false }, { slotId: 'boots', label: 'Boots', value: '—', iconKey: 'boots', source: 'fixture', filled: false }, { slotId: 'charm', label: 'Charm', value: '—', iconKey: 'charm', source: 'fixture', filled: false }, { slotId: 'talisman', label: 'Talisman', value: '—', iconKey: 'talisman', source: 'fixture', filled: false }] },
    scenicStage: { approvedScenePlateSrc: null, fallbackScenePlateSrc: '/src/assets/background/citystates/city_ruins.png', useApprovedMockupPlate: false, environmentDescriptor: 'Pinewind Hollow Log Den root chamber path', hasLargeDuelOverlay: false, hasCombatHpBars: false },
    targetedMaterialsCard: { title: 'Targeted Materials', leadMaterials: [{ label: 'Spirit Leaf', itemIds: ['mat_spirit_leaf'] }, { label: 'Beast Materials', itemIds: ['mat_beast_bone', 'mat_beast_blood'] }], guaranteedAnchor: { label: 'Core Fragment x1', itemId: 'mat_core_fragment', quantity: 1, sourceLabel: 'Final Chest' }, rarePity: '1 / 6', rarePityDots: { total: 6, filled: 1 }, autoRepeat: { value: 'Off', helperText: 'Repeats after Final Chest' }, footer: 'Best used for targeted local materials, not gold.' },
    roomRoute: { title: 'Hollow Log Den Route', chip: 'Anchor Chest in 3', nodes: buildRuinsRouteNodes('ruin_hollow_log_den', 1) },
    primaryAction: { label: 'Continue Exploration', intent: 'continue-exploration', enabled: true, singleDominantCta: true },
    explorationSummary: { title: 'Exploration Summary', rows: [{ label: 'Rooms', value: '2 / 5' }, { label: 'Anchor', value: 'Final Chest' }, { label: 'Pity', value: '1 / 6' }, { label: 'Main Target', value: 'Spirit Leaf' }] },
    shell,
    debug: { regionOrder: RUINS_EXACT_REGION_ORDER, missingDataFallbacks: [], placeholderAssetKeysInUse: ['city_ruins.png'], liveSourceNotes: [], fixtureLockedValues: ['Rare Pity 1 / 6', 'Continue Exploration'] },
  };
  return { ...surface, ...overrides };
}

export function buildRuinsExactSurfaceFromStores(cityId?: string, options: BuildRuinsExactSurfaceOptions = {}): RuinsExactSurfaceV1 {
  if (options.mode === 'fixture') return createRuinsExactMockupFixture({ meta: { ...createRuinsExactMockupFixture().meta, mode: 'fixture' } });
  const missing: string[] = [];
  const notes: string[] = [];
  const content = useContentStore.getState();
  const ruins = useRuinsStore.getState();
  const resolvedCityId = cityId ?? 'city_pinewind_hamlet';
  const city = content.maps.citiesById[resolvedCityId];
  if (!city) missing.push('missing city; fallback city_pinewind_hamlet');
  const ruinRefId = options.ruinId ?? resolveModuleRef(city ?? null, 'ruins');
  const ruinDef = ruinRefId ? content.maps.ruinsById[ruinRefId] : null;
  if (!ruinDef) missing.push('missing ruin definition');
  const activeRun = ruins.activeRun;
  const progress = ruinRefId ? ruins.progressByRuinId[ruinRefId] : undefined;
  const pityCap = content.raw?.economy?.tuning?.pityDefaults?.ruinsBossChestRare?.pityCap;
  if (!pityCap) missing.push('missing economy pity cap');
  const roomCount = ruinDef?.roomCount ?? activeRun?.roomCount ?? 5;
  const roomIndex = activeRun ? Math.max(0, Math.min(activeRun.roomIndex, roomCount - 1)) : 1;
  const pityFailures = progress?.bossChestRareFailures ?? 0;
  const pityText = pityCap ? `${Math.min(pityFailures, pityCap)} / ${pityCap}` : '0 / 0';
  const activityMode = !ruinDef ? 'unavailable' : activeRun?.stopping ? 'transitioning' : activeRun ? 'active' : 'idle';
  const leadDrops = (ruinDef as { roomDrops?: Array<{ itemId: string }> } | null)?.roomDrops ?? [];
  const hasSpiritLeaf = leadDrops.some((d) => d.itemId === 'mat_spirit_leaf');
  const beastIds = ['mat_beast_bone', 'mat_beast_blood'];
  const finalChestAnchor = ruinDef?.finalChestDrops?.guaranteed?.find((d) => d.itemId === 'mat_core_fragment');
  if (!finalChestAnchor) missing.push('missing final chest core fragment guaranteed drop');
  const primaryAction = activityMode === 'transitioning' ? { label: 'Stopping...', intent: 'stopping' as const, enabled: false, singleDominantCta: true as const }
    : activityMode === 'active' ? { label: 'Continue Exploration', intent: 'continue-exploration' as const, enabled: true, singleDominantCta: true as const }
    : activityMode === 'unavailable' ? { label: 'Enter Ruins', intent: 'enter-ruins' as const, enabled: false, singleDominantCta: true as const }
    : { label: 'Enter Ruins', intent: 'enter-ruins' as const, enabled: true, singleDominantCta: true as const };
  notes.push('Beast Materials is a presentation grouping of mat_beast_bone + mat_beast_blood.');
  return {
    ...createRuinsExactMockupFixture(),
    meta: { surfaceId: 'ruins-exact-mockup', version: RUINS_EXACT_SURFACE_VERSION, mode: 'live', source: 'stores', cityId: resolvedCityId, ruinId: ruinDef?.id ?? null, targetMockupId: RUINS_TARGET_MOCKUP_ID, activityMode },
    tacticalStrip: { ariaLabel: 'Ruins tactical readout', cells: [
      { id: 'hp', label: 'HP', primaryText: '131 / 131', iconKey: 'hp', tone: 'positive', showCaret: false, showNotificationDot: false, showUnderlineBar: true, underlineBarPct: 100, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
      { id: 'depth', label: 'Depth', primaryText: `Room ${roomIndex + 1} / ${roomCount} · Lv. 11`, iconKey: 'depth', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'derived' },
      { id: 'loadout', label: 'Loadout', primaryText: 'Loadout 1', iconKey: 'loadout', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
      { id: 'aiProfile', label: 'AI Profile', primaryText: 'Balanced', iconKey: 'aiProfile', tone: 'neutral', showCaret: true, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
      { id: 'healing', label: 'Healing', primaryText: '0 / 20', iconKey: 'healing', tone: 'warning', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
      { id: 'bounty', label: 'Bounty', primaryText: 'No tracked bounty', iconKey: 'bounty', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
      { id: 'expedition', label: 'Expedition', primaryText: '2 Idle', iconKey: 'expedition', tone: 'neutral', showCaret: false, showNotificationDot: false, showUnderlineBar: false, visible: true, reserveAdornmentSpace: true, source: 'synthetic' },
    ] },
    targetedMaterialsCard: {
      title: 'Targeted Materials',
      leadMaterials: [{ label: hasSpiritLeaf ? (content.maps.itemsById.mat_spirit_leaf?.name ?? 'mat_spirit_leaf') : 'Spirit Leaf', itemIds: ['mat_spirit_leaf'] }, { label: 'Beast Materials', itemIds: beastIds }],
      guaranteedAnchor: { label: `Core Fragment x${finalChestAnchor?.qty ?? 1}`, itemId: 'mat_core_fragment', quantity: 1, sourceLabel: 'Final Chest' },
      rarePity: pityText, rarePityDots: { total: pityCap ?? 0, filled: Math.min(pityFailures, pityCap ?? 0) }, autoRepeat: { value: ruins.autoRepeatDefault ? 'On' : 'Off', helperText: 'Repeats after Final Chest' }, footer: 'Best used for targeted local materials, not gold.'
    },
    roomRoute: { title: `${ruinDef?.name ?? 'Hollow Log Den'} Route`, chip: `Anchor Chest in ${Math.max(0, 4 - roomIndex)}`, nodes: buildRuinsRouteNodes(ruinDef?.id ?? 'ruin_hollow_log_den', roomIndex) },
    kitCard: createRuinsExactMockupFixture().kitCard,
    primaryAction,
    explorationSummary: { title: 'Exploration Summary', rows: [{ label: 'Rooms', value: `${roomIndex + 1} / ${roomCount}` }, { label: 'Anchor', value: 'Final Chest' }, { label: 'Pity', value: pityText }, { label: 'Main Target', value: content.maps.itemsById.mat_spirit_leaf?.name ?? 'mat_spirit_leaf' }] },
    debug: { regionOrder: RUINS_EXACT_REGION_ORDER, missingDataFallbacks: missing, placeholderAssetKeysInUse: ['city_ruins.png'], liveSourceNotes: notes, fixtureLockedValues: ['Rare Pity 1 / 6 (fixture only)'] },
  };
}
