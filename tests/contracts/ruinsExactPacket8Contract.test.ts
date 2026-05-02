import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { RuinsExactMockupScreen } from '../../src/features/world/ruinsExact/RuinsExactMockupScreen.js';

void test('fixture primary cta and exploration summary are locked', () => {
  const surface = createRuinsExactMockupFixture();
  assert.equal(surface.primaryAction.visible, true);
  assert.equal(surface.primaryAction.enabled, true);
  assert.equal(surface.primaryAction.label, 'Continue Exploration');
  assert.equal(surface.primaryAction.intent, 'continue-exploration');
  assert.equal(surface.primaryAction.singleDominantCta, true);
  assert.equal(surface.primaryAction.isPrimary, true);
  assert.equal(surface.primaryAction.plaqueVariant, 'jade-gold');
  assert.equal(surface.primaryAction.ornamentVariant, 'root-jade-cap');
  assert.equal(surface.explorationSummary.visible, true);
  assert.equal(surface.explorationSummary.title, 'Exploration Summary');
  assert.deepEqual(surface.explorationSummary.rows.map((r) => `${r.label}:${r.value}`), ['Rooms:2 / 5', 'Anchor:Final Chest', 'Pity:1 / 6', 'Main Target:Spirit Leaf']);
});

void test('screen mounts packet8 cta and summary testids', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  for (const token of ['ruins-exact-cta-slot', 'ruins-primary-cta', 'ruins-primary-cta-label', 'ruins-exact-summary-dock', 'ruins-exploration-summary']) assert.equal(html.includes(token), true);
  assert.equal((html.match(/ruins-exploration-summary-row/g) ?? []).length, 4);
  for (const token of ['ruinsPrimaryCta__ornament--left','ruinsPrimaryCta__plate','ruinsPrimaryCta__label','ruinsPrimaryCta__ornament--right','ruinsExplorationSummaryCard__header','ruinsExplorationSummaryCard__rows','ruinsExplorationSummaryCard__label','ruinsExplorationSummaryCard__value']) assert.equal(html.includes(token), true);
});

void test('live action maps to enter/continue by active-run presence', () => {
  const live = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(['continue-exploration', 'enter-ruins', 'disabled'].includes(live.primaryAction.intent), true);
});
