import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-02 world above-the-fold anatomy keeps map, ribbon, and inspector overlay layers', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  const canvasIndex = worldScreen.indexOf('worldScreenCanvas');
  const mapLayerIndex = worldScreen.indexOf('worldScreenMapLayer');
  const ribbonLayerIndex = worldScreen.indexOf('worldScreenRibbonLayer');
  const inspectorLayerIndex = worldScreen.indexOf('worldScreenInspectorLayer');
  const drawerIndex = worldScreen.indexOf('<InspectorDrawer');

  assert.ok(canvasIndex >= 0, 'World canvas should own the exact-screen composition.');
  assert.ok(mapLayerIndex > canvasIndex, 'Map layer should be inside the world canvas.');
  assert.ok(ribbonLayerIndex > mapLayerIndex, 'Overlay ribbon should be rendered after the map layer.');
  assert.ok(inspectorLayerIndex > ribbonLayerIndex, 'Wide inspector layer should follow the overlay ribbon.');
  assert.ok(drawerIndex > inspectorLayerIndex, 'Narrow inspector drawer should remain a fallback after the wide layer.');
});

test('WR-02 routes local module truth into the world routing surface instead of duplicating command UI', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /buildWorldModuleRoutingSurface/);
  assert.doesNotMatch(worldScreen, /buildLiveDaoMandateSurfaceV1/);
  assert.doesNotMatch(worldScreen, /buildWorldMandateRoutingLensSurface/);
  assert.doesNotMatch(worldScreen, /mandatePrimaryModuleKey/);
  assert.doesNotMatch(worldScreen, /mandateSecondaryModuleKeys/);
  assert.match(worldScreen, /<WorldOverlayRibbon/);
  assert.match(worldScreen, /<WorldOverlayInspector/);
  assert.match(worldScreen, /<InspectorDrawer/);
  assert.doesNotMatch(worldScreen, /worldScreenHubShellHeader/);
  assert.doesNotMatch(worldScreen, /<RunCompass surface=\{runCompass\.full\}/);
  assert.doesNotMatch(worldScreen, /useRunCompassSurface/);
});
