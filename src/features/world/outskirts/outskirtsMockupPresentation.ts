import type { OutskirtsMockupShellFlags } from './types.js';

export const OUTSKIRTS_MOCKUP_VERSION = 'p1.v1' as const;

export const OUTSKIRTS_MOCKUP_REGION_ORDER = [
  'pageTitle',
  'topProgress',
  'tacticalStrip',
  'areaPlaque',
  'subtitle',
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

export const OUTSKIRTS_MOCKUP_COPY = {
  pageTitle: 'Outskirts',
  pageSubtitleFallback: 'Calm the route before committing the next hunt.',
  topProgressLabel: 'Hunt Cadence',
  setupCardTitle: 'Your Setup',
  rewardsCardTitle: 'Expected Rewards',
  grindSummaryTitle: 'Grind Summary',
  defaultAreaPlaquePrefix: 'Area:',
  fallbackCtaLabel: 'Start Hunt',
  fallbackBountyLine: 'No tracked bounty selected',
  fallbackCadenceLine: 'Auto-continue Off • Stop at boss On',
  fallbackEncounterDescriptor: 'Low-risk field route for repeated setup testing.',
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
