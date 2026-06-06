export type DaoHeartTurbulenceBand = 'clear' | 'stirred' | 'shaken' | 'disturbed' | 'fractured';

export interface DaoHeartTurbulencePreview {
  band: DaoHeartTurbulenceBand;
  riskDelta: number;
  heartLawXpMultiplier: number;
  verseMasteryMultiplier: number;
  breakthroughBlocked: boolean;
}

export function resolveDaoHeartTurbulencePreview(input: { turbulence: number }): DaoHeartTurbulencePreview {
  const turbulence = Math.max(0, Math.min(100, Math.floor(input.turbulence)));
  if (turbulence <= 15) {
    return { band: 'clear', riskDelta: 0, heartLawXpMultiplier: 1, verseMasteryMultiplier: 1, breakthroughBlocked: false };
  }
  if (turbulence <= 35) {
    return { band: 'stirred', riskDelta: 0, heartLawXpMultiplier: 0.95, verseMasteryMultiplier: 1, breakthroughBlocked: false };
  }
  if (turbulence <= 65) {
    return { band: 'shaken', riskDelta: 4, heartLawXpMultiplier: 1, verseMasteryMultiplier: 1, breakthroughBlocked: false };
  }
  if (turbulence <= 85) {
    return { band: 'disturbed', riskDelta: 9, heartLawXpMultiplier: 1, verseMasteryMultiplier: 0.9, breakthroughBlocked: false };
  }
  return { band: 'fractured', riskDelta: 15, heartLawXpMultiplier: 1, verseMasteryMultiplier: 0.8, breakthroughBlocked: true };
}
