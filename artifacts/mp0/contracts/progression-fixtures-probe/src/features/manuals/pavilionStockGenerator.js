import { useContentStore } from "../../stores/contentStore.js";
import { applyPavilionCorrectionPass, } from "../../systems/manuals/index.js";
import { nextSeed, randFloat } from "../../utils/rng.js";
const FILLER_RARITY_WEIGHTS = { common: 80, uncommon: 20 };
function stringToSeed(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash >>> 0;
}
function pickWeighted(seed, entries) {
    let next = seed;
    const totalWeight = entries.reduce((sum, entry) => sum + Math.max(entry.weight, 0), 0);
    if (totalWeight <= 0) {
        return { pick: entries[0].value, seed: nextSeed(next) };
    }
    const roll = randFloat(next);
    next = roll.seed;
    let cursor = roll.value * totalWeight;
    for (const entry of entries) {
        cursor -= Math.max(entry.weight, 0);
        if (cursor <= 0) {
            return { pick: entry.value, seed: next };
        }
    }
    return { pick: entries[entries.length - 1].value, seed: nextSeed(next) };
}
function normalizeRarityWeights(weights) {
    const normalized = {};
    ["common", "uncommon", "rare", "epic", "legendary"].forEach((rarity) => {
        const value = weights?.[rarity];
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            normalized[rarity] = value;
        }
    });
    return normalized;
}
function applyCityModifiers(weights, cityId, cityIndex) {
    const economy = useContentStore.getState().raw?.economy?.manualSystem;
    const cityTierModifiers = economy?.pavilions?.cityTierModifiers ?? {};
    const modifiers = (cityTierModifiers?.[cityId] ??
        cityTierModifiers?.[`city_${cityIndex + 1}`]);
    const updated = { ...weights };
    if (modifiers?.legendaryWeightMultiplier !== undefined) {
        const multiplier = Number(modifiers.legendaryWeightMultiplier);
        updated.legendary = Math.max(0, (updated.legendary ?? 0) * multiplier);
    }
    if (modifiers?.featuredEpicCap !== undefined &&
        modifiers.featuredEpicCap !== null) {
        updated.epic = Math.min(updated.epic ?? 0, Number(modifiers.featuredEpicCap));
    }
    return updated;
}
function applyFeaturedPityUpdate(rarity, pity) {
    const nextPity = { ...pity };
    if (rarity === "legendary") {
        nextPity.featuredEpic = 0;
        nextPity.featuredLegendary = 0;
        return nextPity;
    }
    if (rarity === "epic") {
        nextPity.featuredEpic = 0;
        nextPity.featuredLegendary += 1;
        return nextPity;
    }
    nextPity.featuredEpic += 1;
    nextPity.featuredLegendary += 1;
    return nextPity;
}
function rollRarity(seed, weights, pity, pityRules, isFeatured) {
    let nextSeedValue = seed;
    let nextPity = { ...pity };
    if (isFeatured) {
        if (nextPity.featuredLegendary >=
            pityRules.featuredLegendaryPityToGuarantee - 1) {
            nextPity = applyFeaturedPityUpdate("legendary", nextPity);
            return { rarity: "legendary", pity: nextPity, seed: nextSeedValue };
        }
        if (nextPity.featuredEpic >= pityRules.featuredEpicPityToGuarantee - 1) {
            nextPity = applyFeaturedPityUpdate("epic", nextPity);
            return { rarity: "epic", pity: nextPity, seed: nextSeedValue };
        }
    }
    const entries = Object.entries(weights).map(([rarity, weight]) => ({
        value: rarity,
        weight: weight ?? 0,
    }));
    const result = entries.length > 0
        ? pickWeighted(nextSeedValue, entries)
        : { pick: "common", seed: nextSeed(nextSeedValue) };
    nextSeedValue = result.seed;
    const rarity = result.pick;
    if (isFeatured) {
        nextPity = applyFeaturedPityUpdate(rarity, nextPity);
    }
    return { rarity, pity: nextPity, seed: nextSeedValue };
}
function simulateFeaturedPity(starting, rarities, pityRules) {
    void pityRules; // included for parity with roll logic and future expansion
    let state = { ...starting };
    rarities.forEach((rarity) => {
        state = applyFeaturedPityUpdate(rarity, state);
    });
    return state;
}
function buildTechniqueCandidates(pavilionId) {
    const pavilion = useContentStore.getState().maps.pavilionsById[pavilionId];
    const techniques = useContentStore.getState().maps.techniquesById;
    if (!pavilion)
        return [];
    const entries = [];
    Object.values(pavilion.poolByPath ?? {}).forEach((pool) => {
        pool?.forEach((entry) => {
            if (!entry)
                return;
            if (typeof entry === "string") {
                const technique = techniques[entry];
                entries.push({
                    techniqueId: entry,
                    rarity: technique?.rarity,
                    weight: 1,
                });
                return;
            }
            if (typeof entry.techId === "string") {
                const technique = techniques[entry.techId];
                const rarity = entry.rarity ??
                    technique?.rarity;
                const weight = Number(entry.weight ?? 1);
                entries.push({
                    techniqueId: entry.techId,
                    rarity,
                    weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
                });
            }
        });
    });
    return entries;
}
function pickTechnique(seed, candidates, rarity, used, allowDuplicates) {
    let next = seed;
    const pool = candidates.length > 0
        ? candidates
        : [{ techniqueId: "missing", weight: 1 }];
    const rarityPool = rarity
        ? pool.filter((entry) => !entry.rarity || entry.rarity === rarity)
        : pool;
    const uniquePool = rarityPool.filter((entry) => !used.has(entry.techniqueId));
    const finalPool = allowDuplicates || uniquePool.length === 0 ? rarityPool : uniquePool;
    const chosenPool = finalPool.length > 0 ? finalPool : pool;
    const pick = pickWeighted(next, chosenPool.map((entry) => ({
        value: entry.techniqueId,
        weight: entry.weight,
    })));
    next = pick.seed;
    return { techniqueId: pick.pick, seed: next };
}
function getVisibleSlotCount(cityIndex) {
    if (cityIndex <= 0)
        return 10;
    if (cityIndex === 1)
        return 14;
    if (cityIndex === 2)
        return 16;
    if (cityIndex === 3)
        return 20;
    return 24;
}
function clampCityIndex(prices, cityIndex) {
    if (!Array.isArray(prices) || prices.length === 0)
        return 0;
    const idx = typeof cityIndex === "number" && Number.isFinite(cityIndex) ? cityIndex : 0;
    return Math.min(Math.max(idx, 0), prices.length - 1);
}
function determineGrade(pavilionId, cityIndex) {
    const pavilion = useContentStore.getState().maps.pavilionsById[pavilionId];
    const economy = useContentStore.getState().raw?.economy?.manualSystem;
    const gradeFromPavilion = pavilion?.gradeSold ?? null;
    if (gradeFromPavilion)
        return gradeFromPavilion;
    const prices = economy?.pavilions?.manualPricesByCityIndex;
    const entry = prices?.[clampCityIndex(prices, cityIndex)];
    return entry?.grade ?? "mortal";
}
function getPriceForRarity(cityIndex, rarity) {
    const economy = useContentStore.getState().raw?.economy?.manualSystem;
    const prices = economy?.pavilions?.manualPricesByCityIndex;
    const entry = prices?.[clampCityIndex(prices, cityIndex)];
    const rarityPrices = entry?.prices?.[rarity] ?? null;
    if (!rarityPrices || rarityPrices.notSold) {
        return { price: {}, notSold: !!rarityPrices?.notSold };
    }
    const result = {};
    ["gold", "spiritStones", "merit"].forEach((key) => {
        const value = rarityPrices[key];
        if (value !== undefined && value !== null) {
            result[key] = value.toString();
        }
    });
    return { price: result };
}
function buildSlotPlan(visibleSlots) {
    const economy = useContentStore.getState().raw?.economy?.manualSystem;
    const slotTypes = economy?.pavilions?.slotTypes ?? {};
    const mapping = {};
    Object.entries(slotTypes).forEach(([slotTypeKey, slotConfig]) => {
        const shelf = slotTypeKey === "featured"
            ? "featured"
            : slotTypeKey === "rareSlot"
                ? "rare"
                : slotTypeKey === "advanced"
                    ? "advanced"
                    : "common";
        const slots = slotConfig?.slots ?? [];
        slots.forEach((idx) => {
            mapping[idx] = shelf;
        });
    });
    return Array.from({ length: visibleSlots }, (_, i) => {
        const slotIndex = i + 1;
        const shelf = slotIndex in mapping ? mapping[slotIndex] : "filler";
        return { slotIndex, shelf };
    });
}
function summarizeHistory(slots, generatedAt) {
    const featured = slots.find((slot) => slot.shelf === "featured");
    const rares = slots
        .filter((slot) => slot.shelf === "rare")
        .map((slot) => ({
        techniqueId: slot.techniqueId,
        rarity: slot.rarity,
        grade: slot.grade,
    }));
    return {
        at: generatedAt,
        featured: featured
            ? {
                techniqueId: featured.techniqueId,
                rarity: featured.rarity,
                grade: featured.grade,
            }
            : undefined,
        rares: rares.length > 0 ? rares : undefined,
    };
}
function generateStock(pavilionId, now, previous, context) {
    const content = useContentStore.getState();
    const pavilion = content.maps.pavilionsById[pavilionId];
    const economy = content.raw?.economy?.manualSystem;
    const freeRefreshHours = Number(economy?.pavilions?.refresh?.freeRefreshHours ?? 6);
    const pityRules = {
        featuredEpicPityToGuarantee: Number(economy?.pavilions?.refresh?.pity?.featuredEpicPityToGuarantee ??
            10),
        featuredLegendaryPityToGuarantee: Number(economy?.pavilions?.refresh?.pity
            ?.featuredLegendaryPityToGuarantee ?? 30),
    };
    if (!content.isLoaded || !pavilion) {
        const cityId = pavilion?.cityId ?? "unknown_city";
        const cityIndex = pavilion?.cityIndex ?? 0;
        return (previous ?? {
            pavilionId,
            cityId,
            cityIndex,
            generatedAt: now,
            nextRefreshAt: now + freeRefreshHours * 60 * 60 * 1000,
            rngSeed: stringToSeed(`${pavilionId}:${now}`),
            slots: [],
            pity: { featuredEpic: 0, featuredLegendary: 0 },
            history: [],
        });
    }
    const cityId = pavilion.cityId ?? "unknown_city";
    const cityIndex = pavilion.cityIndex ?? 0;
    const coreSlots = Number(economy?.pavilions?.stockSlots ?? 10);
    const visibleSlots = Math.max(coreSlots, getVisibleSlotCount(cityIndex));
    const plan = buildSlotPlan(visibleSlots);
    const grade = determineGrade(pavilionId, cityIndex);
    const candidates = buildTechniqueCandidates(pavilionId);
    const usedCore = new Set();
    const usedAll = new Set();
    let seed = previous
        ? nextSeed(previous.rngSeed)
        : stringToSeed(`${pavilionId}:${now}`);
    let pity = previous?.pity ?? { featuredEpic: 0, featuredLegendary: 0 };
    const slots = [];
    plan.forEach((slotPlan, idx) => {
        const isCore = idx < coreSlots;
        const slotTypeWeights = slotPlan.shelf === "filler"
            ? FILLER_RARITY_WEIGHTS
            : normalizeRarityWeights(economy?.pavilions?.slotTypes?.[slotPlan.shelf === "rare" ? "rareSlot" : slotPlan.shelf]?.weights ?? {});
        const adjustedWeights = slotPlan.shelf === "featured" || slotPlan.shelf === "rare"
            ? applyCityModifiers(slotTypeWeights, cityId, cityIndex)
            : slotTypeWeights;
        const rarityResult = rollRarity(seed, adjustedWeights, pity, pityRules, slotPlan.shelf === "featured");
        seed = rarityResult.seed;
        pity = rarityResult.pity;
        const allowDuplicates = slotPlan.shelf === "filler";
        const pick = pickTechnique(seed, candidates, rarityResult.rarity, isCore ? usedCore : usedAll, allowDuplicates);
        seed = pick.seed;
        usedAll.add(pick.techniqueId);
        if (isCore) {
            usedCore.add(pick.techniqueId);
        }
        const { price, notSold } = getPriceForRarity(cityIndex, rarityResult.rarity);
        slots.push({
            slotIndex: slotPlan.slotIndex,
            shelf: slotPlan.shelf,
            techniqueId: pick.techniqueId,
            grade,
            rarity: rarityResult.rarity,
            price,
            notSold,
            sold: false,
        });
    });
    const corrected = applyPavilionCorrectionPass({
        pavilionId,
        slots,
        candidates,
        context,
    });
    const historyEntry = summarizeHistory(corrected.slots.filter((slot) => slot.slotIndex <= coreSlots), now);
    const history = previous ? [...(previous.history ?? [])] : [];
    history.push(historyEntry);
    while (history.length > 3)
        history.shift();
    return {
        pavilionId,
        cityId,
        cityIndex,
        generatedAt: now,
        nextRefreshAt: now + freeRefreshHours * 60 * 60 * 1000,
        rngSeed: seed,
        slots: corrected.slots,
        pity,
        history,
    };
}
export function buildInitialStock(pavilionId, now, context) {
    return generateStock(pavilionId, now, undefined, context);
}
export function refreshStock(prev, now, context) {
    return generateStock(prev.pavilionId, now, prev, context);
}
function runPitySanityChecks() {
    const rules = {
        featuredEpicPityToGuarantee: 10,
        featuredLegendaryPityToGuarantee: 30,
    };
    const base = { featuredEpic: 0, featuredLegendary: 0 };
    const afterThreeCommons = simulateFeaturedPity(base, ["common", "common", "common"], rules);
    const afterEpic = simulateFeaturedPity(base, ["epic"], rules);
    const afterLegendary = simulateFeaturedPity({ featuredEpic: 5, featuredLegendary: 5 }, ["legendary"], rules);
    const epicGuarantee = rollRarity(0, { common: 1 }, {
        featuredEpic: rules.featuredEpicPityToGuarantee - 1,
        featuredLegendary: 0,
    }, rules, true);
    const legendaryGuarantee = rollRarity(0, { common: 1 }, {
        featuredEpic: rules.featuredEpicPityToGuarantee,
        featuredLegendary: rules.featuredLegendaryPityToGuarantee - 1,
    }, rules, true);
    const issues = [];
    if (afterThreeCommons.featuredEpic !== 3 ||
        afterThreeCommons.featuredLegendary !== 3) {
        issues.push("Featured pity should increment on non-epic/legendary rolls.");
    }
    if (afterEpic.featuredEpic !== 0 || afterEpic.featuredLegendary !== 1) {
        issues.push("Epic pity should reset epic counter and increment legendary.");
    }
    if (afterLegendary.featuredEpic !== 0 ||
        afterLegendary.featuredLegendary !== 0) {
        issues.push("Legendary pity should reset both counters.");
    }
    if (epicGuarantee.rarity !== "epic") {
        issues.push("Epic pity guarantee did not trigger.");
    }
    if (legendaryGuarantee.rarity !== "legendary") {
        issues.push("Legendary pity guarantee did not trigger.");
    }
    if (issues.length && typeof console !== "undefined") {
        console.warn("[Pavilion Pity Sanity]", issues.join(" "));
    }
}
if (import.meta.env?.DEV) {
    runPitySanityChecks();
}
