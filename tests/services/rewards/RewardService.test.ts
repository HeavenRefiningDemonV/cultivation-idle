import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents, type GameEvent } from '../../../src/services/events/GameEvents.js';
import { RewardService } from '../../../src/services/rewards/RewardService.js';
import { buildRewardSummary } from '../../../src/services/rewards/rewardSummary.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useHeartLawStore } from '../../../src/stores/heartLawStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useManualSatchelStore } from '../../../src/stores/manualSatchelStore.js';
import { useTechCollectionStore } from '../../../src/stores/techCollectionStore.js';

function primeRewardContent() {
  useContentStore.setState((state) => ({
    ...state,
    maps: {
      ...state.maps,
      itemsById: {
        item_iron_ore: {
          id: 'item_iron_ore',
          name: 'Iron Ore',
          description: '',
          category: 'material',
          rarity: 'common',
          value: '1',
          stackable: true,
          maxStack: 999,
        } as never,
      },
      heartLawsById: {
        heartlaw_quiet_breath: {
          id: 'heartlaw_quiet_breath',
          name: 'Quiet Breath Method',
          tier: 'starter',
          isStarter: true,
        } as never,
      },
    },
  }));
}

function resetRewardStores() {
  useInventoryStore.getState().hardResetInventory();
  useTechCollectionStore.getState().hardReset();
  useManualSatchelStore.getState().hardReset();
  useHeartLawStore.setState({
    selectedHeartLawId: null,
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: [],
  });
  primeRewardContent();
}

test.beforeEach(() => {
  resetRewardStores();
});

test('grantRewards reports currencies, items, fragments, manuals, comprehension, and event summary truth', () => {
  useHeartLawStore.setState({
    selectedHeartLawId: 'heartlaw_quiet_breath',
    chapter: 1,
    comprehension: 0,
  });

  const grantedEvents: Array<Extract<GameEvent, { type: 'rewards/granted' }>> = [];
  const handler = (event: GameEvent) => {
    if (event.type === 'rewards/granted') {
      grantedEvents.push(event);
    }
  };
  GameEvents.onAny(handler);

  try {
    const result = RewardService.grantRewards({
      currencies: { gold: '100', merit: '5' },
      items: [{ itemId: 'item_iron_ore', qty: 2 }],
      techniqueFragments: [{ techId: 'tech_spark_strike', qty: 3 }],
      manuals: [{
        manualId: 'manual_spark_strike',
        techId: 'tech_spark_strike',
        grade: 'mortal',
        rarity: 'common',
        qty: 2,
      }],
      comprehension: 15,
    }, 'test:reward-truth');

    assert.deepEqual(result.appliedCurrencies, { gold: '100', merit: '5' });
    assert.deepEqual(result.appliedItems, [{ itemId: 'item_iron_ore', qty: 2 }]);
    assert.deepEqual(result.droppedItems, []);
    assert.deepEqual(result.appliedTechniqueFragments, [{ techId: 'tech_spark_strike', qty: 3 }]);
    assert.deepEqual(result.appliedManuals, [{
      manualId: 'manual_spark_strike',
      techId: 'tech_spark_strike',
      grade: 'mortal',
      rarity: 'common',
      qty: 2,
    }]);
    assert.equal(result.appliedComprehension?.applied, true);
    assert.equal(result.appliedComprehension?.targetHeartLawId, 'heartlaw_quiet_breath');
    assert.deepEqual(result.appliedComprehension?.before, { chapter: 1, comprehension: 0 });
    assert.deepEqual(result.appliedComprehension?.after, { chapter: 1, comprehension: 15 });
    assert.deepEqual(result.skippedRewards, []);

    assert.equal(useInventoryStore.getState().currencies.gold, '100');
    assert.equal(useInventoryStore.getState().currencies.merit, '5');
    assert.equal(useInventoryStore.getState().getQty('item_iron_ore'), 2);
    assert.equal(useTechCollectionStore.getState().getFragments('tech_spark_strike'), 3);
    const awardedManuals = useManualSatchelStore.getState().manuals;
    assert.equal(useManualSatchelStore.getState().getManualCount('tech_spark_strike', 'mortal', 'common'), 2);
    assert.equal(new Set(awardedManuals.map((manual) => manual.id)).size, 2);
    assert.equal(useHeartLawStore.getState().comprehension, 15);

    const summary = buildRewardSummary(result);
    assert.match(summary, /\+100 Gold/);
    assert.match(summary, /\+2 Iron Ore/);
    assert.match(summary, /\+3 technique fragments: tech_spark_strike/);
    assert.match(summary, /\+2 manual: tech_spark_strike/);
    assert.match(summary, /\+15 Comprehension/);

    const grantedEvent = grantedEvents[0];
    assert.ok(grantedEvent);
    assert.deepEqual(grantedEvent?.payload.result.appliedTechniqueFragments, result.appliedTechniqueFragments);
    assert.deepEqual(grantedEvent?.payload.result.appliedManuals, result.appliedManuals);
    assert.equal(grantedEvent?.payload.result.appliedComprehension?.applied, true);
    assert.match(grantedEvent?.payload.summary ?? '', /\+15 Comprehension/);
  } finally {
    GameEvents.offAny(handler);
  }
});

