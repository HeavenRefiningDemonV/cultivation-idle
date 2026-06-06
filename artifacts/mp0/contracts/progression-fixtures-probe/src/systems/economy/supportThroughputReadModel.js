import { ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS, getActivityThroughputTargets, } from '../balance/activityThroughputTargets.js';
import { buildRuinsThroughputSnapshot } from './activityThroughputReadModel.js';
import { classifyActivityRewardItem } from './activityRewardRoles.js';
import { getSupportBountyClaimExpectationByCityIndex, getSupportReserveTargetsByCityIndex } from './supportCurrencyTargets.js';
import { getGateFailureMeritPolicyByGateIndex } from './gateFailureMeritPolicy.js';
const avgRange = (range) => {
    if (!range)
        return 0;
    return (Number(range[0] ?? 0) + Number(range[1] ?? 0)) / 2;
};
const valueByIndex = (source, index) => {
    if (!source)
        return null;
    const entries = Object.entries(source)
        .map(([key, value]) => ({ index: Number(key), value }))
        .filter((entry) => Number.isFinite(entry.index))
        .sort((a, b) => a.index - b.index);
    const exact = entries.find((entry) => entry.index === index);
    if (exact)
        return exact.value;
    const lower = entries.filter((entry) => entry.index <= index);
    if (lower.length > 0)
        return lower.at(-1)?.value ?? null;
    return entries[0]?.value ?? null;
};
const toExpectedCurrencyTriple = (tier) => ({
    gold: avgRange(tier.gold),
    merit: avgRange(tier.merit),
    spiritStones: avgRange(tier.spiritStones),
});
const scaleTriple = (triple, scalar) => ({
    gold: triple.gold * scalar,
    merit: triple.merit * scalar,
    spiritStones: triple.spiritStones * scalar,
});
const addTriples = (left, right) => ({
    gold: left.gold + right.gold,
    merit: left.merit + right.merit,
    spiritStones: left.spiritStones + right.spiritStones,
});
const getExpeditionTypeById = (content, expeditionTypeId) => content.expeditions.types.find((entry) => entry.id === expeditionTypeId) ?? null;
const getDurationById = (content, durationId) => content.expeditions.durations.find((entry) => entry.id === durationId) ?? null;
const getCityYieldBundleByType = (content, cityIndex, expeditionTypeId) => {
    const type = getExpeditionTypeById(content, expeditionTypeId);
    if (!type)
        return null;
    const cityYield = content.expeditions.cityYields.find((entry) => entry.cityIndex === cityIndex);
    if (!cityYield)
        return null;
    const bundles = (type.yieldTags ?? [])
        .map((tag) => cityYield.yieldsByTag?.[tag])
        .filter(Boolean);
    if (bundles.length === 0)
        return null;
    const itemTotals = new Map();
    bundles.forEach((bundle) => {
        (bundle.items ?? []).forEach((item) => {
            itemTotals.set(item.itemId, (itemTotals.get(item.itemId) ?? 0) + item.qty);
        });
    });
    return {
        items: Array.from(itemTotals.entries()).map(([itemId, qty]) => ({ itemId, qty })),
    };
};
const scaleBundleItems = (bundle, scalar) => {
    if (!bundle?.items)
        return [];
    return bundle.items.map((item) => ({ itemId: item.itemId, qty: item.qty * scalar }));
};
const getExpeditionValueScore = (cityId, items, moduleRelevantItemIds) => {
    let weightedValue = 0;
    let targetedUnits = 0;
    let anchorUnits = 0;
    let moduleRelevantUnits = 0;
    items.forEach((item) => {
        const bucket = classifyActivityRewardItem(cityId, item.itemId);
        if (bucket === 'anchor') {
            weightedValue += item.qty * 1.25;
            anchorUnits += item.qty;
            return;
        }
        if (bucket === 'targeted_local') {
            weightedValue += item.qty;
            targetedUnits += item.qty;
            return;
        }
        if (moduleRelevantItemIds.has(item.itemId)) {
            weightedValue += item.qty * 0.6;
            moduleRelevantUnits += item.qty;
            return;
        }
        weightedValue += item.qty * 0.2;
    });
    return { weightedValue, targetedUnits, anchorUnits, moduleRelevantUnits };
};
export function buildBountySupportThroughputSnapshot(content, cityId) {
    const city = content.cities.find((entry) => entry.id === cityId);
    if (!city)
        throw new Error(`[SupportThroughputReadModel] Missing city ${cityId}`);
    const tier = valueByIndex(content.bounties.rewardTiersByCityIndex, city.index);
    if (!tier)
        throw new Error(`[SupportThroughputReadModel] Missing bounty reward tier for city index ${city.index}`);
    const easy = toExpectedCurrencyTriple(tier.easy);
    const medium = toExpectedCurrencyTriple(tier.medium);
    const hard = toExpectedCurrencyTriple(tier.hard);
    const claimExpectation = getSupportBountyClaimExpectationByCityIndex(city.index);
    const reserveTargets = getSupportReserveTargetsByCityIndex(city.index);
    const gatePolicy = getGateFailureMeritPolicyByGateIndex(reserveTargets.gateIndex);
    const supportBundlePerBoard = addTriples(addTriples(easy, medium), hard);
    const minClaimsContribution = scaleTriple(supportBundlePerBoard, claimExpectation.minClaims);
    const maxClaimsContribution = scaleTriple(supportBundlePerBoard, claimExpectation.maxClaims);
    const supportWeightedValuePerClaim = easy.merit + medium.merit + hard.merit + (easy.spiritStones + medium.spiritStones + hard.spiritStones) * 0.6;
    const goldPerClaim = easy.gold + medium.gold + hard.gold;
    return {
        cityId,
        cityIndex: city.index,
        gateIndex: reserveTargets.gateIndex,
        expectedClaimBand: {
            minClaims: claimExpectation.minClaims,
            maxClaims: claimExpectation.maxClaims,
        },
        payoutsByDifficulty: { easy, medium, hard },
        supportPayoutByExpectedBand: {
            minClaims: minClaimsContribution,
            maxClaims: maxClaimsContribution,
        },
        reserveTargets: {
            meritIdealReserve: reserveTargets.meritIdealReserve,
            spiritStoneMinimumReserve: reserveTargets.spiritStoneMinimumReserve,
            spiritStoneIdealReserve: reserveTargets.spiritStoneIdealReserve,
        },
        gateFailurePolicy: {
            eligibleDefeatMerit: gatePolicy.eligibleDefeatMerit,
            minimumMeritReserveLow: gatePolicy.minimumMeritReserveLow,
            minimumMeritReserveHigh: gatePolicy.minimumMeritReserveHigh,
        },
        reserveContribution: {
            meritCoverageAtMinClaims: minClaimsContribution.merit / Math.max(1, reserveTargets.meritIdealReserve),
            meritCoverageAtMaxClaims: maxClaimsContribution.merit / Math.max(1, reserveTargets.meritIdealReserve),
            spiritCoverageAtMinClaims: minClaimsContribution.spiritStones / Math.max(1, reserveTargets.spiritStoneMinimumReserve),
            spiritCoverageAtMaxClaims: maxClaimsContribution.spiritStones / Math.max(1, reserveTargets.spiritStoneMinimumReserve),
        },
        supportPrimaryScore: {
            supportWeightedValuePerClaim,
            goldPerClaim,
            supportToGoldRatio: supportWeightedValuePerClaim / Math.max(1, goldPerClaim),
        },
    };
}
export function buildExpeditionSupportThroughputSnapshot(content, cityId, expeditionTypeId) {
    const city = content.cities.find((entry) => entry.id === cityId);
    if (!city)
        throw new Error(`[SupportThroughputReadModel] Missing city ${cityId}`);
    const type = getExpeditionTypeById(content, expeditionTypeId);
    if (!type)
        throw new Error(`[SupportThroughputReadModel] Missing expedition type ${expeditionTypeId}`);
    const ruin = buildRuinsThroughputSnapshot(content, cityId);
    const baseBundle = getCityYieldBundleByType(content, city.index, expeditionTypeId);
    const moduleRelevantItemIds = new Set((baseBundle?.items ?? []).map((item) => item.itemId));
    const baseValue = getExpeditionValueScore(cityId, baseBundle?.items ?? [], moduleRelevantItemIds);
    const rareQtyExpected = (type.rareDrops ?? []).reduce((sum, drop) => sum + (drop.qty ?? 0), 0);
    const equivalenceTargets = getActivityThroughputTargets().expeditionEquivalenceTargets;
    const targetRatioByDuration = {
        short: equivalenceTargets.shortToRuinValueRatioTarget,
        medium: equivalenceTargets.mediumToRuinValueRatioTarget,
        long: equivalenceTargets.longToRuinValueRatioTarget,
    };
    const durations = ['short', 'medium', 'long'].map((durationId) => {
        const duration = getDurationById(content, durationId);
        if (!duration) {
            throw new Error(`[SupportThroughputReadModel] Missing duration ${durationId}`);
        }
        const scaledItems = scaleBundleItems(baseBundle, duration.efficiencyMult ?? 1);
        const rareExpectedItems = ((duration.rareChance ?? 0) * rareQtyExpected * (duration.efficiencyMult ?? 1)) * 0.6;
        const scaledValue = getExpeditionValueScore(cityId, scaledItems, moduleRelevantItemIds);
        const expectedValueScore = scaledValue.weightedValue + rareExpectedItems;
        return {
            durationId,
            seconds: duration.seconds,
            efficiencyMult: duration.efficiencyMult ?? 1,
            rareChance: duration.rareChance ?? 0,
            expectedValueScore,
            equivalenceRatioVsRuin: targetRatioByDuration[durationId],
        };
    });
    return {
        cityId,
        cityIndex: city.index,
        expeditionTypeId,
        recommendedModuleKey: type.recommendedModuleKey ?? null,
        moduleRelevantUnits: baseValue.moduleRelevantUnits,
        targetedUnits: baseValue.targetedUnits,
        anchorUnits: baseValue.anchorUnits,
        baselineRuinValueScore: ruin.runTotals.targeted + ruin.runTotals.anchor * 1.25,
        durations,
    };
}
export function buildSupportThroughputCityReport(content, cityId) {
    const targets = getActivityThroughputTargets();
    return {
        cityId,
        bounty: buildBountySupportThroughputSnapshot(content, cityId),
        expeditions: ['forage', 'mine', 'scout'].map((typeId) => buildExpeditionSupportThroughputSnapshot(content, cityId, typeId)),
        expeditionTolerance: targets.expeditionEquivalenceTargets.validationTolerance,
        supportThresholds: {
            bountyGoldNotDominant: ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.bountyGoldVsOutskirtsMaxShare,
        },
    };
}
export function buildAllSupportThroughputCityReports(content) {
    return content.cities
        .slice()
        .sort((a, b) => a.index - b.index)
        .filter((city) => city.index <= 4)
        .map((city) => buildSupportThroughputCityReport(content, city.id));
}
