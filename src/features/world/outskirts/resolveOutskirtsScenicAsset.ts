import type { OutskirtsScenicStage } from './types.js';

export interface OutskirtsResolvedScenicBinding {
  baseImageSrc: string;
  useApprovedMockupCrop: boolean;
}

export function resolveOutskirtsScenicAsset(scenic: OutskirtsScenicStage): OutskirtsResolvedScenicBinding {
  if (scenic.useApprovedMockupCrop) {
    return { baseImageSrc: scenic.reviewFixtureImageSrc, useApprovedMockupCrop: true };
  }

  return {
    baseImageSrc: scenic.scenicImageSrc ?? scenic.liveFallbackImageSrc,
    useApprovedMockupCrop: false,
  };
}
