import { useEffect, useMemo } from 'react';
import { useGameStore } from '../../../stores/gameStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { getAvailablePerks, getPerkById } from '../../../data/pathPerks.js';
import { PerkSelectionModal } from '../../../components/modals/PerkSelectionModal.js';
import {
  readCultivationSeatRawInput,
} from '../../../systems/ui/cultivation/cultivationSeatInput.js';
import { buildCultivationSeatSurface } from '../../../systems/ui/cultivation/cultivationSeatSurface.js';
import { getSeatFixture } from '../../../systems/ui/cultivation/cultivationSeatFixtures.js';
import type { CultivationSeatMode } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';
import { CultivationSeatScreen } from '../../../ui/cultivation/seat/CultivationSeatScreen.js';
import { useCultivationSeatActionController } from './useCultivationSeatActionController.js';

/**
 * M.II.3 — the owner: narrow store selectors → the input seam → the builder → the render-only
 * screen + the action controller. Zustand selectors live here (never whole-store subscriptions);
 * the screen never touches a store. Mirrors `CultivationExactScreenOwner` / the Observatory owner.
 */
export function CultivationSeatScreenOwner({ mode = 'live', fixtureId = null }: { mode?: CultivationSeatMode; fixtureId?: string | null }) {
  const actions = useCultivationSeatActionController();

  // Narrow subscriptions that drive a rebuild when the live truth changes.
  const realmIndex = useGameStore((s) => s.realm.index);
  const substage = useGameStore((s) => s.realm.substage);
  const qi = useGameStore((s) => s.qi);
  const qiPerSecond = useGameStore((s) => s.qiPerSecond);
  const focusMode = useGameStore((s) => s.focusMode);
  const selectedPath = useGameStore((s) => s.selectedPath);
  const turbulence = useCultivationStore((s) => s.turbulence);
  const stability = useCultivationStore((s) => s.stability);
  const activeType = useActivityStore((s) => s.active?.type ?? null);

  // The realm-perk choice on a major crossing. gameStore.breakthrough() opens it (showPerkSelection);
  // the legacy owner renders it, so the Seat owner must too or the choice is silently lost.
  const pathPerks = useGameStore((s) => s.pathPerks);
  const showPerkSelectionModal = useUIStore((s) => s.showPerkSelectionModal);
  const perkSelectionRealm = useUIStore((s) => s.perkSelectionRealm);
  const showPerkSelection = useUIStore((s) => s.showPerkSelection);
  const hidePerkSelection = useUIStore((s) => s.hidePerkSelection);

  const reducedMotion = useMemo(() => {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    } catch {
      return false;
    }
  }, []);

  // Mirror the legacy owner: if the live realm has an unclaimed perk, surface the choice (redundant
  // with gameStore's call, guarded against double-open). Live only — fixtures never cross realms.
  useEffect(() => {
    if (mode !== 'live' || !selectedPath || realmIndex < 1) return;
    const hasRealmPerk = pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex);
    const availablePerks = getAvailablePerks(selectedPath, realmIndex);
    const perkModalAlreadyOpen = showPerkSelectionModal && perkSelectionRealm === realmIndex;
    if (availablePerks.length > 0 && !hasRealmPerk && !perkModalAlreadyOpen) {
      showPerkSelection(realmIndex);
    }
  }, [mode, pathPerks, perkSelectionRealm, realmIndex, selectedPath, showPerkSelection, showPerkSelectionModal]);

  const surface = useMemo(() => {
    if (mode === 'fixture') {
      const fixture = getSeatFixture(fixtureId ?? 'heavenSeclusion');
      if (fixture) return fixture;
    }
    const raw = readCultivationSeatRawInput({ reducedMotion, selectedScroll: actions.selectedScroll });
    return buildCultivationSeatSurface({ raw, mode, nowMs: Date.now() });
    // The subscribed primitives below are the rebuild signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fixtureId, reducedMotion, actions.selectedScroll, realmIndex, substage, qi, qiPerSecond, focusMode, selectedPath, turbulence, stability, activeType]);

  return (
    <>
      <CultivationSeatScreen surface={surface} actions={actions} />
      {/* The realm-perk choice — deferred until the crossing ceremony closes (mirrors the legacy
          owner's `!ritualSurface` defer), so it never overlaps the F2 ceremony shell. */}
      {!actions.ceremony.open && showPerkSelectionModal && perkSelectionRealm !== null ? (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      ) : null}
    </>
  );
}
