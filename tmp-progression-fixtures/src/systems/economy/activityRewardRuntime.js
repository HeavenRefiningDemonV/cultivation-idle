const identityRewardBonusApplicator = (bundle) => bundle;
export const mathRandomSource = {
    next: () => Math.random(),
};
function randomIntInRange(random, range, fallback = [0, 0]) {
    const [minRaw, maxRaw] = Array.isArray(range) && range.length === 2 ? range : fallback;
    const min = Number.isFinite(minRaw) ? Number(minRaw) : fallback[0];
    const max = Number.isFinite(maxRaw) ? Number(maxRaw) : fallback[1];
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return Math.floor(random.next() * (high - low + 1)) + low;
}
function randomFromList(random, list) {
    if (!Array.isArray(list) || list.length === 0)
        return null;
    const index = Math.floor(random.next() * list.length);
    return list[index] ?? null;
}
function pickWeighted(random, pool) {
    const validPool = pool.filter((entry) => typeof entry.weight === 'number' && entry.weight > 0);
    if (validPool.length === 0)
        return null;
    const total = validPool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = random.next() * total;
    for (const entry of validPool) {
        roll -= entry.weight;
        if (roll <= 0)
            return entry;
    }
    return validPool[validPool.length - 1] ?? null;
}
function collapseItems(items) {
    const merged = new Map();
    items.forEach((item) => {
        if (!item?.itemId || typeof item.qty !== 'number' || item.qty <= 0)
            return;
        merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.qty);
    });
    return Array.from(merged.entries()).map(([itemId, qty]) => ({ itemId, qty }));
}
function mergeCurrencies(target, source) {
    if (!target && !source)
        return undefined;
    const next = { ...(target ?? {}) };
    Object.entries(source ?? {}).forEach(([key, value]) => {
        const current = Number(next[key] ?? '0');
        const addition = Number(value ?? '0');
        if (Number.isFinite(addition) && addition > 0) {
            next[key] = (current + addition).toString();
        }
    });
    return next;
}
export function mergeRewardBundles(...bundles) {
    const merged = {};
    const items = [];
    bundles.forEach((bundle) => {
        if (!bundle)
            return;
        merged.currencies = mergeCurrencies(merged.currencies, bundle.currencies);
        if (bundle.items?.length)
            items.push(...bundle.items.map((entry) => ({ ...entry })));
        if (bundle.techniqueFragments?.length) {
            merged.techniqueFragments = [...(merged.techniqueFragments ?? []), ...bundle.techniqueFragments.map((entry) => ({ ...entry }))];
        }
        if (bundle.manuals?.length) {
            merged.manuals = [...(merged.manuals ?? []), ...bundle.manuals.map((entry) => ({ ...entry }))];
        }
        if (typeof bundle.comprehension === 'number') {
            merged.comprehension = (merged.comprehension ?? 0) + bundle.comprehension;
        }
    });
    if (items.length > 0)
        merged.items = collapseItems(items);
    return merged;
}
function valueByIndex(source, index, fallback) {
    if (Array.isArray(source))
        return source[index] ?? source[source.length - 1] ?? fallback;
    if (source && typeof source === 'object') {
        const byIndex = source[index];
        if (byIndex !== undefined)
            return byIndex;
        const values = Object.values(source);
        if (values.length > 0)
            return values[values.length - 1] ?? fallback;
    }
    return fallback;
}
export function getOutskirtsDropsConfig(economy) {
    return economy?.drops?.outskirts ?? economy?.manualSystem?.drops?.outskirts;
}
export function getRuinsDropsConfig(economy) {
    return economy?.drops?.ruins ?? economy?.manualSystem?.drops?.ruins;
}
export function buildOutskirtsRewardBundle(outskirtsDef, dropsConfig, cityIndex, isBoss, random = mathRandomSource, bonusApplicator = identityRewardBonusApplicator) {
    const idx = Math.max(0, cityIndex ?? 0);
    const drops = dropsConfig ?? {};
    const mobGoldRange = valueByIndex(drops.mobGoldByCityIndex, idx, [2, 6]);
    const mobCommonChance = drops.mobCommonMatChance ?? 0.35;
    const mobDoubleChance = drops.mobDoubleMatChance ?? 0.1;
    const mobRareChance = drops.mobRareMatChance ?? 0.02;
    const bossGoldRange = valueByIndex(drops.bossGoldByCityIndex, idx, [20, 40]);
    const bossMatCountRange = valueByIndex(drops.bossMatCountRangeByCityIndex, idx, [2, 4]);
    const bossRareChance = valueByIndex(drops.bossRareMatChanceByCityIndex, idx, 0.1);
    const bossSpiritChance = valueByIndex(drops.bossSpiritStoneChanceByCityIndex, idx, 0);
    const bossSpiritRange = valueByIndex(drops.bossSpiritStoneRangeByCityIndex, idx, [0, 0]);
    const bundle = { currencies: {} };
    const items = [];
    if (isBoss) {
        const gold = randomIntInRange(random, bossGoldRange, bossGoldRange);
        bundle.currencies = { ...bundle.currencies, gold: gold.toString() };
        const matCount = Math.max(0, randomIntInRange(random, bossMatCountRange, bossMatCountRange));
        const commonPool = outskirtsDef.matPools?.common ?? [];
        for (let i = 0; i < matCount; i += 1) {
            const mat = randomFromList(random, commonPool);
            if (mat)
                items.push({ itemId: mat, qty: 1 });
        }
        const rarePool = outskirtsDef.matPools?.rare ?? [];
        if (rarePool.length > 0 && random.next() < (bossRareChance ?? 0)) {
            const rareMat = randomFromList(random, rarePool);
            if (rareMat)
                items.push({ itemId: rareMat, qty: 1 });
        }
        if (random.next() < bossSpiritChance) {
            const spiritQty = randomIntInRange(random, bossSpiritRange, bossSpiritRange);
            if (spiritQty > 0) {
                bundle.currencies = { ...bundle.currencies, spiritStones: spiritQty.toString() };
            }
        }
    }
    else {
        const gold = randomIntInRange(random, mobGoldRange, mobGoldRange);
        bundle.currencies = { ...bundle.currencies, gold: gold.toString() };
        const commonPool = outskirtsDef.matPools?.common ?? [];
        const rarePool = outskirtsDef.matPools?.rare ?? [];
        if (commonPool.length > 0 && random.next() < mobCommonChance) {
            const mat = randomFromList(random, commonPool);
            if (mat)
                items.push({ itemId: mat, qty: 1 });
            if (random.next() < mobDoubleChance) {
                const second = randomFromList(random, commonPool);
                if (second)
                    items.push({ itemId: second, qty: 1 });
            }
        }
        if (rarePool.length > 0 && random.next() < mobRareChance) {
            const rareMat = randomFromList(random, rarePool);
            if (rareMat)
                items.push({ itemId: rareMat, qty: 1 });
        }
    }
    const collapsed = collapseItems(items);
    if (collapsed.length > 0)
        bundle.items = collapsed;
    return bonusApplicator(bundle, 'outskirts');
}
export function rollRuinDropTable(table, label, random = mathRandomSource, bonusApplicator = identityRewardBonusApplicator) {
    const bundle = { currencies: {}, items: [] };
    const goldMin = Number.isFinite(table.goldMin) ? Number(table.goldMin) : 0;
    const goldMax = Number.isFinite(table.goldMax) ? Number(table.goldMax) : goldMin;
    if (goldMin > 0 || goldMax > 0) {
        const gold = randomIntInRange(random, [goldMin, goldMax], [goldMin, goldMax]);
        if (gold > 0)
            bundle.currencies = { ...bundle.currencies, gold: gold.toString() };
    }
    const items = [];
    for (let i = 0; i < (table.rolls ?? 0); i += 1) {
        const pick = pickWeighted(random, table.pool ?? []);
        if (!pick?.itemId)
            continue;
        const qty = randomIntInRange(random, [pick.qtyMin, pick.qtyMax], [pick.qtyMin, pick.qtyMax]);
        if (qty > 0)
            items.push({ itemId: pick.itemId, qty });
    }
    (table.guaranteed ?? []).forEach((entry) => {
        if (!entry?.itemId || typeof entry.qty !== 'number' || entry.qty <= 0)
            return;
        items.push({ itemId: entry.itemId, qty: entry.qty });
    });
    const filtered = items.filter((item) => {
        if (!item.itemId.startsWith('gate_'))
            return true;
        console.warn(`[Ruins] blocked gate item drop: ${item.itemId} (${label})`);
        return false;
    });
    bundle.items = collapseItems(filtered);
    return bonusApplicator(bundle, 'ruins');
}
export function buildRuinsFinalChestBonusBundle(cityIndex, dropsConfig, random = mathRandomSource, bonusApplicator = identityRewardBonusApplicator) {
    if (!dropsConfig)
        return {};
    const idx = Math.max(0, cityIndex ?? 0);
    const items = [];
    const runeDustRange = valueByIndex(dropsConfig.finalChestRuneDustRangeByCityIndex, idx, undefined);
    if (runeDustRange) {
        const qty = randomIntInRange(random, runeDustRange, runeDustRange);
        if (qty > 0)
            items.push({ itemId: 'mat_rune_dust', qty });
    }
    const artifactRange = valueByIndex(dropsConfig.finalChestArtifactShardsRangeByCityIndex, idx, undefined);
    if (artifactRange) {
        const qty = randomIntInRange(random, artifactRange, artifactRange);
        if (qty > 0)
            items.push({ itemId: 'mat_artifact_shard', qty });
    }
    return items.length > 0 ? bonusApplicator({ items }, 'ruins') : {};
}
