export type SurfaceValueSource = 'live' | 'derived' | 'synthetic' | 'manifest';

export type OutskirtsSeverity = 'safe' | 'watch' | 'risk' | 'critical';

export type OutskirtsMacroNodeState = 'completed' | 'current' | 'future';

export type OutskirtsEncounterNodeState = 'completed' | 'current' | 'future';

export type TacticalCellId = 'hp' | 'danger' | 'loadout' | 'aiProfile' | 'healing' | 'bounty' | 'expedition';

export interface OutskirtsSurfaceValue {
  text: string;
  source: SurfaceValueSource;
  note?: string;
}

export interface OutskirtsPageRegion {
  title: string;
  screenStateLabel: string;
  planningStateOnly: true;
  shellFlags: {
    isExactMockupPlannedSurface: true;
    allowsLiveCombatStage: false;
    allowsShellTopLane: false;
  };
}

export interface OutskirtsMacroNode {
  id: string;
  label: string;
  state: OutskirtsMacroNodeState;
}

export interface OutskirtsMacroTrackRegion {
  nodes: OutskirtsMacroNode[];
  currentNodeId: string;
}

export interface OutskirtsTacticalCell {
  id: TacticalCellId;
  label: string;
  value: OutskirtsSurfaceValue;
  sublabel?: OutskirtsSurfaceValue;
  iconKey?: string;
  severity?: OutskirtsSeverity;
}

export interface OutskirtsTacticalStripRegion {
  cells: [
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
    OutskirtsTacticalCell,
  ];
}

export interface OutskirtsSelectorPlaqueRegion {
  selectorLabel: string;
  subtitle: string;
  zoneLabel: string;
  source: SurfaceValueSource;
}

export interface OutskirtsScenicFieldRegion {
  scenicPlateAssetKey: string;
  encounterAssetKey: string;
  cropRouteKey: string | null;
  planningStateOnly: true;
}

export interface OutskirtsEncounterIdentityRegion {
  encounterId: string;
  displayName: string;
  displayLevel: string;
  chipLabel: string;
  chipSeverity: OutskirtsSeverity;
}

export interface OutskirtsSetupStatField {
  id: 'atk' | 'acc' | 'crit' | 'hp' | 'eva' | 'res';
  label: string;
  value: OutskirtsSurfaceValue;
}

export interface OutskirtsEquipmentCell {
  slotId: 'weapon' | 'accessory';
  label: string;
  equippedItem: OutskirtsSurfaceValue;
  refineLevel: OutskirtsSurfaceValue;
}

export interface OutskirtsSetupCardDisplayRow {
  id: 'loadoutSet' | 'aiProfile' | 'attackFocus';
  label: string;
  value: OutskirtsSurfaceValue;
  iconKey: 'loadout' | 'ai' | 'focus';
}

export interface OutskirtsSetupPouchRegion {
  label: string;
  iconKey: 'pouch';
  count: OutskirtsSurfaceValue;
  affordanceLabel: string;
  affordanceEnabled: boolean;
}

export interface OutskirtsSetupEquipmentSlot {
  id: 'weapon' | 'armor' | 'ring' | 'talisman' | 'boots' | 'charm';
  label: string;
  iconText: string;
  isEmpty: boolean;
  itemName: OutskirtsSurfaceValue;
}

export interface OutskirtsSetupCardRegion {
  title: string;
  loadoutBadge: OutskirtsSurfaceValue;
  primaryRows: [
    OutskirtsSetupCardDisplayRow,
    OutskirtsSetupCardDisplayRow,
    OutskirtsSetupCardDisplayRow,
  ];
  offenseRows: [OutskirtsSetupStatField, OutskirtsSetupStatField, OutskirtsSetupStatField];
  defenseRows: [OutskirtsSetupStatField, OutskirtsSetupStatField, OutskirtsSetupStatField];
  medicinePouchRow: OutskirtsSetupPouchRegion;
  equipmentSlots: [
    OutskirtsSetupEquipmentSlot,
    OutskirtsSetupEquipmentSlot,
    OutskirtsSetupEquipmentSlot,
    OutskirtsSetupEquipmentSlot,
    OutskirtsSetupEquipmentSlot,
    OutskirtsSetupEquipmentSlot,
  ];
  loadoutSet: OutskirtsSurfaceValue;
  aiProfile: OutskirtsSurfaceValue;
  attackFocus: OutskirtsSurfaceValue;
  offense: {
    atk: OutskirtsSetupStatField;
    acc: OutskirtsSetupStatField;
    crit: OutskirtsSetupStatField;
  };
  defense: {
    hp: OutskirtsSetupStatField;
    eva: OutskirtsSetupStatField;
    res: OutskirtsSetupStatField;
  };
  medicinePouch: OutskirtsSurfaceValue;
  equipmentGrid: {
    weapon: OutskirtsEquipmentCell;
    accessory: OutskirtsEquipmentCell;
  };
}


export interface OutskirtsExpectedRewardMaterialEntry {
  itemId: string;
  label: string;
  iconText: string;
  isPlaceholder: boolean;
}

export interface OutskirtsExpectedRewardsTrackedBounty {
  hasTrackedBounty: boolean;
  title: string;
  objectiveText: string;
  progressCurrent: number;
  progressTarget: number;
  progressPct: number;
  iconText: string;
}

export interface OutskirtsExpectedRewardsEfficiency {
  timePerRunText: string;
  hourlyYieldText: string;
}

