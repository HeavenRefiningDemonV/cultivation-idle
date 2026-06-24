/**
 * M.III.1 EQ-MECH / S3+S4 — the pure Vault sort/filter resolvers over held GearInstances. Store-free,
 * deterministic (a stable order for equal keys), and total (every input maps to an output). The Vault
 * builder reads these; S4's dismantle/idle-parity proofs exercise them directly.
 */

import type { GearInstance, GearSlot, ItemDef } from '../../equipment/gearModel.js';
import { gearRarityToDetailRarity } from './equipmentItemLanguage.js';
import type {
  ItemDetailRarity,
} from '../modals/itemDetailTypes.js';
import type { VaultGradeFilter, VaultSlotFilter, VaultSortBy, VaultSortDir } from './equipmentExactTypes.js';

export type GetDef = (defId: string) => ItemDef | undefined;

function slotOf(instance: GearInstance, getDef: GetDef): GearSlot | undefined {
  return getDef(instance.defId)?.gearSlot ?? instance.equippedSlot;
}

const ARMOR_SLOTS: ReadonlySet<GearSlot> = new Set(['head', 'chest', 'legs']);

function matchesSlotFilter(slot: GearSlot | undefined, filter: VaultSlotFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'weapon':
      return slot === 'weapon';
    case 'armor':
      return slot !== undefined && ARMOR_SLOTS.has(slot);
    case 'accessory':
      return slot === 'accessory';
    default:
      return true;
  }
}

function matchesGradeFilter(rarity: ItemDetailRarity, filter: VaultGradeFilter): boolean {
  return filter === 'all' || rarity === filter;
}

/** Filter held instances by slot family + grade. Pure; returns a new array preserving input order. */
export function filterVaultInstances(
  instances: readonly GearInstance[],
  getDef: GetDef,
  filter: { slot: VaultSlotFilter; grade: VaultGradeFilter },
): GearInstance[] {
  return instances.filter(
    (instance) =>
      matchesSlotFilter(slotOf(instance, getDef), filter.slot)
      && matchesGradeFilter(gearRarityToDetailRarity(instance.rarity), filter.grade),
  );
}

const RARITY_ORDER: Record<ItemDetailRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};
const SLOT_ORDER: Record<GearSlot, number> = {
  weapon: 0,
  head: 1,
  chest: 2,
  legs: 3,
  accessory: 4,
};

/** Sort held instances. 'recent' is insertion order (asc) / most-recent-first (desc). Stable. Pure. */
export function sortVaultInstances(
  instances: readonly GearInstance[],
  getDef: GetDef,
  sort: { by: VaultSortBy; dir: VaultSortDir },
): GearInstance[] {
  const indexed = instances.map((instance, index) => ({ instance, index }));
  const keyOf = (entry: { instance: GearInstance; index: number }): number => {
    switch (sort.by) {
      case 'rarity':
        return RARITY_ORDER[gearRarityToDetailRarity(entry.instance.rarity)];
      case 'slot': {
        const slot = slotOf(entry.instance, getDef);
        return slot ? SLOT_ORDER[slot] : Number.MAX_SAFE_INTEGER;
      }
      case 'recent':
      default:
        return entry.index;
    }
  };
  const dir = sort.dir === 'desc' ? -1 : 1;
  indexed.sort((a, b) => {
    const delta = keyOf(a) - keyOf(b);
    if (delta !== 0) return delta * dir;
    return a.index - b.index; // stable tiebreak (always by insertion order)
  });
  return indexed.map((entry) => entry.instance);
}

/** Filter then sort — the order the Vault surface presents. Pure. */
export function arrangeVaultInstances(
  instances: readonly GearInstance[],
  getDef: GetDef,
  filter: { slot: VaultSlotFilter; grade: VaultGradeFilter },
  sort: { by: VaultSortBy; dir: VaultSortDir },
): GearInstance[] {
  return sortVaultInstances(filterVaultInstances(instances, getDef, filter), getDef, sort);
}
