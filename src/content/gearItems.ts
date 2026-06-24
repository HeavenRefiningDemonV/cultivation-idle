import type { ItemDef, GearSlot } from '../systems/equipment/gearModel.js';
import type { ItemType } from '../types/index.js';
import { GEAR_LEGENDARIES } from './gearLegendaries.js';

/**
 * D8 — a few example ItemDefs wearing the new gear fields. CONTENT-SHAPE DEMO ONLY: it exercises the
 * 5-slot taxonomy (incl. the armor 3-piece set) and the per-path placeholders. NO balance numbers —
 * `baseChannels` and affix magnitudes are omitted/HELD; `weaponBondable` is a structural placeholder.
 * UNCONSUMED — nothing reads this; it demonstrates the schema, it does not register live items.
 */

// `ItemType` is the coarse legacy classification (no `armor`); the D8 `gearSlot` carries the real slot.
const demo = (id: string, name: string, type: ItemType, gearSlot: GearSlot, extra: Partial<ItemDef>): ItemDef => ({
  id,
  name,
  description: `${name} — D8 schema demo (structure only).`,
  type,
  rarity: 'common',
  level: 1,
  value: '0',
  stackable: false,
  maxStack: 1,
  gearSlot,
  ...extra,
});

export const GEAR_ITEM_DEFS: readonly ItemDef[] = Object.freeze([
  // weapon — Martial, bond-able (placeholder)
  demo('demo_cinnabar_sabre', 'Cinnabar-Vein Sabre', 'weapon', 'weapon', {
    affixPool: ['phys_attack_pct', 'crit_chance_pct'],
    weaponBondable: true,
  }),
  // armor 3-piece set — Earth, head/chest/legs sharing a setId
  demo('demo_stoneforged_helm', 'Stoneforged Helm', 'accessory', 'head', { affixPool: ['phys_defense_pct', 'max_hp_pct'], setId: 'stoneforged' }),
  demo('demo_stoneforged_cuirass', 'Stoneforged Cuirass', 'accessory', 'chest', { affixPool: ['phys_defense_pct', 'max_hp_pct'], setId: 'stoneforged' }),
  demo('demo_stoneforged_greaves', 'Stoneforged Greaves', 'accessory', 'legs', { affixPool: ['phys_defense_pct', 'max_hp_pct'], setId: 'stoneforged' }),
  // accessory — Heaven
  demo('demo_foresight_pendant', 'Foresight Pendant', 'accessory', 'accessory', { affixPool: ['status_resist'] }),
]);

/** The whole D8 gear registry — the rolled common→epic demo set + the foundational legendary catalog (D8 §G). */
export const ALL_GEAR_DEFS: readonly ItemDef[] = Object.freeze([...GEAR_ITEM_DEFS, ...GEAR_LEGENDARIES]);

/** Resolve a gear `defId` → ItemDef across the demo set + the legendary catalog. */
export function findGearItemDef(defId: string): ItemDef | undefined {
  return ALL_GEAR_DEFS.find((d) => d.id === defId);
}
