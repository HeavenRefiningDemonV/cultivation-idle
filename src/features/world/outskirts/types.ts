import type { AiProfile } from '../../../types/index.js';

export type OutskirtsSurfaceValueSource = 'live' | 'derived' | 'synthetic' | 'manifest';
export type OutskirtsTacticalTone = 'neutral' | 'positive' | 'warning' | 'critical';
export type OutskirtsEncounterNodeState = 'completed' | 'current' | 'future';
export type OutskirtsEncounterSafety = 'safe' | 'watch' | 'risk' | 'critical';

export interface OutskirtsExactSurfaceMeta {
  surfaceId: 'outskirts-exact-mockup';
  version: 'p3.v2';
  mode: 'live' | 'fixture';
  cityId: string;
  outskirtsId: string | null;
  source: 'stores' | 'fixture';
  targetMockupId: 'outskirts-approved-apr-17-2026';
}

export interface OutskirtsExactSurfacePage {
  title: string;
}

export interface OutskirtsTopRibbonNode {
  id: string;
  label: string;
  state: OutskirtsEncounterNodeState;
  variant: 'muted' | 'active';
}

export interface OutskirtsTopRibbon {
  ariaLabel: string;
  decorative: true;
  leftOrnament: 'vine';
  terminalCap: 'temple';
  nodes: OutskirtsTopRibbonNode[];
  activeNodeId: string;
}

export interface OutskirtsTacticalCell {
  id: 'hp' | 'danger' | 'loadout' | 'aiProfile' | 'healing' | 'bounty' | 'expedition';
  label: string;
  primaryText: string;
  secondaryText?: string;
  tone: OutskirtsTacticalTone;
  iconKey: string;
  iconKind: 'lucide';
  showCaret: boolean;
  showNotificationDot: boolean;
  showUnderlineBar: boolean;
  underlineBarPct?: number;
  visible: boolean;
  reserveAdornmentSpace: boolean;
}

export interface OutskirtsTacticalStrip {
  ariaLabel: string;
  cells: [OutskirtsTacticalCell, OutskirtsTacticalCell, OutskirtsTacticalCell, OutskirtsTacticalCell, OutskirtsTacticalCell, OutskirtsTacticalCell, OutskirtsTacticalCell];
}

export interface OutskirtsAreaHeader {
  plaqueLabel: string;
  subtitle: string;
  showDropdownCaret: boolean;
}

export interface OutskirtsScenicStage {
  scenicBackgroundKey: string;
  scenicImageSrc: string | null;
  encounterArtKey: string;
  environmentDescriptor: string;
}

export interface OutskirtsEncounterIdentity {
  selectedEncounterId: string;
  displayName: string;
  levelLabel: string;
  safetyChip: {
    state: OutskirtsEncounterSafety;
    label: string;
  };
}

