import barShortAsset from '../../assets/menus/bar_short.png';
import blockFancyAsset from '../../assets/menus/block_fancy.png';
import buttonCornersAsset from '../../assets/menus/buttoncorners.png';

export const chromeAccentAssets = {
  barShort: barShortAsset,
  blockFancy: blockFancyAsset,
  buttonCorners: buttonCornersAsset,
} as const;

export type ChromeAccentAssetKey = keyof typeof chromeAccentAssets;
