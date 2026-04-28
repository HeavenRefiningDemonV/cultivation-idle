import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';

void test('C3 Test A: planning mode does not render health bars', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="planning"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-health-bars"'), false);
});

void test('C3 Test B: active mode renders health bars in theater hp layer', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-hp"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-health-bars"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-health-player"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-health-enemy"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-versus-seal"'), true);
});

void test('C3 Test C: active fixture values and fill widths render from combatStage', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const expected of ['Cultivator', '131 / 131', 'Snarling Wolf', 'Lv. 11', '78 / 126']) {
    assert.equal(html.includes(expected), true);
  }

  assert.match(html, /width:\s*100%/);
  assert.match(html, /width:\s*61\.9/);
});

void test('C3 Test D: shell flags are correct in active and planning', () => {
  const activeSurface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(activeSurface.shell.showCombatTheater, true);
  assert.equal(activeSurface.shell.showCombatHpBars, true);
  assert.equal(activeSurface.shell.showCombatActors, true);
  assert.equal(activeSurface.shell.showFloatingDamage, true);
  assert.equal(activeSurface.shell.showCombatLog, true);
  assert.equal(activeSurface.shell.showCombatChips, true);
  assert.equal(activeSurface.shell.showCombatOptions, false);
  assert.equal(activeSurface.shell.showCombatModuleTopLane, false);
  assert.equal(activeSurface.shell.showSummaryRail, false);
  assert.equal(activeSurface.shell.showUtilityTray, false);

  const planningSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  assert.equal(planningSurface.shell.showCombatTheater, false);
  assert.equal(planningSurface.shell.showCombatHpBars, false);
  assert.equal(planningSurface.shell.showCombatActors, false);
});

void test('C3 Test E: source guard for forbidden imports/tokens', async () => {
  const files = await Promise.all([
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatHealthBars.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatTheater.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCenterStage.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
  ]);

  for (const source of files) {
    for (const forbidden of ['InkHealthBar', 'InkCombatShell', 'OutskirtsLegacyActiveSurface', 'OutskirtsActiveContainment', 'CombatModuleTopLane']) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C3 Test F: css guard for hp layer + health bars + reduced motion transition disable', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  for (const expected of [
    '.outskirtsCombatTheater__hpLayer',
    '.outskirtsCombatHealthBars',
    '.outskirtsCombatHealthBars__unit--player',
    '.outskirtsCombatHealthBars__unit--enemy',
    '.outskirtsCombatHealthBars__versus',
    '.outskirtsCombatHealthBars__fill--player',
    '.outskirtsCombatHealthBars__fill--enemy',
  ]) {
    assert.equal(css.includes(expected), true);
  }

  assert.match(css, /\.outskirtsCombatTheater__hpLayer\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.outskirtsCombatTheater__hpLayer\s*\{[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /\.outskirtsCombatHealthBars\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.outskirtsCombatHealthBars\s*\{[\s\S]*inset:\s*0;/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.outskirtsCombatHealthBars__fill\s*\{[\s\S]*transition:\s*none\s*!important;/);
});

void test('C3 Test G: active output does not include later packet visible content', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const forbidden of [
    'data-testid="outskirts-combat-result-overlay"',
    'data-testid="outskirts-combat-victory-seal"',
    'data-testid="outskirts-combat-defeat-seal"',
    'enemy-hit-text',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});
