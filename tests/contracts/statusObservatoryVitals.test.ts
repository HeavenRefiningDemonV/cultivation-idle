import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

test('S0/S1 Vitals Ribbon preserves metric count, order, values, and accessible labels in data', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(97531).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);

  assert.equal(surface.vitalsRibbon.rootTestId, 'status-ledger-metrics');
  assert.equal(surface.vitalsRibbon.metrics.length, ledger.metrics.length);
  assert.equal(surface.vitalsRibbon.seals.length, ledger.metrics.length);
  assert.deepEqual(
    surface.vitalsRibbon.seals.map((seal) => seal.id),
    ledger.metrics.map((metric) => metric.id),
  );

  for (const seal of surface.vitalsRibbon.seals) {
    assert.equal(seal.label.trim().length > 0, true);
    assert.equal(seal.detail.trim().length > 0, true);
    assert.equal(seal.sourceLabel.trim().length > 0, true);
    assert.match(seal.ariaLabel, new RegExp(seal.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
