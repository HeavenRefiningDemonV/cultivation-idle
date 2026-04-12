import type { OutskirtsDef, RuinDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/validators.js';
import {
  getCityRewardRoleProfile,
  getDeterministicRuinAnchorItemId,
  getRuinLeadMaterialIds,
} from './activityRewardRoles.js';
import { getRuinsDropsConfig } from './activityRewardRuntime.js';
import { COMBAT_TRIO_TRUTH } from '../world/combatTrioTruth.js';

export const OUTSKIRTS_ROLE_TAG = COMBAT_TRIO_TRUTH.outskirts.roleTag;
export const OUTSKIRTS_BEST_USED_WHEN = COMBAT_TRIO_TRUTH.outskirts.bestUsedWhenSentence;
export const OUTSKIRTS_BOUNDARY_LINE = COMBAT_TRIO_TRUTH.outskirts.boundaryLine;

export const RUINS_ROLE_TAG = COMBAT_TRIO_TRUTH.ruins.roleTag;
export const RUINS_BEST_USED_WHEN = COMBAT_TRIO_TRUTH.ruins.bestUsedWhenSentence;
export const RUINS_GOLD_SECONDARY_LINE = COMBAT_TRIO_TRUTH.ruins.boundaryLine;

export interface OutskirtsActivityRewardReadModel {
  cityId: string;
  cityIndex: number;
  activityId: string;
  role: 'outskirts';
  roleTag: typeof OUTSKIRTS_ROLE_TAG;
  bestUsedWhen: typeof OUTSKIRTS_BEST_USED_WHEN;
  keyExpectedOutputs: string[];
  boundaryLine: typeof OUTSKIRTS_BOUNDARY_LINE;
}

export interface RuinsActivityRewardReadModel {
  cityId: string;
  cityIndex: number;
  activityId: string;
  role: 'ruins';
  roleTag: typeof RUINS_ROLE_TAG;
  bestUsedWhen: typeof RUINS_BEST_USED_WHEN;
  roomCount: number;
  leadLocalMaterials: string[];
  deterministicFinalAnchor: string;
  rarePitySummary: string;
  goldIsSecondary: true;
  keyExpectedOutputs: string[];
  boundaryLine: typeof RUINS_GOLD_SECONDARY_LINE;
}

export interface CityActivityRewardReadModel {
  cityId: string;
  cityIndex: number;
  outskirts: OutskirtsActivityRewardReadModel;
  ruins: RuinsActivityRewardReadModel;
}

export const OUTSKIRTS_CARD_OUTPUT_HINTS = Object.freeze(['Gold', 'Common Mats']);
export const RUINS_CARD_OUTPUT_HINTS = Object.freeze(['Local Mats', 'Anchor Drop']);

function summarizeRarePity(content: Pick<ValidatedContent, 'economy'>): string {
  const pity = content.economy?.tuning?.pityDefaults?.ruinsBossChestRare;
  const cap = pity?.pityCap ?? 0;
  const increment = pity?.pityIncrement ?? 0;
  if (cap > 1) {
    return `Rare pity active for ruin boss chests (increment ${increment}, cap ${cap}).`;
  }
  const manualGuarantee = getRuinsDropsConfig(content.economy)?.manualPityRunGuarantee ?? 0;
  if (manualGuarantee > 0) {
    return `Rare pity supported via ruin manual guarantee after ${manualGuarantee} runs.`;
  }
  return 'Rare pity not configured.';
}

function toOutskirtsOutputs(outskirts: OutskirtsDef): string[] {
  const profile = getCityRewardRoleProfile(outskirts.cityId);
  return [
    'gold',
    ...profile.commonFieldMaterialIds.slice(0, 3),
    ...profile.outskirtsRareSpikeItemIds.slice(0, 2),
  ];
}

function toRuinsOutputs(ruin: RuinDef): string[] {
  const profile = getCityRewardRoleProfile(ruin.cityId);
  return [
    ...profile.ruinLeadMaterialIds.slice(0, 3),
    profile.deterministicAnchorItemId,
    ...profile.supportItemIds.slice(0, 2),
  ];
}

export function buildOutskirtsActivityRewardReadModel(
  content: Pick<ValidatedContent, 'outskirts'>,
  cityId: string,
): OutskirtsActivityRewardReadModel {
  const outskirts = content.outskirts.find((entry) => entry.cityId === cityId);
  if (!outskirts) {
    throw new Error(`[ActivityRewardReadModel] Missing outskirts for city ${cityId}`);
  }
  const profile = getCityRewardRoleProfile(cityId);
  return {
    cityId,
    cityIndex: profile.cityIndex,
    activityId: outskirts.id,
    role: 'outskirts',
    roleTag: OUTSKIRTS_ROLE_TAG,
    bestUsedWhen: OUTSKIRTS_BEST_USED_WHEN,
    keyExpectedOutputs: toOutskirtsOutputs(outskirts),
    boundaryLine: OUTSKIRTS_BOUNDARY_LINE,
  };
}

export function buildRuinsActivityRewardReadModel(
  content: Pick<ValidatedContent, 'economy' | 'ruins'>,
  cityId: string,
): RuinsActivityRewardReadModel {
  const ruin = content.ruins.find((entry) => entry.cityId === cityId);
  if (!ruin) {
    throw new Error(`[ActivityRewardReadModel] Missing ruin for city ${cityId}`);
  }
  const profile = getCityRewardRoleProfile(cityId);
  return {
    cityId,
    cityIndex: profile.cityIndex,
    activityId: ruin.id,
    role: 'ruins',
    roleTag: RUINS_ROLE_TAG,
    bestUsedWhen: RUINS_BEST_USED_WHEN,
    roomCount: ruin.roomCount,
    leadLocalMaterials: getRuinLeadMaterialIds(cityId),
    deterministicFinalAnchor: getDeterministicRuinAnchorItemId(cityId),
    rarePitySummary: summarizeRarePity(content),
    goldIsSecondary: true,
    keyExpectedOutputs: toRuinsOutputs(ruin),
    boundaryLine: RUINS_GOLD_SECONDARY_LINE,
  };
}

export function buildCityActivityRewardReadModel(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
  cityId: string,
): CityActivityRewardReadModel {
  const profile = getCityRewardRoleProfile(cityId);
  return {
    cityId,
    cityIndex: profile.cityIndex,
    outskirts: buildOutskirtsActivityRewardReadModel(content, cityId),
    ruins: buildRuinsActivityRewardReadModel(content, cityId),
  };
}

export function buildAllCityActivityRewardReadModels(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
): CityActivityRewardReadModel[] {
  return content.outskirts
    .map((entry) => entry.cityId)
    .filter((cityId, index, all) => all.indexOf(cityId) === index)
    .map((cityId) => buildCityActivityRewardReadModel(content, cityId))
    .sort((a, b) => a.cityIndex - b.cityIndex);
}
