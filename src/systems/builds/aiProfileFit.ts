import { getPathDoctrineProfile } from '../doctrine/pathDoctrineRegistry.js';
import type { AiProfile, CultivationPath } from '../../types/index.js';
import type {
  AiProfileFit,
  CombatEncounterType,
  CombatLoadoutSignals,
  CombatPostureRating,
} from './combatPostureTypes.js';
import { COMBAT_POSTURE_RATING_ORDER, SERIOUS_COMBAT_ENCOUNTERS } from './combatPostureTypes.js';

const FALLBACK_AI_RECOMMENDATIONS: Readonly<Record<CombatEncounterType, readonly AiProfile[]>> = Object.freeze({
  outskirts: Object.freeze(['balanced', 'farmer'] as const),
  ruins: Object.freeze(['balanced', 'survivor'] as const),
  trial: Object.freeze(['survivor', 'balanced'] as const),
});

function downgradeRating(rating: CombatPostureRating): CombatPostureRating {
  const index = COMBAT_POSTURE_RATING_ORDER.indexOf(rating);
  if (index < 0) return 'risky';
  return COMBAT_POSTURE_RATING_ORDER[Math.min(index + 1, COMBAT_POSTURE_RATING_ORDER.length - 1)] ?? 'bad';
}

function pushWarning(warnings: string[], warning: string) {
  if (!warnings.includes(warning)) {
    warnings.push(warning);
  }
}

function getRecommendedPair(
  path: CultivationPath | null,
  encounterType: CombatEncounterType,
): readonly AiProfile[] {
  const profile = getPathDoctrineProfile(path);
  const recommended = encounterType === 'trial'
    ? profile?.recommendedAiByPhase.boss
    : profile?.recommendedAiByPhase.early;

  if (recommended && recommended.length >= 2) {
    return [recommended[0], recommended[1]];
  }

  return FALLBACK_AI_RECOMMENDATIONS[encounterType];
}

export function evaluateAiProfileFit(input: {
  path: CultivationPath | null;
  aiProfile: AiProfile;
  encounterType: CombatEncounterType;
  loadoutSignals: CombatLoadoutSignals;
}): AiProfileFit {
  const warnings: string[] = [];
  const recommendedPair = getRecommendedPair(input.path, input.encounterType);
  const [primaryRecommendation, secondaryRecommendation] = recommendedPair;

  let rating: CombatPostureRating =
    input.aiProfile === primaryRecommendation || input.aiProfile === secondaryRecommendation
      ? 'good'
      : 'risky';

  if (input.encounterType === 'trial' && input.aiProfile === 'farmer') {
    rating = 'bad';
    pushWarning(warnings, 'Farmer AI is a poor fit for gate trials.');
  }

  if (input.encounterType === 'ruins' && input.aiProfile === 'farmer') {
    if (rating === 'good') {
      rating = 'risky';
    }
    pushWarning(warnings, 'Farmer AI is greedier than the current ruins encounter wants.');
  }

  if (
    input.encounterType === 'outskirts' &&
    input.aiProfile === 'farmer' &&
    !input.loadoutSignals.hasFarmTool
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      'Farmer AI is under-supported: the current loadout lacks clear-speed tools.',
    );
  }

  if (
    input.encounterType === 'trial' &&
    input.aiProfile === 'burst' &&
    !input.loadoutSignals.hasBossTool
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      'Burst AI is under-supported: no boss-pressure tool is currently equipped.',
    );
  }

  if (
    SERIOUS_COMBAT_ENCOUNTERS.includes(input.encounterType) &&
    input.aiProfile === 'survivor' &&
    !input.loadoutSignals.hasSurvivalTool
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      'Survivor AI is under-supported: no survival tool is currently equipped.',
    );
  }

  if (
    input.encounterType === 'trial' &&
    input.aiProfile === 'balanced' &&
    !input.loadoutSignals.hasSurvivalTool &&
    !input.loadoutSignals.hasBossTool
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      'Balanced AI is under-supported: the current loadout lacks both survival and boss-pressure tools.',
    );
  }

  return {
    rating,
    warnings: [...warnings],
  };
}
