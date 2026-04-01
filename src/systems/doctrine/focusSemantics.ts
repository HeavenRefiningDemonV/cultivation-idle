import type { CultivationPath, FocusMode } from '../../types/index.js';
import type { DoctrineSnapshot } from './doctrineTypes.js';

export interface FocusModeSemantics {
  mode: FocusMode;
  label: string;
  summary: string;
  doctrineLine: string;
  troubleshootingLine: string;
  preferredFor: readonly CultivationPath[];
  cautions: readonly string[];
}

const FOCUS_MODE_SEMANTICS: Readonly<Record<FocusMode, FocusModeSemantics>> = Object.freeze({
  balanced: Object.freeze({
    mode: 'balanced',
    label: 'Balanced',
    summary: 'Neutral posture. Keep Qi growth and combat stats on their baseline when you do not need a deliberate skew.',
    doctrineLine: 'Neutral stance for steady cultivation when no hard skew is needed.',
    troubleshootingLine: 'Balanced is usually neutral: it is rarely your top blocker or top fix by itself.',
    preferredFor: Object.freeze(['heaven', 'earth', 'martial'] as const),
    cautions: Object.freeze(['It does not patch fragility or accelerate cultivation by itself.']),
  }),
  body: Object.freeze({
    mode: 'body',
    label: 'Body',
    summary: 'Durability posture. Trade cultivation speed for a heavier body and firmer defense without changing attack.',
    doctrineLine: 'Durability stance for safer pushes and breakthrough stability.',
    troubleshootingLine: 'Body helps when fragility is the issue; it slows raw Qi tempo when farming is the issue.',
    preferredFor: Object.freeze(['earth', 'martial'] as const),
    cautions: Object.freeze(['Use it to survive or stabilize; it is not the fast answer for raw Qi farming.']),
  }),
  spirit: Object.freeze({
    mode: 'spirit',
    label: 'Spirit',
    summary: 'Qi-first posture. Push cultivation harder and accept a thinner body while you do it.',
    doctrineLine: 'Qi-first stance for aggressive cultivation momentum.',
    troubleshootingLine: 'Spirit helps undercultivation, but it can worsen fragility if survival is already failing.',
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
