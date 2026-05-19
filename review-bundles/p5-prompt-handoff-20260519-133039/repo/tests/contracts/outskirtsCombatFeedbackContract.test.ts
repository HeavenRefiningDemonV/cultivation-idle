import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { CombatEvent } from '../../src/types/index.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import {
  classifyOutskirtsFloatingHitFromCombatEvent,
  classifyOutskirtsFloatingHitFromLogLine,
  pickOutskirtsFloatingHitPosition,
} from '../../src/features/world/outskirts/outskirtsCombatFeedback.js';

void test('C5 Test A: planning mode does not render feedback', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-testid="outskirts-center-stage"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-floating-hits"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-log-slip"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-floating-hit"'), false);
  assert.equal(html.includes('data-testid="outskirts-combat-log-line"'), false);
});

void test('C5 Test B: active mode renders feedback in effects/log layers', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-effects"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-log"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-floating-hits"'), true);
  assert.equal(html.includes('data-testid="outskirts-combat-log-slip"'), true);

  const effectsAt = html.indexOf('data-testid="outskirts-combat-theater-layer-effects"');
  const hitsAt = html.indexOf('data-testid="outskirts-combat-floating-hits"');
  const logLayerAt = html.indexOf('data-testid="outskirts-combat-theater-layer-log"');
  const logSlipAt = html.indexOf('data-testid="outskirts-combat-log-slip"');
  assert.equal(effectsAt >= 0 && hitsAt > effectsAt, true);
  assert.equal(logLayerAt >= 0 && logSlipAt > logLayerAt, true);
});

void test('C5 Test C: fixture renders mockup feedback content', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('-23'), true);
  assert.equal(html.includes('You struck Snarling Wolf.'), true);
  assert.equal(html.includes('Wolf missed.'), true);
  assert.equal(html.includes('Iron Palm is ready.'), true);
  assert.equal(html.includes('data-hit-kind="normal"'), true);
  assert.equal(html.includes('data-hit-target="enemy"'), true);
  assert.equal((html.match(/data-testid="outskirts-combat-log-line"/g) ?? []).length, 3);
});

void test('C5 Test D: classify floating hits from combat events', () => {
  const mkHit = (amount: string, isCrit: boolean, source: 'player' | 'enemy', target: 'player' | 'enemy'): CombatEvent => ({
    id: `evt-${amount}-${source}-${target}-${isCrit ? 'crit' : 'normal'}`,
    at: 1,
    type: 'HIT',
    source,
    target,
    amount,
    isCrit,
  });

  assert.deepEqual(classifyOutskirtsFloatingHitFromCombatEvent(mkHit('23', false, 'player', 'enemy')), {
    id: 'floating-evt-23-player-enemy-normal', text: '-23', target: 'enemy', kind: 'normal',
  });
  assert.deepEqual(classifyOutskirtsFloatingHitFromCombatEvent(mkHit('54', true, 'player', 'enemy')), {
    id: 'floating-evt-54-player-enemy-crit', text: '-54', target: 'enemy', kind: 'crit',
  });
  assert.deepEqual(classifyOutskirtsFloatingHitFromCombatEvent(mkHit('10', false, 'enemy', 'player')), {
    id: 'floating-evt-10-enemy-player-normal', text: '-10', target: 'player', kind: 'normal',
  });

  assert.deepEqual(classifyOutskirtsFloatingHitFromCombatEvent({ id: 'heal-12', at: 2, type: 'HEAL', amount: '12' }), {
    id: 'floating-heal-12', text: '+12', target: 'player', kind: 'heal',
  });

  assert.equal(classifyOutskirtsFloatingHitFromCombatEvent({ id: 'loot-1', at: 3, type: 'LOOT_DROP', itemId: 'x', qty: 1, rarity: 'common' }), null);
  assert.equal(classifyOutskirtsFloatingHitFromCombatEvent({ id: 'cast-1', at: 3, type: 'SKILL_CAST', techniqueId: 'iron-palm', source: 'system' }), null);
  assert.equal(classifyOutskirtsFloatingHitFromCombatEvent({ id: 'status-1', at: 3, type: 'STATUS_APPLIED', statusId: 'burn', stacks: 1 }), null);
});

