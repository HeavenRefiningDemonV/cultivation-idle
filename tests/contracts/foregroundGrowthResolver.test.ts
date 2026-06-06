import assert from 'node:assert/strict';
import test from 'node:test';

import type { ActiveActivity, ForegroundActivityType } from '../../src/types/activity.js';
import { COMBAT_ACTIVITY_TYPES } from '../../src/types/activity.js';
import {
  resolveForegroundGrowthMode,
  type ForegroundGrowthKind,
} from '../../src/systems/cultivation/foregroundGrowthResolver.js';

function active(type: ForegroundActivityType): ActiveActivity {
  return { type, startedAt: 1_000 };
}

const expectedModes = {
  meditate: 'cultivation',
  path_training: 'path_training',
  dao_heart_practice: 'dao_heart',
  outskirts: 'combat',
  trial: 'combat',
  ruins: 'combat',
  forge: 'queued_only',
} satisfies Record<ForegroundActivityType, ForegroundGrowthKind>;

test('mp1 foreground resolver classifies every current foreground type explicitly', () => {
  for (const [type, expectedMode] of Object.entries(expectedModes) as Array<[ForegroundActivityType, ForegroundGrowthKind]>) {
    const mode = resolveForegroundGrowthMode(active(type));

    assert.equal(mode.activeType, type);
    assert.equal(mode.mode, expectedMode);
  }
});

test('mp1 foreground resolver treats null and meditate as cultivation mode', () => {
  for (const value of [null, active('meditate')] as const) {
    const mode = resolveForegroundGrowthMode(value);

    assert.equal(mode.mode, 'cultivation');
    assert.equal(mode.fullQiAllowed, true);
    assert.equal(mode.trainingAllowed, false);
    assert.equal(mode.daoHeartAllowed, false);
    assert.equal(mode.combatAllowed, false);
    assert.equal(mode.backgroundQueuesAllowed, true);
    assert.equal(mode.offlineEligible, true);
  }
});

test('mp1 foreground resolver blocks full Qi during Training and Dao Heart practice', () => {
  const training = resolveForegroundGrowthMode(active('path_training'));
  assert.equal(training.mode, 'path_training');
  assert.equal(training.fullQiAllowed, false);
  assert.equal(training.trainingAllowed, true);
  assert.equal(training.daoHeartAllowed, false);
  assert.ok(training.pausedPrimaryLabels.includes('Full Qi cultivation'));

  const daoHeart = resolveForegroundGrowthMode(active('dao_heart_practice'));
  assert.equal(daoHeart.mode, 'dao_heart');
  assert.equal(daoHeart.fullQiAllowed, false);
  assert.equal(daoHeart.trainingAllowed, false);
  assert.equal(daoHeart.daoHeartAllowed, true);
  assert.ok(daoHeart.pausedPrimaryLabels.includes('Full Qi cultivation'));
});

test('mp1 foreground resolver maps every combat activity to combat mode', () => {
  for (const type of COMBAT_ACTIVITY_TYPES) {
    const mode = resolveForegroundGrowthMode(active(type));

    assert.equal(mode.mode, 'combat');
    assert.equal(mode.fullQiAllowed, false);
    assert.equal(mode.trainingAllowed, false);
    assert.equal(mode.daoHeartAllowed, false);
    assert.equal(mode.combatAllowed, true);
    assert.equal(mode.offlineEligible, false);
  }
});

test('mp1 foreground resolver treats forge and unknown future foreground types as queued-only', () => {
  const forge = resolveForegroundGrowthMode(active('forge'));
  assert.equal(forge.mode, 'queued_only');
  assert.equal(forge.fullQiAllowed, false);

  const unknown = resolveForegroundGrowthMode({
    type: 'future_study' as ForegroundActivityType,
    startedAt: 1_000,
  });
  assert.equal(unknown.mode, 'queued_only');
  assert.equal(unknown.fullQiAllowed, false);
  assert.equal(unknown.trainingAllowed, false);
  assert.equal(unknown.daoHeartAllowed, false);
});
