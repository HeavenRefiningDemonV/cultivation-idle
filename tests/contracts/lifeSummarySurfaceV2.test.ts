import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLastCompletedLifeSummarySurface,
  buildCurrentLifeSummarySurface,
  buildPrestigeLifeSummarySnapshot,
} from '../../src/features/prestige/lifeSummarySurface.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

test.beforeEach(() => {
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  useInventoryStore.getState().hardResetInventory();
  useUIStore.getState().hardResetUI();
  setGameStoreGetter(() => useGameStore.getState());
});

test('life summary v2 includes concrete meta, expanded support blocks, and next-life focus', () => {
  usePrestigeStore.setState({
    totalAP: 20,
    highestRealmReached: 2,
    runStartTime: Date.now() - 75 * 60 * 1000,
  });
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'earth',
    realm: { ...state.realm, index: 2, substage: 4 },
  }));
  useInventoryStore.setState((state) => ({
    ...state,
    currencies: { ...state.currencies, gold: '321' },
  }));

  const surface = buildCurrentLifeSummarySurface();

  assert.equal(surface.version, 2);
  assert.equal(surface.mode, 'current');
  assert.equal(surface.lifeOrdinal, 1);
  assert.equal(surface.headline.length > 0, true);
  assert.ok(surface.blocks.some((block) => block.key === 'economy_support'));
  assert.ok(surface.blocks.some((block) => block.key === 'offline_background'));
  assert.ok(surface.nextLifeFocus.detail.length > 0);
  assert.equal(
    surface.blocks.flatMap((block) => block.lines).some((line) => line.includes('321')),
    true,
  );
});

test('prestige life summary snapshot preserves v2 fields for post-reset archive display', () => {
  usePrestigeStore.setState({ totalAP: 5, highestRealmReached: 2 });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 2, substage: 2 } }));

  const snapshot = buildPrestigeLifeSummarySnapshot();

  assert.equal(snapshot.version, 2);
  assert.equal(snapshot.summarySeal.length > 0, true);
  assert.ok(snapshot.majorMemories.length > 0);
  assert.ok(snapshot.nextLifeFocus);
  assert.ok(snapshot.blocks.some((block) => block.key === 'next_life_focus'));
});

test('last-completed life summary removes duplicate lines from archived blocks', () => {
  usePrestigeStore.setState({ totalAP: 5, highestRealmReached: 2 });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 2, substage: 2 } }));

  const snapshot = buildPrestigeLifeSummarySnapshot();
  const gateBlock = snapshot.blocks.find((block) => block.key === 'gate_trials');
  assert.ok(gateBlock);
  gateBlock.lines.push('Total gate attempts: 0');

  const surface = buildLastCompletedLifeSummarySurface(snapshot);
  const archivedGateBlock = surface.blocks.find((block) => block.key === 'gate_trials');
  assert.ok(archivedGateBlock);

  const attemptsLines = archivedGateBlock.lines.filter((line) => line === 'Total gate attempts: 0');
  assert.equal(attemptsLines.length, 1);
});
