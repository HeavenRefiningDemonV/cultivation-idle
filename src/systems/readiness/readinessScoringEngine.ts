import type {
  EconomicReadinessComponentResult,
  GateReadinessInput,
  GateReadinessResult,
  GateForgeTargets,
  PostureReadinessComponentResult,
  ReadinessBand,
  ReadinessComponentResult,
  ReadinessShortfall,
} from './readinessScoringTypes.js';
import {
  READINESS_SHORTFALL_ORDER,
} from './readinessScoringTypes.js';
import type { BuildAnalysis, BuildTechniqueAnalysisEntry } from '../builds/buildAnalysisTypes.js';
import type { ForgeFloorReadModel } from '../forge/forgeFloorReadModel.js';
import type { EconomicReadinessBand, EconomicShortfall } from '../economy/economicRecommendationTypes.js';
import type { CombatPostureFit, CombatPostureRating } from '../builds/combatPostureTypes.js';
import type { GateBuildFloor, GateBuildMasteryTarget } from './gateBuildFloorTypes.js';

function countEquippedTechniquesBySlotType(
  equippedTechniques: readonly BuildTechniqueAnalysisEntry[],
  slotType: BuildTechniqueAnalysisEntry['slotType'],
): number {
  return equippedTechniques.filter((tech) => tech.slotType === slotType).length;
}

function countEquippedTechniquesAtMasteryLevel(
  equippedTechniques: readonly BuildTechniqueAnalysisEntry[],
  masteryLevel: number,
): number {
  return equippedTechniques.filter((tech) => tech.masteryLevel >= masteryLevel).length;
}

function sumRankUpTotal(equippedTechniques: readonly BuildTechniqueAnalysisEntry[]): number {
  return equippedTechniques.reduce((total, tech) => total + Math.max(0, tech.rank - 1), 0);
}

function sumAppliedRunes(equippedTechniques: readonly BuildTechniqueAnalysisEntry[]): number {
  return equippedTechniques.reduce((total, tech) => total + tech.appliedRuneCount, 0);
}

function meetsMasteryTargets(
  equippedTechniques: readonly BuildTechniqueAnalysisEntry[],
  masteryTargets: readonly GateBuildMasteryTarget[],
): boolean {
  return masteryTargets.every((target) => countEquippedTechniquesAtMasteryLevel(equippedTechniques, target.level) >= target.count);
}

function dedupeWarnings(warnings: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  warnings.forEach((warning) => {
    if (seen.has(warning)) return;
    seen.add(warning);
    deduped.push(warning);
  });

  return deduped;
}

function createShortfall(input: ReadinessShortfall): ReadinessShortfall {
  return { ...input };
}

function sortReadinessShortfalls(shortfalls: readonly ReadinessShortfall[]): ReadinessShortfall[] {
  return [...shortfalls].sort(
    (left, right) => READINESS_SHORTFALL_ORDER.indexOf(left.code) - READINESS_SHORTFALL_ORDER.indexOf(right.code),
  );
}

