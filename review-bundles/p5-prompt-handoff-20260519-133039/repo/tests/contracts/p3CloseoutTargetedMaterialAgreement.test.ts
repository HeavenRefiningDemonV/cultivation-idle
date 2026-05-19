import assert from 'node:assert/strict';
import test from 'node:test';

import { CITY_ACTIVITY_REWARD_ROLE_PROFILES } from '../../src/systems/economy/activityRewardRoles.js';
import { listTargetedMaterialSinkMap } from '../../src/systems/economy/targetedMaterialSinkMap.js';

test('targeted activity reward materials have explicit sink-map classification', () => {
  const targetedRewardIds = new Set<string>();
  CITY_ACTIVITY_REWARD_ROLE_PROFILES.forEach((role) => {
    role.targetedMaterialIds.forEach((itemId) => targetedRewardIds.add(itemId));
  });
  const sinkMapIds = new Set<string>(listTargetedMaterialSinkMap().map((entry) => entry.materialId));

  assert.ok(targetedRewardIds.has('mat_spirit_leaf'), 'reviewed targeted material should remain covered by reward roles');
  targetedRewardIds.forEach((itemId) => {
    assert.ok(sinkMapIds.has(itemId), `${itemId} must have explicit sink-map classification`);
  });
});
