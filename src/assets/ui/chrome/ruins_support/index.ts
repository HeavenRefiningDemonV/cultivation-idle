export type RuinsSupportArtRole =
  | 'ruin_location_plaque'
  | 'ruin_anchor_reward_plate';

export type RuinsSupportArtSlot = 'locationPlaque' | 'anchorRewardPlate';

export const RUINS_SUPPORT_ART_FILES = {
  locationPlaque: 'ui_label_ruins_location_default_m.png',
  anchorRewardPlate: 'ui_plate_ruins_anchor_reward_default_s.png',
} as const;

export const RUINS_SUPPORT_ART_ROLE_MAP: Readonly<Record<RuinsSupportArtRole, keyof typeof RUINS_SUPPORT_ART_FILES>> = {
  ruin_location_plaque: 'locationPlaque',
  ruin_anchor_reward_plate: 'anchorRewardPlate',
} as const;

/**
 * The asset url map is intentionally optional: generated support-art is not a hard runtime dependency.
 * When files are absent, UI falls back to code-side chrome.
 */
export const RUINS_SUPPORT_ART_ASSET_URLS: Readonly<Partial<Record<keyof typeof RUINS_SUPPORT_ART_FILES, string>>> = {
} as const;

const SLOT_TO_FILE_KEY: Readonly<Record<RuinsSupportArtSlot, keyof typeof RUINS_SUPPORT_ART_FILES>> = {
  locationPlaque: 'locationPlaque',
  anchorRewardPlate: 'anchorRewardPlate',
} as const;

export interface ResolvedRuinsSupportArt {
  slot: RuinsSupportArtSlot;
  role: RuinsSupportArtRole;
  fileName: (typeof RUINS_SUPPORT_ART_FILES)[keyof typeof RUINS_SUPPORT_ART_FILES];
  assetUrl: string | null;
  usesFallback: boolean;
}

export function resolveRuinsSupportArt(slot: RuinsSupportArtSlot): ResolvedRuinsSupportArt {
  const fileKey = SLOT_TO_FILE_KEY[slot];
  const role = (Object.entries(RUINS_SUPPORT_ART_ROLE_MAP).find(([, key]) => key === fileKey)?.[0] ??
    'ruin_location_plaque') as RuinsSupportArtRole;
  const assetUrl = RUINS_SUPPORT_ART_ASSET_URLS[fileKey] ?? null;

  return {
    slot,
    role,
    fileName: RUINS_SUPPORT_ART_FILES[fileKey],
    assetUrl,
    usesFallback: assetUrl === null,
  };
}
