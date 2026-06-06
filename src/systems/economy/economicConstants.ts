import type { CityId, MajorRealmId } from '../progression/contract/contractTypes.js';
import type { CultivationPath } from '../../types/index.js';
import type { LiveWorldModuleKey } from '../../content/types.js';

export type EconomicGateIndex = 1 | 2 | 3 | 4 | 5;
export type EconomicTransitionId =
  | 'qi_condensation_to_foundation'
  | 'foundation_to_core_formation'
  | 'core_formation_to_nascent_soul'
  | 'nascent_soul_to_soul_formation'
  | 'soul_formation_to_spirit_severing';

export interface GoldSpendRange {
  minimum: number;
  recommended: number;
}

export interface EconomicStockLine {
  itemId: string;
  qty: number;
}

export interface EconomicSupplementLane {
  key: string;
  label: string;
  qty: number;
  optionItemIds: readonly string[];
  pathBiasMode?: 'as_applicable';
}

export interface EconomicPrepBackgroundExpectation {
  key:
    | 'expedition_complete'
    | 'ruins_run'
    | 'bounty_claim'
    | 'long_expedition_complete'
    | 'medium_expedition_complete';
  qty: number;
  note?: string;
}

export interface EconomicRuneRecommendation {
  minimum: number;
  recommendedLow: number;
  recommendedHigh: number;
  note: string;
}

export interface EconomicForgeFloorTarget {
  weaponRefine: number;
  accessoryRefine: number;
  temperSuccesses: number;
  runeRecommendation: EconomicRuneRecommendation;
}

export const ECONOMIC_TRANSITION_ORDER = [
  'qi_condensation_to_foundation',
  'foundation_to_core_formation',
  'core_formation_to_nascent_soul',
  'nascent_soul_to_soul_formation',
  'soul_formation_to_spirit_severing',
] as const satisfies readonly EconomicTransitionId[];

export const ECONOMIC_TRANSITION_META: Record<
  EconomicTransitionId,
  {
    gateIndex: EconomicGateIndex;
    contractTransitionId: `${MajorRealmId}_to_${MajorRealmId}`;
    fromRealmId: MajorRealmId;
    toRealmId: MajorRealmId;
    cityId: CityId;
    cityIndex: number;
  }
> = {
  qi_condensation_to_foundation: {
    gateIndex: 1,
    contractTransitionId: 'qi_condensation_to_foundation_establishment',
    fromRealmId: 'qi_condensation',
    toRealmId: 'foundation_establishment',
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
  },
  foundation_to_core_formation: {
    gateIndex: 2,
    contractTransitionId: 'foundation_establishment_to_core_formation',
    fromRealmId: 'foundation_establishment',
    toRealmId: 'core_formation',
    cityId: 'city_stonecrag_town',
    cityIndex: 1,
  },
  core_formation_to_nascent_soul: {
    gateIndex: 3,
    contractTransitionId: 'core_formation_to_nascent_soul',
    fromRealmId: 'core_formation',
    toRealmId: 'nascent_soul',
    cityId: 'city_spirit_cavern_city',
    cityIndex: 2,
  },
  nascent_soul_to_soul_formation: {
    gateIndex: 4,
    contractTransitionId: 'nascent_soul_to_soul_formation',
    fromRealmId: 'nascent_soul',
    toRealmId: 'soul_formation',
    cityId: 'city_lotusford',
    cityIndex: 3,
  },
  soul_formation_to_spirit_severing: {
    gateIndex: 5,
    contractTransitionId: 'soul_formation_to_spirit_severing',
    fromRealmId: 'soul_formation',
    toRealmId: 'spirit_severing',
    cityId: 'city_ironpeak_bastion',
    cityIndex: 4,
  },
};

export const CULTIVATION_PREP_ITEM_BY_CITY_ID: Record<CityId, string> = {
  city_pinewind_hamlet: 'cons_qi_elixir_t1',
  city_stonecrag_town: 'cons_meridian_warmth_draft_t1',
  city_spirit_cavern_city: 'cons_qi_elixir_t2',
  city_lotusford: 'cons_quiet_breath_tea_t1',
  city_ironpeak_bastion: 'cons_mastery_tonic_t1',
};

export const PAVILION_SPEND_CEILING_BY_GATE_INDEX: Record<EconomicGateIndex, number> = {
  1: 1500,
  2: 6000,
  3: 25000,
  4: 90000,
  5: 300000,
};

export const SPIRIT_ROOT_REROLL_SPEND_CEILING_BY_GATE_INDEX: Record<EconomicGateIndex, number> = {
  1: 600,
  2: 3000,
  3: 12000,
  4: 47500,
  5: 160000,
};

export const ECONOMY_FACING_MODULE_KEYS = [
  'outskirts',
  'ruins',
  'trainingHall',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
  'manualPavilion',
  'gateTrial',
] as const satisfies readonly LiveWorldModuleKey[];

export function clampEconomicGateIndex(value: number): EconomicGateIndex {
  const normalized = Math.max(1, Math.min(5, Math.floor(value || 1)));
  return normalized as EconomicGateIndex;
}

export function getEconomicTransitionMeta(transitionId: EconomicTransitionId) {
  return ECONOMIC_TRANSITION_META[transitionId];
}

export function getEconomicTransitionIdByGateIndex(gateIndex: number): EconomicTransitionId {
  return ECONOMIC_TRANSITION_ORDER[clampEconomicGateIndex(gateIndex) - 1];
}

export function getEconomicCultivationPrepItemId(cityId: string | null | undefined): string | null {
  if (!cityId) return null;
  return CULTIVATION_PREP_ITEM_BY_CITY_ID[cityId as CityId] ?? null;
}

export function getHealingFloorTargetByGateIndex(gateIndex: number): number {
  const normalized = clampEconomicGateIndex(gateIndex);
  if (normalized <= 3) return 20;
  return normalized === 4 ? 25 : 30;
}

export function getSpecialtyFloorTargetByGateIndex(gateIndex: number): number {
  const normalized = clampEconomicGateIndex(gateIndex);
  if (normalized === 1) return 0;
  return normalized === 5 ? 6 : 4;
}

export function getCultivationPrepFloorTargetByGateIndex(gateIndex: number): number {
  return clampEconomicGateIndex(gateIndex) === 5 ? 6 : 4;
}

export function getSelectedPathBiasLabel(path: CultivationPath | null | undefined): string | null {
  if (!path) return null;
  return path === 'heaven' ? 'Heaven-biased' : path === 'earth' ? 'Earth-biased' : 'Martial-biased';
}
