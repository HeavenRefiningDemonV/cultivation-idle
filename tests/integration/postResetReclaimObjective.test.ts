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

test('performing prestige preserves last life summary and creates a dismissible reclaim objective', () => {
  usePrestigeStore.setState({
    totalAP: 40,
    purchasesById: { ap_idle_qi_mult: 1 },
    highestRealmReached: 2,
    runStartTime: Date.now() - 2 * 60 * 60 * 1000,
  });
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: { ...state.realm, index: 2, substage: 3 },
  }));

  const prepared = buildPrestigeLifeSummarySnapshot();
  usePrestigeStore.getState().performPrestige(prepared);

  const prestige = usePrestigeStore.getState();
  assert.ok(prestige.lastLifeSummary);
  assert.equal(prestige.lastLifeSummary?.version, 2);
  assert.ok(prestige.postResetReclaimObjective);
  assert.equal(prestige.postResetReclaimObjective?.dismissible, true);
  assert.equal(
    prestige.postResetReclaimObjective?.firstActions.some((action) => action.id === 'repeat_exact_path'),
    false,
  );

  const objectiveId = prestige.postResetReclaimObjective!.id;
  prestige.dismissPostResetReclaimObjective(objectiveId);
  assert.equal(usePrestigeStore.getState().postResetReclaimObjective, null);
});

test('prestige screen exposes the post-reset reclaim objective and visible dismiss action', async () => {
  const ownerSource = await fs.readFile(
    path.join(process.cwd(), 'src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx'),
    'utf8',
  );
  const screenSource = await fs.readFile(
    path.join(process.cwd(), 'src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx'),
    'utf8',
  );

  assert.match(ownerSource, /postResetReclaimObjective/);
  assert.match(ownerSource, /dismissPostResetReclaimObjective/);
  assert.match(screenSource, /prestigeLedgerReclaimBanner/);
  assert.match(screenSource, /Previous life sealed/);
  assert.match(screenSource, /Dismiss/);
});
