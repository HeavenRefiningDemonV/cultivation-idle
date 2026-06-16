import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

const REQUIRED_FAMILIES = [
  'hero',
  'metrics',
  'currentState',
  'spiritRootObservation',
  'milestone',
  'cultivationBase',
  'missionRequirements',
  'bestImprovements',
  'safetyNet',
  'identityDoctrine',
  'currentWork',
  'buildPreparation',
  'recentChanges',
  'details',
  'namedStats',
] as const;

test('Status Observatory no-loss mapping represents every Status Ledger source family', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(1357).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);

  assert.equal(surface.noLoss.allRepresented, true);
  assert.deepEqual(surface.noLoss.missingFamilies, []);
  assert.deepEqual(surface.noLoss.families.map((entry) => entry.family), REQUIRED_FAMILIES);

  for (const family of surface.noLoss.families) {
    assert.equal(family.represented, true, `${family.family} should be represented.`);
    assert.equal(family.sourcePath.trim().length > 0, true, `${family.family} sourcePath should be set.`);
    assert.equal(family.defaultHome.trim().length > 0, true, `${family.family} defaultHome should be set.`);
    assert.equal(family.exactHome.trim().length > 0, true, `${family.family} exactHome should be set.`);
  }

  const byFamily = new Map(surface.noLoss.families.map((entry) => [entry.family, entry]));
  assert.equal(byFamily.get('metrics')?.rowCount, ledger.metrics.length);
  assert.equal(
    byFamily.get('currentState')?.rowCount,
    Object.keys(ledger.currentState.blocks).length
      + ledger.currentState.sharedCauseRows.length
      + ledger.currentState.buffDebuffRows.length
      + ledger.currentState.nextBottleneck.detailRows.length,
  );
  assert.equal(byFamily.get('missionRequirements')?.rowCount, ledger.missionRequirements.rows.length);
  assert.equal(byFamily.get('bestImprovements')?.actionCount, ledger.bestImprovements.rows.length + (ledger.bestImprovements.primary ? 1 : 0));
  assert.equal(byFamily.get('safetyNet')?.actionCount, ledger.safetyNet.action ? 1 : 0);
  assert.equal(byFamily.get('currentWork')?.rowCount, ledger.currentWork.rows.length + ledger.currentWork.activityTiles.length);
  assert.equal(byFamily.get('recentChanges')?.rowCount, ledger.recentChanges.rows.length);
  assert.equal(byFamily.get('details')?.rowCount, ledger.details.rows.length);
  assert.equal(byFamily.get('namedStats')?.rowCount, ledger.namedStats.allStats.length);

  assert.equal(surface.ledgerRail.noLossFamilies.length, REQUIRED_FAMILIES.length);
});
