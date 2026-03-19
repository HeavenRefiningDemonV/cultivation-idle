import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RuinDef, RuinDropTable } from '../content/index.js';
import type { CombatEvent, RuinsRunSummary } from '../types/index.js';
import { useContentStore } from './contentStore';
import { useActivityStore } from './activityStore';
import { useCombatStore } from './combatStore';
import { useCityStore } from './cityStore';
import { useBountyStore } from './bountyStore';
import { useHeartLawStore } from './heartLawStore';
import { RewardService, applyLootBonuses, type RewardBundle, type RewardItemBundle } from '../services/rewards/index.js';
import { D } from '../utils/numbers';
import { useUIStore } from './uiStore';

export type RuinProgress = {
  totalRuns: number;
  totalRoomsCleared: number;
  bossKills: number;
  bossChestRareFailures: number;
  bestRunSeconds?: number;
  lastRun?: { endedAt: number; victory: boolean; roomsCleared: number; seconds: number };
};

export type ActiveRuinRun = {
  runId: string;
  ruinId: string;
  cityId: string;
  roomIndex: number;
  roomCount: number;
  startedAt: number;
  lastTransitionAt: number;
  autoRepeat: boolean;
  goldEarned: number;
  stopping: boolean;
};

interface RuinsState {
  progressByRuinId: Record<string, RuinProgress>;
  activeRun: ActiveRuinRun | null;
  autoRepeatDefault: boolean;
  autoRestart: boolean;
  runHistory: RuinsRunSummary[];
  lastRunSummary: RuinsRunSummary | null;

  initializeFromContent: (ruins: RuinDef[]) => void;
  startRun: (ruinId: string) => void;
  stopRun: () => void;
  handleRoomVictory: (payload: { runId: string; ruinId: string; cityId: string; roomIndex: number }) => void;
  handleRunDefeat: (payload: { runId: string; ruinId: string; cityId?: string; roomIndex: number }) => void;
  setAutoRepeat: (enabled: boolean) => void;
  hardResetRuins: () => void;
}

function randomIntInclusive(minRaw?: number, maxRaw?: number): number {
  const min = Number.isFinite(minRaw) ? (minRaw as number) : 0;
  const max = Number.isFinite(maxRaw) ? (maxRaw as number) : min;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function pickWeighted<T extends { weight: number }>(pool: T[]): T | null {
  const validPool = pool.filter((entry) => typeof entry.weight === 'number' && entry.weight > 0);
  if (validPool.length === 0) return null;
  const total = validPool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of validPool) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return validPool[validPool.length - 1] ?? null;
}

function collapseItems(items: RewardItemBundle[]): RewardItemBundle[] {
  const merged = new Map<string, number>();
  items.forEach((item) => {
    if (!item?.itemId || typeof item.qty !== 'number' || item.qty <= 0) return;
    merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.qty);
  });
  return Array.from(merged.entries()).map(([itemId, qty]) => ({ itemId, qty }));
}

function rollDropTable(table: RuinDropTable, label: string): RewardBundle {
  const bundle: RewardBundle = { currencies: {}, items: [] };

  const goldMin = Number.isFinite(table.goldMin) ? (table.goldMin as number) : 0;
  const goldMax = Number.isFinite(table.goldMax) ? (table.goldMax as number) : goldMin;
  if (goldMin > 0 || goldMax > 0) {
    const gold = randomIntInclusive(goldMin, goldMax);
    if (gold > 0) {
      bundle.currencies = { ...bundle.currencies, gold: gold.toString() };
    }
  }

  const items: RewardItemBundle[] = [];
  for (let i = 0; i < (table.rolls ?? 0); i += 1) {
    const pick = pickWeighted(table.pool ?? []);
    if (!pick || !pick.itemId) continue;
    const qty = randomIntInclusive(pick.qtyMin, pick.qtyMax);
    if (qty > 0) items.push({ itemId: pick.itemId, qty });
  }

  if (Array.isArray(table.guaranteed)) {
    table.guaranteed.forEach((entry) => {
      if (entry?.itemId && typeof entry.qty === 'number' && entry.qty > 0) {
        items.push({ itemId: entry.itemId, qty: entry.qty });
      }
    });
  }

  const filtered = items.filter((item) => {
    if (item.itemId.startsWith('gate_')) {
      console.warn(`[Ruins] blocked gate item drop: ${item.itemId} (${label})`);
      return false;
    }
    return true;
  });

  bundle.items = collapseItems(filtered);
  return applyLootBonuses(bundle, 'ruins');
}

function goldFromBundle(bundle: RewardBundle | undefined): number {
  if (!bundle?.currencies?.gold) return 0;
  const value = D(bundle.currencies.gold ?? 0).toNumber();
  return Number.isFinite(value) ? value : 0;
}

