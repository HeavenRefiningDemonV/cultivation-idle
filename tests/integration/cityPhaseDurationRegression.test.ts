import test from 'node:test';

import { runPhaseTimingProbe } from '../helpers/balance/runPhaseTimingProbe.js';
import { assertBalanceMetric } from '../helpers/balance/assertBalanceMetric.js';
import { runBalanceRegressionSuite } from '../helpers/balance/runBalanceRegressionSuite.js';

const METRIC_BY_PHASE_ID: Record<string, string> = {
  pinewind_phase_target_seconds: 'timing.city_phase.pinewind',
  stonecrag_phase_target_seconds: 'timing.city_phase.stonecrag',
  spirit_cavern_phase_target_seconds: 'timing.city_phase.spirit_cavern',
  lotusford_phase_target_seconds: 'timing.city_phase.lotusford',
  ironpeak_phase_target_seconds: 'timing.city_phase.ironpeak',
};

test('city phase duration regression remains deterministic and inside locked slack', async () => {
  const probe = await runPhaseTimingProbe();
  const checks = probe.phaseTimingReport.phaseDurations.map((phase) => ({
    metricId: METRIC_BY_PHASE_ID[phase.phaseId] ?? `timing.phase.${phase.phaseId}`,
    run: () => {
      assertBalanceMetric(METRIC_BY_PHASE_ID[phase.phaseId] ?? phase.phaseId, phase.actualSeconds !== null, 'actual seconds missing');
      assertBalanceMetric(METRIC_BY_PHASE_ID[phase.phaseId] ?? phase.phaseId, phase.withinValidationSlack, `drift=${phase.driftSeconds}`);
    },
  }));

  await runBalanceRegressionSuite(checks);
});
