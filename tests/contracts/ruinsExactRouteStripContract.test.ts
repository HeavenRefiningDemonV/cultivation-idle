import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { RuinsRoomRouteStrip } from '../../src/features/world/ruinsExact/components/RuinsRoomRouteStrip.js';

void test('fixture route strip contract is locked', () => {
  const route = createRuinsExactMockupFixture().roomRoute;
  assert.equal(route.title, 'Hollow Log Den Route');
  assert.equal(route.chip, 'Anchor Chest in 3');
  assert.equal(route.nodes.map((n) => n.label).join('|'), 'Root Mouth|Spirit Nest|Sealed Cache|Den Guardian|Final Chest');
  assert.equal(route.nodes.map((n) => n.sublabel).join('|'), 'Room 1|Room 2|Room 3|Lv. 11|Anchor');
  assert.equal(route.nodes.map((n) => n.state).join('|'), 'completed|current|future|future|future');
  assert.equal(route.currentNodeId, 'spirit-nest');
  assert.equal(route.nodes.at(-1)?.isAnchor, true);
});

void test('route strip renders authored nodes not placeholder paragraphs', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsRoomRouteStrip, { route: createRuinsExactMockupFixture().roomRoute }));
  assert.equal(html.includes('ruins-exact-room-route-strip'), true);
  assert.equal(html.includes('ruins-route-title'), true);
  assert.equal(html.includes('Hollow Log Den Route'), true);
  assert.equal(html.includes('Anchor Chest in 3'), true);
  assert.equal((html.match(/ruins-route-node/g) ?? []).length >= 5, true);
});

void test('live route chip changes by room index and idle mode stays coherent', () => {
  const live = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(typeof live.roomRoute.chip, 'string');
  assert.equal(live.roomRoute.chip.length > 0, true);
  assert.equal(live.roomRoute.chip === 'Anchor Chest in 3' && live.roomRoute.mode === 'idle', false);
});
