export type WorldSupportArtRole =
  | 'building_label_plaque'
  | 'district_area_label'
  | 'selected_building_emphasis_plate'
  | 'current_city_identity_plate'
  | 'city_arrival_banner'
  | 'route_hint_plaque_chip'
  | 'overlay_mask_map_to_inspector'
  | 'soft_fog_mask'
  | 'selected_building_glint'
  | 'recommended_route_swash';

import buildingLabelPlaque from '../../../Generated assets/ui_label_building_world_default_m.png';
import districtLabelPlaque from '../../../Generated assets/ui_label_district_world_default_l.png';
import selectedBuildingPlate from '../../../Generated assets/ui_plate_building_selected_world_default_m.png';
import currentCityPlate from '../../../Generated assets/ui_plate_city_current_world_default_l.png';
import cityArrivalBanner from '../../../Generated assets/ui_banner_city_arrival_world_default_l.png';
import routeHintPlaque from '../../../Generated assets/ui_hint_route_world_default_s.png';

export const WORLD_SUPPORT_ART_FILES = {
  buildingLabelPlaque: 'ui_label_building_world_default_m.png',
  districtLabelPlaque: 'ui_label_district_world_default_l.png',
  selectedBuildingPlate: 'ui_plate_building_selected_world_default_m.png',
  currentCityPlate: 'ui_plate_city_current_world_default_l.png',
  cityArrivalBanner: 'ui_banner_city_arrival_world_default_l.png',
  routeHintPlaque: 'ui_hint_route_world_default_s.png',
} as const;

export const WORLD_SUPPORT_ART_ASSET_URLS = {
  buildingLabelPlaque,
  districtLabelPlaque,
  selectedBuildingPlate,
  currentCityPlate,
  cityArrivalBanner,
  routeHintPlaque,
} as const;

export const WORLD_SUPPORT_ART_ROLE_MAP: Readonly<Record<WorldSupportArtRole, keyof typeof WORLD_SUPPORT_ART_FILES | 'code_only'>> = {
  building_label_plaque: 'buildingLabelPlaque',
  district_area_label: 'districtLabelPlaque',
  selected_building_emphasis_plate: 'selectedBuildingPlate',
  current_city_identity_plate: 'currentCityPlate',
  city_arrival_banner: 'cityArrivalBanner',
  route_hint_plaque_chip: 'routeHintPlaque',
  overlay_mask_map_to_inspector: 'code_only',
  soft_fog_mask: 'code_only',
  selected_building_glint: 'code_only',
  recommended_route_swash: 'code_only',
} as const;
