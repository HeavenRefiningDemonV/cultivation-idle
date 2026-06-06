import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsExactMockupScreen } from '../../src/features/world/ruinsExact/RuinsExactMockupScreen.js';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('ruins exact css polish contract owns exact layout and excludes legacy tokens', () => {
  const scss = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  for (const token of ['.ruinsExactPage', 'display: grid', 'grid-template-rows: auto minmax(0, 1fr)', '.ruinsExactPage__bodyCluster', 'grid-template-columns: var(--ruins-left-rail-width) minmax(0, 1fr) var(--ruins-right-rail-width)', "grid-template-areas: 'left . right' 'left scenic right' 'left . summary' 'left route summary' '. cta summary'", '.ruinsExactPage__centerScenic', '.ruinsTargetedMaterialsCard', '.ruinsRoomRouteStrip', '.ruinsPrimaryCta', '.ruinsExplorationSummaryCard', '.ruinsTopRegion__tacticalIconDock', '.ruinsTopRegion__tacticalIcon', '.ruinsTopRegion__tacticalText', '.ruinsTopRegion__tacticalAdornment', '.ruinsTopRegion__tacticalDotDock', '--ruins-page-inline-padding', '--ruins-page-block-padding', '--ruins-left-rail-width', '--ruins-right-rail-width', '--ruins-rail-gap', '--ruins-body-scene-top-offset', '--ruins-scenic-height', '--ruins-route-row-height', '--ruins-cta-row-height', '--ruins-lower-stack-spacer-min', '--ruins-lower-stack-spacer-flex', '--ruins-plaque-clearance', '--ruins-route-title-clearance', '--ruins-left-card-height', '--ruins-right-card-height', '--ruins-summary-width', '--ruins-summary-height', '--ruins-summary-drop-offset', 'grid-template-rows: var(--ruins-body-scene-top-offset) var(--ruins-scenic-height) var(--ruins-lower-stack-spacer-flex) var(--ruins-route-row-height) var(--ruins-cta-row-height)', 'min-width: 0', 'overflow: hidden', 'text-overflow: ellipsis', '@media (max-width: 1600px)', '@media (max-width: 1400px)', 'aspect-ratio:1/1', '.ruinsKitCard__statRow', '.ruinsKitCard__section--offense', '.ruinsKitCard__section--defense', '.ruinsTopRegion__plaqueCluster', '.ruinsExactPage__routeSlot']) {
    assert.equal(scss.includes(token), true);
  }
  for (const tacticalGuard of ['.ruinsTopRegion__tacticalIcon {', 'width:clamp(16px,1.05vw,20px)', 'height:clamp(16px,1.05vw,20px)', 'max-width:clamp(16px,1.05vw,20px)', 'max-height:clamp(16px,1.05vw,20px)', 'object-fit:contain', '.ruinsTopRegion__tacticalIconDock {', 'width:clamp(24px,1.55vw,30px)', 'height:clamp(24px,1.55vw,30px)', '.ruinsTopRegion__tacticalStrip', 'max-height:clamp(54px,5.9vh,66px)']) {
    assert.equal(scss.includes(tacticalGuard), true);
  }
  for (const imageGuard of ['.ruinsKitCard__equipmentIcon', '.ruinsTargetedMaterialsCard__tileIcon', '.ruinsTargetedMaterialsCard__anchorIcon', '.ruinsExplorationSummaryCard__iconDock img', 'object-fit:contain']) {
    assert.equal(scss.includes(imageGuard), true);
  }
  assert.match(scss, /\.ruinsRoomRouteStrip__nodes\s*\{[^}]*list-style:none;/);
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
  const screenSource = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.ts', 'utf8');
  for (const forbidden of ['CombatModuleTopLane', 'RuinsProgress', 'RuinsCtaZone', 'RuinsSummaryCard']) {
    assert.equal(screenSource.includes(forbidden), false);
  }
});
