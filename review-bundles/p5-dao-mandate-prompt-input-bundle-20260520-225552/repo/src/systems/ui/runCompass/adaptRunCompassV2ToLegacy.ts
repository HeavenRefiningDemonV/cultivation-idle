import {
  type RunCompassActionLine,
  type RunCompassCompactSurface,
  type RunCompassInfoLine,
  type RunCompassRouteV2,
  type RunCompassSurface,
  type RunCompassSurfaceV2,
} from './types.js';

function toLegacyAction(route: RunCompassRouteV2): RunCompassActionLine {
  return {
    id: route.id,
    label: route.label,
    why: route.detail,
    destinationLabel: route.destinationLabel,
    blocked: route.blocked,
    blockedReason: route.blockedReason,
    target: route.target,
  };
}

function toInfoTone(severity: RunCompassSurfaceV2['primaryBlocker']['severity']): RunCompassInfoLine['tone'] {
  if (severity === 'success') return 'success';
  if (severity === 'warning' || severity === 'danger') return 'warning';
  if (severity === 'none') return 'muted';
  return 'default';
}

export function adaptRunCompassV2ToLegacy(surface: RunCompassSurfaceV2): RunCompassSurface {
  const blockerLine: RunCompassInfoLine = {
    id: `blocker-${surface.primaryBlocker.kind}`,
    label: surface.primaryBlocker.label,
    detail: surface.primaryBlocker.detail,
    tone: toInfoTone(surface.primaryBlocker.severity),
  };
  const readinessRows: RunCompassInfoLine[] = surface.readiness.rows.map((row) => ({
    id: row.id,
    label: row.label,
    detail: row.detail,
    tone: row.tone,
  }));
  const deltaRows: RunCompassInfoLine[] = surface.recentDeltas.slice(0, 2).map((delta) => ({
    id: `delta-${delta.id}`,
    label: delta.label,
    detail: delta.memoryLine,
    tone: delta.tone === 'success' ? 'success' : delta.tone === 'warning' || delta.tone === 'danger' ? 'warning' : 'muted',
  }));

  return {
    milestone: {
      title: surface.milestone.label,
      detail: surface.milestone.detail,
      contextLine: surface.milestone.contextLine,
      readinessLabel: surface.readiness.label,
      prestigeLine: surface.prestigeHint && surface.prestigeHint.state !== 'hidden'
        ? `${surface.prestigeHint.label}: ${surface.prestigeHint.detail}`
        : null,
    },
    readiness: {
      label: surface.readiness.label,
      detail: surface.readiness.primaryShortfallLabel ?? surface.primaryBlocker.detail,
      diagnosisLabel: surface.readiness.diagnosisLabel,
      rows: readinessRows.length > 0 ? readinessRows : [blockerLine],
    },
    missingRequirements: surface.primaryBlocker.kind === 'none'
      ? deltaRows
      : [blockerLine, ...deltaRows],
    bestNextActions: [
      toLegacyAction(surface.primaryRoute),
      ...surface.secondaryRoutes.map(toLegacyAction),
    ].slice(0, 3),
    safetyNet: {
      title: surface.safetyNet?.label ?? 'Safety Net',
      progressLine: surface.safetyNet?.progressLine ?? 'No active Safety Net pressure.',
      costLine: surface.safetyNet?.detail ?? 'Safety Net is not the current primary route.',
      reserveLine: surface.prestigeHint?.label ?? surface.milestone.contextLine,
      detailLine: surface.recentDeltas[0]?.memoryLine ?? surface.primaryRoute.expectedDeltaLabel ?? surface.primaryRoute.detail,
    },
  };
}

export function buildRunCompassCompactSurfaceFromV2(surface: RunCompassSurfaceV2 | null): RunCompassCompactSurface | null {
  if (!surface) return null;
  return {
    milestoneLine: surface.milestone.label,
    readinessLabel: surface.readiness.label,
    blockerLine: `${surface.primaryBlocker.label}: ${surface.primaryBlocker.detail}`,
    actionLine: `${surface.primaryRoute.label} -> ${surface.primaryRoute.destinationLabel}`,
    recentDeltaLine: surface.recentDeltas[0]?.memoryLine ?? null,
  };
}
