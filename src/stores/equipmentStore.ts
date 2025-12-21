import { create } from 'zustand';

export type EquipmentSlot = 'weapon' | 'accessory';

interface EquipmentState {
  applyRefineFromForge: (slot: EquipmentSlot, qty: number) => void;
}

export const useEquipmentStore = create<EquipmentState>(() => ({
  applyRefineFromForge: () => {
    // Placeholder - refinement effects wired in Prompt 14C.
  },
}));
