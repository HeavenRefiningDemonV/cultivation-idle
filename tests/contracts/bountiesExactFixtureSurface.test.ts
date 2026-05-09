import assert from 'node:assert/strict';
import test from 'node:test';

import { createBountiesExactMockupFixture } from '../../src/features/world/bountiesExact/buildBountiesExactSurface.js';

test('bounties exact fixture locks the mockup regions, pinned roles, actions, and shell flags', () => {
  const surface = createBountiesExactMockupFixture();

  assert.equal(surface.page.title, 'Bounties');
  assert.equal(surface.meta.rootTestId, 'bounties-exact-page');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.statCards.length, 7);
  assert.equal(surface.postedOrders.notes.length, 3);
  assert.deepEqual(surface.postedOrders.notes.map((note) => note.role), ['support', 'route', 'challenge']);
  assert.equal(surface.trackedNotice.title, 'Tracked Notice');
  assert.equal(surface.postedOrders.title, 'Posted Orders');
  assert.equal(surface.office.title, 'Bounty Office');
  assert.deepEqual(
    [
      surface.bottomActions.trackSelected.label,
      surface.bottomActions.claimReady.label,
      surface.bottomActions.routeNow.label,
    ],
    ['Track Selected', 'Claim Ready', 'Route Now'],
  );
  assert.equal(surface.page.statusPlaque, 'Pinewind Hamlet · 1 Tracked · 2 Claimable · 12 / 15 Reserve');
  assert.deepEqual(surface.shell, {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showContextStrip: false,
  });
});
