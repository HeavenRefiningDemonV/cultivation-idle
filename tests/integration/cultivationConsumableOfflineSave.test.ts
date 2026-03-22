import assert from 'node:assert/strict';
import test from 'node:test';

import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { buildDefaultSaveState } from '../../src/save/defaultSaveState.js';

const restoreFromHeartLawState = (heartLawState: NonNullable<ReturnType<typeof buildDefaultSaveState>['heartLawState']>) => {
  useCultivationStore.setState({
    selectedHeartLawId: heartLawState.selectedHeartLawId ?? null,
    chapter: heartLawState.chapter,
    comprehension: heartLawState.comprehension,
    unlockedHeartLawIds: [...heartLawState.unlockedHeartLawIds],
    breathMode: heartLawState.breathMode,
    studyEnabled: heartLawState.studyEnabled ?? false,
    studyTechniqueId: heartLawState.studyTechniqueId,
    lastInsightAt: heartLawState.lastInsightAt,
    nextInsightAt: heartLawState.nextInsightAt ?? null,
    insight: heartLawState.insight ?? null,
    stability: heartLawState.stability ?? 0,
    stabilityCap: heartLawState.stabilityCap ?? 100,
    activeCultivationConsumables: heartLawState.activeCultivationConsumables ?? [],
    insightProgressMs: heartLawState.insightProgressMs ?? 0,
    insightTargetMs: heartLawState.insightTargetMs ?? null,
  });
};

test.beforeEach(() => {
  useCultivationStore.getState().resetForNewLife();
  useCultivationStore.setState({ selectedHeartLawId: 'heartlaw_test', unlockedHeartLawIds: ['heartlaw_test'] });
});

test('cultivation consumable state survives save snapshots and expired entries can be culled after load', () => {
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', 0);
  useCultivationStore.setState({ insightProgressMs: 42_000, insightTargetMs: 100_000 });

  const save = buildDefaultSaveState();
  assert.equal(save.heartLawState?.activeCultivationConsumables?.[0]?.itemId, 'cons_qi_elixir_t1');

  useCultivationStore.getState().resetForNewLife();
  restoreFromHeartLawState(save.heartLawState!);
  assert.equal(useCultivationStore.getState().activeCultivationConsumables[0]?.itemId, 'cons_qi_elixir_t1');
  assert.equal(useCultivationStore.getState().insightProgressMs, 42_000);

  useCultivationStore.getState().clearExpiredCultivationConsumables(700_000);
  assert.deepEqual(useCultivationStore.getState().activeCultivationConsumables, []);
});
