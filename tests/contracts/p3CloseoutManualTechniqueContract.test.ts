import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('Manual Pavilion offer tags subscribe to technique collection state instead of getState-only reads', () => {
  const source = read('src/components/screens/ManualPavilionPanel.tsx');

  assert.match(source, /const unlockedTechs = useTechCollectionStore/u);
  assert.match(source, /const techniqueFragments = useTechCollectionStore/u);
  assert.doesNotMatch(source, /const isNewTechnique = !useTechCollectionStore\.getState\(\)\.hasTech/u);
});

test('Techniques slot path fit compares equipped technique alignment to selected path', () => {
  const source = read('src/features/techniquesExact/buildTechniquesExactSurface.ts');
  const makeSlotBlock = source.slice(source.indexOf('const makeSlot'), source.indexOf('const countEquipped'));

  assert.match(makeSlotBlock, /selectedPath/u);
  assert.doesNotMatch(makeSlotBlock, /getTechniqueTaxonomyProfile\(args\.techniqueId\)\?\.alignment \?\? 'unknown'/u);
  assert.match(makeSlotBlock, /resolveTechniquePathFit/u);
});
