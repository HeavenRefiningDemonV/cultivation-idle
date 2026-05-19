import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3B gate stage differentiates idle gate scene and active combat state', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(panel, /gateTrialStage--active/);
  assert.match(panel, /gateTrialStage--idle/);
  assert.match(panel, /gateTrialStage__idleScene/);
  assert.match(panel, /gateTrialStage__activeScene/);
  assert.match(panel, /cityGateBackground/);
  assert.match(panel, /entryGate/);
  assert.match(panel, /gateSymbol/);
});
