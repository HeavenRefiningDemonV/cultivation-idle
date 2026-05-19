import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact G9 adds active theater surface support', () => {
  const types = readFileSync('src/features/world/gateTrialExact/gateTrialExactTypes.ts', 'utf8');
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');

  for (const required of [
    'GateTrialActiveTheaterSurface',
    'GateTrialActiveTheaterLogLineSurface',
    'GateTrialActiveTheaterFloatingEventSurface',
    'GateTrialActiveTheaterChipSurface',
    'playerHpPct',
    'enemyHpPct',
    'floatingEvents',
    'techniqueLines',
    "state: 'active'",
  ]) {
    assert.equal(types.includes(required), true, `missing active theater type support ${required}`);
  }

  for (const required of [
    'useCombatStore',
    'useActivityStore',
    'buildGateTrialActiveTheaterSurface',
    'isMatchingGateTrialCombat',
    'isMatchingGateTrialActivity',
    'combat.combatContext',
    'combat.combatLog',
    'combat.techniqueLog',
    'combat.events',
    "label: 'Stop Attempt'",
    "intent: 'stop-attempt'",
  ]) {
    assert.equal(builder.includes(required), true, `missing active theater builder support ${required}`);
  }
});

void test('Gate Trial Exact G9 renders active theater markup when surface has activeTheater', () => {
  const base = createGateTrialExactMockupFixture();

  const surface: ReturnType<typeof createGateTrialExactMockupFixture> = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'active',
    },
    scenicStage: {
      ...base.scenicStage,
      readinessSeal: {
        ...base.scenicStage.readinessSeal,
        state: 'active',
        verdict: 'ACTIVE',
        scoreLabel: 'Gate trial in progress',
      },
      activeTheater: {
        visible: true,
        state: 'active',
        playerName: 'Disciple',
        playerHpLabel: '98 / 131',
        playerHpPct: 74,
        enemyName: 'Gate Guardian',
        enemyHpLabel: '420 / 500',
        enemyHpPct: 84,
        bossName: 'Gate Guardian',
        bossLevelLabel: 'Lv. 15',
        attemptLabel: 'Gate Trial Attempt',
        elapsedLabel: '0:13',
        autoStateLabel: 'AI Balanced',
        chips: [
          { id: 'attempt', label: 'Attempt', value: 'Active', tone: 'ceremonial' },
          { id: 'fail-safe', label: 'Fail-Safe', value: 'Tracked', tone: 'warning' },
        ],
        logLines: [
          { id: 'log-1', text: 'Gate Guardian strikes the barrier.', tone: 'player-hit', source: 'live' },
          { id: 'log-2', text: 'Iron Palm counters.', tone: 'enemy-hit', source: 'live' },
        ],
        techniqueLines: [
          { id: 'tech-1', text: 'Iron Palm cycles.', tone: 'technique', source: 'live' },
        ],
        floatingEvents: [
          { id: 'evt-1', label: '128', tone: 'enemy-hit', lane: 'enemy' },
          { id: 'evt-2', label: '42', tone: 'player-hit', lane: 'player' },
        ],
      },
    },
    primaryAction: {
      ...base.primaryAction,
      label: 'Stop Attempt',
      ariaLabel: 'Stop the active Gate Trial attempt',
      intent: 'stop-attempt',
      tone: 'warning',
      enabled: true,
    },
  };

  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const token of [
    'data-testid="gate-trial-active-theater"',
    'data-testid="gate-trial-active-theater-top-chips"',
    'data-testid="gate-trial-active-theater-chip-attempt"',
    'data-testid="gate-trial-active-theater-chip-fail-safe"',
    'data-testid="gate-trial-active-theater-boss-hp"',
    'data-testid="gate-trial-active-theater-boss-name"',
    'data-testid="gate-trial-active-theater-boss-hp-bar"',
    'data-testid="gate-trial-active-theater-boss-hp-fill"',
    'data-testid="gate-trial-active-theater-player-hp"',
    'data-testid="gate-trial-active-theater-player-name"',
    'data-testid="gate-trial-active-theater-player-hp-bar"',
    'data-testid="gate-trial-active-theater-player-hp-fill"',
    'data-testid="gate-trial-active-theater-actor-layer"',
    'data-testid="gate-trial-active-theater-player-actor"',
    'data-testid="gate-trial-active-theater-boss-actor"',
    'data-testid="gate-trial-active-theater-portal-pulse"',
    'data-testid="gate-trial-active-theater-log-slip"',
    'data-testid="gate-trial-active-theater-log-lines"',
    'data-testid="gate-trial-active-theater-technique-lines"',
    'data-testid="gate-trial-active-theater-floating-events"',
    'data-testid="gate-trial-active-theater-elapsed"',
    'data-testid="gate-trial-active-theater-auto-state"',
  ]) {
    assert.equal(html.includes(token), true, `missing active theater token ${token}`);
  }

  for (const copy of [
    'ACTIVE',
    'Gate trial in progress',
    'Gate Guardian',
    'Lv. 15',
    '98 / 131',
    '420 / 500',
    'Gate Trial Attempt',
    '0:13',
    'AI Balanced',
    'Combat Flow',
    'Gate Guardian strikes the barrier.',
    'Iron Palm counters.',
    'Iron Palm cycles.',
    'Stop Attempt',
  ]) {
    assert.equal(html.includes(copy), true, `missing active theater copy ${copy}`);
  }
});

void test('Gate Trial Exact G9 does not render active theater in planning fixture state', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  assert.equal(html.includes('data-testid="gate-trial-active-theater"'), false);
  assert.equal(html.includes('Stop Attempt'), false);
  assert.equal(html.includes('Combat Flow'), false);
});

