import type { AiProfile } from '../../../types/index.js';
import type { CombatAftermathSurfaceV1 } from '../../combatAftermath/index.js';

export type OutskirtsSurfaceValueSource = 'live' | 'derived' | 'synthetic' | 'manifest';
export type OutskirtsTacticalTone = 'neutral' | 'positive' | 'warning' | 'critical';
export type OutskirtsEncounterNodeState = 'completed' | 'current' | 'future';
export type OutskirtsEncounterSafety = 'safe' | 'watch' | 'risk' | 'critical';
export type OutskirtsSurfaceMode = 'planning' | 'starting' | 'active' | 'resolving' | 'defeat' | 'paused';
export type OutskirtsCombatMotionState = 'idle' | 'attack' | 'hit' | 'dodge' | 'defeat';
export type OutskirtsCombatChipTone = 'neutral' | 'ready' | 'cooldown' | 'warning';
export type OutskirtsCombatLogTone = 'player' | 'enemy' | 'system' | 'loot' | 'defeat' | 'victory';
export type OutskirtsFloatingHitKind = 'normal' | 'crit' | 'miss' | 'heal';
export type OutskirtsEncounterStripMode = 'preview' | 'active-chain';
export type OutskirtsChainBadgeTone = 'neutral' | 'warning';
export type OutskirtsSummaryDockMode = 'grind' | 'live';
export type OutskirtsSummaryRowId = 'runs' | 'kills' | 'goldPerHour' | 'mainDrop';
export type OutskirtsSummaryIconKey = 'runs' | 'kills' | 'gold' | 'drop';
export type OutskirtsCombatResultTransitionKind = 'none' | 'victory-auto-repeat' | 'victory-stop' | 'boss-stop' | 'defeat-retry' | 'defeat-stop';
export type OutskirtsCombatResultOutcome = 'none' | 'victory' | 'defeat';
export type OutskirtsCombatResultTone = 'neutral' | 'jade' | 'gold' | 'crimson';

export interface OutskirtsExactSurfaceMeta {
  surfaceId: 'outskirts-exact-mockup';
  version: 'p3.v2';
  mode: 'live' | 'fixture';
  cityId: string;
  outskirtsId: string | null;
  source: 'stores' | 'fixture';
  targetMockupId: 'outskirts-approved-apr-17-2026';
  activityMode: OutskirtsSurfaceMode;
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
  hasGroundedSelector?: boolean;
}

export interface OutskirtsScenicStage {
  scenicBackgroundKey: string;
  scenicImageSrc: string | null;
  reviewFixtureImageSrc: string | null;
  liveFallbackImageSrc: string | null;
  useApprovedMockupCrop: boolean;
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
  medicinePouchActionEnabled?: boolean;
  equipmentGrid: Array<{
    slotId: 'weapon' | 'armor' | 'ring' | 'talisman' | 'boots' | 'charm';
    label: string;
    iconKey: string;
    value: string;
    source: OutskirtsSurfaceValueSource;
  }>;
}

export type OutskirtsInnerPalaceSlotType = 'active' | 'passive' | 'ultimate';
export type OutskirtsInnerPalaceSlotState = 'equipped' | 'empty' | 'locked';

export interface OutskirtsInnerPalacePreviewSlot {
  key: string;
  label: string;
  slotType: OutskirtsInnerPalaceSlotType;
  slotIndex: number;
  state: OutskirtsInnerPalaceSlotState;
  techId: string | null;
  techniqueName: string | null;
  isUnlocked: boolean;
  unlockLabel?: string;
}

export interface OutskirtsInnerPalacePreview {
  visible: boolean;
  title: string;
  subtitle: string;
  loadoutName: string;
  footerLine: string;
  emptyUnlockedSlots: number;
  activeEquipped: number;
  passiveEquipped: number;
  ultimateEquipped: boolean;
  manageLabel: string;
  source: OutskirtsSurfaceValueSource;
  slots: OutskirtsInnerPalacePreviewSlot[];
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
    progressCurrent: number;
    progressTarget: number;
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
  innerPalacePreview: OutskirtsInnerPalacePreview;
}

export interface OutskirtsEncounterStripArrow {
  visible: boolean;
  enabled: boolean;
  ariaLabel: string;
  ornamentVariant?: 'jade' | 'parchment';
}

export interface OutskirtsEncounterStripNode {
  id: string;
  label: string;
  levelLabel: string;
  state: OutskirtsEncounterNodeState;
  artKey?: string;
  imageSrc?: string | null;
  imagePosition?: string;
  silhouetteKey?: string;
  silhouetteImageSrc?: string | null;
  completionMark?: boolean;
  medallionVariant?: 'wolf-jade' | 'quiet-field' | 'unknown-parchment' | 'boss-gold';
  isSelected: boolean;
  isClickable: boolean;
  ariaLabel: string;
}

export interface OutskirtsEncounterStrip {
  mode: OutskirtsEncounterStripMode;
  ariaLabel: string;
  leftArrow: OutskirtsEncounterStripArrow;
  rightArrow: OutskirtsEncounterStripArrow;
  lane: {
    showConnector: boolean;
    connectorVariant?: 'brush' | 'thread';
  };
  nodes: OutskirtsEncounterStripNode[];
  selectedEncounterId: string;
}

