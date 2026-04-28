import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { buildOutskirtsCombatStageChips } from '../../src/features/world/outskirts/outskirtsCombatChips.js';

function sectionFromTestId(html: string, testId: string): string | null {
  const token = `data-testid="${testId}"`;
  const start = html.indexOf(token);
  if (start < 0) return null;
  const end = html.indexOf('</', start);
  if (end < 0) return html.slice(start);
  return html.slice(start, end + 2);
}

void test('C6 Test A: planning mode does not render combat chips', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-chips"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-chip"'), false);
});

void test('C6 Test B: active fixture renders chips inside chips layer', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-chips"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-chips"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-chip"'), true);

  const chipsLayerIndex = html.indexOf('data-testid="outskirts-combat-theater-layer-chips"');
  const chipsIndex = html.indexOf('data-testid="outskirts-combat-chips"');
  assert.equal(chipsLayerIndex >= 0 && chipsIndex > chipsLayerIndex, true);

  const rightRail = sectionFromTestId(html, 'outskirts-exact-right-rail') ?? '';
  const leftRail = sectionFromTestId(html, 'outskirts-exact-left-rail') ?? '';
  const cta = sectionFromTestId(html, 'outskirts-exact-cta-slot') ?? '';
  const strip = sectionFromTestId(html, 'outskirts-exact-strip-slot') ?? '';
  for (const section of [rightRail, leftRail, cta, strip]) {
    assert.equal(section.includes('data-testid="outskirts-combat-chips"'), false);
  }
});

void test('C6 Test C: active fixture chip labels match mockup exactly', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const labels = surface.combatStage.chips.slice(0, 5).map((chip) => chip.label);
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.deepEqual(labels, ['AI: Balanced', 'Auto-use On', 'Boss in 6', 'Iron Palm Ready', 'Wind Step 2.1s']);
  assert.equal((html.match(/data-testid="outskirts-combat-chip"/g) ?? []).length, 5);
});

void test('C6 Test D: active fixture chip tones match model', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const tones = surface.combatStage.chips.slice(0, 5).map((chip) => chip.tone);
  assert.deepEqual(tones, ['neutral', 'ready', 'neutral', 'ready', 'cooldown']);
});

void test('C6 Test E: pure helper builds live AI/auto/boss/tech chips', () => {
  const now = Date.now();
  const chips = buildOutskirtsCombatStageChips({
    aiProfileLabel: 'Balanced',
    autoUseEnabled: true,
    isBossFight: false,
    killsToBoss: 8,
    killsSinceBoss: 2,
    activeTechniques: [
      { id: 'iron-palm', name: 'Iron Palm', readyAt: null },
      { id: 'wind-step', name: 'Wind Step', readyAt: now + 2100 },
    ],
    now,
  });

  assert.deepEqual(chips.map((chip) => chip.label), ['AI: Balanced', 'Auto-use On', 'Boss in 6', 'Iron Palm Ready', 'Wind Step 2.1s']);
  assert.equal(chips.length <= 5, true);
});

void test('C6 Test F: boss fight and auto-use off tones', () => {
  const chips = buildOutskirtsCombatStageChips({
    aiProfileLabel: 'Balanced',
    autoUseEnabled: false,
    isBossFight: true,
    killsToBoss: 10,
    killsSinceBoss: 10,
    activeTechniques: [],
    now: Date.now(),
  });

  assert.equal(chips[1]?.label, 'Auto-use Off');
  assert.equal(chips[1]?.tone, 'warning');
  assert.equal(chips[2]?.label, 'Boss fight');
  assert.equal(chips[2]?.tone, 'warning');
});

void test('C6 Test G: more than two active techniques are capped', () => {
  const now = Date.now();
  const chips = buildOutskirtsCombatStageChips({
    aiProfileLabel: 'Balanced',
    autoUseEnabled: true,
    isBossFight: false,
    killsToBoss: 10,
    killsSinceBoss: 4,
    activeTechniques: [
      { id: 'tech-a', name: 'Tech A', readyAt: null },
      { id: 'tech-b', name: 'Tech B', readyAt: now + 1500 },
      { id: 'tech-c', name: 'Tech C', readyAt: now + 1500 },
      { id: 'tech-d', name: 'Tech D', readyAt: null },
    ],
    now,
  });

  assert.equal(chips.length, 5);
  assert.equal(chips.some((chip) => chip.label.startsWith('Tech A')), true);
  assert.equal(chips.some((chip) => chip.label.startsWith('Tech B')), true);
  assert.equal(chips.some((chip) => chip.label.startsWith('Tech C')), false);
  assert.equal(chips.some((chip) => chip.label.includes('more')), false);
});

void test('C6 Test H: shell flags after C6', () => {
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
  assert.equal(planningSurface.shell.showFloatingDamage, false);
  assert.equal(planningSurface.shell.showCombatLog, false);
  assert.equal(planningSurface.shell.showCombatChips, false);
});

void test('C6 Test I: right rewards rail remains rewards rail', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Expected Rewards'), true);
  assert.equal(html.includes('Gold'), true);
  assert.equal(html.includes('Common Materials'), true);
  assert.equal(html.includes('Tracked Bounty'), true);

  const rightRail = sectionFromTestId(html, 'outskirts-exact-right-rail') ?? '';
  assert.equal(rightRail.includes('data-testid="outskirts-combat-chips"'), false);
  assert.equal(rightRail.includes('data-testid="outskirts-combat-chip"'), false);
});

void test('C6 Test J: no old combat options or utility tray', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const forbidden of [
    'combat-options',
    'utilityTrayShell',
    'InkCombatShell',
    'InkHealthBar',
    'CombatModuleTopLane',
    'OutskirtsLegacyActiveSurface',
    'enemy-hit-text',
    'images-div',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C6 Test K: no premature result overlay', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-result"'), true);
  for (const forbidden of [
    'data-testid="outskirts-combat-result-overlay"',
    'data-testid="outskirts-combat-victory-seal"',
    'data-testid="outskirts-combat-defeat-seal"',
    'Victory',
    'Defeat',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C6 Test L: CSS guard', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  for (const token of [
    '.outskirtsCombatTheater__chipsLayer',
    '.outskirtsCombatChips',
    '.outskirtsCombatChips__chip',
    '.outskirtsCombatChips__chip--neutral',
    '.outskirtsCombatChips__chip--ready',
    '.outskirtsCombatChips__chip--cooldown',
    '.outskirtsCombatChips__chip--warning',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    assert.equal(css.includes(token), true);
  }

  assert.match(css, /\.outskirtsCombatTheater__chipsLayer\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.outskirtsCombatTheater__chipsLayer\s*\{[\s\S]*pointer-events:\s*none;/);
});
