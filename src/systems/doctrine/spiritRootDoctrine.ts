import type { SpiritRoot, SpiritRootElement, SpiritRootGrade } from '../../types/index.js';

export const SPIRIT_ROOT_POWER_DELTA_CAP = 0.12;

export interface SpiritRootDoctrineProfile {
  grade: SpiritRootGrade;
  element: SpiritRootElement;
  purity: number;
  gradeLabel: string;
  purityBand: 'muddy' | 'stable' | 'refined' | 'immaculate';
  powerBand: 'baseline' | 'elevated' | 'elite';
  totalPowerDeltaPct: number;
  boundedRuntimeMultiplier: number;
}

const GRADE_LABELS: Record<SpiritRootGrade, string> = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
};

export function clampSpiritRootPurity(purity: number): number {
  if (!Number.isFinite(purity)) {
    return 0;
  }

  return Math.min(100, Math.max(0, purity));
}

function resolvePurityBand(purity: number): SpiritRootDoctrineProfile['purityBand'] {
  if (purity >= 95) return 'immaculate';
  if (purity >= 75) return 'refined';
  if (purity >= 40) return 'stable';
  return 'muddy';
}

function resolvePowerBand(totalPowerDeltaPct: number): SpiritRootDoctrineProfile['powerBand'] {
  if (totalPowerDeltaPct >= 0.09) return 'elite';
  if (totalPowerDeltaPct >= 0.04) return 'elevated';
  return 'baseline';
}

export function getSpiritRootTotalPowerDeltaPct(root: SpiritRoot | null): number {
  if (!root) {
    return 0;
  }
  const gradeScore = (Math.max(1, Math.min(5, root.grade)) - 1) / 4;
  const purityScore = clampSpiritRootPurity(root.purity) / 100;
  const weightedScore = gradeScore * 0.65 + purityScore * 0.35;
  return SPIRIT_ROOT_POWER_DELTA_CAP * weightedScore;
}

export function getSpiritRootRuntimeMultiplier(root: SpiritRoot | null): number {
  return 1 + getSpiritRootTotalPowerDeltaPct(root) * 0.5;
}

export function buildSpiritRootDoctrineProfile(root: SpiritRoot | null): SpiritRootDoctrineProfile | null {
  if (root === null) {
    return null;
  }

  const purity = clampSpiritRootPurity(root.purity);
  const normalizedRoot: SpiritRoot = {
    grade: root.grade,
    element: root.element,
    purity,
  };

  const totalPowerDeltaPct = getSpiritRootTotalPowerDeltaPct(normalizedRoot);
  return Object.freeze({
    grade: normalizedRoot.grade,
    element: normalizedRoot.element,
    purity,
    gradeLabel: GRADE_LABELS[normalizedRoot.grade],
    purityBand: resolvePurityBand(purity),
    powerBand: resolvePowerBand(totalPowerDeltaPct),
    totalPowerDeltaPct,
    boundedRuntimeMultiplier: getSpiritRootRuntimeMultiplier(normalizedRoot),
  });
}
