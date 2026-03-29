export const UI_GLOBAL_LAYERS = {
  pageBackground: 0,
  textureOverlay: 1,
  fxPortalRoot: 2,
  screenShell: 10,
  header: 40,
  combatPresentation: 45,
  systemPanel: 50,
  toasts: 90,
  onboarding: 105,
  cityArrival: 110,
  bottomNav: 200,
  drawer: 320,
  modalBase: 1000,
  detailModal: 1200,
  blockingModal: 1500,
  featureModal: 1600,
  emergencyModal: 1800,
} as const;

export const UI_LOCAL_COMPOSITION_LAYERS = {
  backdrop: 0,
  texture: 1,
  fxUnderlay: 2,
  content: 10,
  fxHero: 12,
  contentOverlay: 20,
} as const;

export const FX_PORTAL_BANDS = {
  ambient: 0,
  hero: 1,
  overlay: 2,
} as const;

export type UiGlobalLayerKey = keyof typeof UI_GLOBAL_LAYERS;
export type UiLocalCompositionLayerKey = keyof typeof UI_LOCAL_COMPOSITION_LAYERS;
export type FxPortalBandKey = keyof typeof FX_PORTAL_BANDS;

export const UI_GLOBAL_LAYER_KEYS = Object.keys(UI_GLOBAL_LAYERS) as readonly UiGlobalLayerKey[];
export const UI_LOCAL_COMPOSITION_LAYER_KEYS = Object.keys(UI_LOCAL_COMPOSITION_LAYERS) as readonly UiLocalCompositionLayerKey[];
export const FX_PORTAL_BAND_KEYS = Object.keys(FX_PORTAL_BANDS) as readonly FxPortalBandKey[];

export function getUiGlobalLayerValue(key: UiGlobalLayerKey): number {
  return UI_GLOBAL_LAYERS[key];
}

export function getUiLocalCompositionLayerValue(key: UiLocalCompositionLayerKey): number {
  return UI_LOCAL_COMPOSITION_LAYERS[key];
}

export function getFxPortalBandOrder(key: FxPortalBandKey): number {
  return FX_PORTAL_BANDS[key];
}

export function isUiGlobalLayerKey(value: unknown): value is UiGlobalLayerKey {
  return typeof value === 'string' && UI_GLOBAL_LAYER_KEYS.includes(value as UiGlobalLayerKey);
}

export function isUiLocalCompositionLayerKey(value: unknown): value is UiLocalCompositionLayerKey {
  return typeof value === 'string' && UI_LOCAL_COMPOSITION_LAYER_KEYS.includes(value as UiLocalCompositionLayerKey);
}
