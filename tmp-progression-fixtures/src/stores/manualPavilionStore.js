import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { GameEvents } from "../services/events/GameEvents.js";
import { buildDoctrineSnapshot } from "../systems/doctrine/index.js";
import { getDuplicateFragmentValue, isDuplicateManualOffer, } from "../systems/manuals/index.js";
import { buildInitialStock, refreshStock as generateRefresh, } from "../features/manuals/pavilionStockGenerator.js";
import { RewardService } from "../services/rewards/RewardService.js";
import { useContentStore } from "./contentStore.js";
import { useInventoryStore } from "./inventoryStore.js";
import { useTechCollectionStore } from "./techCollectionStore.js";
import { useManualSatchelStore } from "./manualSatchelStore.js";
import { bumpVersion } from "./versionCounters.js";
function cloneState(source) {
    if (!source || typeof source !== "object")
        return {};
    const copy = {};
    Object.entries(source).forEach(([pavilionId, stock]) => {
        if (!stock || typeof stock !== "object")
            return;
        copy[pavilionId] = {
            ...stock,
            slots: Array.isArray(stock.slots)
                ? stock.slots.map((slot) => ({
                    ...slot,
                    sold: Boolean(slot.sold),
                    soldAt: typeof slot.soldAt === "number" ? slot.soldAt : undefined,
                }))
                : [],
            pity: { ...(stock.pity ?? { featuredEpic: 0, featuredLegendary: 0 }) },
            history: Array.isArray(stock.history)
                ? stock.history.map((entry) => ({ ...entry }))
                : [],
        };
    });
    return copy;
}
function normalizeCost(price) {
    if (!price || typeof price !== "object")
        return null;
    const bundle = {};
    ["gold", "spiritStones", "merit"].forEach((key) => {
        const raw = price[key];
        if (raw === undefined || raw === null)
            return;
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0)
            return;
        bundle[key] = String(raw);
    });
    return Object.keys(bundle).length > 0 ? bundle : null;
}
function manualIdForSlot(slot) {
    return `${slot.techniqueId}:${slot.grade}:${slot.rarity}:manual`;
}
function bumpPavilionVersion(state, pavilionId) {
    state.stockVersion = bumpVersion(state.stockVersion);
    const cityId = useContentStore.getState().maps.pavilionsById[pavilionId]?.cityId;
    if (cityId) {
        state.pavilionVersionByCityId[cityId] = bumpVersion(state.pavilionVersionByCityId[cityId]);
    }
}
export const useManualPavilionStore = create()(immer((set, get) => ({
    stockByPavilionId: {},
    stockVersion: 0,
    pavilionVersionByCityId: {},
    isPurchasing: false,
    lastError: null,
    ensureStock: (pavilionId, now = Date.now()) => {
        const content = useContentStore.getState();
        if (!content.isLoaded || !content.maps.pavilionsById[pavilionId])
            return;
        if (get().stockByPavilionId[pavilionId])
            return;
        const stock = buildInitialStock(pavilionId, now, {
            snapshot: buildDoctrineSnapshot(),
            buildAnalysis: null,
        });
        set((state) => {
            state.stockByPavilionId[pavilionId] = stock;
            bumpPavilionVersion(state, pavilionId);
        });
    },
    refreshStock: (pavilionId, now = Date.now()) => {
        const content = useContentStore.getState();
        if (!content.isLoaded || !content.maps.pavilionsById[pavilionId]) {
            GameEvents.emit({
                type: "pavilion/refresh_denied",
                payload: { pavilionId, reason: "content_loading" },
            });
            return { ok: false, reason: "content_loading" };
        }
        const existing = get().stockByPavilionId[pavilionId];
        if (!existing) {
            get().ensureStock(pavilionId, now);
            const pavilionEntry = content.maps.pavilionsById[pavilionId];
            GameEvents.emit({
                type: "pavilion/refresh_confirmed",
                payload: {
                    pavilionId,
                    cityId: pavilionEntry?.cityId ?? "unknown",
                    cityIndex: pavilionEntry?.cityIndex ?? 0,
                    at: now,
                },
            });
            return { ok: true };
        }
        if (now < existing.nextRefreshAt) {
            GameEvents.emit({
                type: "pavilion/refresh_denied",
                payload: { pavilionId, reason: "not_ready" },
            });
            return { ok: false, reason: "not_ready" };
        }
        const previousPity = { ...existing.pity };
        const refreshed = generateRefresh(existing, now, {
            snapshot: buildDoctrineSnapshot(),
            buildAnalysis: null,
        });
        set((state) => {
            state.stockByPavilionId[pavilionId] = refreshed;
            bumpPavilionVersion(state, pavilionId);
        });
        GameEvents.emit({
            type: "pavilion/refresh_confirmed",
            payload: {
                pavilionId,
                cityId: refreshed.cityId,
                cityIndex: refreshed.cityIndex,
                at: now,
            },
        });
        if (previousPity.featuredEpic !== refreshed.pity.featuredEpic ||
            previousPity.featuredLegendary !== refreshed.pity.featuredLegendary) {
            if (previousPity.featuredLegendary > 0 &&
                refreshed.pity.featuredLegendary === 0) {
                GameEvents.emit({
                    type: "pavilion/guarantee_trigger",
                    payload: { previous: previousPity, next: refreshed.pity },
                });
            }
            else if (previousPity.featuredEpic > 0 &&
                refreshed.pity.featuredEpic === 0) {
                GameEvents.emit({
                    type: "pavilion/pity_major",
                    payload: { previous: previousPity, next: refreshed.pity },
                });
            }
            else if (refreshed.pity.featuredEpic > previousPity.featuredEpic ||
                refreshed.pity.featuredLegendary > previousPity.featuredLegendary) {
                GameEvents.emit({
                    type: "pavilion/pity_increment",
                    payload: { previous: previousPity, next: refreshed.pity },
                });
            }
        }
        GameEvents.emit({
            type: "pavilion/stock_refreshed",
            payload: {
                pavilionId,
                cityId: refreshed.cityId,
                cityIndex: refreshed.cityIndex,
                at: now,
            },
        });
        return { ok: true };
    },
    getStock: (pavilionId) => get().stockByPavilionId[pavilionId] ?? null,
    buyManual: ({ pavilionId, stockId, mode = "buy" }) => {
        let attemptEmitted = false;
        const emitFailure = (reason) => {
            if (attemptEmitted) {
                GameEvents.emit({
                    type: "pavilion/buy_failed",
                    payload: { pavilionId, slotIndex: stockId, reason },
                });
            }
        };
        if (get().isPurchasing) {
            emitFailure("purchase_in_progress");
            return { ok: false, reason: "purchase_in_progress" };
        }
        const fail = (reason) => {
            set((state) => {
                state.lastError = reason;
                state.isPurchasing = false;
                state.stockVersion = bumpVersion(state.stockVersion);
            });
            emitFailure(reason);
            return { ok: false, reason };
        };
        const content = useContentStore.getState();
        if (!content.isLoaded)
            return fail("content_loading");
        const inventory = useInventoryStore.getState();
        const techCollection = useTechCollectionStore.getState();
        let stock = get().stockByPavilionId[pavilionId];
        if (!stock) {
            get().ensureStock(pavilionId, Date.now());
            stock = get().stockByPavilionId[pavilionId];
        }
        if (!stock)
            return fail("stock_missing");
        const slot = stock.slots.find((entry) => entry.slotIndex === stockId);
        if (!slot)
            return fail("slot_missing");
        if (slot.sold)
            return fail("already_sold");
        if (slot.notSold)
            return fail("not_sold_here");
        if (slot.sealed)
            return fail("sealed");
        const purchaseMode = mode === "buyAndStudy" ? "buyAndStudy" : "buy";
        GameEvents.emit({
            type: "pavilion/buy_attempt",
            payload: {
                pavilionId,
                slotIndex: stockId,
                techniqueId: slot.techniqueId,
                mode: purchaseMode,
            },
        });
        attemptEmitted = true;
        const cost = normalizeCost(slot.price);
        if (!cost)
            return fail("invalid_cost");
        if (!inventory.canAffordCurrency(cost))
            return fail("insufficient_funds");
        const hasTech = techCollection.hasTech(slot.techniqueId);
        const progression = hasTech
            ? techCollection.getTechniqueProgressionSnapshot(slot.techniqueId)
            : null;
        const duplicate = isDuplicateManualOffer({
            hasTechnique: hasTech,
            ownedGrade: progression?.grade ?? "mortal",
            ownedRarity: progression?.rarity ?? "common",
            offerGrade: slot.grade,
            offerRarity: slot.rarity,
        });
        const manualId = manualIdForSlot(slot);
        const manualName = content.maps.techniquesById[slot.techniqueId]?.name ?? slot.techniqueId;
        const satchelState = useManualSatchelStore.getState();
        const existingManualIds = new Set(satchelState.manuals
            .filter((manual) => manual.techId === slot.techniqueId &&
            manual.grade === slot.grade &&
            manual.rarity === slot.rarity)
            .map((manual) => manual.id));
        set((state) => {
            state.isPurchasing = true;
            state.lastError = null;
            state.stockVersion = bumpVersion(state.stockVersion);
        });
        const now = Date.now();
        const spent = RewardService.spendCurrency(cost, "Manual Pavilion Purchase");
        if (!spent)
            return fail("spend_failed");
        let result;
        if (duplicate) {
            const gained = getDuplicateFragmentValue(slot.grade, slot.rarity);
            const fragmentsBefore = techCollection.getFragments(slot.techniqueId) ?? 0;
            if (gained > 0) {
                RewardService.grantRewards({ techniqueFragments: [{ techId: slot.techniqueId, qty: gained }] }, "Duplicate Manual Converted");
            }
            const fragmentsAfter = fragmentsBefore + gained;
            const rankCap = techCollection.getRankCap(slot.techniqueId);
            const nextRank = Math.min(rankCap, (progression?.rank ?? 1) + 1);
            const nextRankCost = techCollection.getRankUpgradeCost(nextRank);
            result = {
                ok: true,
                outcome: "duplicateConverted",
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
        }
        else {
            RewardService.grantRewards({
                manuals: [
                    {
                        manualId,
                        techId: slot.techniqueId,
                        grade: slot.grade,
                        rarity: slot.rarity,
                        qty: 1,
                    },
                ],
            }, "Buy Manual");
            const updatedSatchel = useManualSatchelStore.getState();
            const newManual = updatedSatchel.manuals
                .filter((manual) => manual.techId === slot.techniqueId &&
                manual.grade === slot.grade &&
                manual.rarity === slot.rarity)
                .find((manual) => !existingManualIds.has(manual.id));
            const count = updatedSatchel.getManualCount(slot.techniqueId, slot.grade, slot.rarity);
            result = {
                ok: true,
                outcome: "manualGranted",
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
            bumpPavilionVersion(state, pavilionId);
        });
        GameEvents.emit({
            type: "manuals/purchased",
            payload: { manualId, techniqueId: slot.techniqueId, cost },
        });
        GameEvents.emit({
            type: "pavilion/buy_success",
            payload: {
                pavilionId,
                slotIndex: stockId,
                techniqueId: slot.techniqueId,
                outcome: result.outcome,
                mode: purchaseMode,
            },
        });
        return result;
    },
    hydrate: (data) => {
        if (!data || typeof data !== "object")
            return;
        const cloned = cloneState(data.stockByPavilionId);
        set((state) => {
            state.stockByPavilionId = cloned;
            state.isPurchasing = false;
            state.lastError = null;
            state.stockVersion = bumpVersion(state.stockVersion);
            state.pavilionVersionByCityId = {};
        });
    },
    hardReset: () => {
        set({
            stockByPavilionId: {},
            stockVersion: 0,
            pavilionVersionByCityId: {},
            isPurchasing: false,
            lastError: null,
        });
    },
})));
