import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentLifeSummarySurface,
  buildLastCompletedLifeSummarySurface,
  buildPrestigeLifeSummarySnapshot,
} from '../../src/features/prestige/lifeSummarySurface.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';

const REQUIRED_TITLES = [
  'Life Arc',
  'Breakthrough Echoes',
  'Doctrine & Build',
  'World Progress',
  'Gate Trials',
  'Mandate Memory',
  'Ruins & Supply',
  'Economy Support',
  'Offline & Background',
  'Next Life Focus',
];

test.beforeEach(() => {
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  useInventoryStore.getState().hardResetInventory();
  useCityStore.getState().hardResetCity();
  useTrialStore.getState().hardResetTrials();
  useRuinsStore.getState().hardResetRuins();
  setGameStoreGetter(() => useGameStore.getState());
});

test('life summary surface always returns the locked V2 memory block structure', () => {
  const summary = buildCurrentLifeSummarySurface();
  assert.equal(summary.version, 2);
  assert.equal(summary.blocks.length, REQUIRED_TITLES.length);
  assert.deepEqual(summary.blocks.map((block) => block.title), REQUIRED_TITLES);
  for (const block of summary.blocks) {
    assert.ok(block.lines.length >= 1);
    assert.ok(block.lines.length <= 5);
    assert.equal(new Set(block.lines).size, block.lines.length);
  }
  assert.ok(summary.blocks.some((block) => block.title === 'Breakthrough Echoes'));
  assert.ok(summary.blocks.some((block) => block.title === 'Economy Support'));
  assert.ok(summary.blocks.some((block) => block.title === 'Offline & Background'));
  assert.ok(summary.majorMemories.length >= 1);
  assert.ok(summary.majorMemories.length <= 6);
  assert.ok(summary.majorMemories.every((memory) => memory.summaryEligible));
});

test('life summary avoids fake lifetime-earned currency totals', () => {
  const snapshot = buildPrestigeLifeSummarySnapshot();
  const text = snapshot.blocks.flatMap((block) => block.lines).join(' ').toLowerCase();
  assert.equal(text.includes('lifetime gold earned'), false);
  assert.equal(text.includes('lifetime merit earned'), false);
  assert.equal(text.includes('lifetime spirit stone earned'), false);
});

test('last-completed summary renders from normalized stored snapshot', () => {
  useInventoryStore.setState((state) => ({
    ...state,
    currencies: { ...state.currencies, gold: '456' },
  }));
  const snapshot = buildPrestigeLifeSummarySnapshot();
  const lastCompleted = buildLastCompletedLifeSummarySurface(snapshot);

  assert.equal(lastCompleted.mode, 'last_completed');
  assert.equal(lastCompleted.version, 2);
  assert.equal(lastCompleted.blocks.length, REQUIRED_TITLES.length);
  assert.deepEqual(lastCompleted.blocks.map((block) => block.title), REQUIRED_TITLES);
  assert.ok(lastCompleted.majorMemories.length >= 1);
  assert.ok(lastCompleted.majorMemories.length <= 6);
  assert.equal(lastCompleted.blocks.some((block) => block.lines.some((line) => line.includes('456'))), true);
});
