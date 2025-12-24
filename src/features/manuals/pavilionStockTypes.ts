import type { PathId, TechniqueDef } from '../../content';

export type ManualRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ManualGrade = 'mortal' | 'earth' | 'heaven' | 'mystic';

export interface ManualDefinition {
  id: string;
  techniqueId: string;
  name: string;
  path: PathId | string;
  type: TechniqueDef['type'];
  role?: string;
  tags?: string[];
}

export interface PavilionStockSlot {
  slotIndex: number;
  shelf: 'common' | 'advanced' | 'rare' | 'featured' | 'filler';
  techniqueId: string;
  grade: ManualGrade;
  rarity: ManualRarity;
  price: Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;
  notSold?: boolean;
  sealed?: boolean;
}

export interface PavilionStockState {
  pavilionId: string;
  cityId: string;
  cityIndex: number;
  generatedAt: number;
  nextRefreshAt: number;
  rngSeed: number;
  slots: PavilionStockSlot[];
  pity: { featuredEpic: number; featuredLegendary: number };
  history: Array<{
    at: number;
    featured?: { techniqueId: string; rarity: ManualRarity; grade: ManualGrade };
    rares?: Array<{ techniqueId: string; rarity: ManualRarity; grade: ManualGrade }>;
  }>;
}

export interface ManualPavilionSaveState {
  stockByPavilionId: Record<string, PavilionStockState>;
}
