import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { OutskirtsStartHuntCta } from '../../src/features/world/outskirts/components/OutskirtsStartHuntCta.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { formatOutskirtsElapsedClock } from '../../src/features/world/outskirts/outskirtsActivePresentation.js';

void test('C7 Test A: planning still renders planning identity and Grind Summary', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  assert.equal(surface.activeChainBadge.visible, false);
  assert.equal(surface.primaryAction.label, 'Start Hunt');
  assert.equal(surface.primaryAction.intent, 'start-hunt');
  assert.equal(surface.grindSummary.mode, 'grind');
  assert.equal(surface.grindSummary.title, 'Grind Summary');
  assert.equal(surface.grindSummary.scopeChipLabel, 'This Area');
  assert.equal(surface.encounterStrip.mode, 'preview');

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-exact-encounter-identity-row"'), true);
  assert.equal(html.includes('data-testid="outskirts-active-chain-badge"'), false);
  assert.equal(html.includes('data-testid="outskirts-grind-summary"'), true);
  assert.equal(html.includes('data-testid="outskirts-live-summary"'), false);
  assert.equal(html.includes('Start Hunt'), true);
  assert.equal(html.includes('Stop Hunt'), false);
});

void test('C7 Test B: active fixture renders chain badge exactly', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(surface.activeChainBadge.visible, true);
  assert.equal(surface.activeChainBadge.title, 'Quiet Glade Chain');
  assert.equal(surface.activeChainBadge.bossLabel, 'Boss in 6');
  assert.equal(surface.activeChainBadge.bossTone, 'neutral');

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-active-chain-badge"'), true);
  assert.equal(html.includes('data-testid="outskirts-active-chain-badge-title"'), true);
  assert.equal(html.includes('data-testid="outskirts-active-chain-badge-boss"'), true);
  assert.equal(html.includes('Quiet Glade Chain'), true);
  assert.equal(html.includes('Boss in 6'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-encounter-identity-row"'), false);
});

void test('C7 Test C: active fixture renders active hunt-chain strip', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(surface.encounterStrip.mode, 'active-chain');
  assert.equal(surface.encounterStrip.ariaLabel, 'Active Outskirts hunt chain');
  assert.equal(surface.encounterStrip.nodes.length, 7);
  assert.deepEqual(surface.encounterStrip.nodes.map((node) => node.label), [
    'Snarling Wolf', 'Unknown Foe', 'Unknown Foe', 'Unknown Foe', 'Unknown Foe', 'Boss', 'Unknown Foe',
  ]);
  assert.equal(surface.encounterStrip.nodes[0]?.state, 'current');
  assert.equal(surface.encounterStrip.nodes[0]?.isSelected, true);
  assert.equal(surface.encounterStrip.nodes.slice(1, 5).every((node) => node.medallionVariant === 'unknown-parchment'), true);
  assert.equal(surface.encounterStrip.nodes[5]?.medallionVariant, 'boss-gold');
  assert.equal(surface.encounterStrip.nodes.every((node) => node.isClickable === false), true);
  assert.equal(surface.encounterStrip.leftArrow.visible, true);
  assert.equal(surface.encounterStrip.leftArrow.enabled, false);
  assert.equal(surface.encounterStrip.rightArrow.visible, true);
  assert.equal(surface.encounterStrip.rightArrow.enabled, false);

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-strip-mode="active-chain"'), true);
  assert.equal(html.includes('?'), true);
  assert.equal(html.includes('Boss'), true);
});

void test('C7 Test D: active fixture renders Stop Hunt CTA only', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(surface.primaryAction.label, 'Stop Hunt');
  assert.equal(surface.primaryAction.intent, 'stop-hunt');
  assert.equal(surface.primaryAction.enabled, true);
  assert.equal(surface.primaryAction.singleDominantCta, true);

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-start-hunt-cta"'), true);
  assert.equal(html.includes('data-intent="stop-hunt"'), true);
  assert.equal(html.includes('Stop Hunt'), true);
  assert.equal(html.includes('Start Hunt'), false);
  assert.equal(html.includes('outskirtsStartHuntCta--stopHunt'), true);
});

