import type { AiProfile, CastingPolicy } from '../../types/index.js';
import type {
  CastingPolicyFit,
  CombatEncounterType,
  CombatLoadoutSignals,
  CombatPostureRating,
} from './combatPostureTypes.js';
import { COMBAT_POSTURE_RATING_ORDER, SERIOUS_COMBAT_ENCOUNTERS } from './combatPostureTypes.js';

const BASELINE_POLICY_RATINGS: Readonly<Record<CombatEncounterType, Readonly<Record<CastingPolicy, CombatPostureRating>>>> =
  Object.freeze({
    outskirts: Object.freeze({
      aggressive: 'good',
      balanced: 'good',
      defensive: 'risky',
    }),
    ruins: Object.freeze({
      aggressive: 'risky',
      balanced: 'good',
      defensive: 'good',
    }),
    trial: Object.freeze({
      aggressive: 'risky',
      balanced: 'good',
      defensive: 'good',
    }),
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

export function getDefaultCastingPolicyForAiProfile(profile: AiProfile): CastingPolicy {
  switch (profile) {
    case 'survivor':
      return 'defensive';
    case 'burst':
      return 'aggressive';
    case 'farmer':
      return 'balanced';
    case 'balanced':
    default:
      return 'balanced';
  }
}

export function evaluateCastingPolicyFit(input: {
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  encounterType: CombatEncounterType;
  loadoutSignals: CombatLoadoutSignals;
}): CastingPolicyFit {
  const warnings: string[] = [];
  let rating = BASELINE_POLICY_RATINGS[input.encounterType]?.[input.castingPolicy] ?? 'risky';

  if (
    input.encounterType === 'trial' &&
    input.castingPolicy === 'aggressive' &&
    (!input.loadoutSignals.hasSurvivalTool || !input.loadoutSignals.hasBossTool)
  ) {
    rating = 'bad';
    pushWarning(
      warnings,
      'Aggressive casting is a bad fit for a gate trial without both survival and boss-pressure tools.',
    );
  }

  if (
    input.encounterType === 'ruins' &&
    input.castingPolicy === 'aggressive' &&
    !input.loadoutSignals.hasSurvivalTool
  ) {
    rating = 'bad';
    pushWarning(
      warnings,
      'Aggressive casting is risky in ruins when the loadout lacks survival support.',
    );
  }

  if (
    SERIOUS_COMBAT_ENCOUNTERS.includes(input.encounterType) &&
    input.castingPolicy === 'defensive' &&
    !input.loadoutSignals.hasSurvivalTool
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      'Defensive casting is under-supported: the loadout lacks real survival tools.',
    );
  }

  if (input.encounterType === 'outskirts' && input.castingPolicy === 'defensive') {
    if (rating === 'good') {
      rating = 'risky';
    }
    pushWarning(
      warnings,
      'Defensive casting slows open-world clears when the current loadout is not under real pressure.',
    );
  }

  if (
    (input.aiProfile === 'survivor' && input.castingPolicy === 'aggressive') ||
    (input.aiProfile === 'farmer' && input.castingPolicy === 'defensive')
  ) {
    rating = downgradeRating(rating);
    pushWarning(
      warnings,
      "Casting policy diverges from the selected AI profile's natural posture.",
    );
  }

  return {
    rating,
    warnings: [...warnings],
  };
}
