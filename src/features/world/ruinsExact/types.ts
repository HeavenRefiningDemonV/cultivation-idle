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
export type RuinsKitSurvivalRowId = 'hp' | 'eva' | 'res';
export type RuinsKitEquipmentSlotId = 'weapon' | 'manual' | 'ring' | 'boots' | 'charm' | 'talisman';
export interface RuinsKitLabeledValue { id: string; label: string; value: string; iconKey: string; source: RuinsExactValueSource; }
export interface RuinsKitActionAffordance { visible: boolean; enabled: boolean; label: string; ariaLabel: string; }
export interface RuinsKitEquipmentSlot { slotId: RuinsKitEquipmentSlotId; label: string; value: string; iconKey: string; source: RuinsExactValueSource; filled: boolean; }
export interface RuinsKitCardSurface { title: 'Ruin Kit'; stamp: { label: 'In Ruin' | 'Idle'; tone: 'active' | 'idle' }; setupRows: [RuinsKitLabeledValue, RuinsKitLabeledValue, RuinsKitLabeledValue]; survivalRows: [RuinsKitLabeledValue, RuinsKitLabeledValue, RuinsKitLabeledValue]; medicinePouch: { label: 'Medicine Pouch'; value: string; iconKey: string; action: RuinsKitActionAffordance; source: RuinsExactValueSource; }; equipmentGrid: [RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot, RuinsKitEquipmentSlot]; }
export interface RuinsScenicStageSurface { approvedScenePlateSrc: string | null; fallbackScenePlateSrc: string | null; useApprovedMockupPlate: boolean; environmentDescriptor: string; hasLargeDuelOverlay: false; hasCombatHpBars: false; }
export interface RuinsTargetedMaterialsCardSurface { title: 'Targeted Materials'; leadMaterials: ReadonlyArray<{ label: string; itemIds: string[] }>; guaranteedAnchor: { label: string; itemId: 'mat_core_fragment'; quantity: 1; sourceLabel: string }; rarePity: string; rarePityDots: { total: number; filled: number }; autoRepeat: { value: string; helperText: string }; footer: string; }
export interface RuinsRoomRouteNodeSurface { id: string; label: string; sublabel: string; iconKey: string; state: RuinsRouteNodeState; }
export interface RuinsRoomRouteSurface { title: string; chip: string; nodes: ReadonlyArray<RuinsRoomRouteNodeSurface>; }
export interface RuinsPrimaryActionSurface { label: string; intent: 'continue-exploration' | 'enter-ruins' | 'open-final-chest' | 'stopping'; enabled: boolean; singleDominantCta: true; }
export interface RuinsExplorationSummarySurface { title: 'Exploration Summary'; rows: ReadonlyArray<{ label: string; value: string }>; }
export interface RuinsExactShellFlags { showCombatModuleTopLane: false; showRuinsSummaryCard: false; showRuinsProgress: false; showRuinsCtaZone: false; showCombatPathModule: false; showLargeDuelOverlay: false; showCombatHpBars: false; showGoldPrimaryRewardPanel: false; useScreenOwnedExactPage: true; singleDominantCta: true; }
export interface RuinsExactDebugSurface { regionOrder: readonly string[]; missingDataFallbacks: string[]; placeholderAssetKeysInUse: string[]; liveSourceNotes: string[]; fixtureLockedValues: string[]; }
