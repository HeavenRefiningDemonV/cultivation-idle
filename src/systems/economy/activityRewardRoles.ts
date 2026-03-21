import { CITY_PACKAGE_REGISTRY } from '../world/cityPackageRegistry.js';

export type ActivityRewardSource = 'outskirts' | 'ruins';

export interface CityActivityRewardRoleProfile {
  cityId: string;
  cityIndex: number;
  outskirtsCommonFieldMaterialIds: string[];
  outskirtsSupportItemIds: string[];
  outskirtsTargetedSpikeItemIds: string[];
  ruinsLeadMaterialIds: string[];
  ruinsSupportItemIds: string[];
  ruinsAnchorItemId: string;
}

export const CITY_ACTIVITY_REWARD_ROLE_PROFILES: readonly CityActivityRewardRoleProfile[] = [
  {
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    outskirtsCommonFieldMaterialIds: ['mat_common_herb_bundle', 'mat_beast_blood', 'mat_beast_bone', 'mat_low_grade_ore', 'mat_stone_chunk'],
    outskirtsSupportItemIds: ['crate_manual_scraps'],
    outskirtsTargetedSpikeItemIds: ['mat_spirit_leaf', 'mat_spirit_dew'],
    ruinsLeadMaterialIds: ['mat_spirit_leaf', 'mat_beast_blood', 'mat_beast_bone'],
    ruinsSupportItemIds: ['mat_spirit_dew'],
    ruinsAnchorItemId: 'mat_core_fragment',
  },
  {
    cityId: 'city_stonecrag_town',
    cityIndex: 1,
    outskirtsCommonFieldMaterialIds: ['mat_stone_chunk', 'mat_fire_ash', 'mat_beast_bone', 'mat_low_grade_ore', 'mat_common_herb_bundle'],
    outskirtsSupportItemIds: ['crate_manual_scraps'],
    outskirtsTargetedSpikeItemIds: ['mat_quarry_ore', 'mat_iron_sand', 'mat_earth_essence'],
    ruinsLeadMaterialIds: ['mat_quarry_ore', 'mat_iron_sand', 'mat_stone_chunk'],
    ruinsSupportItemIds: ['mat_fire_ash'],
    ruinsAnchorItemId: 'frag_manual_mortal',
  },
  {
    cityId: 'city_spirit_cavern_city',
    cityIndex: 2,
    outskirtsCommonFieldMaterialIds: ['mat_spirit_stone_chunk', 'mat_rune_dust', 'mat_stone_chunk', 'mat_low_grade_ore', 'mat_fire_ash'],
    outskirtsSupportItemIds: ['crate_manual_scraps'],
    outskirtsTargetedSpikeItemIds: ['mat_crystal_shard', 'mat_aura_residue', 'mat_artifact_shard'],
    ruinsLeadMaterialIds: ['mat_crystal_shard', 'mat_aura_residue', 'mat_spirit_stone_chunk'],
    ruinsSupportItemIds: ['mat_rune_dust', 'mat_artifact_shard'],
    ruinsAnchorItemId: 'mat_core_fragment',
  },
  {
    cityId: 'city_lotusford',
    cityIndex: 3,
    outskirtsCommonFieldMaterialIds: ['mat_common_herb_bundle', 'mat_beast_blood', 'mat_beast_bone', 'mat_rune_dust', 'mat_spirit_stone_chunk'],
    outskirtsSupportItemIds: ['crate_manual_scraps'],
    outskirtsTargetedSpikeItemIds: ['mat_lotus_pollen', 'mat_mist_pearl', 'mat_venom_sac', 'mat_soul_ember', 'mat_seed_ancient'],
    ruinsLeadMaterialIds: ['mat_lotus_pollen', 'mat_mist_pearl', 'mat_soul_ember'],
    ruinsSupportItemIds: ['mat_venom_sac'],
    ruinsAnchorItemId: 'frag_manual_mortal',
  },
  {
    cityId: 'city_ironpeak_bastion',
    cityIndex: 4,
    outskirtsCommonFieldMaterialIds: ['mat_stone_chunk', 'mat_low_grade_ore', 'mat_fire_ash', 'mat_iron_sand', 'mat_rune_dust'],
    outskirtsSupportItemIds: ['crate_manual_scraps'],
    outskirtsTargetedSpikeItemIds: ['mat_spirit_steel_ore', 'mat_blade_core', 'mat_furnace_cinder', 'mat_thunder_sand', 'mat_artifact_shard'],
    ruinsLeadMaterialIds: ['mat_spirit_steel_ore', 'mat_blade_core', 'mat_furnace_cinder'],
    ruinsSupportItemIds: ['mat_iron_sand', 'mat_rune_dust', 'mat_thunder_sand'],
    ruinsAnchorItemId: 'mat_artifact_shard',
  },
] as const;

export const CITY_ACTIVITY_REWARD_ROLE_PROFILE_BY_ID = Object.fromEntries(
  CITY_ACTIVITY_REWARD_ROLE_PROFILES.map((profile) => [profile.cityId, profile]),
) as Record<string, CityActivityRewardRoleProfile>;

export function getCityActivityRewardRoleProfile(cityId: string): CityActivityRewardRoleProfile | null {
  return CITY_ACTIVITY_REWARD_ROLE_PROFILE_BY_ID[cityId] ?? null;
}

export function getActivityRewardRoleCityIds(): string[] {
  return CITY_PACKAGE_REGISTRY.map((entry) => entry.cityId);
}

export function isOutskirtsCommonFieldMaterial(cityId: string, itemId: string): boolean {
  return getCityActivityRewardRoleProfile(cityId)?.outskirtsCommonFieldMaterialIds.includes(itemId) ?? false;
}

export function isOutskirtsTargetedSpike(cityId: string, itemId: string): boolean {
  return getCityActivityRewardRoleProfile(cityId)?.outskirtsTargetedSpikeItemIds.includes(itemId) ?? false;
}

export function isRuinsLeadMaterial(cityId: string, itemId: string): boolean {
  return getCityActivityRewardRoleProfile(cityId)?.ruinsLeadMaterialIds.includes(itemId) ?? false;
}

export function isRuinsSupportItem(cityId: string, itemId: string): boolean {
  return getCityActivityRewardRoleProfile(cityId)?.ruinsSupportItemIds.includes(itemId) ?? false;
}

export function isRuinsAnchorItem(cityId: string, itemId: string): boolean {
  return getCityActivityRewardRoleProfile(cityId)?.ruinsAnchorItemId === itemId;
}

export function isProtectedRuinsIdentityItem(cityId: string, itemId: string): boolean {
  return isRuinsAnchorItem(cityId, itemId) || isRuinsLeadMaterial(cityId, itemId);
}
