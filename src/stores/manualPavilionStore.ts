import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents';
import { buildInitialStock, refreshStock as generateRefresh } from '../features/manuals/pavilionStockGenerator';
import type {
  ManualGrade,
  ManualPavilionSaveState,
  ManualRarity,
  PavilionStockSlot,
  PavilionStockState,
} from '../features/manuals/pavilionStockTypes';
import { RewardService } from '../services/rewards/RewardService';
import type { RewardCurrencyBundle } from '../services/rewards/types';
import { useContentStore } from './contentStore';
import { useInventoryStore } from './inventoryStore';
import { useTechCollectionStore, isHigherGrade, isHigherRarity } from './techCollectionStore';
import { useManualSatchelStore } from './manualSatchelStore';

export type ManualPurchaseResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      outcome: 'manualGranted';
      manualId: string;
      manualInstanceId?: string;
      techId: string;
      manualName: string;
      grade: ManualGrade;
      rarity: ManualRarity;
      cost: RewardCurrencyBundle;
      satchelCount: number;
      mode: 'buy' | 'buyAndStudy';
    }
  | {
      ok: true;
      outcome: 'duplicateConverted';
      manualId: string;
      techId: string;
      manualName: string;
      grade: ManualGrade;
      rarity: ManualRarity;
      fragmentsGained: number;
      fragmentsBefore: number;
      fragmentsAfter: number;
      nextRank?: number;
      nextRankCostFragments?: number;
      cost: RewardCurrencyBundle;
      mode: 'buy' | 'buyAndStudy';
    };

interface ManualPavilionStoreState extends ManualPavilionSaveState {
  ensureStock: (pavilionId: string, now?: number) => void;
  refreshStock: (pavilionId: string, now?: number) => { ok: boolean; reason?: string };
  getStock: (pavilionId: string) => PavilionStockState | null;
  buyManual: (options: { pavilionId: string; stockId: number; mode?: 'buy' | 'buyAndStudy' }) => ManualPurchaseResult;
  isPurchasing: boolean;
  lastError: string | null;
  hydrate: (data: Partial<ManualPavilionSaveState>) => void;
  hardReset: () => void;
}

function cloneState(source?: ManualPavilionSaveState['stockByPavilionId']): ManualPavilionSaveState['stockByPavilionId'] {
  if (!source || typeof source !== 'object') return {};
  const copy: ManualPavilionSaveState['stockByPavilionId'] = {};
  Object.entries(source).forEach(([pavilionId, stock]) => {
    if (!stock || typeof stock !== 'object') return;
    copy[pavilionId] = {
      ...stock,
      slots: Array.isArray(stock.slots)
        ? stock.slots.map((slot) => ({
            ...slot,
            sold: Boolean(slot.sold),
            soldAt: typeof slot.soldAt === 'number' ? slot.soldAt : undefined,
          }))
        : [],
      pity: { ...(stock.pity ?? { featuredEpic: 0, featuredLegendary: 0 }) },
      history: Array.isArray(stock.history) ? stock.history.map((entry) => ({ ...entry })) : [],
    } as PavilionStockState;
  });
  return copy;
}

function normalizeCost(price?: PavilionStockSlot['price']): RewardCurrencyBundle | null {
  if (!price || typeof price !== 'object') return null;
  const bundle: RewardCurrencyBundle = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const raw = price[key];
    if (raw === undefined || raw === null) return;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return;
    bundle[key] = String(raw);
  });
  return Object.keys(bundle).length > 0 ? bundle : null;
}

function determineDuplicate(
  slot: PavilionStockSlot,
  hasTech: boolean,
  ownedGrade: ManualGrade,
  ownedRarity: ManualRarity,
): boolean {
  if (!hasTech) return false;
  if (isHigherGrade(ownedGrade, slot.grade)) return false;
  if (isHigherRarity(ownedRarity, slot.rarity)) return false;
  return true;
}

function manualIdForSlot(slot: PavilionStockSlot): string {
  return `${slot.techniqueId}:${slot.grade}:${slot.rarity}:manual`;
}

