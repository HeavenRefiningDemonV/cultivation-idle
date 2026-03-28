import type { FxQualityContract } from '../fxQualityContract.js';

export type FxFoundationFallbackMode = 'none' | 'static' | 'off' | 'mixed';

export interface FxFoundationRuntimeSnapshot {
  localStageCount: number;
  globalStageCount: number;
  ambientMountCount: number;
  heroMountCount: number;
  animatedMountCount: number;
  staticFallbackCount: number;
  offMountCount: number;
  portalRootPresent: boolean;
}

export interface FxFoundationDiagnostics {
  resolvedQuality: FxQualityContract['resolvedQuality'];
  renderMode: FxQualityContract['renderMode'];
  reducedMotion: boolean;
  activeSceneCount: number;
  fallbackMode: FxFoundationFallbackMode;
  reducedMotionClampActive: boolean;
  portalRootPresent: boolean;
  warnings: string[];
  notes: string[];
}

export type FxFoundationChecklistCategory =
  | 'ownership'
  | 'quality'
  | 'layering'
  | 'fallback'
  | 'integration'
  | 'readability';

export interface FxFoundationChecklistEntry {
  id: string;
  category: FxFoundationChecklistCategory;
  title: string;
  rule: string;
  whyItMatters: string;
}
