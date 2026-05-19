export type DisplayStack = {
  stackId: string;
  itemId: string;
  quantity: number;
  name: string;
  description?: string;
  type: string;
  rarity?: string;
  level?: number;
  maxStack?: number;
  stackable?: boolean;
  value?: string | number;
  note?: string;
  usage?: string;
};
