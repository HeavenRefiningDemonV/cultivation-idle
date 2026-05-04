export type RuinsExactSurfaceMode = 'fixture' | 'live';
export type RuinsExactActivityMode = 'idle' | 'active' | 'transitioning' | 'victory' | 'defeat' | 'unavailable';
export type RuinsExactValueSource = 'fixture' | 'live' | 'derived' | 'content' | 'synthetic';
export type RuinsRouteNodeState = 'completed' | 'current' | 'future';
export type RuinsTacticalTone = 'neutral' | 'positive' | 'warning' | 'critical';

export interface RuinsExactSurfaceV1 { meta: RuinsExactSurfaceMeta; page: RuinsExactPageSurface; topRibbon: RuinsTopRibbonSurface; tacticalStrip: RuinsTacticalStripSurface; areaHeader: RuinsAreaHeaderSurface; kitCard: RuinsKitCardSurface; scenicStage: RuinsScenicStageSurface; targetedMaterialsCard: RuinsTargetedMaterialsCardSurface; roomRoute: RuinsRoomRouteSurface; primaryAction: RuinsPrimaryActionSurface; explorationSummary: RuinsExplorationSummarySurface; shell: RuinsExactShellFlags; debug: RuinsExactDebugSurface; }
export interface RuinsExactSurfaceMeta { surfaceId: 'ruins-exact-mockup'; version: 'p2.v1'; mode: RuinsExactSurfaceMode; source: 'fixture' | 'stores'; cityId: string; ruinId: string | null; targetMockupId: 'ruins-hollow-log-den-approved-apr-30-2026'; activityMode: RuinsExactActivityMode; }
export interface RuinsExactPageSurface { title: 'Ruins'; }
export interface RuinsTopRibbonNode { id: string; label: string; state: 'completed' | 'current' | 'future'; variant: 'muted' | 'active'; }
export interface RuinsTopRibbonSurface { ariaLabel: string; decorative: true; nodes: RuinsTopRibbonNode[]; activeNodeId: string; }
export type RuinsTacticalCellId = 'hp' | 'depth' | 'loadout' | 'aiProfile' | 'healing' | 'bounty' | 'expedition';
export interface RuinsTacticalCellSurface { id: RuinsTacticalCellId; label: string; primaryText: string; secondaryText?: string; iconKey: string; tone: RuinsTacticalTone; showCaret: boolean; showNotificationDot: boolean; showUnderlineBar: boolean; underlineBarPct?: number; visible: boolean; reserveAdornmentSpace: boolean; source: RuinsExactValueSource; }
export interface RuinsTacticalStripSurface { ariaLabel: string; cells: readonly [RuinsTacticalCellSurface, RuinsTacticalCellSurface, RuinsTacticalCellSurface, RuinsTacticalCellSurface, RuinsTacticalCellSurface, RuinsTacticalCellSurface, RuinsTacticalCellSurface]; }
export interface RuinsAreaHeaderSurface { plaqueLabel: string; showDropdownCaret: true; subtitle: string; hasGroundedSelector?: boolean; chips: ReadonlyArray<{ id: 'targeted-mats' | 'deterministic-support'; label: string; iconKey?: string }>; }
export type RuinsKitSetupRowId = 'loadoutSet' | 'aiProfile' | 'explorationFocus';
export type RuinsKitStatSectionId = 'offense' | 'defense';
export type RuinsKitStatRowId = 'atk' | 'acc' | 'crt' | 'hp' | 'eva' | 'res';
export type RuinsKitEquipmentSlotId = 'weapon' | 'manual' | 'ring' | 'boots' | 'charm' | 'talisman';
export interface RuinsKitLabeledValue { id: string; label: string; value: string; iconKey: string; source: RuinsExactValueSource; }
export interface RuinsKitActionAffordance { visible: boolean; enabled: boolean; label: string; ariaLabel: string; }
export interface RuinsKitEquipmentSlot { slotId: RuinsKitEquipmentSlotId; label: string; value: string; iconKey: string; source: RuinsExactValueSource; filled: boolean; }
export interface RuinsKitStatSectionSurface { id: RuinsKitStatSectionId; title: 'Offense' | 'Defense'; rows: readonly [RuinsKitLabeledValue, RuinsKitLabeledValue, RuinsKitLabeledValue]; }
export interface RuinsKitCardSurface { title: 'Ruin Kit'; stamp: null | { label: 'In Ruin'; tone: 'active' }; setupRows: [RuinsKitLabeledValue, RuinsKitLabeledValue, RuinsKitLabeledValue]; statSections: readonly [RuinsKitStatSectionSurface, RuinsKitStatSectionSurface]; medicinePouch: { label: 'Medicine Pouch'; value: string; iconKey: string; action: RuinsKitActionAffordance; source: RuinsExactValueSource; }; equipmentGrid: [RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot]; }
export type RuinsScenicArtStatus = 'deferred' | 'approved-bound' | 'missing';
export type RuinsScenicAssetKind = 'deferred-hollow-log-den' | 'approved-hollow-log-den' | 'missing';
export interface RuinsScenicStageSurface { artStatus: RuinsScenicArtStatus; assetKind: RuinsScenicAssetKind; approvedScenePlateSrc: string | null; activeScenePlateSrc: string | null; reservedApprovedSourcePath: string; reservedApprovedPlatePath: string; useApprovedMockupPlate: boolean; requiresFinalArtBinding: boolean; environmentDescriptor: string; plateAlt: string; frameVariant: 'deferred-root-chamber-frame' | 'approved-root-chamber'; crop: { sourceWidth: 2048; sourceHeight: 1152; x: 362; y: 270; width: 1315; height: 595; }; visualFlags: { hasLargeDuelOverlay: false; hasCombatHpBars: false; hasSceneTitleOverlay: false; usesOldCombatPathScene: false; usesCityRuinsSubstitute: false; usesInsideDungeonSubstitute: false; usesCssAsFinalArt: false; }; }
export interface RuinsTargetedMaterialTileSurface { id: string; label: string; itemIds: string[]; iconKey: 'spiritLeaf' | 'beastMaterials' | 'genericMaterial'; tone: 'leaf' | 'beast' | 'neutral'; source: RuinsExactValueSource; }
export interface RuinsGuaranteedAnchorSurface { label: string; itemId: string; itemName: string; quantity: number; sourceLabel: string; iconKey: 'coreFragmentAnchor' | 'genericMaterial'; source: RuinsExactValueSource; }
export interface RuinsRarePitySurface { label: 'Rare Pity'; valueText: string; dots: { total: number; filled: number }; source: RuinsExactValueSource; }
export interface RuinsAutoRepeatSurface { label: 'Auto-Repeat'; valueText: 'On' | 'Off'; enabled: boolean; helperText: 'Repeats after Final Chest'; source: RuinsExactValueSource; }
export interface RuinsTargetedMaterialsCardSurface { title: 'Targeted Materials'; leadMaterialsTitle: 'Lead Materials'; leadMaterials: readonly [RuinsTargetedMaterialTileSurface, RuinsTargetedMaterialTileSurface]; guaranteedAnchorTitle: 'Guaranteed Anchor'; guaranteedAnchor: RuinsGuaranteedAnchorSurface; rarePity: RuinsRarePitySurface; autoRepeat: RuinsAutoRepeatSurface; footer: 'Best used for targeted local materials, not gold.'; showGoldPrimaryRewardPanel: false; legacySummaryCardVisible: false; }
export type RuinsRoomRouteMode = 'idle' | 'active' | 'complete';
export type RuinsRoomRouteMedallionVariant = 'completed-check' | 'current-jade' | 'future-cache' | 'future-guardian' | 'future-anchor';
export interface RuinsRoomRouteNodeSurface { id: string; label: string; sublabel: string; iconKey: string; state: RuinsRouteNodeState; medallionVariant: RuinsRoomRouteMedallionVariant; isAnchor: boolean; ariaLabel: string; }
export interface RuinsRoomRouteSurface { title: string; chip: string; mode: RuinsRoomRouteMode; currentNodeId: string | null; nodes: ReadonlyArray<RuinsRoomRouteNodeSurface>; }
export type RuinsPrimaryActionIntent = 'continue-exploration' | 'enter-ruins' | 'disabled';
export interface RuinsPrimaryActionSurface { visible: boolean; enabled: boolean; label: string; ariaLabel: string; intent: RuinsPrimaryActionIntent; singleDominantCta: true; isPrimary: true; disabledReason?: string; plaqueVariant: 'jade-gold'; ornamentVariant: 'root-jade-cap'; }
export type RuinsExplorationSummaryRowId = 'rooms' | 'anchor' | 'pity' | 'mainTarget';
export type RuinsExplorationSummaryIconKey = 'rooms' | 'anchorChest' | 'pitySeal' | 'spiritLeaf';
export interface RuinsExplorationSummaryRowSurface { id: RuinsExplorationSummaryRowId; label: string; value: string; iconKey: RuinsExplorationSummaryIconKey; }
export interface RuinsExplorationSummarySurface { visible: boolean; title: 'Exploration Summary'; rows: RuinsExplorationSummaryRowSurface[]; }
export interface RuinsExactShellFlags { showCombatModuleTopLane: false; showRuinsSummaryCard: false; showRuinsProgress: false; showRuinsCtaZone: false; showCombatPathModule: false; showLargeDuelOverlay: false; showCombatHpBars: false; showGoldPrimaryRewardPanel: false; useScreenOwnedExactPage: true; singleDominantCta: true; }
export interface RuinsExactDebugSurface { regionOrder: readonly string[]; missingDataFallbacks: string[]; placeholderAssetKeysInUse: string[]; liveSourceNotes: string[]; fixtureLockedValues: string[]; }
