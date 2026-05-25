export const GATE_TRIAL_TARGET_MOCKUP_ID = 'gate-trial-foundation-gate-readiness-2048x1152' as const;
export const GATE_TRIAL_EXACT_SURFACE_VERSION = 'g0-a.v1' as const;
export const GATE_TRIAL_EXACT_ROOT_TEST_ID = 'gate-trial-exact-page' as const;

export const GATE_TRIAL_EXACT_REGION_ORDER = [
  'page-title',
  'top-macro-ribbon',
  'top-status',
  'tactical-strip',
  'gate-header',
  'left-minimum-checklist',
  'center-scenic-stage',
  'readiness-seal',
  'guardian-reward-plaque',
  'right-recommended-panel',
  'right-trial-summary',
  'bottom-readiness-rail',
  'primary-attempt-cta',
] as const;

export const GATE_TRIAL_EXACT_MOCKUP_CANVAS = {
  width: 2048,
  height: 1152,
  aspectRatio: '16:9',
  sourceLabel: 'provided Gate Trial Foundation Gate mockup',
} as const;

export const GATE_TRIAL_EXACT_MOCKUP_REGIONS = {
  pageTitle: { x: 55, y: 25, width: 235, height: 45 },
  topMacroRibbon: { x: 555, y: 34, width: 935, height: 38 },
  topStatus: { x: 1648, y: 23, width: 352, height: 42 },
  tacticalStrip: { x: 45, y: 82, width: 1935, height: 66 },
  gateHeader: { x: 760, y: 158, width: 530, height: 75 },
  leftChecklist: { x: 34, y: 245, width: 340, height: 667 },
  scenicStage: { x: 390, y: 180, width: 1190, height: 720 },
  readinessSeal: { x: 848, y: 598, width: 378, height: 188 },
  rewardPlaque: { x: 835, y: 806, width: 410, height: 116 },
  recommendedRail: { x: 1608, y: 195, width: 388, height: 634 },
  trialSummary: { x: 1608, y: 838, width: 388, height: 236 },
  readinessRail: { x: 340, y: 946, width: 1215, height: 99 },
  primaryCta: { x: 720, y: 1047, width: 568, height: 73 },
} as const;

