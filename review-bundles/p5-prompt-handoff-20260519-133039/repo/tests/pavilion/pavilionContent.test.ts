import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';
import { loadPavilionManifestFixture } from './pavilionTestFixtures.js';

const REQUIRED_CATEGORIES = [
  'First Steps',
  'Current Life',
  'Cultivation',
  'Gate Trials',
  'Cities',
  'Activities',
  'Combat',
  'Manuals',
  'Crafting',
  'Items',
  'Bestiary',
  'Bounties',
  'Reincarnation',
  'Systems',
  'Xianxia Glossary',
];

const REQUIRED_FILTERS = [
  'Needed Now',
  'Needed Soon',
  'Recorded',
  'Studied',
  'Mastered',
  'Sealed',
  'Rumored',
  'Path: Heaven',
  'Path: Earth',
  'Path: Martial',
  'City',
  'Source',
  'Used For',
  'Rarity',
  'Activity',
  'Missing',
  'Safe to Sell',
  'Do Not Sell',
];

test('Pavilion manifest loads authored records, categories, filters, and Foundation Gate', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());

  assert.equal(manifest.entries.length, 302);
  assert.deepEqual(manifest.global_labels.navigation_tabs, REQUIRED_CATEGORIES);
  for (const filter of REQUIRED_FILTERS) {
    assert.ok(manifest.global_labels.filters.includes(filter), `missing filter ${filter}`);
  }
  assert.ok(manifest.entries.some((entry) => entry.id === 'gate_trials_and_thresholds.foundation_gate'));
  assert.ok(manifest.generated_record_families);
});