test('grantRewards records skipped comprehension when no Heart Law is selected', () => {
  const originalLog = console.log;
  const logLines: string[] = [];
  console.log = (...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  };

  try {
    const result = RewardService.grantRewards({ comprehension: 9 }, 'test:no-heart-law');

    assert.equal(useHeartLawStore.getState().comprehension, 0);
    assert.equal(result.appliedComprehension?.applied, false);
    assert.equal(result.appliedComprehension?.targetHeartLawId, null);
    assert.equal(result.appliedComprehension?.skippedReason, 'no_selected_heart_law');
    assert.deepEqual(result.skippedRewards, [{
      kind: 'comprehension',
      reason: 'no_selected_heart_law',
      payload: { amount: 9, source: 'test:no-heart-law' },
    }]);
    assert.equal(logLines.some((line) => line.includes('comprehension not wired yet')), false);
    assert.match(buildRewardSummary(result), /Comprehension skipped: no Heart Law selected/);
  } finally {
    console.log = originalLog;
  }
});

test('grantRewards records malformed manual rewards as skipped without adding manuals', () => {
  const malformedManuals = [
    {
      manualId: 'manual_zero_qty',
      techId: 'tech_spark_strike',
      grade: 'mortal',
      rarity: 'common',
      qty: 0,
    },
    {
      manualId: 'manual_negative_qty',
      techId: 'tech_spark_strike',
      grade: 'mortal',
      rarity: 'common',
      qty: -2,
    },
    {
      manualId: 'manual_missing_qty',
      techId: 'tech_spark_strike',
      grade: 'mortal',
      rarity: 'common',
    },
    {
      manualId: 'manual_missing_tech',
      grade: 'mortal',
      rarity: 'common',
      qty: 1,
    },
    null,
  ] as never;

  const result = RewardService.grantRewards({ manuals: malformedManuals }, 'test:malformed-manuals');

  assert.deepEqual(result.appliedManuals, []);
  assert.equal(useManualSatchelStore.getState().manuals.length, 0);
  assert.deepEqual(
    result.skippedRewards.map((entry) => ({ kind: entry.kind, reason: entry.reason })),
    [
      { kind: 'manual', reason: 'invalid_amount' },
      { kind: 'manual', reason: 'invalid_amount' },
      { kind: 'manual', reason: 'invalid_amount' },
      { kind: 'manual', reason: 'missing_id' },
      { kind: 'manual', reason: 'missing_id' },
    ],
  );
  assert.equal(buildRewardSummary(result), 'No rewards.');
});