void test('C5 Test E: classify miss from log lines', () => {
  assert.deepEqual(classifyOutskirtsFloatingHitFromLogLine({ id: 'l1', text: 'You attacked Snarling Wolf but it missed!', tone: 'player', timestamp: null, source: 'live' }), {
    id: 'floating-l1', text: 'Miss', target: 'enemy', kind: 'miss',
  });
  assert.deepEqual(classifyOutskirtsFloatingHitFromLogLine({ id: 'l2', text: 'Wolf attacked but it missed!', tone: 'enemy', timestamp: null, source: 'live' }), {
    id: 'floating-l2', text: 'Miss', target: 'player', kind: 'miss',
  });
  assert.deepEqual(classifyOutskirtsFloatingHitFromLogLine({ id: 'l3', text: 'Wolf missed.', tone: 'enemy', timestamp: null, source: 'live' }), {
    id: 'floating-l3', text: 'Miss', target: 'player', kind: 'miss',
  });
  assert.equal(classifyOutskirtsFloatingHitFromLogLine({ id: 'l4', text: 'Iron Palm is ready.', tone: 'system', timestamp: null, source: 'live' }), null);
});

void test('C5 Test F: deterministic positions are stable and in range', () => {
  const first = pickOutskirtsFloatingHitPosition({ id: 'hit-a', kind: 'normal', target: 'enemy' });
  const second = pickOutskirtsFloatingHitPosition({ id: 'hit-a', kind: 'normal', target: 'enemy' });
  assert.deepEqual(first, second);
  assert.equal(first.x >= 16 && first.x <= 84, true);
  assert.equal(first.y >= 18 && first.y <= 72, true);
  assert.equal(Math.abs(first.x - 72) <= 5, true);
  assert.equal(Math.abs(first.y - 42) <= 7, true);

  const player = pickOutskirtsFloatingHitPosition({ id: 'hit-b', kind: 'normal', target: 'player' });
  assert.equal(Math.abs(player.x - 30) <= 5, true);
  assert.equal(Math.abs(player.y - 52) <= 7, true);
});

void test('C5 Test G: shell flags after C5', () => {
  const activeSurface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  assert.equal(activeSurface.shell.showCombatTheater, true);
  assert.equal(activeSurface.shell.showCombatHpBars, true);
  assert.equal(activeSurface.shell.showCombatActors, true);
  assert.equal(activeSurface.shell.showFloatingDamage, true);
  assert.equal(activeSurface.shell.showCombatLog, true);
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
});

void test('C5 Test H: right rail remains rewards rail, not combat log panel', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Expected Rewards'), true);
  assert.equal(html.includes('Gold'), true);
  assert.equal(html.includes('Common Materials'), true);
  assert.equal(html.includes('Tracked Bounty'), true);

  const rightRailIdx = html.indexOf('data-testid="outskirts-exact-right-rail"');
  const logSlipIdx = html.indexOf('data-testid="outskirts-combat-log-slip"');
  assert.equal(rightRailIdx >= 0 && logSlipIdx !== -1 && logSlipIdx > rightRailIdx, false);
});

void test('C5 Test I: legacy token guard', async () => {
  const files = await Promise.all([
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatFloatingHits.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatLogSlip.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/hooks/useOutskirtsFloatingHits.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/components/OutskirtsCombatTheater.ts', 'utf8'),
    fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
  ]);

  for (const source of files) {
    for (const forbidden of ['OutskirtsLegacyActiveSurface', 'InkCombatShell', 'InkHealthBar', 'CombatModuleTopLane', 'OutskirtsActiveContainment', 'CombatStyles.scss', 'enemy-hit-text', 'enemy-hit-overlay', 'images-div', 'cultivator-image-wrapper', 'enemy-image-wrapper']) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C5 Test J: no premature C6/C8 content', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-combat-theater-layer-result"'), true);
  for (const forbidden of [
    'data-testid="outskirts-combat-result-overlay"',
    'data-testid="outskirts-combat-victory-seal"',
    'data-testid="outskirts-combat-defeat-seal"',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C5 Test K: CSS guard', async () => {
  const css = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  for (const token of [
    '.outskirtsCombatFloatingHits',
    '.outskirtsCombatFloatingHits__hit',
    '.outskirtsCombatFloatingHits__hit--normal',
    '.outskirtsCombatFloatingHits__hit--crit',
    '.outskirtsCombatFloatingHits__hit--miss',
    '.outskirtsCombatFloatingHits__hit--heal',
    '@keyframes outskirtsFloatingHitRise',
    '.outskirtsCombatLogSlip',
    '.outskirtsCombatLogSlip__line',
    '.outskirtsCombatLogSlip__seal',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    assert.equal(css.includes(token), true);
  }

  assert.match(css, /\.outskirtsCombatTheater__effectsLayer\s*\{[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /\.outskirtsCombatTheater__logLayer\s*\{[\s\S]*pointer-events:\s*none;/);
});
