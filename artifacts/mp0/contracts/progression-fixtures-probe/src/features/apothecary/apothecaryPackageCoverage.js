function getCityIndex(content, cityId) {
    if (!content || !cityId)
        return -1;
    return content.cities.findIndex((city) => city.id === cityId);
}
function hasVisibleLiveRecipe(content, cityId, itemId) {
    if (!content || !cityId)
        return false;
    const targetIndex = getCityIndex(content, cityId);
    if (targetIndex < 0)
        return false;
    return content.alchemy_recipes.some((recipe) => {
        const unlockIndex = getCityIndex(content, recipe.unlocksAtCityId);
        if (unlockIndex < 0 || unlockIndex > targetIndex)
            return false;
        return Object.keys(recipe.outputs ?? {}).includes(itemId);
    });
}
function buildLineCoverage(content, cityId, shop, bundle, line) {
    const stockEntry = shop?.stock.find((entry) => entry.itemId === line.itemId) ?? null;
    const visibleLiveBrew = hasVisibleLiveRecipe(content, cityId, line.itemId);
    const dailyLimit = stockEntry?.dailyLimit ?? null;
    const soldDirectly = Boolean(stockEntry);
    const instantBuyCovered = Boolean(stockEntry && (dailyLimit == null || dailyLimit >= line.qty));
    const dailyLimitCapped = Boolean(stockEntry && dailyLimit != null && dailyLimit < line.qty);
    const exceedsSafeConvenienceShare = Boolean(stockEntry &&
        dailyLimit != null &&
        line.qty > 0 &&
        line.qty / Math.max(1, dailyLimit) > 0.7);
    const bundleQty = bundle?.items.find((entry) => entry.itemId === line.itemId)?.qty ?? 0;
    const honest = soldDirectly && (!dailyLimitCapped || visibleLiveBrew) && (!exceedsSafeConvenienceShare || visibleLiveBrew);
    return {
        itemId: line.itemId,
        qty: line.qty,
        soldDirectly,
        visibleLiveBrew,
        instantBuyCovered,
        dailyLimitCapped,
        dailyLimit,
        exceedsSafeConvenienceShare,
        bundleQty,
        bundleHelps: bundleQty > 0,
        honest,
    };
}
function buildSupplementCoverage(content, cityId, shop, lane) {
    const supportedOptionItemIds = lane.optionItemIds.filter((itemId) => {
        const soldDirectly = Boolean(shop?.stock.find((entry) => entry.itemId === itemId));
        return soldDirectly || hasVisibleLiveRecipe(content, cityId, itemId);
    });
    return {
        key: lane.key,
        label: lane.label,
        qty: lane.qty,
        supportedOptionItemIds,
        supportedByShop: supportedOptionItemIds.some((itemId) => Boolean(shop?.stock.find((entry) => entry.itemId === itemId))),
        supportedByBrew: supportedOptionItemIds.some((itemId) => hasVisibleLiveRecipe(content, cityId, itemId)),
        honest: supportedOptionItemIds.length > 0,
    };
}
export function evaluateGatePrepPackageCoverage(options) {
    const { content, shop, bundle, packageDef } = options;
    if (!shop?.cityId || !packageDef)
        return null;
    const lineCoverage = packageDef.directCore.map((line) => buildLineCoverage(content, shop.cityId, shop, bundle, line));
    const supplementCoverage = packageDef.supplementLanes.map((lane) => buildSupplementCoverage(content, shop.cityId, shop, lane));
    return {
        packageDef,
        lineCoverage,
        supplementCoverage,
        instantBuyCoveredCount: lineCoverage.filter((line) => line.instantBuyCovered).length,
        cappedCount: lineCoverage.filter((line) => line.dailyLimitCapped).length,
        brewSupportedCount: lineCoverage.filter((line) => line.visibleLiveBrew).length,
        bundleCoveredLineCount: lineCoverage.filter((line) => line.bundleHelps).length,
        honest: lineCoverage.every((line) => line.honest) &&
            supplementCoverage.every((lane) => lane.honest),
    };
}
