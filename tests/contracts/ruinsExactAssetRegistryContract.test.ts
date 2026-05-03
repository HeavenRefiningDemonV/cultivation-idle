import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUINS_EXACT_ASSETS, RUINS_EXACT_DEFERRED_ICON_ROLES } from '../../src/features/world/ruinsExact/ruinsExactAssetRegistry.js';

const flattenAssetPaths = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap((entry) => flattenAssetPaths(entry));
  return [];
};

void test('ruins exact icon registry shape is stable for tactical/kit/targeted/summary roles', () => {
  assert.deepEqual(Object.keys(RUINS_EXACT_ASSETS.icons.tactical), ['hp', 'depth', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition']);
  assert.deepEqual(Object.keys(RUINS_EXACT_ASSETS.icons.kit), ['loadoutSet', 'aiProfile', 'explorationFocus', 'hp', 'eva', 'res', 'medicinePouch', 'weapon', 'manual', 'ring', 'boots', 'charm', 'talisman']);
  assert.deepEqual(Object.keys(RUINS_EXACT_ASSETS.icons.targetedMaterials), ['spiritLeaf', 'beastMaterials', 'coreFragmentAnchor', 'anchorChest', 'genericMaterial']);
  assert.deepEqual(Object.keys(RUINS_EXACT_ASSETS.icons.summary), ['rooms', 'anchorChest', 'pitySeal', 'spiritLeaf']);
});

void test('known-bad ruins exact icon mappings are replaced or explicitly deferred', () => {
  assert.equal(RUINS_EXACT_ASSETS.icons.tactical.healing.includes('hourglass_progress.png'), false);
  assert.equal(RUINS_EXACT_ASSETS.icons.tactical.expedition.includes('task_complete.png'), false);
  assert.equal(RUINS_EXACT_ASSETS.icons.kit.medicinePouch.includes('hourglass'), false);
  assert.equal(RUINS_EXACT_ASSETS.icons.kit.boots.includes('task_complete.png'), false);
  assert.equal(RUINS_EXACT_ASSETS.icons.kit.talisman.includes('metalchunk.png'), false);

  const beastMaterialsFallback = RUINS_EXACT_ASSETS.icons.targetedMaterials.beastMaterials;
  const beastMaterialsDeferred = RUINS_EXACT_DEFERRED_ICON_ROLES.targetedMaterials.beastMaterials;
  assert.equal(
    beastMaterialsFallback.includes('beastblood.png')
      ? Boolean(beastMaterialsDeferred.desiredRole && beastMaterialsDeferred.reason)
      : true,
    true,
  );

  const anchorChestDeferred = RUINS_EXACT_DEFERRED_ICON_ROLES.targetedMaterials.anchorChest;
  assert.equal(Boolean(anchorChestDeferred.desiredRole && anchorChestDeferred.reason), true);
});

void test('all ruins exact asset registry paths are source-safe and resolvable', () => {
  const allPaths = flattenAssetPaths(RUINS_EXACT_ASSETS);
  assert.equal(allPaths.length > 0, true);

  for (const path of allPaths) {
    assert.equal(path.startsWith('/src/assets/'), true);
    assert.equal(path.startsWith('/dist/'), false);
    assert.equal(path.includes('InsideDungeon'), false);
    assert.equal(path.includes('city_ruins'), false);
    assert.equal(path.includes('background/citystates'), false);

    const diskPath = join(process.cwd(), path.slice(1));
    assert.equal(existsSync(diskPath), true, `missing asset path: ${path}`);
  }
});

void test('ruins exact screen keeps exact route and excludes legacy combat-path components', () => {
  const screenSource = readFileSync(new URL('../../src/features/world/ruinsExact/RuinsExactMockupScreen.ts', import.meta.url), 'utf8');
  for (const forbidden of ['RuinsProgress', 'RuinsSummaryCard', 'RuinsCtaZone']) {
    assert.equal(screenSource.includes(forbidden), false);
  }
});
