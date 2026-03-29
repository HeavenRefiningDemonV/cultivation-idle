export type UiAssetFamily = 'chrome' | 'fx' | 'overlay' | 'hero';

export type UiAssetSubfamily =
  | 'frame'
  | 'plaque'
  | 'ribbon'
  | 'particle'
  | 'halo'
  | 'swash'
  | 'paper'
  | 'mask'
  | 'cultivation'
  | 'heartlaw'
  | 'world'
  | 'background'
  | 'indicator'
  | 'utility';

export type UiAssetStatus = 'existing-reused' | 'planned-missing' | 'planned-optional';

export type UiScreenFamily = 'hero' | 'world' | 'module' | 'dense' | 'ritual' | 'global';

export interface UiAssetSpec {
  id: string;
  family: UiAssetFamily;
  subfamily: UiAssetSubfamily;
  status: UiAssetStatus;
  logicalName: string;
  intendedUse: string;
  screenFamilies: UiScreenFamily[];
  textless: boolean;
  tintable: boolean;
  nineSliceCandidate: boolean;
  layeredKit: boolean;
  expectedPath: string;
  sourcePath?: string;
  notes: string[];
}

export interface UiAssetManifest {
  family: UiAssetFamily;
  assets: UiAssetSpec[];
}