export const useManualPavilionStore = create<ManualPavilionStoreState>()(
  immer((set, get) => ({
    stockByPavilionId: {},
    isPurchasing: false,
    lastError: null,

    ensureStock: (pavilionId: string, now = Date.now()) => {
      const content = useContentStore.getState();
      if (!content.isLoaded || !content.maps.pavilionsById[pavilionId]) return;
      if (get().stockByPavilionId[pavilionId]) return;
      const stock = buildInitialStock(pavilionId, now);
      set((state) => {
        state.stockByPavilionId[pavilionId] = stock;
      });
    },

    refreshStock: (pavilionId: string, now = Date.now()) => {
      const content = useContentStore.getState();
      if (!content.isLoaded || !content.maps.pavilionsById[pavilionId]) {
        return { ok: false, reason: 'content_loading' };
      }
      const existing = get().stockByPavilionId[pavilionId];
      if (!existing) {
        get().ensureStock(pavilionId, now);
        return { ok: true };
      }
      if (now < existing.nextRefreshAt) {
        return { ok: false, reason: 'not_ready' };
      }
      const refreshed = generateRefresh(existing, now);
      set((state) => {
        state.stockByPavilionId[pavilionId] = refreshed;
      });
      GameEvents.emit({
        type: 'pavilion/stock_refreshed',
        payload: { pavilionId, cityId: refreshed.cityId, cityIndex: refreshed.cityIndex, at: now },
      });
      return { ok: true };
    },

    getStock: (pavilionId: string) => get().stockByPavilionId[pavilionId] ?? null,

    buyManual: ({ pavilionId, stockId, mode = 'buy' }) => {
      if (get().isPurchasing) {
        return { ok: false, reason: 'purchase_in_progress' };
      }

      const fail = (reason: string): ManualPurchaseResult => {
        set((state) => {
          state.lastError = reason;
          state.isPurchasing = false;
        });
        return { ok: false, reason };
      };

      const content = useContentStore.getState();
      if (!content.isLoaded) return fail('content_loading');

      const inventory = useInventoryStore.getState();
      const techCollection = useTechCollectionStore.getState();

      let stock = get().stockByPavilionId[pavilionId];
      if (!stock) {
        get().ensureStock(pavilionId, Date.now());
        stock = get().stockByPavilionId[pavilionId];
      }
      if (!stock) return fail('stock_missing');

      const slot = stock.slots.find((entry) => entry.slotIndex === stockId);
      if (!slot) return fail('slot_missing');
      if (slot.sold) return fail('already_sold');
      if (slot.notSold) return fail('not_sold_here');
      if (slot.sealed) return fail('sealed');

      const cost = normalizeCost(slot.price);
      if (!cost) return fail('invalid_cost');
      if (!inventory.canAffordCurrency(cost)) return fail('insufficient_funds');

      const ownedEntry = techCollection.ensureTechState(slot.techniqueId);
      const hasTech = techCollection.hasTech(slot.techniqueId);
      const duplicate = determineDuplicate(slot, hasTech, ownedEntry.manualGrade, ownedEntry.rarity);
      const manualId = manualIdForSlot(slot);
      const manualName = content.maps.techniquesById[slot.techniqueId]?.name ?? slot.techniqueId;
      const purchaseMode: 'buy' | 'buyAndStudy' = mode === 'buyAndStudy' ? 'buyAndStudy' : 'buy';
      const satchelState = useManualSatchelStore.getState();
      const existingManualIds = new Set(
        satchelState.manuals
          .filter((manual) => manual.techId === slot.techniqueId && manual.grade === slot.grade && manual.rarity === slot.rarity)
          .map((manual) => manual.id),
      );

      set((state) => {
        state.isPurchasing = true;
        state.lastError = null;
      });

      const now = Date.now();
      const spent = RewardService.spendCurrency(cost, 'Manual Pavilion Purchase');
      if (!spent) return fail('spend_failed');

      let result: ManualPurchaseResult;

      if (duplicate) {
        const economy = (content.raw as any)?.economy?.manualSystem;
        const rarityValue = Number(economy?.rarityFragmentValue?.[slot.rarity] ?? 0);
        const gradeMultiplier = Number(economy?.gradeFragmentMultiplier?.[slot.grade] ?? 1);
        const gained = Math.max(0, Math.floor(rarityValue * gradeMultiplier));
        const fragmentsBefore = techCollection.getFragments(slot.techniqueId) ?? 0;
        if (gained > 0) {
          RewardService.grantRewards(
            { techniqueFragments: [{ techId: slot.techniqueId, qty: gained }] },
            'Duplicate Manual Converted',
          );
        }
        const fragmentsAfter = fragmentsBefore + gained;
        const rankCap = techCollection.getRankCap(slot.techniqueId);
        const nextRank = Math.min(rankCap, (ownedEntry.rank ?? 1) + 1);
        const nextRankCost = techCollection.getRankUpgradeCost(nextRank);
        result = {
          ok: true,
          outcome: 'duplicateConverted',
          manualId,
          techId: slot.techniqueId,
          manualName,
          grade: slot.grade,
          rarity: slot.rarity,
          fragmentsGained: gained,
          fragmentsBefore,
          fragmentsAfter,
          nextRank: nextRankCost ? nextRank : undefined,
          nextRankCostFragments: nextRankCost?.fragmentsRequired,
          cost,
          mode: purchaseMode,
        };
      } else {
        RewardService.grantRewards(
          { manuals: [{ manualId, techId: slot.techniqueId, grade: slot.grade, rarity: slot.rarity, qty: 1 }] },
          'Buy Manual',
        );
        const updatedSatchel = useManualSatchelStore.getState();
        const newManual = updatedSatchel.manuals
          .filter((manual) => manual.techId === slot.techniqueId && manual.grade === slot.grade && manual.rarity === slot.rarity)
          .find((manual) => !existingManualIds.has(manual.id));
        const count = updatedSatchel.getManualCount(slot.techniqueId, slot.grade, slot.rarity);
        result = {
          ok: true,
          outcome: 'manualGranted',
          manualId,
          manualInstanceId: newManual?.id,
          techId: slot.techniqueId,
          manualName,
          grade: slot.grade,
          rarity: slot.rarity,
          cost,
          satchelCount: count,
          mode: purchaseMode,
        };
      }

      set((state) => {
        const current = state.stockByPavilionId[pavilionId];
        if (current) {
          const target = current.slots.find((entry) => entry.slotIndex === stockId);
          if (target) {
            target.sold = true;
            target.soldAt = now;
          }
        }
        state.isPurchasing = false;
        state.lastError = null;
      });

      GameEvents.emit({
        type: 'manuals/purchased',
        payload: { manualId, techniqueId: slot.techniqueId, cost },
      });

      return result;
    },

    hydrate: (data) => {
      if (!data || typeof data !== 'object') return;
      const cloned = cloneState(data.stockByPavilionId);
      set((state) => {
        state.stockByPavilionId = cloned;
        state.isPurchasing = false;
        state.lastError = null;
      });
    },

    hardReset: () => {
      set({ stockByPavilionId: {}, isPurchasing: false, lastError: null });
    },
  })),
);
