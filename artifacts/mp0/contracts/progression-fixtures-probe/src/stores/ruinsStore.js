import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { useActivityStore } from './activityStore.js';
import { useCombatStore } from './combatStore.js';
import { useCityStore } from './cityStore.js';
import { useBountyStore } from './bountyStore.js';
import { RewardService } from '../services/rewards/index.js';
import { applyLootBonuses } from '../services/rewards/applyLootBonuses.js';
import { D } from '../utils/numbers.js';
import { useUIStore } from './uiStore.js';
import { buildRuinsFinalChestBonusBundle, getRuinsDropsConfig, mergeRewardBundles, rollRuinDropTable, } from '../systems/economy/index.js';
function goldFromBundle(bundle) {
    if (!bundle?.currencies?.gold)
        return 0;
    const value = D(bundle.currencies.gold ?? 0).toNumber();
    return Number.isFinite(value) ? value : 0;
}
function summarizeLootDrops(events, startedAt, endedAt) {
    const aggregated = new Map();
    let rareDropCount = 0;
    events.forEach((event) => {
        if (event.type !== 'LOOT_DROP')
            return;
        if (event.at < startedAt || event.at > endedAt)
            return;
        const key = event.itemId;
        const existing = aggregated.get(key);
        aggregated.set(key, {
            qty: (existing?.qty ?? 0) + event.qty,
            rarity: event.rarity ?? existing?.rarity,
            reason: event.reason ?? existing?.reason,
        });
        if (event.rarity && event.rarity !== 'common' && event.rarity !== 'uncommon') {
            rareDropCount += 1;
        }
    });
    const drops = Array.from(aggregated.entries()).map(([itemId, data]) => ({
        itemId,
        qty: data.qty,
        rarity: data.rarity,
        reason: data.reason,
    }));
    return { drops, rareDropCount };
}
function buildRunSummary(run, params) {
    const endedAt = Date.now();
    const durationSec = Math.max(0, (endedAt - run.startedAt) / 1000);
    const roomsCleared = params.victory ? run.roomCount : Math.max(0, Math.min(params.roomIndex, run.roomCount));
    const { drops, rareDropCount } = summarizeLootDrops(params.events, run.startedAt, endedAt);
    return {
        runId: run.runId,
        ruinId: params.ruinId,
        startedAt: run.startedAt,
        endedAt,
        durationSec,
        roomsCleared,
        roomCount: run.roomCount,
        victory: params.victory,
        goldGained: run.goldEarned,
        drops,
        rareDropCount,
    };
}
export const useRuinsStore = create()(immer((set, get) => {
    const startNextRoom = (run, ruinDef) => {
        const activityStore = useActivityStore.getState();
        const combatStore = useCombatStore.getState();
        const contentStore = useContentStore.getState();
        const active = get().activeRun;
        if (!active || active.runId !== run.runId || active.ruinId !== ruinDef.id)
            return;
        if (active.stopping)
            return;
        if (!activityStore.isActive('ruins'))
            return;
        if (combatStore.inCombat)
            return;
        const roomIndex = active.roomIndex;
        const isFinalRoom = roomIndex >= active.roomCount - 1;
        const roomPools = ruinDef.roomPools;
        const enemyPool = isFinalRoom
            ? roomPools.finalBoss ?? roomPools.mobs
            : roomPools.miniBoss?.length && roomIndex === active.roomCount - 2
                ? roomPools.miniBoss
                : roomPools.mobs;
        const enemyTemplateId = enemyPool?.[Math.floor(Math.random() * enemyPool.length)];
        if (!enemyTemplateId) {
            console.warn('[Ruins] No enemy template available for room', roomIndex, ruinDef.id);
            return;
        }
        const cityIndex = ruinDef.cityIndex ?? contentStore.maps.citiesById[ruinDef.cityId]?.index ?? 0;
        const now = Date.now();
        useCombatStore.getState().startCombat(enemyTemplateId, {
            type: 'ruins',
            cityId: ruinDef.cityId,
            sourceId: ruinDef.id,
            ruinsId: ruinDef.id,
            runId: run.runId,
            roomIndex,
            roomCount: active.roomCount,
            isBoss: isFinalRoom,
            cityIndex,
        });
        set((draft) => {
            if (draft.activeRun && draft.activeRun.runId === run.runId) {
                draft.activeRun.lastTransitionAt = now;
            }
        });
    };
    return {
        progressByRuinId: {},
        activeRun: null,
        autoRepeatDefault: false,
        autoRestart: false,
        runHistory: [],
        lastRunSummary: null,
        initializeFromContent: (ruins) => {
            set((draft) => {
                ruins.forEach((ruin) => {
                    if (!draft.progressByRuinId[ruin.id]) {
                        draft.progressByRuinId[ruin.id] = {
                            totalRuns: 0,
                            totalRoomsCleared: 0,
                            bossKills: 0,
                            bossChestRareFailures: 0,
                        };
                    }
                    else if (draft.progressByRuinId[ruin.id].bossChestRareFailures === undefined) {
                        draft.progressByRuinId[ruin.id].bossChestRareFailures = 0;
                    }
                });
            });
        },
        startRun: (ruinId) => {
            const content = useContentStore.getState();
            const ruinDef = content.maps.ruinsById[ruinId];
            if (!ruinDef) {
                console.warn('[Ruins] Unknown ruin id', ruinId);
                return;
            }
            const activityStore = useActivityStore.getState();
            const combatStore = useCombatStore.getState();
            if (combatStore.inCombat) {
                combatStore.exitCombat();
            }
            activityStore.startActivity('ruins', { cityId: ruinDef.cityId, sourceId: ruinDef.id });
            useCombatStore.getState().setAutoAttack(true);
            useCombatStore.getState().setAutoCombatAI(true);
            const runId = `ruins-${Date.now()}`;
            const startedAt = Date.now();
            const roomCount = Math.max(ruinDef.roomCount ?? 1, 1);
            const autoRepeat = get().autoRestart ?? get().autoRepeatDefault;
            const run = {
                runId,
                ruinId: ruinDef.id,
                cityId: ruinDef.cityId,
                roomIndex: 0,
                roomCount,
                startedAt,
                lastTransitionAt: startedAt,
                autoRepeat,
                goldEarned: 0,
                stopping: false,
            };
            set((draft) => {
                draft.activeRun = run;
            });
            startNextRoom(run, ruinDef);
        },
        stopRun: () => {
            const active = get().activeRun;
            if (!active)
                return;
            set((draft) => {
                if (draft.activeRun)
                    draft.activeRun.stopping = true;
            });
            useActivityStore.getState().stopActivity();
            const combatStore = useCombatStore.getState();
            if (combatStore.combatContext.type === 'ruins') {
                combatStore.exitCombat();
            }
            set((draft) => {
                draft.activeRun = null;
            });
        },
        handleRoomVictory: ({ runId, ruinId, cityId, roomIndex }) => {
            const active = get().activeRun;
            if (!active || active.runId !== runId || active.ruinId !== ruinId)
                return;
            const content = useContentStore.getState();
            const ruinDef = content.maps.ruinsById[ruinId];
            if (!ruinDef) {
                console.warn('[Ruins] Missing ruin def for', ruinId);
                useCombatStore.getState().exitCombat();
                return;
            }
            const isFinalRoom = roomIndex >= active.roomCount - 1;
            const isStopping = active.stopping;
            const perRoomRewards = rollRuinDropTable(ruinDef.dropsPerRoom, `Ruins ${ruinDef.id} room ${roomIndex + 1}`, undefined, applyLootBonuses);
            RewardService.grantRewards(perRoomRewards, `Ruins — ${ruinDef.name ?? ruinDef.id} (Room ${roomIndex + 1}/${active.roomCount})`);
            const perRoomGold = goldFromBundle(perRoomRewards);
            useBountyStore.getState().recordEvent({ type: 'RUINS_ROOM_CLEAR', cityId, amount: 1 });
            if (perRoomGold > 0) {
                set((draft) => {
                    if (draft.activeRun && draft.activeRun.runId === runId) {
                        draft.activeRun.goldEarned += perRoomGold;
                    }
                });
            }
            if (isFinalRoom) {
                const ruinsDropsConfig = getRuinsDropsConfig(useContentStore.getState().economy);
                const chestRewards = mergeRewardBundles(rollRuinDropTable(ruinDef.finalChestDrops, `Ruins ${ruinDef.id} final chest room ${roomIndex + 1}`, undefined, applyLootBonuses), buildRuinsFinalChestBonusBundle(ruinDef.cityIndex ?? content.maps.citiesById[ruinDef.cityId]?.index ?? 0, ruinsDropsConfig, undefined, applyLootBonuses));
                RewardService.grantRewards(chestRewards, `Ruins — ${ruinDef.name ?? ruinDef.id} (Final Chest)`);
                const chestGold = goldFromBundle(chestRewards);
                if (chestGold > 0) {
                    set((draft) => {
                        if (draft.activeRun && draft.activeRun.runId === runId) {
                            draft.activeRun.goldEarned += chestGold;
                        }
                    });
                }
                const pityRule = useContentStore.getState().economy?.tuning?.pityDefaults?.ruinsBossChestRare;
                const baseChance = pityRule?.baseChance ?? 0;
                const pityIncrement = pityRule?.pityIncrement ?? 0;
                const pityCap = pityRule?.pityCap ?? 0;
                const keyProgress = get().progressByRuinId[ruinId]?.bossChestRareFailures ?? 0;
                let rareHit = false;
                let rareGuaranteed = false;
                let nextRareFailures = keyProgress;
                if (baseChance > 0 && pityCap > 1) {
                    if (keyProgress >= pityCap - 1) {
                        rareHit = true;
                        rareGuaranteed = true;
                        nextRareFailures = 0;
                    }
                    else {
                        const chance = Math.min(1, Math.max(0, baseChance + keyProgress * pityIncrement));
                        rareHit = Math.random() < chance;
                        nextRareFailures = rareHit ? 0 : Math.min(keyProgress + 1, pityCap - 1);
                    }
                    if (rareHit) {
                        const rareBundle = {
                            items: [{ itemId: 'mat_artifact_shard_bundle', qty: 1 }],
                        };
                        RewardService.grantRewards(rareBundle, 'ruins_boss_chest_rare');
                        const rareItemName = useContentStore.getState().maps.itemsById['mat_artifact_shard_bundle']?.name;
                        const message = rareGuaranteed
                            ? `Boss chest rare reward (guaranteed)${rareItemName ? `: ${rareItemName}` : ''}`
                            : `Boss chest rare reward${rareItemName ? `: ${rareItemName}` : ''}`;
                        useUIStore.getState().addNotification('success', message, 2500);
                    }
                }
                useBountyStore.getState().recordEvent({ type: 'RUINS_RUN_CLEAR', cityId, amount: 1 });
                const now = Date.now();
                const seconds = Math.max(0, (now - active.startedAt) / 1000);
                const events = useCombatStore.getState().events;
                const summary = buildRunSummary(active, {
                    ruinId,
                    victory: true,
                    roomIndex: roomIndex + 1,
                    events,
                });
                summary.bossChestRare =
                    baseChance > 0 && pityCap > 1
                        ? { hit: rareHit, guaranteed: rareGuaranteed, failuresBefore: keyProgress, pityCap }
                        : undefined;
                set((draft) => {
                    const progress = draft.progressByRuinId[ruinId] ?? {
                        totalRuns: 0,
                        totalRoomsCleared: 0,
                        bossKills: 0,
                        bossChestRareFailures: 0,
                    };
                    progress.totalRuns += 1;
                    progress.totalRoomsCleared += active.roomCount;
                    progress.bossKills += 1;
                    progress.bossChestRareFailures = baseChance > 0 && pityCap > 1 ? nextRareFailures : progress.bossChestRareFailures ?? 0;
                    progress.lastRun = { endedAt: now, victory: true, roomsCleared: active.roomCount, seconds };
                    if (!progress.bestRunSeconds || seconds < progress.bestRunSeconds) {
                        progress.bestRunSeconds = seconds;
                    }
                    draft.progressByRuinId[ruinId] = progress;
                    draft.lastRunSummary = summary;
                    draft.runHistory = [summary, ...draft.runHistory].slice(0, 5);
                    draft.activeRun = null;
                });
                useCityStore.getState().markRuinsCleared(cityId);
                useActivityStore.getState().stopActivity();
                useCombatStore.getState().exitCombat();
                setTimeout(() => {
                    if (isStopping)
                        return;
                    const state = get();
                    const shouldRestart = state.autoRestart ?? state.autoRepeatDefault;
                    if (!shouldRestart)
                        return;
                    if (state.activeRun)
                        return;
                    const activityState = useActivityStore.getState().active;
                    if (activityState && activityState.type !== 'ruins')
                        return;
                    get().startRun(ruinId);
                }, 1000);
                return;
            }
            useCombatStore.getState().exitCombat();
            set((draft) => {
                if (draft.activeRun && draft.activeRun.runId === runId) {
                    draft.activeRun.roomIndex = roomIndex + 1;
                    draft.activeRun.lastTransitionAt = Date.now();
                }
            });
            setTimeout(() => {
                const latestRun = get().activeRun;
                if (!latestRun || latestRun.runId !== runId || latestRun.stopping)
                    return;
                const activity = useActivityStore.getState().active;
                if (!activity || activity.type !== 'ruins' || activity.sourceId !== ruinId)
                    return;
                if (useCombatStore.getState().inCombat)
                    return;
                const latestRuinDef = useContentStore.getState().maps.ruinsById[ruinId];
                if (!latestRuinDef)
                    return;
                startNextRoom(latestRun, latestRuinDef);
            }, 700);
        },
        handleRunDefeat: ({ runId, ruinId, roomIndex }) => {
            const active = get().activeRun;
            if (!active || active.runId !== runId || active.ruinId !== ruinId)
                return;
            const roomsCleared = Math.max(0, Math.min(roomIndex, active.roomCount));
            const now = Date.now();
            const seconds = Math.max(0, (now - active.startedAt) / 1000);
            const isStopping = active.stopping;
            const events = useCombatStore.getState().events;
            const summary = buildRunSummary(active, { ruinId, victory: false, roomIndex, events });
            set((draft) => {
                const progress = draft.progressByRuinId[ruinId] ?? {
                    totalRuns: 0,
                    totalRoomsCleared: 0,
                    bossKills: 0,
                    bossChestRareFailures: 0,
                };
                progress.totalRuns += 1;
                progress.totalRoomsCleared += roomsCleared;
                progress.bossChestRareFailures = progress.bossChestRareFailures ?? 0;
                progress.lastRun = { endedAt: now, victory: false, roomsCleared, seconds };
                draft.progressByRuinId[ruinId] = progress;
                draft.lastRunSummary = summary;
                draft.runHistory = [summary, ...draft.runHistory].slice(0, 5);
                draft.activeRun = null;
            });
            useActivityStore.getState().stopActivity();
            useCombatStore.getState().exitCombat();
            useCityStore.getState();
            setTimeout(() => {
                if (isStopping)
                    return;
                const state = get();
                const uiSettings = useUIStore.getState().settings;
                const shouldRestart = (state.autoRestart ?? state.autoRepeatDefault) || uiSettings.autoRetryOnDeath;
                if (!shouldRestart)
                    return;
                if (state.activeRun)
                    return;
                const activityState = useActivityStore.getState().active;
                if (activityState && activityState.type !== 'ruins')
                    return;
                get().startRun(ruinId);
            }, 1000);
        },
        setAutoRepeat: (enabled) => {
            set((draft) => {
                draft.autoRepeatDefault = enabled;
                draft.autoRestart = enabled;
                if (draft.activeRun) {
                    draft.activeRun.autoRepeat = enabled;
                }
            });
        },
        hardResetRuins: () => {
            set(() => ({
                progressByRuinId: {},
                activeRun: null,
                autoRepeatDefault: false,
                autoRestart: false,
                runHistory: [],
                lastRunSummary: null,
            }));
        },
    };
}));
