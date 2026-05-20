import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-03 world map hotspots carry compact role/output metadata without long guidance blocks', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');

  assert.doesNotMatch(cityMapHub, /guidanceLine/);
  assert.doesNotMatch(cityMapHub, /sublabel=/);
  assert.match(cityMapHub, /moduleMetadataByKey\?:/);
  assert.match(cityMapHub, /metadata\?\.outputs\.slice\(0, 2\)\.join\(' \/ '\)/);
  assert.match(cityMapHub, /cityMapHubHotspotLabel/);
  assert.match(cityMapHub, /cityMapHubHotspotRole/);
  assert.match(cityMapHub, /cityMapHubHotspotOutputs/);
  assert.match(cityMapHub, /data-cue-kind=\{cueKind \?\? undefined\}/);
});

test('WR-03 map chip vocabulary is abbreviated for plaque-sized state slots', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');
  assert.match(cityMapHub, /WorldHotspotChipKind = 'NOW' \| 'SOON' \| 'CLAIM' \| 'IDLE' \| 'FIX' \| 'GATE' \| 'LOW'/);
  assert.doesNotMatch(cityMapHub, /recommended_now/);
  assert.doesNotMatch(cityMapHub, /claim_ready/);
  assert.doesNotMatch(cityMapHub, /idle_slot/);
});