export interface OutskirtsExpectedRewardsAutoRepeat {
  enabled: boolean;
  label: string;
  canToggle: boolean;
  iconText: string;
}

export interface OutskirtsExpectedRewardsCardRegion {
  title: string;
  goldRangeText: string;
  commonMaterials: [
    OutskirtsExpectedRewardMaterialEntry,
    OutskirtsExpectedRewardMaterialEntry,
    OutskirtsExpectedRewardMaterialEntry,
    OutskirtsExpectedRewardMaterialEntry,
  ];
  trackedBounty: OutskirtsExpectedRewardsTrackedBounty;
  estimatedEfficiency: OutskirtsExpectedRewardsEfficiency;
  autoRepeat: OutskirtsExpectedRewardsAutoRepeat;
}

export interface OutskirtsRewardsCardRegion {
  goldRange: OutskirtsSurfaceValue;
  commonMaterials: OutskirtsSurfaceValue;
  trackedBountyProgress: OutskirtsSurfaceValue;
  estimatedEfficiency: OutskirtsSurfaceValue;
  autoRepeatState: OutskirtsSurfaceValue;
}

export interface OutskirtsEncounterStripNode {
  id: string;
  displayName: string;
  displayLevel?: string;
  state: OutskirtsEncounterNodeState;
  thumbnailAssetKey?: string;
  scenicBindingKey?: string;
}

export interface OutskirtsEncounterStripRegion {
  nodes: OutskirtsEncounterStripNode[];
  selectedNodeId: string;
  arrows: {
    canMoveLeft: boolean;
    canMoveRight: boolean;
  };
}

export interface OutskirtsEncounterProgressArrow {
  visible: boolean;
  enabled: boolean;
  ariaLabel: string;
}

export interface OutskirtsEncounterProgressNode {
  id: string;
  label: string;
  displayLevelText: string | null;
  state: OutskirtsEncounterNodeState;
  art: string | null;
  silhouetteArt: string | null;
  isClickable: boolean;
  isSelected: boolean;
  ariaLabel: string;
}

export interface OutskirtsEncounterProgressStripRegion {
  leftArrow: OutskirtsEncounterProgressArrow;
  rightArrow: OutskirtsEncounterProgressArrow;
  nodes: OutskirtsEncounterProgressNode[];
}

export interface OutskirtsPrimaryActionRegion {
  label: string;
  enabled: boolean;
  disabledReason: string | null;
  binding: {
    actionId: 'outskirts:start';
    routeId: 'world/outskirts';
  };
  styleToken: 'primary-start';
}

export interface OutskirtsGrindSummaryRegion {
  label: string;
  runs: OutskirtsSurfaceValue;
  goldPerHour: OutskirtsSurfaceValue;
  mainDrop: OutskirtsSurfaceValue;
  areaFilter: OutskirtsSurfaceValue;
}

export interface OutskirtsMockupSurface {
  page: OutskirtsPageRegion;
  macroTrack: OutskirtsMacroTrackRegion;
  tacticalStrip: OutskirtsTacticalStripRegion;
  selectorPlaque: OutskirtsSelectorPlaqueRegion;
  scenicField: OutskirtsScenicFieldRegion;
  encounterIdentity: OutskirtsEncounterIdentityRegion;
  setupCard: OutskirtsSetupCardRegion;
  expectedRewardsCard: OutskirtsExpectedRewardsCardRegion;
  rewardsCard: OutskirtsRewardsCardRegion;
  encounterProgressStrip: OutskirtsEncounterProgressStripRegion;
  encounterStrip: OutskirtsEncounterStripRegion;
  primaryAction: OutskirtsPrimaryActionRegion;
  grindSummary: OutskirtsGrindSummaryRegion;
  shell: {
    liveMounted: false;
    owner: 'outskirts-exact-mockup-screen';
  };
  provenance: {
    cityId: string;
    cityName: string;
    builtAtIso: string;
  };
}

export interface OutskirtsEncounterNodePresentation {
  id: string;
  displayName: string;
  displayLevel?: string;
  defaultState: OutskirtsEncounterNodeState;
  thumbnailAssetKey?: string;
  scenicBindingKey?: string;
  encounterAssetKey?: string;
}

export interface OutskirtsCityMockupPresentation {
  cityId: string;
  screenTitle: string;
  selectorLabel: string;
  subtitle: string;
  encounterNodes: readonly OutskirtsEncounterNodePresentation[];
  selectedEncounterId: string;
  scenicPlateAsset: string;
  grindSummaryLabel: string;
  defaultRoleLine: string;
  zoneLabel: string;
}

export interface OutskirtsMockupRuntimeSnapshot {
  cityId: string;
  cityName: string;
  outskirtsId: string | null;
  killsToBoss: number;
  progress: {
    killsSinceBoss: number;
    totalKills: number;
    bossDefeated: boolean;
  };
  playerStats: {
    hp: string;
    maxHp: string;
    atk: string;
    crit: number;
    dodge: number;
  };
  selectedLoadoutName: string | null;
  aiProfile: string | null;
  preferredTarget: string | null;
  medicinePouchLine: string | null;
  medicinePouchCountCurrent: number;
  medicinePouchCountCap: number;
  trackedBountyLine: string | null;
  commonMaterialsLine: string | null;
  autoRepeatLine: string;
  autoRepeatEnabled: boolean;
  expeditionLine: string;
  weaponName: string | null;
  accessoryName: string | null;
  weaponRefineLevel: number;
  accessoryRefineLevel: number;
  isOutskirtsActive: boolean;
}
