import { classifyActivityRewardItem, getCityRewardRoleProfile, getDeterministicRuinAnchorItemId, getRuinLeadMaterialIds, getTargetedCityMaterialIds, isCommonFieldMaterial, isDeterministicRuinAnchor, isOutskirtsRareSpike, isRuinLeadMaterial, isTargetedCityMaterial, } from './activityRewardRoles.js';
import { getOutskirtsDropsConfig, getRuinsDropsConfig } from './activityRewardRuntime.js';
function averageRange(range) {
    if (!range)
        return 0;
    return (Number(range[0] ?? 0) + Number(range[1] ?? 0)) / 2;
}
function valueByIndex(source, index) {
    if (Array.isArray(source))
        return source[index] ?? source[source.length - 1];
    if (source && typeof source === 'object') {
        return source[index] ?? Object.values(source).at(-1);
    }
    return undefined;
}
export function inspectOutskirtsRewardRole(outskirts, economy) {
    const profile = getCityRewardRoleProfile(outskirts.cityId);
    const commonPool = [...(outskirts.matPools?.common ?? [])];
    const rarePool = [...(outskirts.matPools?.rare ?? [])];
    const drops = getOutskirtsDropsConfig(economy);
    const mobGold = averageRange(valueByIndex(drops?.mobGoldByCityIndex, profile.cityIndex));
    const bossGold = averageRange(valueByIndex(drops?.bossGoldByCityIndex, profile.cityIndex));
    const allItems = Array.from(new Set([...commonPool, ...rarePool]));
    return {
        cityId: outskirts.cityId,
        cityIndex: profile.cityIndex,
        commonPool,
        rarePool,
        goldPosture: mobGold > 0 || bossGold > 0 ? 'primary' : 'missing',
        commonFieldHits: commonPool.filter((itemId) => isCommonFieldMaterial(outskirts.cityId, itemId)),
        targetedLeakageInCommon: commonPool.filter((itemId) => isTargetedCityMaterial(outskirts.cityId, itemId) || isDeterministicRuinAnchor(outskirts.cityId, itemId)),
        targetedRareSpikes: rarePool.filter((itemId) => isOutskirtsRareSpike(outskirts.cityId, itemId) || isTargetedCityMaterial(outskirts.cityId, itemId)),
        anchorLeakage: allItems.filter((itemId) => isDeterministicRuinAnchor(outskirts.cityId, itemId)),
        localFlavorItems: allItems.filter((itemId) => classifyActivityRewardItem(outskirts.cityId, itemId) !== 'other'),
    };
}
export function inspectRuinsRewardRole(ruin, economy) {
    const profile = getCityRewardRoleProfile(ruin.cityId);
    const guaranteedAnchors = (ruin.finalChestDrops.guaranteed ?? []).map((entry) => entry.itemId);
    const roomItems = ruin.dropsPerRoom.pool.map((entry) => entry.itemId);
    const chestItems = ruin.finalChestDrops.pool.map((entry) => entry.itemId);
    const drops = getRuinsDropsConfig(economy);
    const roomGold = averageRange([ruin.dropsPerRoom.goldMin ?? 0, ruin.dropsPerRoom.goldMax ?? 0]);
    const chestGold = averageRange([ruin.finalChestDrops.goldMin ?? 0, ruin.finalChestDrops.goldMax ?? 0]);
    const runeDustBonus = averageRange(valueByIndex(drops?.finalChestRuneDustRangeByCityIndex, profile.cityIndex));
    const artifactBonus = averageRange(valueByIndex(drops?.finalChestArtifactShardsRangeByCityIndex, profile.cityIndex));
    return {
        cityId: ruin.cityId,
        cityIndex: profile.cityIndex,
        deterministicAnchorItemId: getDeterministicRuinAnchorItemId(ruin.cityId),
        guaranteedAnchors,
        hasDeterministicAnchor: guaranteedAnchors.includes(getDeterministicRuinAnchorItemId(ruin.cityId)),
        leadMaterialsInRooms: roomItems.filter((itemId) => isRuinLeadMaterial(ruin.cityId, itemId)),
        leadMaterialsInChest: chestItems.filter((itemId) => isRuinLeadMaterial(ruin.cityId, itemId)),
        targetedMaterialsInRooms: roomItems.filter((itemId) => isTargetedCityMaterial(ruin.cityId, itemId)),
        targetedMaterialsInChest: chestItems.filter((itemId) => isTargetedCityMaterial(ruin.cityId, itemId) || isDeterministicRuinAnchor(ruin.cityId, itemId)),
        supportItemsInChest: chestItems.filter((itemId) => classifyActivityRewardItem(ruin.cityId, itemId) === 'support'),
        goldPosture: roomGold > 0 || chestGold > 0 || runeDustBonus > 0 || artifactBonus > 0 ? 'secondary' : 'missing',
        rarePityConfigured: Boolean((economy?.tuning?.pityDefaults?.ruinsBossChestRare?.pityCap ?? 0) > 1),
        bonusBundleAdditiveToAnchor: runeDustBonus > 0 || artifactBonus > 0,
    };
}
export function buildActivityRewardAuditReport(content) {
    const outskirtsByCityId = Object.fromEntries(content.outskirts.map((entry) => [entry.cityId, entry]));
    const ruinsByCityId = Object.fromEntries(content.ruins.map((entry) => [entry.cityId, entry]));
    const cities = Object.keys(outskirtsByCityId)
        .filter((cityId) => Boolean(ruinsByCityId[cityId]))
        .map((cityId) => {
        const profile = getCityRewardRoleProfile(cityId);
        const outskirts = inspectOutskirtsRewardRole(outskirtsByCityId[cityId], content.economy);
        const ruins = inspectRuinsRewardRole(ruinsByCityId[cityId], content.economy);
        const riskNotes = [];
        if (outskirts.targetedLeakageInCommon.length > 0) {
            riskNotes.push(`Outskirts common pool leaks targeted materials: ${outskirts.targetedLeakageInCommon.join(', ')}`);
        }
        if (outskirts.anchorLeakage.length > 0) {
            riskNotes.push(`Outskirts pool leaks deterministic anchor items: ${outskirts.anchorLeakage.join(', ')}`);
        }
        if (!ruins.hasDeterministicAnchor) {
            riskNotes.push(`Ruins missing deterministic anchor ${ruins.deterministicAnchorItemId}`);
        }
        if (ruins.leadMaterialsInRooms.length === 0 && ruins.leadMaterialsInChest.length === 0) {
            riskNotes.push(`Ruins lost lead targeted material identity (${getRuinLeadMaterialIds(cityId).join(', ')})`);
        }
        if (!ruins.bonusBundleAdditiveToAnchor) {
            riskNotes.push('Ruins bonus bundle is no longer additive to the deterministic anchor identity.');
        }
        if (outskirts.targetedRareSpikes.length === 0 && getTargetedCityMaterialIds(cityId).length > 0) {
            riskNotes.push('Outskirts lost all local targeted spike flavor.');
        }
        return {
            cityId,
            cityIndex: profile.cityIndex,
            outskirts,
            ruins,
            riskNotes,
        };
    })
        .sort((a, b) => a.cityIndex - b.cityIndex);
    return { cities };
}
