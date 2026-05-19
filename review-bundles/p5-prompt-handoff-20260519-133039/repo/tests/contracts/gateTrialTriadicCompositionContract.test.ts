import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3B world-facing gate trial uses triadic world layout host', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  const layout = read('src/ui/trials/GateTrialWorldLayout.tsx');

  assert.match(panel, /GateTrialWorldLayout/);
  assert.match(layout, /gateTrialWorldLayout__triad/);
  assert.match(layout, /gateTrialWorldLayout__rail--minimum/);
  assert.match(layout, /gateTrialWorldLayout__rail--support/);
  assert.match(layout, /gateTrialWorldLayout__action/);
});

test('P6.3B triadic composition remains singular without a legacy details slab', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  assert.doesNotMatch(panel, /gateTrialPanel__adminDetails/);
  assert.doesNotMatch(panel, /<summary>Trial Details<\/summary>/);
});
