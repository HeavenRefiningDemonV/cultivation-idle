import type { AiProfile, CastingPolicy } from '../../types/index.js';
import type {
  TechniquesExactCastingPolicyButtonSurface,
  TechniquesExactFilterId,
  TechniquesExactTone,
} from './techniquesExactTypes.js';

export const TECHNIQUES_EXACT_SURFACE_VERSION = 'techniques-exact-v1';
export const TECHNIQUES_EXACT_ROOT_TEST_ID = 'techniques-exact-page';

export const TECHNIQUES_EXACT_COPY = {
  title: 'Techniques',
  subtitle: 'Inner Palace Combat Form',
  diagnosisTitle: 'Best next loadout fix',
  fixtureDiagnosisLine: 'fill one passive slot before the next Gate.',
  farmerWarning: 'Farmer is poor for Gate Trials',
  missingKnowledge: 'Missing knowledge? Visit Manual Pavilion',
  applyLoadout: 'Apply Loadout',
  manualPavilion: 'Go to Manual Pavilion',
} as const;

export const AI_PROFILE_LABELS: Record<AiProfile, string> = {
  balanced: 'Balanced',
  survivor: 'Survivor',
  burst: 'Burst',
  farmer: 'Farmer',
};

export const CASTING_POLICY_DISPLAY: Record<CastingPolicy, {
  id: TechniquesExactCastingPolicyButtonSurface['id'];
  label: TechniquesExactCastingPolicyButtonSurface['displayLabel'];
  shortHelp: string;
  technicalMapping: string;
}> = {
  balanced: {
    id: 'reactive',
    label: 'Reactive',
    shortHelp: 'Responds to combat state with a balanced priority mix.',
    technicalMapping: 'Uses the current balanced casting policy.',
  },
  aggressive: {
    id: 'ordered',
    label: 'Ordered',
    shortHelp: 'Presses offensive techniques earlier and more consistently.',
    technicalMapping: 'Uses the current aggressive casting policy.',
  },
  defensive: {
    id: 'holdUltimate',
    label: 'Hold Ultimate',
    shortHelp: 'Conserves burst and favors protection until pressure warrants action.',
    technicalMapping: 'Uses the current defensive casting policy until a true hold-ultimate policy exists.',
  },
};

export const CASTING_POLICY_ORDER: readonly CastingPolicy[] = Object.freeze([
  'balanced',
  'aggressive',
  'defensive',
] as const);

export const TECHNIQUES_FILTERS: readonly {
  id: TechniquesExactFilterId;
  label: string;
  tone: TechniquesExactTone;
}[] = Object.freeze([
  { id: 'all', label: 'All', tone: 'jade' },
  { id: 'pathFit', label: 'Path Fit', tone: 'jade' },
  { id: 'damage', label: 'Damage', tone: 'bronze' },
  { id: 'guard', label: 'Guard', tone: 'bronze' },
  { id: 'heal', label: 'Heal', tone: 'jade' },
  { id: 'control', label: 'Control', tone: 'red' },
  { id: 'setup', label: 'Setup', tone: 'amber' },
] as const);

export const romanizeRank = (rank: number | null | undefined): string => {
  const value = Math.max(1, Math.floor(Number(rank) || 1));
  const numerals: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
  };
  return numerals[value] ?? `Rank ${value}`;
};

export const titleCase = (value: string | null | undefined): string => {
  if (!value) return 'Unknown';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const getTechniquesExactQueryMode = (): 'fixture' | 'legacy' | 'live' => {
  if (typeof window === 'undefined') return 'live';
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('techniquesExactMode') ?? params.get('techniquesExact');
  if (mode === 'fixture') return 'fixture';
  if (mode === 'legacy') return 'legacy';
  return 'live';
};

export const isTechniquesExactQueryModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('techniquesExactMode') || params.has('techniquesExact');
};
