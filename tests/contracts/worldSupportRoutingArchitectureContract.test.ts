import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-05 routes support recommendations through map cues and overlay inspector without disclosure deck owner', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');

  assert.match(worldScreen, /buildWorldModuleRoutingSurface/);
  assert.match(worldScreen, /moduleMetadataByKey/);
  assert.match(worldScreen, /moduleCueByKey/);
  assert.match(worldScreen, /WorldOverlayInspector/);
  assert.doesNotMatch(worldScreen, /worldCommandDeckDisclosure/);
  assert.doesNotMatch(worldScreen, /Show module routing deck/);
});

test('WR-05 support routing keeps map, ribbon, and inspector layers separated', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /worldScreenMapLayer/);
  assert.match(worldScreen, /worldScreenRibbonLayer/);
  assert.match(worldScreen, /worldScreenInspectorLayer/);
  const mapIndex = worldScreen.indexOf('worldScreenMapLayer');
  const ribbonIndex = worldScreen.indexOf('worldScreenRibbonLayer');
  const inspectorIndex = worldScreen.indexOf('worldScreenInspectorLayer');
  assert.ok(mapIndex >= 0 && ribbonIndex > mapIndex, 'ribbon layer should render after the map layer');
  assert.ok(inspectorIndex > ribbonIndex, 'inspector layer should render after the ribbon layer');
});
