import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('packet 4.11 buildAnalysisService consumes earlier packet surfaces instead of raw heuristics', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/systems/builds/buildAnalysisService.ts'), 'utf8');

  assert.equal(source.includes('buildDoctrineSnapshot'), true);
  assert.equal(source.includes('buildLoadoutSnapshot'), true);
  assert.equal(source.includes('getTechniqueTaxonomyProfile'), true);
  assert.equal(source.includes('getPathAlignmentStrengthForTechnique'), true);
  assert.equal(source.includes('getPathAlignmentScoreForTechnique'), true);
  assert.equal(source.includes('getTechniqueProgressionSnapshot'), true);
  assert.equal(source.includes('detectArchetypeFromCoverage'), true);

  assert.equal(source.includes('.tags?.'), false);
  assert.equal(source.includes('.tags ??'), false);
  assert.equal(source.includes('normalizeTechniqueEffects'), false);
  assert.equal(source.includes('classifyTechnique'), false);
  assert.equal(source.includes('applyAiProfileBias'), false);
});

test('packet 4.11 archetypeDetector is pure and registry-driven', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/systems/builds/archetypeDetector.ts'), 'utf8');

  assert.equal(source.includes('getBuildArchetypesForPath'), true);
  assert.equal(source.includes('BUILD_ARCHETYPE_ORDER'), true);
  assert.equal(source.includes('useGameStore'), false);
  assert.equal(source.includes('useTechniqueStore'), false);
  assert.equal(source.includes('useTechCollectionStore'), false);
  assert.equal(source.includes('zustand'), false);
});

test('packet 4.11 buildAnalysisTypes keeps the locked gap vocabulary', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/systems/builds/buildAnalysisTypes.ts'), 'utf8');

  [
    'empty_slot',
    'low_alignment',
    'missing_survival_tool',
    'missing_setup_tool',
    'low_mastery',
    'low_rank',
    'rune_gap',
  ].forEach((term) => {
    assert.equal(source.includes(term), true);
  });
});
