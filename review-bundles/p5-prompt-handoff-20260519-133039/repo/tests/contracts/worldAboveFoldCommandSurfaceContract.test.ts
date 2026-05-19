import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('World keeps TopRibbon and mounts full RunCompass in main flow command band', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /<TopRibbon/);
  assert.match(file, /worldScreenCommandBand/);
  assert.match(file, /<RunCompass surface=\{runCompass\.full\}/);
  assert.match(file, /aria-label="World command band"/);
});

test('World above-the-fold command truth does not depend on the narrow inspector drawer', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const commandBandIndex = file.indexOf('worldScreenCommandBand');
  const drawerIndex = file.indexOf('<InspectorDrawer');
  assert.ok(commandBandIndex >= 0, 'worldScreenCommandBand should exist');
  assert.ok(drawerIndex >= 0, 'InspectorDrawer should exist');
  assert.ok(commandBandIndex < drawerIndex, 'command band should be mounted before the drawer fallback');
});
