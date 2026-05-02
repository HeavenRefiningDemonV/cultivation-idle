import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
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

  assert.equal(route.mode, 'active');
  assert.equal(route.nodes.length, 5);
  assert.equal(route.nodes.at(-1)?.medallionVariant, 'future-anchor');

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


void test('route strip css contract includes stateful medallion and lane selectors', () => {
  const scss = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  for (const selector of ['.ruinsRoomRouteStrip','.ruinsRoomRouteStrip__heading','.ruinsRoomRouteStrip__titlePlate','.ruinsRoomRouteStrip__chip','.ruinsRoomRouteStrip__lane','.ruinsRoomRouteStrip__laneRule','.ruinsRoomRouteStrip__nodes','.ruinsRoomRouteStrip__node','.ruinsRoomRouteStrip__medallion','.ruinsRoomRouteStrip__currentPointer','.ruinsRoomRouteStrip__completeMark','.ruinsRoomRouteStrip__icon','.ruinsRoomRouteStrip__text','.ruinsRoomRouteStrip__label','.ruinsRoomRouteStrip__sublabel','.ruinsRoomRouteStrip__laneDiamond','.ruinsRoomRouteStrip__node--completed','.ruinsRoomRouteStrip__node--current','.ruinsRoomRouteStrip__node--future','.ruinsRoomRouteStrip__medallion--completed-check','.ruinsRoomRouteStrip__medallion--current-jade','.ruinsRoomRouteStrip__medallion--future-cache','.ruinsRoomRouteStrip__medallion--future-guardian','.ruinsRoomRouteStrip__medallion--future-anchor']) assert.equal(scss.includes(selector), true);
  for (const token of ['list-style:none','display:grid','grid-template-columns:repeat(5,minmax(0,1fr))','text-align:center','width:clamp(54px,3.75vw,76px)','height:clamp(54px,3.75vw,76px)']) assert.equal(scss.includes(token), true);
});
