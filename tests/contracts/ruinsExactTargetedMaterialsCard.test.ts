import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsTargetedMaterialsCard } from '../../src/features/world/ruinsExact/components/RuinsTargetedMaterialsCard.js';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('targeted materials fixture card renders contract copy', () => {
  const card = createRuinsExactMockupFixture().targetedMaterialsCard;
  const html = renderToStaticMarkup(React.createElement(RuinsTargetedMaterialsCard, { card }));
  for (const copy of ['Targeted Materials', 'Lead Materials', 'Spirit Leaf', 'Beast Materials', 'Guaranteed Anchor', 'Core Fragment x1', 'Final Chest', 'Rare Pity', '1 / 6', 'Auto-Repeat', 'Off', 'Repeats after Final Chest', 'Best used for targeted local materials, not gold.']) assert.equal(html.includes(copy), true);
  assert.equal((html.match(/ruins-exact-lead-material-tile/g) ?? []).length, 2);
  assert.equal((html.match(/ruins-exact-rare-pity-dot/g) ?? []).length, 6);
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