export function evaluateBuildReadiness(input: {
  gateBuildFloor: GateBuildFloor;
  buildAnalysis: BuildAnalysis;
}): ReadinessComponentResult {
  const { gateBuildFloor, buildAnalysis } = input;
  const equippedTechniques = buildAnalysis.equippedTechniques;

  const currentActiveFilled = countEquippedTechniquesBySlotType(equippedTechniques, 'active');
  const currentPassiveFilled = countEquippedTechniquesBySlotType(equippedTechniques, 'passive');
  const currentUltimateFilled = countEquippedTechniquesBySlotType(equippedTechniques, 'ultimate') > 0 ? 1 : 0;
  const currentPathAlignmentScore = buildAnalysis.pathAlignmentScore;
  const currentRankUpTotal = sumRankUpTotal(equippedTechniques);
  const currentRuneCount = sumAppliedRunes(equippedTechniques);

  const minimumMasteryMet = meetsMasteryTargets(equippedTechniques, gateBuildFloor.minimum.masteryTargets);
  const recommendedMasteryMet = meetsMasteryTargets(equippedTechniques, gateBuildFloor.recommended.masteryTargets);

  const minimumMet =
    currentActiveFilled >= gateBuildFloor.minimum.activeSlotsFilled &&
    currentPassiveFilled >= gateBuildFloor.minimum.passiveSlotsFilled &&
    (!gateBuildFloor.minimum.ultimateRequired || currentUltimateFilled >= 1) &&
    currentPathAlignmentScore >= gateBuildFloor.minimum.pathAlignmentScore &&
    minimumMasteryMet &&
    currentRankUpTotal >= gateBuildFloor.minimum.rankUpTotal &&
    currentRuneCount >= gateBuildFloor.minimum.runeCount;

  const recommendedMet =
    currentActiveFilled >= gateBuildFloor.recommended.activeSlotsFilled &&
    currentPassiveFilled >= gateBuildFloor.recommended.passiveSlotsFilled &&
    (!gateBuildFloor.recommended.ultimateRequired || currentUltimateFilled >= 1) &&
    currentPathAlignmentScore >= gateBuildFloor.recommended.pathAlignmentScore &&
    recommendedMasteryMet &&
    currentRankUpTotal >= gateBuildFloor.recommended.rankUpTotal &&
    currentRuneCount >= gateBuildFloor.recommended.runeCount;

  const band: ReadinessBand = recommendedMet
    ? 'recommended_met'
    : minimumMet
      ? 'minimum_met_below_recommended'
      : 'below_minimum';

  const shortfalls: ReadinessShortfall[] = [];

  const currentFilledTotal = currentActiveFilled + currentPassiveFilled + currentUltimateFilled;
  const minimumFilledTarget =
    gateBuildFloor.minimum.activeSlotsFilled +
    gateBuildFloor.minimum.passiveSlotsFilled +
    (gateBuildFloor.minimum.ultimateRequired ? 1 : 0);
  const recommendedFilledTarget =
    gateBuildFloor.recommended.activeSlotsFilled +
    gateBuildFloor.recommended.passiveSlotsFilled +
    (gateBuildFloor.recommended.ultimateRequired ? 1 : 0);

  if (
    currentActiveFilled < gateBuildFloor.minimum.activeSlotsFilled ||
    currentPassiveFilled < gateBuildFloor.minimum.passiveSlotsFilled ||
    (gateBuildFloor.minimum.ultimateRequired && currentUltimateFilled < 1)
  ) {
    shortfalls.push(createShortfall({
      code: 'build_slots',
      severity: 'high',
      label: 'Build slots below gate floor',
      reason: 'The current build has not filled the gate-required technique slots yet.',
      currentValue: currentFilledTotal,
      minimumTarget: minimumFilledTarget,
      recommendedTarget: recommendedFilledTarget,
    }));
  }

  if (currentPathAlignmentScore < gateBuildFloor.minimum.pathAlignmentScore) {
    shortfalls.push(createShortfall({
      code: 'build_alignment',
      severity: 'high',
      label: 'Path alignment below gate floor',
      reason: 'Selected-path technique alignment is below the minimum gate threshold.',
      currentValue: currentPathAlignmentScore,
      minimumTarget: gateBuildFloor.minimum.pathAlignmentScore,
      recommendedTarget: gateBuildFloor.recommended.pathAlignmentScore,
    }));
  } else if (currentPathAlignmentScore < gateBuildFloor.recommended.pathAlignmentScore) {
    shortfalls.push(createShortfall({
      code: 'build_alignment',
      severity: 'medium',
      label: 'Path alignment below gate floor',
      reason: 'Selected-path technique alignment is below the recommended gate threshold.',
      currentValue: currentPathAlignmentScore,
      minimumTarget: gateBuildFloor.minimum.pathAlignmentScore,
      recommendedTarget: gateBuildFloor.recommended.pathAlignmentScore,
    }));
  }

  if (!minimumMasteryMet) {
    shortfalls.push(createShortfall({
      code: 'build_mastery',
      severity: 'high',
      label: 'Technique mastery below gate floor',
      reason: 'The equipped build does not meet the minimum gate mastery targets.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  } else if (!recommendedMasteryMet) {
    shortfalls.push(createShortfall({
      code: 'build_mastery',
      severity: 'medium',
      label: 'Technique mastery below gate floor',
      reason: 'The equipped build meets minimum mastery, but not the recommended gate mastery targets.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  if (currentRankUpTotal < gateBuildFloor.minimum.rankUpTotal) {
    shortfalls.push(createShortfall({
      code: 'build_rank',
      severity: 'high',
      label: 'Technique rank investment below gate floor',
      reason: 'Total rank investment is below the minimum gate target.',
      currentValue: currentRankUpTotal,
      minimumTarget: gateBuildFloor.minimum.rankUpTotal,
      recommendedTarget: gateBuildFloor.recommended.rankUpTotal,
    }));
  } else if (currentRankUpTotal < gateBuildFloor.recommended.rankUpTotal) {
    shortfalls.push(createShortfall({
      code: 'build_rank',
      severity: 'medium',
      label: 'Technique rank investment below gate floor',
      reason: 'Total rank investment is below the recommended gate target.',
      currentValue: currentRankUpTotal,
      minimumTarget: gateBuildFloor.minimum.rankUpTotal,
      recommendedTarget: gateBuildFloor.recommended.rankUpTotal,
    }));
  }

  if (currentRuneCount < gateBuildFloor.minimum.runeCount) {
    shortfalls.push(createShortfall({
      code: 'build_runes',
      severity: 'high',
      label: 'Technique rune investment below gate floor',
      reason: 'Applied technique runes are below the minimum gate target.',
      currentValue: currentRuneCount,
      minimumTarget: gateBuildFloor.minimum.runeCount,
      recommendedTarget: gateBuildFloor.recommended.runeCount,
    }));
  } else if (currentRuneCount < gateBuildFloor.recommended.runeCount) {
    shortfalls.push(createShortfall({
      code: 'build_runes',
      severity: 'medium',
      label: 'Technique rune investment below gate floor',
      reason: 'Applied technique runes are below the recommended gate target.',
      currentValue: currentRuneCount,
      minimumTarget: gateBuildFloor.minimum.runeCount,
      recommendedTarget: gateBuildFloor.recommended.runeCount,
    }));
  }

  return {
    band,
    minimumMet,
    recommendedMet,
    shortfalls,
  };
}

export function evaluateForgeReadiness(input: {
  forgeFloor: ForgeFloorReadModel;
  forgeTargets: GateForgeTargets;
}): ReadinessComponentResult {
  const { forgeFloor, forgeTargets } = input;
  const currentWeaponRefine = forgeFloor.weaponRefineFloor;
  const currentAccessoryRefine = forgeFloor.accessoryRefineFloor;
  const currentTemper = forgeFloor.temperSuccessTotal;
  const currentRuneCount = forgeFloor.runeTotalCount;

  const minimumMet =
    currentWeaponRefine >= forgeTargets.minimum.weaponRefine &&
    currentAccessoryRefine >= forgeTargets.minimum.accessoryRefine &&
    currentTemper >= forgeTargets.minimum.temperSuccesses &&
    currentRuneCount >= forgeTargets.minimum.runeCount;

  const recommendedMet =
    currentWeaponRefine >= forgeTargets.recommended.weaponRefine &&
    currentAccessoryRefine >= forgeTargets.recommended.accessoryRefine &&
    currentTemper >= forgeTargets.recommended.temperSuccesses &&
    currentRuneCount >= forgeTargets.recommended.runeCount;

  const band: ReadinessBand = recommendedMet
    ? 'recommended_met'
    : minimumMet
      ? 'minimum_met_below_recommended'
      : 'below_minimum';

  const shortfalls: ReadinessShortfall[] = [];
  const currentValue = currentWeaponRefine + currentAccessoryRefine + currentTemper + currentRuneCount;
  const minimumTarget =
    forgeTargets.minimum.weaponRefine +
    forgeTargets.minimum.accessoryRefine +
    forgeTargets.minimum.temperSuccesses +
    forgeTargets.minimum.runeCount;
  const recommendedTarget =
    forgeTargets.recommended.weaponRefine +
    forgeTargets.recommended.accessoryRefine +
    forgeTargets.recommended.temperSuccesses +
    forgeTargets.recommended.runeCount;

  if (!recommendedMet) {
    shortfalls.push(createShortfall({
      code: 'forge_floor',
      severity: minimumMet ? 'medium' : 'high',
      label: 'Forge floor below gate target',
      reason: minimumMet
        ? 'Forge progress meets minimum, but not the recommended gate floor.'
        : 'Weapon refine, accessory refine, temper, or crafted rune totals are below the minimum gate floor.',
      currentValue,
      minimumTarget,
      recommendedTarget,
    }));
  }

  return {
    band,
    minimumMet,
    recommendedMet,
    shortfalls,
  };
}

export function evaluateEconomicReadiness(input: {
  band: EconomicReadinessBand;
  shortfalls: EconomicShortfall[];
  majorShortfallCount: number;
}): EconomicReadinessComponentResult {
  const topShortfallIds = input.shortfalls.slice(0, 3).map((shortfall) => shortfall.id);
  const minimumMet = input.band !== 'below_minimum';
  const recommendedMet = input.band === 'recommended_met';
  const shortfalls: ReadinessShortfall[] = [];

  if (input.band === 'minimum_met_below_recommended') {
    shortfalls.push(createShortfall({
      code: 'economic_shortfall',
      severity: 'medium',
      label: 'Economic prep below recommended gate floor',
      reason: 'Recommended prep routes still have open shortfalls.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  if (input.band === 'below_minimum') {
    shortfalls.push(createShortfall({
      code: 'economic_shortfall',
      severity: 'critical',
      label: 'Economic prep below minimum gate floor',
      reason: 'Mandatory consumable, forge, or reserve prep shortfalls remain.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  return {
    band: input.band,
    minimumMet,
    recommendedMet,
    shortfalls,
    majorShortfallCount: input.majorShortfallCount,
    topShortfallIds,
  };
}

export function postureRatingToReadinessBand(rating: CombatPostureRating): ReadinessBand {
  if (rating === 'good') return 'recommended_met';
  if (rating === 'risky') return 'minimum_met_below_recommended';
  return 'below_minimum';
}

export function evaluatePostureReadiness(
  postureFit: CombatPostureFit,
): PostureReadinessComponentResult {
  const minimumMet = postureFit.aiFit !== 'bad' && postureFit.castingFit !== 'bad' && postureFit.pouchFit !== 'bad';
  const recommendedMet = postureFit.aiFit === 'good' && postureFit.castingFit === 'good' && postureFit.pouchFit === 'good';

  const band: ReadinessBand = recommendedMet
    ? 'recommended_met'
    : minimumMet
      ? 'minimum_met_below_recommended'
      : 'below_minimum';

  const shortfalls: ReadinessShortfall[] = [];

  if (postureFit.aiFit !== 'good') {
    shortfalls.push(createShortfall({
      code: 'posture_ai',
      severity: postureFit.aiFit === 'bad' ? 'high' : 'medium',
      label: 'AI posture below gate floor',
      reason: postureFit.aiFit === 'bad'
        ? 'The selected AI profile is a poor fit for the current gate posture.'
        : 'The selected AI profile is only a risky fit for the current gate posture.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  if (postureFit.castingFit !== 'good') {
    shortfalls.push(createShortfall({
      code: 'posture_casting',
      severity: postureFit.castingFit === 'bad' ? 'high' : 'medium',
      label: 'Casting posture below gate floor',
      reason: postureFit.castingFit === 'bad'
        ? 'The selected casting policy is a poor fit for the current gate posture.'
        : 'The selected casting policy is only a risky fit for the current gate posture.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  if (postureFit.pouchFit !== 'good') {
    shortfalls.push(createShortfall({
      code: 'posture_pouch',
      severity: postureFit.pouchFit === 'bad' ? 'high' : 'medium',
      label: 'Medicine pouch posture below gate floor',
      reason: postureFit.pouchFit === 'bad'
        ? 'The current medicine pouch setup is a poor fit for the current gate posture.'
        : 'The current medicine pouch setup is only a risky fit for the current gate posture.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    }));
  }

  return {
    band,
    minimumMet,
    recommendedMet,
    shortfalls,
    warnings: dedupeWarnings(postureFit.warnings),
  };
}

export function evaluateOverallReadinessBand(input: {
  buildBand: ReadinessBand;
  forgeBand: ReadinessBand;
  economicBand: ReadinessBand;
  postureBand: ReadinessBand;
}): ReadinessBand {
  const componentBands = [input.buildBand, input.forgeBand, input.economicBand, input.postureBand];

  if (componentBands.includes('below_minimum')) return 'below_minimum';
  if (componentBands.every((band) => band === 'recommended_met')) return 'recommended_met';
  return 'minimum_met_below_recommended';
}

export function scoreGateReadiness(
  input: GateReadinessInput,
): GateReadinessResult {
  const build = evaluateBuildReadiness({
    gateBuildFloor: input.gateBuildFloor,
    buildAnalysis: input.buildAnalysis,
  });
  const forge = evaluateForgeReadiness({
    forgeFloor: input.forgeFloor,
    forgeTargets: input.forgeTargets,
  });
  const economic = evaluateEconomicReadiness({
    band: input.economicReadinessBand,
    shortfalls: input.economicShortfalls,
    majorShortfallCount: input.economicMajorShortfallCount,
  });
  const posture = evaluatePostureReadiness(input.postureFit);

  const overallBand = evaluateOverallReadinessBand({
    buildBand: build.band,
    forgeBand: forge.band,
    economicBand: economic.band,
    postureBand: posture.band,
  });

  const shortfalls = sortReadinessShortfalls([
    ...build.shortfalls,
    ...forge.shortfalls,
    ...economic.shortfalls,
    ...posture.shortfalls,
  ]);
  const warnings = dedupeWarnings(posture.warnings);

  return {
    trialId: input.trialId,
    build,
    forge,
    economic,
    posture,
    overallBand,
    shortfalls,
    warnings,
  };
}
