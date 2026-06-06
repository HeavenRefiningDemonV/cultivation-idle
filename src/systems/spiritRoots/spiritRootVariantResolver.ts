import type { SpiritRootProgressionDef } from '../../content/types.js';
import {
  resolveSpiritRootVariant,
  type SpiritRootVariantSnapshot,
} from './spiritRootProgressionResolver.js';

export interface SpiritRootVariantPreview {
  selectedVariantId: string | null;
  conversionAvailable: boolean;
  hardLocksMismatchRoutes: false;
  variant: SpiritRootVariantSnapshot | null;
}

export function resolveSpiritRootVariantPreview(input: {
  rootDef?: SpiritRootProgressionDef | null;
  selectedHeartLawId?: string | null;
  rootResonance?: number | null;
  unlockedVariantIds?: readonly string[] | null;
  trainingRatingsById?: Record<string, number> | null;
  daoHeartClarity?: number | null;
  verseMastery?: number | null;
} = {}): SpiritRootVariantPreview {
  const variant = input.rootDef
    ? resolveSpiritRootVariant({
        rootDef: input.rootDef,
        selectedHeartLawId: input.selectedHeartLawId,
        rootResonance: input.rootResonance,
        unlockedVariantIds: input.unlockedVariantIds,
        trainingRatingsById: input.trainingRatingsById,
        daoHeartClarity: input.daoHeartClarity,
        verseMastery: input.verseMastery,
      })
    : null;

  return {
    selectedVariantId: variant?.id ?? null,
    conversionAvailable: variant !== null,
    hardLocksMismatchRoutes: false,
    variant,
  };
}
