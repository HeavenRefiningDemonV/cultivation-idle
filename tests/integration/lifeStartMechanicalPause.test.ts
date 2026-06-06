import assert from 'node:assert/strict';
import test from 'node:test';

import { createTimingProbeScenario } from '../helpers/balance/createTimingProbeScenario.js';
import { isLifeIdentityComplete } from '../../src/systems/lifeStart/lifeIdentity.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';

function resetLifeStartState() {
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  useGameStore.setState({
    qi: '0',
    qiPerSecond: '1',
    selectedPath: null,
    focusMode: 'balanced',
  });
  useCultivationStore.setState({
    selectedHeartLawId: null,
    breathMode: 'balanced',
  });
}

function simulateCultivationAndFlush() {
  useGameStore.getState().tick(10 * 60 * 1000);
  useGameStore.getState().flushCultivationAccumulation('life-start-mechanical-pause-test');
}

test('fresh uncommitted life does not accrue real Qi when cultivation ticks and flushes', () => {
  resetLifeStartState();

  simulateCultivationAndFlush();

  assert.equal(useGameStore.getState().qi, '0');
});

test('path-only life identity remains mechanically paused', () => {
  resetLifeStartState();
  useGameStore.setState({ selectedPath: 'heaven' });

  simulateCultivationAndFlush();

  assert.equal(useGameStore.getState().qi, '0');
});

test('path and Heart Law committed life can accrue real Qi', () => {
  resetLifeStartState();
  useGameStore.setState({ selectedPath: 'heaven' });
  useCultivationStore.setState({ selectedHeartLawId: 'heartlaw_quiet_breath', breathMode: 'balanced' });

  simulateCultivationAndFlush();

  assert.ok(Number(useGameStore.getState().qi) > 0);
});

test('timing probe scenario commits a complete life identity before measuring route milestones', async () => {
  await createTimingProbeScenario();

  assert.equal(
    isLifeIdentityComplete({
      pathId: useGameStore.getState().selectedPath,
      selectedHeartLawId: useCultivationStore.getState().selectedHeartLawId,
      breathMode: useCultivationStore.getState().breathMode,
    }),
    true,
  );
});
