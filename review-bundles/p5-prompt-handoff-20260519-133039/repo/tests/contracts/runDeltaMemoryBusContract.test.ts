import assert from 'node:assert/strict';
import test from 'node:test';

import { useRunDeltaStore } from '../../src/systems/runDeltas/runDeltaStore.js';
import type { RunCausalityDelta } from '../../src/systems/runDeltas/types.js';

function makeDelta(id: string, timestamp = Number(id)): RunCausalityDelta {
  return {
    id,
    source: 'manual',
    timestamp,
    tone: 'info',
    label: `Delta ${id}`,
    detail: `Detail ${id}`,
    memoryLine: `Memory ${id}`,
  };
}

test.beforeEach(() => {
  useRunDeltaStore.getState().clearDeltas();
});

test('run delta store keeps a bounded per-life buffer', () => {
  for (let index = 0; index < 12; index += 1) {
    useRunDeltaStore.getState().pushDelta(makeDelta(String(index), index));
  }

  const deltas = useRunDeltaStore.getState().deltas;
  assert.equal(deltas.length, 8);
  assert.equal(deltas[0].id, '11');
  assert.equal(deltas.at(-1)?.id, '4');
});

test('run delta store records conservative route and doctrine fields without mutating gameplay owners', () => {
  useRunDeltaStore.getState().pushDelta({
    ...makeDelta('doctrine', 100),
    source: 'rewards',
    rewardSummary: '+300 Gold',
    doctrineDelta: { heartLawId: 'heart_quiet_breath', amount: 12 },
    routeDelta: { label: 'Return to Cultivation', target: { kind: 'tab', tab: 'cultivation' } },
  });

  const [delta] = useRunDeltaStore.getState().deltas;
  assert.equal(delta.rewardSummary, '+300 Gold');
  assert.equal(delta.doctrineDelta?.amount, 12);
  assert.equal(delta.routeDelta?.target?.kind, 'tab');
});
