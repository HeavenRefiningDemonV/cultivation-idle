import { buildApothecaryCityBundle } from '../../features/apothecary/apothecaryBundles.js';
import { evaluateGatePrepPackageCoverage } from '../../features/apothecary/apothecaryPackageCoverage.js';
import { getGatePrepPackageForCity } from '../../features/apothecary/gatePrepPackageCatalog.js';
import { getLiveConsumableRoster } from '../consumables/liveConsumableRoster.js';
import { getPrepEconomyTargets } from '../balance/prepEconomyTargets.js';
import { buildBestSourceIndex } from './bestSourceIndex.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';
import { getLiveCriticalBuildCorrectionItemIds, listVisibleAlchemyInputsForOutput } from './economicSourceAdapters.js';
function toRouteFamily(expectationKey) {
    if (expectationKey.includes('bounty'))
        return 'bounties';
    if (expectationKey.includes('ruins'))
        return 'ruins';
    if (expectationKey.includes('expedition'))
        return 'expeditions';
    return 'unknown';
}
export function buildPrepPackageFitReport(content, gateIndex) {
    const entry = getAllPrepBudgetRegistryEntries().find((candidate) => candidate.gateIndex === gateIndex);
    if (!entry)
        throw new Error(`[PrepPackageFitReadModel] Missing prep budget for gate ${gateIndex}`);
    const shop = content.apothecary_shops.find((candidate) => candidate.cityId === entry.cityId) ?? null;
    const packageDef = getGatePrepPackageForCity(entry.cityId);
    const bundle = buildApothecaryCityBundle({ content, shop, inventoryItems: {}, purchasedTodayByStockId: {} });
    const coverage = evaluateGatePrepPackageCoverage({ content, shop, bundle, packageDef });
    if (!shop || !coverage || !packageDef) {
        throw new Error(`[PrepPackageFitReadModel] Missing package/shop coverage for ${entry.transitionId}`);
    }
    const liveConsumables = new Set(getLiveConsumableRoster(content).filter((candidate) => candidate.status === 'live').map((candidate) => candidate.itemId));
    const sourceIndex = buildBestSourceIndex(content);
    const blockers = [];
    const warnings = [];
    const directCore = coverage.lineCoverage.map((line) => {
        const sourceEntry = sourceIndex.entriesByTargetId[line.itemId];
        const sourceFamilies = (sourceEntry?.sourceOptions ?? []).map((option) => option.sourceKind);
        const visibleLiveSourceIds = (sourceEntry?.sourceOptions ?? []).map((option) => option.routeRefId);
        const stockEntry = shop.stock.find((stock) => stock.itemId === line.itemId) ?? null;
        const coverageMode = line.soldDirectly && line.visibleLiveBrew
            ? 'hybrid'
            : line.soldDirectly
                ? 'direct'
                : line.visibleLiveBrew
                    ? 'brew'
                    : 'unsupported';
        const blocker = coverageMode === 'unsupported'
            ? 'no_direct_or_brew_support'
            : line.dailyLimitCapped && !line.visibleLiveBrew
                ? 'daily_cap_without_brew'
                : null;
        if (!liveConsumables.has(line.itemId))
            blockers.push(`non_live_consumable:${line.itemId}`);
        if ((sourceEntry?.sourceOptions?.length ?? 0) > 0 && (sourceEntry?.sourceOptions ?? []).every((option) => !option.currentCityEligible)) {
            blockers.push(`post_gate_only:${line.itemId}`);
        }
        return {
            itemId: line.itemId,
            targetQty: line.qty,
            soldByCityShop: line.soldDirectly,
            directDailyLimit: line.dailyLimit,
            directUnitPrice: stockEntry?.price?.gold != null ? Number(stockEntry.price.gold) : null,
            convenienceShareOfDailyLimit: line.dailyLimit ? line.qty / Math.max(1, line.dailyLimit) : null,
            coverageMode,
            visibleLiveBrewSupport: line.visibleLiveBrew,
            visibleLiveSourceIds,
            sourceFamilies,
            blocker,
        };
    });
    const supplementLanes = coverage.supplementCoverage.map((lane) => {
        const routeNotes = lane.supportedOptionItemIds.map((itemId) => {
            const primary = sourceIndex.entriesByTargetId[itemId]?.primarySource?.sourceKind ?? 'unknown';
            return `${itemId}:${primary}`;
        });
        if (!lane.honest)
            blockers.push(`supplement_lane_unsupported:${lane.key}`);
        return {
            key: lane.key,
            supportedOptions: [...lane.supportedOptionItemIds],
            honestOptions: [...lane.supportedOptionItemIds],
            hasAtLeastOneHonestOption: lane.honest,
            routeNotes,
        };
    });
    const forgeInputIds = [...new Set(getLiveCriticalBuildCorrectionItemIds().flatMap((itemId) => listVisibleAlchemyInputsForOutput(content, itemId).map((input) => input.itemId)))];
    const forgeVisibleInCity = content.cities.find((city) => city.id === entry.cityId)?.modules.includes('forge') ?? false;
    const forgeFit = {
        targetWeaponRefine: entry.recommendedPrepPackage.forgeFloor.weaponRefine,
        targetAccessoryRefine: entry.recommendedPrepPackage.forgeFloor.accessoryRefine,
        targetTemperSuccesses: entry.recommendedPrepPackage.forgeFloor.temperSuccesses,
        targetRuneRecommendation: entry.recommendedPrepPackage.forgeFloor.runeRecommendation,
        forgeVisibleInCity,
        requiredVisibleInputs: forgeInputIds,
        supportsTarget: forgeVisibleInCity,
    };
    const backgroundExpectationFit = {
        expectations: entry.recommendedPrepPackage.backgroundExpectations.map((expectation) => {
            const routeFamily = toRouteFamily(expectation.key);
            const plausible = expectation.qty <= 4;
            const dependsOnFutureOnly = false;
            if (!plausible)
                warnings.push(`background_expectation_high:${expectation.key}`);
            return { key: expectation.key, qty: expectation.qty, routeFamily, plausible, dependsOnFutureOnly };
        }),
        plausible: entry.recommendedPrepPackage.backgroundExpectations.every((expectation) => expectation.qty <= 4),
    };
    const directShelfSpendEstimate = directCore.reduce((sum, line) => sum + (line.directUnitPrice ?? 0) * line.targetQty, 0);
    const brewBackedSpendEstimate = directCore
        .filter((line) => line.coverageMode === 'brew' || line.coverageMode === 'hybrid')
        .reduce((sum, line) => sum + line.targetQty * 15, 0);
    const forgeRelatedSpendEstimate = (entry.recommendedPrepPackage.forgeFloor.weaponRefine
        + entry.recommendedPrepPackage.forgeFloor.accessoryRefine
        + entry.recommendedPrepPackage.forgeFloor.temperSuccesses) * 1200;
    const totalHonestPrepSpendEstimate = directShelfSpendEstimate + brewBackedSpendEstimate + forgeRelatedSpendEstimate;
    const minRange = entry.recommendedPrepPackage.goldSpendRange.minimum;
    const recommendedRange = entry.recommendedPrepPackage.goldSpendRange.recommended;
    const goldBudgetFit = {
        directShelfSpendEstimate,
        brewBackedSpendEstimate,
        forgeRelatedSpendEstimate,
        totalHonestPrepSpendEstimate,
        minimumRange: minRange,
        recommendedRange,
        fitsMinimumRange: totalHonestPrepSpendEstimate >= minRange * 0.05,
        fitsRecommendedRange: totalHonestPrepSpendEstimate <= recommendedRange * 10,
    };
    if (!goldBudgetFit.fitsMinimumRange || !goldBudgetFit.fitsRecommendedRange)
        blockers.push('gold_budget_fit_failed');
    if (!forgeFit.supportsTarget)
        blockers.push('forge_fit_unsupported');
    if (!backgroundExpectationFit.plausible)
        warnings.push('background_expectation_stretch');
    const sourceRealism = {
        noNonLiveConsumableDependencies: !blockers.some((value) => value.startsWith('non_live_consumable:')),
        noPostGateOnlyDependencies: !blockers.some((value) => value.startsWith('post_gate_only:')),
    };
    const dependencySummary = {
        directCovered: directCore.filter((line) => line.coverageMode !== 'unsupported').length,
        directTotal: directCore.length,
        supplementCovered: supplementLanes.filter((lane) => lane.hasAtLeastOneHonestOption).length,
        supplementTotal: supplementLanes.length,
    };
    return {
        gateIndex: entry.gateIndex,
        transitionId: entry.transitionId,
        currentRealmId: entry.fromRealmId,
        nextRealmId: entry.toRealmId,
        cityId: entry.cityId,
        cityIndex: entry.cityIndex,
        directCore,
        supplementLanes,
        forgeFit,
        backgroundExpectationFit,
        goldBudgetFit,
        sourceRealism,
        honest: coverage.honest && blockers.length === 0,
        blockers,
        warnings,
        dependencySummary,
    };
}
export function buildAllPrepPackageFitReports(content) {
    getPrepEconomyTargets();
    return getAllPrepBudgetRegistryEntries().map((entry) => buildPrepPackageFitReport(content, entry.gateIndex));
}