export interface OutskirtsLabeledValue {
  id: string;
  label: string;
  value: string;
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsSetupCard {
  title: string;
  loadoutRow: OutskirtsLabeledValue;
  aiProfileRow: OutskirtsLabeledValue;
  attackFocusRow: OutskirtsLabeledValue;
  offenseRows: OutskirtsLabeledValue[];
  defenseRows: OutskirtsLabeledValue[];
  medicinePouchRow: OutskirtsLabeledValue;
  equipmentGrid: Array<{
    slotId: 'weapon' | 'armor' | 'ring' | 'talisman' | 'boots' | 'charm';
    label: string;
    iconKey: string;
    value: string;
    source: OutskirtsSurfaceValueSource;
  }>;
}

export interface OutskirtsRewardsCard {
  title: string;
  goldHeadline: {
    label: string;
    value: string;
    source: OutskirtsSurfaceValueSource;
  };
  commonMaterials: {
    title: string;
    items: Array<{
      id: string;
      label: string;
      iconKey: string;
      source: OutskirtsSurfaceValueSource;
    }>;
  };
  trackedBounty: {
    title: string;
    itemLabel: string;
    helperLine: string;
    progressLabel: string;
    source: OutskirtsSurfaceValueSource;
  };
  estimatedEfficiency: {
    title: string;
    runTimeLabel: string;
    hourlyLabel: string;
    source: OutskirtsSurfaceValueSource;
  };
  autoRepeat: {
    label: string;
    value: string;
    enabled: boolean;
    source: OutskirtsSurfaceValueSource;
  };
}

export interface OutskirtsEncounterStripArrow {
  visible: boolean;
  enabled: boolean;
  ariaLabel: string;
}

export interface OutskirtsEncounterStripNode {
  id: string;
  label: string;
  levelLabel: string;
  state: OutskirtsEncounterNodeState;
  artKey?: string;
  silhouetteKey?: string;
  isSelected: boolean;
  isClickable: boolean;
  ariaLabel: string;
}

export interface OutskirtsEncounterStrip {
  leftArrow: OutskirtsEncounterStripArrow;
  rightArrow: OutskirtsEncounterStripArrow;
  nodes: OutskirtsEncounterStripNode[];
  selectedEncounterId: string;
}

export interface OutskirtsPrimaryAction {
  label: string;
  ariaLabel: string;
  visible: boolean;
  enabled: boolean;
  intent: 'start-hunt';
  singleDominantCta: true;
  isPrimary?: true;
  disabledReason?: string;
}

export interface OutskirtsGrindSummary {
  visible: boolean;
  title: string;
  scopeChipLabel: string;
  runsText: string;
  goldPerHourText: string;
  mainDropLabel: string;
  mainDropIconKey: string;
}

export interface OutskirtsMockupShellFlags {
  showRunCompass: boolean;
  showCombatModuleTopLane: boolean;
  showCombatTheater: boolean;
  showCombatHpBars: boolean;
  showFloatingDamage: boolean;
  showSummaryRail: boolean;
  showUtilityTray: boolean;
  showCombatLog: boolean;
  showCombatOptions: boolean;
  rightCardHasPrimaryAction: boolean;
  singleDominantCta: boolean;
  useScenicCenter: boolean;
  usePlanningState: boolean;
}

export interface OutskirtsExactSurfaceDebug {
  missingDataFallbacks: string[];
  placeholderAssetKeysInUse: string[];
  unresolvedLiveSourceNotes: string[];
  supportTruth: {
    roleTag: string;
    bestUsedWhen: string;
    boundaryLine: string;
  };
  notes: string[];
}

export interface OutskirtsExactSurfaceV2 {
  meta: OutskirtsExactSurfaceMeta;
  page: OutskirtsExactSurfacePage;
  topRibbon: OutskirtsTopRibbon;
  tacticalStrip: OutskirtsTacticalStrip;
  areaHeader: OutskirtsAreaHeader;
  scenicStage: OutskirtsScenicStage;
  encounterIdentity: OutskirtsEncounterIdentity;
  setupCard: OutskirtsSetupCard;
  rewardsCard: OutskirtsRewardsCard;
  encounterStrip: OutskirtsEncounterStrip;
  primaryAction: OutskirtsPrimaryAction;
  grindSummary: OutskirtsGrindSummary;
  shell: OutskirtsMockupShellFlags;
  debug: OutskirtsExactSurfaceDebug;
}

export interface OutskirtsMockupRuntimeSnapshot {
  sourceMode: 'fixture' | 'stores';
  cityId: string;
  cityName: string;
  outskirtsId: string | null;
  outskirtsLabel: string;
  killsSinceBoss: number;
  killsToBoss: number;
  totalKills: number;
  isOutskirtsActive: boolean;
  hpLabel: string;
  dangerLabel: string;
  loadoutLabel: string;
  aiProfile: AiProfile;
  aiProfileLabel: string;
  attackFocusLabel: string;
  medicinePouchLabel: string | null;
  bountyLabel: string | null;
  expeditionLabel: string;
  offenseRows: OutskirtsLabeledValue[];
  defenseRows: OutskirtsLabeledValue[];
  equipmentGrid: OutskirtsSetupCard['equipmentGrid'];
  rewardsGoldLabel: string;
  rewardMaterialLabels: string[];
  trackedBountyTitle: string;
  trackedBountyHelper: string;
  trackedBountyProgress: string;
  efficiencyRunTimeLabel: string;
  efficiencyHourlyLabel: string;
  autoRepeatLabel: string;
  selectedEncounterId: string;
  selectedEncounterName: string;
  selectedEncounterLevelLabel: string;
  safetyChipState: OutskirtsEncounterSafety;
  safetyChipLabel: string;
  scenicArtKey: string;
  scenicBackgroundKey: string;
  encounterDescriptor: string;
  encounterNodes: Array<{ id: string; label: string; state: OutskirtsEncounterNodeState }>;
  canMoveEncounterLeft: boolean;
  canMoveEncounterRight: boolean;
  roleTag: string;
  bestUsedWhen: string;
  boundaryLine: string;
  pageSubtitle: string;
  supportHints: string[];
}
