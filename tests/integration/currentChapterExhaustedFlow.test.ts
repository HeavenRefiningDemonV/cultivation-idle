import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { useUIStore } from '../../src/stores/uiStore.js';

test.beforeEach(() => {
  useUIStore.getState().hardResetUI();
});

test('ui store supports once-per-life acknowledgement flow for current chapter exhausted modal', () => {
  const ui = useUIStore.getState();

  ui.openCurrentChapterExhaustedModal();
  assert.equal(useUIStore.getState().showCurrentChapterExhaustedModal, true);
  assert.equal(useUIStore.getState().currentChapterExhaustedAcknowledgedThisLife, false);

  ui.acknowledgeCurrentChapterExhausted();
  ui.closeCurrentChapterExhaustedModal();
  assert.equal(useUIStore.getState().showCurrentChapterExhaustedModal, false);
  assert.equal(useUIStore.getState().currentChapterExhaustedAcknowledgedThisLife, true);

  ui.clearCurrentChapterExhaustedAcknowledgement();
  assert.equal(useUIStore.getState().currentChapterExhaustedAcknowledgedThisLife, false);
  assert.equal(useUIStore.getState().showCurrentChapterExhaustedModal, false);
});

test('current chapter exhausted modal copy is explicit about authored cap and avoids fake next content', () => {
  return fs.readFile(path.join(process.cwd(), 'src/components/modals/CurrentChapterExhaustedModal.tsx'), 'utf8').then((source) => {
    assert.equal(source.includes('Current Chapter Exhausted'), true);
    assert.equal(source.includes('Spirit Severing'), true);
    assert.equal(source.includes('no live city 6, post-Severing gate chain'), true);
    assert.equal(source.includes('coming soon'), false);
  });
});
