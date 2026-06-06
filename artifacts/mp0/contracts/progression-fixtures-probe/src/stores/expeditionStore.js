import Decimal from 'decimal.js';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RewardService } from '../services/rewards/index.js';
import { useContentStore } from './contentStore.js';
import { useCityStore } from './cityStore.js';
import { multiply } from '../utils/numbers.js';
import { normalizeItemList } from '../utils/itemList.js';
import { randFloat } from '../utils/rng.js';
import { useBountyStore } from './bountyStore.js';
import { rollWithPity } from '../services/economy/pity.js';
import { useUIStore } from './uiStore.js';
import { getExpeditionBountyCreditCityId } from '../utils/bountyRouting.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { bumpVersion } from './versionCounters.js';
function mergeCurrency(target, source) {
    ['gold', 'spiritStones', 'merit'].forEach((key) => {
        const value = source[key];
        if (!value)
            return;
        const current = target[key] ?? '0';
        target[key] = multiply(current, 1).plus(multiply(value, 1)).toString();
    });
}
function mergeRewardBundles(bundles) {
    const merged = {};
    bundles.forEach((bundle) => {
        if (!bundle)
            return;
        if (bundle.currencies) {
            merged.currencies = merged.currencies ?? {};
            mergeCurrency(merged.currencies, bundle.currencies);
        }
        const items = normalizeItemList(bundle.items);
        if (items.length > 0) {
            merged.items = merged.items ?? [];
            merged.items.push(...items.map((item) => ({ ...item })));
        }
        if (bundle.techniqueFragments && bundle.techniqueFragments.length > 0) {
            merged.techniqueFragments = merged.techniqueFragments ?? [];
            merged.techniqueFragments.push(...bundle.techniqueFragments.map((fragment) => ({ ...fragment })));
        }
        if (typeof bundle.comprehension === 'number') {
            merged.comprehension = (merged.comprehension ?? 0) + bundle.comprehension;
        }
    });
    return merged;
}
function applyEfficiency(bundle, efficiencyMult) {
    if (!efficiencyMult || efficiencyMult === 1)
        return bundle;
    const normalizedItems = normalizeItemList(bundle.items);
    const next = {
        currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
        items: normalizedItems.length > 0 ? normalizedItems.map((item) => ({ ...item })) : undefined,
        techniqueFragments: bundle.techniqueFragments
            ? bundle.techniqueFragments.map((fragment) => ({ ...fragment }))
            : undefined,
        comprehension: bundle.comprehension,
    };
    if (next.currencies) {
        ['gold', 'spiritStones', 'merit'].forEach((key) => {
            const value = next.currencies?.[key];
            if (!value)
                return;
            next.currencies[key] = multiply(value, efficiencyMult).floor().toString();
        });
    }
    if (next.items) {
        next.items = next.items.map((item) => ({
            ...item,
            qty: Math.max(0, Math.floor(item.qty * efficiencyMult)),
        }));
    }
    if (next.techniqueFragments) {
        next.techniqueFragments = next.techniqueFragments.map((fragment) => ({
            ...fragment,
            qty: Math.max(0, Math.floor(fragment.qty * efficiencyMult)),
        }));
    }
    if (typeof next.comprehension === 'number') {
        next.comprehension = Math.floor(next.comprehension * efficiencyMult);
    }
    return next;
}
function findDurationDef(durationId) {
    const content = useContentStore.getState().raw?.expeditions;
    if (!content)
        return null;
    const duration = content.durations.find((entry) => entry.id === durationId);
    if (!duration)
        return null;
    return duration;
}
function findTypeYieldTags(typeId) {
    const content = useContentStore.getState().raw?.expeditions;
    if (!content)
        return [];
    const entry = content.types.find((type) => type.id === typeId);
    return entry?.yieldTags ?? [];
}
function findTypeDef(typeId) {
    const content = useContentStore.getState().raw?.expeditions;
    if (!content)
        return null;
    return content.types.find((type) => type.id === typeId) ?? null;
}
function findCityYieldBundles(cityIndex, tags) {
    const content = useContentStore.getState().raw?.expeditions;
    if (!content)
        return [];
    const yields = content.cityYields.find((entry) => entry.cityIndex === cityIndex);
    if (!yields)
        return [];
    return tags.map((tag) => yields.yieldsByTag?.[tag]).filter(Boolean);
}
function collapseRewardBundle(bundle) {
    const normalizedItems = normalizeItemList(bundle.items);
    const itemTotals = {};
    normalizedItems.forEach((item) => {
        if (!item.itemId || !Number.isFinite(item.qty) || item.qty <= 0)
            return;
        itemTotals[item.itemId] = (itemTotals[item.itemId] ?? 0) + item.qty;
    });
    const fragmentTotals = {};
    bundle.techniqueFragments?.forEach((fragment) => {
        if (!fragment.techId || !Number.isFinite(fragment.qty) || fragment.qty <= 0)
            return;
        fragmentTotals[fragment.techId] = (fragmentTotals[fragment.techId] ?? 0) + fragment.qty;
    });
    const collapsed = {
        currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
        items: Object.entries(itemTotals).map(([itemId, qty]) => ({ itemId, qty })),
        techniqueFragments: Object.entries(fragmentTotals).map(([techId, qty]) => ({ techId, qty })),
        comprehension: bundle.comprehension,
        manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
    };
    if (collapsed.items && collapsed.items.length === 0)
        delete collapsed.items;
    if (collapsed.techniqueFragments && collapsed.techniqueFragments.length === 0)
        delete collapsed.techniqueFragments;
    if (collapsed.currencies && Object.keys(collapsed.currencies).length === 0)
        delete collapsed.currencies;
    if (collapsed.manuals && collapsed.manuals.length === 0)
        delete collapsed.manuals;
    return collapsed;
}
function computeExpectedBundle(run) {
    const yieldTags = findTypeYieldTags(run.expeditionTypeId);
    if (yieldTags.length === 0)
        return null;
    const bundles = findCityYieldBundles(run.cityIndex, yieldTags);
    if (bundles.length === 0)
        return null;
    const baseBundle = mergeRewardBundles(bundles);
    const efficiencyMult = findDurationDef(run.durationId)?.efficiencyMult;
    const finalBundle = applyEfficiency(baseBundle, efficiencyMult);
    return collapseRewardBundle(finalBundle);
}
function rollVariance(bundle, variancePct, seed) {
    const clampedVariance = Math.max(0, Math.min(0.5, variancePct));
    let currentSeed = seed >>> 0;
    const next = {
        currencies: bundle.currencies ? {} : undefined,
        items: [],
        techniqueFragments: [],
        comprehension: bundle.comprehension,
        manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
    };
    if (bundle.currencies) {
        ['gold', 'spiritStones', 'merit'].forEach((key) => {
            const value = bundle.currencies?.[key];
            if (!value)
                return;
            const base = multiply(value, 1);
            if (!base.greaterThan(0))
                return;
            const roll = randFloat(currentSeed);
            currentSeed = roll.seed;
            const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
            const rolled = base.times(multiplier);
            const rounded = rolled.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
            if (rounded.greaterThan(0)) {
                next.currencies[key] = rounded.lessThan(1) ? '1' : rounded.toString();
            }
        });
        if (next.currencies && Object.keys(next.currencies).length === 0) {
            delete next.currencies;
        }
    }
    const items = normalizeItemList(bundle.items);
    items.forEach((item) => {
        if (!item.itemId || !Number.isFinite(item.qty) || item.qty <= 0)
            return;
        const roll = randFloat(currentSeed);
        currentSeed = roll.seed;
        const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
        const rolledQty = Math.max(1, Math.round(item.qty * multiplier));
        if (rolledQty > 0) {
            next.items.push({ ...item, qty: rolledQty });
        }
    });
    if (next.items && next.items.length === 0)
        delete next.items;
    bundle.techniqueFragments?.forEach((fragment) => {
        if (!fragment.techId || !Number.isFinite(fragment.qty) || fragment.qty <= 0)
            return;
        const roll = randFloat(currentSeed);
        currentSeed = roll.seed;
        const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
        const rolledQty = Math.max(1, Math.round(fragment.qty * multiplier));
        if (rolledQty > 0) {
            next.techniqueFragments.push({ ...fragment, qty: rolledQty });
        }
    });
    if (next.techniqueFragments && next.techniqueFragments.length === 0)
        delete next.techniqueFragments;
    return { bundle: collapseRewardBundle(next), seed: currentSeed >>> 0 };
}
function pickWeightedRareDrop(typeId, seed) {
    const typeDef = findTypeDef(typeId);
    const drops = typeDef?.rareDrops;
    if (!drops || drops.length === 0) {
        return { drop: null, seed };
    }
    let currentSeed = seed >>> 0;
    const totalWeight = drops.reduce((sum, entry) => {
        const weight = Number.isFinite(entry.weight) && entry.weight !== undefined ? Number(entry.weight) : 1;
        const safeWeight = weight > 0 ? weight : 1;
        return sum + safeWeight;
    }, 0);
    if (totalWeight <= 0) {
        return { drop: null, seed: currentSeed };
    }
    const pickRoll = randFloat(currentSeed);
    currentSeed = pickRoll.seed;
    let cursor = pickRoll.value * totalWeight;
    for (const entry of drops) {
        const weight = Number.isFinite(entry.weight) && entry.weight !== undefined ? Number(entry.weight) : 1;
        const safeWeight = weight > 0 ? weight : 1;
        cursor -= safeWeight;
        if (cursor <= 0) {
            return { drop: { itemId: entry.itemId, qty: entry.qty }, seed: currentSeed };
        }
    }
    const fallback = drops[drops.length - 1];
    return { drop: { itemId: fallback.itemId, qty: fallback.qty }, seed: currentSeed };
}
function selectBestDropSpotlight(bundle, rareDrop) {
    if (rareDrop)
        return rareDrop.itemId;
    const items = normalizeItemList(bundle.items);
    if (items.length === 0)
        return null;
    const itemsById = useContentStore.getState().maps.itemsById;
    let bestId = null;
    let bestScore = -Infinity;
    items.forEach((item) => {
        const def = itemsById[item.itemId];
        const sellValue = typeof def?.sellValue === 'number' && Number.isFinite(def.sellValue) ? def.sellValue : null;
        const score = sellValue !== null ? sellValue * item.qty : item.qty;
        if (score > bestScore) {
            bestScore = score;
            bestId = item.itemId;
        }
    });
    return bestId;
}
function normalizeHydratedRun(run, slots, now) {
    if (!run || !Number.isFinite(run.slotIndex) || run.slotIndex < 0 || run.slotIndex >= slots)
        return null;
    if (typeof run.expeditionTypeId !== 'string' || !findTypeDef(run.expeditionTypeId))
        return null;
    const duration = findDurationDef(run.durationId);
    if (!duration || duration.seconds <= 0)
        return null;
    const origin = normalizeExpeditionRunOrigin({
        run,
        citiesById: useContentStore.getState().maps.citiesById,
        currentCityId: useCityStore.getState().currentCityId,
    });
    if (!origin)
        return null;
    const cityIndex = origin.cityIndex;
    const startedAt = Number.isFinite(run.startedAt) ? run.startedAt : Math.max(0, now - duration.seconds * 1000);
    const canonicalEndsAt = startedAt + duration.seconds * 1000;
    const savedEndsAt = Number.isFinite(run.endsAt) ? run.endsAt : canonicalEndsAt;
    const endsAt = Math.max(startedAt, savedEndsAt, canonicalEndsAt);
    const status = now >= endsAt ? 'complete' : 'running';
    return {
        ...run,
        cityId: origin.cityId,
        cityIndex,
        startedAt,
        endsAt,
        seed: typeof run.seed === 'number' && Number.isFinite(run.seed) ? run.seed >>> 0 : (startedAt >>> 0),
        status,
    };
}
export function normalizeExpeditionRunOrigin(args) {
    const { run, citiesById, currentCityId } = args;
    const validCity = typeof run.cityId === 'string' ? citiesById[run.cityId] : null;
    if (validCity && typeof validCity.index === 'number') {
        return { cityId: validCity.id, cityIndex: validCity.index };
    }
    if (typeof run.cityIndex === 'number' && Number.isFinite(run.cityIndex)) {
        const indexedCity = Object.values(citiesById).find((city) => city.index === run.cityIndex);
        if (indexedCity && typeof indexedCity.index === 'number') {
            return { cityId: indexedCity.id, cityIndex: indexedCity.index };
        }
    }
    const fallbackCity = currentCityId ? citiesById[currentCityId] : null;
    if (fallbackCity && typeof fallbackCity.index === 'number') {
        return { cityId: fallbackCity.id, cityIndex: fallbackCity.index };
    }
    return null;
}
function sanitizeRareProgressByKey(progress) {
    if (!progress)
        return {};
    return Object.fromEntries(Object.entries(progress).filter(([key, value]) => {
        const [typeId, durationId] = key.split('::');
        return Boolean(typeId && durationId && findTypeDef(typeId) && findDurationDef(durationId) && Number.isFinite(value));
    }).map(([key, value]) => [key, Math.max(0, Math.floor(value))]));
}
export const useExpeditionStore = create()(immer((set, get) => ({
    slots: 1,
    active: [],
    rareProgressByKey: {},
    expeditionVersion: 0,
    setSlots: (slots) => {
        const nextSlots = Number.isFinite(slots) ? Math.max(1, Math.floor(slots)) : 1;
        if (nextSlots === get().slots)
            return;
        set((state) => {
            state.slots = nextSlots;
            state.active = state.active.filter((run) => run.slotIndex < nextSlots);
            state.expeditionVersion = bumpVersion(state.expeditionVersion);
        });
    },
    hydrate: (slice, now = Date.now()) => {
        const nextSlots = Number.isFinite(slice?.slots) ? Math.max(1, Math.floor(slice.slots)) : 1;
        const nextActive = Array.isArray(slice?.active)
            ? slice.active
                .map((run) => normalizeHydratedRun(run, nextSlots, now))
                .filter((run) => Boolean(run))
                .filter((run, index, runs) => runs.findIndex((entry) => entry.slotIndex === run.slotIndex) === index)
            : [];
        set((state) => {
            state.slots = nextSlots;
            state.active = nextActive;
            state.rareProgressByKey = sanitizeRareProgressByKey(slice?.rareProgressByKey);
            state.expeditionVersion = bumpVersion(state.expeditionVersion);
        });
    },
    start: (slotIndex, typeId, durationId, cityId, cityIndex) => {
        const { slots, active } = get();
        if (slotIndex < 0 || slotIndex >= slots)
            return false;
        if (active.some((run) => run.slotIndex === slotIndex))
            return false;
        const duration = findDurationDef(durationId);
        const city = useContentStore.getState().maps.citiesById[cityId];
        if (!duration || duration.seconds <= 0 || !city || typeof city.index !== 'number')
            return false;
        const now = Date.now();
        const endsAt = now + duration.seconds * 1000;
        const seed = (Math.random() * 0x100000000) >>> 0;
        const run = {
            slotIndex,
            expeditionTypeId: typeId,
            durationId,
            cityId,
            cityIndex: city.index,
            startedAt: now,
            endsAt,
            seed,
            status: 'running',
        };
        set((state) => {
            state.active.push(run);
            state.expeditionVersion = bumpVersion(state.expeditionVersion);
        });
        GameEvents.emit({
            type: 'expeditions/started',
            payload: {
                timestamp: now,
                slotIndex,
                expeditionTypeId: typeId,
                durationId,
                durationSeconds: duration.seconds,
                cityId,
            },
        });
        return true;
    },
    tick: (now) => {
        const hasReadyTransition = get().active.some((run) => run.status === 'running' && now >= run.endsAt);
        if (!hasReadyTransition)
            return;
        set((state) => {
            state.active.forEach((run) => {
                if (run.status === 'running' && now >= run.endsAt) {
                    run.status = 'complete';
                }
            });
            state.expeditionVersion = bumpVersion(state.expeditionVersion);
        });
    },
    claim: (slotIndex) => {
        const run = get().active.find((entry) => entry.slotIndex === slotIndex);
        if (!run)
            return { ok: false, error: 'not_found' };
        const now = Date.now();
        if (run.status !== 'complete' && now < run.endsAt)
            return { ok: false, error: 'not_complete', run };
        const city = useContentStore.getState().maps.citiesById[run.cityId];
        if (!city || city.index !== run.cityIndex)
            return { ok: false, error: 'invalid_city', run };
        const expected = computeExpectedBundle(run);
        if (!expected)
            return { ok: false, error: 'invalid_yield', run };
        const durationDef = findDurationDef(run.durationId);
        const variancePct = durationDef?.variancePct ?? 0.15;
        const baseRareChance = durationDef?.rareChance ?? 0;
        const pityDefaults = useContentStore.getState().economy?.tuning?.pityDefaults?.expeditionsRare;
        const pityIncrement = pityDefaults?.pityIncrement ?? 0;
        const pityCap = pityDefaults?.pityCap ?? 0;
        const startSeed = typeof run.seed === 'number' ? run.seed >>> 0 : ((run.startedAt ?? Date.now()) >>> 0);
        const varianceResult = rollVariance(expected, variancePct, startSeed);
        const progressKey = `${run.expeditionTypeId}::${run.durationId}`;
        const failuresSoFar = get().rareProgressByKey?.[progressKey] ?? 0;
        let currentSeed = varianceResult.seed;
        let rareDrop = null;
        let rarePityMeta;
        let nextFailures = failuresSoFar;
        if (baseRareChance > 0) {
            const typeDrops = findTypeDef(run.expeditionTypeId)?.rareDrops;
            const hasPity = typeDrops && typeDrops.length > 0 && pityCap > 1;
            if (hasPity) {
                const roll = rollWithPity({
                    baseChance: baseRareChance,
                    pityIncrement,
                    pityCap,
                }, failuresSoFar, currentSeed);
                currentSeed = roll.nextSeed;
                rarePityMeta = { failuresBefore: failuresSoFar, guaranteed: roll.guaranteed, pityCap };
                if (roll.hit) {
                    const pick = pickWeightedRareDrop(run.expeditionTypeId, currentSeed);
                    currentSeed = pick.seed;
                    rareDrop = pick.drop;
                    nextFailures = 0;
                }
                else {
                    nextFailures = roll.nextFailures;
                }
            }
            else if (typeDrops && typeDrops.length > 0) {
                const roll = randFloat(currentSeed);
                currentSeed = roll.seed;
                if (roll.value < baseRareChance) {
                    const pick = pickWeightedRareDrop(run.expeditionTypeId, currentSeed);
                    currentSeed = pick.seed;
                    rareDrop = pick.drop;
                }
            }
        }
        let rolledBundle = varianceResult.bundle;
        if (rareDrop) {
            rolledBundle = collapseRewardBundle(mergeRewardBundles([
                rolledBundle,
                {
                    items: [{ itemId: rareDrop.itemId, qty: rareDrop.qty }],
                },
            ]));
        }
        const spotlightItemId = selectBestDropSpotlight(rolledBundle, rareDrop);
        RewardService.grantRewards(rolledBundle, `expedition_claim:${run.expeditionTypeId}:${run.durationId}:city=${run.cityId}`);
        useBountyStore.getState().recordEvent({
            type: 'EXPEDITION_COMPLETE',
            cityId: getExpeditionBountyCreditCityId(run),
            amount: 1,
        });
        if (rareDrop) {
            const itemName = useContentStore.getState().maps.itemsById[rareDrop.itemId]?.name ?? rareDrop.itemId;
            const message = rarePityMeta?.guaranteed
                ? `Rare expedition reward (guaranteed)! ${itemName}`
                : `Rare expedition reward! ${itemName}`;
            useUIStore.getState().addNotification('success', message, { durationMs: 2000 });
        }
        set((state) => {
            state.active = state.active.filter((entry) => entry.slotIndex !== slotIndex);
            if (pityCap > 1) {
                state.rareProgressByKey[progressKey] = Math.min(Math.max(0, nextFailures), Math.max(0, pityCap - 1));
            }
            state.expeditionVersion = bumpVersion(state.expeditionVersion);
        });
        GameEvents.emit({
            type: 'expeditions/claimed',
            payload: {
                timestamp: now,
                slotIndex,
                expeditionTypeId: run.expeditionTypeId,
                durationId: run.durationId,
                cityId: run.cityId,
                rareDropItemId: rareDrop?.itemId,
                rolled: rolledBundle,
            },
        });
        return {
            ok: true,
            run,
            expected,
            rolled: rolledBundle,
            rareDrop,
            spotlightItemId,
            rarePity: rarePityMeta,
        };
    },
})));
