import type {
  PavilionElderNoteSurface,
  PavilionEntrySectionSurface,
  PavilionRecordStateLegendSurface,
  PavilionRouteButtonSurface,
} from './pavilionTypes.js';

export const PAVILION_ROOT_TEST_ID = 'pavilion-exact-page' as const;
export const PAVILION_DEFAULT_ENTRY_ID = 'gate_trials_and_thresholds.foundation_gate';
export const PAVILION_FIRST_STEPS_ENTRY_ID = 'disciple_s_first_steps.first_hour';
export const PAVILION_CONTENT_VERSION_FALLBACK = 'pavilion-records-v1';

export function isPavilionExactFixtureRouteEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('pavilionExact') === 'fixture' || params.get('recordsExact') === 'fixture';
}

export const PAVILION_FIXTURE_RIBBON = {
  realm: 'Qi Condensation',
  path: 'Heaven Path',
  heartLaw: 'Quiet Breath Method',
  city: 'Pinewind Hamlet',
  milestone: 'Prepare Foundation Gate',
  display: 'Qi Condensation \u00b7 Heaven Path \u00b7 Quiet Breath Method \u00b7 Pinewind Hamlet \u00b7 Prepare Foundation Gate',
};

export const PAVILION_FIXTURE_ELDER_NOTE: PavilionElderNoteSurface = {
  title: 'Elder Note',
  body: 'Your foundation is close. Stock healing pills before challenging the gate.',
  checklist: [
    { id: 'medicine', label: 'Medicine weak', status: 'warning' },
    { id: 'weapon', label: 'Weapon floor close', status: 'complete' },
    { id: 'loadout', label: 'Loadout complete', status: 'complete' },
  ],
};

export const PAVILION_FIXTURE_SECTIONS: PavilionEntrySectionSurface[] = [
  {
    id: 'jade-slip',
    number: 1,
    title: 'Jade Slip',
    body: 'Foundation Gate is the first major threshold where cultivation progress must become prepared power. The goal is not to farm the gate; it is to prove eligibility, clear or safety-net the guardian, claim the Gate Foundation Pill, and return to Cultivation for Foundation Establishment.',
    tone: 'positive',
  },
  {
    id: 'plain-meaning',
    number: 2,
    title: 'Plain Meaning',
    body: 'This gate checks final Qi Condensation, Qi cap, combat readiness, medicine, weapon floor, and loadout shape. It should tell the player exactly why an attempt is viable, risky, locked, cleared, or bypassed.',
  },
  {
    id: 'quick-rule',
    number: 3,
    title: 'Quick Rule',
    body: 'Attempt only after hard eligibility is complete and at least medicine, loadout, and weapon floor are not warning states. After clear or bypass, route to Cultivation; do not keep farming the gate.',
    tone: 'positive',
  },
  {
    id: 'current-relevance',
    number: 4,
    title: 'Current Relevance',
    body: 'Recommended now: near the threshold, but medicine is weak. Fix the pouch before repeating a guardian attempt.',
    tone: 'warning',
  },
  {
    id: 'hard-requirements',
    number: 5,
    title: 'Hard Requirements',
    rows: [
      { id: 'final-substage', label: 'Final Substage reached', status: 'complete' },
      { id: 'qi-cap', label: 'Qi Cap reached', status: 'complete' },
      { id: 'gate-eligibility', label: 'Eligible to attempt Foundation Gate', status: 'complete' },
      { id: 'clear-or-bypass', label: 'Clear or Safety Net still needed', status: 'warning' },
    ],
  },
  {
    id: 'what-to-do-next',
    number: 6,
    title: 'What To Do Next',
    rows: [
      { id: 'apothecary', label: 'Stock healing and configure medicine pouch', value: 'Route to Apothecary', status: 'open', routeLabel: 'Route to Apothecary', routeAction: 'routeApothecary' },
      { id: 'forge', label: 'Raise weapon or armor floor if damage/survival is weak', value: 'Route to Forge', status: 'open', routeLabel: 'Route to Forge', routeAction: 'routeForge' },
      { id: 'manual-pavilion', label: 'Buy/study a role-filling manual if loadout is thin', value: 'Route to Manual Pavilion', status: 'open', routeLabel: 'Route to Manual Pavilion', routeAction: 'routeManualPavilion' },
      { id: 'ruins', label: 'Run Ruins for support materials if inputs are missing', value: 'Route to Ruins', status: 'open', routeLabel: 'Route to Ruins', routeAction: 'routeRuins' },
    ],
  },
  {
    id: 'numbers-to-watch',
    number: 7,
    title: 'Numbers To Watch',
    rows: [
      { id: 'readiness-score', label: 'Readiness Score', value: 'Aim for viable/ready before serious attempts', status: 'open' },
      { id: 'eligible-failures', label: 'Eligible Failures', value: 'Controls Safety Net progress', status: 'open' },
      { id: 'medicine-count', label: 'Medicine Count', value: 'Low stock is the current warning', status: 'warning' },
      { id: 'gate-reward', label: 'Gate Foundation Pill', value: 'Clear or bypass reward used for breakthrough', status: 'complete' },
    ],
  },
  {
    id: 'common-mistake',
    number: 8,
    title: 'Common Mistake',
    body: 'Do not treat the gate as a repeat farm, and do not retry a failed attempt until one diagnosed blocker changes: medicine, weapon floor, loadout, AI, or technique rank/mastery.',
    tone: 'warning',
  },
];

export const PAVILION_FIXTURE_ROUTE_BUTTONS: PavilionRouteButtonSurface[] = [
  { id: 'route-gate', label: 'Route to Gate Trial', action: 'routeGateTrial', enabled: true, targetTab: 'adventure', worldBuildingKey: 'gateTrial' },
  { id: 'route-cultivation', label: 'Route to Cultivation', action: 'routeCultivation', enabled: true, targetTab: 'cultivation' },
  { id: 'ask-records', label: 'Ask the Records', action: 'askRecords', enabled: true, targetEntryId: PAVILION_DEFAULT_ENTRY_ID },
];

export const PAVILION_FIXTURE_RELATED = [
  'Gate Trial',
  'Breakthrough',
  'Medicine Pouch',
  'Forge',
  'Manual Pavilion',
  'Merit',
  'Safety Net',
  'Reincarnation',
];

export function buildPavilionRecordStateLegend(states: Record<string, string>): PavilionRecordStateLegendSurface[] {
  return [
    { id: 'sealed', label: 'Sealed', tooltip: states.Sealed ?? 'Locked by discovery.', kind: 'sealed' },
    { id: 'rumored', label: 'Rumored', tooltip: states.Rumored ?? 'Details incomplete.', kind: 'rumored' },
    { id: 'recorded', label: 'Recorded', tooltip: states.Recorded ?? 'Known to the archive.', kind: 'recorded' },
    { id: 'studied', label: 'Studied', tooltip: states.Studied ?? 'Meaningfully used.', kind: 'studied' },
    { id: 'mastered', label: 'Mastered', tooltip: states.Mastered ?? 'Mastery completed.', kind: 'mastered' },
    { id: 'recommended', label: 'Recommended', tooltip: states['Recommended Now'] ?? 'Relevant now.', kind: 'recommendedNow' },
    { id: 'warning', label: 'Warning', tooltip: states.Warning ?? 'Risk or shortage.', kind: 'warning' },
    { id: 'prior-life', label: 'Prior-Life', tooltip: 'Annotation preserved from a previous life.', kind: 'priorLife' },
  ];
}
