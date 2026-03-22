import type { BreathMode } from '../../types/index.js';
import type { DoctrineSnapshot } from './doctrineTypes.js';

export type BreathModePreference = 'cultivate' | 'recover' | 'prepare_breakthrough' | 'push_fast';

export interface BreathModeSemantics {
  mode: BreathMode;
  label: string;
  summary: string;
  preferredFor: readonly BreathModePreference[];
  cautions: readonly string[];
}

const BREATH_MODE_SEMANTICS: Readonly<Record<BreathMode, BreathModeSemantics>> = Object.freeze({
  balanced: Object.freeze({
    mode: 'balanced',
    label: 'Balanced',
    summary: 'Neutral cycle. Steady Qi flow, steady comprehension, and steady stability.',
    preferredFor: Object.freeze(['cultivate', 'recover'] as const),
    cautions: Object.freeze(['Good default, but it will not specialize verse progress or short burst farming.']),
  }),
  safe: Object.freeze({
    mode: 'safe',
    label: 'Safe',
    summary: 'Controlled cycle. Slower Qi flow in exchange for better comprehension and better stability.',
    preferredFor: Object.freeze(['prepare_breakthrough', 'recover', 'cultivate'] as const),
    cautions: Object.freeze(['Stay here when the foundation is shaky; leave it when raw progress is the real bottleneck.']),
  }),
  fast: Object.freeze({
    mode: 'fast',
    label: 'Fast',
    summary: 'Aggressive cycle. Faster Qi flow in exchange for worse comprehension and worse stability.',
    preferredFor: Object.freeze(['push_fast', 'cultivate'] as const),
    cautions: Object.freeze(['Greedy use is punished while your scripture still needs chapters or your foundation still wobbles.']),
  }),
});

function hasActiveHeartLaw(snapshot: Pick<DoctrineSnapshot, 'heartLawId'>): boolean {
  return typeof snapshot.heartLawId === 'string' && snapshot.heartLawId.trim().length > 0;
}

function isHighHeartLawChapter(snapshot: Pick<DoctrineSnapshot, 'heartLawId' | 'heartLawChapter'>): boolean {
  return hasActiveHeartLaw(snapshot) && snapshot.heartLawChapter >= 5;
}

export function getBreathModeSemantics(mode: BreathMode): BreathModeSemantics {
  return BREATH_MODE_SEMANTICS[mode];
}

export function getRecommendedBreathModes(
  snapshot: Pick<DoctrineSnapshot, 'path' | 'focusMode' | 'heartLawId' | 'heartLawChapter'>,
): BreathMode[] {
  if (snapshot.path === 'earth' && snapshot.focusMode === 'body' && hasActiveHeartLaw(snapshot)) {
    return ['safe', 'balanced', 'fast'];
  }

  if (snapshot.path === 'heaven' && snapshot.focusMode === 'spirit' && hasActiveHeartLaw(snapshot) && snapshot.heartLawChapter < 5) {
    return ['fast', 'balanced', 'safe'];
  }

  if (snapshot.path === 'martial' && isHighHeartLawChapter(snapshot)) {
    return ['balanced', 'fast', 'safe'];
  }

  return ['balanced', 'safe', 'fast'];
}
