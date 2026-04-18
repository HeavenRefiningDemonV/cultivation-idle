import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('P4 planning surface renders scenic stage + encounter identity row with name/level/safe chip', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const count = (token: string) => (html.match(new RegExp(token, 'g')) ?? []).length;

  assert.equal(count('outskirts-exact-scenic-stage'), 1);
  assert.equal(count('outskirts-exact-encounter-identity-row'), 1);
  assert.equal(count('outskirts-exact-encounter-name'), 1);
  assert.equal(count('outskirts-exact-encounter-level'), 1);
  assert.equal(count('outskirts-exact-encounter-safe-chip'), 1);

  assert.match(html, /Field Patrol|Quiet Glade|Rockjaw Boar/);
  assert.match(html, /Lv\./);
  assert.match(html, /Safe|Watch|Risk/);
});

void test('P4 planning center excludes combat-theater ownership DNA', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('combatModuleTopLane'), false);
  assert.equal(html.includes('outskirts-combat__healthbars'), false);
  assert.equal(html.includes('enemy-image-wrapper'), false);
  assert.equal(html.includes('cultivator-image-wrapper'), false);
  assert.equal(html.includes('ink-combat-shell'), false);
});

void test('P4 scope guard keeps P5+ final-detail surfaces out of live exact planning owner', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(/data-testid="outskirts-exact-setup-card"/.test(html), false);
  assert.equal(/data-testid="outskirts-exact-rewards-card"/.test(html), false);
  assert.equal(/data-testid="outskirts-exact-encounter-chain"/.test(html), false);
  assert.equal(/data-testid="outskirts-exact-grind-summary"/.test(html), false);
});

void test('P4 preserves World -> WorldBuildingModal -> OutskirtsBuildingPanel route ownership', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);

  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  assert.match(panelSource, /data-testid="outskirts-planning-owner"/);
  assert.match(panelSource, /OutskirtsExactMockupScreen/);
});
