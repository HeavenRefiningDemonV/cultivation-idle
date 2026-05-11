import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildGeneratedPavilionRecords } from '../../src/features/pavilion/buildGeneratedPavilionRecords.js';
import { buildPavilionSurface } from '../../src/features/pavilion/buildPavilionSurface.js';
import { validatePavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';
import { createPavilionGeneratedContentFixture, loadPavilionManifestFixture } from './pavilionTestFixtures.js';

test('live surface exposes selected-category record navigation, not a category-only shelf', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const generated = buildGeneratedPavilionRecords({ content: createPavilionGeneratedContentFixture() });
  const surface = buildPavilionSurface({
    mode: 'live',
    manifest,
    generatedRecords: generated.records,
    generatedCounts: generated.generatedCounts,
    generatedUnresolvedLinks: generated.unresolvedLinks,
    pavilionState: {
      selectedCategoryId: 'items',
      selectedEntryId: 'item.healing_pill_minor',
    },
    nowMs: 123,
  });

  assert.equal(surface.meta.selectedCategoryId, 'items');
  assert.equal(surface.selectedEntry.id, 'item.healing_pill_minor');
  assert.equal(surface.recordList.mode, 'category');
  assert.ok(surface.recordList.records.length >= 3);
  assert.ok(surface.recordList.records.some((record) => record.id === 'item.healing_pill_minor'));
  assert.ok(surface.recordList.records.some((record) => record.generated));
});

test('live search result list reaches generated records across categories', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const generated = buildGeneratedPavilionRecords({ content: createPavilionGeneratedContentFixture() });
  const surface = buildPavilionSurface({
    mode: 'live',
    manifest,
    generatedRecords: generated.records,
    generatedCounts: generated.generatedCounts,
    generatedUnresolvedLinks: generated.unresolvedLinks,
    pavilionState: {
      searchQuery: 'healing_pill_minor',
    },
    nowMs: 123,
  });

  assert.equal(surface.recordList.mode, 'search');
  assert.ok(surface.recordList.records.some((record) => record.id === 'item.healing_pill_minor'));
  assert.ok(surface.recordList.title.includes('Search'));
});

test('non-Foundation authored entries render adaptive full anatomy sections', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const target = manifest.entries.find((entry) => (
    entry.id !== 'gate_trials_and_thresholds.foundation_gate' &&
    Boolean(entry.sect) &&
    Boolean(entry.why) &&
    Boolean(entry.how) &&
    Boolean(entry.used) &&
    (entry.mistakes?.length ?? 0) > 0
  ));
  assert.ok(target, 'fixture manifest should contain a content-rich authored entry');

  const surface = buildPavilionSurface({
    mode: 'live',
    manifest,
    pavilionState: { selectedEntryId: target.id },
    nowMs: 123,
  });
  const sectionTitles = surface.selectedEntry.sections.map((section) => section.title);

  assert.equal(surface.selectedEntry.id, target.id);
  assert.ok(sectionTitles.includes('Jade Slip'));
  assert.ok(sectionTitles.includes('Sect Note'));
  assert.ok(sectionTitles.includes('Plain Meaning'));
  assert.ok(sectionTitles.includes('Why It Matters'));
  assert.ok(sectionTitles.includes('How to Get / Where to Act'));
  assert.ok(sectionTitles.includes('Used For'));
  assert.ok(sectionTitles.includes('Common Mistakes'));
  assert.ok(sectionTitles.includes('Route Buttons'));
  assert.ok(sectionTitles.includes('Related Records'));
});

test('generated records render source/use/current relevance sections in the central scroll', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const generated = buildGeneratedPavilionRecords({ content: createPavilionGeneratedContentFixture() });
  const surface = buildPavilionSurface({
    mode: 'live',
    manifest,
    generatedRecords: generated.records,
    generatedCounts: generated.generatedCounts,
    generatedUnresolvedLinks: generated.unresolvedLinks,
    pavilionState: { selectedEntryId: 'item.healing_pill_minor' },
    nowMs: 123,
  });
  const sectionTitles = surface.selectedEntry.sections.map((section) => section.title);

  assert.equal(surface.selectedEntry.id, 'item.healing_pill_minor');
  assert.ok(sectionTitles.includes('Current Relevance'));
  assert.ok(sectionTitles.includes('How to Get / Where to Act'));
  assert.ok(sectionTitles.includes('Used For'));
  assert.ok(sectionTitles.includes('Best Source'));
  assert.ok(sectionTitles.includes('Route Buttons'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Best Source'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Used For'));
});

test('PavilionExactScreen renders a record navigation list from surface.recordList', () => {
  const source = fs.readFileSync('src/features/pavilion/PavilionExactScreen.tsx', 'utf8');
  assert.match(source, /surface\.recordList\.records/);
  assert.match(source, /pavilionExact__recordList/);
});
