import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-03 world map labels keep compact payload and no explanatory text blocks', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');

  assert.doesNotMatch(cityMapHub, /guidanceLine/);
  assert.doesNotMatch(cityMapHub, /outputsLine/);
  assert.doesNotMatch(cityMapHub, /moduleMetadata\?\.bestUsedWhen/);
  assert.doesNotMatch(cityMapHub, /moduleMetadata\?\.outputs/);
  assert.doesNotMatch(cityMapHub, /sublabel=/);
  assert.match(cityMapHub, /cityMapHubHotspotLabelName/);
  assert.match(cityMapHub, /stateSlot=\{chipLabel \?\? undefined\}/);
  assert.match(cityMapHub, /reserveStateSlot=\{CITY_MAP_HUB_SCENIC_LABEL_RESERVE_STATE_SLOT\}/);
});

test('WR-03 map chip vocabulary is abbreviated for plaque-sized state slots', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');
  assert.match(cityMapHub, /recommended_now: 'NOW'/);
  assert.match(cityMapHub, /claim_ready: 'CLAIM'/);
  assert.match(cityMapHub, /idle_slot: 'IDLE'/);
});
