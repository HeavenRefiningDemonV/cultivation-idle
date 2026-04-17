import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

void test('outskirts exact prep resolves shell config while default outskirts remains unchanged', () => {
  const defaultOutskirts = resolveWorldModalEntrySurface({
    buildingKey: 'outskirts',
    cityName: 'Pinewind',
    intent: null,
    isStoreMode: true,
  });
  const prepOutskirts = resolveWorldModalEntrySurface({
    buildingKey: 'outskirts',
    cityName: 'Pinewind',
    intent: { outskirtsSurface: 'exact-mockup-prep' },
    isStoreMode: true,
  });

  assert.equal(defaultOutskirts.backgroundVariant, 'inside-dungeon');
  assert.equal(defaultOutskirts.showShellClose, false);
  assert.equal(defaultOutskirts.contentPaddingMode, 'default');

  assert.equal(prepOutskirts.backgroundVariant, 'outskirts-exact-prep');
  assert.equal(prepOutskirts.shellFamily, 'outskirts-exact');
  assert.equal(prepOutskirts.showContextStrip, false);
  assert.equal(prepOutskirts.showShellClose, true);
  assert.equal(prepOutskirts.contentPaddingMode, 'outskirts-exact');
});

void test('world building modal applies shell-mode classes and overlay close mode wiring', async () => {
  const modalSource = await readRepoFile('src/components/modals/WorldBuildingModal.tsx');
  const scssSource = await readRepoFile('src/components/modals/WorldBuildingModal.scss');

  assert.match(modalSource, /worldBuildingModal--content-\$\{entrySurface\.contentPaddingMode\}/);
  assert.match(modalSource, /worldBuildingBody--\$\{entrySurface\.contentPaddingMode\}/);
  assert.match(modalSource, /worldBuildingClose--overlay-corner/);

  assert.match(scssSource, /\.worldBuildingOverlay--outskirts-exact/);
  assert.match(scssSource, /\.worldBuildingModal--outskirts-exact-prep/);
  assert.match(scssSource, /\.worldBuildingBody--outskirts-exact/);
  assert.match(scssSource, /\.worldBuildingClose--overlay-corner/);
});
