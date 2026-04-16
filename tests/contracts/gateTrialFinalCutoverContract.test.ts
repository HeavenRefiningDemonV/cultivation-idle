import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3F world-facing Gate Trial keeps canonical truth surfaces after cleanup', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(panel, /CombatModuleTopLane/);
  assert.match(panel, /GateTrialWorldLayout/);
  assert.match(panel, /GateTrialReadinessCard/);
  assert.match(panel, /GateTrialChecklist/);
  assert.match(panel, /GateTrialSafetyNetCard/);
  assert.match(panel, /GateTrialTopFixes/);
  assert.match(panel, /GateTrialAttemptCluster/);
  assert.match(panel, /Readiness Score:/);
});

test('P6.3F removes duplicate legacy admin/details slab from world-facing Gate Trial', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.doesNotMatch(panel, /gateTrialPanel__adminDetails/);
  assert.doesNotMatch(panel, /<summary>Trial Details<\/summary>/);
  assert.doesNotMatch(panel, /Combat Log/);
  assert.doesNotMatch(panel, /Gate Facts/);
});
