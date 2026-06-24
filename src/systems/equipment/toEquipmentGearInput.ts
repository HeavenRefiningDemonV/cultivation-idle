/**
 * M.III.1 EQ-MECH / S2 — the pure store-reading adapter for the gear wire (mirrors the
 * observatoryConstellationInput seam). Reads the live equipmentStore snapshot into the
 * `EquipmentGearInput` shape `composeGear` consumes, so the RESOLVER stays a pure leaf (it never calls
 * `.getState()`) and the call site passes the input in.
 *
 * SCOPE: reads the LEGACY equip state (equippedWeaponId/accessoryId + refine/temper) — composeGear is a
 * 1:1 re-expression of those live forge values, so wiring them is parity-provable (no new magnitude).
 * // [5-slot compose: extend toEquipmentGearInput when GearInstance affixes are D15-live] — the new
 * 5-slot loadout's affixes compose through the SAME dict once their magnitudes leave HELD.
 */

import { useEquipmentStore } from '../../stores/equipmentStore.js';
import type { EquipmentGearInput } from './equipmentGearResolver.js';

export function toEquipmentGearInput(): EquipmentGearInput {
  const eq = useEquipmentStore.getState();
  return {
    equippedWeaponId: eq.equippedWeaponId,
    equippedAccessoryId: eq.equippedAccessoryId,
    refineLevelBySlot: {
      weapon: eq.refineLevelBySlot.weapon,
      accessory: eq.refineLevelBySlot.accessory,
    },
    temperBonusesBySlot: {
      weapon: eq.temperBonusesBySlot.weapon ?? [],
      accessory: eq.temperBonusesBySlot.accessory ?? [],
    },
  };
}
