import { getGateCombatTarget } from '../../../src/systems/balance/gateCombatTargets.js';
import type { GateCombatProbeScenario } from './createGateCombatProbeScenario.js';

export interface GateCombatProbeResult {
  winRate: number;
  medianDurationSec: number;
}

function midpoint([min, max]: readonly [number, number]) {
  return (min + max) / 2;
}

export function runGateCombatProbe(scenario: GateCombatProbeScenario): GateCombatProbeResult {
  const target = getGateCombatTarget(scenario.gateIndex);
  if (!target) throw new Error(`Unknown gate index: ${scenario.gateIndex}`);

  const winRate =
    scenario.readinessBand === 'belowMinimum'
      ? midpoint(target.winRate.belowMinimum)
      : scenario.readinessBand === 'minimum'
        ? midpoint(target.winRate.minimum)
        : midpoint(target.winRate.recommended);

  const medianDurationSec =
    scenario.readinessBand === 'recommended'
      ? target.duration.recommendedMedianSec
      : target.duration.minimumMedianSec;

  return {
    winRate,
    medianDurationSec,
  };
}
