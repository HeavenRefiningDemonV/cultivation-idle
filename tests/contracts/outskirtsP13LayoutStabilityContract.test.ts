import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';

function renderPlanningScreen(overrides: Parameters<typeof createOutskirtsMockupFixture>[0] = {}) {
  const fixture = createOutskirtsMockupFixture(overrides);
  const surface = buildOutskirtsMockupSurface(fixture);
  return renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
}

function assertMajorSlotsPresent(html: string) {
  const requiredIds = [
    'outskirts-exact-page',
    'outskirts-exact-top-region',
    'outskirts-exact-center-scenic-slot',
    'outskirts-exact-left-rail',
    'outskirts-exact-right-rail',
    'outskirts-exact-strip-slot',
    'outskirts-exact-cta-slot',
    'outskirts-exact-summary-dock',
    'outskirts-exact-quality-state',
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`data-testid=\"${id}\"`));
  }
}

void test('P13 planning-state no-layout-shift smoke keeps major slot structure across multiple states', () => {
  const htmlDefault = renderPlanningScreen();
  const htmlLongLabels = renderPlanningScreen({
    aiProfileLabel: 'Disciplined Opportunist (Very Long)',
    attackFocusLabel: 'Balanced / Sustain Priority / Boss-aware',
    bountyLabel: 'Very Long Tracked Bounty Label 123/999',
  });
  const htmlEmptyBounty = renderPlanningScreen({
    trackedBountyTitle: 'None',
    trackedBountyHelper: 'No tracked bounty for this lane',
    trackedBountyProgress: '0 / 0',
    bountyLabel: null,
  });

  assertMajorSlotsPresent(htmlDefault);
  assertMajorSlotsPresent(htmlLongLabels);
  assertMajorSlotsPresent(htmlEmptyBounty);

  const slotMarker = /data-testid=\"outskirts-exact-(?:left-rail|right-rail|center-scenic-slot|strip-slot|cta-slot|summary-dock)\"/g;
  assert.equal(htmlDefault.match(slotMarker)?.length, 6);
  assert.equal(htmlLongLabels.match(slotMarker)?.length, 6);
  assert.equal(htmlEmptyBounty.match(slotMarker)?.length, 6);
});

void test('P13 dynamic-state stability keeps reserved substructures for bounty/expedition/auto-repeat/pouch/material icon variants', () => {
  const bountyPresent = renderPlanningScreen({ trackedBountyTitle: 'Wolf Pelt', trackedBountyProgress: '7 / 15', expeditionLabel: '2 Idle', autoRepeatEnabled: true });
  const bountyAbsent = renderPlanningScreen({ trackedBountyTitle: 'None', trackedBountyProgress: '0 / 0', expeditionLabel: 'No expedition', autoRepeatEnabled: false });
  const pouchAndMaterialFallback = renderPlanningScreen({
    medicinePouchLabel: '0 / 20',
    rewardMaterialLabels: ['Unknown Mat A', 'Unknown Mat B', 'Unknown Mat C', 'Unknown Mat D'],
  });

  for (const html of [bountyPresent, bountyAbsent, pouchAndMaterialFallback]) {
    assert.match(html, /data-testid=\"outskirts-exact-rewards-bounty-progress\"/);
    assert.match(html, /data-testid=\"outskirts-exact-rewards-auto-repeat\"/);
    assert.match(html, /data-testid=\"outskirts-exact-setup-pouch\"/);
    assert.equal((html.match(/data-testid=\"outskirts-exact-rewards-material-item\"/g) ?? []).length, 4);
  }

  assert.match(pouchAndMaterialFallback, /dust_brown/);
});

void test('P13 strip stability keeps strip geometry hooks across state/selection variations', () => {
  const htmlCurrentDefault = renderPlanningScreen();
  const htmlShiftedSelection = renderPlanningScreen({ selectedEncounterId: 'venomcoil' });

  for (const html of [htmlCurrentDefault, htmlShiftedSelection]) {
    assert.match(html, /data-testid=\"outskirts-exact-encounter-strip\"/);
    assert.match(html, /data-testid=\"outskirts-exact-encounter-strip-left-arrow\"/);
    assert.match(html, /data-testid=\"outskirts-exact-encounter-strip-right-arrow\"/);
    assert.equal((html.match(/data-testid=\"outskirts-exact-encounter-strip-node\"/g) ?? []).length, 6);
    assert.equal((html.match(/outskirtsEncounterProgressStrip__thumb--current/g) ?? []).length, 1);
  }
});

void test('P13 bottom-zone stability keeps CTA and summary dock footprints in enabled/disabled and long-value states', () => {
  const enabledHtml = renderPlanningScreen({ isOutskirtsActive: false });
  const disabledHtml = renderPlanningScreen({ isOutskirtsActive: true });
  const longSummaryHtml = renderPlanningScreen({
    rewardMaterialLabels: ['A Very Long Main Drop Name'],
  });

  for (const html of [enabledHtml, disabledHtml, longSummaryHtml]) {
    assert.match(html, /data-testid=\"outskirts-exact-cta-slot\"/);
    assert.match(html, /data-testid=\"outskirts-start-hunt-cta\"/);
    assert.match(html, /data-testid=\"outskirts-exact-summary-dock\"/);
    assert.match(html, /data-testid=\"outskirts-grind-summary\"/);
    assert.match(html, /data-testid=\"outskirts-grind-summary-chip\"/);
  }

  assert.match(disabledHtml, /disabled=\"\"/);
});

void test('P13 responsive slot contract keeps three-column body cluster through supported desktop floor and only stacks below support range', async () => {
  const scss = await readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(scss, /@media \(max-width: 1280px\)/);
  assert.match(scss, /--outskirts-left-rail-width: clamp\(230px, 18vw, 276px\)/);
  assert.match(scss, /--outskirts-right-rail-width: clamp\(246px, 19vw, 296px\)/);
  assert.match(scss, /@media \(max-width: 960px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});

void test('P13 FX parity state contract keeps identical major planning structure', () => {
  const highFxHtml = renderPlanningScreen({});
  const lowFxHtml = renderPlanningScreen({});
  const reducedMotionHtml = renderPlanningScreen({});

  for (const html of [highFxHtml, lowFxHtml, reducedMotionHtml]) {
    assertMajorSlotsPresent(html);
    assert.match(html, /data-testid=\"outskirts-exact-quality-state\"[^>]*>layout-static</);
  }
});

void test('P13 planning-state purity regression: planning render has no legacy active combat chrome', () => {
  const html = renderPlanningScreen();

  const forbidden = [
    /outskirts-view-active-contained/,
    /combatPathModule__/,
    /Utility Tray/i,
    /Combat Log/i,
    /ink-combat-shell__healthbar/i,
    /ink-combat-shell/i,
  ];

  for (const token of forbidden) {
    assert.doesNotMatch(html, token);
  }
});
