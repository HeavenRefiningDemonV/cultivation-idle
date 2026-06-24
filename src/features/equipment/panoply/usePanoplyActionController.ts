import { useCallback, useMemo } from 'react';
import { usePanoplyUiStore } from '../../../stores/panoplyUiStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { GEAR_ITEM_DEFS } from '../../../content/gearItems.js';
import type { GearSlot, ItemDef } from '../../../systems/equipment/gearModel.js';
import type { Loadout } from '../../../systems/equipment/gearLoadout.js';
import type {
  PanoplyInitialSurface,
} from './panoplyFlag.js';
import type {
  VaultGradeFilter,
  VaultSlotFilter,
  VaultSortBy,
  VaultSortDir,
} from '../../../systems/ui/equipment/equipmentExactTypes.js';

/**
 * M.III.3 EQ-PORT — the action controller (mirrors useCultivationSeatActionController). Maps the OPAQUE
 * intent routes the surfaces emit → the live store endpoints. The controller imports stores; the screen
 * does NOT. No gameplay math here — only intent routing. Confirm-gating for dismantle/sell is owned by the
 * calling renderer (the F2 inspector + the rail forward the route only AFTER the user confirms).
 */
export interface PanoplyActions {
  activeSurface: PanoplyInitialSurface;
  selectedInstanceId: string | null;
  modalInstanceId: string | null;
  onSelect: (instanceId: string | null) => void;
  onSlotTap: (slot: GearSlot, instanceId?: string | null) => void;
  onOpenModal: (instanceId: string) => void;
  closeModal: () => void;
  onSetSurface: (s: PanoplyInitialSurface) => void;
  onFilter: (f: Partial<{ slot: VaultSlotFilter; grade: VaultGradeFilter }>) => void;
  onSort: (s: Partial<{ by: VaultSortBy; dir: VaultSortDir }>) => void;
  /** the OPAQUE route the surface emits (equipment.equip | equipment.unequip | vault.dismantle | …). */
  onAction: (route: string) => void;
}

function resolveDef(defId: string): ItemDef | undefined {
  const gear = GEAR_ITEM_DEFS.find((d) => d.id === defId);
  if (gear) return gear;
  try {
    return useContentStore.getState().getItem(defId);
  } catch {
    return undefined;
  }
}

function findEquippedSlot(loadout: Loadout, instanceId: string): GearSlot | null {
  if (loadout.weapon?.instanceId === instanceId) return 'weapon';
  if (loadout.head?.instanceId === instanceId) return 'head';
  if (loadout.chest?.instanceId === instanceId) return 'chest';
  if (loadout.legs?.instanceId === instanceId) return 'legs';
  if (loadout.accessories.some((a) => a.instanceId === instanceId)) return 'accessory';
  return null;
}

export function usePanoplyActionController(): PanoplyActions {
  const activeSurface = usePanoplyUiStore((s) => s.activeSurface);
  const selectedInstanceId = usePanoplyUiStore((s) => s.selectedInstanceId);
  const modalInstanceId = usePanoplyUiStore((s) => s.modalInstanceId);
  const selectInstance = usePanoplyUiStore((s) => s.selectInstance);
  const openModal = usePanoplyUiStore((s) => s.openModal);
  const closeModal = usePanoplyUiStore((s) => s.closeModal);
  const setActiveSurface = usePanoplyUiStore((s) => s.setActiveSurface);
  const setVaultFilter = usePanoplyUiStore((s) => s.setVaultFilter);
  const setVaultSort = usePanoplyUiStore((s) => s.setVaultSort);

  const onAction = useCallback((route: string) => {
    const id = usePanoplyUiStore.getState().modalInstanceId ?? usePanoplyUiStore.getState().selectedInstanceId;
    if (!id) return;
    const equipment = useEquipmentStore.getState();
    const inventory = useInventoryStore.getState();
    if (route === 'equipment.equip' || route === 'item.equip') {
      const instance = inventory.gearInstances[id];
      const def = resolveDef(instance?.defId ?? id);
      const slot = def?.gearSlot;
      if (instance && def && slot) {
        equipment.equipInstance(instance, def, slot, useGameStore.getState().realm.index);
      }
      return;
    }
    if (route === 'equipment.unequip' || route === 'item.unequip') {
      const slot = findEquippedSlot(equipment.loadout, id);
      if (slot) equipment.unequipSlot(slot, id);
      return;
    }
    if (route === 'vault.dismantle' || route === 'item.dismantle') {
      inventory.dismantleGearInstance(id);
      return;
    }
    // Any other route (upgrade/sell/bond/HELD) has no live endpoint yet — do NOT silently no-op a mutation;
    // the surface marks such actions disabled with their disabledReason, so reaching here is a no-op by design.
  }, []);

  const onSlotTap = useCallback(
    (_slot: GearSlot, instanceId?: string | null) => {
      selectInstance(instanceId ?? null);
    },
    [selectInstance],
  );

  return useMemo<PanoplyActions>(
    () => ({
      activeSurface,
      selectedInstanceId,
      modalInstanceId,
      onSelect: selectInstance,
      onSlotTap,
      onOpenModal: openModal,
      closeModal,
      onSetSurface: setActiveSurface,
      onFilter: setVaultFilter,
      onSort: setVaultSort,
      onAction,
    }),
    [
      activeSurface, selectedInstanceId, modalInstanceId, selectInstance, onSlotTap,
      openModal, closeModal, setActiveSurface, setVaultFilter, setVaultSort, onAction,
    ],
  );
}
