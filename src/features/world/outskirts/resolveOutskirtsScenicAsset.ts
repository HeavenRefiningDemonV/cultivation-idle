import type { OutskirtsScenicStage } from './types.js';

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
    wolfOverlaySrc: scenic.useApprovedMockupCrop ? null : '/assets/enemies/wolfpup.png',
    scenicBackdropPosition: scenic.useApprovedMockupCrop ? '50% 56%' : '50% 58%',
  };
}
