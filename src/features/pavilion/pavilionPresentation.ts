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
    id: 'plain-meaning',
    number: 1,
    title: 'Plain Meaning',
    body: 'Milestone readiness check that clears the path to Foundation.',
  },
  {
    id: 'current-relevance',
    number: 2,
    title: 'Current Relevance',
    body: 'Recommended now: near the threshold, but medicine is weak.',
    tone: 'warning',
  },
  {
    id: 'hard-requirements',
    number: 3,
    title: 'Hard Requirements',
    rows: [
      { id: 'final-substage', label: 'Final Substage', status: 'complete' },
      { id: 'qi-cap', label: 'Qi Cap', status: 'complete' },
      { id: 'gate-eligibility', label: 'Gate Eligibility', status: 'complete' },
      { id: 'clear-or-bypass', label: 'Clear or Bypass State', status: 'warning' },
    ],
  },
  {
    id: 'how-to-prepare',
    number: 4,
    title: 'How to Prepare',
    rows: [
      { id: 'apothecary', label: 'Apothecary', value: 'stock medicine', routeLabel: 'Route to Apothecary', routeAction: 'routeApothecary' },
      { id: 'forge', label: 'Forge', value: 'improve weapon floor', routeLabel: 'Route to Forge', routeAction: 'routeForge' },
      { id: 'manual-pavilion', label: 'Manual Pavilion', value: 'close build gap', routeLabel: 'Route to Manual Pavilion', routeAction: 'routeManualPavilion' },
      { id: 'ruins', label: 'Ruins', value: 'support materials', routeLabel: 'Route to Ruins', routeAction: 'routeRuins' },
    ],
  },
  {
    id: 'used-for',
    number: 5,
    title: 'Used For',
    rows: [
      { id: 'foundation-breakthrough', label: 'Foundation breakthrough handoff' },
      { id: 'gate-foundation-pill', label: 'Gate Foundation Pill / gate reward' },
    ],
  },
  {
    id: 'common-mistake',
    number: 6,
    title: 'Common Mistake',
    body: 'Do not treat the gate as a farm; prepare first.',
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
