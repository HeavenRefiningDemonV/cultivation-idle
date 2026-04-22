import type { OutskirtsScenicStage } from './types.js';
import { OUTSKIRTS_ASSETS } from './outskirtsAssetRegistry.js';

export interface OutskirtsScenicBindings {
  scenicPlateSrc: string | null;
  usesApprovedReviewCrop: boolean;
  wolfOverlaySrc: string | null;
  scenicBackdropPosition: string;
}

export function resolveOutskirtsScenicAsset(scenic: OutskirtsScenicStage): OutskirtsScenicBindings {
  const scenicPlateSrc = scenic.useApprovedMockupCrop
    ? scenic.reviewFixtureImageSrc ?? scenic.scenicImageSrc
    : scenic.scenicImageSrc ?? scenic.liveFallbackImageSrc;

  return {
    scenicPlateSrc,
    usesApprovedReviewCrop: scenic.useApprovedMockupCrop,
    wolfOverlaySrc: scenic.useApprovedMockupCrop ? null : OUTSKIRTS_ASSETS.scenic.wolfEnemy,
    scenicBackdropPosition: scenic.useApprovedMockupCrop ? '50% 56%' : '50% 58%',
  };
}
