import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('P3 planning surface mounts one exact top-region owner with required regions and slot scaffolds', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const count = (token: string) => (html.match(new RegExp(token, 'g')) ?? []).length;

  assert.equal(count('outskirts-exact-page-title'), 1);
  assert.equal(count('outskirts-exact-top-progress'), 1);
  assert.equal(count('outskirts-exact-tactical-strip'), 1);
  assert.equal(count('outskirts-exact-tactical-cell'), 7);
  assert.equal(count('outskirts-exact-area-plaque'), 1);
  assert.equal(count('outskirts-exact-subtitle'), 1);

  [
    'outskirts-exact-scenic-slot',
    'outskirts-exact-encounter-identity-slot',
    'outskirts-exact-setup-slot',
    'outskirts-exact-rewards-slot',
    'outskirts-exact-encounter-strip-slot',
    'outskirts-exact-cta-slot',
    'outskirts-exact-grind-summary-slot',
  ].forEach((token) => assert.equal(count(token), 1));
});

void test('P3 planning surface excludes old combat-shell visual owners', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('combatModuleTopLane'), false);
  assert.equal(html.includes('ink-combat-shell'), false);
  assert.equal(html.includes('outskirtsPanel__summary'), false);
});

void test('P3 preserves World -> WorldBuildingModal -> OutskirtsBuildingPanel route ownership', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
});
