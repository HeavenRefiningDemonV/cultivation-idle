import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildPrestigeLifeSummarySnapshot } from '../../src/features/prestige/lifeSummarySurface.js';
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

test('prestige store keeps the prepared life summary snapshot captured before reset', () => {
  usePrestigeStore.setState({
    totalAP: 4,
    highestRealmReached: 2,
    runStartTime: Date.now() - 90 * 60 * 1000,
  });
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 2, substage: 3 },
  }));
  useInventoryStore.setState((state) => ({
    ...state,
    currencies: { ...state.currencies, gold: '111' },
  }));

  const prepared = buildPrestigeLifeSummarySnapshot();
  useInventoryStore.setState((state) => ({
    ...state,
    currencies: { ...state.currencies, gold: '999999' },
  }));

  usePrestigeStore.getState().performPrestige(prepared);
  const stored = usePrestigeStore.getState().lastLifeSummary;

  assert.ok(stored);
  const ruinsSupplyBlock = stored.blocks.find((block) => block.key === 'ruins_supply');
  assert.ok(ruinsSupplyBlock);
  assert.equal(ruinsSupplyBlock.lines.some((line) => line.includes('111')), true);
  assert.equal(ruinsSupplyBlock.lines.some((line) => line.includes('999999')), false);
});

test('ui store supports opening and closing current and last-completed life summary modes', () => {
  const ui = useUIStore.getState();
  ui.openLifeSummaryModal('current');
  assert.equal(useUIStore.getState().showLifeSummaryModal, true);
  assert.equal(useUIStore.getState().lifeSummaryMode, 'current');

  ui.openLifeSummaryModal('last_completed');
  assert.equal(useUIStore.getState().showLifeSummaryModal, true);
  assert.equal(useUIStore.getState().lifeSummaryMode, 'last_completed');

  ui.closeLifeSummaryModal();
  assert.equal(useUIStore.getState().showLifeSummaryModal, false);
});

test('current chapter exhausted and prestige entry points include life summary actions', async () => {
  const exhaustedSource = await fs.readFile(path.join(process.cwd(), 'src/components/modals/CurrentChapterExhaustedModal.tsx'), 'utf8');
  const prestigeSource = await fs.readFile(path.join(process.cwd(), 'src/components/screens/PrestigeScreen.tsx'), 'utf8');

  assert.equal(exhaustedSource.includes('View Life Summary'), true);
  assert.equal(exhaustedSource.includes("openLifeSummaryModal('current')"), true);
  assert.equal(prestigeSource.includes('View Current Life Summary'), true);
  assert.equal(prestigeSource.includes('View Last Life Summary'), true);
});
