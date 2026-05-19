import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildApothecaryExactPackagePlan } from '../../src/features/apothecary/exact/apothecaryExactPackagePlanner.js';
import type { ApothecaryExactSurfaceV1 } from '../../src/features/apothecary/exact/apothecaryExactTypes.js';

const builderSource = () => readFileSync('src/features/apothecary/exact/buildApothecaryExactSurface.ts', 'utf8');

void test('Apothecary Exact fixture source locks meta, shell, header, and prep strip copy', () => {
  const source = builderSource();

  for (const required of [
    "surfaceId: 'apothecary-exact'",
    "mode: 'fixture'",
    "source: 'fixture'",
    'useScreenOwnedExactPage: true',
    'showLegacyTabs: false',
    'showLegacyContextStrip: false',
    'singleDominantCta: true',
    "title: APOTHECARY_EXACT_COPY.title",
    "purpose: APOTHECARY_EXACT_COPY.purpose",
    "cityStatus: APOTHECARY_EXACT_COPY.cityStatus",
  ]) {
    assert.equal(source.includes(required), true, `fixture source missing ${required}`);
  }

  const presentation = readFileSync('src/features/apothecary/exact/apothecaryExactPresentation.ts', 'utf8');
  for (const required of [
    "title: 'Apothecary'",
    "purpose: 'Use gold and reagents to prepare the next serious attempt.'",
    "targetGate: 'Foundation Gate'",
    "prescriptionTitle: 'Prescription for Foundation Gate'",
    "prescriptionSubtitle: 'Recommended stock before attempting the gate.'",
    "cta: 'Prepare Foundation Package'",
    "returnGate: 'Return to Gate Trial'",
    "value: '74 / 100'",
    "value: '8 / 12'",
    "value: '0 / 2'",
    "value: '3 / 5 Set'",
    "value: '610'",
    "value: 'Idle'",
  ]) {
    assert.equal(presentation.includes(required), true, `presentation missing ${required}`);
  }
});

void test('Apothecary Exact fixture source locks prescription, warning, lane, pouch, and bottom copy', () => {
  const source = builderSource();

  for (const required of [
    "itemName: 'Healing Pellet', owned: '8', recommended: '12', missing: '4'",
    "itemName: 'Ward Salt', owned: '0', recommended: '2', missing: '2'",
    "itemName: 'Focus Dew', owned: '1', recommended: '3', missing: '2'",
    "itemName: 'Meridian Tea', owned: '0', recommended: '1', missing: '\\u2014'",
    "label: 'Healing below floor'",
    "label: 'No city specialty stock'",
    "label: 'Medicine pouch underfilled'",
    "title: 'Buy Stock'",
    "title: 'Brew Remedies'",
    "subtitle: '3 / 5 slots configured'",
    "value: 'triggers below 45% HP'",
    "value: 'Focus Dew, boss-only'",
    "value: 'Underfilled'",
    "'Buy Missing'",
    "'Brew Missing'",
    "'Source Ingredients'",
    "value: 'Stock Healing'",
    "value: 'Risky'",
  ]) {
    assert.equal(source.includes(required), true, `fixture source missing ${required}`);
  }
});

void test('Apothecary Exact planner computes the full dry-run missing summary', () => {
  const action = (id: string, intent: 'buy-row' | 'brew-row' | 'source-row', enabled = true) => ({
    id,
    label: intent === 'source-row' ? 'Source' : intent === 'brew-row' ? 'Brew' : 'Buy',
    ariaLabel: id,
    intent,
    enabled,
    tone: 'neutral' as const,
    itemId: id,
    itemName: id.includes('healing') ? 'Healing Pellet' : id.includes('ward') ? 'Ward Salt' : 'Focus Dew',
    qty: 1,
  });
  const surface = {
    meta: { targetGateLabel: 'Foundation Gate' },
    prescription: {
      rows: [
        { id: 'healing', itemId: 'healing', itemName: 'Healing Pellet', ownedLabel: '8', recommendedLabel: '12', missingQty: 4, optional: false, actions: [action('healing.buy', 'buy-row'), action('healing.brew', 'brew-row', false), action('healing.source', 'source-row')] },
        { id: 'ward', itemId: 'ward', itemName: 'Ward Salt', ownedLabel: '0', recommendedLabel: '2', missingQty: 2, optional: false, actions: [action('ward.buy', 'buy-row'), action('ward.brew', 'brew-row'), action('ward.source', 'source-row')] },
        { id: 'focus', itemId: 'focus', itemName: 'Focus Dew', ownedLabel: '1', recommendedLabel: '3', missingQty: 2, optional: false, actions: [action('focus.buy', 'buy-row'), action('focus.brew', 'brew-row', false), action('focus.source', 'source-row')] },
        { id: 'tea', itemId: 'tea', itemName: 'Meridian Tea (Optional)', ownedLabel: '0', recommendedLabel: '1', missingQty: 0, optional: true, actions: [action('tea.buy', 'buy-row', false), action('tea.brew', 'brew-row', false), action('tea.source', 'source-row', false)] },
      ],
    },
    buyLane: { rows: [{ action: action('healing.buyLane', 'buy-row') }] },
    brewLane: { rows: [{ itemId: 'ward', ingredientLabel: 'Ingredients Ready', action: action('ward.brewLane', 'brew-row') }] },
    bottomActions: [],
    pouchCard: { lines: [{ id: 'gate-fit', label: 'Gate Fit', value: 'Underfilled' }] },
  } as unknown as ApothecaryExactSurfaceV1;

  const plan = buildApothecaryExactPackagePlan(surface);
  assert.equal(plan.targetLabel, 'Foundation Gate');
  assert.equal(plan.status, 'partially-actionable');
  assert.equal(plan.nextFix, 'stock-healing');
  assert.equal(plan.missingSummary, '4 Healing \u00b7 2 Ward Salt \u00b7 2 Focus Dew \u00b7 Pouch Slots');
  assert.equal(plan.canExecuteSafely, true);
});
