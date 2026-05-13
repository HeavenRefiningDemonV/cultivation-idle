import s00PinewindDusk from '../../assets/cutscenes/S00/S00 Slide 1.png';
import s00GateCensusRefusal from '../../assets/cutscenes/S00/S00 Slide 2.png';
import s00AshErasure from '../../assets/cutscenes/S00/S00 Slide 3.png';
import s00KeeperYanReturningPage from '../../assets/cutscenes/S00/S00 Slide 4.png';
import s00ReturningPagePaths from '../../assets/cutscenes/S00/S00 Slide 5.png';

export type StoryImageAsset = {
  id: string;
  src: string;
  fallbackSrc?: string;
  width: number;
  height: number;
  sourcePath: string;
};

const storyPublicPath = (path: string) => `/assets/${path}`;
const S00_PLATE_SIZE = { width: 1672, height: 941 };

export const STORY_IMAGE_ASSETS: Record<string, StoryImageAsset> = {
  'story/s00/s00_01_pinewind_dusk.webp': {
    id: 'story/s00/s00_01_pinewind_dusk.webp',
    src: s00PinewindDusk,
    fallbackSrc: storyPublicPath('story/s00/s00_01_pinewind_dusk.webp'),
    sourcePath: 'src/assets/cutscenes/S00/S00 Slide 1.png',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_02_gate_census_refusal.webp': {
    id: 'story/s00/s00_02_gate_census_refusal.webp',
    src: s00GateCensusRefusal,
    fallbackSrc: storyPublicPath('story/s00/s00_02_gate_census_refusal.webp'),
    sourcePath: 'src/assets/cutscenes/S00/S00 Slide 2.png',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_03_ash_erasure.webp': {
    id: 'story/s00/s00_03_ash_erasure.webp',
    src: s00AshErasure,
    fallbackSrc: storyPublicPath('story/s00/s00_03_ash_erasure.webp'),
    sourcePath: 'src/assets/cutscenes/S00/S00 Slide 3.png',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_04_keeper_yan_returning_page.webp': {
    id: 'story/s00/s00_04_keeper_yan_returning_page.webp',
    src: s00KeeperYanReturningPage,
    fallbackSrc: storyPublicPath('story/s00/s00_04_keeper_yan_returning_page.webp'),
    sourcePath: 'src/assets/cutscenes/S00/S00 Slide 4.png',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_05_returning_page_paths.webp': {
    id: 'story/s00/s00_05_returning_page_paths.webp',
    src: s00ReturningPagePaths,
    fallbackSrc: storyPublicPath('story/s00/s00_05_returning_page_paths.webp'),
    sourcePath: 'src/assets/cutscenes/S00/S00 Slide 5.png',
    ...S00_PLATE_SIZE,
  },
};

export function resolveStoryImageAsset(assetId: string): StoryImageAsset {
  return STORY_IMAGE_ASSETS[assetId] ?? {
    id: assetId,
    src: storyPublicPath(assetId),
    sourcePath: `public/assets/${assetId}`,
    ...S00_PLATE_SIZE,
  };
}

export function preloadStoryImages(assetIds: string[]): Promise<void[]> {
  if (typeof window === 'undefined') return Promise.resolve([]);
  return Promise.all(
    assetIds.map((assetId) => new Promise<void>((resolve) => {
      const asset = resolveStoryImageAsset(assetId);
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = asset.src;
    })),
  );
}
