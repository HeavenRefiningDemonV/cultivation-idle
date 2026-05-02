import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsTargetedMaterialsCard } from '../../src/features/world/ruinsExact/components/RuinsTargetedMaterialsCard.js';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { readFileSync } from 'node:fs';

void test('targeted materials fixture card renders contract copy', () => {
  const card = createRuinsExactMockupFixture().targetedMaterialsCard;
  const html = renderToStaticMarkup(React.createElement(RuinsTargetedMaterialsCard, { card }));
  for (const copy of ['Targeted Materials', 'Lead Materials', 'Spirit Leaf', 'Beast Materials', 'Guaranteed Anchor', 'Core Fragment x1', 'Final Chest', 'Rare Pity', '1 / 6', 'Auto-Repeat', 'Off', 'Repeats after Final Chest', 'Best used for targeted local materials, not gold.']) assert.equal(html.includes(copy), true);
  assert.equal((html.match(/ruins-exact-lead-material-tile/g) ?? []).length, 2);
  assert.equal((html.match(/ruins-exact-rare-pity-dot/g) ?? []).length, 6);
  assert.equal((html.match(/ruinsTargetedMaterialsCard__pityDot is-filled/g) ?? []).length, 1);
  assert.equal(html.includes('ruins-exact-targeted-materials-footer'), true);
  assert.equal(html.includes('ruinsTargetedMaterialsCard__seal'), true);
  for (const forbidden of ['Expected Rewards', 'RuinsSummaryCard']) assert.equal(html.includes(forbidden), false);
});

void test('targeted materials live card derives pity and auto-repeat from live state', () => {
  const surface = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(surface.targetedMaterialsCard.title, 'Targeted Materials');
  assert.equal(surface.targetedMaterialsCard.leadMaterials[0].label.includes('Spirit'), true);
  assert.equal(surface.targetedMaterialsCard.leadMaterials[1].label, 'Beast Materials');
  assert.equal(surface.targetedMaterialsCard.guaranteedAnchor.sourceLabel, 'Final Chest');
  assert.equal(typeof surface.targetedMaterialsCard.rarePity.valueText, 'string');
  assert.equal(surface.targetedMaterialsCard.autoRepeat.valueText === 'On' || surface.targetedMaterialsCard.autoRepeat.valueText === 'Off', true);
});


void test('targeted materials css contract keeps right-card parity selectors and image constraints', () => {
  const scss = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  for (const selector of ['.ruinsTargetedMaterialsCard','.ruinsTargetedMaterialsCard__title','.ruinsTargetedMaterialsCard__divider','.ruinsTargetedMaterialsCard__sectionTitle','.ruinsTargetedMaterialsCard__leadMaterials','.ruinsTargetedMaterialsCard__tile','.ruinsTargetedMaterialsCard__tile--leaf','.ruinsTargetedMaterialsCard__tile--beast','.ruinsTargetedMaterialsCard__tileIcon','.ruinsTargetedMaterialsCard__tileLabel','.ruinsTargetedMaterialsCard__anchor','.ruinsTargetedMaterialsCard__anchorIconWrap','.ruinsTargetedMaterialsCard__anchorIcon','.ruinsTargetedMaterialsCard__anchorCopy','.ruinsTargetedMaterialsCard__pityDots','.ruinsTargetedMaterialsCard__pityDot','.ruinsTargetedMaterialsCard__pityDot.is-filled','.ruinsTargetedMaterialsCard__toggle','.ruinsTargetedMaterialsCard__toggle::before','.ruinsTargetedMaterialsCard__helper','.ruinsTargetedMaterialsCard__footer','.ruinsTargetedMaterialsCard__seal','.ruinsTargetedMaterialsCard__seal::after']) assert.equal(scss.includes(selector), true);
  for (const guard of ['.ruinsTargetedMaterialsCard__tileIcon','width:clamp(48px,3.25vw,64px)','height:clamp(48px,3.25vw,64px)','max-width:clamp(48px,3.25vw,64px)','max-height:clamp(48px,3.25vw,64px)','object-fit:contain','.ruinsTargetedMaterialsCard__anchorIcon','width:clamp(46px,3.35vw,60px)','height:clamp(46px,3.35vw,60px)','max-width:clamp(46px,3.35vw,60px)','max-height:clamp(46px,3.35vw,60px)']) assert.equal(scss.includes(guard), true);
});
