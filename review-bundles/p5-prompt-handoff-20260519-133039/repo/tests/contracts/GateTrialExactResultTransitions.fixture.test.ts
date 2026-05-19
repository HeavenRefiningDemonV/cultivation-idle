import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';
import type { GateTrialExactSurfaceV1 } from '../../src/features/world/gateTrialExact/gateTrialExactTypes.js';

void test('Gate Trial Exact G10 adds result transition surface support', () => {
  const types = readFileSync('src/features/world/gateTrialExact/gateTrialExactTypes.ts', 'utf8');
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');

  for (const required of [
    'GateTrialResultTransitionKind',
    'GateTrialResultDetailLineSurface',
    'GateTrialResultTransitionSurface',
    'resultTransition?: GateTrialResultTransitionSurface',
    "'victory'",
    "'defeat'",
    "'fail-safe-available'",
    "'bypassed'",
    "'cleared'",
  ]) {
    assert.equal(types.includes(required), true, `missing G10 type support ${required}`);
  }

  for (const required of [
    'buildGateTrialResultTransitionSurface',
    'lastAttemptSummary',
    'lifecycle.state ===',
    "'GATE OPENED'",
    "'GATE REJECTED'",
    "'SAFETY NET READY'",
    "'SAFETY NET SECURED'",
    "'Break Through'",
  ]) {
    assert.equal(builder.includes(required), true, `missing G10 builder support ${required}`);
  }
});

void test('Gate Trial Exact G10 fixture planning state does not render result transition', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  assert.equal(html.includes('data-testid="gate-trial-result-transition"'), false);
  assert.equal(html.includes('GATE OPENED'), false);
  assert.equal(html.includes('GATE REJECTED'), false);
  assert.equal(html.includes('SAFETY NET READY'), false);
  assert.equal(html.includes('SAFETY NET SECURED'), false);
});

void test('Gate Trial Exact G10 renders victory result transition from surface data', () => {
  const base = createGateTrialExactMockupFixture();
  const surface: GateTrialExactSurfaceV1 = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'cleared',
      lifecycleState: 'cleared',
      resolution: 'cleared',
    },
    scenicStage: {
      ...base.scenicStage,
      readinessSeal: {
        ...base.scenicStage.readinessSeal,
        state: 'cleared',
        verdict: 'CLEARED',
        scoreLabel: 'Reward acquired',
      },
      resultTransition: {
        visible: true,
        kind: 'victory',
        title: 'GATE OPENED',
        subtitle: 'Gate catalyst acquired',
        stampLabel: 'CLEARED',
        tone: 'positive',
        detailLines: [
          { id: 'reward', label: 'Reward', value: 'Gate Foundation Pill', tone: 'positive', source: 'content' },
          { id: 'resolution', label: 'Resolution', value: 'Cleared by combat', tone: 'positive', source: 'live' },
          { id: 'handoff', label: 'Next', value: 'Break through in Cultivation', tone: 'ceremonial', source: 'derived' },
        ],
        rewardLines: ['Acquired: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
        ctaHint: 'Breakthrough path is ready.',
        emphasizedFixId: null,
        source: 'live',
      },
    },
    primaryAction: {
      ...base.primaryAction,
      label: 'Break Through',
      intent: 'breakthrough-handoff',
      enabled: true,
      tone: 'ceremonial',
    },
  };

  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const token of [
    'data-testid="gate-trial-result-transition"',
    'data-result-kind="victory"',
    'data-testid="gate-trial-result-transition-stamp"',
    'data-testid="gate-trial-result-transition-title"',
    'data-testid="gate-trial-result-transition-subtitle"',
    'data-testid="gate-trial-result-transition-details"',
    'data-testid="gate-trial-result-transition-detail-reward"',
    'data-testid="gate-trial-result-transition-detail-resolution"',
    'data-testid="gate-trial-result-transition-detail-handoff"',
    'data-testid="gate-trial-result-transition-reward-lines"',
    'data-testid="gate-trial-result-transition-cta-hint"',
  ]) {
    assert.equal(html.includes(token), true, `missing victory transition token ${token}`);
  }

  for (const copy of [
    'GATE OPENED',
    'Gate catalyst acquired',
    'CLEARED',
    'Gate Foundation Pill',
    'Cleared by combat',
    'Break through in Cultivation',
    'Acquired: Gate Foundation Pill ×1',
    'Used for Foundation Breakthrough',
    'Breakthrough path is ready.',
    'Break Through',
  ]) {
    assert.equal(html.includes(copy), true, `missing victory transition copy ${copy}`);
  }
});

