import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { STATUS_OBSERVATORY_FIXTURE_SEEDS } from '../../src/systems/ui/status/statusObservatoryFixtures.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

test('S0/S1 Life Decree is a typed surface, not a rendered component', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(24680).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);

  assert.equal(surface.lifeDecree.rootTestId, 'status-ledger-hero');
  assert.equal(surface.lifeDecree.hero, ledger.hero);
  assert.equal(surface.lifeDecree.milestone, ledger.milestone);
  assert.match(surface.lifeDecree.title, /^Life Decree/);
  assert.equal(
    STATUS_OBSERVATORY_FIXTURE_SEEDS.some((seed) => seed.lifeDecree.title === 'Life Decree - This Life Record'),
    true,
    'Prestige-pressure fixture should reserve the life-record title variant.',
  );
});
