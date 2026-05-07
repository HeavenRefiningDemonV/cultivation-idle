import { useCallback } from 'react';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useShopStore } from '../../../stores/shopStore.js';
import { useUIStore, type WorldBuildingKey } from '../../../stores/uiStore.js';
import type { MedicinePouchSlotKey } from '../../../types/index.js';
import { buildApothecaryExactSurfaceFromStores } from './buildApothecaryExactSurface.js';
import { buildApothecaryExactPackagePlan } from './apothecaryExactPackagePlanner.js';
import type {
  ApothecaryExactButtonSurface,
  ApothecaryExactRouteTarget,
  ApothecaryExactSurfaceV1,
} from './apothecaryExactTypes.js';

interface ControllerArgs {
  cityId: string;
  shopId: string | null;
  surface: ApothecaryExactSurfaceV1;
  onOpenPouchModal: () => void;
}

function routeTargetToWorldBuilding(target: ApothecaryExactRouteTarget | undefined): WorldBuildingKey | null {
  switch (target) {
    case 'apothecary':
      return 'apothecary';
    case 'gateTrial':
      return 'gateTrial';
    case 'ruins':
      return 'ruins';
    case 'outskirts':
      return 'outskirts';
    case 'expeditions':
      return 'expeditions';
    case 'bounties':
      return 'bounties';
    case 'manualPavilion':
      return 'manualPavilion';
    case 'forge':
      return 'forge';
    default:
      return null;
  }
}

function itemName(action: ApothecaryExactButtonSurface): string {
  return action.itemName ?? action.itemId ?? 'item';
}

