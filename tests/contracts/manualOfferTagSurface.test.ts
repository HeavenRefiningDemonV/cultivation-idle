import assert from 'node:assert/strict';
import test from 'node:test';

import { buildManualOfferTags } from '../../src/systems/manuals/manualOfferAnalysis.js';

test('manual offer tag surface prioritizes canonical build-aware tags', () => {
  const tags = buildManualOfferTags({
    analysis: {
      techniqueId: 'x',
      pathAligned: true,
      supportOffer: true,
      fillsCurrentGap: true,
      improvesCurrentMilestone: true,
      isDuplicate: true,
      fragmentProgressValue: 0.6,
    },
    isNewTechnique: false,
    includeMilestoneValue: true,
    maxTags: 3,
  });

  assert.deepEqual(tags, ['Build Fix', 'Path-Aligned', 'Support']);
});

test('manual offer tag surface supports new/duplicate/fragment-progress states', () => {
  const newTags = buildManualOfferTags({
    analysis: {
      techniqueId: 'n',
      pathAligned: false,
      supportOffer: false,
      fillsCurrentGap: false,
      improvesCurrentMilestone: true,
      isDuplicate: false,
      fragmentProgressValue: 0,
    },
    isNewTechnique: true,
    maxTags: 3,
  });
  assert.deepEqual(newTags, ['New']);

  const duplicateTags = buildManualOfferTags({
    analysis: {
      techniqueId: 'd',
      pathAligned: false,
      supportOffer: false,
      fillsCurrentGap: false,
      improvesCurrentMilestone: false,
      isDuplicate: true,
      fragmentProgressValue: 0.4,
    },
    isNewTechnique: false,
    maxTags: 3,
  });
  assert.deepEqual(duplicateTags, ['Duplicate', 'Fragment Progress']);
});
