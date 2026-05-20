import type { DaoMandateSurfaceV1 } from './daoMandateTypes.js';

export interface DaoMandateCompactSurfaceV1 {
  milestoneLine: string;
  obstructionLine: string;
  primaryRouteLine: string;
  readinessLine: string;
  recentOmenLine: string | null;
}

export function buildDaoMandateCompactSurfaceV1(surface: DaoMandateSurfaceV1): DaoMandateCompactSurfaceV1 {
  return {
    milestoneLine: surface.milestone.label,
    obstructionLine: `${surface.obstruction.label}: ${surface.obstruction.detail}`,
    primaryRouteLine: `${surface.primaryRoute.label} -> ${surface.primaryRoute.destinationLabel}`,
    readinessLine: surface.readiness.primaryShortfallLabel ?? surface.readiness.label,
    recentOmenLine: surface.recentOmens[0]?.memoryLine ?? null,
  };
}
