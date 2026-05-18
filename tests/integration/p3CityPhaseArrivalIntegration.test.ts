import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('P3 city phase header consumes city arrival state and shared surface builder', () => {
  const worldScreen = readFileSync('src/components/screens/WorldScreen.tsx', 'utf8');
  const ribbon = readFileSync('src/ui/world/WorldOverlayRibbon.tsx', 'utf8');

  assert.match(worldScreen, /buildCityPhaseSurfaceFromSnapshot/);
  assert.match(worldScreen, /acknowledgedArrivalCityIds/);
  assert.match(worldScreen, /pendingCityArrivalId/);
  assert.match(worldScreen, /phaseLine=\{phaseLine\}/);
  assert.match(ribbon, /phaseLine/);
  assert.match(ribbon, /pressureLine/);
});
