import assert from 'node:assert/strict';
import test from 'node:test';

import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';
import { buildFxSceneContract } from '../../src/ui/fx/runtime.js';
import { createFxStageRegistry, resolveFxStageDormant, resolveFxStageHostReady } from '../../src/ui/fx/stageRegistry.js';

function createHost(isConnected = true): HTMLDivElement {
  return { isConnected } as HTMLDivElement;
}

test('host readiness requires connected host and minimum bounds', () => {
  assert.equal(resolveFxStageHostReady({ hostElement: createHost(true), bounds: { width: 1, height: 1 } }), true);
  assert.equal(resolveFxStageHostReady({ hostElement: createHost(false), bounds: { width: 1, height: 1 } }), false);
  assert.equal(resolveFxStageHostReady({ hostElement: createHost(true), bounds: { width: 0, height: 2 } }), false);
});

test('dormant semantics reflect hidden document or unready host', () => {
  assert.equal(resolveFxStageDormant({ documentHidden: false, hostReady: true }), false);
  assert.equal(resolveFxStageDormant({ documentHidden: true, hostReady: true }), true);
  assert.equal(resolveFxStageDormant({ documentHidden: false, hostReady: false }), true);
});

test('stage snapshots can exist while dormant and not host-ready', () => {
  const registry = createFxStageRegistry();
  const host = createHost(true);

  registry.registerStage({
    stageId: FX_STAGE_IDS.selection,
    hostElement: host,
    bounds: { width: 0, height: 200 },
    dpr: 2,
  });

  const snapshot = registry.getStageSnapshot(FX_STAGE_IDS.selection, false);
  assert.ok(snapshot);
  assert.equal(snapshot.hostReady, false);
  assert.equal(snapshot.dormant, true);
});

test('scene contract disables continuous atmosphere for dormant stages', () => {
  const registry = createFxStageRegistry();

  registry.registerStage({
    stageId: FX_STAGE_IDS.status,
    hostElement: createHost(true),
    bounds: { width: 400, height: 200 },
    dpr: 2,
  });

  const snapshot = registry.getStageSnapshot(FX_STAGE_IDS.status, true);
  assert.ok(snapshot);

  const contract = buildFxSceneContract({
    stageId: FX_STAGE_IDS.status,
    sceneKind: 'status',
    snapshot,
    requestedQuality: 'high',
    effectiveQuality: 'high',
    prefersReducedMotion: false,
    documentHidden: true,
  });

  assert.equal(contract.dormant, true);
  assert.equal(contract.isStatic, true);
  assert.equal(contract.canAnimateContinuously, false);
});
