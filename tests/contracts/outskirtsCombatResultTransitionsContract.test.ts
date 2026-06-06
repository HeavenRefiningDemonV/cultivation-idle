import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CombatEvent } from '../../src/types/index.js';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import {
  createActiveOutskirtsMockupFixture,
  createOutskirtsDefeatTransitionMockupFixture,
  createOutskirtsMockupFixture,
  createOutskirtsVictoryTransitionMockupFixture,
} from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import {
  EMPTY_OUTSKIRTS_COMBAT_RESULT_TRANSITION,
  buildOutskirtsCombatResultTransition,
  classifyOutskirtsCombatResult,
} from '../../src/features/world/outskirts/outskirtsCombatResultTransitions.js';

void test('C8 Test A: planning mode does not render result overlay', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-center-mode="planning"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-result-overlay"'), false);
  assert.equal(html.includes('Victory'), false);
  assert.equal(html.includes('Defeated'), false);
});

void test('C8 Test B: normal active fixture keeps result layer anchor but no overlay', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const expected of [
    'data-testid="outskirts-combat-theater"',
    'data-testid="outskirts-combat-health-bars"',
    'data-testid="outskirts-combat-actors"',
    'data-testid="outskirts-combat-floating-hits"',
    'data-testid="outskirts-combat-log-slip"',
    'data-testid="outskirts-combat-chips"',
    'data-testid="outskirts-combat-theater-layer-result"',
  ]) {
    assert.equal(html.includes(expected), true);
  }

  assert.equal(html.includes('data-testid="outskirts-combat-result-overlay"'), false);
  assert.equal(html.includes('Victory'), false);
  assert.equal(html.includes('Defeated'), false);
});

void test('C8 Test C: victory transition fixture renders seal inside theater result layer', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsVictoryTransitionMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of [
    'data-testid="outskirts-combat-theater-layer-result"',
    'data-testid="outskirts-combat-result-overlay"',
    'data-testid="outskirts-combat-result-plaque"',
    'data-testid="outskirts-combat-result-seal"',
    'data-testid="outskirts-combat-result-title"',
    'data-testid="outskirts-combat-result-subtitle"',
    'data-testid="outskirts-combat-result-detail"',
    'data-testid="outskirts-combat-result-countdown"',
    'Victory',
    'Rewards secured.',
    'Next foe approaching.',
    'Auto-repeat in 0.7s',
    'data-result-kind="victory-auto-repeat"',
    'data-result-outcome="victory"',
    'data-result-tone="jade"',
    'data-auto-repeat-state="continuing"',
  ]) {
    assert.equal(html.includes(token), true);
  }

  const resultLayerAt = html.indexOf('data-testid="outskirts-combat-theater-layer-result"');
  const overlayAt = html.indexOf('data-testid="outskirts-combat-result-overlay"');
  const rightRailAt = html.indexOf('data-testid="outskirts-exact-right-rail"');
  const summaryDockAt = html.indexOf('data-testid="outskirts-exact-summary-dock"');
  assert.equal(resultLayerAt >= 0 && overlayAt > resultLayerAt, true);
  assert.equal(rightRailAt !== -1 && overlayAt > rightRailAt, false);
  assert.equal(summaryDockAt !== -1 && overlayAt > summaryDockAt, false);
});

void test('C8 Test D: defeat transition fixture renders restrained defeat seal', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsDefeatTransitionMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of [
    'data-testid="outskirts-combat-result-overlay"',
    'Defeated',
    'Recovering at the roadside.',
    'Hunt ending. Adjust setup before returning.',
    'Hunt ending.',
    'data-result-kind="defeat-stop"',
    'data-result-outcome="defeat"',
    'data-result-tone="crimson"',
    'data-auto-repeat-state="ending"',
  ]) {
    assert.equal(html.includes(token), true);
  }
});

