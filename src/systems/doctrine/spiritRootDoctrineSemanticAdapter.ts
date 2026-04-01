import type { SpiritRoot } from '../../types/index.js';
import { buildSpiritRootDoctrineProfile } from './spiritRootDoctrine.js';
import { SPIRIT_ROOT_POWER_DELTA_CAP } from './spiritRootDoctrine.js';

export type SpiritRootPurityBand = 'muddy' | 'stable' | 'refined' | 'immaculate';
export type SpiritRootPowerBand = 'baseline' | 'elevated' | 'elite';

export interface SpiritRootDoctrineSemanticView {
  element: SpiritRoot['element'];
  grade: SpiritRoot['grade'];
  purity: number;
  gradeLabel: string;
  purityBand: SpiritRootPurityBand;
  totalPowerDeltaPct: number;
  boundedRuntimeMultiplier: number;
  powerBand: SpiritRootPowerBand;
  summaryLine: string;
  detailLine: string;
  potencySummary: string;
}

export function adaptSpiritRootDoctrineToSemanticView(root: SpiritRoot | null): SpiritRootDoctrineSemanticView | null {
  const profile = buildSpiritRootDoctrineProfile(root);
  if (profile === null) {
    return null;
  }

  return Object.freeze({
    element: profile.element,
    grade: profile.grade,
    purity: profile.purity,
    gradeLabel: profile.gradeLabel,
    purityBand: profile.purityBand,
    totalPowerDeltaPct: profile.totalPowerDeltaPct,
    boundedRuntimeMultiplier: profile.boundedRuntimeMultiplier,
    powerBand: profile.powerBand,
    summaryLine: `${profile.gradeLabel} ${profile.element} root • ${Math.round(profile.purity)}% purity`,
    detailLine: `${profile.purityBand[0].toUpperCase()}${profile.purityBand.slice(1)} foundation • ${profile.powerBand[0].toUpperCase()}${profile.powerBand.slice(1)} potential`,
    potencySummary: `Bounded life potency +${Math.round(profile.totalPowerDeltaPct * 100)}% (cap ${Math.round(SPIRIT_ROOT_POWER_DELTA_CAP * 100)}%)`,
  });
}
