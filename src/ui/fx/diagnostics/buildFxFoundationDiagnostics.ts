import type { FxQualityContract } from '../fxQualityContract.js';
import type {
  FxFoundationDiagnostics,
  FxFoundationFallbackMode,
  FxFoundationRuntimeSnapshot,
} from './types.js';

export interface BuildFxFoundationDiagnosticsInput {
  quality: FxQualityContract;
  runtimeSnapshot: FxFoundationRuntimeSnapshot;
}

function resolveFallbackMode(animatedMountCount: number, staticFallbackCount: number): FxFoundationFallbackMode {
  if (animatedMountCount <= 0 && staticFallbackCount <= 0) return 'off';
  if (animatedMountCount > 0 && staticFallbackCount <= 0) return 'none';
  if (animatedMountCount <= 0 && staticFallbackCount > 0) return 'static';
  return 'mixed';
}

export function buildFxFoundationDiagnostics(
  input: BuildFxFoundationDiagnosticsInput,
): FxFoundationDiagnostics {
  const { quality, runtimeSnapshot } = input;
  const activeSceneCount = runtimeSnapshot.animatedMountCount + runtimeSnapshot.staticFallbackCount;
  const fallbackMode = resolveFallbackMode(
    runtimeSnapshot.animatedMountCount,
    runtimeSnapshot.staticFallbackCount,
  );
  const reducedMotionClampActive =
    quality.reducedMotion && (!quality.allowContinuousAtmosphere || !quality.allowAnimatedHeroFx);

  const warnings: string[] = [];
  const notes: string[] = [];

  if (runtimeSnapshot.portalRootPresent && runtimeSnapshot.globalStageCount === 0) {
    warnings.push('orphaned-global-portal-root');
  }

  if (quality.renderMode === 'off' && runtimeSnapshot.animatedMountCount > 0) {
    warnings.push('animated-mounts-while-off');
  }

  if (quality.reducedMotion && runtimeSnapshot.animatedMountCount > 0) {
    warnings.push('animated-mounts-under-reduced-motion');
  }

  if (fallbackMode === 'mixed') {
    warnings.push('mixed-fallback-state');
  }

  if (runtimeSnapshot.heroMountCount > 1) {
    warnings.push('multiple-hero-mounts');
  }

  if (activeSceneCount > 3) {
    warnings.push('high-foundation-scene-count');
  }

  notes.push(`active-scenes:${activeSceneCount}`);
  notes.push(`fallback-mode:${fallbackMode}`);
  notes.push(`quality:${quality.resolvedQuality}/${quality.renderMode}`);

  return {
    resolvedQuality: quality.resolvedQuality,
    renderMode: quality.renderMode,
    reducedMotion: quality.reducedMotion,
    activeSceneCount,
    fallbackMode,
    reducedMotionClampActive,
    portalRootPresent: runtimeSnapshot.portalRootPresent,
    warnings,
    notes,
  };
}
