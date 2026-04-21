import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('OutskirtsExactMockupScreen renders from v2 surface contract only', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirts-exact-page-title">Outskirts<'), true);
  assert.equal(html.includes('outskirts-exact-area-plaque">Outskirts<'), true);
  assert.equal(html.includes('outskirts-exact-subtitle">Gold and common materials<'), true);
  assert.equal(html.includes('Snarling Wolf'), true);
  assert.equal(html.includes('Lv. 11'), true);
  assert.equal(html.includes('Safe'), true);
  assert.equal(html.includes('Start Hunt'), true);
  assert.equal(html.includes('Grind Summary'), true);

  assert.equal(html.includes('Hunt Cadence'), false);
  assert.equal(html.includes('Boss in'), false);
  assert.equal(html.includes('cadenceSupport'), false);
});

void test('OutskirtsExactMockupScreen uses surface-provided region content', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    selectedEncounterName: 'Venomcoil',
    selectedEncounterLevelLabel: 'Lv. 13',
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Venomcoil'), true);
  assert.equal((html.match(/outskirts-rewards-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
});
