import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

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

void test('P4 page grid scaffold renders all required slots', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const required = [
    'outskirts-exact-body-grid',
    'outskirts-exact-left-rail-slot',
    'outskirts-exact-center-slot',
    'outskirts-exact-right-rail-slot',
    'outskirts-exact-strip-slot',
    'outskirts-exact-cta-slot',
    'outskirts-exact-summary-dock-slot',
  ];

  for (const token of required) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }
});

void test('P4 scaffold keeps centered lower-band region order', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const order = [
    'outskirts-exact-center-slot',
    'outskirts-exact-identity-slot',
    'outskirts-exact-strip-slot',
    'outskirts-exact-cta-slot',
  ];
  const idx = order.map((token) => html.indexOf(token));
  assert.equal(idx.every((value) => value >= 0), true);
  for (let i = 1; i < idx.length; i += 1) {
    assert.equal(idx[i] > idx[i - 1], true);
  }
});

void test('P4 geometry css no longer governed by old fixed small-rail/row literals', async () => {
  const source = await readFile(new URL('../../src/features/world/outskirts/OutskirtsExactMockupScreen.scss', import.meta.url), 'utf8');

  assert.equal(source.includes('grid-template-columns: 220px 28px minmax(0, 1fr) 28px 220px'), false);
  assert.equal(source.includes('grid-template-rows: 300px 40px 92px 78px'), false);
  assert.equal(source.includes('margin-left: calc(230px + 16px)'), false);
  assert.equal(source.includes('margin-left: 248px'), false);
  assert.equal(source.includes('margin-right: 220px'), false);

  assert.match(source, /--outskirts-left-rail-width:\s*clamp\(/);
  assert.match(source, /--outskirts-right-rail-width:\s*clamp\(/);
  assert.match(source, /--outskirts-scenic-min-height:\s*clamp\(/);
  assert.match(source, /grid-template-areas:/);
});

void test('P4 planning-state purity: screen markup still excludes combat-shell owners', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('ink-combat-shell__healthbar'), false);
  assert.equal(html.includes('ink-combat-shell__log'), false);
  assert.equal(html.includes('RunCompassCompact'), false);
});

void test('P4 route preservation: World modal route still mounts Outskirts planning owner', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');

  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(panelSource, /OutskirtsPlanningOwner/);
});