void test('C8 Test E: result helper classification rules', () => {
  assert.deepEqual(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [{ id: 'evt-defeat', at: 1500, type: 'PLAYER_DEFEATED', enemyName: 'Wolf' }],
    combatLog: [],
  }), {
    outcome: 'defeat',
    resolvedAtMs: 1500,
    reason: 'player-defeated-event',
  });

  assert.deepEqual(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [{ id: 'evt-victory', at: 1600, type: 'BOSS_DEFEATED', enemyId: 'snarling-wolf', enemyName: 'Wolf' }],
    combatLog: [],
  }), {
    outcome: 'victory',
    resolvedAtMs: 1600,
    reason: 'boss-defeated-event',
  });

  assert.deepEqual(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [],
    combatLog: [{ type: 'victory', text: 'You defeated Snarling Wolf!', timestamp: 1700, color: '' }],
  }), {
    outcome: 'victory',
    resolvedAtMs: 1700,
    reason: 'victory-log',
  });

  assert.deepEqual(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [],
    combatLog: [{ type: 'defeat', text: 'You have been defeated by Snarling Wolf...', timestamp: 1800, color: '' }],
  }), {
    outcome: 'defeat',
    resolvedAtMs: 1800,
    reason: 'defeat-log',
  });

  assert.equal(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [{ id: 'evt-loot', at: 1200, type: 'LOOT_DROP', itemId: 'wolf-pelt', qty: 1, rarity: 'common' }],
    combatLog: [],
  }), null);

  assert.equal(classifyOutskirtsCombatResult({
    combatStartTimeMs: 1000,
    combatEvents: [{ id: 'evt-spawn', at: 1200, type: 'BOSS_SPAWN', enemyId: 'snarling-wolf' }],
    combatLog: [],
  }), null);
});

void test('C8 Test F: transition helper builds exact outcome variants', () => {
  const baseInput = {
    active: true,
    sameSourceCombat: true,
    hasLiveCombat: true,
    combatResolved: true,
    combatStartTimeMs: 1000,
    nowMs: 1600,
    enemyName: 'Snarling Wolf',
    enemyIsBoss: false,
    autoRepeatEnabled: true,
    stopAtBoss: false,
    autoRetryOnDeath: false,
    combatEvents: [{ id: 'victory', at: 1500, type: 'BOSS_DEFEATED', enemyId: 'snarling-wolf' } as CombatEvent],
    combatLog: [],
  };

  const victoryRepeat = buildOutskirtsCombatResultTransition(baseInput);
  assert.equal(victoryRepeat.kind, 'victory-auto-repeat');
  assert.equal(victoryRepeat.title, 'Victory');
  assert.equal(victoryRepeat.countdownLabel.startsWith('Auto-repeat in'), true);

  const victoryStop = buildOutskirtsCombatResultTransition({ ...baseInput, autoRepeatEnabled: false });
  assert.equal(victoryStop.kind, 'victory-stop');
  assert.equal(victoryStop.detailLine, 'Auto-repeat is off.');
  assert.equal(victoryStop.countdownLabel, 'Hunt ending.');

  const bossStop = buildOutskirtsCombatResultTransition({ ...baseInput, enemyIsBoss: true, stopAtBoss: true, autoRepeatEnabled: true });
  assert.equal(bossStop.kind, 'boss-stop');
  assert.equal(bossStop.title, 'Boss Defeated');
  assert.equal(bossStop.detailLine, 'Stop-at-boss setting ending hunt.');

  const defeatRetry = buildOutskirtsCombatResultTransition({
    ...baseInput,
    autoRetryOnDeath: true,
    combatEvents: [{ id: 'defeat', at: 1500, type: 'PLAYER_DEFEATED', enemyId: 'snarling-wolf' } as CombatEvent],
  });
  assert.equal(defeatRetry.kind, 'defeat-retry');
  assert.equal(defeatRetry.title, 'Defeated');
  assert.equal(defeatRetry.countdownLabel.startsWith('Retry in'), true);

  const defeatStop = buildOutskirtsCombatResultTransition({
    ...baseInput,
    combatEvents: [{ id: 'defeat', at: 1500, type: 'PLAYER_DEFEATED', enemyId: 'snarling-wolf' } as CombatEvent],
  });
  assert.equal(defeatStop.kind, 'defeat-stop');
  assert.equal(defeatStop.countdownLabel, 'Hunt ending.');
});

