import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useEquipmentStore } from '../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useShopStore } from '../../stores/shopStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { getLiveForgeFloorReadModel } from '../forge/liveForgeFloorStore.js';
import { buildBestSourceIndex } from './bestSourceIndex.js';
import { buildLiveEconomicPhaseSnapshot, buildEconomicPhaseSnapshotFromState } from './economicPhaseResolver.js';
import { getSpendOrderPolicy } from './spendOrderPolicy.js';
import { buildSupportEconomyReadModelFromState } from './supportEconomyReadModel.js';
import { getApothecaryShopByCityId, getCityById } from './economicSourceAdapters.js';
function buildOwnedItemCountsById(content) {
    const bestSourceIndex = buildBestSourceIndex(content);
    const inventory = useInventoryStore.getState();
    return Object.fromEntries(bestSourceIndex.scopeTargetIds
        .filter((targetId) => !['gold', 'merit', 'spiritStones'].includes(targetId))
        .map((targetId) => [targetId, inventory.getQty(targetId)]));
}
function buildShopSnapshot(content, currentCityId) {
    const shopStore = useShopStore.getState();
    const shop = getApothecaryShopByCityId(content, currentCityId);
    const lines = shop
        ? shop.stock.map((entry) => {
            const purchasedToday = shopStore.getPurchased(shop.id, entry.id);
            return {
                shopId: shop.id,
                stockId: entry.id,
                itemId: entry.itemId,
                dailyLimit: entry.dailyLimit ?? null,
                purchasedToday,
                remainingToday: entry.dailyLimit == null ? null : Math.max(0, entry.dailyLimit - purchasedToday),
            };
        })
        : [];
    return {
        cityId: currentCityId,
        lines,
        purchasedTodayByStockId: Object.fromEntries(lines.map((line) => [line.stockId, line.purchasedToday])),
    };
}
function buildExpeditionSnapshot() {
    const expeditionState = useExpeditionStore.getState();
    const activeRuns = expeditionState.active.filter((run) => run.status === 'running');
    return {
        slots: expeditionState.slots,
        activeRunCount: activeRuns.length,
        availableSlotCount: Math.max(0, expeditionState.slots - activeRuns.length),
        activeRunTypeIds: activeRuns.map((run) => run.expeditionTypeId),
        activeOriginCityIds: activeRuns.map((run) => run.cityId),
    };
}
export function buildEconomicRuntimeSnapshotFromState(input) {
    const phase = buildEconomicPhaseSnapshotFromState({
        content: input.content,
        currentCityId: input.currentCityId,
        unlockedCityIds: input.unlockedCityIds,
        currentRealmIndex: input.currentRealmIndex,
        selectedPath: input.selectedPath,
        trialProgressById: input.currentTrialProgressById,
    });
    const currentCity = getCityById(input.content, input.currentCityId);
    const currentModuleAvailability = (currentCity?.modules ?? []);
    const bestSourceIndex = buildBestSourceIndex(input.content);
    const supportEconomy = buildSupportEconomyReadModelFromState({
        content: input.content,
        currencies: input.currencies,
        cityId: input.currentCityId,
    });
    const spendPolicy = getSpendOrderPolicy({
        gateIndex: phase.currentGateIndex,
        transitionId: phase.nextUnresolvedTransitionId,
        currentCityId: input.currentCityId,
        selectedPath: input.selectedPath,
        currentGateResolved: phase.currentGateResolved,
    });
    const shop = getApothecaryShopByCityId(input.content, input.currentCityId);
    const shopLines = shop
        ? shop.stock.map((entry) => {
            const purchased = input.purchasedTodayByStockId?.[entry.id] ?? 0;
            return {
                shopId: shop.id,
                stockId: entry.id,
                itemId: entry.itemId,
                dailyLimit: entry.dailyLimit ?? null,
                purchasedToday: purchased,
                remainingToday: entry.dailyLimit == null ? null : Math.max(0, entry.dailyLimit - purchased),
            };
        })
        : [];
    return {
        content: input.content,
        phase,
        spendPolicy,
        bestSourceIndex,
        currentCityId: phase.currentCityId,
        currentCityIndex: phase.currentCityIndex,
        unlockedCityIds: [...input.unlockedCityIds],
        currentModuleKey: input.currentCityId ? input.selectedModuleByCity?.[input.currentCityId] ?? null : null,
        currentModuleAvailability,
        selectedPath: input.selectedPath,
        currentRealmId: phase.currentRealmId,
        currentRealmIndex: phase.currentRealmIndex,
        currentGateIndex: phase.currentGateIndex,
        currentGateResolved: phase.currentGateResolved,
        nextUnresolvedGateTransitionId: phase.nextUnresolvedTransitionId,
        atContentCap: phase.atContentCap,
        currencies: { ...input.currencies },
        ownedItemCountsById: { ...input.itemCountsById },
        currentCityShop: {
            cityId: input.currentCityId,
            lines: shopLines,
            purchasedTodayByStockId: Object.fromEntries(shopLines.map((line) => [line.stockId, line.purchasedToday])),
        },
        forgeFloor: input.forgeFloor,
        supportEconomy,
        expeditionState: input.expeditionState,
        availableModuleKeys: currentModuleAvailability,
    };
}
export function buildLiveEconomicRuntimeSnapshot() {
    const content = useContentStore.getState().raw;
    if (!content) {
        throw new Error('[EconomicSnapshot] Content must be loaded.');
    }
    const cityState = useCityStore.getState();
    const inventory = useInventoryStore.getState();
    const game = useGameStore.getState();
    const trialState = useTrialStore.getState();
    const equipmentState = useEquipmentStore.getState();
    void equipmentState;
    const phase = buildLiveEconomicPhaseSnapshot();
    const forgeFloor = getLiveForgeFloorReadModel({ cityId: phase.currentCityId });
    const ownedItemCountsById = buildOwnedItemCountsById(content);
    const shopSnapshot = buildShopSnapshot(content, phase.currentCityId);
    const expeditionState = buildExpeditionSnapshot();
    return buildEconomicRuntimeSnapshotFromState({
        content,
        currentCityId: phase.currentCityId,
        unlockedCityIds: cityState.unlockedCityIds,
        selectedModuleByCity: cityState.selectedModuleByCity,
        selectedPath: game.selectedPath,
        currentRealmIndex: game.realm.index,
        currencies: {
            gold: inventory.currencies.gold ?? '0',
            merit: inventory.currencies.merit ?? '0',
            spiritStones: inventory.currencies.spiritStones ?? '0',
        },
        itemCountsById: ownedItemCountsById,
        purchasedTodayByStockId: shopSnapshot.purchasedTodayByStockId,
        forgeFloor,
        expeditionState,
        currentTrialProgressById: trialState.progressByTrialId,
    });
}
