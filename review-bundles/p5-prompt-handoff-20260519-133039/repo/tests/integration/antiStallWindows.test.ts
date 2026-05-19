import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';
import { runPrepRecoveryProbe } from '../helpers/balance/runPrepRecoveryProbe.js';
import { assertBalanceMetric } from '../helpers/balance/assertBalanceMetric.js';

const SCENARIOS = ['consumables_only', 'forge_floor_only', 'build_correction_only'] as const;

test('anti-stall recovery windows keep isolated route recoverability inside locked windows', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);

  for (const scenario of SCENARIOS) {
    const probe = runPrepRecoveryProbe(validated, 3, scenario);
    assertBalanceMetric(`prep.recovery.${scenario}.gate_3`, probe.report.passesWindow, `minutes=${probe.report.estimatedRecoveryMinutes}`);
  }
});
