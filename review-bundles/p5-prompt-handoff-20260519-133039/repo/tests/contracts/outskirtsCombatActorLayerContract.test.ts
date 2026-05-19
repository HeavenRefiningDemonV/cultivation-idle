import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { OutskirtsCombatActors } from '../../src/features/world/outskirts/components/OutskirtsCombatActors.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { classifyOutskirtsCombatMotionLine } from '../../src/features/world/outskirts/hooks/useOutskirtsCombatMotion.js';

void test('C4 Test A: planning mode does not render actors', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="planning"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-actors"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-player"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-enemy"'), false);
});

void test('C4 Test B: active mode renders actors inside actor layer', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-actors"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actors"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-player"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-enemy"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-player-image"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-enemy-image"'), true);

  const actorLayerAt = html.indexOf('data-testid="outskirts-combat-theater-layer-actors"');
  const actorsAt = html.indexOf('data-testid="outskirts-combat-actors"');
  assert.equal(actorLayerAt >= 0 && actorsAt > actorLayerAt, true);
});

void test('C4 Test C: active fixture resolves correct actor assets and attributes', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.match(html, /cultivator_backshots/);
  assert.match(html, /wolfpup/);
  assert.equal(html.includes('data-presence="live"'), true);
  assert.equal(html.includes('data-is-boss="false"'), true);
  assert.equal(html.includes('Cultivator'), true); // from healthbars, not actor labels
});

void test('C4 Test D: unknown enemy art renders mist fallback without fake enemy body text', () => {
  const fixture = createActiveOutskirtsMockupFixture({
    combatStage: {
      ...createActiveOutskirtsMockupFixture().combatStage,
      enemy: {
        ...createActiveOutskirtsMockupFixture().combatStage.enemy,
        name: 'Unknown Foe',
        actorImageKey: 'outskirts/enemy/unknown',
      },
    },
  });

  const html = renderToStaticMarkup(React.createElement(OutskirtsCombatActors, { combatStage: fixture.combatStage }));
  assert.equal(html.includes('data-testid="outskirts-combat-actor-player-image"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-enemy-image"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-actor-enemy-missing-art"'), true);
  assert.equal(html.includes('Unknown Foe'), false);
  assert.equal(html.includes('?'), false);
});

void test('C4 Test E: motion classifier maps combat text to restrained motion cues', () => {
  assert.deepEqual(classifyOutskirtsCombatMotionLine({ text: 'You attacked Snarling Wolf for 23 damage!', tone: 'player' }), { player: 'attack', enemy: 'hit' });
  assert.deepEqual(classifyOutskirtsCombatMotionLine({ text: 'Critical hit! You attacked Snarling Wolf for 23 damage!', tone: 'player' }), { player: 'attack', enemy: 'hit' });
  assert.deepEqual(classifyOutskirtsCombatMotionLine({ text: 'You attacked Snarling Wolf but it missed!', tone: 'player' }), { player: 'attack', enemy: 'dodge' });
  assert.deepEqual(classifyOutskirtsCombatMotionLine({ text: 'Wolf attacked you for 10 damage!', tone: 'enemy' }), { enemy: 'attack', player: 'hit' });
  assert.deepEqual(classifyOutskirtsCombatMotionLine({ text: 'Wolf attacked but it missed!', tone: 'enemy' }), { enemy: 'attack', player: 'dodge' });
  assert.equal(classifyOutskirtsCombatMotionLine({ text: 'Iron Palm is ready.', tone: 'system' }), null);
});

void test('C4 Test F: shell flags after C4', () => {
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

void test('C4 Test G: legacy source guard', async () => {
  const files = await Promise.all([
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatActors.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/hooks/useOutskirtsCombatMotion.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatTheater.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCenterStage.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
  ]);

  for (const source of files) {
    for (const forbidden of [
      'OutskirtsLegacyActiveSurface',
      'InkCombatShell',
      'InkHealthBar',
      'CombatModuleTopLane',
      'OutskirtsActiveContainment',
      'CombatStyles.scss',
      'images-div',
      'cultivator-image-wrapper',
      'enemy-image-wrapper',
      'enemy-hit-text',
    ]) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C4 Test H: CSS guard for actor layer and motion keyframes', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  for (const token of [
    '.outskirtsCombatActors',
    '.outskirtsCombatActors__slot--player',
    '.outskirtsCombatActors__slot--enemy',
    '.outskirtsCombatActors__image--player',
    '.outskirtsCombatActors__image--enemy',
    '.outskirtsCombatActors__shadow',
    '@keyframes outskirtsActorPlayerAttack',
    '@keyframes outskirtsActorEnemyAttack',
    '@keyframes outskirtsActorHit',
    '@keyframes outskirtsActorPlayerDodge',
    '@keyframes outskirtsActorEnemyDodge',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    assert.equal(css.includes(token), true);
  }

  assert.match(css, /\.outskirtsCombatTheater__actorLayer\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.outskirtsCombatTheater__actorLayer\s*\{[\s\S]*pointer-events:\s*none;/);
});

void test('C4 Test I: no premature later-packet visible content', () => {
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
