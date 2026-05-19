export type EconomicProblemKind =
  | 'missingCommonMaterial'
  | 'missingTargetedLocalMaterial'
  | 'belowHealingFloor'
  | 'belowSpecialtyFloor'
  | 'belowCultivationPrepFloor'
  | 'belowMinimumForgeFloor'
  | 'belowRecommendedForgeFloor'
  | 'belowMeritReserve'
  | 'belowSpiritStoneMinimum'
  | 'belowSpiritStoneIdeal'
  | 'missingGatePrepPackage'
  | 'buildCorrectionGap';

export const ECONOMIC_PROBLEM_KINDS = [
  'missingCommonMaterial',
  'missingTargetedLocalMaterial',
  'belowHealingFloor',
  'belowSpecialtyFloor',
  'belowCultivationPrepFloor',
  'belowMinimumForgeFloor',
  'belowRecommendedForgeFloor',
  'belowMeritReserve',
  'belowSpiritStoneMinimum',
  'belowSpiritStoneIdeal',
  'missingGatePrepPackage',
  'buildCorrectionGap',
] as const satisfies readonly EconomicProblemKind[];
