import type { CultivationPath, FocusMode } from '../../types/index.js';
import type { DoctrineSnapshot } from './doctrineTypes.js';

export interface FocusModeSemantics {
  mode: FocusMode;
  label: string;
  summary: string;
  preferredFor: readonly CultivationPath[];
  cautions: readonly string[];
}

const FOCUS_MODE_SEMANTICS: Readonly<Record<FocusMode, FocusModeSemantics>> = Object.freeze({
  balanced: Object.freeze({
    mode: 'balanced',
    label: 'Balanced',
    summary: 'Neutral posture. Keep Qi growth and combat stats on their baseline when you do not need a deliberate skew.',
    preferredFor: Object.freeze(['heaven', 'earth', 'martial'] as const),
    cautions: Object.freeze(['It does not patch fragility or accelerate cultivation by itself.']),
  }),
  body: Object.freeze({
    mode: 'body',
    label: 'Body',
    summary: 'Durability posture. Trade cultivation speed for a heavier body and firmer defense without changing attack.',
    preferredFor: Object.freeze(['earth', 'martial'] as const),
    cautions: Object.freeze(['Use it to survive or stabilize; it is not the fast answer for raw Qi farming.']),
  }),
  spirit: Object.freeze({
    mode: 'spirit',
    label: 'Spirit',
    summary: 'Qi-first posture. Push cultivation harder and accept a thinner body while you do it.',
    preferredFor: Object.freeze(['heaven'] as const),
    cautions: Object.freeze(['Greed is punished here when your real problem is surviving, not cultivating faster.']),
  }),
});

const FOCUS_RECOMMENDATIONS_BY_PATH: Readonly<Record<'none' | CultivationPath, readonly FocusMode[]>> = Object.freeze({
  none: Object.freeze(['balanced', 'body', 'spirit'] as const),
  heaven: Object.freeze(['spirit', 'balanced', 'body'] as const),
  earth: Object.freeze(['body', 'balanced', 'spirit'] as const),
  martial: Object.freeze(['balanced', 'body', 'spirit'] as const),
});

export function getFocusModeSemantics(mode: FocusMode): FocusModeSemantics {
  return FOCUS_MODE_SEMANTICS[mode];
}

export function getRecommendedFocusModes(snapshot: Pick<DoctrineSnapshot, 'path'>): FocusMode[] {
  const key = snapshot.path ?? 'none';
  return [...FOCUS_RECOMMENDATIONS_BY_PATH[key]];
}
