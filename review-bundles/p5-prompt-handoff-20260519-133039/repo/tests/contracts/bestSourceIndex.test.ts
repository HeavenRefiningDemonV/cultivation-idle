import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildBestSourceIndex } from '../../src/systems/economy/bestSourceIndex.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('best-source index covers the live-critical semester scope with a primary source for every target', async () => {
  const validated = await getValidated();
  const index = buildBestSourceIndex(validated);

  assert.ok(index.scopeTargetIds.length > 0);
  index.entries.forEach((entry) => {
    assert.ok(entry.primarySource, `${entry.targetId} must have a primary source`);
    assert.ok(entry.sourceOptions.length >= 1, `${entry.targetId} must expose source options`);
  });
});

test('common, targeted, support, and build-correction truths are preserved in the best-source index', async () => {
  const validated = await getValidated();
  const index = buildBestSourceIndex(validated);

  assert.equal(index.entriesByTargetId.mat_common_herb_bundle.primarySource?.sourceKind, 'outskirts');
  assert.equal(index.entriesByTargetId.mat_common_herb_bundle.secondarySource?.sourceKind, 'expeditions');

  assert.equal(index.entriesByTargetId.mat_spirit_leaf.primarySource?.sourceKind, 'ruins');
  assert.equal(index.entriesByTargetId.mat_spirit_leaf.secondarySource?.sourceKind, 'expeditions');

  assert.equal(index.entriesByTargetId.merit.primarySource?.sourceKind, 'bounties');
  assert.equal(index.entriesByTargetId.spiritStones.primarySource?.sourceKind, 'bounties');

  assert.equal(index.entriesByTargetId.mat_technique_fragment.primarySource?.sourceKind, 'expeditions');
  assert.equal(index.entriesByTargetId.mat_technique_fragment.secondarySource?.sourceKind, 'manual_pavilion');
});
