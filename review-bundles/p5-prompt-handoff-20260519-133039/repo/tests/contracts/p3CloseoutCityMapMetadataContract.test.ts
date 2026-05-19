import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('CityMapHub renders module role metadata on map hotspots', () => {
  const source = read('src/components/screens/CityMapHub.tsx');
  const styles = read('src/components/screens/CityMapHub.scss');

  assert.match(source, /moduleMetadataByKey/u);
  assert.match(source, /const metadata = moduleMetadataByKey\?\.?\[moduleKey\]/u);
  assert.match(source, /cityMapHubHotspotRole/u);
  assert.match(source, /cityMapHubHotspotOutputs/u);
  assert.match(source, /aria-label=\{`Open \$\{getModuleLabel\(moduleKey\)\}: \$\{metadata\?\.roleTag/u);
  assert.match(styles, /\.cityMapHubHotspotRole/u);
  assert.match(styles, /\.cityMapHubHotspotOutputs/u);
});
