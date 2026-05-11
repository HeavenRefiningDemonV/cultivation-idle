import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGeneratedPavilionRecords } from '../../src/features/pavilion/buildGeneratedPavilionRecords.js';
import { searchPavilionRecords } from '../../src/features/pavilion/pavilionSearch.js';
import { normalizePavilionManifestEntries, validatePavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';
import { createPavilionGeneratedContentFixture, loadPavilionManifestFixture } from './pavilionTestFixtures.js';

test('search finds Foundation Gate by exact title, source, used-for, and filters', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const authored = normalizePavilionManifestEntries(manifest);
  const generated = buildGeneratedPavilionRecords({ content: createPavilionGeneratedContentFixture() }).records;
  const records = [...authored, ...generated];

  assert.equal(searchPavilionRecords({ records, query: 'Foundation Gate', filters: [] }).results[0]?.id, 'gate_trials_and_thresholds.foundation_gate');
  assert.ok(searchPavilionRecords({ records, query: 'Apothecary', filters: [] }).results.some((entry) => entry.id.includes('healing_pill_minor')));
  assert.ok(searchPavilionRecords({ records, query: 'Foundation Breakthrough', filters: [] }).results.some((entry) => entry.id === 'gate_trials_and_thresholds.foundation_gate'));
  assert.ok(searchPavilionRecords({ records, query: '', filters: ['Path: Heaven'] }).results.every((entry) => entry.searchText.includes('path heaven') || entry.searchText.includes('heaven')));
  assert.ok(searchPavilionRecords({ records, query: '', filters: ['Sealed'] }).results.some((entry) => entry.state === 'sealed'));

  const ranked = searchPavilionRecords({
    records,
    query: 'Gate',
    filters: [],
    recommendedEntryIds: ['gate_trials_and_thresholds.foundation_gate'],
  }).results;
  assert.equal(ranked[0]?.id, 'gate_trials_and_thresholds.foundation_gate');
});
