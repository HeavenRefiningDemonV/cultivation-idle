import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RewardService } from '../services/rewards/index.js';
import { greaterThanOrEqualTo, multiply } from '../utils/numbers.js';
import { getForgeBlueprint } from './contentStore.js';
import { useInventoryStore } from './inventoryStore.js';
import { useContentStore } from './contentStore.js';
import { getLiveAlchemyRecipeById } from '../systems/economy/index.js';
import { useRecipeMasteryStore } from './recipeMasteryStore.js';
import { buildAlchemyOutputs, getAlchemyTimeMultiplier, getIdleYieldMultiplierForMastery } from '../systems/crafting/alchemyBonuses.js';
import { applyRefineService, applyTemperService } from '../services/forgeService.js';
import { useCityStore } from './cityStore.js';
import { useBountyStore } from './bountyStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { useActivityStore } from './activityStore.js';
import { useCraftSessionStore } from './craftSessionStore.js';
import { fromForgeJobMode, isForgeModeAllowed } from '../systems/forge/index.js';
const makeJobId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const hashSeed = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};
const MAX_ALCHEMY_QTY = 999;
const MAX_TALISMAN_QTY = 999;
const MAX_FORGE_QTY = 999;
const DEFAULT_FORGE_PERFORMANCE = 0.6;
const ASSISTED_FORGE_PERFORMANCE = 0.7;
const resolveForgeMode = (value) => {
    if (value === 'ASSISTED' || value === 'HANDS_ON' || value === 'IDLE')
        return value;
    return 'IDLE';
};
const resolveForgeStatus = (value, fallback) => {
    if (value === 'QUEUED' || value === 'ACTIVE' || value === 'READY_TO_CLAIM' || value === 'CLAIMED')
        return value;
    return fallback;
};
const buildBaselinePerformance = (mode, qualityOverride) => {
    const base = mode === 'ASSISTED' ? ASSISTED_FORGE_PERFORMANCE : DEFAULT_FORGE_PERFORMANCE;
    const qualityScore = typeof qualityOverride === 'number' ? qualityOverride : Math.round(base * 100);
    return {
        heatScore: base,
        hammerScore: base,
        specialScore: base,
        qualityScore,
    };
};
const computePerformanceQuality = (performance) => {
    if (!performance)
        return buildBaselinePerformance('IDLE');
    const values = [];
    if (typeof performance.heatScore === 'number')
        values.push(performance.heatScore);
    if (typeof performance.hammerScore === 'number')
        values.push(performance.hammerScore);
    if (typeof performance.specialScore === 'number')
        values.push(performance.specialScore);
    const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : DEFAULT_FORGE_PERFORMANCE;
    const clamped = Math.max(0, Math.min(1, average));
    return {
        ...performance,
        heatScore: performance.heatScore ?? clamped,
        hammerScore: performance.hammerScore ?? clamped,
        specialScore: performance.specialScore ?? clamped,
        qualityScore: performance.qualityScore ?? Math.round(clamped * 100),
    };
};
const getForgeStepScore = (entry) => {
    switch (entry.type) {
        case 'HEAT_MATERIAL':
        case 'HEAT_TO':
        case 'HAMMER_PATTERN':
        case 'ENGRAVE_RUNE':
        case 'LAY_FORMATION':
            return entry.timingScore;
        default:
            return undefined;
    }
};
const resolveForgeTimingStatus = (job, now) => {
    const mode = resolveForgeMode(job.mode);
    if (mode === 'HANDS_ON') {
        return resolveForgeStatus(job.status, 'ACTIVE');
    }
    const startedAt = Number.isFinite(job.startedAt) ? job.startedAt : now;
    const endsAt = Number.isFinite(job.endsAt) ? job.endsAt : startedAt;
    if (now < startedAt)
        return 'QUEUED';
    if (now >= endsAt)
        return 'READY_TO_CLAIM';
    return 'ACTIVE';
};
const resolveTemperBonusChance = (blueprint, performance) => {
    if (!blueprint?.handsOnBonus?.temperProcChancePct)
        return 0;
    const score = (performance.qualityScore ?? Math.round(DEFAULT_FORGE_PERFORMANCE * 100)) / 100;
    return blueprint.handsOnBonus.temperProcChancePct * Math.max(0, Math.min(1, score));
};
const currencyLabels = {
    gold: 'Gold',
    spiritStones: 'Spirit Stones',
    merit: 'Merit',
};
const resolveActiveCityId = () => {
    const cityState = useCityStore.getState();
    return cityState.currentCityId ?? cityState.unlockedCityIds[0] ?? null;
};
export const useProfessionStore = create()(immer((set, get) => ({
    alchemyQueue: [],
    talismanQueue: [],
    forgeQueue: [],
    lastTickAt: 0,
    startAlchemy: (recipeId, qty) => {
        const parsedQty = Math.floor(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
            return { ok: false, error: 'Invalid quantity' };
        }
        const amount = Math.min(parsedQty, MAX_ALCHEMY_QTY);
        const contentStore = useContentStore.getState();
        const recipe = getLiveAlchemyRecipeById(contentStore.raw, recipeId);
        if (!recipe) {
            return { ok: false, error: 'Recipe not found' };
        }
        const durationSec = recipe.timeSec ?? recipe.craftTimeSec;
        if (!Number.isFinite(durationSec) || durationSec <= 0) {
            return { ok: false, error: 'Invalid recipe time' };
        }
        const cityId = resolveActiveCityId();
        if (!cityId) {
            return { ok: false, error: 'Select a city first' };
        }
        const mastery = useRecipeMasteryStore.getState().getAlchemyMastery(recipeId);
        const timeMultiplier = getAlchemyTimeMultiplier(mastery);
        const inventory = useInventoryStore.getState();
        const inputs = recipe.inputs ?? {};
        for (const [itemId, baseQty] of Object.entries(inputs)) {
            const perJob = Math.floor(baseQty);
            if (!Number.isFinite(perJob) || perJob <= 0)
                continue;
            const requiredQty = perJob * amount;
            const currentQty = inventory.getQty(itemId);
            if (currentQty < requiredQty) {
                const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
                return { ok: false, error: `Not enough ${itemName}` };
            }
        }
        const costsRaw = recipe.costs ?? {};
        const costs = {};
        Object.keys(costsRaw).forEach((key) => {
            const raw = costsRaw[key];
            if (raw === undefined || raw === null)
                return;
            try {
                costs[key] = multiply(raw, amount).toString();
            }
            catch (error) {
                console.warn('[ProfessionStore] Failed to calculate cost', error);
            }
        });
        for (const key of Object.keys(costs)) {
            const required = costs[key];
            if (!required)
                continue;
            if (!inventory.canAffordCurrency({ [key]: required })) {
                return { ok: false, error: `Not enough ${currencyLabels[key]}` };
            }
        }
        const removedItems = [];
        for (const [itemId, baseQty] of Object.entries(inputs)) {
            const perJob = Math.floor(baseQty);
            if (!Number.isFinite(perJob) || perJob <= 0)
                continue;
            const requiredQty = perJob * amount;
            const removed = inventory.removeItem(itemId, requiredQty);
            if (!removed) {
                removedItems.forEach((entry) => {
                    inventory.addItem(entry.itemId, entry.qty);
                });
                const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
                return { ok: false, error: `Missing ${itemName}` };
            }
            removedItems.push({ itemId, qty: requiredQty });
        }
        if (Object.keys(costs).length > 0) {
            const spent = RewardService.spendCurrency(costs, `alchemy_queue:${recipeId}`);
            if (!spent) {
                removedItems.forEach((entry) => {
                    inventory.addItem(entry.itemId, entry.qty);
                });
                return { ok: false, error: 'Missing currency' };
            }
        }
        if (removedItems.length > 0) {
            GameEvents.emit({
                type: 'economy/items_spent',
                payload: { items: removedItems, reason: `alchemy_queue:${recipeId}`, module: 'profession.alchemyQueue' },
            });
        }
        const durationMs = durationSec * amount * timeMultiplier * 1000;
        const now = Date.now();
        const lastJob = get().alchemyQueue.at(-1);
        const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
        const endsAt = startedAt + durationMs;
        set((state) => {
            state.alchemyQueue.push({
                id: makeJobId(),
                recipeId,
                qty: amount,
                startedAt,
                endsAt,
                cityId,
            });
        });
        GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'alchemy', sourceId: recipeId, qty: amount } });
        return { ok: true };
    },
    startTalisman: (recipeId, qty) => {
        const parsedQty = Math.floor(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
            return { ok: false, error: 'Invalid quantity' };
        }
        const amount = Math.min(parsedQty, MAX_TALISMAN_QTY);
        const contentStore = useContentStore.getState();
        const recipe = contentStore.raw?.talisman_recipes?.find((entry) => entry.id === recipeId);
        if (!recipe) {
            return { ok: false, error: 'Recipe not found' };
        }
        if (recipe.station && recipe.station !== 'talisman') {
            return { ok: false, error: 'Invalid station' };
        }
        const durationSec = recipe.timeSec ?? recipe.timeSeconds;
        if (!Number.isFinite(durationSec) || durationSec < 0) {
            return { ok: false, error: 'Invalid recipe time' };
        }
        const cityId = resolveActiveCityId();
        if (!cityId) {
            return { ok: false, error: 'Select a city first' };
        }
        const inventory = useInventoryStore.getState();
        const inputs = recipe.inputs ?? {};
        for (const [itemId, baseQty] of Object.entries(inputs)) {
            const perJob = Math.floor(baseQty);
            if (!Number.isFinite(perJob) || perJob <= 0)
                continue;
            const requiredQty = perJob * amount;
            const currentQty = inventory.getQty(itemId);
            if (currentQty < requiredQty) {
                const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
                return { ok: false, error: `Not enough ${itemName}` };
            }
        }
        const costsRaw = recipe.costs ??
            recipe.cost ??
            {};
        const costs = {};
        Object.keys(costsRaw).forEach((key) => {
            const raw = costsRaw[key];
            if (raw === undefined || raw === null)
                return;
            try {
                costs[key] = multiply(Math.max(0, raw), amount).toString();
            }
            catch (error) {
                console.warn('[ProfessionStore] Failed to calculate talisman cost', error);
            }
        });
        for (const key of Object.keys(costs)) {
            const required = costs[key];
            if (!required)
                continue;
            if (!inventory.canAffordCurrency({ [key]: required })) {
                return { ok: false, error: `Not enough ${currencyLabels[key]}` };
            }
        }
        const removedItems = [];
        for (const [itemId, baseQty] of Object.entries(inputs)) {
            const perJob = Math.floor(baseQty);
            if (!Number.isFinite(perJob) || perJob <= 0)
                continue;
            const requiredQty = perJob * amount;
            const removed = inventory.removeItem(itemId, requiredQty);
            if (!removed) {
                removedItems.forEach((entry) => {
                    inventory.addItem(entry.itemId, entry.qty);
                });
                const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
                return { ok: false, error: `Missing ${itemName}` };
            }
            removedItems.push({ itemId, qty: requiredQty });
        }
        if (Object.keys(costs).length > 0) {
            const spent = RewardService.spendCurrency(costs, `talisman_queue:${recipeId}`);
            if (!spent) {
                removedItems.forEach((entry) => {
                    inventory.addItem(entry.itemId, entry.qty);
                });
                return { ok: false, error: 'Missing currency' };
            }
        }
        if (removedItems.length > 0) {
            GameEvents.emit({
                type: 'economy/items_spent',
                payload: { items: removedItems, reason: `talisman_queue:${recipeId}`, module: 'profession.talismanQueue' },
            });
        }
        const durationMs = Math.max(0, durationSec) * amount * 1000;
        const now = Date.now();
        const lastJob = get().talismanQueue.at(-1);
        const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
        const endsAt = startedAt + durationMs;
        set((state) => {
            state.talismanQueue.push({
                id: makeJobId(),
                recipeId,
                qty: amount,
                startedAt,
                endsAt,
                cityId,
            });
        });
        GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'talisman', sourceId: recipeId, qty: amount } });
        return { ok: true };
    },
    canStartForge: (blueprintId, qty, targetSlot) => {
        const parsedQty = Math.floor(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
            return { ok: false, reason: 'Invalid quantity' };
        }
        const amount = Math.min(parsedQty, MAX_FORGE_QTY);
        const blueprint = getForgeBlueprint(blueprintId);
        if (!blueprint) {
            return { ok: false, reason: 'Blueprint not found' };
        }
        if (blueprint.type === 'craft' && !blueprint.output?.itemId) {
            return { ok: false, reason: 'Missing output' };
        }
        if (blueprint.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper')) {
            if (!targetSlot || (targetSlot !== 'weapon' && targetSlot !== 'accessory')) {
                return { ok: false, reason: 'Select a target slot' };
            }
        }
        else if (blueprint.type === 'service') {
            return { ok: false, reason: 'Unsupported service' };
        }
        if (!isForgeModeAllowed(blueprint, fromForgeJobMode('IDLE'))) {
            return { ok: false, reason: 'Blueprint is not available this semester' };
        }
        const inventory = useInventoryStore.getState();
        const contentStore = useContentStore.getState();
        for (const entry of blueprint.costs.items) {
            if (!entry || !entry.itemId)
                continue;
            const required = Math.max(0, Math.floor(entry.qty)) * amount;
            if (required <= 0)
                continue;
            if (inventory.getQty(entry.itemId) < required) {
                const itemName = contentStore.maps.itemsById[entry.itemId]?.name ?? entry.itemId;
                return { ok: false, reason: `Need ${required} ${itemName}` };
            }
        }
        const goldCost = Math.max(0, blueprint.costs.gold) * amount;
        const spiritStoneCost = Math.max(0, blueprint.costs.spiritStones) * amount;
        if (goldCost > 0 && !greaterThanOrEqualTo(inventory.currencies.gold ?? '0', goldCost)) {
            return { ok: false, reason: `Need ${goldCost} Gold` };
        }
        if (spiritStoneCost > 0 && !greaterThanOrEqualTo(inventory.currencies.spiritStones ?? '0', spiritStoneCost)) {
            return { ok: false, reason: `Need ${spiritStoneCost} Spirit Stones` };
        }
        return { ok: true };
    },
    startForgeJob: ({ blueprintId, mode, qty = 1, targetSlot }) => {
        const parsedQty = Math.floor(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
            return { ok: false, error: 'Invalid quantity' };
        }
        const amount = Math.min(parsedQty, MAX_FORGE_QTY);
        const resolvedMode = resolveForgeMode(mode);
        const blueprint = getForgeBlueprint(blueprintId);
        if (!blueprint) {
            return { ok: false, error: 'Blueprint not found' };
        }
        if (blueprint.type === 'craft' && !blueprint.output?.itemId) {
            return { ok: false, error: 'Missing output' };
        }
        if (blueprint.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper')) {
            if (!targetSlot || (targetSlot !== 'weapon' && targetSlot !== 'accessory')) {
                return { ok: false, error: 'Select a target slot' };
            }
        }
        else if (blueprint.type === 'service') {
            return { ok: false, error: 'Unsupported service' };
        }
        if (!isForgeModeAllowed(blueprint, fromForgeJobMode(resolvedMode))) {
            return { ok: false, error: `${blueprint.name ?? blueprint.id} does not support that forge mode` };
        }
        const cityId = resolveActiveCityId();
        if (!cityId) {
            return { ok: false, error: 'Select a city first' };
        }
        const activityStore = useActivityStore.getState();
        if (resolvedMode === 'HANDS_ON' && activityStore.active && activityStore.active.type !== 'forge') {
            return { ok: false, error: 'Finish the current activity first' };
        }
        const craftSessionStore = useCraftSessionStore.getState();
        if (resolvedMode === 'HANDS_ON' && craftSessionStore.activeSession) {
            return { ok: false, error: 'Another crafting session is active' };
        }
        const inventory = useInventoryStore.getState();
        const contentStore = useContentStore.getState();
        for (const entry of blueprint.costs.items) {
            if (!entry || !entry.itemId)
                continue;
            const required = Math.max(0, Math.floor(entry.qty)) * amount;
            if (required <= 0)
                continue;
            if (inventory.getQty(entry.itemId) < required) {
                const itemName = contentStore.maps.itemsById[entry.itemId]?.name ?? entry.itemId;
                return { ok: false, error: `Need ${required} ${itemName}` };
            }
        }
        const goldCost = Math.max(0, blueprint.costs.gold) * amount;
        const spiritStoneCost = Math.max(0, blueprint.costs.spiritStones) * amount;
        const costs = {};
        if (goldCost > 0)
            costs.gold = goldCost.toString();
        if (spiritStoneCost > 0)
            costs.spiritStones = spiritStoneCost.toString();
        for (const key of Object.keys(costs)) {
            const required = costs[key];
            if (!required)
                continue;
            if (!inventory.canAffordCurrency({ [key]: required })) {
                return { ok: false, error: `Not enough ${currencyLabels[key]}` };
            }
        }
        const removedItems = [];
        for (const entry of blueprint.costs.items) {
            const perJob = Math.max(0, Math.floor(entry.qty));
            if (!entry.itemId || perJob <= 0)
                continue;
            const requiredQty = perJob * amount;
            const removed = inventory.spendItem(entry.itemId, requiredQty);
            if (!removed) {
                removedItems.forEach((item) => {
                    inventory.addItem(item.itemId, item.qty);
                });
                return { ok: false, error: `Missing ${entry.itemId}` };
            }
            removedItems.push({ itemId: entry.itemId, qty: requiredQty });
        }
        if (Object.keys(costs).length > 0) {
            const spent = RewardService.spendCurrency(costs, `forge:${blueprintId}`);
            if (!spent) {
                removedItems.forEach((item) => {
                    inventory.addItem(item.itemId, item.qty);
                });
                return { ok: false, error: 'Missing currency' };
            }
        }
        const now = Date.now();
        let sessionId;
        if (resolvedMode === 'HANDS_ON') {
            const sessionResult = craftSessionStore.startSession({
                station: 'forge',
                mode: 'handsOn',
                sourceId: blueprintId,
                qty: amount,
                now,
                skipPayment: true,
            });
            if (!sessionResult.ok) {
                removedItems.forEach((item) => {
                    inventory.addItem(item.itemId, item.qty);
                });
                if (Object.keys(costs).length > 0) {
                    Object.keys(costs).forEach((key) => {
                        const refund = costs[key];
                        if (refund)
                            inventory.addCurrency(key, refund);
                    });
                }
                return { ok: false, error: `Cannot start session: ${sessionResult.reason}` };
            }
            sessionId = sessionResult.sessionId;
            activityStore.startActivity('forge', { cityId, sourceId: blueprintId, jobId: sessionId }, 'forge_session_start');
        }
        const durationMs = Math.max(0, blueprint.timeSec) * amount * 1000;
        const lastJob = get().forgeQueue.at(-1);
        const scheduledStart = lastJob ? Math.max(now, lastJob.endsAt) : now;
        const startedAt = resolvedMode === 'HANDS_ON' ? now : scheduledStart;
        const endsAt = resolvedMode === 'HANDS_ON' ? now : startedAt + durationMs;
        const status = resolveForgeTimingStatus({ ...{}, mode: resolvedMode, startedAt, endsAt }, now);
        const jobId = makeJobId();
        set((state) => {
            state.forgeQueue.push({
                id: jobId,
                blueprintId,
                qty: amount,
                startedAt,
                endsAt,
                targetSlot,
                cityId,
                mode: resolvedMode,
                status,
                sessionId,
            });
        });
        GameEvents.emit({ type: 'crafting/queue_added', payload: { station: 'forge', sourceId: blueprintId, qty: amount } });
        return { ok: true, result: { jobId, sessionId } };
    },
    completeForgeSession: ({ sessionId, performance }) => {
        const job = get().forgeQueue.find((entry) => entry.sessionId === sessionId);
        if (!job) {
            return { ok: false, error: 'Forge session not found' };
        }
        const craftSessionStore = useCraftSessionStore.getState();
        const activeSession = craftSessionStore.activeSession;
        let outcomePerformance = performance;
        let outcomeResult = null;
        if (!outcomePerformance && activeSession && activeSession.sessionId === sessionId) {
            const result = craftSessionStore.completeHandsOnSession(Date.now());
            if (!result.ok || !result.result || !('scoreOverall' in result.result)) {
                return { ok: false, error: 'Unable to complete session' };
            }
            const outcome = result.result;
            outcomeResult = outcome;
            outcomePerformance = {
                heatScore: outcome.heatScore,
                hammerScore: outcome.hammerScore,
                specialScore: outcome.temperScore,
                qualityScore: Math.round(outcome.scoreOverall * 100),
                stepBreakdown: activeSession.cursor.forgeStepResults?.map((entry) => ({
                    stepId: entry.stepId,
                    type: entry.type,
                    score: getForgeStepScore(entry),
                })),
            };
        }
        if (performance && activeSession && activeSession.sessionId === sessionId) {
            useCraftSessionStore.setState({ activeSession: null });
        }
        const finalPerformance = computePerformanceQuality(outcomePerformance ?? buildBaselinePerformance('HANDS_ON'));
        const now = Date.now();
        set((state) => {
            state.forgeQueue = state.forgeQueue.map((entry) => entry.id === job.id
                ? {
                    ...entry,
                    status: 'READY_TO_CLAIM',
                    performance: finalPerformance,
                    endsAt: now,
                }
                : entry);
        });
        useActivityStore.getState().stopActivity('forge_complete');
        return { ok: true, result: { performance: finalPerformance, outcome: outcomeResult } };
    },
    claimForgeJob: (jobId) => {
        const job = get().forgeQueue.find((entry) => entry.id === jobId);
        if (!job) {
            return { ok: false, error: 'Job not found' };
        }
        const now = Date.now();
        const status = resolveForgeTimingStatus(job, now);
        if (status !== 'READY_TO_CLAIM' && status !== 'CLAIMED') {
            return { ok: false, error: 'Job not ready' };
        }
        const blueprint = getForgeBlueprint(job.blueprintId);
        if (!blueprint) {
            return { ok: false, error: 'Blueprint not found' };
        }
        const mode = resolveForgeMode(job.mode);
        const performance = computePerformanceQuality(job.performance ?? buildBaselinePerformance(mode));
        const reason = mode === 'ASSISTED'
            ? 'forge/complete_assisted'
            : mode === 'HANDS_ON'
                ? 'forge/complete_hands_on'
                : 'forge/complete_idle';
        let serviceResult = null;
        const resultSnapshot = {};
        if (blueprint.type === 'craft') {
            const outputItem = blueprint.output?.itemId;
            const outputQty = blueprint.output?.qty ?? 1;
            if (outputItem) {
                const items = [{ itemId: outputItem, qty: Math.max(1, Math.floor(outputQty)) * job.qty }];
                RewardService.grantRewards({ items }, reason);
                resultSnapshot.outputItemId = outputItem;
                resultSnapshot.outputBundle = { items };
            }
            else {
                RewardService.grantRewards({}, reason);
            }
        }
        if (blueprint.type === 'service' && job.targetSlot) {
            if (blueprint.service === 'refine') {
                serviceResult = applyRefineService({ blueprint, slot: job.targetSlot, qty: job.qty });
                if (!serviceResult.success) {
                    GameEvents.emit({ type: 'forge/refine_result', payload: { ok: false } });
                    return { ok: false, error: 'Refine failed' };
                }
            }
            else if (blueprint.service === 'temper') {
                const seed = Math.abs(hashSeed(job.id));
                serviceResult = applyTemperService({
                    blueprint,
                    slot: job.targetSlot,
                    qty: job.qty,
                    seed,
                    bonusChancePct: resolveTemperBonusChance(blueprint, performance),
                });
            }
            if (serviceResult) {
                resultSnapshot.beforeItem = { ...serviceResult.beforeStats };
                resultSnapshot.afterItem = { ...serviceResult.afterStats };
            }
            RewardService.grantRewards({}, reason);
        }
        set((state) => {
            state.forgeQueue = state.forgeQueue.filter((entry) => entry.id !== jobId);
        });
        GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'forge', sourceId: job.blueprintId, qty: job.qty } });
        if (blueprint.type === 'craft') {
            GameEvents.emit({ type: 'forge/rune_craft_result', payload: { ok: true } });
        }
        if (serviceResult?.type === 'refine') {
            GameEvents.emit({ type: 'forge/refine_result', payload: { ok: Boolean(serviceResult.success) } });
        }
        if (serviceResult?.type === 'temper') {
            GameEvents.emit({ type: 'forge/temper_result', payload: { ok: Boolean(serviceResult.success) } });
        }
        const cityId = job.cityId ??
            useCityStore.getState().currentCityId ??
            useCityStore.getState().unlockedCityIds[0] ??
            'city_pinewind_hamlet';
        useBountyStore.getState().recordEvent({ type: 'CRAFT_COMPLETE', cityId, amount: 1 });
        return {
            ok: true,
            result: {
                jobId: job.id,
                blueprintId: job.blueprintId,
                mode,
                performance,
                resultSnapshot,
                serviceResult,
            },
        };
    },
    startForge: (blueprintId, qty, options) => get().startForgeJob({
        blueprintId,
        mode: 'IDLE',
        qty,
        targetSlot: options?.targetSlot,
    }),
    tick: (now) => {
        const lastTickAt = get().lastTickAt;
        if (now === lastTickAt)
            return;
        if (now < lastTickAt) {
            set({ lastTickAt: now });
            return;
        }
        set({ lastTickAt: now });
    },
    applyOffline: (now) => {
        get().tick(now);
        const craftSession = useCraftSessionStore.getState().activeSession;
        const activeForgeSession = craftSession && craftSession.station === 'forge' && craftSession.mode === 'handsOn' ? craftSession : null;
        let shouldClearForgeSession = false;
        let sawForgeSessionMatch = false;
        set((state) => {
            state.forgeQueue = state.forgeQueue.map((job) => {
                const mode = resolveForgeMode(job.mode);
                let status = resolveForgeTimingStatus(job, now);
                let performance = job.performance;
                let endsAt = job.endsAt;
                if (mode === 'HANDS_ON') {
                    if (activeForgeSession && job.sessionId === activeForgeSession.sessionId) {
                        sawForgeSessionMatch = true;
                        if (status === 'ACTIVE') {
                            status = 'READY_TO_CLAIM';
                            performance = buildBaselinePerformance('HANDS_ON');
                            endsAt = now;
                            shouldClearForgeSession = true;
                        }
                    }
                    else if (!activeForgeSession && status === 'ACTIVE') {
                        status = 'READY_TO_CLAIM';
                        performance = buildBaselinePerformance('HANDS_ON');
                        endsAt = now;
                    }
                }
                return {
                    ...job,
                    mode,
                    status,
                    performance,
                    endsAt,
                };
            });
        });
        if (activeForgeSession && !sawForgeSessionMatch) {
            shouldClearForgeSession = true;
        }
        if (shouldClearForgeSession) {
            useCraftSessionStore.setState({ activeSession: null });
            useActivityStore.getState().stopActivity('forge_offline');
        }
    },
    claimAlchemy: (jobId) => {
        const job = get().alchemyQueue.find((entry) => entry.id === jobId);
        if (!job) {
            return { ok: false, error: 'Job not found' };
        }
        const now = Date.now();
        if (now < job.endsAt) {
            return { ok: false, error: 'Job not ready' };
        }
        const recipe = useContentStore.getState().raw?.alchemy_recipes?.find((entry) => entry.id === job.recipeId);
        if (!recipe) {
            return { ok: false, error: 'Recipe not found' };
        }
        const mastery = useRecipeMasteryStore.getState().getAlchemyMastery(job.recipeId);
        const items = buildAlchemyOutputs(recipe.outputs, job.qty, getIdleYieldMultiplierForMastery(mastery));
        if (items.length > 0) {
            RewardService.grantRewards({ items }, `Alchemy: ${job.recipeId}`);
        }
        useRecipeMasteryStore.getState().gainAlchemyMastery(job.recipeId, job.qty, 'idle');
        set((state) => {
            state.alchemyQueue = state.alchemyQueue.filter((entry) => entry.id !== jobId);
        });
        GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'alchemy', sourceId: job.recipeId, qty: job.qty } });
        const cityId = job.cityId ??
            useCityStore.getState().currentCityId ??
            useCityStore.getState().unlockedCityIds[0] ??
            'city_pinewind_hamlet';
        useBountyStore.getState().recordEvent({ type: 'CRAFT_COMPLETE', cityId, amount: 1 });
        // Manual test checklist:
        // - Queue an Alchemy job in City A, switch cities, and claim to ensure progress counts for City A.
        // - Start an expedition in City A, complete and claim to increment City A's bounty progress.
        // - Reload to confirm tracked bounty and job cityId persist.
        return { ok: true };
    },
    claimTalisman: (jobId) => {
        const job = get().talismanQueue.find((entry) => entry.id === jobId);
        if (!job) {
            return { ok: false, error: 'Job not found' };
        }
        const now = Date.now();
        if (now < job.endsAt) {
            return { ok: false, error: 'Job not ready' };
        }
        const recipe = useContentStore.getState().raw?.talisman_recipes?.find((entry) => entry.id === job.recipeId);
        if (!recipe) {
            return { ok: false, error: 'Recipe not found' };
        }
        const outputs = recipe.outputs ?? {};
        const items = Object.entries(outputs)
            .map(([itemId, baseQty]) => {
            const perJob = Math.floor(baseQty);
            if (!Number.isFinite(perJob) || perJob <= 0)
                return null;
            return { itemId, qty: perJob * job.qty };
        })
            .filter((entry) => Boolean(entry));
        if (items.length > 0) {
            RewardService.grantRewards({ items }, `Talisman: ${job.recipeId}`);
        }
        set((state) => {
            state.talismanQueue = state.talismanQueue.filter((entry) => entry.id !== jobId);
        });
        GameEvents.emit({ type: 'crafting/queue_completed', payload: { station: 'talisman', sourceId: job.recipeId, qty: job.qty } });
        GameEvents.emit({ type: 'talisman/craft_result', payload: { ok: true } });
        return { ok: true };
    },
    claimForge: (jobId) => get().claimForgeJob(jobId),
    getForgeJobs: () => get().forgeQueue,
    getForgeJobStatus: (job, now = Date.now()) => {
        const status = resolveForgeTimingStatus(job, now);
        const mode = resolveForgeMode(job.mode);
        const remainingMs = mode === 'HANDS_ON' ? 0 : Math.max(0, job.endsAt - now);
        return {
            done: status === 'READY_TO_CLAIM',
            remainingSec: Math.ceil(remainingMs / 1000),
            status,
        };
    },
})));
