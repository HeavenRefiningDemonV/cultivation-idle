import type { CurrencyKey } from '../../stores/inventoryStore';

export type RewardCurrencyBundle = Partial<Record<CurrencyKey, string>>;

export type RewardItemBundle = {
  itemId: string;
  qty: number;
};

export type RewardTechniqueFragmentBundle = {
  techId: string;
  qty: number;
};

export type RewardManualBundle = {
  manualId: string;
  techId: string;
  grade: 'mortal' | 'earth' | 'heaven' | 'mystic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  qty: number;
};

export type RewardBundle = {
  currencies?: RewardCurrencyBundle;
  items?: RewardItemBundle[];
  techniqueFragments?: RewardTechniqueFragmentBundle[];
  manuals?: RewardManualBundle[];
  comprehension?: number;
};

export type GrantRewardsResult = {
  appliedCurrencies: RewardCurrencyBundle;
  appliedItems: RewardItemBundle[];
  droppedItems: RewardItemBundle[];
};

export type LootContext = 'outskirts' | 'ruins';