void test('Gate Trial Exact G10 renders defeat transition without hiding exact page regions', () => {
  const base = createGateTrialExactMockupFixture();
  const surface: GateTrialExactSurfaceV1 = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'transitioning',
      lifecycleState: 'available',
      resolution: 'none',
    },
    scenicStage: {
      ...base.scenicStage,
      readinessSeal: {
        ...base.scenicStage.readinessSeal,
        state: 'warning',
        verdict: 'REJECTED',
        scoreLabel: 'Failure 3 / 5',
      },
      resultTransition: {
        visible: true,
        kind: 'defeat',
        title: 'GATE REJECTED',
        subtitle: 'Failure recorded',
        stampLabel: 'DEFEAT',
        tone: 'critical',
        detailLines: [
          { id: 'failures', label: 'Eligible Failures', value: '3 / 5', tone: 'critical', source: 'live' },
          { id: 'bossHp', label: 'Guardian Remaining', value: '42%', tone: 'warning', source: 'live' },
          { id: 'maxHit', label: 'Largest Hit', value: '88 Boss hit', tone: 'critical', source: 'live' },
          { id: 'duration', label: 'Attempt Time', value: '13s', tone: 'neutral', source: 'live' },
        ],
        rewardLines: ['Need more sustain to survive longer.', 'Review build for more burst and survival tools.'],
        ctaHint: 'Review top fixes before the next attempt.',
        emphasizedFixId: 'stockHealing',
        failureLabel: '3 / 5',
        source: 'live',
      },
    },
  };

  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const copy of [
    'GATE REJECTED',
    'Failure recorded',
    'DEFEAT',
    'Eligible Failures',
    '3 / 5',
    'Guardian Remaining',
    '42%',
    'Largest Hit',
    '88 Boss hit',
    'Attempt Time',
    '13s',
    'Need more sustain to survive longer.',
    'Review top fixes before the next attempt.',
  ]) {
    assert.equal(html.includes(copy), true, `missing defeat transition copy ${copy}`);
  }

  for (const token of [
    'data-testid="gate-trial-exact-page"',
    'data-testid="gate-trial-exact-top-region"',
    'data-testid="gate-trial-minimum-checklist"',
    'data-testid="gate-trial-recommended-panel"',
    'data-testid="gate-trial-trial-summary"',
    'data-testid="gate-trial-scenic-stage"',
    'data-testid="gate-trial-readiness-rail"',
    'data-testid="gate-trial-primary-cta"',
  ]) {
    assert.equal(html.includes(token), true, `defeat transition must preserve ${token}`);
  }
});

