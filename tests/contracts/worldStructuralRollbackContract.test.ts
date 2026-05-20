import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-01 removes duplicate visible city-map shell header and keeps map + inspector structure', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.doesNotMatch(worldScreen, /worldScreenHubShellHeader/);
  assert.match(worldScreen, /worldScreenMapLayer/);
  assert.match(worldScreen, /<CityMapHub/);
  assert.match(worldScreen, /<WorldOverlayInspector/);
  assert.match(worldScreen, /<InspectorDrawer/);
});

test('WR-01 map hotspots keep guidance in metadata and expose only compact role/output chips on-map', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');
  assert.doesNotMatch(cityMapHub, /HotspotLabelGuidance/);
  assert.doesNotMatch(cityMapHub, /Outputs:/);
  assert.doesNotMatch(cityMapHub, /guidanceLine/);
  assert.doesNotMatch(cityMapHub, /sublabel=/);
  assert.match(cityMapHub, /cityMapHubHotspotRole/);
  assert.match(cityMapHub, /cityMapHubHotspotOutputs/);
  assert.match(cityMapHub, /data-cue-kind=\{cueKind \?\? undefined\}/);
});

test('WR-01 preserves module routing as a subordinate non-owner overlay surface', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /buildWorldModuleRoutingSurface\(\{/);
  assert.match(worldScreen, /worldCommandSurface\.groups/);
  assert.match(worldScreen, /openWorldModule\(\{ cityId: selectedCity\.id, moduleKey, source: 'world-map' \}\)/);
});
