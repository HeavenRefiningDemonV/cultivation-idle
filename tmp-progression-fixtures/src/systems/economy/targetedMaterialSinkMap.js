export const TARGETED_MATERIAL_IDS = [
    'mat_spirit_dew',
    'mat_quarry_ore',
    'mat_iron_sand',
    'mat_earth_essence',
    'mat_fire_ash',
    'mat_core_fragment',
    'mat_crystal_shard',
    'mat_aura_residue',
    'mat_spirit_stone_chunk',
    'mat_lotus_pollen',
    'mat_venom_sac',
    'mat_mist_pearl',
    'mat_soul_ember',
    'mat_seed_ancient',
    'mat_spirit_steel_ore',
    'mat_blade_core',
    'mat_furnace_cinder',
    'mat_thunder_sand',
    'mat_artifact_shard',
];
export const TARGETED_MATERIAL_SINK_MAP = [
    {
        materialId: 'mat_spirit_dew',
        cityId: 'city_pinewind_hamlet',
        primarySinkIds: ['forge_temper_accessory_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_quarry_ore',
        cityId: 'city_stonecrag_town',
        primarySinkIds: ['forge_refine_advanced', 'forge_refine_common_t2'],
        secondarySinkIds: ['alc_reagent_quenching_oil_t1'],
    },
    {
        materialId: 'mat_iron_sand',
        cityId: 'city_stonecrag_town',
        primarySinkIds: ['alc_windstep_powder_t1', 'forge_rune_shatter_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_earth_essence',
        cityId: 'city_stonecrag_town',
        primarySinkIds: ['alc_ward_salt_t1', 'alc_meridian_warmth_draft_t1', 'forge_rune_fortify_t1'],
        secondarySinkIds: ['alc_ward_salt_t2'],
    },
    {
        materialId: 'mat_fire_ash',
        cityId: 'city_stonecrag_town',
        primarySinkIds: ['alc_reagent_quenching_oil_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_core_fragment',
        cityId: 'city_spirit_cavern_city',
        primarySinkIds: ['alc_qi_elixir_t2', 'forge_rune_astral_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_crystal_shard',
        cityId: 'city_spirit_cavern_city',
        primarySinkIds: ['forge_refine_uncommon_t3'],
        secondarySinkIds: ['forge_temper_weapon_t2'],
    },
    {
        materialId: 'mat_aura_residue',
        cityId: 'city_spirit_cavern_city',
        primarySinkIds: ['alc_focus_tonic_t1', 'alc_reagent_soul_ink_t1', 'forge_rune_ward_t1'],
        secondarySinkIds: ['alc_reagent_soul_ink_t2'],
    },
    {
        materialId: 'mat_spirit_stone_chunk',
        cityId: 'city_spirit_cavern_city',
        primarySinkIds: ['alc_focus_tonic_t1'],
        secondarySinkIds: ['alc_mastery_tonic_t1'],
    },
    {
        materialId: 'mat_lotus_pollen',
        cityId: 'city_lotusford',
        primarySinkIds: ['alc_anti_venom_pellet_t1', 'alc_purity_elixir_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_venom_sac',
        cityId: 'city_lotusford',
        primarySinkIds: ['alc_anti_venom_pellet_t1', 'forge_rune_venom_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_mist_pearl',
        cityId: 'city_lotusford',
        primarySinkIds: ['alc_quiet_breath_tea_t1', 'forge_rune_mist_t1', 'forge_refine_rare_t4'],
        secondarySinkIds: ['alc_windstep_powder_t2'],
    },
    {
        materialId: 'mat_soul_ember',
        cityId: 'city_lotusford',
        primarySinkIds: ['alc_reagent_soul_ink_t2'],
        secondarySinkIds: ['forge_temper_accessory_t2'],
    },
    {
        materialId: 'mat_seed_ancient',
        cityId: 'city_lotusford',
        primarySinkIds: ['alc_purity_elixir_t1'],
        secondarySinkIds: [],
    },
    {
        materialId: 'mat_spirit_steel_ore',
        cityId: 'city_ironpeak_bastion',
        primarySinkIds: ['forge_refine_legendary_t5', 'forge_temper_weapon_t3'],
        secondarySinkIds: ['forge_temper_accessory_t3'],
    },
    {
        materialId: 'mat_blade_core',
        cityId: 'city_ironpeak_bastion',
        primarySinkIds: ['forge_temper_weapon_t3'],
        secondarySinkIds: ['alc_ironblood_pellet_t2'],
    },
    {
        materialId: 'mat_furnace_cinder',
        cityId: 'city_ironpeak_bastion',
        primarySinkIds: ['alc_reagent_quenching_oil_t2'],
        secondarySinkIds: ['forge_temper_accessory_t3', 'alc_ward_salt_t2'],
    },
    {
        materialId: 'mat_thunder_sand',
        cityId: 'city_ironpeak_bastion',
        primarySinkIds: ['alc_windstep_powder_t2', 'alc_reagent_quenching_oil_t2'],
        secondarySinkIds: ['forge_temper_weapon_t3', 'forge_temper_accessory_t3'],
    },
    {
        materialId: 'mat_artifact_shard',
        cityId: 'city_spirit_cavern_city',
        primarySinkIds: ['forge_refine_uncommon_t3', 'forge_refine_rare_t4', 'forge_refine_legendary_t5'],
        secondarySinkIds: ['forge_temper_weapon_t2', 'forge_temper_accessory_t2', 'forge_temper_weapon_t3', 'forge_temper_accessory_t3'],
    },
];
const TARGETED_MATERIAL_SINK_MAP_BY_ID = Object.fromEntries(TARGETED_MATERIAL_SINK_MAP.map((entry) => [entry.materialId, entry]));
export function getTargetedMaterialSinkMapEntry(materialId) {
    return TARGETED_MATERIAL_SINK_MAP_BY_ID[materialId];
}
export function listTargetedMaterialSinkMap() {
    return [...TARGETED_MATERIAL_SINK_MAP];
}
