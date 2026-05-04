import { useContentStore } from '../../../stores/contentStore.js';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { RUINS_EXACT_REGION_ORDER, RUINS_EXACT_SURFACE_VERSION, RUINS_FIXTURE_COPY, RUINS_TARGET_MOCKUP_ID } from './ruinsExactPresentation.js';
import { buildRuinsRouteNodes } from './ruinsExactRouteNodes.js';
import type { RuinsExactSurfaceV1, RuinsKitCardSurface, RuinsPrimaryActionSurface, RuinsExactValueSource } from './types.js';

export interface BuildRuinsExactSurfaceOptions { mode?: 'fixture' | 'live'; cityId?: string; ruinId?: string | null; nowMs?: number }


function buildRuinsKitStatSections(source: 'fixture' | 'synthetic'): RuinsKitCardSurface['statSections'] {
  return [
    { id: 'offense', title: 'Offense', rows: [
      { id: 'atk', label: 'ATK', value: '23', iconKey: 'atk', source },
      { id: 'acc', label: 'ACC', value: '92%', iconKey: 'acc', source },
      { id: 'crt', label: 'CRT', value: '15%', iconKey: 'crt', source },
    ] },
    { id: 'defense', title: 'Defense', rows: [
      { id: 'hp', label: 'HP', value: '131', iconKey: 'hp', source },
      { id: 'eva', label: 'EVA', value: '10%', iconKey: 'eva', source },
      { id: 'res', label: 'RES', value: '3%', iconKey: 'res', source },
    ] },
  ];
}

