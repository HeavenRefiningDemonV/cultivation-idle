import ruinsLocationPlaqueM from './pack/ruins_location_plaque_m.svg';
import ruinsSubIdentityPlaqueS from './pack/ruins_sub_identity_plaque_s.svg';
import ruinsAnchorUnderplateAS from './pack/ruins_anchor_underplate_a_s.svg';
import ruinsAnchorUnderplateBS from './pack/ruins_anchor_underplate_b_s.svg';
import ruinsChestFrameAccentAS from './pack/ruins_chest_frame_accent_a_s.svg';
import ruinsChestFrameAccentBS from './pack/ruins_chest_frame_accent_b_s.svg';
import ruinsMoodStampOrganicS from './pack/ruins_mood_stamp_organic_s.svg';
import ruinsMoodStampKilnS from './pack/ruins_mood_stamp_kiln_s.svg';
import ruinsMoodStampCrystalS from './pack/ruins_mood_stamp_crystal_s.svg';
import ruinsNeutralInsigniaS from './pack/ruins_neutral_insignia_s.svg';
import ruinsSupportPackSheet from './pack/ruins_support_pack_sheet.svg';

export type RuinsSupportArtRole =
  | 'ruin_location_plaque'
  | 'ruin_sub_identity_plate'
  | 'ruin_anchor_reward_underplate_a'
  | 'ruin_anchor_reward_underplate_b'
  | 'ruin_local_chest_frame_accent_a'
  | 'ruin_local_chest_frame_accent_b'
  | 'ruin_city_mood_stamp_organic'
  | 'ruin_city_mood_stamp_kiln'
  | 'ruin_city_mood_stamp_crystal'
  | 'ruin_neutral_insignia';

export type RuinsSupportArtSlot = 'locationPlaque' | 'subIdentityPlaque' | 'anchorRewardPlateA' | 'anchorRewardPlateB';

export const RUINS_SUPPORT_ART_FILES = {
  locationPlaque: 'ruins_location_plaque_m.svg',
  subIdentityPlaque: 'ruins_sub_identity_plaque_s.svg',
  anchorRewardPlateA: 'ruins_anchor_underplate_a_s.svg',
  anchorRewardPlateB: 'ruins_anchor_underplate_b_s.svg',
  chestFrameAccentA: 'ruins_chest_frame_accent_a_s.svg',
  chestFrameAccentB: 'ruins_chest_frame_accent_b_s.svg',
  cityMoodStampOrganic: 'ruins_mood_stamp_organic_s.svg',
  cityMoodStampKiln: 'ruins_mood_stamp_kiln_s.svg',
  cityMoodStampCrystal: 'ruins_mood_stamp_crystal_s.svg',
  neutralInsignia: 'ruins_neutral_insignia_s.svg',
  packSheet: 'ruins_support_pack_sheet.svg',
} as const;

export const RUINS_SUPPORT_ART_ASSET_URLS: Readonly<Record<keyof typeof RUINS_SUPPORT_ART_FILES, string>> = {
  locationPlaque: ruinsLocationPlaqueM,
  subIdentityPlaque: ruinsSubIdentityPlaqueS,
  anchorRewardPlateA: ruinsAnchorUnderplateAS,
  anchorRewardPlateB: ruinsAnchorUnderplateBS,
  chestFrameAccentA: ruinsChestFrameAccentAS,
  chestFrameAccentB: ruinsChestFrameAccentBS,
  cityMoodStampOrganic: ruinsMoodStampOrganicS,
  cityMoodStampKiln: ruinsMoodStampKilnS,
  cityMoodStampCrystal: ruinsMoodStampCrystalS,
  neutralInsignia: ruinsNeutralInsigniaS,
  packSheet: ruinsSupportPackSheet,
} as const;

export const RUINS_SUPPORT_ART_ROLE_MAP: Readonly<Record<RuinsSupportArtRole, keyof typeof RUINS_SUPPORT_ART_FILES>> = {
  ruin_location_plaque: 'locationPlaque',
  ruin_sub_identity_plate: 'subIdentityPlaque',
  ruin_anchor_reward_underplate_a: 'anchorRewardPlateA',
  ruin_anchor_reward_underplate_b: 'anchorRewardPlateB',
  ruin_local_chest_frame_accent_a: 'chestFrameAccentA',
  ruin_local_chest_frame_accent_b: 'chestFrameAccentB',
  ruin_city_mood_stamp_organic: 'cityMoodStampOrganic',
  ruin_city_mood_stamp_kiln: 'cityMoodStampKiln',
  ruin_city_mood_stamp_crystal: 'cityMoodStampCrystal',
  ruin_neutral_insignia: 'neutralInsignia',
} as const;

const SLOT_TO_FILE_KEY: Readonly<Record<RuinsSupportArtSlot, keyof typeof RUINS_SUPPORT_ART_FILES>> = {
  locationPlaque: 'locationPlaque',
  subIdentityPlaque: 'subIdentityPlaque',
  anchorRewardPlateA: 'anchorRewardPlateA',
  anchorRewardPlateB: 'anchorRewardPlateB',
} as const;

export interface ResolvedRuinsSupportArt {
  slot: RuinsSupportArtSlot;
  role: RuinsSupportArtRole;
  fileName: (typeof RUINS_SUPPORT_ART_FILES)[keyof typeof RUINS_SUPPORT_ART_FILES];
  assetUrl: string;
}

export function resolveRuinsSupportArt(slot: RuinsSupportArtSlot): ResolvedRuinsSupportArt {
  const fileKey = SLOT_TO_FILE_KEY[slot];
  const role = (Object.entries(RUINS_SUPPORT_ART_ROLE_MAP).find(([, key]) => key === fileKey)?.[0] ??
    'ruin_location_plaque') as RuinsSupportArtRole;

  return {
    slot,
    role,
    fileName: RUINS_SUPPORT_ART_FILES[fileKey],
    assetUrl: RUINS_SUPPORT_ART_ASSET_URLS[fileKey],
  };
}
