import type { ItemDef, GearSlot } from '../systems/equipment/gearModel.js';
import type { ItemType } from '../types/index.js';

/**
 * D8 §G — the FOUNDATIONAL legendary catalog (M.III.1 deliverable). The named apex items + their unique
 * "signature" mechanics — the legendary tier of the two-axis gear model, distinct from the rolled
 * common→epic pool. STRUCTURE ONLY:
 *  - The catalog's SHAPE is fixed here (a legendary ItemDef carries `rarityTier:'legendary'` + a named
 *    `signature` edge); validate:content / the contract test runs over these ids (catalog-completeness).
 *  - NO authored magnitude: the signature `body` describes the mechanic SHAPE; every number inside is
 *    illustrative `[tune]` → D15/F-BAL. The bond accrual + the live combat effect are D5/D11/Movement V.
 *  - Seeded from the locked M.III.2 artifact + the F2 inspector's worked example (the Cinnabar Phoenix
 *    Spire, the Vermilion-Regalia Martial apex). D8 §G deposits the full per-path apex roster (an Earth
 *    aegis, a Heaven relic, …); this module is the structure + the first cited apex it extends.
 */

const legendary = (id: string, name: string, type: ItemType, gearSlot: GearSlot, extra: Partial<ItemDef>): ItemDef => ({
  id,
  name,
  description: `${name} — D8 §G apex legendary (structure only; magnitudes [tune] → D15).`,
  type,
  rarity: 'legendary',
  level: 1,
  value: '0',
  stackable: false,
  maxStack: 1,
  gearSlot,
  rarityTier: 'legendary',
  ...extra,
});

export const GEAR_LEGENDARIES: readonly ItemDef[] = Object.freeze([
  legendary('demo_cinnabar_phoenix_spire', 'Cinnabar Phoenix Spire', 'weapon', 'weapon', {
    affixPool: ['phys_attack_pct', 'crit_damage_pct', 'crit_chance_pct'],
    setId: 'vermilion',
    weaponBondable: true,
    signature: {
      name: 'The Vermilion Echo',
      body: 'On a killing blow the spire rekindles — recover a share of max HP ([tune] → D15) and the next strike carries its fire whole. A named blade remembers what it has burned.',
    },
  }),
]);
