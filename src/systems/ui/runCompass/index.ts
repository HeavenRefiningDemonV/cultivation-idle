export * from './types.js';
export { buildLiveRunCompassSurfaceV2 } from './buildRunCompassSurfaceV2.js';
export {
  adaptRunCompassV2ToLegacy,
  buildRunCompassCompactSurfaceFromV2,
} from './adaptRunCompassV2ToLegacy.js';

import { adaptRunCompassV2ToLegacy, buildRunCompassCompactSurfaceFromV2 } from './adaptRunCompassV2ToLegacy.js';
import { buildLiveRunCompassSurfaceV2 } from './buildRunCompassSurfaceV2.js';
import type { RunCompassCompactSurface, RunCompassSurface } from './types.js';

export function buildLiveRunCompassSurface(): RunCompassSurface | null {
  const v2 = buildLiveRunCompassSurfaceV2();
  return v2 ? adaptRunCompassV2ToLegacy(v2) : null;
}

export function buildRunCompassCompactSurface(surface: RunCompassSurface | null): RunCompassCompactSurface | null {
  if (!surface) return null;
  const firstBlocker = surface.missingRequirements[0] ?? surface.readiness.rows[0] ?? null;
  const firstAction = surface.bestNextActions[0] ?? null;
  return {
    milestoneLine: surface.milestone.title,
    readinessLabel: surface.milestone.readinessLabel,
    blockerLine: firstBlocker ? `${firstBlocker.label}: ${firstBlocker.detail}` : surface.milestone.detail,
    actionLine: firstAction
      ? `${firstAction.label} -> ${firstAction.destinationLabel}`
      : surface.safetyNet.detailLine,
    recentDeltaLine: surface.missingRequirements.find((line) => line.id.startsWith('delta-'))?.detail ?? null,
  };
}

export function buildLiveRunCompassCompactSurfaceV2(): RunCompassCompactSurface | null {
  return buildRunCompassCompactSurfaceFromV2(buildLiveRunCompassSurfaceV2());
}
