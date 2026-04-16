import assert from 'node:assert/strict';
import test from 'node:test';

import { FX_PROOF_SURFACE_POLICIES, FX_SCENE_BUDGETS } from '../../src/ui/fx/constants.js';

test('FX_SCENE_BUDGETS keeps one canonical four-tier matrix', () => {
  assert.deepEqual(Object.keys(FX_SCENE_BUDGETS), ['high', 'medium', 'low', 'reducedMotion']);
  assert.equal(FX_SCENE_BUDGETS.high.sceneMode, 'full');
  assert.equal(FX_SCENE_BUDGETS.medium.sceneMode, 'minimal');
  assert.equal(FX_SCENE_BUDGETS.low.sceneMode, 'minimal');
  assert.equal(FX_SCENE_BUDGETS.reducedMotion.sceneMode, 'static');
  assert.equal(FX_SCENE_BUDGETS.reducedMotion.tickScale, 0);
  assert.equal(FX_SCENE_BUDGETS.reducedMotion.allowBurstAtmosphere, false);
});

test('proof-surface policy remains explicit for scene-backed vs static-safe roots', () => {
  assert.deepEqual(FX_PROOF_SURFACE_POLICIES, {
    cultivation: 'scene-backed',
    status: 'scene-backed',
    world: 'static-safe-null-scene',
    forge: 'static-safe-null-scene',
    ruins: 'scene-backed',
    gateTrial: 'scene-backed',
    selection: 'legal-null-scene-stub',
  });
});
