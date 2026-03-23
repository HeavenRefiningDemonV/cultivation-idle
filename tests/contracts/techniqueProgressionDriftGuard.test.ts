import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';

const read = (path: string) => fs.readFile(new URL(path, new URL(`file://${process.cwd()}/`)), 'utf8');

test('packet 4.8 techCollectionStore now depends on the contract instead of local structural truth', async () => {
  const source = await read('src/stores/techCollectionStore.ts');
  assert.match(source, /getTechniqueProgressionSnapshot/);
  assert.match(source, /buildTechniqueProgressionSnapshot/);
  assert.doesNotMatch(source, /DEFAULT_GRADE_RULES/);
  assert.doesNotMatch(source, /DEFAULT_RARITY_TRAIT_SLOTS/);
  assert.doesNotMatch(source, /DEFAULT_RANK_MULTIPLIER_PER_RANK/);
  assert.doesNotMatch(source, /DEFAULT_EFFECT_MULTIPLIER_PER_LEVEL/);
  assert.doesNotMatch(source, /DEFAULT_MASTERY_MILESTONES/);
});

test('packet 4.8 combatStore no longer reads raw Heaven mastery-75 potency from content', async () => {
  const source = await read('src/stores/combatStore.ts');
  assert.match(source, /getTechniqueProgressionSnapshot/);
  assert.doesNotMatch(source, /manualSystem\.grades\.heaven\.mastery75PotencyBonus/);
});

test('packet 4.8 TechniqueDetailModal no longer reads raw Heaven mastery-75 potency from content', async () => {
  const source = await read('src/components/modals/TechniqueDetailModal.tsx');
  assert.match(source, /getTechniqueProgressionSnapshot/);
  assert.doesNotMatch(source, /state\.raw\?\.economy\?\.manualSystem\?\.grades\?\.heaven\?\.mastery75PotencyBonus/);
});
