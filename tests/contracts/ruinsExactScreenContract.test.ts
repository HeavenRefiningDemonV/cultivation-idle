import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsExactMockupScreen } from '../../src/features/world/ruinsExact/RuinsExactMockupScreen.js';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('ruins exact top region contract renders fixture top lane and preserves body slots', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  assert.equal((html.match(/ruins-exact-top-region/g) ?? []).length, 1);
  assert.equal(html.includes('data-testid="ruins-page-title"'), true);
  assert.equal(html.includes('>Ruins<'), true);
  assert.equal((html.match(/ruins-macro-ribbon/g) ?? []).length, 1);
  assert.equal((html.match(/ruins-settings-gear/g) ?? []).length, 1);
  assert.equal((html.match(/ruins-tactical-strip/g) ?? []).length, 1);
  const order = ['hp','depth','loadout','aiProfile','healing','bounty','expedition'];
  const idx = order.map((id) => html.indexOf(`ruins-tactical-cell-${id}`));
  assert.equal(idx.every((n) => n >= 0), true);
  for (let i = 1; i < idx.length; i += 1) assert.equal(idx[i] > idx[i - 1], true);
  for (const copy of ['131 / 131','Room 2 / 5 · Lv. 11','Loadout 1','Balanced','0 / 20','No tracked bounty','2 Idle','Hollow Log Den','Targeted local materials and guaranteed anchor rewards','Targeted Mats','Deterministic Support']) assert.equal(html.includes(copy), true);
  assert.equal(html.includes('ruinsTopRegion__plaqueCaret'), true);
  for (const forbidden of ['combatPathModule__topLane', 'ruinsPanel__scenicBadge']) assert.equal(html.includes(forbidden), false);
  for (const slot of ['ruins-exact-body-grid','ruins-exact-left-rail','ruins-exact-center-scenic-slot','ruins-exact-right-rail','ruins-exact-route-slot','ruins-exact-cta-slot','ruins-exact-summary-dock']) assert.equal(html.includes(slot), true);
});
