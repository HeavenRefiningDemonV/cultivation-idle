import { HELD_RATE, type GearDropEntry } from '../systems/equipment/gearDrop.js';

/**
 * D8 — example gear-drop entries. CONTENT-SHAPE DEMO: which gear (by `itemId`) drops, with a rarity pool.
 * Every `dropChance` and every `rarityPool` weight is the `HELD_RATE` sentinel — NO authored drop rate.
 * UNCONSUMED — nothing reads this; the wire into the live `generateLoot` is the parked drop-flow packet.
 */
export const GEAR_DROP_ENTRIES: readonly GearDropEntry[] = Object.freeze([
  {
    type: 'gear', itemId: 'demo_cinnabar_sabre', dropChance: HELD_RATE,
    rarityPool: [{ rarity: 'common', weight: HELD_RATE }, { rarity: 'rare', weight: HELD_RATE }],
  },
  {
    type: 'gear', itemId: 'demo_stoneforged_helm', dropChance: HELD_RATE,
    rarityPool: [{ rarity: 'common', weight: HELD_RATE }, { rarity: 'uncommon', weight: HELD_RATE }],
  },
  {
    type: 'gear', itemId: 'demo_foresight_pendant', dropChance: HELD_RATE,
    rarityPool: [{ rarity: 'common', weight: HELD_RATE }],
  },
]);
