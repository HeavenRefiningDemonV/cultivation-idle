import assert from 'node:assert/strict';
import test from 'node:test';

import { PATH_DOCTRINE_PRESENTATION_BY_ID } from '../../src/systems/doctrine/pathDoctrinePresentation.js';

test('path doctrine presentation contains all three paths', () => {
  assert.deepEqual(Object.keys(PATH_DOCTRINE_PRESENTATION_BY_ID).sort(), ['earth', 'heaven', 'martial']);
});

test('path doctrine presentation includes non-empty role lines and summaries', () => {
  for (const presentation of Object.values(PATH_DOCTRINE_PRESENTATION_BY_ID)) {
    assert.ok(presentation.practicalRoleLine.trim().length > 0);
    assert.ok(presentation.doctrineSubtitle.trim().length > 0);
    assert.ok(presentation.summary.trim().length > 0);
    assert.ok((presentation.objectiveLine ?? '').trim().length > 0);
    assert.ok((presentation.cautionLine ?? '').trim().length > 0);
  }
});

test('path doctrine presentation stat highlights and tags stay within capped counts', () => {
  for (const presentation of Object.values(PATH_DOCTRINE_PRESENTATION_BY_ID)) {
    assert.ok(presentation.statHighlights.length <= 2);
    assert.ok(presentation.tags.length <= 3);
  }
});
