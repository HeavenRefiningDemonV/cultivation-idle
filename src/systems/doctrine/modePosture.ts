import type { BreathMode, FocusMode } from '../../types/index.js';
import type { DoctrineSnapshot } from './doctrineTypes.js';
import { getRecommendedBreathModes } from './breathSemantics.js';
import { getRecommendedFocusModes } from './focusSemantics.js';

export type DoctrineModePostureRating = 'helping' | 'neutral' | 'hurting';

export interface ModePostureAssessment<TMode extends FocusMode | BreathMode> {
  mode: TMode;
  rating: DoctrineModePostureRating;
  shortLine: string;
  recommendationOrder: TMode[];
  suggestedAlternative: TMode | null;
}

export interface DoctrineModePostureSurface {
  focus: ModePostureAssessment<FocusMode>;
  breath: ModePostureAssessment<BreathMode>;
  overallLine: string | null;
}

type ModePostureInput = Pick<
  DoctrineSnapshot,
  'path' | 'focusMode' | 'breathMode' | 'heartLawId' | 'heartLawChapter'
> & {
  diagnosisCode?: string | null;
  needsSurvival?: boolean;
  needsStability?: boolean;
  needsQiPush?: boolean;
};

function resolveNeeds(input: ModePostureInput): { needsSurvival: boolean; needsStability: boolean; needsQiPush: boolean } {
  const diagnosis = input.diagnosisCode ?? null;
  return {
    needsSurvival: input.needsSurvival ?? (diagnosis === 'underforged' || diagnosis === 'underprepared'),
    needsStability: input.needsStability ?? (diagnosis === 'close' || diagnosis === 'underprepared' || diagnosis === 'underforged'),
    needsQiPush: input.needsQiPush ?? diagnosis === 'undercultivated',
  };
}

function resolveRating<TMode extends FocusMode | BreathMode>(
  mode: TMode,
  recommendationOrder: TMode[],
  isMismatchHurting: boolean,
): DoctrineModePostureRating {
  if (recommendationOrder[0] === mode) {
    return 'helping';
  }
  if (isMismatchHurting && recommendationOrder[2] === mode) {
    return 'hurting';
  }
  return 'neutral';
}

export function evaluateDoctrineModePosture(input: ModePostureInput): DoctrineModePostureSurface {
  const focusOrder = getRecommendedFocusModes(input);
  const breathOrder = getRecommendedBreathModes(input);
  const needs = resolveNeeds(input);
  const hasLaw = typeof input.heartLawId === 'string' && input.heartLawId.trim().length > 0;

  const focusHurting =
    needs.needsSurvival && input.focusMode === 'spirit'
    || (needs.needsQiPush && input.focusMode === 'body');
  const breathHurting =
    (needs.needsStability && input.breathMode === 'fast')
    || (needs.needsQiPush && hasLaw && input.heartLawChapter < 5 && input.breathMode === 'safe');

  const focusRating = resolveRating(input.focusMode, focusOrder, focusHurting);
  const breathRating = resolveRating(input.breathMode, breathOrder, breathHurting);

  const focusSuggestion = focusOrder[0] !== input.focusMode ? focusOrder[0] : null;
  const breathSuggestion = breathOrder[0] !== input.breathMode ? breathOrder[0] : null;

  const overallLine =
    focusRating === 'hurting' || breathRating === 'hurting'
      ? 'Current mode posture is fighting your visible gate needs; consider the suggested alternatives.'
      : focusRating === 'helping' || breathRating === 'helping'
        ? 'Current mode posture is supporting the visible gate need.'
        : 'Current mode posture is neutral; your main bottleneck is likely elsewhere.';

  return {
    focus: {
      mode: input.focusMode,
      rating: focusRating,
      shortLine:
        focusRating === 'helping'
          ? `Focus is helping now (${input.focusMode}).`
          : focusRating === 'hurting'
            ? `Focus is hurting now (${input.focusMode}); ${focusSuggestion ?? focusOrder[0]} is usually cleaner.`
            : `Focus is neutral now (${input.focusMode}).`,
      recommendationOrder: focusOrder,
      suggestedAlternative: focusSuggestion,
    },
    breath: {
      mode: input.breathMode,
      rating: breathRating,
      shortLine:
        breathRating === 'helping'
          ? `Breath is helping now (${input.breathMode}).`
          : breathRating === 'hurting'
            ? `Breath is hurting now (${input.breathMode}); ${breathSuggestion ?? breathOrder[0]} is usually cleaner.`
            : `Breath is neutral now (${input.breathMode}).`,
      recommendationOrder: breathOrder,
      suggestedAlternative: breathSuggestion,
    },
    overallLine,
  };
}
