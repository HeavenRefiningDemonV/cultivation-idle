import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceToGateThreshold,
  completeTrialByCombatStore,
  createPhase0Harness,
  getCurrentTrialGateItemFromContent,
  getFirstBreakthroughRuntimeGateItem,
  getInventoryCount,
  getTrialCombatStarted,
  openFirstTrialPreview,
  performBreakthrough,
  startCombatFromPreview,
} from '../../helpers/phase0Harness.ts';
import { expectCurrentlyBrokenContract } from '../../helpers/expectedFailure.ts';

test('PHASE0 CONTRACT (expected broken): first eligible gate trial entry must not require already owning the reward item', () => {
  const harness = createPhase0Harness();
  const trialId = harness.firstTransition.gatingTrialId;
  assert.ok(trialId, 'First transition must define a gate trial id');
  const trialDef = harness.content.trials.find((entry) => entry.id === trialId);
  assert.ok(trialDef, 'First trial definition must be present in content');

  openFirstTrialPreview(trialId, trialDef.cityId);
  startCombatFromPreview();

  expectCurrentlyBrokenContract(() => {
    assert.equal(
      getTrialCombatStarted(),
      true,
      'Eligible trial start should not require already possessing the trial reward gate item.',
    );
  }, 'first gate entry should be possible without owning gate reward item');
});

test('PHASE0 CONTRACT (expected broken): first trial clear should grant the exact gate item breakthrough consumes', () => {
  const harness = createPhase0Harness();
  const trialId = harness.firstTransition.gatingTrialId;

  assert.ok(trialId, 'First transition must define a gate trial id');
  const trialDef = harness.content.trials.find((entry) => entry.id === trialId);
  assert.ok(trialDef, 'Trial definition should exist for first transition');

  const trialRewardItem = getCurrentTrialGateItemFromContent(trialId);

  completeTrialByCombatStore(trialId, trialDef.cityId, trialDef.bossId, trialRewardItem);

  assert.equal(
    getInventoryCount(trialRewardItem),
    1,
    'First eligible trial clear should grant its authored gate item exactly once.',
  );

  advanceToGateThreshold(harness.fromRealmIndex);

  const runtimeBreakthroughItem = getFirstBreakthroughRuntimeGateItem(harness.fromRealmIndex);
  assert.ok(runtimeBreakthroughItem, 'Runtime breakthrough should define a gate item for this realm transition.');

  expectCurrentlyBrokenContract(() => {
    assert.equal(
      runtimeBreakthroughItem,
      trialRewardItem,
      'Breakthrough gate consumption item should exactly match the item granted by the corresponding gate trial.',
    );

    const advanced = performBreakthrough();
    assert.equal(
      advanced,
      true,
      'Breakthrough should succeed with the gate item earned from the authoritative gate trial clear.',
    );
  }, 'first gate reward item must equal and satisfy first breakthrough gate requirement');
});
