export type ApothecaryStockFloorKey = 'healing' | 'specialty' | 'cultivation';

export interface ApothecaryStockFloorDefinition {
  key: ApothecaryStockFloorKey;
  label: string;
  targetQty: number;
}

export const APOTHECARY_STOCK_FLOORS: Record<ApothecaryStockFloorKey, ApothecaryStockFloorDefinition> = {
  healing: { key: 'healing', label: 'Healing floor', targetQty: 12 },
  specialty: { key: 'specialty', label: 'Specialty floor', targetQty: 4 },
  cultivation: { key: 'cultivation', label: 'Cultivation floor', targetQty: 3 },
};
