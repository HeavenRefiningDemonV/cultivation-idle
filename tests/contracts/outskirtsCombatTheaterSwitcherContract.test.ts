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

void test('C2 planning route keeps scenic stage and does not mount theater shell', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), {
    activityMode: 'planning',
  });

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="planning"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
});

void test('C2 active route mounts theater shell with empty layer anchors', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: true }), {
    activityMode: 'active',
  });

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="active"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), false);

  for (const token of [
    'data-testid="outskirts-combat-theater-layer-hp"',
    'data-testid="outskirts-combat-theater-layer-actors"',
    'data-testid="outskirts-combat-theater-layer-effects"',
    'data-testid="outskirts-combat-theater-layer-chips"',
    'data-testid="outskirts-combat-theater-layer-log"',
  ]) {
    assert.equal(html.includes(token), true);
  }

  for (const forbidden of ['TODO', 'placeholder text', 'combat ui pending']) {
    assert.equal(html.toLowerCase().includes(forbidden), false);
  }
});

void test('C2 active shell contract only flips theater visibility', () => {
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatTheater, true);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatHpBars, false);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showFloatingDamage, false);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatLog, false);
  assert.equal(OUTSKIRTS_ALLOWED_ACTIVE_CONTRACT_SHELL.showCombatOptions, false);
});

void test('C2 planning shell contract remains unchanged', () => {
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

void test('C2 source guard: exact mockup screen imports center switcher (not scenic stage directly)', async () => {
  const source = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  assert.match(source, /OutskirtsCenterStage/);
  assert.doesNotMatch(source, /OutskirtsScenicStage/);
});

void test('C2 style guard: center stage and theater remain absolute inset in scenic slot', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(css, /\.outskirtsCenterStage\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/);
  assert.match(css, /\.outskirtsCombatTheater\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/);
});
