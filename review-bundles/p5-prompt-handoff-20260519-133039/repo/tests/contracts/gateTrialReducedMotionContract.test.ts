import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3C reduced motion and low tiers collapse to static-safe gate trial atmosphere', () => {
  const styles = read('src/ui/fx/scenes/GateTrialFxScene.scss');

  assert.match(styles, /data-quality='low'.*animation: none;/s);
  assert.match(styles, /data-quality='reducedMotion'.*animation: none;/s);
  assert.match(styles, /data-can-animate='0'.*animation: none;/s);
  assert.match(styles, /data-quality='reducedMotion'] \.gateTrialFxScene__motes \{\n  display: none;/s);
});

test('P6.3C world-facing panel keeps readability shell in content layer with FX beneath it', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(panel, /contentZIndex=\{1\}/);
  assert.match(panel, /stageZIndex=\{0\}/);
  assert.match(panel, /GateTrialReadinessCard/);
  assert.match(panel, /GateTrialChecklist/);
  assert.match(panel, /GateTrialSafetyNetCard/);
  assert.match(panel, /GateTrialTopFixes/);
  assert.match(panel, /GateTrialAttemptCluster/);
});
