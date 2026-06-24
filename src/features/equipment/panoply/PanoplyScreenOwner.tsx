import { useEffect, useMemo, useRef } from 'react';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { usePanoplyUiStore } from '../../../stores/panoplyUiStore.js';
import {
  buildPanoplyExactFixture,
  buildPanoplyExactSurface,
  buildVaultExactFixture,
  buildVaultExactSurface,
} from '../../../systems/ui/equipment/index.js';
import { readPanoplyVaultRawInput } from '../../../systems/ui/equipment/panoplyVaultInput.js';
import { PanoplyVaultScreen } from '../../../ui/equipment/panoply/PanoplyVaultScreen.js';
import { ItemDetailInspector } from '../../../ui/modals/ItemDetailInspector.js';
import { usePanoplyActionController } from './usePanoplyActionController.js';
import type { PanoplyInitialSurface, PanoplyMode } from './panoplyFlag.js';
import type { PanoplyPathLean } from '../../../systems/ui/equipment/equipmentExactTypes.js';

/**
 * M.III.3 EQ-PORT — the owner: narrow store selectors → the input seam → the builders → the render-only
 * screen + the action controller. Zustand selectors live HERE (never whole-store subscriptions); the
 * screen never touches a store. Mirrors `CultivationSeatScreenOwner`. The F2 `ItemDetailInspector` is
 * REUSED for the modal (not rebuilt).
 */
export function PanoplyScreenOwner({
  mode = 'live',
  fixtureId = null,
  initialSurface = null,
  pathOverride = null,
}: {
  mode?: PanoplyMode;
  fixtureId?: string | null;
  initialSurface?: PanoplyInitialSurface | null;
  /** dev/QA only (fixture mode) — recasts the fixture's pathLean to exercise the path×state scene cross. */
  pathOverride?: PanoplyPathLean | null;
}) {
  const actions = usePanoplyActionController();

  // Narrow subscriptions that drive a rebuild when the live truth changes.
  const gearLoadoutVersion = useEquipmentStore((s) => s.gearLoadoutVersion);
  const inventoryVersion = useInventoryStore((s) => s.inventoryVersion);
  const selectedPath = useGameStore((s) => s.selectedPath);
  const realmIndex = useGameStore((s) => s.realm.index);
  const activeSurface = usePanoplyUiStore((s) => s.activeSurface);
  const vaultFilter = usePanoplyUiStore((s) => s.vaultFilter);
  const vaultSort = usePanoplyUiStore((s) => s.vaultSort);
  const selectedInstanceId = usePanoplyUiStore((s) => s.selectedInstanceId);
  const modalInstanceId = usePanoplyUiStore((s) => s.modalInstanceId);
  const newInstanceIds = usePanoplyUiStore((s) => s.newInstanceIds);
  const setActiveSurface = usePanoplyUiStore((s) => s.setActiveSurface);

  const reducedMotion = useMemo(() => {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    } catch {
      return false;
    }
  }, []);

  // Seed the active surface once from the flag's initialSurface (dev/QA + harness affordance).
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && initialSurface) {
      seededRef.current = true;
      setActiveSurface(initialSurface);
    }
  }, [initialSurface, setActiveSurface]);

  const surfaces = useMemo(() => {
    if (mode === 'fixture') {
      const seed = fixtureId ?? 'healthy';
      const panoplyFixture = buildPanoplyExactFixture(seed);
      return {
        panoply: pathOverride ? { ...panoplyFixture, pathLean: pathOverride } : panoplyFixture,
        vault: buildVaultExactFixture(seed),
      };
    }
    const raw = readPanoplyVaultRawInput({ vaultFilter, vaultSort, selectedInstanceId, newInstanceIds });
    return { panoply: buildPanoplyExactSurface(raw.panoply), vault: buildVaultExactSurface(raw.vault) };
    // The subscribed primitives below are the rebuild signature (reducedMotion threads to the scene paint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fixtureId, pathOverride, gearLoadoutVersion, inventoryVersion, selectedPath, realmIndex, vaultFilter, vaultSort, selectedInstanceId, newInstanceIds, reducedMotion]);

  const modalDetail =
    modalInstanceId !== null
      ? activeSurface === 'panoply'
        ? surfaces.panoply.selectedDetail
        : surfaces.vault.selectedDetail
      : null;

  return (
    <>
      <PanoplyVaultScreen
        panoply={surfaces.panoply}
        vault={surfaces.vault}
        activeSurface={activeSurface}
        actions={actions}
      />
      {modalInstanceId !== null && modalDetail ? (
        <ItemDetailInspector
          open
          surface={modalDetail}
          onAction={actions.onAction}
          onClose={actions.closeModal}
        />
      ) : null}
    </>
  );
}
