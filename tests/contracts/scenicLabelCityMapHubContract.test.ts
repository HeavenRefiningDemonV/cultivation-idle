import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ScenicLabel exposes canonical frozen option registries', () => {
  const file = read('src/ui/shell/ScenicLabel.tsx');

  assert.match(file, /SCENIC_LABEL_VARIANT_OPTIONS = \['building', 'location'\] as const/);
  assert.match(file, /SCENIC_LABEL_STATE_OPTIONS = \['default', 'active', 'recommended', 'locked'\] as const/);
  assert.match(file, /SCENIC_LABEL_EMPHASIS_OPTIONS = \['quiet', 'medium'\] as const/);
});

test('ui/shell barrel re-exports ScenicLabel option registries', () => {
  const file = read('src/ui/shell/index.ts');

  assert.match(file, /SCENIC_LABEL_VARIANT_OPTIONS/);
  assert.match(file, /SCENIC_LABEL_STATE_OPTIONS/);
  assert.match(file, /SCENIC_LABEL_EMPHASIS_OPTIONS/);
});

test('CityMapHub keeps ScenicLabel diegetic wiring frozen for world map hotspots', () => {
  const file = read('src/components/screens/CityMapHub.tsx');

  assert.match(file, /CITY_MAP_HUB_SCENIC_LABEL_VARIANT = 'building' as const/);
  assert.match(file, /CITY_MAP_HUB_SCENIC_LABEL_RESERVE_STATE_SLOT = true/);
  assert.match(file, /variant=\{CITY_MAP_HUB_SCENIC_LABEL_VARIANT\}/);
  assert.match(file, /reserveStateSlot=\{CITY_MAP_HUB_SCENIC_LABEL_RESERVE_STATE_SLOT\}/);
});
