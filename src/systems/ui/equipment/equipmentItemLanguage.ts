/**
 * M.III.1 EQ-MECH / S3 — the shared item-language mappers (the cross-surface vocabulary the Panoply,
 * the Vault, and the F2 inspector all speak). PURE, store-free. Rarity is never hue-alone: every frame
 * grade ships with its 凡/良/珍/极/仙 label. Every magnitude is HELD → D15 (the formatters render the FACT
 * of a contribution — its sign/tone — never an authored balance number).
 */

import type { DerivedStatKey } from '../../meridians/derivedStats.js';
import type { GearRarity } from '../../equipment/gearModel.js';
import type { ItemDetailRarity } from '../modals/itemDetailTypes.js';
import type { GearTotalsTone, RarityFrameGrade } from './equipmentExactTypes.js';

/** GearRarity (the live ItemRarity, incl. reserved `mythic`) → the 5 active inspector grades. */
export function gearRarityToDetailRarity(rarity: GearRarity): ItemDetailRarity {
  switch (rarity) {
    case 'common':
    case 'uncommon':
    case 'rare':
    case 'epic':
    case 'legendary':
      return rarity;
    default:
      return 'legendary'; // `mythic` (reserved) folds onto the top active grade until D15 promotes it
  }
}

const FRAME_GRADE: Record<ItemDetailRarity, RarityFrameGrade> = {
  common: 'mortal',
  uncommon: 'spirit',
  rare: 'earth',
  epic: 'heaven',
  legendary: 'immortal',
};
export function rarityFrameGrade(rarity: ItemDetailRarity): RarityFrameGrade {
  return FRAME_GRADE[rarity];
}

const RARITY_LABEL: Record<ItemDetailRarity, string> = {
  common: '凡 · Common',
  uncommon: '良 · Uncommon',
  rare: '珍 · Rare',
  epic: '极 · Epic',
  legendary: '仙 · Legendary',
};
export function rarityLabel(rarity: ItemDetailRarity): string {
  return RARITY_LABEL[rarity];
}

/** "T3" — the tier-1..7 mark. Tier is HELD (no live curve); defaults to T1 until the instance carries one. */
export function tierMark(itemTier?: number | null): string {
  return `T${Math.max(1, Math.floor(itemTier ?? 1))}`;
}

/** Title-case a setId for display ('stoneforged' → 'Stoneforged'). */
export function setIdLabel(setId: string): string {
  return setId.charAt(0).toUpperCase() + setId.slice(1);
}

const CHANNEL_LABEL: Partial<Record<DerivedStatKey, string>> = {
  maxHp: 'Max HP',
  hpRegen: 'HP Regen',
  physAttack: 'Physical Attack',
  physDefense: 'Physical Defense',
  flatDamageReduction: 'Flat Damage Reduction',
  qiPool: 'Qi Pool',
  qiRegen: 'Qi Regen',
  speed: 'Speed',
  initiative: 'Initiative',
  attackSpeed: 'Attack Speed',
  accuracy: 'Accuracy',
  evasion: 'Evasion',
  critChance: 'Crit Chance',
  critDamage: 'Crit Damage',
  armorPen: 'Armor Penetration',
  soulAttack: 'Soul Attack',
  soulDefense: 'Soul Defense',
  controlPower: 'Control Power',
  tribulationResist: 'Tribulation Resist',
  suppression: 'Suppression',
};
export function channelLabel(channel: DerivedStatKey): string {
  return CHANNEL_LABEL[channel] ?? channel;
}

export type GearTotalsGroup = 'offense' | 'defense' | 'utility';
const CHANNEL_GROUP: Partial<Record<DerivedStatKey, GearTotalsGroup>> = {
  physAttack: 'offense',
  soulAttack: 'offense',
  critChance: 'offense',
  critDamage: 'offense',
  armorPen: 'offense',
  attackSpeed: 'offense',
  accuracy: 'offense',
  initiative: 'offense',
  maxHp: 'defense',
  hpRegen: 'defense',
  physDefense: 'defense',
  flatDamageReduction: 'defense',
  soulDefense: 'defense',
  evasion: 'defense',
  tribulationResist: 'defense',
  qiPool: 'utility',
  qiRegen: 'utility',
  speed: 'utility',
  controlPower: 'utility',
  suppression: 'utility',
};
export function channelGroup(channel: DerivedStatKey): GearTotalsGroup {
  return CHANNEL_GROUP[channel] ?? 'utility';
}

/** composeGear emits a multiplier (1 = no change). Render the FACT — "×1.16" + its tone. Magnitude HELD. */
export function multiplierAddText(value: number): string {
  return `×${value.toFixed(2)}`;
}
export function multiplierTone(value: number): GearTotalsTone {
  if (value > 1) return 'gain';
  if (value < 1) return 'loss';
  return 'neutral';
}