export interface OutskirtsPrimaryAction {
  label: string;
  ariaLabel: string;
  visible: boolean;
  enabled: boolean;
  intent: 'start-hunt' | 'stop-hunt' | 'recover' | 'disabled';
  singleDominantCta: true;
  isPrimary?: true;
  disabledReason?: string;
  plaqueVariant?: 'ornate-gold';
  ornamentVariant?: 'leaf-cap';
}

export interface OutskirtsGrindSummary {
  visible: boolean;
  mode: OutskirtsSummaryDockMode;
  title: string;
  scopeChipLabel: string;
  elapsedText?: string;
  runsText: string;
  killsText?: string;
  goldPerHourText: string;
  mainDropLabel: string;
  mainDropIconKey: string;
  rows?: Array<{
    id: OutskirtsSummaryRowId;
    label: string;
    value: string;
    iconKey: OutskirtsSummaryIconKey;
  }>;
}

export interface OutskirtsActiveChainBadge {
  visible: boolean;
  title: string;
  bossLabel: string;
  bossTone: OutskirtsChainBadgeTone;
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsMockupShellFlags {
  showRunCompass: boolean;
  showCombatModuleTopLane: boolean;
  showCombatTheater: boolean;
  showCombatHpBars: boolean;
  showCombatActors: boolean;
  showFloatingDamage: boolean;
  showCombatChips: boolean;
  showCombatResultOverlay: boolean;
  showSummaryRail: boolean;
  showUtilityTray: boolean;
  showCombatLog: boolean;
  showCombatOptions: boolean;
  rightCardHasPrimaryAction: boolean;
  singleDominantCta: boolean;
  useScenicCenter: boolean;
  usePlanningState: boolean;
}

export interface OutskirtsCombatStagePlayer {
  role: 'player';
  side: 'left';
  name: string;
  hpCurrent: number;
  hpMax: number;
  hpLabel: string;
  hpPct: number;
  actorImageKey: string;
  motionState: OutskirtsCombatMotionState;
}

export interface OutskirtsCombatStageEnemy {
  role: 'enemy';
  side: 'right';
  id: string | null;
  name: string;
  levelLabel: string;
  hpCurrent: number;
  hpMax: number;
  hpLabel: string;
  hpPct: number;
  actorImageKey: string;
  motionState: OutskirtsCombatMotionState;
  isBoss: boolean;
}

export interface OutskirtsCombatStageChip {
  id: string;
  label: string;
  tone: OutskirtsCombatChipTone;
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsCombatStageLogLine {
  id: string;
  text: string;
  tone: OutskirtsCombatLogTone;
  timestamp: number | null;
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsFloatingHit {
  id: string;
  text: string;
  x: number;
  y: number;
  kind: OutskirtsFloatingHitKind;
  target: 'player' | 'enemy';
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsCombatResultTransition {
  visible: boolean;
  kind: OutskirtsCombatResultTransitionKind;
  outcome: OutskirtsCombatResultOutcome;
  tone: OutskirtsCombatResultTone;
  title: string;
  subtitle: string;
  detailLine: string;
  countdownLabel: string;
  progressPct: number;
  durationMs: number;
  resolvedAtMs: number | null;
  autoRepeatState: 'none' | 'continuing' | 'retrying' | 'ending';
  source: OutskirtsSurfaceValueSource;
}

export interface OutskirtsCombatStage {
  active: boolean;
  hasLiveCombat: boolean;
  lifecycle: OutskirtsSurfaceMode;
  visualContract: 'outskirts-center-combat-theater-v1';
  player: OutskirtsCombatStagePlayer;
  enemy: OutskirtsCombatStageEnemy;
  versusSeal: {
    iconKey: 'crossed-swords';
    label: 'Duel';
  };
  chips: OutskirtsCombatStageChip[];
  logLines: OutskirtsCombatStageLogLine[];
  floatingHits: OutskirtsFloatingHit[];
  resultTransition: OutskirtsCombatResultTransition;
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
  activeChainBadge: OutskirtsActiveChainBadge;
  setupCard: OutskirtsSetupCard;
  rewardsCard: OutskirtsRewardsCard;
  encounterStrip: OutskirtsEncounterStrip;
  primaryAction: OutskirtsPrimaryAction;
  combatStage: OutskirtsCombatStage;
  grindSummary: OutskirtsGrindSummary;
  aftermath?: CombatAftermathSurfaceV1 | null;
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
  autoRepeatEnabled?: boolean;
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
  combatStage: OutskirtsCombatStage;
  activeChainTitle?: string;
  activeChainBossLabel?: string;
  activeStartedAtMs?: number | null;
  activeElapsedLabel?: string;
  liveKillsText?: string;
  liveGoldPerHourText?: string;
  liveMainDropLabel?: string;
  innerPalacePreview?: OutskirtsInnerPalacePreview;
}
