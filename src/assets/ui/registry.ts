import { CHROME_UI_ASSET_MANIFEST } from './chrome/chromeManifest.js';
import { FX_UI_ASSET_MANIFEST } from './fx/fxManifest.js';
import { HERO_UI_ASSET_MANIFEST } from './heroes/heroManifest.js';
import { OVERLAY_UI_ASSET_MANIFEST } from './overlays/overlayManifest.js';
import { EXISTING_UI_ASSET_REUSE_MAP } from './reuse/existingUiAssetReuseMap.js';
import type { UiAssetFamily, UiAssetSpec, UiScreenFamily } from './types.js';

const MANIFEST_ASSETS = [
  ...CHROME_UI_ASSET_MANIFEST.assets,
  ...FX_UI_ASSET_MANIFEST.assets,
  ...OVERLAY_UI_ASSET_MANIFEST.assets,
  ...HERO_UI_ASSET_MANIFEST.assets,
];

export const ALL_UI_ASSET_SPECS: readonly UiAssetSpec[] = [...MANIFEST_ASSETS, ...EXISTING_UI_ASSET_REUSE_MAP];

const specById = new Map<string, UiAssetSpec>();
for (const spec of ALL_UI_ASSET_SPECS) {
  if (specById.has(spec.id)) {
    throw new Error(`[ui-assets] Duplicate UiAssetSpec id detected: ${spec.id}`);
  }
  specById.set(spec.id, spec);
}

export function getUiAssetSpecById(id: string): UiAssetSpec | undefined {
  return specById.get(id);
}

export function getUiAssetsByFamily(family: UiAssetFamily): UiAssetSpec[] {
  return ALL_UI_ASSET_SPECS.filter((asset) => asset.family === family);
}

export function getExistingReusedUiAssets(): UiAssetSpec[] {
  return ALL_UI_ASSET_SPECS.filter((asset) => asset.status === 'existing-reused');
}

export function getPlannedMissingUiAssets(): UiAssetSpec[] {
  return ALL_UI_ASSET_SPECS.filter((asset) => asset.status === 'planned-missing');
}

export function getUiAssetsForScreenFamily(screenFamily: UiScreenFamily): UiAssetSpec[] {
  return ALL_UI_ASSET_SPECS.filter((asset) => asset.screenFamilies.includes(screenFamily));
}
