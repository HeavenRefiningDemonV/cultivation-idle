import {
  getSpiritRootPurityMultiplierForPurity,
  getSpiritRootQualityMultiplierForGrade,
  getSpiritRootTotalMultiplierForRoot,
} from '../../stores/prestigeStore.js';
import type { SpiritRoot, SpiritRootElement, SpiritRootGrade } from '../../types/index.js';

export const SPIRIT_ROOT_POWER_DELTA_CAP = 0.12;

export interface SpiritRootDoctrineProfile {
  grade: SpiritRootGrade;
  element: SpiritRootElement;
  purity: number;
  qualityMultiplier: number;
  purityMultiplier: number;
  totalMultiplier: number;
}

function clampSpiritRootPurity(purity: number): number {
  if (!Number.isFinite(purity)) {
    return 0;
  }

  return Math.min(100, Math.max(0, purity));
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

  return {
    grade: normalizedRoot.grade,
    element: normalizedRoot.element,
    purity,
    qualityMultiplier: getSpiritRootQualityMultiplierForGrade(normalizedRoot.grade),
    purityMultiplier: getSpiritRootPurityMultiplierForPurity(purity),
    totalMultiplier: getSpiritRootTotalMultiplierForRoot(normalizedRoot),
  };
}
