export const FX_PORTAL_ROOT_ID = 'cultivation-idle-fx-portal-root';

export const FX_LAYER_TIERS = ['backdrop', 'ambient', 'heroUnderlay', 'heroOverlay'] as const;

export type FxLayerTier = (typeof FX_LAYER_TIERS)[number];

const FX_LAYER_ORDER: Record<FxLayerTier, number> = {
  backdrop: 10,
  ambient: 20,
  heroUnderlay: 30,
  heroOverlay: 40,
};

/**
 * Conservative A.2-only upper ceiling for FX layers.
 * Kept below higher app overlay bands (notifications/modals/etc).
 */
export const FX_LAYER_RESERVED_GLOBAL_CEILING = 80;

export function isValidFxLayerTier(value: unknown): value is FxLayerTier {
  return typeof value === 'string' && (FX_LAYER_TIERS as readonly string[]).includes(value);
}

export function getFxLayerOrder(tier: FxLayerTier): number {
  return FX_LAYER_ORDER[tier];
}
