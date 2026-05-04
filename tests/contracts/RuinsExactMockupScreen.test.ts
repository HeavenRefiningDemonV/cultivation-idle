import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsExactMockupScreen } from '../../src/features/world/ruinsExact/RuinsExactMockupScreen.js';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';

void test('ruins exact mockup screen renders scaffold slots and fixture copy without legacy leakage', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  for (const token of ['ruins-exact-page','ruins-exact-top-region','ruins-exact-body-grid','ruins-exact-left-rail','ruins-exact-center-scenic-slot','ruins-exact-right-rail','ruins-exact-route-slot','ruins-exact-cta-slot','ruins-exact-summary-dock','ruins-exact-shell-flags','ruins-exact-region-order']) assert.equal(html.includes(token), true);
  for (const copy of ['Ruins','Hollow Log Den','Targeted local materials and guaranteed anchor rewards','Targeted Mats','Deterministic Support','Continue Exploration','Exploration Summary']) assert.equal(html.includes(copy), true);
  for (const forbidden of ['combatPathModule','Deterministic value preview']) assert.equal(html.includes(forbidden), false);
});


void test('ruins exact kit card renders offense/defense and hides idle stamp', () => {
  const fixtureHtml = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  for (const token of ['Offense', 'Defense', 'ATK', 'ACC', 'CRT', 'HP', 'EVA', 'RES', 'In Ruin']) assert.equal(fixtureHtml.includes(token), true);

  useRuinsStore.getState().hardResetRuins();
  const liveIdle = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  const liveHtml = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: liveIdle }));
  if (liveIdle.meta.activityMode === 'idle') {
    assert.equal(liveHtml.includes('data-testid="ruins-kit-stamp"'), false);
    assert.equal(liveHtml.includes('Offense'), true);
    assert.equal(liveHtml.includes('Defense'), true);
  }
});
