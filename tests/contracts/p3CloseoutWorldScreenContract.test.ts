import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WorldScreen keeps loaded-state hooks behind a child component guard', () => {
  const source = read('src/components/screens/WorldScreen.tsx');
  const wrapper = source.slice(
    source.indexOf('export function WorldScreen'),
    source.indexOf('interface LoadedWorldScreenProps'),
  );
  const loadingReturnIndex = wrapper.indexOf('if (isLoading)');

  assert.notEqual(loadingReturnIndex, -1, 'WorldScreen should retain explicit loading guard');
  assert.doesNotMatch(
    wrapper.slice(loadingReturnIndex),
    /\buse(?:Memo|Effect|Callback|Ref|State)\s*\(/u,
    'WorldScreen must not call hooks after the loading/error/unloaded early returns',
  );
  assert.match(source, /function LoadedWorldScreen/u);
});

test('WorldScreen computes the live economy recommendation snapshot once per render path', () => {
  const source = read('src/components/screens/WorldScreen.tsx');
  const matches = source.match(/buildLiveEconomicRecommendationEngine\(\)/gu) ?? [];

  assert.equal(matches.length, 1, 'WorldScreen should build one economy snapshot and reuse it');
  assert.match(source, /economicPrimaryProblemKind/u);
});

test('WorldScreen considers independent world-module route signals instead of a primary-target gate', () => {
  const source = read('src/components/screens/WorldScreen.tsx');
  const block = source.slice(source.indexOf('return buildWorldModuleRoutingSurface({'), source.indexOf('const cityPhaseSurface'));

  assert.doesNotMatch(block, /const secondary = primaryTarget\?\.kind === 'world_module'\s*\?/u);
  assert.match(block, /economicModuleKeys/u);
  assert.match(block, /trackedBountyModuleKey/u);
  assert.match(block, /expeditionIdleAlert/u);
});
