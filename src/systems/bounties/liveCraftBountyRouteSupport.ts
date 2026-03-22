import { buildApothecaryBuyReadModel } from '../../features/apothecary/apothecaryBuyReadModel.js';
import { getLiveForgeFloorReadModel } from '../forge/liveForgeFloorStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useShopStore } from '../../stores/shopStore.js';
import type { CraftBountyRouteSupportState } from '../../utils/bountyRouting.js';

export function buildLiveCraftBountyRouteSupportState(cityId: string): CraftBountyRouteSupportState {
  const content = useContentStore.getState();
  const shop = content.maps.apothecariesByCityId?.[cityId] ?? null;
  const inventory = useInventoryStore.getState();
  const purchasedTodayByStockId = shop ? useShopStore.getState().purchasedToday[shop.id] ?? {} : {};
  const buyReadModel = buildApothecaryBuyReadModel({
    content: content.raw,
    shop,
    inventoryItems: inventory.items,
    currencies: inventory.currencies,
    purchasedTodayByStockId,
  });
  const forgeFloor = getLiveForgeFloorReadModel({ cityId });
  const forgeRecommendation = forgeFloor.nextGateRecommendation;
  const forgeBelowFloor = forgeRecommendation
    ? forgeFloor.weaponRefineFloor < forgeRecommendation.weaponRefine ||
      forgeFloor.accessoryRefineFloor < forgeRecommendation.accessoryRefine ||
      forgeFloor.temperSuccessTotal < forgeRecommendation.temperSuccesses ||
      forgeFloor.runeTotalCount < forgeRecommendation.runeCountRecommended
    : false;
  const hasApothecaryQueue = useProfessionStore.getState().alchemyQueue.some((job) => job.cityId === cityId);

  return {
    apothecaryBelowFloor: buyReadModel.floorStatuses.some((floor) => !floor.met),
    forgeBelowFloor,
    apothecaryQueueOrStockGap:
      hasApothecaryQueue ||
      buyReadModel.biggestShortfallKey !== null ||
      Boolean(buyReadModel.bundleState.bundle && !buyReadModel.bundleState.buyableNow),
  };
}
