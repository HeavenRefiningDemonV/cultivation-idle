import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore';
import { useInventoryStore } from './inventoryStore';

export type TalismanBonuses = {
  goldDropBonusPct?: number;
  matDropBonusPct?: number;
  fragmentDropBonusPct?: number;
  damageBonusPct?: number;
};

export type ActiveTalisman = {
  id: string;
  itemId: string;
  startedAt: number;
  endsAt: number;
  bonuses: TalismanBonuses;
};

export type BuffActionResult = { ok: true } | { ok: false; error: string };

interface BuffState {
  activeTalismans: ActiveTalisman[];
  activateTalisman: (itemId: string, now?: number) => BuffActionResult;
  purgeExpired: (now?: number) => void;
  getBonusesSnapshot: (now?: number) => TalismanBonuses;
  hardResetBuffs: () => void;
}

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

function extractBonuses(effect: Record<string, unknown> | undefined): TalismanBonuses {
  if (!effect || typeof effect !== 'object') return {};
  const type = typeof effect.type === 'string' ? effect.type : '';
  const pct = typeof effect.pct === 'number' ? effect.pct : typeof effect.value === 'number' ? effect.value : 0;

  switch (type) {
    case 'goldDropBonus':
      return pct > 0 ? { goldDropBonusPct: pct } : {};
    case 'ruinsFragmentGainBonus':
    case 'bossChestExtraFragmentsChance':
      return pct > 0 ? { fragmentDropBonusPct: pct } : {};
    case 'matDropBonus':
    case 'matDropBonusPct':
      return pct > 0 ? { matDropBonusPct: pct } : {};
    case 'damageBonus':
    case 'damageBonusPct':
      return pct > 0 ? { damageBonusPct: pct } : {};
    default:
      return {};
  }
}

function getTalismanUseDef(itemId: string): { durationSec: number; bonuses: TalismanBonuses } | null {
  const recipes = useContentStore.getState().raw?.talisman_recipes ?? [];
  for (const recipe of recipes) {
    if (!recipe || !recipe.outputs) continue;
    if (!Object.prototype.hasOwnProperty.call(recipe.outputs, itemId)) continue;
    const effect = recipe.effect as Record<string, unknown> | undefined;
    const durationSec = typeof effect?.durationSec === 'number' ? effect.durationSec : 0;
    const bonuses = extractBonuses(effect);
    if (!Number.isFinite(durationSec) || durationSec <= 0) return null;
    if (Object.keys(bonuses).length === 0) return null;
    return { durationSec, bonuses };
  }
  return null;
}

export const useBuffStore = create<BuffState>()(
  immer((set, get) => ({
    activeTalismans: [],

    activateTalisman: (itemId, now = Date.now()) => {
      if (!itemId) return { ok: false, error: 'Invalid talisman' };
      const def = getTalismanUseDef(itemId);
      if (!def) return { ok: false, error: 'Unsupported talisman' };

      get().purgeExpired(now);

      const inventory = useInventoryStore.getState();
      if (inventory.getQty(itemId) < 1) {
        return { ok: false, error: 'Talisman not available' };
      }

      const removed = inventory.removeItem(itemId, 1);
      if (!removed) {
        return { ok: false, error: 'Failed to consume talisman' };
      }

      const startedAt = now;
      const endsAt = startedAt + def.durationSec * 1000;

      set((state) => {
        state.activeTalismans = state.activeTalismans.filter((entry) => entry.itemId !== itemId);
        state.activeTalismans.push({
          id: makeId(),
          itemId,
          startedAt,
          endsAt,
          bonuses: def.bonuses,
        });
      });

      return { ok: true };
    },

    purgeExpired: (now = Date.now()) => {
      const active = get().activeTalismans;
      if (active.length === 0) return;
      const filtered = active.filter((entry) => entry.endsAt > now);
      if (filtered.length === active.length) return;
      set((state) => {
        state.activeTalismans = filtered;
      });
    },

    getBonusesSnapshot: (now = Date.now()) => {
      const active = get().activeTalismans.filter((entry) => entry.endsAt > now);
      const result: TalismanBonuses = {};
      for (const entry of active) {
        const bonuses = entry.bonuses;
        if (bonuses.goldDropBonusPct !== undefined) {
          result.goldDropBonusPct = Math.max(result.goldDropBonusPct ?? 0, bonuses.goldDropBonusPct);
        }
        if (bonuses.matDropBonusPct !== undefined) {
          result.matDropBonusPct = Math.max(result.matDropBonusPct ?? 0, bonuses.matDropBonusPct);
        }
        if (bonuses.fragmentDropBonusPct !== undefined) {
          result.fragmentDropBonusPct = Math.max(result.fragmentDropBonusPct ?? 0, bonuses.fragmentDropBonusPct);
        }
        if (bonuses.damageBonusPct !== undefined) {
          result.damageBonusPct = Math.max(result.damageBonusPct ?? 0, bonuses.damageBonusPct);
        }
      }
      return result;
    },

    hardResetBuffs: () => {
      set(() => ({ activeTalismans: [] }));
    },
  })),
);

export function getTalismanBonusesNow(now: number = Date.now()): Required<TalismanBonuses> {
  const store = useBuffStore.getState();
  store.purgeExpired(now);
  const bonuses = store.getBonusesSnapshot(now);
  return {
    goldDropBonusPct: bonuses.goldDropBonusPct ?? 0,
    matDropBonusPct: bonuses.matDropBonusPct ?? 0,
    fragmentDropBonusPct: bonuses.fragmentDropBonusPct ?? 0,
    damageBonusPct: bonuses.damageBonusPct ?? 0,
  };
}
