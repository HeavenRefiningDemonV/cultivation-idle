import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { GEAR_ITEM_DEFS } from '../../../content/gearItems.js';
import { composeGear } from '../../equipment/equipmentGearResolver.js';
import { toEquipmentGearInput } from '../../equipment/toEquipmentGearInput.js';
import type { PanoplyBuildInput, VaultBuildInput } from './equipmentExactBuilders.js';
import type { GetDef } from './vaultSortFilter.js';
import type {
  PanoplyPathLean,
  VaultGradeFilter,
  VaultSlotFilter,
  VaultSortBy,
  VaultSortDir,
} from './equipmentExactTypes.js';

/**
 * M.III.3 EQ-PORT — the pure input seam (mirrors cultivationSeatInput). Reads live store SNAPSHOTS via
 * `.getState()` (impure read, but no subscriptions) and returns the exact `PanoplyBuildInput` +
 * `VaultBuildInput` the existing builders consume — PLAIN DATA only, no store handles leak out. The
 * single place `selectedPath` → `PanoplyPathLean` translation lives (here, never in a component); the live
 * CultivationPath ids already match the lean ids, so it is a null-default, not a remap.
 */

export interface PanoplyVaultInputArgs {
  vaultFilter: { slot: VaultSlotFilter; grade: VaultGradeFilter };
  vaultSort: { by: VaultSortBy; dir: VaultSortDir };
  selectedInstanceId: string | null;
  newInstanceIds?: ReadonlySet<string>;
}

export interface PanoplyVaultRawInput {
  panoply: PanoplyBuildInput;
  vault: VaultBuildInput;
}

export function readPanoplyVaultRawInput(args: PanoplyVaultInputArgs): PanoplyVaultRawInput {
  const equipment = useEquipmentStore.getState();
  const inventory = useInventoryStore.getState();
  const content = useContentStore.getState();
  const game = useGameStore.getState();

  // Resolve a GearInstance.defId → ItemDef: the D8 gear registry first, then the live content store
  // (guarded — getItem may throw / lack a gear def). Read-only; the builders own the slot/setId/bond reads.
  const getDef: GetDef = (defId) => {
    const gear = GEAR_ITEM_DEFS.find((d) => d.id === defId);
    if (gear) return gear;
    try {
      return content.getItem(defId);
    } catch {
      return undefined;
    }
  };

  const loadout = equipment.loadout;
  const gearInstances = inventory.gearInstances;
  const path: PanoplyPathLean = game.selectedPath ?? 'martial';
  const realm = game.realm.index;
  // the totals panel reads composeGear's output directly (the legacy-equip wire; 5-slot compose is HELD).
  const gearTotals = composeGear(toEquipmentGearInput());

  return {
    panoply: {
      loadout,
      getDef,
      gearTotals,
      path,
      realm,
      selectedInstanceId: args.selectedInstanceId,
    },
    vault: {
      gearInstances,
      getDef,
      loadout,
      filter: args.vaultFilter,
      sort: args.vaultSort,
      selectedInstanceId: args.selectedInstanceId,
      newInstanceIds: args.newInstanceIds,
    },
  };
}
