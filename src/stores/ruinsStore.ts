import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RuinDef, RuinDropTable } from '../content';
import { useContentStore } from './contentStore';
import { useActivityStore } from './activityStore';
import { useCombatStore } from './combatStore';
import { useCityStore } from './cityStore';
import { useBountyStore } from './bountyStore';
import { useHeartLawStore } from './heartLawStore';
import { RewardService, applyLootBonuses, type RewardBundle, type RewardItemBundle } from '../services/rewards';

export type RuinProgress = {
  totalRuns: number;
  totalRoomsCleared: number;
  bossKills: number;
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
  stopping: boolean;
};

interface RuinsState {
  progressByRuinId: Record<string, RuinProgress>;
  activeRun: ActiveRuinRun | null;
  autoRepeatDefault: boolean;

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
      autoRepeatDefault: true,

      initializeFromContent: (ruins) => {
        set((draft) => {
          ruins.forEach((ruin) => {
            if (!draft.progressByRuinId[ruin.id]) {
              draft.progressByRuinId[ruin.id] = { totalRuns: 0, totalRoomsCleared: 0, bossKills: 0 };
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

        const run: ActiveRuinRun = {
          runId,
          ruinId: ruinDef.id,
          cityId: ruinDef.cityId,
          roomIndex: 0,
          roomCount,
          startedAt,
          lastTransitionAt: startedAt,
          autoRepeat: get().autoRepeatDefault,
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

        const perRoomRewards = rollDropTable(ruinDef.dropsPerRoom, `Ruins ${ruinDef.id} room ${roomIndex + 1}`);
        RewardService.grantRewards(
          perRoomRewards,
          `Ruins — ${ruinDef.name ?? ruinDef.id} (Room ${roomIndex + 1}/${active.roomCount})`,
        );
        useBountyStore.getState().recordEvent({ type: 'RUINS_ROOM_CLEAR', cityId, amount: 1 });

        if (isFinalRoom) {
          const chestRewards = rollDropTable(
            ruinDef.finalChestDrops,
            `Ruins ${ruinDef.id} final chest room ${roomIndex + 1}`,
          );
          RewardService.grantRewards(
            chestRewards,
            `Ruins — ${ruinDef.name ?? ruinDef.id} (Final Chest)`,
          );
          useBountyStore.getState().recordEvent({ type: 'RUINS_RUN_CLEAR', cityId, amount: 1 });
          if (useHeartLawStore.getState().selectedHeartLawId) {
            useHeartLawStore.getState().addComprehension(15, 'ruinsClear');
          }

          const now = Date.now();
          const seconds = Math.max(0, (now - active.startedAt) / 1000);

          set((draft) => {
            const progress = draft.progressByRuinId[ruinId] ?? {
              totalRuns: 0,
              totalRoomsCleared: 0,
              bossKills: 0,
            };
            progress.totalRuns += 1;
            progress.totalRoomsCleared += active.roomCount;
            progress.bossKills += 1;
            progress.lastRun = { endedAt: now, victory: true, roomsCleared: active.roomCount, seconds };
            if (!progress.bestRunSeconds || seconds < progress.bestRunSeconds) {
              progress.bestRunSeconds = seconds;
            }
            draft.progressByRuinId[ruinId] = progress;
            draft.activeRun = null;
          });

          useCityStore.getState().markRuinsCleared(cityId);
          useActivityStore.getState().stopActivity();
          useCombatStore.getState().exitCombat();
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

        set((draft) => {
          const progress = draft.progressByRuinId[ruinId] ?? {
            totalRuns: 0,
            totalRoomsCleared: 0,
            bossKills: 0,
          };
          progress.totalRuns += 1;
          progress.totalRoomsCleared += roomsCleared;
          progress.lastRun = { endedAt: now, victory: false, roomsCleared, seconds };
          draft.progressByRuinId[ruinId] = progress;
          draft.activeRun = null;
        });

        useActivityStore.getState().stopActivity();
        useCombatStore.getState().exitCombat();
        useCityStore.getState();
      },

      setAutoRepeat: (enabled) => {
        set((draft) => {
          draft.autoRepeatDefault = enabled;
          if (draft.activeRun) {
            draft.activeRun.autoRepeat = enabled;
          }
        });
      },

      hardResetRuins: () => {
        set(() => ({
          progressByRuinId: {},
          activeRun: null,
          autoRepeatDefault: true,
        }));
      },
    };
  }),
);
