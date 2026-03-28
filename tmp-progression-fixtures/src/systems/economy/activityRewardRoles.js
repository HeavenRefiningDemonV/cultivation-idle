import { CITY_PACKAGE_REGISTRY } from '../world/cityPackageRegistry.js';
const ROLE_PROFILES = [
    {
        cityId: 'city_pinewind_hamlet',
        cityIndex: 0,
        commonFieldMaterialIds: ['mat_common_herb_bundle', 'mat_beast_blood', 'mat_beast_bone', 'mat_low_grade_ore'],
        targetedMaterialIds: ['mat_spirit_leaf'],
        deterministicAnchorItemId: 'mat_core_fragment',
        ruinLeadMaterialIds: ['mat_spirit_leaf', 'mat_beast_bone', 'mat_beast_blood'],
        outskirtsRareSpikeItemIds: ['mat_spirit_leaf', 'mat_spirit_dew'],
        supportItemIds: ['mat_spirit_dew'],
    },
    {
        cityId: 'city_stonecrag_town',
        cityIndex: 1,
        commonFieldMaterialIds: ['mat_stone_chunk', 'mat_iron_sand', 'mat_fire_ash', 'mat_beast_bone', 'mat_low_grade_ore'],
        targetedMaterialIds: ['mat_quarry_ore', 'mat_earth_essence'],
        deterministicAnchorItemId: 'frag_manual_mortal',
        ruinLeadMaterialIds: ['mat_quarry_ore', 'mat_iron_sand', 'mat_earth_essence'],
        outskirtsRareSpikeItemIds: ['mat_quarry_ore', 'mat_earth_essence'],
        supportItemIds: ['frag_manual_mortal'],
    },
    {
        cityId: 'city_spirit_cavern_city',
        cityIndex: 2,
        commonFieldMaterialIds: ['mat_spirit_stone_chunk', 'mat_stone_chunk', 'mat_low_grade_ore', 'mat_beast_bone'],
        targetedMaterialIds: ['mat_crystal_shard', 'mat_aura_residue'],
        deterministicAnchorItemId: 'mat_core_fragment',
        ruinLeadMaterialIds: ['mat_crystal_shard', 'mat_aura_residue', 'mat_core_fragment'],
        outskirtsRareSpikeItemIds: ['mat_crystal_shard', 'mat_aura_residue'],
        supportItemIds: ['mat_rune_dust', 'mat_artifact_shard'],
    },
    {
        cityId: 'city_lotusford',
        cityIndex: 3,
        commonFieldMaterialIds: ['mat_venom_sac', 'mat_common_herb_bundle', 'mat_spirit_dew', 'mat_beast_blood'],
        targetedMaterialIds: ['mat_lotus_pollen', 'mat_mist_pearl', 'mat_soul_ember', 'mat_seed_ancient'],
        deterministicAnchorItemId: 'frag_manual_mortal',
        ruinLeadMaterialIds: ['mat_lotus_pollen', 'mat_mist_pearl', 'mat_soul_ember'],
        outskirtsRareSpikeItemIds: ['mat_lotus_pollen', 'mat_mist_pearl', 'mat_soul_ember'],
        supportItemIds: ['mat_rune_dust', 'mat_seed_ancient', 'frag_manual_mortal'],
    },
    {
        cityId: 'city_ironpeak_bastion',
        cityIndex: 4,
        commonFieldMaterialIds: ['mat_iron_sand', 'mat_fire_ash', 'mat_stone_chunk', 'mat_low_grade_ore'],
        targetedMaterialIds: ['mat_spirit_steel_ore', 'mat_blade_core', 'mat_furnace_cinder', 'mat_thunder_sand', 'mat_artifact_shard'],
        deterministicAnchorItemId: 'mat_artifact_shard',
        ruinLeadMaterialIds: ['mat_spirit_steel_ore', 'mat_blade_core', 'mat_furnace_cinder'],
        outskirtsRareSpikeItemIds: ['mat_spirit_steel_ore', 'mat_furnace_cinder', 'mat_blade_core'],
        supportItemIds: ['mat_rune_dust', 'mat_thunder_sand'],
    },
];
export const CITY_ACTIVITY_REWARD_ROLE_PROFILES = ROLE_PROFILES;
export const CITY_ACTIVITY_REWARD_ROLE_PROFILES_BY_ID = Object.fromEntries(ROLE_PROFILES.map((profile) => [profile.cityId, profile]));
export function listCityRewardRoleProfiles() {
    return CITY_PACKAGE_REGISTRY.map((entry) => CITY_ACTIVITY_REWARD_ROLE_PROFILES_BY_ID[entry.cityId]).filter((profile) => Boolean(profile));
}
export function getCityRewardRoleProfile(cityId) {
    const profile = CITY_ACTIVITY_REWARD_ROLE_PROFILES_BY_ID[cityId];
    if (!profile) {
        throw new Error(`[ActivityRewardRoles] Missing reward role profile for city ${cityId}`);
    }
    return profile;
}
export function getDeterministicRuinAnchorItemId(cityId) {
    return getCityRewardRoleProfile(cityId).deterministicAnchorItemId;
}
export function getRuinLeadMaterialIds(cityId) {
    return [...getCityRewardRoleProfile(cityId).ruinLeadMaterialIds];
}
export function getTargetedCityMaterialIds(cityId) {
    return [...getCityRewardRoleProfile(cityId).targetedMaterialIds];
}
export function getCommonFieldMaterialIds(cityId) {
    return [...getCityRewardRoleProfile(cityId).commonFieldMaterialIds];
}
export function getOutskirtsRareSpikeItemIds(cityId) {
    return [...getCityRewardRoleProfile(cityId).outskirtsRareSpikeItemIds];
}
export function getActivityRewardIntent(activity) {
    return activity === 'outskirts'
        ? 'gold + common materials + light support rewards'
        : 'targeted local materials + deterministic anchors + anti-drought support';
}
export function isDeterministicRuinAnchor(cityId, itemId) {
    return getDeterministicRuinAnchorItemId(cityId) === itemId;
}
export function isTargetedCityMaterial(cityId, itemId) {
    return getCityRewardRoleProfile(cityId).targetedMaterialIds.includes(itemId);
}
export function isCommonFieldMaterial(cityId, itemId) {
    return getCityRewardRoleProfile(cityId).commonFieldMaterialIds.includes(itemId);
}
export function isOutskirtsRareSpike(cityId, itemId) {
    return getCityRewardRoleProfile(cityId).outskirtsRareSpikeItemIds.includes(itemId);
}
export function isRuinLeadMaterial(cityId, itemId) {
    return getCityRewardRoleProfile(cityId).ruinLeadMaterialIds.includes(itemId);
}
export function isRoleSupportItem(cityId, itemId) {
    return getCityRewardRoleProfile(cityId).supportItemIds.includes(itemId);
}
export function classifyActivityRewardItem(cityId, itemId) {
    if (isDeterministicRuinAnchor(cityId, itemId))
        return 'anchor';
    if (isTargetedCityMaterial(cityId, itemId))
        return 'targeted_local';
    if (isCommonFieldMaterial(cityId, itemId))
        return 'common_field';
    if (isRoleSupportItem(cityId, itemId))
        return 'support';
    return 'other';
}
