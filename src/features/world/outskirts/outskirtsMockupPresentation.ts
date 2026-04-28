import type { OutskirtsMockupShellFlags } from './types.js';
import { OUTSKIRTS_ASSETS } from './outskirtsAssetRegistry.js';

export const OUTSKIRTS_MOCKUP_VERSION = 'p3.v2' as const;
export const OUTSKIRTS_TARGET_MOCKUP_ID = 'outskirts-approved-apr-17-2026' as const;
export const OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC = OUTSKIRTS_ASSETS.scenic.approvedMockup as string;

export const OUTSKIRTS_MOCKUP_REGION_ORDER = [
  'topRibbon',
  'tacticalStrip',
  'areaHeader',
  'scenicStage',
  'encounterIdentity',
  'setupCard',
  'rewardsCard',
  'encounterStrip',
  'primaryAction',
  'grindSummary',
] as const;

export const OUTSKIRTS_TACTICAL_CELL_ORDER = [
  'hp',
  'danger',
  'loadout',
  'aiProfile',
  'healing',
  'bounty',
  'expedition',
] as const;

export const OUTSKIRTS_SETUP_SUBSECTION_ORDER = [
  'loadoutRow',
  'aiProfileRow',
  'attackFocusRow',
  'offenseRows',
  'defenseRows',
  'medicinePouchRow',
  'equipmentGrid',
] as const;

export const OUTSKIRTS_REWARDS_SUBSECTION_ORDER = [
  'goldHeadline',
  'commonMaterials',
  'trackedBounty',
  'estimatedEfficiency',
  'autoRepeat',
] as const;

export const OUTSKIRTS_EQUIPMENT_SLOT_ORDER = ['weapon', 'armor', 'ring', 'talisman', 'boots', 'charm'] as const;

export const OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST = [
  { id: 'quiet-glade', label: 'Quiet Glade', levelLabel: 'Lv. 8', artKey: 'outskirts/encounter/quiet-glade', silhouetteKey: 'outskirts/silhouette/quiet-glade' },
  { id: 'rockjaw-boar', label: 'Rockjaw Boar', levelLabel: 'Lv. 9', artKey: 'outskirts/encounter/rockjaw-boar', silhouetteKey: 'outskirts/silhouette/rockjaw-boar' },
  { id: 'snarling-wolf', label: 'Snarling Wolf', levelLabel: 'Lv. 11', artKey: 'outskirts/encounter/snarling-wolf', silhouetteKey: 'outskirts/silhouette/snarling-wolf' },
  { id: 'venomcoil', label: 'Venomcoil', levelLabel: 'Lv. 13', artKey: 'outskirts/encounter/venomcoil', silhouetteKey: 'outskirts/silhouette/venomcoil' },
  { id: 'shade-stalker', label: 'Shade Stalker', levelLabel: 'Lv. 15', artKey: 'outskirts/encounter/shade-stalker', silhouetteKey: 'outskirts/silhouette/shade-stalker' },
  { id: 'mire-serpent', label: 'Mire Serpent', levelLabel: 'Lv. 17', artKey: 'outskirts/encounter/mire-serpent', silhouetteKey: 'outskirts/silhouette/mire-serpent' },
] as const;

export const OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST = OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST;
export const OUTSKIRTS_ENCOUNTER_DEFAULT_ID = 'snarling-wolf' as const;
export const OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID = OUTSKIRTS_ENCOUNTER_DEFAULT_ID;

export const OUTSKIRTS_REVIEW_COPY = {
  pageTitle: 'Outskirts',
  subtitle: 'Gold and common materials',
  setupCardTitle: 'Your Setup',
  rewardsCardTitle: 'Expected Rewards',
  commonMaterialsTitle: 'Common Materials',
  trackedBountyTitle: 'Tracked Bounty',
  estimatedEfficiencyTitle: 'Estimated Efficiency',
  autoRepeatLabel: 'Auto-Repeat',
  grindSummaryTitle: 'Grind Summary',
  grindScope: 'This Area',
  ctaLabel: 'Start Hunt',
} as const;

export const OUTSKIRTS_PLACEHOLDER_POLICY = {
  iconFallbackPrefix: 'placeholder/icon/',
  scenicFallbackKey: 'placeholder/scenic/outskirts-field',
  encounterFallbackKey: 'placeholder/encounter/field-beast',
  lineFallback: '—',
} as const;

export const OUTSKIRTS_ALLOWED_PLANNING_SHELL: OutskirtsMockupShellFlags = {
  showRunCompass: false,
  showCombatModuleTopLane: false,
  showCombatTheater: false,
  showCombatHpBars: false,
  showFloatingDamage: false,
  showSummaryRail: false,
  showUtilityTray: false,
  showCombatLog: false,
  showCombatOptions: false,
  rightCardHasPrimaryAction: false,
  singleDominantCta: true,
  useScenicCenter: true,
  usePlanningState: true,
};


export const OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL: OutskirtsMockupShellFlags = {
  showRunCompass: false,
  showCombatModuleTopLane: false,
  showCombatTheater: true,
  showCombatHpBars: true,
  showFloatingDamage: false,
  showSummaryRail: false,
  showUtilityTray: false,
  showCombatLog: false,
  showCombatOptions: false,
  rightCardHasPrimaryAction: false,
  singleDominantCta: true,
  useScenicCenter: true,
  usePlanningState: false,
};
