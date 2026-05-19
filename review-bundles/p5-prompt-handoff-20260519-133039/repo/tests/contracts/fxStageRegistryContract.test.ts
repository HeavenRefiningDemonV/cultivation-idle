import assert from 'node:assert/strict';
import test from 'node:test';

import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';
import { createFxStageRegistry } from '../../src/ui/fx/stageRegistry.js';

function createHost(isConnected = true): HTMLDivElement {
  return { isConnected } as HTMLDivElement;
}

test('stage registration creates retrievable snapshots', () => {
  const registry = createFxStageRegistry();
  const host = createHost();

  const { token } = registry.registerStage({
    stageId: FX_STAGE_IDS.cultivation,
    hostElement: host,
    bounds: { width: 320, height: 180 },
    dpr: 2,
  });

  const snapshot = registry.getStageSnapshot(FX_STAGE_IDS.cultivation, false);
  assert.ok(snapshot);
  assert.equal(snapshot.stageId, FX_STAGE_IDS.cultivation);
  assert.equal(snapshot.hostReady, true);
  assert.equal(snapshot.dormant, false);

  const changed = registry.updateStage({
    stageId: FX_STAGE_IDS.cultivation,
    token,
    bounds: { width: 640, height: 360 },
  });
  assert.equal(changed, true);

  const updated = registry.getStageSnapshot(FX_STAGE_IDS.cultivation, false);
  assert.ok(updated);
  assert.equal(updated.bounds.width, 640);
  assert.equal(updated.bounds.height, 360);
});

test('updateStage ignores stale and invalid token paths', () => {
  const registry = createFxStageRegistry();
  const host = createHost();

  const { token } = registry.registerStage({
    stageId: FX_STAGE_IDS.status,
    hostElement: host,
    bounds: { width: 100, height: 100 },
    dpr: 1,
  });

  const invalidChange = registry.updateStage({
    stageId: FX_STAGE_IDS.status,
    token: Symbol('wrong-token'),
    bounds: { width: 900, height: 900 },
  });
  assert.equal(invalidChange, false);

  const unchanged = registry.getStageSnapshot(FX_STAGE_IDS.status, false);
  assert.ok(unchanged);
  assert.equal(unchanged.bounds.width, 100);

  const wrongStage = registry.updateStage({
    stageId: FX_STAGE_IDS.world,
    token,
    bounds: { width: 1, height: 1 },
  });
  assert.equal(wrongStage, false);
});

test('unregister removes snapshot and active-scene owner', () => {
  const registry = createFxStageRegistry();
  const host = createHost();

  const { token } = registry.registerStage({
    stageId: FX_STAGE_IDS.world,
    hostElement: host,
    bounds: { width: 200, height: 120 },
    dpr: 1,
  });

  const firstClaim = registry.claimActiveScene({ stageId: FX_STAGE_IDS.world, sceneKey: 'scene-a' });
  assert.equal(firstClaim.claimed, true);
  assert.equal(registry.getActiveSceneOwner(FX_STAGE_IDS.world), 'scene-a');

  const removed = registry.unregisterStage({ stageId: FX_STAGE_IDS.world, token });
  assert.equal(removed, true);
  assert.equal(registry.getStageSnapshot(FX_STAGE_IDS.world, false), null);
  assert.equal(registry.getActiveSceneOwner(FX_STAGE_IDS.world), null);
});

test('duplicate active scene ownership is blocked per stage', () => {
  const registry = createFxStageRegistry();
  const host = createHost();

  registry.registerStage({
    stageId: FX_STAGE_IDS.forge,
    hostElement: host,
    bounds: { width: 180, height: 120 },
    dpr: 1,
  });

  const first = registry.claimActiveScene({ stageId: FX_STAGE_IDS.forge, sceneKey: 'scene-a' });
  const duplicate = registry.claimActiveScene({ stageId: FX_STAGE_IDS.forge, sceneKey: 'scene-b' });

  assert.equal(first.claimed, true);
  assert.equal(duplicate.claimed, false);
  assert.equal(duplicate.duplicateOwnerBlocked, true);
  assert.equal(registry.getActiveSceneOwner(FX_STAGE_IDS.forge), 'scene-a');

  const releaseWrongOwner = registry.releaseActiveScene({ stageId: FX_STAGE_IDS.forge, sceneKey: 'scene-b' });
  assert.equal(releaseWrongOwner, false);

  const releaseRightOwner = registry.releaseActiveScene({ stageId: FX_STAGE_IDS.forge, sceneKey: 'scene-a' });
  assert.equal(releaseRightOwner, true);
  assert.equal(registry.getActiveSceneOwner(FX_STAGE_IDS.forge), null);
});