void test('Gate Trial Exact G10 renders fail-safe available and bypassed transition classes/copy', () => {
  const base = createGateTrialExactMockupFixture();

  const failSafeSurface: GateTrialExactSurfaceV1 = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'available',
      lifecycleState: 'available',
      resolution: 'none',
    },
    scenicStage: {
      ...base.scenicStage,
      resultTransition: {
        visible: true,
        kind: 'fail-safe-available',
        title: 'SAFETY NET READY',
        subtitle: 'Eligible failures reached',
        stampLabel: 'READY',
        tone: 'warning',
        detailLines: [
          { id: 'failures', label: 'Eligible Failures', value: '3 / 5', tone: 'warning', source: 'live' },
          { id: 'cost', label: 'Cost', value: '15 Merit · 800 Gold', tone: 'neutral', source: 'live' },
          { id: 'reserve', label: 'Reserve', value: '18 Merit · 900 Gold', tone: 'positive', source: 'live' },
        ],
        rewardLines: ['Secures: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
        ctaHint: 'Safety Net can secure the catalyst now.',
        emphasizedFixId: 'safetyNet',
        source: 'live',
      },
    },
  };

  const bypassedSurface: GateTrialExactSurfaceV1 = {
    ...base,
    meta: {
      ...base.meta,
      mode: 'live',
      source: 'stores',
      activityMode: 'bypassed',
      lifecycleState: 'bypassed',
      resolution: 'bypassed',
    },
    scenicStage: {
      ...base.scenicStage,
      resultTransition: {
        visible: true,
        kind: 'bypassed',
        title: 'SAFETY NET SECURED',
        subtitle: 'Gate catalyst acquired through fail-safe',
        stampLabel: 'BYPASSED',
        tone: 'ceremonial',
        detailLines: [
          { id: 'reward', label: 'Reward', value: 'Gate Foundation Pill', tone: 'positive', source: 'content' },
          { id: 'resolution', label: 'Resolution', value: 'Resolved by Safety Net', tone: 'ceremonial', source: 'live' },
          { id: 'handoff', label: 'Next', value: 'Break through in Cultivation', tone: 'ceremonial', source: 'derived' },
        ],
        rewardLines: ['Secured: Gate Foundation Pill ×1', 'Used for Foundation Breakthrough'],
        ctaHint: 'Breakthrough path is ready.',
        emphasizedFixId: null,
        source: 'live',
      },
    },
    primaryAction: {
      ...base.primaryAction,
      label: 'Break Through',
      intent: 'breakthrough-handoff',
      enabled: true,
      tone: 'ceremonial',
    },
  };

  const failSafeHtml = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface: failSafeSurface }));
  const bypassedHtml = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface: bypassedSurface }));

  for (const copy of [
    'SAFETY NET READY',
    'Eligible failures reached',
    '15 Merit · 800 Gold',
    'Safety Net can secure the catalyst now.',
  ]) {
    assert.equal(failSafeHtml.includes(copy), true, `missing fail-safe transition copy ${copy}`);
  }

  for (const copy of [
    'SAFETY NET SECURED',
    'Gate catalyst acquired through fail-safe',
    'Resolved by Safety Net',
    'Secured: Gate Foundation Pill ×1',
    'Break Through',
  ]) {
    assert.equal(bypassedHtml.includes(copy), true, `missing bypassed transition copy ${copy}`);
  }
});

void test('Gate Trial Exact G10 display and builder code does not mutate combat, trial, reward, or breakthrough state', () => {
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  const combined = `${builder}\n${screen}\n${scss}`;

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
    assert.equal(combined.includes(forbidden), false, `G10 display/builder code must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G10 SCSS contains result transition selectors and avoids Unicode glyph icons', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialScenicStage--hasResult',
    '.gateTrialScenicStage--result-victory',
    '.gateTrialScenicStage--result-defeat',
    '.gateTrialScenicStage--result-fail-safe-available',
    '.gateTrialScenicStage--result-bypassed',
    '.gateTrialScenicStage--result-cleared',
    '.gateTrialResultTransition',
    '.gateTrialResultTransition--victory',
    '.gateTrialResultTransition--defeat',
    '.gateTrialResultTransition--fail-safe-available',
    '.gateTrialResultTransition--bypassed',
    '.gateTrialResultTransition--cleared',
    '.gateTrialResultTransition__halo',
    '.gateTrialResultTransition__frame',
    '.gateTrialResultTransition__stamp',
    '.gateTrialResultTransition__title',
    '.gateTrialResultTransition__subtitle',
    '.gateTrialResultTransition__details',
    '.gateTrialResultTransition__detailRow',
    '.gateTrialResultTransition__rewardLines',
    '.gateTrialResultTransition__ctaHint',
    '.gateTrialTopFixButton--emphasized',
    '.gateTrialRecommendedPanel__safetyNetButton--resultEmphasis',
  ]) {
    assert.equal(scss.includes(required), true, `missing G10 SCSS selector ${required}`);
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
    assert.equal(scss.includes(forbidden), false, `G10 SCSS must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact G10 keeps normal World route in live exact mode', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const entrySurface = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');

  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true);

  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'live'"), false);

  assert.match(entrySurface, /case 'gateTrial':[\s\S]*backgroundVariant\s*=\s*'gate-trial-exact';[\s\S]*shellFamily\s*=\s*'gate-trial-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
});
