import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3A gate-trial role framing stays milestone/readiness oriented', () => {
  const contract = read('src/systems/readiness/gateTrialScreenContract.ts');
  const worldPanel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(contract, /Milestone Validation/);
  assert.match(contract, /validate readiness and risk/i);
  assert.doesNotMatch(worldPanel, /gold farm|sandbox|generic encounter/i);
});
