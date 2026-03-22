import type { LiveWorldModuleKey } from '../../content/types.js';
import type { EconomicProblemKind } from './economicProblemKinds.js';

export type EconomicDestinationFamily =
  | 'outskirts'
  | 'ruins'
  | 'apothecary_buy'
  | 'apothecary_brew'
  | 'forge'
  | 'bounties'
  | 'expeditions'
  | 'manual_pavilion'
  | 'gate_trial';

export interface ProblemDestinationPolicy {
  problemKind: EconomicProblemKind;
  primaryDestinations: readonly EconomicDestinationFamily[];
  secondaryDestinations: readonly EconomicDestinationFamily[];
  primaryModuleKeys: readonly LiveWorldModuleKey[];
  secondaryModuleKeys: readonly LiveWorldModuleKey[];
}

export const PROBLEM_DESTINATION_POLICIES: readonly ProblemDestinationPolicy[] = [
  {
    problemKind: 'missingCommonMaterial',
    primaryDestinations: ['outskirts'],
    secondaryDestinations: ['expeditions'],
    primaryModuleKeys: ['outskirts'],
    secondaryModuleKeys: ['expeditions'],
  },
  {
    problemKind: 'missingTargetedLocalMaterial',
    primaryDestinations: ['ruins'],
    secondaryDestinations: ['expeditions', 'outskirts'],
    primaryModuleKeys: ['ruins'],
    secondaryModuleKeys: ['expeditions', 'outskirts'],
  },
  {
    problemKind: 'belowHealingFloor',
    primaryDestinations: ['apothecary_buy'],
    secondaryDestinations: ['apothecary_brew', 'outskirts', 'expeditions'],
    primaryModuleKeys: ['apothecary'],
    secondaryModuleKeys: ['apothecary', 'outskirts', 'expeditions'],
  },
  {
    problemKind: 'belowSpecialtyFloor',
    primaryDestinations: ['apothecary_buy'],
    secondaryDestinations: ['apothecary_brew', 'ruins', 'expeditions'],
    primaryModuleKeys: ['apothecary'],
    secondaryModuleKeys: ['apothecary', 'ruins', 'expeditions'],
  },
  {
    problemKind: 'belowCultivationPrepFloor',
    primaryDestinations: ['apothecary_buy'],
    secondaryDestinations: ['apothecary_brew', 'expeditions', 'outskirts'],
    primaryModuleKeys: ['apothecary'],
    secondaryModuleKeys: ['apothecary', 'expeditions', 'outskirts'],
  },
  {
    problemKind: 'belowMinimumForgeFloor',
    primaryDestinations: ['forge'],
    secondaryDestinations: ['ruins', 'outskirts', 'expeditions'],
    primaryModuleKeys: ['forge'],
    secondaryModuleKeys: ['ruins', 'outskirts', 'expeditions'],
  },
  {
    problemKind: 'belowRecommendedForgeFloor',
    primaryDestinations: ['forge'],
    secondaryDestinations: ['ruins', 'outskirts', 'expeditions'],
    primaryModuleKeys: ['forge'],
    secondaryModuleKeys: ['ruins', 'outskirts', 'expeditions'],
  },
  {
    problemKind: 'belowMeritReserve',
    primaryDestinations: ['bounties'],
    secondaryDestinations: ['gate_trial'],
    primaryModuleKeys: ['bounties'],
    secondaryModuleKeys: ['gateTrial'],
  },
  {
    problemKind: 'belowSpiritStoneMinimum',
    primaryDestinations: ['bounties'],
    secondaryDestinations: ['gate_trial'],
    primaryModuleKeys: ['bounties'],
    secondaryModuleKeys: ['gateTrial'],
  },
  {
    problemKind: 'belowSpiritStoneIdeal',
    primaryDestinations: ['bounties'],
    secondaryDestinations: ['gate_trial'],
    primaryModuleKeys: ['bounties'],
    secondaryModuleKeys: ['gateTrial'],
  },
  {
    problemKind: 'missingGatePrepPackage',
    primaryDestinations: ['apothecary_buy', 'apothecary_brew'],
    secondaryDestinations: ['forge', 'ruins', 'outskirts', 'expeditions'],
    primaryModuleKeys: ['apothecary'],
    secondaryModuleKeys: ['forge', 'ruins', 'outskirts', 'expeditions'],
  },
  {
    problemKind: 'buildCorrectionGap',
    primaryDestinations: ['manual_pavilion'],
    secondaryDestinations: ['expeditions', 'ruins'],
    primaryModuleKeys: ['manualPavilion'],
    secondaryModuleKeys: ['expeditions', 'ruins'],
  },
] as const satisfies readonly ProblemDestinationPolicy[];

const POLICY_BY_KIND = Object.fromEntries(
  PROBLEM_DESTINATION_POLICIES.map((policy) => [policy.problemKind, policy]),
) as Record<EconomicProblemKind, ProblemDestinationPolicy>;

export function getProblemDestinationPolicy(problemKind: EconomicProblemKind): ProblemDestinationPolicy {
  return POLICY_BY_KIND[problemKind];
}

export function getAllProblemDestinationPolicies(): ProblemDestinationPolicy[] {
  return [...PROBLEM_DESTINATION_POLICIES];
}
