import { useMemo } from 'react';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { openWorldModule as openWorldModuleRuntime } from '../../../systems/world/openWorldModule.js';
import type { BountiesExactNoteSurface, BountiesExactSurfaceV1 } from './bountiesExactTypes.js';

export type BountiesExactOpenWorldModule = (args: { cityId: string; moduleKey: string; source?: string }) => void;

export type BountiesExactActionControllerArgs = {
  cityId: string | null;
  cityIndex: number | null;
  selectedOrderId: string | null;
  trackedOrderId: string | null;
  notes: readonly BountiesExactNoteSurface[];
  setSelectedOrderId: (orderId: string | null) => void;
  setTrackedBounty: (cityId: string, bountyId: string | null) => void;
  claim: (cityId: string, instanceId: string) => boolean;
  canRefresh: (cityId: string, now?: number) => boolean;
  refresh: (cityId: string, cityIndex: number) => void;
  openWorldModule: BountiesExactOpenWorldModule;
  now: () => number;
};

function liveNote(args: BountiesExactActionControllerArgs, orderId: string | null): BountiesExactNoteSurface | null {
  if (!orderId) return null;
  const note = args.notes.find((entry) => entry.id === orderId) ?? null;
  if (!note || note.id.startsWith('empty-')) return null;
  return note;
}

function firstReady(args: BountiesExactActionControllerArgs): BountiesExactNoteSurface | null {
  return args.notes.find((note) => !note.id.startsWith('empty-') && note.claimReady && !note.claimed) ?? null;
}

function routeNote(args: BountiesExactActionControllerArgs, note: BountiesExactNoteSurface | null): boolean {
  const target = note?.routeTarget;
  if (!target?.cityId || !target.moduleKey) return false;
  args.openWorldModule({
    cityId: target.cityId,
    moduleKey: target.moduleKey,
    source: 'bounties-exact-route',
  });
  return true;
}

export function createBountiesExactActionController(args: BountiesExactActionControllerArgs) {
  return {
    selectOrder(orderId: string) {
      const next = liveNote(args, orderId);
      if (!next) return false;
      args.setSelectedOrderId(next.id);
      return true;
    },
    trackSelected() {
      if (!args.cityId) return false;
      const selected = liveNote(args, args.selectedOrderId);
      if (!selected) return false;
      args.setTrackedBounty(args.cityId, args.trackedOrderId === selected.id ? null : selected.id);
      return true;
    },
    claimReady() {
      if (!args.cityId) return false;
      const selected = liveNote(args, args.selectedOrderId);
      const target = selected && selected.claimReady && !selected.claimed ? selected : firstReady(args);
      if (!target) return false;
      return args.claim(args.cityId, target.id);
    },
    claimAllReady() {
      if (!args.cityId) return false;
      let claimedAny = false;
      const ready = args.notes.filter((note) => !note.id.startsWith('empty-') && note.claimReady && !note.claimed);
      ready.forEach((note) => {
        const ok = args.claim(args.cityId!, note.id);
        claimedAny = claimedAny || ok;
      });
      return claimedAny;
    },
    routeNow() {
      const selected = liveNote(args, args.selectedOrderId);
      const tracked = liveNote(args, args.trackedOrderId);
      return routeNote(args, selected?.routeTarget ? selected : tracked);
    },
    routeTrackedNotice() {
      const tracked = liveNote(args, args.trackedOrderId);
      const selected = liveNote(args, args.selectedOrderId);
      return routeNote(args, tracked?.routeTarget ? tracked : selected);
    },
    notePrimaryAction(orderId: string) {
      if (!args.cityId) return false;
      const note = liveNote(args, orderId);
      if (!note) return false;
      args.setSelectedOrderId(note.id);
      if (note.claimReady && !note.claimed) {
        return args.claim(args.cityId, note.id);
      }
      if (note.routeTarget) {
        return routeNote(args, note);
      }
      args.setTrackedBounty(args.cityId, args.trackedOrderId === note.id ? null : note.id);
      return true;
    },
    refreshBoard() {
      if (!args.cityId || args.cityIndex == null) return false;
      const now = args.now();
      if (!args.canRefresh(args.cityId, now)) return false;
      args.refresh(args.cityId, args.cityIndex);
      return true;
    },
  };
}

export function useBountiesExactActionController(args: {
  surface: BountiesExactSurfaceV1;
  setSelectedOrderId: (orderId: string | null) => void;
  now: number;
}) {
  const setTrackedBounty = useBountyStore((state) => state.setTrackedBounty);
  const claim = useBountyStore((state) => state.claim);
  const canRefresh = useBountyStore((state) => state.canRefresh);
  const refresh = useBountyStore((state) => state.refresh);

  return useMemo(
    () => createBountiesExactActionController({
      cityId: args.surface.meta.cityId,
      cityIndex: args.surface.meta.cityIndex,
      selectedOrderId: args.surface.meta.selectedOrderId,
      trackedOrderId: args.surface.meta.trackedOrderId,
      notes: args.surface.postedOrders.notes,
      setSelectedOrderId: args.setSelectedOrderId,
      setTrackedBounty,
      claim,
      canRefresh,
      refresh,
      openWorldModule: openWorldModuleRuntime,
      now: () => args.now,
    }),
    [args.now, args.setSelectedOrderId, args.surface, canRefresh, claim, refresh, setTrackedBounty],
  );
}
