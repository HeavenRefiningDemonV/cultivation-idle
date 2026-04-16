export type GateTrialSupportArtRole =
  | 'checklist_minimum_plate'
  | 'checklist_recommended_plate'
  | 'readiness_band_companion'
  | 'readiness_band_companion_alt'
  | 'failsafe_frame'
  | 'seal_accent'
  | 'seal_accent_alt'
  | 'attempt_primary_plate'
  | 'attempt_secondary_plate'
  | 'gate_halo_base'
  | 'gate_halo_base_alt'
  | 'gate_underglow_soft'
  | 'readiness_glow_soft';

export const GATE_TRIAL_SUPPORT_ART_FILES: Readonly<Record<GateTrialSupportArtRole, string>> = {
  checklist_minimum_plate: 'ui_plate_gate_trial_checklist_minimum_default_m.png',
  checklist_recommended_plate: 'ui_plate_gate_trial_checklist_recommended_default_m.png',
  readiness_band_companion: 'ui_plate_gate_trial_readiness_band_default_m.png',
  readiness_band_companion_alt: 'ui_plate_gate_trial_readiness_band_variant_default_m.png',
  failsafe_frame: 'ui_frame_gate_trial_failsafe_default_m.png',
  seal_accent: 'ui_seal_gate_trial_accent_default_s.png',
  seal_accent_alt: 'ui_seal_gate_trial_accent_variant_default_s.png',
  attempt_primary_plate: 'ui_plate_gate_trial_attempt_primary_default_m.png',
  attempt_secondary_plate: 'ui_plate_gate_trial_attempt_secondary_default_s.png',
  gate_halo_base: 'ui_mask_gate_trial_halo_base_default_l.png',
  gate_halo_base_alt: 'ui_mask_gate_trial_halo_base_variant_default_l.png',
  gate_underglow_soft: 'ui_mask_gate_trial_underglow_soft_default_l.png',
  readiness_glow_soft: 'ui_mask_gate_trial_readiness_glow_soft_default_s.png',
} as const;

export const GATE_TRIAL_SUPPORT_ART_FALLBACK_FILES: Readonly<Record<GateTrialSupportArtRole, string>> = {
  checklist_minimum_plate: 'ui_plate_gate_trial_checklist_minimum_default_m.svg',
  checklist_recommended_plate: 'ui_plate_gate_trial_checklist_recommended_default_m.svg',
  readiness_band_companion: 'ui_plate_gate_trial_readiness_band_default_m.svg',
  readiness_band_companion_alt: 'ui_plate_gate_trial_readiness_band_variant_default_m.svg',
  failsafe_frame: 'ui_frame_gate_trial_failsafe_default_m.svg',
  seal_accent: 'ui_seal_gate_trial_accent_default_s.svg',
  seal_accent_alt: 'ui_seal_gate_trial_accent_variant_default_s.svg',
  attempt_primary_plate: 'ui_plate_gate_trial_attempt_primary_default_m.svg',
  attempt_secondary_plate: 'ui_plate_gate_trial_attempt_secondary_default_s.svg',
  gate_halo_base: 'ui_mask_gate_trial_halo_base_default_l.png',
  gate_halo_base_alt: 'ui_mask_gate_trial_halo_base_variant_default_l.png',
  gate_underglow_soft: 'ui_mask_gate_trial_underglow_soft_default_l.png',
  readiness_glow_soft: 'ui_mask_gate_trial_readiness_glow_soft_default_s.png',
} as const;

const DEFAULT_SVG_ASSET_URLS: Readonly<Record<GateTrialSupportArtRole, string | null>> = {
  checklist_minimum_plate: new URL('./pack/ui_plate_gate_trial_checklist_minimum_default_m.svg', import.meta.url).href,
  checklist_recommended_plate: new URL('./pack/ui_plate_gate_trial_checklist_recommended_default_m.svg', import.meta.url).href,
  readiness_band_companion: new URL('./pack/ui_plate_gate_trial_readiness_band_default_m.svg', import.meta.url).href,
  readiness_band_companion_alt: new URL('./pack/ui_plate_gate_trial_readiness_band_variant_default_m.svg', import.meta.url).href,
  failsafe_frame: new URL('./pack/ui_frame_gate_trial_failsafe_default_m.svg', import.meta.url).href,
  seal_accent: new URL('./pack/ui_seal_gate_trial_accent_default_s.svg', import.meta.url).href,
  seal_accent_alt: new URL('./pack/ui_seal_gate_trial_accent_variant_default_s.svg', import.meta.url).href,
  attempt_primary_plate: new URL('./pack/ui_plate_gate_trial_attempt_primary_default_m.svg', import.meta.url).href,
  attempt_secondary_plate: new URL('./pack/ui_plate_gate_trial_attempt_secondary_default_s.svg', import.meta.url).href,
  gate_halo_base: null,
  gate_halo_base_alt: null,
  gate_underglow_soft: null,
  readiness_glow_soft: null,
} as const;

const globFn = (import.meta as unknown as { glob?: (pattern: string, options: Record<string, unknown>) => Record<string, string> }).glob;
const GENERATED_ASSET_MODULES = globFn
  ? globFn('../../../Generated assets/*.{png,jpg,jpeg,webp}', {
    eager: true,
    import: 'default',
  })
  : ({} as Record<string, string>);

const GENERATED_ASSET_BY_FILE_NAME: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(GENERATED_ASSET_MODULES)
      .map(([path, url]) => {
        const fileName = path.split('/').pop() ?? null;
        return fileName ? [fileName, url] : null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  ),
);

export interface ResolvedGateTrialSupportArt {
  role: GateTrialSupportArtRole;
  fileName: string;
  assetUrl: string | null;
  available: boolean;
}

export function resolveGateTrialSupportArt(role: GateTrialSupportArtRole): ResolvedGateTrialSupportArt {
  const fileName = GATE_TRIAL_SUPPORT_ART_FILES[role];
  const assetUrl = GENERATED_ASSET_BY_FILE_NAME[fileName] ?? DEFAULT_SVG_ASSET_URLS[role] ?? null;
  return {
    role,
    fileName,
    assetUrl,
    available: Boolean(assetUrl),
  };
}

export function listMissingGateTrialSupportArtFiles(): string[] {
  return Object.values(GATE_TRIAL_SUPPORT_ART_FILES).filter((fileName) => !GENERATED_ASSET_BY_FILE_NAME[fileName]);
}
