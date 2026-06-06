import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
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


void test('ruins exact scenic stage source guard has no forbidden scenic imports', () => {
  const screenSource = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.ts', 'utf8');
  const scenicSource = readFileSync('src/features/world/ruinsExact/components/RuinsScenicStage.ts', 'utf8');
  assert.equal(screenSource.includes('RuinsScenicStage'), true);
  assert.equal(screenSource.includes('ruins-exact-center-scenic-slot'), true);
  assert.equal(screenSource.includes('RuinsSummaryCard'), false);
  assert.equal(screenSource.includes('RuinsProgress'), false);
  assert.equal(screenSource.includes('RuinsCtaZone'), false);
  assert.equal(screenSource.includes('CombatModuleTopLane'), false);
  assert.equal(screenSource.includes('InkCombatShell'), false);
  assert.equal(scenicSource.includes('ruins-exact-scenic-stage'), true);
  assert.equal(scenicSource.includes('ruins-exact-scenic-frame'), true);
  assert.equal(scenicSource.includes('ruins-exact-scenic-plate'), true);
  for (const forbidden of ['city_ruins.png', 'InsideDungeon', 'combatPathModule', 'OutskirtsScenicStage', 'Art pending', 'Image missing']) {
    assert.equal(scenicSource.includes(forbidden), false);
  }
});

void test('ruins exact right rail renders targeted materials card contract', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  for (const token of ['ruins-exact-targeted-materials-card','ruins-exact-targeted-materials-title','ruins-exact-guaranteed-anchor','ruins-exact-rare-pity','ruins-exact-auto-repeat','ruins-exact-targeted-materials-footer']) assert.equal(html.includes(token), true);
});

void test('ruins exact right rail source does not import legacy summary path', () => {
  const screenSourceRight = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.ts', 'utf8');
  for (const forbidden of ['RuinsSummaryCard', 'TrackedBountyProgressLine', 'RuinsProgress', 'RuinsCtaZone', 'CombatModuleTopLane']) assert.equal(screenSourceRight.includes(forbidden), false);
});
