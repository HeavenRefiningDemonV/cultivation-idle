import {
  FX_PORTAL_BANDS,
  UI_GLOBAL_LAYERS,
  UI_LOCAL_COMPOSITION_LAYERS,
  getFxPortalBandOrder,
} from '../../app/layout/uiLayerContract.js';

export const FX_PORTAL_ROOT_ID = 'cultivation-idle-fx-portal-root';
export const FX_PORTAL_ROOT_GLOBAL_LAYER = UI_GLOBAL_LAYERS.fxPortalRoot;

export const SCREEN_FX_STAGE_ROLES = ['underlay', 'hero', 'overlay'] as const;
export type ScreenFxStageRole = (typeof SCREEN_FX_STAGE_ROLES)[number];

export const FX_PORTAL_BAND_KEYS = ['ambient', 'hero', 'overlay'] as const;
export type FxPortalBand = (typeof FX_PORTAL_BAND_KEYS)[number];

export const SCREEN_FX_STAGE_ROLE_TO_LOCAL_LAYER: Record<ScreenFxStageRole, number> = {
  underlay: UI_LOCAL_COMPOSITION_LAYERS.fxUnderlay,
  hero: UI_LOCAL_COMPOSITION_LAYERS.fxHero,
  overlay: UI_LOCAL_COMPOSITION_LAYERS.contentOverlay,
};

export function getScreenFxStageRoleOrder(role: ScreenFxStageRole): number {
  return SCREEN_FX_STAGE_ROLE_TO_LOCAL_LAYER[role];
}

export function getFxPortalBandRoleOrder(band: FxPortalBand): number {
  return getFxPortalBandOrder(band);
}

export function isScreenFxStageRole(value: unknown): value is ScreenFxStageRole {
  return typeof value === 'string' && (SCREEN_FX_STAGE_ROLES as readonly string[]).includes(value);
}

export function isFxPortalBand(value: unknown): value is FxPortalBand {
  return typeof value === 'string' && (FX_PORTAL_BAND_KEYS as readonly string[]).includes(value);
}

// A.2 compatibility aliases
export const FX_LAYER_TIERS = ['backdrop', 'ambient', 'heroUnderlay', 'heroOverlay'] as const;
export type FxLayerTier = (typeof FX_LAYER_TIERS)[number];

const LEGACY_LAYER_TO_ROLE: Record<FxLayerTier, ScreenFxStageRole> = {
  backdrop: 'underlay',
  ambient: 'underlay',
  heroUnderlay: 'hero',
  heroOverlay: 'overlay',
};

export const FX_LAYER_RESERVED_GLOBAL_CEILING = UI_GLOBAL_LAYERS.toasts - 1;

export function isValidFxLayerTier(value: unknown): value is FxLayerTier {
  return typeof value === 'string' && (FX_LAYER_TIERS as readonly string[]).includes(value);
}

export function getFxLayerOrder(tier: FxLayerTier): number {
  if (tier === 'backdrop') {
    return UI_LOCAL_COMPOSITION_LAYERS.backdrop;
  }

  return getScreenFxStageRoleOrder(LEGACY_LAYER_TO_ROLE[tier]);
}

export { FX_PORTAL_BANDS };
