import assert from 'node:assert/strict';
import test from 'node:test';

import { BALANCE_REGRESSION_MANIFEST } from '../../src/systems/balance/balanceRegressionManifest.js';

const EXPECTED_SECTIONS = ['timing', 'activities', 'prep', 'combat', 'offline', 'prestige', 'telemetry'] as const;

test('no-drift guard: all regression sections remain represented', () => {
  const sections = new Set(BALANCE_REGRESSION_MANIFEST.map((entry) => entry.section));
  for (const section of EXPECTED_SECTIONS) {
    assert.equal(sections.has(section), true, `missing section '${section}'`);
  }
});

test('no-drift guard: metric ids stay namespace-qualified', () => {
  for (const row of BALANCE_REGRESSION_MANIFEST) {
    assert.match(row.id, /^[a-z]+\.[a-z0-9_.]+$/i);
  }
});
