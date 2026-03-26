import { getReadinessOutcomeTarget, type ReadinessCalibrationBand } from '../balance/readinessOutcomeTargets.js';
import type { ReadinessBand } from './readinessScoringTypes.js';

export type ReadinessDriftDirection = 'too_optimistic' | 'too_pessimistic' | 'on_target';

export interface ReadinessCalibrationProbeResult {
  gateIndex: 1 | 2 | 3 | 4 | 5;
  cohort: string;
  intendedBand: ReadinessCalibrationBand;
  actualReadinessBand: ReadinessBand;
  actualWinRate: number;
  componentBands?: {
    build?: ReadinessBand;
    forge?: ReadinessBand;
    economic?: ReadinessBand;
    posture?: ReadinessBand;
  };
}

export interface ReadinessCalibrationRow {
  gateIndex: 1 | 2 | 3 | 4 | 5;
  cohort: string;
  intendedBand: ReadinessCalibrationBand;
  actualReadinessBand: ReadinessBand;
  actualWinRate: number;
  targetWinRateEnvelope: readonly [number, number];
  pass: boolean;
  driftDirection: ReadinessDriftDirection;
  componentBands?: ReadinessCalibrationProbeResult['componentBands'];
}

function resolveDriftDirection(actualWinRate: number, envelope: readonly [number, number]): ReadinessDriftDirection {
  if (actualWinRate < envelope[0]) return 'too_optimistic';
  if (actualWinRate > envelope[1]) return 'too_pessimistic';
  return 'on_target';
}

export function buildReadinessCalibrationRows(
  results: readonly ReadinessCalibrationProbeResult[],
): ReadinessCalibrationRow[] {
  return results.flatMap((result) => {
    const target = getReadinessOutcomeTarget(result.gateIndex);
    if (!target) return [];
    const targetWinRateEnvelope = target.expectedWinRateByBand[result.intendedBand];
    const driftDirection = resolveDriftDirection(result.actualWinRate, targetWinRateEnvelope);

    return [{
      gateIndex: result.gateIndex,
      cohort: result.cohort,
      intendedBand: result.intendedBand,
      actualReadinessBand: result.actualReadinessBand,
      actualWinRate: result.actualWinRate,
      targetWinRateEnvelope,
      pass: driftDirection === 'on_target',
      driftDirection,
      componentBands: result.componentBands,
    }];
  });
}
