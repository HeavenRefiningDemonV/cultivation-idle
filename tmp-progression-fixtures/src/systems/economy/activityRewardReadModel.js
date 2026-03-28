import { getCityRewardRoleProfile, getDeterministicRuinAnchorItemId, getRuinLeadMaterialIds, } from './activityRewardRoles.js';
import { getRuinsDropsConfig } from './activityRewardRuntime.js';
export const OUTSKIRTS_ROLE_TAG = 'Gold & Common Mats';
export const OUTSKIRTS_BEST_USED_WHEN = 'Best used when you need gold, common materials, or low-risk combat reps.';
export const OUTSKIRTS_BOUNDARY_LINE = 'Not the best source for targeted city materials.';
export const RUINS_ROLE_TAG = 'Targeted Mats';
export const RUINS_BEST_USED_WHEN = 'Best used when you need targeted local materials and deterministic support rewards.';
export const RUINS_GOLD_SECONDARY_LINE = 'Gold is secondary here; the run is for targeted local materials and support stability.';
export const OUTSKIRTS_CARD_OUTPUT_HINTS = Object.freeze(['Gold', 'Common Mats']);
export const RUINS_CARD_OUTPUT_HINTS = Object.freeze(['Local Mats', 'Anchor Drop']);
function summarizeRarePity(content) {
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
function toOutskirtsOutputs(outskirts) {
    const profile = getCityRewardRoleProfile(outskirts.cityId);
    return [
        'gold',
        ...profile.commonFieldMaterialIds.slice(0, 3),
        ...profile.outskirtsRareSpikeItemIds.slice(0, 2),
    ];
}
function toRuinsOutputs(ruin) {
    const profile = getCityRewardRoleProfile(ruin.cityId);
    return [
        ...profile.ruinLeadMaterialIds.slice(0, 3),
        profile.deterministicAnchorItemId,
        ...profile.supportItemIds.slice(0, 2),
    ];
}
export function buildOutskirtsActivityRewardReadModel(content, cityId) {
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
export function buildRuinsActivityRewardReadModel(content, cityId) {
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
export function buildCityActivityRewardReadModel(content, cityId) {
    const profile = getCityRewardRoleProfile(cityId);
    return {
        cityId,
        cityIndex: profile.cityIndex,
        outskirts: buildOutskirtsActivityRewardReadModel(content, cityId),
        ruins: buildRuinsActivityRewardReadModel(content, cityId),
    };
}
export function buildAllCityActivityRewardReadModels(content) {
    return content.outskirts
        .map((entry) => entry.cityId)
        .filter((cityId, index, all) => all.indexOf(cityId) === index)
        .map((cityId) => buildCityActivityRewardReadModel(content, cityId))
        .sort((a, b) => a.cityIndex - b.cityIndex);
}