export function useApothecaryExactActionController(args: ControllerArgs) {
  const addNotification = useUIStore((state) => state.addNotification);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);

  const handleBuyAction = useCallback((action: ApothecaryExactButtonSurface) => {
    const shopId = args.shopId ?? args.surface.meta.shopId;
    const stockId = action.stockId;
    const qty = Math.max(1, Math.floor(action.qty ?? 1));
    if (!shopId || !stockId) {
      addNotification('warning', `No live shop stock is available for ${itemName(action)}.`);
      return false;
    }

    const shop = useShopStore.getState();
    const canBuy = shop.canBuy(shopId, stockId, qty);
    if (!canBuy.ok) {
      addNotification('warning', canBuy.error ?? `Cannot buy ${itemName(action)}.`);
      return false;
    }

    const result = shop.buy(shopId, stockId, qty);
    if (!result.ok) {
      addNotification('error', result.error ?? `Purchase failed for ${itemName(action)}.`);
      return false;
    }

    addNotification('success', `Purchased ${result.grantedQty ?? qty} ${itemName(action)}.`);
    return true;
  }, [addNotification, args.shopId, args.surface.meta.shopId]);

  const handleBrewAction = useCallback((action: ApothecaryExactButtonSurface) => {
    const recipeId = action.recipeId;
    const qty = Math.max(1, Math.floor(action.qty ?? 1));
    if (!recipeId) {
      addNotification('warning', `No live recipe is available for ${itemName(action)}.`);
      return false;
    }

    const result = useProfessionStore.getState().startAlchemy(recipeId, qty);
    if (!result.ok) {
      addNotification('warning', result.error);
      return false;
    }

    addNotification('success', `Queued ${itemName(action)} brew batch.`);
    return true;
  }, [addNotification]);

  const handleSourceAction = useCallback((action: ApothecaryExactButtonSurface) => {
    const buildingKey = routeTargetToWorldBuilding(action.routeTarget);
    if (!buildingKey) {
      addNotification('info', action.disabledReason ?? `No known route for ${itemName(action)} yet.`);
      return false;
    }

    openWorldBuildingModal({
      cityId: args.cityId,
      buildingKey,
      intent: buildingKey === 'apothecary'
        ? { apothecaryExactMode: 'live', apothecaryFocus: 'source' }
        : buildingKey === 'gateTrial'
          ? { gateTrialExactMode: 'live' }
          : null,
    });
    return true;
  }, [addNotification, args.cityId, openWorldBuildingModal]);

  const handleAutoFill = useCallback(() => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture pouch preview is not mutating live slots.');
      return false;
    }

    const inventory = useInventoryStore.getState();
    const pouch = useMedicinePouchStore.getState();
    const liveRows = args.surface.prescription.rows
      .filter((row) => row.itemId && (inventory.items[row.itemId] ?? 0) > 0)
      .map((row) => ({ itemId: row.itemId!, itemName: row.itemName }));
    const healing = liveRows.find((row) => /healing/i.test(row.itemName));
    const specialty = liveRows.find((row) => !/healing/i.test(row.itemName));
    const assignments: Array<[MedicinePouchSlotKey, string | null]> = [
      ['healing', healing?.itemId ?? null],
      ['specialty', specialty?.itemId ?? null],
    ];

    assignments.forEach(([slotKey, itemId]) => {
      if (itemId) pouch.equip(slotKey, itemId);
    });

    addNotification(assignments.some(([, itemId]) => itemId) ? 'success' : 'warning', assignments.some(([, itemId]) => itemId)
      ? 'Medicine pouch auto-filled from owned recommended stock.'
      : 'No owned recommended stock is available for auto-fill.');
    return assignments.some(([, itemId]) => itemId);
  }, [addNotification, args.surface]);

  const handleBuyMissing = useCallback(() => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture buy actions are preview-only.');
      return false;
    }
    const actions = args.surface.buyLane.rows.map((row) => row.action).filter((action) => action.enabled);
    let okCount = 0;
    actions.forEach((action) => {
      if (handleBuyAction(action)) okCount += 1;
    });
    if (okCount === 0) addNotification('warning', 'No buyable missing stock is available right now.');
    return okCount > 0;
  }, [addNotification, args.surface, handleBuyAction]);

  const handleBrewMissing = useCallback(() => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture brew actions are preview-only.');
      return false;
    }
    const actions = args.surface.brewLane.rows
      .map((row) => row.action)
      .filter((action) => action.intent === 'brew-row' && action.enabled);
    let okCount = 0;
    actions.forEach((action) => {
      if (handleBrewAction(action)) okCount += 1;
    });
    if (okCount === 0) addNotification('warning', 'No brew-ready missing remedies are available right now.');
    return okCount > 0;
  }, [addNotification, args.surface, handleBrewAction]);

  const handlePreparePackage = useCallback(() => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture package preparation is preview-only.');
      return false;
    }

    const freshSurface = buildApothecaryExactSurfaceFromStores(args.cityId, {
      mode: 'live',
      shopId: args.shopId,
      focus: args.surface.meta.focus,
    });
    const plan = buildApothecaryExactPackagePlan(freshSurface);
    if (!plan.canExecuteSafely) {
      addNotification('warning', plan.disabledReason ?? 'Package preparation is blocked.');
      return false;
    }

    let buyCount = 0;
    let brewCount = 0;
    freshSurface.buyLane.rows
      .map((row) => row.action)
      .filter((action) => action.enabled)
      .forEach((action) => {
        if (handleBuyAction(action)) buyCount += 1;
      });
    freshSurface.brewLane.rows
      .map((row) => row.action)
      .filter((action) => action.intent === 'brew-row' && action.enabled)
      .forEach((action) => {
        if (handleBrewAction(action)) brewCount += 1;
      });

    if (buyCount === 0 && brewCount === 0) {
      addNotification(plan.status === 'ready' ? 'success' : 'warning', plan.status === 'ready'
        ? 'Foundation package already meets the current live target.'
        : `Next fix: ${plan.missingSummary}.`);
      return plan.status === 'ready';
    }

    addNotification('success', `Prepared available package actions: ${buyCount} buy, ${brewCount} brew.`);
    return true;
  }, [addNotification, args.cityId, args.shopId, args.surface.meta.focus, args.surface.meta.mode, handleBrewAction, handleBuyAction]);

  const handleAction = useCallback((action: ApothecaryExactButtonSurface) => {
    switch (action.intent) {
      case 'buy-row':
        return handleBuyAction(action);
      case 'brew-row':
        return handleBrewAction(action);
      case 'source-row':
      case 'source-ingredients':
        return handleSourceAction(action);
      case 'configure-pouch':
        args.onOpenPouchModal();
        return true;
      case 'autofill-pouch':
        return handleAutoFill();
      case 'buy-missing':
        return handleBuyMissing();
      case 'brew-missing':
        return handleBrewMissing();
      case 'prepare-package':
        return handlePreparePackage();
      case 'return-gate':
        openWorldBuildingModal({
          cityId: args.cityId,
          buildingKey: 'gateTrial',
          intent: { gateTrialExactMode: 'live' },
        });
        return true;
      case 'disabled':
      default:
        addNotification('info', action.disabledReason ?? 'This Apothecary action is unavailable.');
        return false;
    }
  }, [
    addNotification,
    args,
    handleAutoFill,
    handleBrewAction,
    handleBrewMissing,
    handleBuyAction,
    handleBuyMissing,
    handlePreparePackage,
    handleSourceAction,
    openWorldBuildingModal,
  ]);

  return {
    onAction: handleAction,
  };
}
