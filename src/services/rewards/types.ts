import type { CurrencyKey } from '../../stores/inventoryStore.js';

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

export type RewardSkippedEntry = {
  kind: 'currency' | 'item' | 'techniqueFragment' | 'manual' | 'comprehension';
  reason: string;
  payload: unknown;
};

export type RewardComprehensionResult = {
  amount: number;
  applied: boolean;
  source: string;
  targetHeartLawId: string | null;
  before?: {
    chapter: number;
    comprehension: number;
  };
  after?: {
    chapter: number;
    comprehension: number;
  };
  skippedReason?: 'no_selected_heart_law' | 'invalid_amount';
};

export type GrantRewardsResult = {
  appliedCurrencies: RewardCurrencyBundle;
  appliedItems: RewardItemBundle[];
  droppedItems: RewardItemBundle[];
  appliedTechniqueFragments: RewardTechniqueFragmentBundle[];
  appliedManuals: RewardManualBundle[];
  appliedComprehension: RewardComprehensionResult | null;
  skippedRewards: RewardSkippedEntry[];
};

export type LootContext = 'outskirts' | 'ruins';
