import type { EquipmentSlot } from '../../stores/equipmentStore.js';

export interface ForgeGateRecommendation {
  gateIndex: number;
  gateLabel?: string;
  source?: string;
  weaponRefine: number;
  accessoryRefine: number;
  temperSuccesses: number;
  runeCountRecommended: number;
  runeCountLabel: string;
}

export interface ForgeFloorReadModel {
  weaponRefineFloor: number;
  accessoryRefineFloor: number;
  temperSuccessTotal: number;
  temperSuccessesBySlot: Record<EquipmentSlot, number>;
  runeInventoryCount: number;
  runeSocketedCount: number;
  runeTotalCount: number;
  runeUniqueCount: number;
  runeSummaryLabel: string;
  nextGateRecommendation: ForgeGateRecommendation | null;
}

const GATE_RECOMMENDATIONS: Record<number, ForgeGateRecommendation> = {
  1: { gateIndex: 1, weaponRefine: 3, accessoryRefine: 2, temperSuccesses: 1, runeCountRecommended: 0, runeCountLabel: 'No rune required yet' },
  2: { gateIndex: 2, weaponRefine: 5, accessoryRefine: 4, temperSuccesses: 2, runeCountRecommended: 0, runeCountLabel: 'No rune required yet' },
  3: { gateIndex: 3, weaponRefine: 7, accessoryRefine: 6, temperSuccesses: 3, runeCountRecommended: 1, runeCountLabel: '1 rune recommended' },
  4: { gateIndex: 4, weaponRefine: 9, accessoryRefine: 8, temperSuccesses: 4, runeCountRecommended: 2, runeCountLabel: '2 runes recommended' },
  5: { gateIndex: 5, weaponRefine: 10, accessoryRefine: 10, temperSuccesses: 5, runeCountRecommended: 3, runeCountLabel: '2–3 runes recommended' },
};

export interface ForgeFloorReadModelInput {
  weaponRefineFloor: number;
  accessoryRefineFloor: number;
  temperSuccessesBySlot: Record<EquipmentSlot, number>;
  inventoryRuneCounts: Record<string, number>;
  socketedRuneIds: string[];
  cityIndex: number | null;
  currentGateIndex?: number | null;
  gateLabel?: string | null;
  gateContextSource?: string | null;
}

function getNextGateRecommendation(input: {
  cityIndex: number | null;
  currentGateIndex?: number | null;
  gateLabel?: string | null;
  gateContextSource?: string | null;
}): ForgeGateRecommendation | null {
  const fallbackGateIndex = input.cityIndex === null || !Number.isFinite(input.cityIndex)
    ? null
    : input.cityIndex + 1;
  const gateIndex = input.currentGateIndex ?? fallbackGateIndex;
  if (gateIndex === null || !Number.isFinite(gateIndex)) return null;
  const recommendation = GATE_RECOMMENDATIONS[Math.max(1, Math.min(5, gateIndex))] ?? null;
  if (!recommendation) return null;
  return {
    ...recommendation,
    gateLabel: input.gateLabel ?? undefined,
    source: input.gateContextSource ?? (input.currentGateIndex === null || input.currentGateIndex === undefined ? 'fallback-city' : undefined),
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function collectSocketedRuneIds(unlockedTechs: Record<string, { runes?: Array<string | null> }>): string[] {
  return Object.values(unlockedTechs).flatMap((entry) => (entry.runes ?? []).filter((runeId): runeId is string => Boolean(runeId)));
}

export function buildForgeFloorReadModel(input: ForgeFloorReadModelInput): ForgeFloorReadModel {
  const runeInventoryCount = sum(Object.values(input.inventoryRuneCounts));
  const runeSocketedCount = input.socketedRuneIds.length;
  const runeTotalCount = runeInventoryCount + runeSocketedCount;
  const runeUniqueCount = new Set([
    ...Object.keys(input.inventoryRuneCounts).filter((id) => input.inventoryRuneCounts[id] > 0),
    ...input.socketedRuneIds,
  ]).size;
  const temperSuccessTotal = sum(Object.values(input.temperSuccessesBySlot));

  return {
    weaponRefineFloor: input.weaponRefineFloor,
    accessoryRefineFloor: input.accessoryRefineFloor,
    temperSuccessTotal,
    temperSuccessesBySlot: input.temperSuccessesBySlot,
    runeInventoryCount,
    runeSocketedCount,
    runeTotalCount,
    runeUniqueCount,
    runeSummaryLabel:
      runeTotalCount <= 0
        ? 'No crafted runes yet'
        : `${runeTotalCount} crafted · ${runeSocketedCount} socketed · ${runeUniqueCount} families`,
    nextGateRecommendation: getNextGateRecommendation(input),
  };
}
