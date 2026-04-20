import type { OutskirtsMockupShellFlags } from './types.js';

export const OUTSKIRTS_MOCKUP_VERSION = 'p1.v1' as const;

export const OUTSKIRTS_MOCKUP_REGION_ORDER = [
  'topBand',
  'statusBand',
  'plaqueCluster',
  'scenicEncounterField',
  'setupCard',
  'rewardsCard',
  'encounterChain',
  'primaryCta',
  'grindSummary',
] as const;

export const OUTSKIRTS_SETUP_SUBSECTION_ORDER = [
  'loadoutSet',
  'aiProfile',
  'attackFocus',
  'offense',
  'defense',
  'medicinePouch',
  'equipmentGrid',
] as const;

export const OUTSKIRTS_REWARDS_SUBSECTION_ORDER = [
  'expectedRewards',
  'guaranteedOrLikely',
  'bountyOverlap',
  'efficiency',
  'cadenceSupport',
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

export const OUTSKIRTS_EQUIPMENT_SLOT_ORDER = [
  'weapon',
  'armor',
  'ring',
  'talisman',
  'boots',
  'charm',
] as const;

export const OUTSKIRTS_ENCOUNTER_NODE_ORDER_POLICY = 'ordered-by-manifest-then-state' as const;

export const OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST = [
  {
    id: 'quiet-glade',
    label: 'Quiet Glade',
    displayLevelText: 'Lv. 18',
    artKey: 'outskirts/encounter/quiet-glade',
    silhouetteKey: 'outskirts/silhouette/quiet-glade',
  },
  {
    id: 'rockjaw-boar',
    label: 'Rockjaw Boar',
    displayLevelText: 'Lv. 19',
    artKey: 'outskirts/encounter/rockjaw-boar',
    silhouetteKey: 'outskirts/silhouette/rockjaw-boar',
  },
  {
    id: 'snarling-wolf',
    label: 'Snarling Wolf',
    displayLevelText: 'Lv. 20',
    artKey: 'outskirts/encounter/snarling-wolf',
    silhouetteKey: 'outskirts/silhouette/snarling-wolf',
  },
  {
    id: 'venomcoil',
    label: 'Venomcoil',
    displayLevelText: 'Lv. 21',
    artKey: 'outskirts/encounter/venomcoil',
    silhouetteKey: 'outskirts/silhouette/venomcoil',
  },
  {
    id: 'shade-stalker',
    label: 'Shade Stalker',
    displayLevelText: 'Lv. 22',
    artKey: 'outskirts/encounter/shade-stalker',
    silhouetteKey: 'outskirts/silhouette/shade-stalker',
  },
  {
    id: 'mire-serpent',
    label: 'Mire Serpent',
    displayLevelText: 'Lv. 23',
    artKey: 'outskirts/encounter/mire-serpent',
    silhouetteKey: 'outskirts/silhouette/mire-serpent',
  },
] as const;

export const OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID = 'quiet-glade' as const;

export const OUTSKIRTS_MOCKUP_COPY = {
  pageTitle: 'Outskirts',
  pageSubtitleFallback: 'Gold and common materials',
  topProgressLabel: 'Hunt Cadence',
  setupCardTitle: 'Your Setup',
  rewardsCardTitle: 'Expected Rewards',
  grindSummaryTitle: 'Grind Summary',
  fallbackCtaLabel: 'Start Hunt',
  fallbackBountyLine: 'No tracked bounty',
  fallbackCadenceLine: 'Auto-continue Off • Stop at boss On',
  fallbackEncounterDescriptor: 'Low-risk field route for build and AI verification.',
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
