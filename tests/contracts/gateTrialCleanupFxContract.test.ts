import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3F cleanup keeps gate trial FX quality/reduced-motion plumbing coherent', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(panel, /useFxQuality\(\)/);
  assert.match(panel, /useFxStageSnapshot\(FX_STAGE_IDS\.gateTrial\)/);
  assert.match(panel, /buildFxSceneContract\(/);
  assert.match(panel, /requestedQuality/);
  assert.match(panel, /effectiveQuality/);
  assert.match(panel, /prefersReducedMotion/);
  assert.match(panel, /<GateTrialFxScene/);
});
