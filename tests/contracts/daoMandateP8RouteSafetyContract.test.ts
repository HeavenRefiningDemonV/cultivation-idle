import assert from 'node:assert/strict';
import test from 'node:test';

import type { DaoMandateRoute } from '../../src/systems/ui/daoMandate/index.js';
import {
  describeDaoRouteTarget,
  getDaoRouteButtonViewModel,
  getDaoRouteDisabledReason,
} from '../../src/ui/daoMandate/daoMandateUiFormatters.js';

const UNSAFE_ROUTE_COPY = /owner not wired|not wired|debug|adapter|placeholder|Route target unavailable|No route target/i;

function makeRoute(overrides: Partial<DaoMandateRoute> = {}): DaoMandateRoute {
  return {
    id: 'fixture-route',
    label: 'Mandate Route',
    actionLabel: 'Follow Mandate',
    detail: 'The Mandate points to the next proof.',
    destinationLabel: 'Gate Trial',
    target: { kind: 'tab', tab: 'adventure' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'readiness',
    priority: 1,
    ...overrides,
  };
}

test('P8 route disabled reasons are player-safe when route targets or handlers are unavailable', () => {
  const noTargetRoute = makeRoute({ target: null });
  const noTargetReason = getDaoRouteDisabledReason(noTargetRoute);
  const noTargetView = getDaoRouteButtonViewModel({ route: noTargetRoute, hasHandler: true });
  const noHandlerView = getDaoRouteButtonViewModel({ route: makeRoute(), hasHandler: false });

  for (const value of [
    describeDaoRouteTarget(null),
    noTargetReason,
    noTargetView.reason,
    noTargetView.ariaLabel,
    noHandlerView.reason,
    noHandlerView.ariaLabel,
  ]) {
    assert.equal(typeof value, 'string');
    assert.doesNotMatch(String(value), UNSAFE_ROUTE_COPY);
  }

  assert.equal(noTargetReason, 'This route cannot be opened from here yet.');
});

test('P8 route copy sanitizes unsafe blocked reasons before they reach buttons', () => {
  const unsafeBlockedRoute = makeRoute({
    blocked: true,
    blockedReason: 'owner not wired: debug adapter route',
  });
  const reason = getDaoRouteDisabledReason(unsafeBlockedRoute);
  const view = getDaoRouteButtonViewModel({ route: unsafeBlockedRoute, hasHandler: true });

  assert.equal(reason, 'This route cannot be opened from here yet.');
  assert.equal(view.reason, 'This route cannot be opened from here yet.');
  assert.doesNotMatch(view.ariaLabel, UNSAFE_ROUTE_COPY);
});