void test('C7 Test E: active fixture renders Live Summary exactly', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(surface.grindSummary.mode, 'live');
  assert.equal(surface.grindSummary.title, 'Live Summary');
  assert.equal(surface.grindSummary.scopeChipLabel, '00:01:24');
  assert.deepEqual(surface.grindSummary.rows?.map((row) => `${row.label}:${row.value}`), [
    'Kills:2', 'Gold / hr:1,860', 'Main Drop:Wolf Pelt',
  ]);

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-live-summary"'), true);
  assert.equal(html.includes('data-summary-mode="live"'), true);
  assert.equal(html.includes('data-legacy-testid="outskirts-grind-summary"'), true);
  for (const token of ['Live Summary', '00:01:24', 'Kills', '2', 'Gold / hr', '1,860', 'Main Drop', 'Wolf Pelt']) {
    assert.equal(html.includes(token), true);
  }
});

void test('C7 Test F: elapsed formatter', () => {
  assert.equal(formatOutskirtsElapsedClock(-1), '00:00:00');
  assert.equal(formatOutskirtsElapsedClock(Number.NaN), '00:00:00');
  assert.equal(formatOutskirtsElapsedClock(0), '00:00:00');
  assert.equal(formatOutskirtsElapsedClock(84000), '00:01:24');
  assert.equal(formatOutskirtsElapsedClock(3661000), '01:01:01');
});

void test('C7 Test G: active Stop Hunt callback still uses primary action routing', () => {
  let primary = 0;
  let start = 0;
  const element = OutskirtsStartHuntCta({
    cta: {
      label: 'Stop Hunt',
      ariaLabel: 'Stop Outskirts hunt',
      visible: true,
      enabled: true,
      intent: 'stop-hunt',
      singleDominantCta: true,
      isPrimary: true,
    },
    onPrimaryAction: () => { primary += 1; },
    onStartHunt: () => { start += 1; },
  });
  element?.props.onClick?.();
  assert.equal(primary, 1);
  assert.equal(start, 0);
});

void test('C7 Test H: right rewards rail remains unchanged', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  for (const token of ['Expected Rewards', 'Common Materials', 'Tracked Bounty', 'Auto-Repeat']) {
    assert.equal(html.includes(token), true);
  }
  const rightStart = html.indexOf('data-testid="outskirts-exact-right-rail"');
  const rightSlice = rightStart >= 0 ? html.slice(rightStart, rightStart + 1400) : '';
  assert.equal(rightSlice.includes('data-testid="outskirts-live-summary"'), false);
  assert.equal(rightSlice.includes('data-testid="outskirts-active-chain-badge"'), false);
});

void test('C7 Test I: combat theater stack remains intact', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  for (const token of [
    'data-testid="outskirts-combat-theater"',
    'data-testid="outskirts-combat-health-bars"',
    'data-testid="outskirts-combat-actors"',
    'data-testid="outskirts-combat-floating-hits"',
    'data-testid="outskirts-combat-log-slip"',
    'data-testid="outskirts-combat-chips"',
  ]) {
    assert.equal(html.includes(token), true);
  }
});

void test('C7 Test J: no premature result overlay', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  for (const forbidden of [
    'data-testid="outskirts-combat-result-overlay"',
    'data-testid="outskirts-combat-victory-seal"',
    'data-testid="outskirts-combat-defeat-seal"',
    'Victory',
    'Defeat',
    'loot summary',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C7 Test K: legacy guard', async () => {
  const files = await Promise.all([
    fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsActiveChainBadge.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsEncounterProgressStrip.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsStartHuntCta.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsGrindSummaryCard.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8'),
    fs.readFile('src/features/world/outskirts/buildOutskirtsMockupSurface.ts', 'utf8'),
  ]);
  for (const source of files) {
    for (const forbidden of ['OutskirtsLegacyActiveSurface', 'InkCombatShell', 'InkHealthBar', 'CombatModuleTopLane', 'OutskirtsActiveContainment', 'CombatStyles.scss', 'utilityTrayShell', 'combat-options', 'images-div', 'enemy-hit-text']) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C7 Test L: CSS guard', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');
  for (const token of [
    '.outskirtsActiveChainBadge',
    '.outskirtsActiveChainBadge__plate',
    '.outskirtsActiveChainBadge__boss',
    '.outskirtsEncounterProgressStrip--active-chain',
    '.outskirtsEncounterProgressStrip__unknownMark',
    '.outskirtsEncounterProgressStrip__thumb--boss-gold',
    '.outskirtsStartHuntCta--stopHunt',
    '.outskirtsGrindSummaryCard--live',
    '.outskirtsExactPage__centerIdentity',
    '.outskirtsExactPage__summaryDock',
    "'leftRail'",
    "'rightRail'",
  ]) {
    assert.equal(css.includes(token), true);
  }
});
