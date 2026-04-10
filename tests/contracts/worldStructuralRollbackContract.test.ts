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
  assert.match(worldScreen, /worldScreenHubPanel/);
  assert.match(worldScreen, /<CityMapHub/);
  assert.match(worldScreen, /<InspectorPanel/);
});

test('WR-01 map hotspots are rollback-compact and do not render guidance or outputs on-map', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');
  assert.doesNotMatch(cityMapHub, /HotspotLabelGuidance/);
  assert.doesNotMatch(cityMapHub, /Outputs:/);
  assert.doesNotMatch(cityMapHub, /guidanceLine/);
  assert.doesNotMatch(cityMapHub, /outputsLine/);
  assert.doesNotMatch(cityMapHub, /sublabel=/);
  assert.match(cityMapHub, /stateSlot=\{chipLabel \?\? undefined\}/);
});

test('WR-01 preserves lower module routing as a subordinate non-owner support surface', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /worldScreenSupportSlot/);
  assert.match(worldScreen, /worldSupportRail/);
});
