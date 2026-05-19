import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentLifeSummarySurface,
  buildLastCompletedLifeSummarySurface,
  buildPrestigeLifeSummarySnapshot,
} from '../../src/features/prestige/lifeSummarySurface.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import {
  awardDaoImpression,
  clearDaoImpressions,
} from '../../src/systems/daoImpressions/index.js';

function resetLifeMemoryState() {
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  useInventoryStore.getState().hardResetInventory();
  useUIStore.getState().hardResetUI();
  clearDaoImpressions();
  setGameStoreGetter(() => useGameStore.getState());
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath',
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: ['heart_quiet_breath'],
  });
}

test.beforeEach(resetLifeMemoryState);
test.afterEach(resetLifeMemoryState);

test('memory-eligible dao impressions appear in current and archived Life Summary without minor spam', () => {
  awardDaoImpression({
    impressionId: 'first_boss_pattern',
    sourceKind: 'outskirts_first_boss',
    sourceEventKey: 'outskirts_first_boss:city_pinewind_hamlet:outskirts_pinewind:enemy_boss',
    createdAt: 100,
  });
  awardDaoImpression({
    impressionId: 'threshold_revelation',
    sourceKind: 'gate_clear',
    sourceEventKey: 'gate_clear:trial_novices_clearing:1',
    createdAt: 200,
  });

  const current = buildCurrentLifeSummarySurface();
  const currentText = JSON.stringify(current.blocks);
  assert.match(currentText, /Threshold Revelation/i);
  assert.doesNotMatch(currentText, /First Boss Pattern/i);
  assert.ok(current.majorMemories.some((memory) => memory.source === 'dao_impression'));

  const snapshot = buildPrestigeLifeSummarySnapshot();
  clearDaoImpressions();
  const archived = buildLastCompletedLifeSummarySurface(snapshot);

  assert.match(JSON.stringify(archived.blocks), /Threshold Revelation/i);
  assert.ok(archived.majorMemories.some((memory) => memory.source === 'dao_impression'));
});