function summarizeLootDrops(events: CombatEvent[], startedAt: number, endedAt: number): {
  drops: RuinsRunSummary['drops'];
  rareDropCount: number;
} {
  const aggregated = new Map<string, { qty: number; rarity?: string; reason?: string }>();
  let rareDropCount = 0;

  events.forEach((event) => {
    if (event.type !== 'LOOT_DROP') return;
    if (event.at < startedAt || event.at > endedAt) return;
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

  const drops: RuinsRunSummary['drops'] = Array.from(aggregated.entries()).map(([itemId, data]) => ({
    itemId,
    qty: data.qty,
    rarity: data.rarity,
    reason: data.reason,
  }));

  return { drops, rareDropCount };
}

function buildRunSummary(
  run: ActiveRuinRun,
  params: { ruinId: string; victory: boolean; roomIndex: number; events: CombatEvent[] },
): RuinsRunSummary {
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

export const useRuinsStore = create<RuinsState>()(
  immer((set, get) => {
    const startNextRoom = (run: ActiveRuinRun, ruinDef: RuinDef) => {
      const activityStore = useActivityStore.getState();
      const combatStore = useCombatStore.getState();
      const contentStore = useContentStore.getState();

      const active = get().activeRun;
      if (!active || active.runId !== run.runId || active.ruinId !== ruinDef.id) return;
      if (active.stopping) return;
      if (!activityStore.isActive('ruins')) return;
      if (combatStore.inCombat) return;

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
            } else if (draft.progressByRuinId[ruin.id].bossChestRareFailures === undefined) {
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

        const run: ActiveRuinRun = {
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
        if (!active) return;

        set((draft) => {
          if (draft.activeRun) draft.activeRun.stopping = true;
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
        if (!active || active.runId !== runId || active.ruinId !== ruinId) return;

        const content = useContentStore.getState();
        const ruinDef = content.maps.ruinsById[ruinId];
        if (!ruinDef) {
          console.warn('[Ruins] Missing ruin def for', ruinId);
          useCombatStore.getState().exitCombat();
          return;
        }

        const isFinalRoom = roomIndex >= active.roomCount - 1;
        const isStopping = active.stopping;

        const perRoomRewards = rollDropTable(ruinDef.dropsPerRoom, `Ruins ${ruinDef.id} room ${roomIndex + 1}`);
        RewardService.grantRewards(
          perRoomRewards,
          `Ruins — ${ruinDef.name ?? ruinDef.id} (Room ${roomIndex + 1}/${active.roomCount})`,
        );
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
          const chestRewards = rollDropTable(
            ruinDef.finalChestDrops,
            `Ruins ${ruinDef.id} final chest room ${roomIndex + 1}`,
          );
          RewardService.grantRewards(
            chestRewards,
            `Ruins — ${ruinDef.name ?? ruinDef.id} (Final Chest)`,
          );
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
            } else {
              const chance = Math.min(1, Math.max(0, baseChance + keyProgress * pityIncrement));
              rareHit = Math.random() < chance;
              nextRareFailures = rareHit ? 0 : Math.min(keyProgress + 1, pityCap - 1);
            }

            if (rareHit) {
              const rareBundle: RewardBundle = {
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
          if (useHeartLawStore.getState().selectedHeartLawId) {
            useHeartLawStore.getState().addComprehension(15, 'ruinsClear');
          }

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
            if (isStopping) return;
            const state = get();
            const shouldRestart = state.autoRestart ?? state.autoRepeatDefault;
            if (!shouldRestart) return;
            if (state.activeRun) return;
            const activityState = useActivityStore.getState().active;
            if (activityState && activityState.type !== 'ruins') return;
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
          if (!latestRun || latestRun.runId !== runId || latestRun.stopping) return;
          const activity = useActivityStore.getState().active;
          if (!activity || activity.type !== 'ruins' || activity.sourceId !== ruinId) return;
          if (useCombatStore.getState().inCombat) return;
          const latestRuinDef = useContentStore.getState().maps.ruinsById[ruinId];
          if (!latestRuinDef) return;
          startNextRoom(latestRun, latestRuinDef);
        }, 700);
      },

      handleRunDefeat: ({ runId, ruinId, roomIndex }) => {
        const active = get().activeRun;
        if (!active || active.runId !== runId || active.ruinId !== ruinId) return;

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
          if (isStopping) return;
          const state = get();
          const uiSettings = useUIStore.getState().settings;
          const shouldRestart = (state.autoRestart ?? state.autoRepeatDefault) || uiSettings.autoRetryOnDeath;
          if (!shouldRestart) return;
          if (state.activeRun) return;
          const activityState = useActivityStore.getState().active;
          if (activityState && activityState.type !== 'ruins') return;
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
  }),
);
