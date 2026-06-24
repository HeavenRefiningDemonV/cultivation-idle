import { create } from 'zustand';
import type {
  PanoplyPathLean,
  VaultGradeFilter,
  VaultSlotFilter,
  VaultSortBy,
  VaultSortDir,
} from '../systems/ui/equipment/equipmentExactTypes.js';

/**
 * M.III.3 EQ-PORT — the Panoply/Vault VIEW-STATE slice (Appendix G). VIEW-STATE ONLY: which surface is
 * active, the vault filter/sort, the selected + modal instance, and the "new since last open" dot set.
 * NO gameplay state, NO persistence of gameplay — the equipped loadout + held instances live in
 * equipmentStore/inventoryStore. The owner subscribes to slices via inline narrow selectors.
 */
export interface PanoplyUiState {
  activeSurface: 'panoply' | 'vault';
  /** null → use gameStore.selectedPath; an override is a dev/QA affordance only. */
  pathLeanOverride: PanoplyPathLean | null;
  vaultFilter: { slot: VaultSlotFilter; grade: VaultGradeFilter };
  vaultSort: { by: VaultSortBy; dir: VaultSortDir };
  selectedInstanceId: string | null;
  modalInstanceId: string | null;
  newInstanceIds: ReadonlySet<string>;
  setActiveSurface: (s: 'panoply' | 'vault') => void;
  setVaultFilter: (f: Partial<{ slot: VaultSlotFilter; grade: VaultGradeFilter }>) => void;
  setVaultSort: (s: Partial<{ by: VaultSortBy; dir: VaultSortDir }>) => void;
  selectInstance: (id: string | null) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  /** clear the `isNew` dots for the given instance ids. */
  markSeen: (ids: Iterable<string>) => void;
}

export const usePanoplyUiStore = create<PanoplyUiState>()((set) => ({
  activeSurface: 'panoply',
  pathLeanOverride: null,
  vaultFilter: { slot: 'all', grade: 'all' },
  vaultSort: { by: 'rarity', dir: 'desc' },
  selectedInstanceId: null,
  modalInstanceId: null,
  newInstanceIds: new Set<string>(),
  setActiveSurface: (s) => set({ activeSurface: s }),
  setVaultFilter: (f) => set((st) => ({ vaultFilter: { ...st.vaultFilter, ...f } })),
  setVaultSort: (s) => set((st) => ({ vaultSort: { ...st.vaultSort, ...s } })),
  selectInstance: (id) => set({ selectedInstanceId: id }),
  openModal: (id) => set({ modalInstanceId: id, selectedInstanceId: id }),
  closeModal: () => set({ modalInstanceId: null }),
  markSeen: (ids) =>
    set((st) => {
      const next = new Set(st.newInstanceIds);
      let changed = false;
      for (const id of ids) {
        if (next.delete(id)) changed = true;
      }
      return changed ? { newInstanceIds: next } : {};
    }),
}));
