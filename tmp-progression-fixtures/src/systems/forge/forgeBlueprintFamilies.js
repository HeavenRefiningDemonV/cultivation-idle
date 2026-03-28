export const LIVE_FORGE_FAMILY_LABELS = {
    refine: 'Refine',
    temper: 'Temper',
    runes: 'Runes',
};
export const LIVE_REFINE_LADDER_IDS = [
    'forge_refine_rusty_t1',
    'forge_refine_basic',
    'forge_refine_advanced',
    'forge_refine_common_t2',
    'forge_refine_uncommon_t3',
    'forge_refine_rare_t4',
    'forge_refine_legendary_t5',
];
export const LIVE_TEMPER_LADDER_IDS = [
    'forge_temper_weapon_t1',
    'forge_temper_accessory_t1',
    'forge_temper_weapon_t2',
    'forge_temper_accessory_t2',
    'forge_temper_weapon_t3',
    'forge_temper_accessory_t3',
];
export const LIVE_RUNE_LADDER_IDS = [
    'forge_rune_ember_t1',
    'forge_rune_stone_t1',
    'forge_rune_fortify_t1',
    'forge_rune_shatter_t1',
    'forge_rune_astral_t1',
    'forge_rune_ward_t1',
    'forge_rune_venom_t1',
    'forge_rune_mist_t1',
    'forge_rune_edge_t1',
    'forge_rune_storm_t1',
];
export const LEGACY_RUNE_BLUEPRINT_IDS = ['rune_inscription_basic', 'rune_inscription_advanced'];
export const DEFERRED_FORGE_BLUEPRINT_IDS = [
    'formation_plate_basic',
    'forge_jade_core_shell_t1',
    'forge_jade_core_upgrade_t2',
    'forge_jade_core_upgrade_t3',
];
export const LIVE_FORGE_BLUEPRINT_IDS = [
    ...LIVE_REFINE_LADDER_IDS,
    ...LIVE_TEMPER_LADDER_IDS,
    ...LIVE_RUNE_LADDER_IDS,
];
export const LIVE_FORGE_BLUEPRINT_ID_SET = new Set(LIVE_FORGE_BLUEPRINT_IDS);
export const LIVE_REFINE_LADDER_ID_SET = new Set(LIVE_REFINE_LADDER_IDS);
export const LIVE_TEMPER_LADDER_ID_SET = new Set(LIVE_TEMPER_LADDER_IDS);
export const LIVE_RUNE_LADDER_ID_SET = new Set(LIVE_RUNE_LADDER_IDS);
export const LEGACY_RUNE_BLUEPRINT_ID_SET = new Set(LEGACY_RUNE_BLUEPRINT_IDS);
export const DEFERRED_FORGE_BLUEPRINT_ID_SET = new Set(DEFERRED_FORGE_BLUEPRINT_IDS);
export const LIVE_RUNE_CITY_PAIRS = {
    city_pinewind_hamlet: ['forge_rune_ember_t1', 'forge_rune_stone_t1'],
    city_stonecrag_town: ['forge_rune_fortify_t1', 'forge_rune_shatter_t1'],
    city_spirit_cavern_city: ['forge_rune_astral_t1', 'forge_rune_ward_t1'],
    city_lotusford: ['forge_rune_venom_t1', 'forge_rune_mist_t1'],
    city_ironpeak_bastion: ['forge_rune_edge_t1', 'forge_rune_storm_t1'],
};
export function getLiveForgeFamilyByBlueprintId(blueprintId) {
    if (LIVE_REFINE_LADDER_ID_SET.has(blueprintId))
        return 'refine';
    if (LIVE_TEMPER_LADDER_ID_SET.has(blueprintId))
        return 'temper';
    if (LIVE_RUNE_LADDER_ID_SET.has(blueprintId))
        return 'runes';
    return 'hidden-other';
}
export function getLiveForgeRuntimeStatusByBlueprintId(blueprintId) {
    if (LIVE_FORGE_BLUEPRINT_ID_SET.has(blueprintId))
        return 'visible_live';
    if (LEGACY_RUNE_BLUEPRINT_ID_SET.has(blueprintId))
        return 'migration_refund_only';
    if (DEFERRED_FORGE_BLUEPRINT_ID_SET.has(blueprintId))
        return 'hidden_deferred';
    return 'unknown_invalid';
}
export function isCanonicalLiveForgeBlueprintId(blueprintId) {
    return LIVE_FORGE_BLUEPRINT_ID_SET.has(blueprintId);
}
export function getLiveForgeFamily(blueprint) {
    return getLiveForgeFamilyByBlueprintId(blueprint.id);
}
export function getLiveForgeRuntimeStatus(blueprint) {
    return getLiveForgeRuntimeStatusByBlueprintId(blueprint.id);
}
