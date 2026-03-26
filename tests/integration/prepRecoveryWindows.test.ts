import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';
import { runPrepRecoveryProbe } from '../helpers/balance/runPrepRecoveryProbe.js';

const EXPECTED_FIRST_ROUTE = {
  consumables_only: 'apothecary_buy',
  forge_floor_only: 'forge',
  build_correction_only: 'manual_pavilion',
} as const;

const SCENARIOS = ['consumables_only', 'forge_floor_only', 'build_correction_only'] as const;

test('isolated prep recovery windows stay route-correct, honest, and within explicit gate windows', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);

  for (let gate = 1; gate <= 5; gate += 1) {
    for (const scenario of SCENARIOS) {
      const probe = runPrepRecoveryProbe(validated, gate, scenario);
      const { report } = probe;

      assert.equal(report.canonicalFirstRouteFamily, EXPECTED_FIRST_ROUTE[scenario], `gate ${gate} ${scenario} first-route family drifted`);
      assert.ok(report.shortfalls.length > 0, `gate ${gate} ${scenario} should contain isolated shortfalls`);
      assert.ok(report.recommendedRouteSequence.length > 0, `gate ${gate} ${scenario} should have route sequence`);
      assert.equal(report.passesWindow, true, `gate ${gate} ${scenario} must recover within window`);
      assert.equal(report.estimatedRecoveryMinutes <= report.maxMinutes, true, `gate ${gate} ${scenario} exceeded max window`);
      assert.equal(report.sourceFamiliesUsed.length > 0, true, `gate ${gate} ${scenario} must use visible source families`);
      assert.equal(report.recommendedRouteSequence.includes('hold_and_cultivate'), false, `gate ${gate} ${scenario} should not fail-safe when recoverable`);
    }
  }
});