export const GATE_TRIAL_EXACT_TOP_REGION_CONTRACT = {
  targetHeightPx: 154,
  pageTitle: { x: 55, y: 25, width: 235, height: 45 },
  topMacroRibbon: { x: 555, y: 34, width: 935, height: 38 },
  topStatus: { x: 1648, y: 23, width: 352, height: 42 },
  tacticalStrip: { x: 45, y: 82, width: 1935, height: 66 },
  tacticalCellCount: 7,
  tacticalCellOrder: ['hp', 'gate', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition'],
  fixtureStatusJoiner: ' · ',
} as const;

export const GATE_TRIAL_EXACT_TOP_REGION_VISUAL_NOTES = [
  'The title is page-level and sits outside tactical cells.',
  'The red title seal is an empty visual seal, not visible text.',
  'The macro ribbon is decorative and not a tab row.',
  'The top-right status is compact and does not become a full toolbar.',
  'The seven tactical cells fit in one row at desktop target.',
  'The HP tactical cell includes the only top-strip underline bar.',
  'No long negative copy appears inside compact tactical cells.',
  'No CombatModuleTopLane, RuinsTopRegion, or OutskirtsTopRegion is reused.',
] as const;

export const GATE_TRIAL_EXACT_VISUAL_TOKENS = {
  canvasParchment: '#e3d9ca',
  cardParchment: '#d9cdbd',
  topCellParchment: '#d9cbb7',
  inkText: '#2f2a22',
  mutedInk: '#6f6658',
  centerPlaqueInk: '#514b41',
  plaqueGoldTrim: '#b99d63',
  jadeSuccess: '#2f6b4d',
  jadeDeep: '#1f513b',
  warningAmber: '#c79339',
  ctaGold: '#bba375',
  ctaBronzeShadow: '#7f6338',
  sceneInkWash: '#848279',
  sceneMist: '#d6d4c8',
  torchWarmth: '#d4a15f',
  lockedSteel: '#5d5a50',
  dangerRedInk: '#8a3830',
} as const;

export const GATE_TRIAL_FIXTURE_COPY = {
  pageTitle: 'Gate Trial',
  topRightStatus: ['2 Expeditions Idle', '1 Tracked Bounty'],
  tactical: {
    hp: { label: 'HP', primaryText: '131 / 131' },
    gate: { label: 'Gate', primaryText: 'Foundation · Lv. 15' },
    loadout: { label: 'Loadout', primaryText: 'Loadout 1' },
    aiProfile: { label: 'AI Profile', primaryText: 'Balanced' },
    healing: { label: 'Healing', primaryText: '12 / 20' },
    bounty: { label: 'Bounty', primaryText: 'No tracked bounty' },
    expedition: { label: 'Expedition', primaryText: '2 Idle' },
  },
  gateHeader: {
    title: 'Foundation Gate',
    subtitle: 'Milestone readiness check — clears the path to Foundation',
    chips: ['Milestone Gate', 'Readiness Check', 'Safety Net Tracked'],
  },
  readinessSeal: {
    verdict: 'VIABLE',
    scoreLabel: 'Readiness 74 / 100',
    score: 74,
  },
  guardianPlaque: {
    title: 'Gate Guardian · Lv. 15',
    subtitle: 'Foundation Establishment Trial',
    rewardLines: ['Clear Reward: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
    gateItemId: 'gate_foundation_pill',
  },
  minimumChecklistTitle: 'Minimum Checklist',
  minimumStamp: 'Viable',
  recommendedTitle: 'Recommended',
  recommendedPrepTitle: 'Recommended Prep',
  failSafeTitle: 'Fail-Safe',
  topFixesTitle: 'Gate Corrections',
  trialSummaryTitle: 'Trial Summary',
  readinessRailTitle: 'Foundation Gate Readiness',
  primaryCta: 'Attempt Gate',
} as const;

export const GATE_TRIAL_FIXTURE_MINIMUM_ROWS = [
  { id: 'finalSubstage', title: 'Final Substage Reached', detail: 'Qi Condensation · Late 10 / 10', status: 'success', iconKey: 'statusCheck' },
  { id: 'qiCap', title: 'Qi Cap Reached', detail: '590 / 550 Minimum Qi', status: 'success', iconKey: 'statusCheck' },
  { id: 'loadoutComplete', title: 'Loadout Complete', detail: '3 Active / 1 Passive', status: 'success', iconKey: 'statusCheck' },
  { id: 'healingFloor', title: 'Healing Floor', detail: '8 / 12 Recommended Minimum', status: 'warning', iconKey: 'statusWarning' },
  { id: 'weaponFloor', title: 'Weapon Floor', detail: 'Refine +5', status: 'success', iconKey: 'statusCheck' },
] as const;

export const GATE_TRIAL_FIXTURE_RECOMMENDED_ROWS = [
  { id: 'refineGear', title: 'Stabilize weapon floor', detail: '', status: 'success', iconKey: 'statusCheck', routeTarget: 'forge' },
  { id: 'boostStats', title: 'Boost stats with pills', detail: '', status: 'success', iconKey: 'statusCheck', routeTarget: 'apothecary' },
  { id: 'upgradeTechniques', title: 'Upgrade major techniques', detail: '', status: 'success', iconKey: 'statusCheck', routeTarget: 'techniques' },
  { id: 'ruinSupportRun', title: 'Complete one Ruin support run', detail: '', status: 'warning', iconKey: 'statusWarning', routeTarget: 'ruins' },
] as const;

export const GATE_TRIAL_FIXTURE_FAIL_SAFE_ROWS = [
  { id: 'eligibleFailures', label: 'Eligible Failures', value: '3 / 5', iconKey: 'failureSeal', tone: 'neutral' },
  { id: 'cost', label: 'Cost', value: '15 Merit · 800 Gold', iconKey: 'currencySeal', tone: 'neutral' },
  { id: 'reserve', label: 'Reserve', value: '12 Merit · 610 Gold', iconKey: 'reserveSeal', tone: 'warning' },
] as const;

export const GATE_TRIAL_FIXTURE_TOP_FIXES = [
  { id: 'forgeWeapon', label: 'Forge Weapon +5', iconKey: 'weapon', routeTarget: 'forge' },
  { id: 'stockHealing', label: 'Stock Healing', iconKey: 'healing', routeTarget: 'apothecary' },
  { id: 'upgradeTechnique', label: 'Upgrade Iron Palm', iconKey: 'technique', routeTarget: 'techniques' },
] as const;

export const GATE_TRIAL_FIXTURE_SUMMARY_ROWS = [
  { id: 'target', label: 'Target', value: 'Foundation', tone: 'neutral' },
  { id: 'readiness', label: 'Readiness', value: '74 / 100', tone: 'positive' },
  { id: 'failures', label: 'Failures', value: '3 / 5', tone: 'critical' },
  { id: 'reward', label: 'Reward', value: 'Gate Foundation Pill', tone: 'neutral' },
  { id: 'nextFix', label: 'Next Fix', value: 'Stock healing', tone: 'neutral' },
] as const;

export const GATE_TRIAL_FIXTURE_READINESS_NODES = [
  { id: 'qiCap', label: 'Qi Cap', status: 'success', iconKey: 'statusCheck', medallionVariant: 'check' },
  { id: 'loadout', label: 'Loadout', status: 'success', iconKey: 'statusCheck', medallionVariant: 'check' },
  { id: 'weapon', label: 'Weapon', status: 'success', iconKey: 'statusCheck', medallionVariant: 'check' },
  { id: 'medicine', label: 'Medicine', status: 'warning', iconKey: 'statusWarning', medallionVariant: 'warning' },
  { id: 'techniques', label: 'Techniques', status: 'success', iconKey: 'statusCheck', medallionVariant: 'check' },
  { id: 'safetyNet', label: 'Safety Net', status: 'locked', iconKey: 'statusLock', medallionVariant: 'locked' },
  { id: 'gate', label: 'Gate', status: 'active', iconKey: 'gateMarker', medallionVariant: 'gate-glow' },
] as const;

export const GATE_TRIAL_READINESS_SCORE_BANDS = [
  { id: 'locked', min: 0, max: 39, verdict: 'LOCKED', state: 'locked' },
  { id: 'risky', min: 40, max: 64, verdict: 'RISKY', state: 'warning' },
  { id: 'viable', min: 65, max: 84, verdict: 'VIABLE', state: 'viable' },
  { id: 'ready', min: 85, max: 100, verdict: 'READY', state: 'viable' },
] as const;

export const GATE_TRIAL_PRESENTATION_GUARDRAILS = [
  'Gate Trial is a ceremonial threshold, not an Outskirts farm lane.',
  'Do not copy Outskirts Expected Rewards, encounter chains, wolf language, or hunt language.',
  'Do not copy Ruins room-route/material-pity language.',
  'The right rail is Recommended, Fail-Safe, and Gate Corrections.',
  'The left rail is Minimum Checklist.',
  'The bottom rail is readiness milestones, not a combat hotbar.',
  'The CTA is Attempt Gate in planning state.',
  'No emoji glyphs; use icon keys and medallion states.',
] as const;
