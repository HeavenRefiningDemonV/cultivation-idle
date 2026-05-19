import pathHeavenArt from '../../assets/menus/path_heaven 1.png';
import pathEarthArt from '../../assets/menus/path_earth 1.png';
import pathMartialArt from '../../assets/menus/path_martial 1.png';

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
const imageLoadCache = new Map<string, Promise<HTMLImageElement>>();
const imageDecodeCache = new Map<string, Promise<void>>();

export const STORY_IMAGE_ASSETS: Record<string, StoryImageAsset> = {
  'story/s00/s00_01_pinewind_dusk.webp': {
    id: 'story/s00/s00_01_pinewind_dusk.webp',
    src: storyPublicPath('story/s00/s00_01_pinewind_dusk.webp'),
    sourcePath: 'public/assets/story/s00/s00_01_pinewind_dusk.webp',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_02_gate_census_refusal.webp': {
    id: 'story/s00/s00_02_gate_census_refusal.webp',
    src: storyPublicPath('story/s00/s00_02_gate_census_refusal.webp'),
    sourcePath: 'public/assets/story/s00/s00_02_gate_census_refusal.webp',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_03_ash_erasure.webp': {
    id: 'story/s00/s00_03_ash_erasure.webp',
    src: storyPublicPath('story/s00/s00_03_ash_erasure.webp'),
    sourcePath: 'public/assets/story/s00/s00_03_ash_erasure.webp',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_04_keeper_yan_returning_page.webp': {
    id: 'story/s00/s00_04_keeper_yan_returning_page.webp',
    src: storyPublicPath('story/s00/s00_04_keeper_yan_returning_page.webp'),
    sourcePath: 'public/assets/story/s00/s00_04_keeper_yan_returning_page.webp',
    ...S00_PLATE_SIZE,
  },
  'story/s00/s00_05_returning_page_paths.webp': {
    id: 'story/s00/s00_05_returning_page_paths.webp',
    src: storyPublicPath('story/s00/s00_05_returning_page_paths.webp'),
    sourcePath: 'public/assets/story/s00/s00_05_returning_page_paths.webp',
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

export function preloadStoryImages(assetIds: string[], opts: { decode?: boolean } = {}): Promise<void[]> {
  if (typeof window === 'undefined') return Promise.resolve([]);
  return Promise.all(assetIds.map((assetId) => preloadImage(resolveStoryImageAsset(assetId).src, opts)));
}

export function preloadPathSelectionImages(): Promise<void[]> {
  if (typeof window === 'undefined') return Promise.resolve([]);
  return Promise.all([pathHeavenArt, pathEarthArt, pathMartialArt].map((src) => preloadImage(src, { decode: false })));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const existing = imageLoadCache.get(src);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(image);
    image.src = src;
  });

  imageLoadCache.set(src, promise);
  return promise;
}

function preloadImage(src: string, opts: { decode?: boolean } = {}): Promise<void> {
  if (!opts.decode) return loadImage(src).then(() => undefined);

  const existing = imageDecodeCache.get(src);
  if (existing) return existing;

  const promise = loadImage(src).then((image) => {
    if (typeof image.decode !== 'function') return undefined;
    return image.decode().then(() => undefined, () => undefined);
  });

  imageDecodeCache.set(src, promise);
  return promise;
}
