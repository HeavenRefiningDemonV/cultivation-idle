import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('World mounts the overlay ribbon and inspector from the shared Run Compass-derived command surface', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /<WorldOverlayRibbon/);
  assert.match(file, /<WorldOverlayInspector/);
  assert.match(file, /buildWorldModuleRoutingSurface\(\{/);
  assert.match(file, /runCompassPrimaryModuleKey: runCompassModuleKeys\.primary/);
  assert.match(file, /runCompassSecondaryModuleKey: runCompassModuleKeys\.secondary/);
  assert.doesNotMatch(file, /<TopRibbon/);
  assert.doesNotMatch(file, /worldScreenCommandBand/);
});

test('World command truth is available before the narrow inspector drawer fallback', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const ribbonIndex = file.indexOf('<WorldOverlayRibbon');
  const wideInspectorIndex = file.indexOf('<WorldOverlayInspector');
  const drawerIndex = file.indexOf('<InspectorDrawer');
  assert.ok(ribbonIndex >= 0, 'WorldOverlayRibbon should exist');
  assert.ok(wideInspectorIndex >= 0, 'WorldOverlayInspector should exist');
  assert.ok(drawerIndex >= 0, 'InspectorDrawer should exist');
  assert.ok(ribbonIndex < drawerIndex, 'ribbon should be mounted before the drawer fallback');
  assert.ok(wideInspectorIndex < drawerIndex, 'wide inspector should be mounted before the drawer fallback');
});
