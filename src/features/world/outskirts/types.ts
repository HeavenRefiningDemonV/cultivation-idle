import type { AiProfile } from '../../../types/index.js';

export type OutskirtsSurfaceValueSource = 'live' | 'derived' | 'synthetic' | 'manifest';
export type OutskirtsTacticalTone = 'neutral' | 'positive' | 'warning' | 'critical';
export type OutskirtsEncounterNodeState = 'completed' | 'current' | 'future';
export type OutskirtsEncounterSafety = 'safe' | 'watch' | 'risk' | 'critical';

export interface OutskirtsMockupMeta {
  surfaceId: 'outskirts-exact-mockup';
  version: 'p1.v1';
  sourceMode: 'fixture' | 'stores';
  cityId: string;
  outskirtsId: string | null;
  planningState: boolean;
  exactMockup: true;
}

export interface OutskirtsMockupHeader {
  pageTitle: string;
  subtitle: string;
  areaPlaqueLabel: string;
  roleTag: string;
  bestUsedWhen: string;
  boundaryLine: string;
}

export interface OutskirtsMockupProgressNode {
  id: string;
  label: string;
  state: OutskirtsEncounterNodeState;
  variant: 'muted' | 'active';
}

export interface OutskirtsMockupTopProgress {
  label: string;
  helperText: string;
  decorative: true;
  leftOrnament: 'vine';
  terminalCap: 'temple';
  nodes: OutskirtsMockupProgressNode[];
}

export interface OutskirtsMockupTacticalCell {
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

export interface OutskirtsMockupTacticalStrip {
  label: string;
  cells: [
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
    OutskirtsMockupTacticalCell,
  ];
}

export interface OutskirtsMockupLabeledValue {
  id: string;
  label: string;
  value: string;
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsMockupSetupCard {
  title: string;
  loadoutSet: OutskirtsMockupLabeledValue;
  aiProfile: OutskirtsMockupLabeledValue;
  attackFocus: OutskirtsMockupLabeledValue;
  offense: OutskirtsMockupLabeledValue[];
  defense: OutskirtsMockupLabeledValue[];
  medicinePouch: OutskirtsMockupLabeledValue;
  equipmentGrid: Array<{
    slotId: 'weapon' | 'armor' | 'ring' | 'talisman' | 'boots' | 'charm';
    label: string;
    iconKey: string;
    value: string;
    source: OutskirtsSurfaceValueSource;
  }>;
}

export interface OutskirtsMockupRewardsCard {
  title: string;
  expectedRewards: OutskirtsMockupLabeledValue[];
  guaranteedOrLikely: OutskirtsMockupLabeledValue[];
  bountyOverlap: OutskirtsMockupLabeledValue;
  efficiency: OutskirtsMockupLabeledValue[];
  cadenceSupport: OutskirtsMockupLabeledValue;
  noPrimaryCta: true;
}

export interface OutskirtsMockupEncounterHero {
  selectedEncounterId: string;
  encounterDisplayName: string;
  encounterLevelLabel: string;
  safetyChip: {
    state: OutskirtsEncounterSafety;
    label: string;
  };
  scenicArtKey: string;
  scenicBackgroundKey: string;
  scenicImageSrc: string | null;
  descriptor: string;
}

export interface OutskirtsMockupEncounterChainNode {
  id: string;
  label: string;
  state: OutskirtsEncounterNodeState;
  thumbnailKey: string;
  stateLabel: string;
}

export interface OutskirtsMockupEncounterChain {
  nodes: OutskirtsMockupEncounterChainNode[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  connectorState: 'locked' | 'partial' | 'complete';
}

export interface OutskirtsMockupEncounterProgressArrow {
  visible: boolean;
  enabled: boolean;
  ariaLabel: string;
}

export interface OutskirtsMockupEncounterProgressNode {
  id: string;
  label: string;
  displayLevelText?: string;
  state: OutskirtsEncounterNodeState;
  artKey?: string;
  silhouetteKey?: string;
  isSelected: boolean;
  isClickable: boolean;
  ariaLabel: string;
}

export interface OutskirtsMockupEncounterProgressStrip {
  leftArrow: OutskirtsMockupEncounterProgressArrow;
  rightArrow: OutskirtsMockupEncounterProgressArrow;
  nodes: OutskirtsMockupEncounterProgressNode[];
}

export interface OutskirtsMockupActionZone {
  primaryCtaLabel: string;
  primaryCtaIntent: 'start-hunt';
  primaryCtaTone: 'primary';
  primaryCtaEnabled: boolean;
  secondaryHints: string[];
  singleDominantCta: true;
}

export interface OutskirtsMockupPrimaryCta {
  label: string;
  ariaLabel: string;
  visible: boolean;
  enabled: boolean;
  disabledReason?: string;
  isPrimary: true;
}

export interface OutskirtsMockupGrindSummary {
  visible: boolean;
  title?: string;
  runsText?: string;
  goldPerHourText?: string;
  mainDropLabel?: string;
  mainDropIconKey?: string;
  areaFilterText?: string;
  rewardIconKeys?: string[];
  progressText?: string;
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

export interface OutskirtsMockupDebug {
  missingDataFallbacks: string[];
  placeholderAssetKeysInUse: string[];
  unresolvedSourceFields: string[];
  notes: string[];
}

export interface OutskirtsMockupSurface {
  meta: OutskirtsMockupMeta;
  header: OutskirtsMockupHeader;
  topProgress: OutskirtsMockupTopProgress;
  tacticalStrip: OutskirtsMockupTacticalStrip;
  setupCard: OutskirtsMockupSetupCard;
  rewardsCard: OutskirtsMockupRewardsCard;
  encounterHero: OutskirtsMockupEncounterHero;
  encounterChain: OutskirtsMockupEncounterChain;
  encounterProgressStrip: OutskirtsMockupEncounterProgressStrip;
  primaryCta: OutskirtsMockupPrimaryCta;
  actionZone: OutskirtsMockupActionZone;
  grindSummary: OutskirtsMockupGrindSummary;
  shell: OutskirtsMockupShellFlags;
  debug?: OutskirtsMockupDebug;
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
  offenseRows: OutskirtsMockupLabeledValue[];
  defenseRows: OutskirtsMockupLabeledValue[];
  equipmentGrid: OutskirtsMockupSetupCard['equipmentGrid'];
  expectedRewards: OutskirtsMockupLabeledValue[];
  guaranteedOrLikely: OutskirtsMockupLabeledValue[];
  bountyOverlap: OutskirtsMockupLabeledValue;
  efficiencyRows: OutskirtsMockupLabeledValue[];
  cadenceSupport: OutskirtsMockupLabeledValue;
  selectedEncounterId: string;
  selectedEncounterName: string;
  selectedEncounterLevelLabel: string;
  safetyChipState: OutskirtsEncounterSafety;
  safetyChipLabel: string;
  scenicArtKey: string;
  scenicBackgroundKey: string;
  encounterDescriptor: string;
  encounterNodes: OutskirtsMockupEncounterChainNode[];
  canMoveEncounterLeft: boolean;
  canMoveEncounterRight: boolean;
  roleTag: string;
  bestUsedWhen: string;
  boundaryLine: string;
  pageSubtitle: string;
  supportHints: string[];
}
