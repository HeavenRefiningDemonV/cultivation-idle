import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGeneratedPavilionRecords } from '../../src/features/pavilion/buildGeneratedPavilionRecords.js';
import { normalizePavilionManifestEntries, validatePavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';
import { createPavilionGeneratedContentFixture, loadPavilionManifestFixture } from './pavilionTestFixtures.js';

test('generated records cover core live content families without colliding with authored IDs', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const authoredIds = new Set(normalizePavilionManifestEntries(manifest).map((record) => record.id));
  const generated = buildGeneratedPavilionRecords({ content: createPavilionGeneratedContentFixture() });
  const ids = new Set(generated.records.map((record) => record.id));

  assert.ok(generated.generatedCounts.items >= 3);
  assert.ok(generated.generatedCounts.trials >= 1);
  assert.ok(generated.generatedCounts.cities >= 1);
  assert.ok(generated.generatedCounts.techniques >= 1);
  assert.ok(generated.generatedCounts.heart_laws >= 1);
  assert.ok(generated.generatedCounts.prestige >= 1);
  assert.ok(generated.records.some((record) => record.id.startsWith('recipe.alchemy.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('recipe.forge.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('rune.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('talisman.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('bounty.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('expedition.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('manualPool.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('apothecary.')));
  assert.ok(generated.records.some((record) => record.id.startsWith('outskirts.')));

  for (const id of ids) {
    assert.equal(authoredIds.has(id), false, `generated id collided with authored id: ${id}`);
  }
  assert.ok(generated.unresolvedLinks.some((link) => link.includes('mat_missing_archive')));
});
