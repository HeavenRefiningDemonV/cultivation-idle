export type ProbeReadinessBand = 'belowMinimum' | 'minimum' | 'recommended';

export interface GateCombatProbeScenario {
  gateIndex: 1 | 2 | 3 | 4 | 5;
  readinessBand: ProbeReadinessBand;
  samples: number;
}

export function createGateCombatProbeScenario(
  gateIndex: 1 | 2 | 3 | 4 | 5,
  readinessBand: ProbeReadinessBand,
  samples = 200,
): GateCombatProbeScenario {
  return {
    gateIndex,
    readinessBand,
    samples,
  };
}
