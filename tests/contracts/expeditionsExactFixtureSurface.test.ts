import assert from 'node:assert/strict';
import test from 'node:test';

import { createExpeditionsExactMockupFixture } from '../../src/features/world/expeditionsExact/buildExpeditionsExactSurface.js';

test('expeditions exact fixture locks the mockup slot strip, routes, ledger, actions, and shell flags', () => {
  const surface = createExpeditionsExactMockupFixture();

  assert.equal(surface.page.title, 'Expeditions');
  assert.equal(surface.meta.rootTestId, 'expeditions-exact-page');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.dispatchSlots.length, 4);
  assert.deepEqual(surface.dispatchSlots.map((slot) => slot.status), ['active', 'claim-ready', 'idle', 'locked']);
  assert.equal(surface.availableRoutes.routes.length, 3);
  assert.deepEqual(surface.availableRoutes.routes.map((route) => route.routeId), ['forage', 'mine', 'scout']);
  assert.equal(surface.dispatchLedger.claimBlock.stamp, 'Claim Ready');
  assert.equal(surface.dispatchLedger.recommendedBlock.title, 'Recommended Now');
  assert.deepEqual(
    [surface.bottomActions.dispatch.label, surface.bottomActions.claimAllReady.label],
    ['Dispatch Expedition', 'Claim All Ready'],
  );
  assert.deepEqual(surface.shell, {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showContextStrip: false,
  });
});
