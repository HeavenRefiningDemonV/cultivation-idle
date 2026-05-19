import { useMemo } from 'react';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import type {
  DispatchSlotSurface,
  ExpeditionRouteCardSurface,
  ExpeditionsExactSurfaceV1,
} from './expeditionsExactTypes.js';

type ClaimResult = { ok: boolean; error?: string };

export type ExpeditionsExactActionControllerArgs = {
  cityId: string | null;
  cityIndex: number | null;
  selectedRouteId: string | null;
  selectedDurationId: string | null;
  selectedSlotIndex: number | null;
  dispatchSlots: readonly DispatchSlotSurface[];
  routes: readonly ExpeditionRouteCardSurface[];
  readySlotIndexes: readonly number[];
  setSelectedRouteId: (routeId: string | null) => void;
  setSelectedDurationId: (durationId: string | null) => void;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  start: (slotIndex: number, typeId: string, durationId: string, cityId: string, cityIndex: number) => boolean;
  claim: (slotIndex: number) => ClaimResult;
};

function recommendedRoute(args: ExpeditionsExactActionControllerArgs): ExpeditionRouteCardSurface | null {
  return args.routes.find((route) => route.recommended) ?? args.routes[0] ?? null;
}

function selectedRoute(args: ExpeditionsExactActionControllerArgs): ExpeditionRouteCardSurface | null {
  return args.routes.find((route) => route.routeId === args.selectedRouteId) ?? recommendedRoute(args);
}

function firstIdleSlot(args: ExpeditionsExactActionControllerArgs): number | null {
  const slot = args.dispatchSlots.find((entry) => entry.status === 'idle' && entry.realSlotIndex !== null);
  return slot?.realSlotIndex ?? null;
}

function selectedIdleSlot(args: ExpeditionsExactActionControllerArgs): number | null {
  if (args.selectedSlotIndex !== null && args.dispatchSlots.some((slot) => slot.realSlotIndex === args.selectedSlotIndex && slot.status === 'idle')) {
    return args.selectedSlotIndex;
  }
  return firstIdleSlot(args);
}

export function createExpeditionsExactActionController(args: ExpeditionsExactActionControllerArgs) {
  return {
    selectRoute(routeId: string) {
      const route = args.routes.find((entry) => entry.routeId === routeId);
      if (!route || !route.button.enabled) return false;
      args.setSelectedRouteId(route.routeId);
      args.setSelectedDurationId(route.defaultDurationId);
      return true;
    },
    autoFillRecommended() {
      const route = recommendedRoute(args);
      const slotIndex = firstIdleSlot(args);
      if (!route || !route.defaultDurationId || slotIndex === null) return false;
      args.setSelectedRouteId(route.routeId);
      args.setSelectedDurationId(route.defaultDurationId);
      args.setSelectedSlotIndex(slotIndex);
      return true;
    },
    dispatchExpedition() {
      if (!args.cityId || args.cityIndex === null) return false;
      const route = selectedRoute(args);
      const durationId = args.selectedDurationId ?? route?.defaultDurationId ?? null;
      const slotIndex = selectedIdleSlot(args);
      if (!route || !durationId || slotIndex === null) return false;
      return args.start(slotIndex, route.routeId, durationId, args.cityId, args.cityIndex);
    },
    claimExpedition() {
      const slotIndex = args.readySlotIndexes[0];
      if (slotIndex === undefined) return false;
      return args.claim(slotIndex).ok;
    },
    claimAllReady() {
      let claimedAny = false;
      args.readySlotIndexes.forEach((slotIndex) => {
        const result = args.claim(slotIndex);
        claimedAny = claimedAny || result.ok;
      });
      return claimedAny;
    },
    slotAction(visualIndex: number) {
      const slot = args.dispatchSlots.find((entry) => entry.visualIndex === visualIndex);
      if (!slot || slot.realSlotIndex === null) return false;
      if (slot.status === 'claim-ready') {
        return args.claim(slot.realSlotIndex).ok;
      }
      if (slot.status === 'idle') {
        args.setSelectedSlotIndex(slot.realSlotIndex);
        return true;
      }
      return false;
    },
  };
}

export function useExpeditionsExactActionController(args: {
  surface: ExpeditionsExactSurfaceV1;
  setSelectedRouteId: (routeId: string | null) => void;
  setSelectedDurationId: (durationId: string | null) => void;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
}) {
  const start = useExpeditionStore((state) => state.start);
  const claim = useExpeditionStore((state) => state.claim);

  return useMemo(() => createExpeditionsExactActionController({
    cityId: args.surface.meta.cityId,
    cityIndex: args.surface.meta.cityIndex,
    selectedRouteId: args.surface.meta.selectedRouteId,
    selectedDurationId: args.surface.meta.selectedDurationId,
    selectedSlotIndex: args.surface.meta.selectedSlotIndex,
    dispatchSlots: args.surface.dispatchSlots,
    routes: args.surface.availableRoutes.routes,
    readySlotIndexes: args.surface.dispatchSlots
      .filter((slot) => slot.status === 'claim-ready' && slot.realSlotIndex !== null)
      .map((slot) => slot.realSlotIndex!),
    setSelectedRouteId: args.setSelectedRouteId,
    setSelectedDurationId: args.setSelectedDurationId,
    setSelectedSlotIndex: args.setSelectedSlotIndex,
    start,
    claim,
  }), [args, claim, start]);
}
