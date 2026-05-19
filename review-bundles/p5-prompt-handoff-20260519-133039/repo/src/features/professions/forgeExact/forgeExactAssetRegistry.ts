import type {
  ForgeExactAssetDescriptor,
  ForgeExactAssetKey,
  ForgeExactAssetMap,
} from './forgeExactTypes.js';

const fallbackPaper = new URL('../../../assets/background/citystates/city_forge.png', import.meta.url).href;
const fallbackRefine = new URL('../../../assets/background/forgewide_shaped.png', import.meta.url).href;
const fallbackTemper = new URL('../../../assets/background/forgewide_shaping.png', import.meta.url).href;
const fallbackRunes = new URL('../../../assets/background/forgewide_empty.png', import.meta.url).href;

export const FORGE_EXACT_APPROVED_ASSET_PATHS = {
  paperBackground: 'src/assets/world/forgeExact/forge-white-parchment-wide.png',
  refineCenter: 'src/assets/world/forgeExact/forge-refine-center.png',
  temperCenter: 'src/assets/world/forgeExact/forge-temper-center.png',
  runesCenter: 'src/assets/world/forgeExact/forge-runes-center.png',
} as const satisfies Record<ForgeExactAssetKey, string>;

function fallbackAsset(
  key: ForgeExactAssetKey,
  src: string,
  role: string,
  fallbackSourcePath: string,
): ForgeExactAssetDescriptor {
  return {
    key,
    src,
    role,
    sourcePath: FORGE_EXACT_APPROVED_ASSET_PATHS[key],
    status: 'fallback',
    fallbackSourcePath,
  };
}

export const FORGE_EXACT_ASSETS: ForgeExactAssetMap = {
  paperBackground: fallbackAsset(
    'paperBackground',
    fallbackPaper,
    'approved Forge Exact parchment-wide page background',
    'src/assets/background/citystates/city_forge.png',
  ),
  refineCenter: fallbackAsset(
    'refineCenter',
    fallbackRefine,
    'approved Refine selected center workshop plate',
    'src/assets/background/forgewide_shaped.png',
  ),
  temperCenter: fallbackAsset(
    'temperCenter',
    fallbackTemper,
    'approved Temper selected center workshop plate',
    'src/assets/background/forgewide_shaping.png',
  ),
  runesCenter: fallbackAsset(
    'runesCenter',
    fallbackRunes,
    'approved Runes selected center workshop plate',
    'src/assets/background/forgewide_empty.png',
  ),
};

export function getForgeExactAssetWarnings(
  assets: ForgeExactAssetMap = FORGE_EXACT_ASSETS,
): string[] {
  return Object.values(assets)
    .filter((asset) => asset.status !== 'ready')
    .map((asset) => `${asset.sourcePath} missing; using ${asset.fallbackSourcePath ?? 'CSS'} fallback for ${asset.key}.`);
}

export function getForgeExactAssetSrc(
  key: ForgeExactAssetKey,
  assets: ForgeExactAssetMap = FORGE_EXACT_ASSETS,
): string {
  return assets[key]?.src ?? '';
}
