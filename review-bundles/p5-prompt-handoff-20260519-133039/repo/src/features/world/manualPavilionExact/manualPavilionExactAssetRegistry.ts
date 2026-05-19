import type { ManualPavilionExactAssets, ManualPavilionSpineColorKey } from './manualPavilionExactTypes.js';

const manualPavilionBackground = new URL('../../../assets/background/manualpavilion.png', import.meta.url).href;
const cityManualBackground = new URL('../../../assets/background/citystates/city_manual.png', import.meta.url).href;
const textureOverlay = new URL('../../../assets/texture_overlay.png', import.meta.url).href;
const barLong = new URL('../../../assets/menus/bar_long.png', import.meta.url).href;
const barShort = new URL('../../../assets/menus/bar_short.png', import.meta.url).href;
const blockFancy = new URL('../../../assets/menus/block_fancy.png', import.meta.url).href;
const buttonCorners = new URL('../../../assets/menus/buttoncorners.png', import.meta.url).href;
const scroll = new URL('../../../assets/menus/scroll.png', import.meta.url).href;
const spineEarth = new URL('../../../assets/ui/book_spines/spine_earth.png', import.meta.url).href;
const spineHeaven = new URL('../../../assets/ui/book_spines/spine_heaven.png', import.meta.url).href;
const spineMartial = new URL('../../../assets/ui/book_spines/spine_martial.png', import.meta.url).href;
const spineNeutral = new URL('../../../assets/ui/book_spines/spine_neutral.png', import.meta.url).href;

export const MANUAL_PAVILION_EXACT_ASSETS: ManualPavilionExactAssets = {
  background: {
    room: manualPavilionBackground,
    cityManual: cityManualBackground,
    textureOverlay,
  },
  spines: {
    heaven: spineHeaven,
    earth: spineEarth,
    martial: spineMartial,
    neutral: spineNeutral,
    fallback: spineNeutral,
  },
  chrome: {
    scroll,
    buttonCorners,
    barLong,
    barShort,
    blockFancy,
  },
};

export function spineAssetForColor(colorKey: ManualPavilionSpineColorKey): string {
  if (colorKey === 'jade') return MANUAL_PAVILION_EXACT_ASSETS.spines.earth;
  if (colorKey === 'cinnabar' || colorKey === 'lacquer') return MANUAL_PAVILION_EXACT_ASSETS.spines.martial;
  if (colorKey === 'bone' || colorKey === 'indigo') return MANUAL_PAVILION_EXACT_ASSETS.spines.heaven;
  return MANUAL_PAVILION_EXACT_ASSETS.spines.fallback;
}
