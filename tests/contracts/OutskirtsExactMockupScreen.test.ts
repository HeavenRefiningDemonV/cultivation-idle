import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('OutskirtsExactMockupScreen renders from one supplied surface object only', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  [
    'outskirts-exact-mockup-screen',
    'outskirts-exact-header',
    'outskirts-exact-top-progress',
    'outskirts-exact-tactical-strip',
    'outskirts-exact-area-plaque',
    'outskirts-exact-subtitle',
    'outskirts-exact-setup-card',
    'outskirts-exact-rewards-card',
    'outskirts-exact-encounter-hero',
    'outskirts-exact-encounter-chain',
    'outskirts-exact-action-zone',
    'outskirts-exact-grind-summary',
    'outskirts-exact-shell-flags',
  ].forEach((token) => assert.match(html, new RegExp(token)));
});

void test('OutskirtsExactMockupScreen tolerates placeholder asset keys and fallback values', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    scenicArtKey: 'placeholder/encounter/any',
    scenicBackgroundKey: 'placeholder/scenic/any',
    medicinePouchLabel: null,
    bountyLabel: null,
  }));

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.match(html, /No medicine pouch configured/);
  assert.match(html, /No tracked bounty selected/);
});