function buildRuinsKitCardSurface(input: { source: 'fixture' | 'synthetic'; isInRuin: boolean }): RuinsKitCardSurface {
  return {
    title: 'Ruin Kit' ,
    stamp: input.isInRuin ? { label: 'In Ruin' , tone: 'active' as const } : null,
    setupRows: [
      { id: 'loadoutSet', label: 'Loadout Set', value: '1', iconKey: 'loadoutSet', source: input.source },
      { id: 'aiProfile', label: 'AI Profile', value: 'Balanced', iconKey: 'aiProfile', source: input.source },
      { id: 'explorationFocus', label: 'Exploration Focus', value: 'Materials', iconKey: 'explorationFocus', source: input.source },
    ] ,
    statSections: buildRuinsKitStatSections(input.source),
    medicinePouch: { label: 'Medicine Pouch' , value: '0 / 20', iconKey: 'medicinePouch', action: { visible: true, enabled: true, label: '+', ariaLabel: 'Open medicine pouch' }, source: input.source },
    equipmentGrid: [
      { slotId: 'weapon', label: 'Weapon', value: '—', iconKey: 'weapon', source: input.source, filled: false },
      { slotId: 'manual', label: 'Manual', value: '—', iconKey: 'manual', source: input.source, filled: false },
      { slotId: 'ring', label: 'Ring', value: '—', iconKey: 'ring', source: input.source, filled: false },
      { slotId: 'boots', label: 'Boots', value: '—', iconKey: 'boots', source: input.source, filled: false },
      { slotId: 'charm', label: 'Charm', value: '—', iconKey: 'charm', source: input.source, filled: false },
      { slotId: 'talisman', label: 'Talisman', value: '—', iconKey: 'talisman', source: input.source, filled: false },
    ] ,
  };
}

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
    kitCard: buildRuinsKitCardSurface({ source: 'fixture', isInRuin: true }),
    scenicStage: { artStatus: 'deferred', assetKind: 'deferred-hollow-log-den', approvedScenePlateSrc: null, activeScenePlateSrc: null, reservedApprovedSourcePath: 'docs/release/qa/ui-cutover/ruins-exact/approved-mockup/ruins-hollow-log-den-approved-exact.png', reservedApprovedPlatePath: 'src/assets/world/ruins/hollow-log-den-scene-approved-plate.png', useApprovedMockupPlate: false, requiresFinalArtBinding: true, environmentDescriptor: 'Deferred Hollow Log Den scene slot for the future approved root-and-stone Pinewind ruin chamber plate.', plateAlt: 'Deferred Hollow Log Den central scenic field', frameVariant: 'deferred-root-chamber-frame', crop: { sourceWidth: 2048, sourceHeight: 1152, x: 362, y: 270, width: 1315, height: 595 }, visualFlags: { hasLargeDuelOverlay: false, hasCombatHpBars: false, hasSceneTitleOverlay: false, usesOldCombatPathScene: false, usesCityRuinsSubstitute: false, usesInsideDungeonSubstitute: false, usesCssAsFinalArt: false } },
    targetedMaterialsCard: { title: 'Targeted Materials', leadMaterialsTitle: 'Lead Materials', leadMaterials: [{ id: 'spirit-leaf', label: 'Spirit Leaf', itemIds: ['mat_spirit_leaf'], iconKey: 'spiritLeaf', tone: 'leaf', source: 'fixture' }, { id: 'beast-materials', label: 'Beast Materials', itemIds: ['mat_beast_bone', 'mat_beast_blood'], iconKey: 'beastMaterials', tone: 'beast', source: 'fixture' }], guaranteedAnchorTitle: 'Guaranteed Anchor', guaranteedAnchor: { label: 'Core Fragment x1', itemId: 'mat_core_fragment', itemName: 'Core Fragment', quantity: 1, sourceLabel: 'Final Chest', iconKey: 'coreFragmentAnchor', source: 'fixture' }, rarePity: { label: 'Rare Pity', valueText: '1 / 6', dots: { total: 6, filled: 1 }, source: 'fixture' }, autoRepeat: { label: 'Auto-Repeat', valueText: 'Off', enabled: false, helperText: 'Repeats after Final Chest', source: 'fixture' }, footer: 'Best used for targeted local materials, not gold.', showGoldPrimaryRewardPanel: false, legacySummaryCardVisible: false },
    roomRoute: { title: 'Hollow Log Den Route', chip: 'Anchor Chest in 3', mode: 'active', currentNodeId: 'spirit-nest', nodes: buildRuinsRouteNodes('ruin_hollow_log_den', 1) },
    primaryAction: { visible: true, enabled: true, label: 'Continue Exploration', ariaLabel: 'Continue exploration through Hollow Log Den', intent: 'continue-exploration', singleDominantCta: true, isPrimary: true, plaqueVariant: 'jade-gold', ornamentVariant: 'root-jade-cap' },
    explorationSummary: { visible: true, title: 'Exploration Summary', rows: [{ id: 'rooms', label: 'Rooms', value: '2 / 5', iconKey: 'rooms' }, { id: 'anchor', label: 'Anchor', value: 'Final Chest', iconKey: 'anchorChest' }, { id: 'pity', label: 'Pity', value: '1 / 6', iconKey: 'pitySeal' }, { id: 'mainTarget', label: 'Main Target', value: 'Spirit Leaf', iconKey: 'spiritLeaf' }] },
    shell,
    debug: { regionOrder: RUINS_EXACT_REGION_ORDER, missingDataFallbacks: [], placeholderAssetKeysInUse: [], liveSourceNotes: ['Central scenic art is intentionally deferred; final approved Hollow Log Den plate must be bound in the later final art packet.'], fixtureLockedValues: ['Rare Pity 1 / 6', 'Continue Exploration'] },
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
  const roomIndex = activeRun ? Math.max(0, Math.min(activeRun.roomIndex, roomCount - 1)) : 0;
  const pityFailures = progress?.bossChestRareFailures ?? 0;
  const pityText = pityCap ? `${Math.min(pityFailures, pityCap)} / ${pityCap}` : '0 / 0';
  const activityMode = !ruinDef ? 'unavailable' : activeRun?.stopping ? 'transitioning' : activeRun ? 'active' : 'idle';
  const leadDrops = (ruinDef as { dropsPerRoom?: { pool?: Array<{ itemId: string }> } } | null)?.dropsPerRoom?.pool ?? [];
  const hasSpiritLeaf = leadDrops.some((d) => d.itemId === 'mat_spirit_leaf');
  const beastIds = ['mat_beast_bone', 'mat_beast_blood'];
  const finalChestAnchor = ruinDef?.finalChestDrops?.guaranteed?.[0];
  if (!finalChestAnchor) missing.push('missing final chest guaranteed drop');
  const finalAnchorItem = finalChestAnchor?.itemId ? content.maps.itemsById[finalChestAnchor.itemId] : undefined;
  const primaryAction: RuinsPrimaryActionSurface = activityMode === 'active' ? { visible: true, enabled: true, label: 'Continue Exploration', ariaLabel: 'Continue exploration through Hollow Log Den', intent: 'continue-exploration', singleDominantCta: true, isPrimary: true, plaqueVariant: 'jade-gold', ornamentVariant: 'root-jade-cap' }
    : activityMode === 'transitioning' ? { visible: true, enabled: false, label: 'Stopping...', ariaLabel: 'Stopping ruins run', intent: 'disabled', singleDominantCta: true, isPrimary: true, disabledReason: 'Run is stopping', plaqueVariant: 'jade-gold', ornamentVariant: 'root-jade-cap' }
    : activityMode === 'unavailable' ? { visible: true, enabled: false, label: 'Enter Ruins', ariaLabel: 'Ruins unavailable', intent: 'disabled', singleDominantCta: true, isPrimary: true, disabledReason: 'Ruins unavailable in this city', plaqueVariant: 'jade-gold', ornamentVariant: 'root-jade-cap' }
    : { visible: true, enabled: true, label: 'Enter Ruins', ariaLabel: 'Enter Hollow Log Den', intent: 'enter-ruins', singleDominantCta: true, isPrimary: true, plaqueVariant: 'jade-gold', ornamentVariant: 'root-jade-cap' };
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
      leadMaterialsTitle: 'Lead Materials',
      leadMaterials: [{ id: 'spirit-leaf', label: hasSpiritLeaf ? (content.maps.itemsById.mat_spirit_leaf?.name ?? 'Spirit Leaf') : 'Spirit Leaf', itemIds: ['mat_spirit_leaf'], iconKey: 'spiritLeaf', tone: 'leaf', source: 'derived' }, { id: 'beast-materials', label: 'Beast Materials', itemIds: beastIds, iconKey: 'beastMaterials', tone: 'beast', source: 'derived' }],
      guaranteedAnchorTitle: 'Guaranteed Anchor',
      guaranteedAnchor: { label: `${finalAnchorItem?.name ?? 'Core Fragment'} x${finalChestAnchor?.qty ?? 1}`, itemId: finalChestAnchor?.itemId ?? 'mat_core_fragment', itemName: finalAnchorItem?.name ?? 'Core Fragment', quantity: finalChestAnchor?.qty ?? 1, sourceLabel: 'Final Chest', iconKey: (finalChestAnchor?.itemId === 'mat_core_fragment' ? 'coreFragmentAnchor' : 'genericMaterial'), source: 'derived' },
      rarePity: { label: 'Rare Pity', valueText: pityText, dots: { total: pityCap ?? 0, filled: Math.min(pityFailures, pityCap ?? 0) }, source: 'derived' },
      autoRepeat: { label: 'Auto-Repeat', valueText: ruins.autoRepeatDefault ? 'On' : 'Off', enabled: ruins.autoRepeatDefault, helperText: 'Repeats after Final Chest', source: 'live' },
      footer: 'Best used for targeted local materials, not gold.',
      showGoldPrimaryRewardPanel: false,
      legacySummaryCardVisible: false,
    },
    roomRoute: { title: `${ruinDef?.name ?? 'Hollow Log Den'} Route`, chip: activeRun ? (Math.max(0, roomCount - (roomIndex + 1)) === 0 ? 'Final Chest Ready' : `Anchor Chest in ${Math.max(0, roomCount - (roomIndex + 1))}`) : `Anchor Chest in ${roomCount}`, mode: activeRun ? 'active' : 'idle', currentNodeId: activeRun ? (buildRuinsRouteNodes(ruinDef?.id ?? 'ruin_hollow_log_den', roomIndex)[roomIndex]?.id ?? null) : null, nodes: buildRuinsRouteNodes(ruinDef?.id ?? 'ruin_hollow_log_den', roomIndex) },
    kitCard: buildRuinsKitCardSurface({ source: 'synthetic', isInRuin: Boolean(activeRun) }),
    primaryAction,
    explorationSummary: { visible: true, title: 'Exploration Summary', rows: [{ id: 'rooms', label: 'Rooms', value: `${activeRun ? roomIndex + 1 : 0} / ${roomCount}`, iconKey: 'rooms' }, { id: 'anchor', label: 'Anchor', value: 'Final Chest', iconKey: 'anchorChest' }, { id: 'pity', label: 'Pity', value: pityText, iconKey: 'pitySeal' }, { id: 'mainTarget', label: 'Main Target', value: content.maps.itemsById.mat_spirit_leaf?.name ?? 'Spirit Leaf', iconKey: 'spiritLeaf' }] },
    debug: { regionOrder: RUINS_EXACT_REGION_ORDER, missingDataFallbacks: missing, placeholderAssetKeysInUse: [], liveSourceNotes: [...notes, 'Central scenic art is intentionally deferred; final approved Hollow Log Den plate must be bound in the later final art packet.'], fixtureLockedValues: ['Rare Pity 1 / 6 (fixture only)'] },
  };
}
