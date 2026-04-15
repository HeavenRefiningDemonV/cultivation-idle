import fogBankLowerA from './pack/overlays/ruins_overlay_fogbank_lower_a_w.svg';
import fogBankLowerB from './pack/overlays/ruins_overlay_fogbank_lower_b_w.svg';
import chamberHazeLeft from './pack/overlays/ruins_overlay_chamber_haze_left_m.svg';
import chamberHazeRight from './pack/overlays/ruins_overlay_chamber_haze_right_m.svg';
import midBandStaleAir from './pack/overlays/ruins_overlay_midband_stale_air_w.svg';
import upperVignette from './pack/overlays/ruins_overlay_upper_vignette_w.svg';
import anchorGlowA from './pack/overlays/ruins_overlay_anchor_glow_a_t.svg';
import anchorGlowB from './pack/overlays/ruins_overlay_anchor_glow_b_t.svg';
import overlayPackSheet from './pack/overlays/ruins_overlay_pack_sheet.svg';

export type RuinsOverlayRole =
  | 'ruin_lower_fog_bank_a'
  | 'ruin_lower_fog_bank_b'
  | 'ruin_chamber_haze_left'
  | 'ruin_chamber_haze_right'
  | 'ruin_midband_stale_air'
  | 'ruin_upper_vignette'
  | 'ruin_anchor_soft_glow_a'
  | 'ruin_anchor_soft_glow_b';

export const RUINS_OVERLAY_FILES = {
  fogBankLowerA: 'ruins_overlay_fogbank_lower_a_w.svg',
  fogBankLowerB: 'ruins_overlay_fogbank_lower_b_w.svg',
  chamberHazeLeft: 'ruins_overlay_chamber_haze_left_m.svg',
  chamberHazeRight: 'ruins_overlay_chamber_haze_right_m.svg',
  midBandStaleAir: 'ruins_overlay_midband_stale_air_w.svg',
  upperVignette: 'ruins_overlay_upper_vignette_w.svg',
  anchorSoftGlowA: 'ruins_overlay_anchor_glow_a_t.svg',
  anchorSoftGlowB: 'ruins_overlay_anchor_glow_b_t.svg',
  overlayPackSheet: 'ruins_overlay_pack_sheet.svg',
} as const;

export const RUINS_OVERLAY_ASSET_URLS: Readonly<Record<keyof typeof RUINS_OVERLAY_FILES, string>> = {
  fogBankLowerA,
  fogBankLowerB,
  chamberHazeLeft,
  chamberHazeRight,
  midBandStaleAir,
  upperVignette,
  anchorSoftGlowA: anchorGlowA,
  anchorSoftGlowB: anchorGlowB,
  overlayPackSheet,
} as const;

export const RUINS_OVERLAY_ROLE_MAP: Readonly<Record<RuinsOverlayRole, keyof typeof RUINS_OVERLAY_FILES>> = {
  ruin_lower_fog_bank_a: 'fogBankLowerA',
  ruin_lower_fog_bank_b: 'fogBankLowerB',
  ruin_chamber_haze_left: 'chamberHazeLeft',
  ruin_chamber_haze_right: 'chamberHazeRight',
  ruin_midband_stale_air: 'midBandStaleAir',
  ruin_upper_vignette: 'upperVignette',
  ruin_anchor_soft_glow_a: 'anchorSoftGlowA',
  ruin_anchor_soft_glow_b: 'anchorSoftGlowB',
} as const;