void test('Gate Trial Exact G9 active theater preserves side rails, central stage, rail, and CTA regions', () => {
  const base = createGateTrialExactMockupFixture();

  const surface: ReturnType<typeof createGateTrialExactMockupFixture> = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'active',
    },
    scenicStage: {
      ...base.scenicStage,
      activeTheater: {
        visible: true,
        state: 'active',
        playerName: 'Disciple',
        playerHpLabel: '98 / 131',
        playerHpPct: 74,
        enemyName: 'Gate Guardian',
        enemyHpLabel: '420 / 500',
        enemyHpPct: 84,
        bossName: 'Gate Guardian',
        bossLevelLabel: 'Lv. 15',
        attemptLabel: 'Gate Trial Attempt',
        elapsedLabel: '0:13',
        autoStateLabel: 'AI Balanced',
        chips: [],
        logLines: [],
        techniqueLines: [],
        floatingEvents: [],
      },
    },
    primaryAction: {
      ...base.primaryAction,
      label: 'Stop Attempt',
      intent: 'stop-attempt',
      tone: 'warning',
      enabled: true,
    },
  };

  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const token of [
    'data-testid="gate-trial-exact-page"',
    'data-testid="gate-trial-exact-top-region"',
    'data-testid="gate-trial-minimum-checklist"',
    'data-testid="gate-trial-recommended-panel"',
    'data-testid="gate-trial-trial-summary"',
    'data-testid="gate-trial-scenic-stage"',
    'data-testid="gate-trial-readiness-seal"',
    'data-testid="gate-trial-guardian-plaque"',
    'data-testid="gate-trial-readiness-rail"',
    'data-testid="gate-trial-primary-cta"',
  ]) {
    assert.equal(html.includes(token), true, `active theater must preserve ${token}`);
  }
});

void test('Gate Trial Exact G9 does not modify combat, activity, trial, or reward service implementations', () => {
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const owner = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');
  const combined = `${builder}\n${screen}\n${owner}`;

  for (const forbidden of [
    'RewardService',
    'recordFailure(',
    'markCleared(',
    'markBypassed(',
    'startCombat(',
    'openCombatPreview',
    'startCombatFromPreview',
    'spendCurrency',
    'grantRewards',
    'gameStore.breakthrough',
  ]) {
    assert.equal(combined.includes(forbidden), false, `G9 display code must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G9 does not import legacy or external combat presentation', () => {
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  const combined = `${screen}\n${scss}`;

  for (const forbidden of [
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'GateTrialReadinessCard',
    'GateTrialAttemptCluster',
    'CombatModuleTopLane',
    'CombatTheaterModal',
    'InkCombatShell',
    'InkHealthBar',
    'OutskirtsExactMockupScreen',
    'RuinsExactMockupScreen',
    'Outskirts',
    'Hollow Log Den',
    'Start Hunt',
    'Expected Rewards',
    'Rare Pity',
    'Final Chest',
    'GameIcon',
    'lucide-react',
  ]) {
    assert.equal(combined.includes(forbidden), false, `G9 must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G9 SCSS contains active theater selectors and avoids Unicode glyph icons', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialScenicStage--active',
    '.gateTrialActiveTheater',
    '.gateTrialActiveTheater__topChips',
    '.gateTrialActiveTheater__chip',
    '.gateTrialActiveTheater__bossHp',
    '.gateTrialActiveTheater__playerHp',
    '.gateTrialActiveTheater__hpHeader',
    '.gateTrialActiveTheater__hpName',
    '.gateTrialActiveTheater__hpValue',
    '.gateTrialActiveTheater__hpTrack',
    '.gateTrialActiveTheater__hpFill',
    '.gateTrialActiveTheater__hpFill--boss',
    '.gateTrialActiveTheater__hpFill--player',
    '.gateTrialActiveTheater__actorLayer',
    '.gateTrialActiveTheater__actor',
    '.gateTrialActiveTheater__actor--player',
    '.gateTrialActiveTheater__actor--boss',
    '.gateTrialActiveTheater__actorAura',
    '.gateTrialActiveTheater__portalPulse',
    '.gateTrialActiveTheater__logSlip',
    '.gateTrialActiveTheater__logHeader',
    '.gateTrialActiveTheater__logLines',
    '.gateTrialActiveTheater__logLine',
    '.gateTrialActiveTheater__techniqueLines',
    '.gateTrialActiveTheater__techniqueLine',
    '.gateTrialActiveTheater__floatingEvents',
    '.gateTrialActiveTheater__floatingEvent',
    '.gateTrialActiveTheater__statusCluster',
    '.gateTrialActiveTheater__elapsed',
    '.gateTrialActiveTheater__autoState',
    '.gateTrialPrimaryCta--warning',
  ]) {
    assert.equal(scss.includes(required), true, `missing G9 SCSS selector ${required}`);
  }

  for (const forbidden of [
    'content: "✓"',
    "content: '✓'",
    'content: "✔"',
    "content: '✔'",
    'content: "⚠"',
    "content: '⚠'",
    'content: "🔒"',
    "content: '🔒'",
    'content: "→"',
    "content: '→'",
    'content: "›"',
    "content: '›'",
    'content: "»"',
    "content: '»'",
    'content: "◆"',
    "content: '◆'",
    'content: "✦"',
    "content: '✦'",
  ]) {
    assert.equal(scss.includes(forbidden), false, `G9 SCSS must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact G9 keeps normal World route in live exact mode', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const entrySurface = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');

  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true);

  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'live'"), false);

  assert.match(entrySurface, /case 'gateTrial':[\s\S]*backgroundVariant\s*=\s*'gate-trial-exact';[\s\S]*shellFamily\s*=\s*'gate-trial-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
});
