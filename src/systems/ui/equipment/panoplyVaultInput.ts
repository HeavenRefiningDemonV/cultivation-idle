import { useEquipmentStore, type TemperAffix } from '../../../stores/equipmentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { GEAR_ITEM_DEFS } from '../../../content/gearItems.js';
import { composeGear } from '../../equipment/equipmentGearResolver.js';
import { toEquipmentGearInput } from '../../equipment/toEquipmentGearInput.js';
import type { DerivedStatKey } from '../../meridians/derivedStats.js';
import type { GearAffix, GearInstance, GearRarity, GearSlot, ItemDef } from '../../equipment/gearModel.js';
import type { Loadout } from '../../equipment/gearLoadout.js';
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
 * `.getState()` and returns the exact `PanoplyBuildInput` + `VaultBuildInput` the builders consume — PLAIN
 * DATA only, no store handles leak out.
 *
 * LEGACY BRIDGE: the new 5-slot GearInstance loadout + per-instance Vault are unpopulated at runtime (no
 * drop pipeline yet), so a raw live read would render empty. The player's ACTUAL gear lives in the LEGACY
 * fields (`equippedWeaponId`/`equippedAccessoryId` + the stackable `inventoryStore.items`). This seam
 * synthesises the new shapes from that legacy/live data (read-only — never mutates the legacy fields), so
 * the painted surface shows the player's real worn weapon/accessory + owned gear. A real new-model loadout
 * slot (from `equipInstance`) takes precedence over the synthesised legacy one.
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

const TEMPER_CHANNEL: Record<TemperAffix['stat'], DerivedStatKey> = {
  atkPct: 'physAttack', defPct: 'physDefense', hpPct: 'maxHp', critPct: 'critChance', dodgePct: 'evasion',
};

const temperAffixes = (tempers: readonly TemperAffix[]): GearAffix[] =>
  tempers.map((t) => ({ affixId: t.id, channel: TEMPER_CHANNEL[t.stat] ?? 'physAttack', valuePct: t.valuePct }));

const defRarity = (def: ItemDef | undefined): GearRarity =>
  (def?.rarityTier ?? def?.rarity ?? 'common') as GearRarity;

/** Synthesise a GearInstance for a legacy-equipped item id (read-only). */
function synthEquipped(
  defId: string, slot: GearSlot, getDef: GetDef, refineLevel: number, tempers: readonly TemperAffix[],
): GearInstance {
  return {
    instanceId: `legacy-${slot}-${defId}`,
    defId,
    rarity: defRarity(getDef(defId)),
    affixes: temperAffixes(tempers),
    elementPayload: null,
    equippedSlot: slot,
    refineLevelBySlot: { [slot]: refineLevel },
  };
}

export function readPanoplyVaultRawInput(args: PanoplyVaultInputArgs): PanoplyVaultRawInput {
  const equipment = useEquipmentStore.getState();
  const inventory = useInventoryStore.getState();
  const content = useContentStore.getState();
  const game = useGameStore.getState();

  const getDef: GetDef = (defId) => {
    const gear = GEAR_ITEM_DEFS.find((d) => d.id === defId);
    if (gear) return gear;
    try {
      return content.getItem(defId);
    } catch {
      return undefined;
    }
  };

  // ── Loadout: prefer the new 5-slot model; fall back to the legacy equip for weapon/accessory. ──
  const live = equipment.loadout;
  const legacyWeapon = !live.weapon && equipment.equippedWeaponId
    ? synthEquipped(equipment.equippedWeaponId, 'weapon', getDef, equipment.refineLevelBySlot.weapon, equipment.temperBonusesBySlot.weapon ?? [])
    : null;
  const legacyAccessory = live.accessories.length === 0 && equipment.equippedAccessoryId
    ? synthEquipped(equipment.equippedAccessoryId, 'accessory', getDef, equipment.refineLevelBySlot.accessory, equipment.temperBonusesBySlot.accessory ?? [])
    : null;
  const loadout: Loadout = {
    weapon: live.weapon ?? legacyWeapon,
    head: live.head,
    chest: live.chest,
    legs: live.legs,
    accessories: live.accessories.length ? live.accessories : legacyAccessory ? [legacyAccessory] : [],
  };

  // ── Vault: the new per-instance map + synthesised instances for owned GEAR items (weapon/accessory). ──
  const synthVault: Record<string, GearInstance> = {};
  for (const [itemId, count] of Object.entries(inventory.items)) {
    if (count <= 0) continue;
    const def = getDef(itemId);
    if (!def || (def.type !== 'weapon' && def.type !== 'accessory')) continue;
    synthVault[`legacy-item-${itemId}`] = {
      instanceId: `legacy-item-${itemId}`,
      defId: itemId,
      rarity: defRarity(def),
      affixes: [],
      elementPayload: null,
    };
  }
  const gearInstances: Record<string, GearInstance> = { ...synthVault, ...inventory.gearInstances };

  const path: PanoplyPathLean = game.selectedPath ?? 'martial';
  const realm = game.realm.index;
  const gearTotals = composeGear(toEquipmentGearInput());

  return {
    panoply: { loadout, getDef, gearTotals, path, realm, selectedInstanceId: args.selectedInstanceId },
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
