import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { RewardService } from '../services/rewards/index.js';
import { useUIStore } from './uiStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { buildLiveBountyDescription, getCanonicalLiveBountyDifficultyOrder, getBountyKindKey, getSupportTemplateCityIndexById, getTemplatesForLiveBountySlot, isLiveBountyBoard, selectLiveBountyTemplate, } from '../systems/bounties/liveBountyBoard.js';
import { LIVE_BOUNTY_BOARD_SIZE } from '../systems/world/bountyBoardContract.js';
function createUuid() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function rollRange([min, max]) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
}
function buildEventTargetLookup() {
    return {
        OUTSKIRTS_KILL: {
            easy: [10, 15],
            medium: [20, 30],
            hard: [35, 50],
        },
        OUTSKIRTS_BOSS_KILL: {
            easy: [1, 1],
            medium: [1, 1],
            hard: [1, 2],
        },
        RUINS_ROOM_CLEAR: {
            easy: [3, 5],
            medium: [6, 8],
            hard: [9, 12],
        },
        RUINS_RUN_CLEAR: {
            easy: [1, 1],
            medium: [1, 2],
            hard: [2, 3],
        },
        CRAFT_COMPLETE: {
            easy: [1, 2],
            medium: [2, 4],
            hard: [4, 6],
        },
        EXPEDITION_COMPLETE: {
            easy: [1, 2],
            medium: [2, 3],
            hard: [3, 5],
        },
    };
}
const EVENT_TARGET_LOOKUP = buildEventTargetLookup();
export function isRuntimeBountyKind(kind) {
    return [
        'OUTSKIRTS_KILL',
        'OUTSKIRTS_BOSS_KILL',
        'RUINS_ROOM_CLEAR',
        'RUINS_RUN_CLEAR',
        'CRAFT_COMPLETE',
        'EXPEDITION_COMPLETE',
    ].includes(kind);
}
export function sanitizeStoredBountyState(input) {
    const activeByCityId = Object.fromEntries(Object.entries(input.activeByCityId ?? {}).map(([cityId, board]) => [
        cityId,
        (Array.isArray(board) ? board : []).filter((entry) => isRuntimeBountyKind(entry.kind)),
    ]));
    const trackedByCityId = Object.fromEntries(Object.entries(input.trackedByCityId ?? {}).map(([cityId, trackedId]) => {
        const exists = activeByCityId[cityId]?.some((entry) => entry.instanceId === trackedId) ?? false;
        return [cityId, exists ? trackedId : null];
    }));
    return { activeByCityId, trackedByCityId };
}
function buildRewardBundle(range) {
    const gold = rollRange(range.gold);
    const merit = rollRange(range.merit);
    const spiritStones = rollRange(range.spiritStones);
    const currencies = {};
    if (gold > 0)
        currencies.gold = gold.toString();
    if (merit > 0)
        currencies.merit = merit.toString();
    if (spiritStones > 0)
        currencies.spiritStones = spiritStones.toString();
    return { currencies };
}
function findRewardTierForCity(cityIndex, rewardTiers) {
    const entries = Object.entries(rewardTiers)
        .map(([key, value]) => ({ index: Number(key), value }))
        .filter((entry) => Number.isFinite(entry.index))
        .sort((a, b) => a.index - b.index);
    if (entries.length === 0)
        return null;
    const exact = entries.find((entry) => entry.index === cityIndex);
    if (exact)
        return exact.value;
    const lower = entries.filter((entry) => entry.index <= cityIndex);
    if (lower.length > 0)
        return lower[lower.length - 1].value;
    return entries[0].value;
}
function buildBounties(cityId, cityIndex, cityModules, refreshSeed = 0) {
    const bountyConfig = useContentStore.getState().raw?.bounties;
    if (!bountyConfig)
        return [];
    const templates = bountyConfig.templates ?? [];
    if (!Array.isArray(templates) || templates.length === 0)
        return [];
    const rewardByCity = bountyConfig.rewardTiersByCityIndex
        ? findRewardTierForCity(cityIndex, bountyConfig.rewardTiersByCityIndex)
        : null;
    if (!rewardByCity)
        return [];
    const createdAt = Date.now();
    const difficultyOrder = getCanonicalLiveBountyDifficultyOrder();
    return difficultyOrder.map((difficulty, slotIndex) => {
        const slotTemplates = getTemplatesForLiveBountySlot({
            templates,
            slotIndex,
            cityId,
            cityIndex,
            cityModules,
        });
        const template = selectLiveBountyTemplate({ templates: slotTemplates, slotIndex, cityIndex, refreshSeed });
        if (!template)
            return null;
        const fallbackTargets = EVENT_TARGET_LOOKUP[template.kind]?.[difficulty] ?? [1, 1];
        const target = template.targets?.[difficulty] ?? rollRange(fallbackTargets);
        const description = buildLiveBountyDescription(template, target);
        const rewards = buildRewardBundle(rewardByCity[difficulty]);
        return {
            instanceId: createUuid(),
            cityId,
            cityIndex,
            templateId: template.id,
            difficulty,
            kind: getBountyKindKey(template.kind),
            title: template.name,
            description,
            progress: 0,
            target,
            claimed: false,
            rewards,
            createdAt,
        };
    }).filter((entry) => Boolean(entry));
}
export const useBountyStore = create()(immer((set, get) => ({
    activeByCityId: {},
    lastRefreshAtByCityId: {},
    trackedByCityId: {},
    generateForCity: (cityId, cityIndex) => {
        const city = useContentStore.getState().maps.citiesById[cityId];
        const cityModules = city?.modules ?? [];
        const existing = get().activeByCityId[cityId];
        const supportTemplateCityIndexById = getSupportTemplateCityIndexById(useContentStore.getState().raw?.bounties?.templates ?? []);
        if (isLiveBountyBoard({ board: existing, cityId, cityIndex, cityModules, supportTemplateCityIndexById }))
            return;
        const refreshSeed = Math.floor((get().lastRefreshAtByCityId[cityId] ?? 0) / 1000);
        const next = buildBounties(cityId, cityIndex, cityModules, refreshSeed);
        if (next.length !== LIVE_BOUNTY_BOARD_SIZE)
            return;
        set((state) => {
            state.activeByCityId[cityId] = next;
            if (!(cityId in state.lastRefreshAtByCityId)) {
                state.lastRefreshAtByCityId[cityId] = Date.now();
            }
            const tracked = state.trackedByCityId[cityId];
            if (!(cityId in state.trackedByCityId) || (tracked && !next.find((entry) => entry.instanceId === tracked))) {
                state.trackedByCityId[cityId] = null;
            }
        });
    },
    refresh: (cityId, cityIndex) => {
        if (!get().canRefresh(cityId))
            return;
        const city = useContentStore.getState().maps.citiesById[cityId];
        const cityModules = city?.modules ?? [];
        const refreshSeed = Math.floor(Date.now() / 1000);
        const next = buildBounties(cityId, cityIndex, cityModules, refreshSeed);
        if (next.length !== LIVE_BOUNTY_BOARD_SIZE)
            return;
        set((state) => {
            state.activeByCityId[cityId] = next;
            state.lastRefreshAtByCityId[cityId] = Date.now();
            const tracked = state.trackedByCityId[cityId];
            if (tracked && !next.find((entry) => entry.instanceId === tracked)) {
                state.trackedByCityId[cityId] = null;
            }
        });
    },
    canRefresh: (cityId, now = Date.now()) => {
        const bountyConfig = useContentStore.getState().raw?.bounties;
        const cooldownSeconds = bountyConfig?.refreshCooldownSeconds ?? 0;
        if (cooldownSeconds <= 0)
            return true;
        const last = get().lastRefreshAtByCityId[cityId];
        if (!last)
            return true;
        return now >= last + cooldownSeconds * 1000;
    },
    nextRefreshAt: (cityId) => {
        const bountyConfig = useContentStore.getState().raw?.bounties;
        const cooldownSeconds = bountyConfig?.refreshCooldownSeconds ?? 0;
        if (cooldownSeconds <= 0)
            return null;
        const last = get().lastRefreshAtByCityId[cityId];
        if (!last)
            return null;
        return last + cooldownSeconds * 1000;
    },
    recordEvent: (event) => {
        const amount = Math.max(1, Math.floor(event.amount ?? 1));
        const updates = [];
        set((state) => {
            const list = state.activeByCityId[event.cityId];
            if (!list)
                return;
            list.forEach((bounty) => {
                if (bounty.claimed || bounty.kind !== event.type)
                    return;
                const nextProgress = Math.min(bounty.target, bounty.progress + amount);
                const delta = nextProgress - bounty.progress;
                if (delta <= 0)
                    return;
                bounty.progress = nextProgress;
                updates.push({ name: bounty.title, delta, progress: nextProgress, target: bounty.target });
            });
        });
        if (updates.length > 0) {
            const ui = useUIStore.getState();
            updates.forEach((entry) => {
                ui.addNotification('info', `Bounty progress: ${entry.name} +${entry.delta} (${entry.progress}/${entry.target})`, {
                    durationMs: 1600,
                });
            });
        }
    },
    claim: (cityId, instanceId) => {
        const bounty = get().activeByCityId[cityId]?.find((entry) => entry.instanceId === instanceId);
        if (!bounty || bounty.claimed || bounty.progress < bounty.target)
            return false;
        const claimedAt = Date.now();
        RewardService.grantRewards(bounty.rewards, `bounty:${bounty.templateId}`);
        GameEvents.emit({
            type: 'bounties/claimed',
            payload: {
                timestamp: claimedAt,
                cityId,
                templateId: bounty.templateId,
                difficulty: bounty.difficulty,
                kind: bounty.kind,
                claimedAt,
                createdAt: bounty.createdAt,
                rewards: bounty.rewards,
            },
        });
        set((state) => {
            const list = state.activeByCityId[cityId];
            if (!list)
                return;
            const entry = list.find((item) => item.instanceId === instanceId);
            if (entry) {
                entry.claimed = true;
            }
            if (state.trackedByCityId[cityId] === instanceId) {
                state.trackedByCityId[cityId] = null;
            }
        });
        return true;
    },
    getTrackedBounty: (cityId) => {
        const trackedId = get().trackedByCityId[cityId];
        if (!trackedId)
            return null;
        return get().activeByCityId[cityId]?.find((bounty) => bounty.instanceId === trackedId) ?? null;
    },
    setTrackedBounty: (cityId, bountyId) => {
        if (bountyId === null) {
            set((state) => {
                state.trackedByCityId[cityId] = null;
            });
            return;
        }
        const exists = get().activeByCityId[cityId]?.some((entry) => entry.instanceId === bountyId);
        set((state) => {
            state.trackedByCityId[cityId] = exists ? bountyId : null;
        });
    },
    hardResetBounties: () => {
        set(() => ({
            activeByCityId: {},
            lastRefreshAtByCityId: {},
            trackedByCityId: {},
        }));
    },
})));
