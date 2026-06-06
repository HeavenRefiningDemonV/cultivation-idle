import type { MedicinePouchState } from '../../types/index.js';
import type { TrainingReadOnlySnapshot } from '../training/trainingReadOnlySnapshot.js';

export interface MedicineHandlingInput {
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
  pouch?: MedicinePouchState | null;
}

export interface MedicineHandlingRow {
  id: 'medicine_familiarity' | 'meridian_fortitude';
  label: string;
  rating: number;
  active: boolean;
  bonusPct: number;
  detail: string;
}

export interface MedicineHandlingSnapshot {
  qualityBonusPct: number;
  absorptionBonusPct: number;
  backlashReductionPct: number;
  effectMultiplier: number;
  rows: MedicineHandlingRow[];
}

function rating(snapshot: TrainingReadOnlySnapshot | null | undefined, statId: string): number {
  return Math.max(0, snapshot?.pathStats.find((row) => row.statId === statId)?.rating ?? 0);
}

function capPct(value: number, cap: number): number {
  return Math.round(Math.min(cap, Math.max(0, value)) * 10) / 10;
}

function hasConfiguredPouch(pouch: MedicinePouchState | null | undefined): boolean {
  return Object.values(pouch?.slots ?? {}).some((slot) => slot.enabled && Boolean(slot.equippedItemId));
}

export function resolveMedicineHandlingSnapshot(input: MedicineHandlingInput): MedicineHandlingSnapshot {
  const pouchActive = hasConfiguredPouch(input.pouch);
  const familiarityRating = rating(input.trainingSnapshot, 'medicine_familiarity');
  const fortitudeRating = rating(input.trainingSnapshot, 'meridian_fortitude');
  const qualityBonusPct = pouchActive ? capPct(familiarityRating * 0.10, 10) : 0;
  const absorptionBonusPct = pouchActive ? capPct(fortitudeRating * 0.10, 10) : 0;
  const backlashReductionPct = pouchActive ? capPct(fortitudeRating * 0.15, 15) : 0;

  return {
    qualityBonusPct,
    absorptionBonusPct,
    backlashReductionPct,
    effectMultiplier: Math.round((1 + qualityBonusPct / 100) * 1000) / 1000,
    rows: [
      {
        id: 'medicine_familiarity',
        label: 'Medicine Familiarity',
        rating: familiarityRating,
        active: pouchActive,
        bonusPct: qualityBonusPct,
        detail: pouchActive
          ? `Pill trigger quality +${qualityBonusPct.toFixed(1)}%, capped at 10%.`
          : 'No configured combat medicine in the pouch.',
      },
      {
        id: 'meridian_fortitude',
        label: 'Meridian Fortitude',
        rating: fortitudeRating,
        active: pouchActive,
        bonusPct: absorptionBonusPct,
        detail: pouchActive
          ? `Pill absorption +${absorptionBonusPct.toFixed(1)}%; backlash pressure -${backlashReductionPct.toFixed(1)}%.`
          : 'No configured combat medicine in the pouch.',
      },
    ],
  };
}
