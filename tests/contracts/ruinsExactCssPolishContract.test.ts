import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsExactMockupScreen } from '../../src/features/world/ruinsExact/RuinsExactMockupScreen.js';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('ruins exact css polish contract owns exact layout and excludes legacy tokens', () => {
  const scss = readFileSync(new URL('../../src/features/world/ruinsExact/RuinsExactMockupScreen.scss', import.meta.url), 'utf8');
  for (const token of ['.ruinsExactPage', '.ruinsExactPage__bodyCluster', '.ruinsExactPage__centerScenic', '.ruinsTargetedMaterialsCard', '.ruinsRoomRouteStrip', '.ruinsPrimaryCta', '.ruinsExplorationSummaryCard', '.ruinsTopRegion__tacticalIconDock', '.ruinsTopRegion__tacticalIcon', '.ruinsTopRegion__tacticalText', '.ruinsTopRegion__tacticalAdornment', '.ruinsTopRegion__tacticalDotDock', '--ruins-page-inline-padding', '--ruins-page-block-padding', '--ruins-left-rail-width', '--ruins-right-rail-width', '--ruins-rail-gap', '--ruins-scenic-min-height', '--ruins-route-row-min-height', '--ruins-cta-row-min-height', '--ruins-summary-row-min-height', 'grid-template-areas', 'min-width: 0', 'overflow: hidden', 'text-overflow: ellipsis', '@media (max-width: 1600px)', '@media (max-width: 1400px)', 'aspect-ratio: 1 / 1']) {
    assert.equal(scss.includes(token), true);
  }
  for (const tacticalGuard of ['.ruinsTopRegion__tacticalIcon {', 'width:20px', 'height:20px', 'max-width:20px', 'max-height:20px', 'object-fit:contain', '.ruinsTopRegion__tacticalIconDock {', 'width:28px', 'height:28px', '.ruinsTopRegion__tacticalStrip', 'max-height:clamp(54px,5.9vh,66px)']) {
    assert.equal(scss.includes(tacticalGuard), true);
  }
  for (const forbidden of ['CombatStyles', 'combatPathModule', 'ruinsPanel__', '.ruinsSummaryCard', '.ruinsCtaZone', '.ruinsProgress', 'InsideDungeon', '$ruins', '#{']) {
    assert.equal(scss.includes(forbidden), false);
  }
});

void test('ruins exact dom contract keeps exact slots and avoids legacy component tokens', () => {
  const html = renderToStaticMarkup(React.createElement(RuinsExactMockupScreen, { surface: createRuinsExactMockupFixture() }));
  for (const token of ['ruins-exact-page', 'ruins-exact-body-grid', 'ruins-exact-left-rail', 'ruins-exact-center-scenic-slot', 'ruins-exact-right-rail', 'ruins-exact-route-slot', 'ruins-exact-cta-slot', 'ruins-exact-summary-dock']) {
    assert.equal(html.includes(token), true);
  }
  for (const copy of ['Continue Exploration', 'Exploration Summary', 'Hollow Log Den Route', 'Targeted Materials']) {
    assert.equal((html.match(new RegExp(copy, 'g')) ?? []).length >= 1, true);
  }
  const screenSource = readFileSync(new URL('../../src/features/world/ruinsExact/RuinsExactMockupScreen.ts', import.meta.url), 'utf8');
  for (const forbidden of ['CombatModuleTopLane', 'RuinsProgress', 'RuinsCtaZone', 'RuinsSummaryCard']) {
    assert.equal(screenSource.includes(forbidden), false);
  }
});