void test('C8 Test G: same-source guard prevents stale/trial/ruins overlays', () => {
  const transition = buildOutskirtsCombatResultTransition({
    active: true,
    sameSourceCombat: false,
    hasLiveCombat: true,
    combatResolved: true,
    combatStartTimeMs: 1000,
    nowMs: 1500,
    enemyName: 'Snarling Wolf',
    enemyIsBoss: false,
    autoRepeatEnabled: true,
    stopAtBoss: false,
    autoRetryOnDeath: false,
    combatEvents: [{ id: 'evt-defeat', at: 1400, type: 'PLAYER_DEFEATED', enemyId: 'snarling-wolf' }],
    combatLog: [{ type: 'victory', text: 'You defeated Snarling Wolf!', timestamp: 1450, color: '' }],
  });

  assert.deepEqual(transition, EMPTY_OUTSKIRTS_COMBAT_RESULT_TRANSITION);
});

void test('C8 Test H: shell flags after C8', () => {
  const activeSurface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(activeSurface.shell.showCombatTheater, true);
  assert.equal(activeSurface.shell.showCombatHpBars, true);
  assert.equal(activeSurface.shell.showCombatActors, true);
  assert.equal(activeSurface.shell.showFloatingDamage, true);
  assert.equal(activeSurface.shell.showCombatLog, true);
  assert.equal(activeSurface.shell.showCombatChips, true);
  assert.equal(activeSurface.shell.showCombatResultOverlay, true);
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
  assert.equal(planningSurface.shell.showCombatResultOverlay, false);
});

void test('C8 Test I: C7 active frame remains intact during result transition', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsVictoryTransitionMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of [
    'data-testid="outskirts-active-chain-badge"',
    'data-testid="outskirts-start-hunt-cta"',
    'data-testid="outskirts-live-summary"',
    'Expected Rewards',
    'data-testid="outskirts-combat-health-bars"',
    'data-testid="outskirts-combat-actors"',
    'data-testid="outskirts-combat-chips"',
    'data-testid="outskirts-combat-log-slip"',
  ]) {
    assert.equal(html.includes(token), true);
  }
});

void test('C8 Test J: no full result screen or old UI tokens', () => {
  for (const fixture of [createOutskirtsVictoryTransitionMockupFixture(), createOutskirtsDefeatTransitionMockupFixture()]) {
    const surface = buildOutskirtsMockupSurface(fixture, { activityMode: 'active' });
    const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

    for (const forbidden of [
      'data-testid="outskirts-full-result-screen"',
      'data-testid="outskirts-loot-summary"',
      'data-testid="outskirts-result-modal"',
      'data-testid="outskirts-retry-button"',
      'InkCombatShell',
      'InkHealthBar',
      'OutskirtsLegacyActiveSurface',
      'utilityTrayShell',
      'combat-options',
      'enemy-hit-text',
    ]) {
      assert.equal(html.includes(forbidden), false);
    }
  }
});

void test('C8 Test K: CSS guard', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  for (const token of [
    '.outskirtsCombatTheater__resultLayer',
    '.outskirtsCombatResultOverlay',
    '.outskirtsCombatResultOverlay__plaque',
    '.outskirtsCombatResultOverlay__seal',
    '.outskirtsCombatResultOverlay__thread',
    '.outskirtsCombatResultOverlay__threadFill',
    '.outskirtsCombatResultOverlay--victory-auto-repeat',
    '.outskirtsCombatResultOverlay--boss-stop',
    '.outskirtsCombatResultOverlay--defeat-retry',
    '.outskirtsCombatResultOverlay--defeat-stop',
    '@keyframes outskirtsResultSealEnter',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    assert.equal(css.includes(token), true);
  }

  assert.match(css, /\.outskirtsCombatTheater__resultLayer\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.outskirtsCombatTheater__resultLayer\s*\{[\s\S]*pointer-events:\s*none;/);
});
