import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import {
  OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL,
  OUTSKIRTS_ALLOWED_PLANNING_SHELL,
} from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';

void test('C3 planning route keeps scenic stage and does not mount theater shell', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), {
    activityMode: 'planning',
  });

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="planning"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-health-bars"'), false);
});

void test('C3 active route mounts theater shell and hp bars while leaving later layers empty', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: true }), {
    activityMode: 'active',
  });

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="active"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-hp"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-health-bars"'), true);

  for (const emptyLayerToken of [
    'data-testid="outskirts-combat-theater-layer-actors"',
    'data-testid="outskirts-combat-theater-layer-effects"',
    'data-testid="outskirts-combat-theater-layer-chips"',
    'data-testid="outskirts-combat-theater-layer-log"',
  ]) {
    assert.equal(html.includes(emptyLayerToken), true);
  }

  for (const forbidden of [
    'data-testid="outskirts-combat-log-slip"',
    'data-testid="outskirts-combat-chips"',
    'data-testid="outskirts-combat-actors"',
    'floating-hit',
    'enemy-hit-text',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C3 shell contract enables hp bars only for active', () => {
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatTheater, true);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatHpBars, true);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showFloatingDamage, false);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatLog, false);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatOptions, false);

  assert.deepEqual(OUTSKIRTS_ALLOWED_PLANNING_SHELL, {
    showRunCompass: false,
    showCombatModuleTopLane: false,
    showCombatTheater: false,
    showCombatHpBars: false,
    showFloatingDamage: false,
    showSummaryRail: false,
    showUtilityTray: false,
    showCombatLog: false,
    showCombatOptions: false,
    rightCardHasPrimaryAction: false,
    singleDominantCta: true,
    useScenicCenter: true,
    usePlanningState: true,
  });
});

void test('C3 source/style guards for center-stage ownership', async () => {
  const source = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(source, /OutskirtsCenterStage/);
  assert.doesNotMatch(source, /OutskirtsScenicStage/);
  assert.match(css, /\.outskirtsCenterStage\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/);
  assert.match(css, /\.outskirtsCombatTheater\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/);
});
