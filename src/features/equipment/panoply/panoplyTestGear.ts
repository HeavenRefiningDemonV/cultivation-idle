import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { GEAR_ITEM_DEFS } from '../../../content/gearItems.js';
import type { GearInstance, GearRarity } from '../../../systems/equipment/gearModel.js';

/**
 * M.III.3 — DEV/TEST affordance (`?giveTestGear=1`). Grants the player one of each demo gear item as REAL
 * GearInstances (two each: one auto-equipped to array the figure, one spare in the Vault), so the live
 * Panoply/Vault is fully populated and EVERY mechanic is testable end-to-end (select → rail, equip/unequip,
 * dismantle, filter/sort). Real instances (not the legacy bridge) so the action routes resolve in the stores.
 * Not for production; the stores are in-memory, so it re-grants per session on demand.
 */

let granted = false;

const RARITIES: GearRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
const ELEMENT_BY_DEF: Record<string, string | null> = {
  demo_cinnabar_sabre: 'fire',
  demo_stoneforged_helm: 'earth',
  demo_stoneforged_cuirass: 'earth',
  demo_stoneforged_greaves: 'metal',
  demo_foresight_pendant: 'water',
};

function makeInstance(defId: string, suffix: string, rarity: GearRarity, tier: number, element: string | null, affixCount: number): GearInstance {
  return {
    instanceId: `test-${defId}-${suffix}`,
    defId,
    rarity,
    itemTier: tier,
    elementPayload: element,
    affixes: Array.from({ length: affixCount }, (_, i) => ({ affixId: `${defId}-aff-${i}`, channel: 'physAttack', valuePct: 0.05 + i * 0.02 })),
  };
}

export function grantPanoplyTestGear(): void {
  if (granted) return;
  granted = true;
  const inv = useInventoryStore.getState();
  const eq = useEquipmentStore.getState();
  const realm = useGameStore.getState().realm.index;

  GEAR_ITEM_DEFS.forEach((def, i) => {
    const element = ELEMENT_BY_DEF[def.id] ?? null;
    const worn = makeInstance(def.id, 'worn', RARITIES[i % RARITIES.length], 3 + (i % 3), element, 2 + (i % 3));
    const spare = makeInstance(def.id, 'spare', RARITIES[(i + 2) % RARITIES.length], 2 + (i % 4), element, 1 + (i % 3));
    inv.addGearInstance(worn);
    inv.addGearInstance(spare);
    // Array the figure: equip the "worn" copy into its slot (the spare stays in the Vault).
    if (def.gearSlot) eq.equipInstance(worn, def, def.gearSlot, realm);
  });
}
