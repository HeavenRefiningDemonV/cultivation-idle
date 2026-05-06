import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact G6 renders bottom readiness rail and primary CTA regions', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const token of [
    'data-testid="gate-trial-exact-readiness-rail"',
    'data-testid="gate-trial-readiness-rail"',
    'data-testid="gate-trial-readiness-rail-title"',
    'data-testid="gate-trial-readiness-rail-track"',
    'data-testid="gate-trial-readiness-rail-connector"',
    'data-testid="gate-trial-readiness-rail-node-list"',
    'data-testid="gate-trial-exact-cta-slot"',
    'data-testid="gate-trial-primary-cta"',
    'data-testid="gate-trial-primary-cta-glow"',
    'data-testid="gate-trial-primary-cta-ring"',
    'data-testid="gate-trial-primary-cta-plate"',
    'data-testid="gate-trial-primary-cta-label"',
    'data-testid="gate-trial-icon-readiness-qiCap"',
    'data-testid="gate-trial-icon-readiness-loadout"',
    'data-testid="gate-trial-icon-readiness-weapon"',
    'data-testid="gate-trial-icon-readiness-medicine"',
    'data-testid="gate-trial-icon-readiness-techniques"',
    'data-testid="gate-trial-icon-readiness-safetyNet"',
    'data-testid="gate-trial-icon-readiness-gate"',
  ]) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }

  for (const forbidden of [
    'data-testid="gate-trial-primary-cta-ornament-left"',
    'data-testid="gate-trial-primary-cta-ornament-right"',
    'gateTrialPrimaryCta__ornament',
    'gateTrialPrimaryCta__ornamentCore',
  ]) {
    assert.equal(html.includes(forbidden), false, `CTA must not render removed green ornament ${forbidden}`);
  }
});

void test('Gate Trial Exact G6 renders seven readiness nodes in exact fixture order', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  const order = ['qiCap', 'loadout', 'weapon', 'medicine', 'techniques', 'safetyNet', 'gate'];
  const positions = order.map((id) => html.indexOf(`data-testid="gate-trial-readiness-node-${id}"`));

  assert.equal(positions.every((position) => position >= 0), true, 'all readiness nodes must render');
  for (let i = 1; i < positions.length; i += 1) {
    assert.equal(positions[i] > positions[i - 1], true, `${order[i]} readiness node rendered out of order`);
  }

  for (const copy of [
    'Foundation Gate Readiness',
    'Qi Cap',
    'Loadout',
    'Weapon',
    'Medicine',
    'Techniques',
    'Safety Net',
    'Gate',
  ]) {
    assert.equal(html.includes(copy), true, `missing readiness rail copy ${copy}`);
  }

  for (const token of [
    'data-node-id="qiCap"',
    'data-node-id="loadout"',
    'data-node-id="weapon"',
    'data-node-id="medicine"',
    'data-node-id="techniques"',
    'data-node-id="safetyNet"',
    'data-node-id="gate"',
    'data-status="success"',
    'data-status="warning"',
    'data-status="locked"',
    'data-status="active"',
    'data-variant="check"',
    'data-variant="warning"',
    'data-variant="locked"',
    'data-variant="gate-glow"',
  ]) {
    assert.equal(html.includes(token), true, `missing readiness rail data token ${token}`);
  }
});

void test('Gate Trial Exact G6 renders readiness medallion and label ids for all nodes', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const id of ['qiCap', 'loadout', 'weapon', 'medicine', 'techniques', 'safetyNet', 'gate']) {
    assert.equal(
      html.includes(`data-testid="gate-trial-readiness-node-medallion-${id}"`),
      true,
      `missing medallion test id for ${id}`,
    );
    assert.equal(
      html.includes(`data-testid="gate-trial-readiness-node-label-${id}"`),
      true,
      `missing label test id for ${id}`,
    );
  }

  for (const className of [
    'gateTrialReadinessRail__medallion--check',
    'gateTrialReadinessRail__medallion--warning',
    'gateTrialReadinessRail__medallion--locked',
    'gateTrialReadinessRail__medallion--gate-glow',
    'gateTrialReadinessRail__icon',
    'gateTrialReadinessRail__diamond',
  ]) {
    assert.equal(html.includes(className), true, `missing readiness medallion class ${className}`);
  }
});

void test('Gate Trial Exact G6 renders one enabled ceremonial Attempt Gate CTA from fixture data', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  assert.equal(html.includes('Attempt Gate'), true);
  assert.equal(html.includes('data-testid="gate-trial-primary-cta"'), true);
  assert.equal(html.includes('data-intent="attempt-gate"'), true);
  assert.equal(html.includes('data-tone="ceremonial"'), true);
  assert.equal(html.includes('data-enabled="true"'), true);
  assert.equal(html.includes('gateTrialPrimaryCta--enabled'), true);
  assert.equal(html.includes('gateTrialPrimaryCta--ceremonial'), true);

  const first = html.indexOf('data-testid="gate-trial-primary-cta"');
  const second = html.indexOf('data-testid="gate-trial-primary-cta"', first + 1);
  assert.equal(second, -1, 'there must be exactly one primary CTA');
});

void test('Gate Trial Exact G6 source remains pure and does not wire gameplay', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const forbidden of [
    'useContentStore',
    'useGameStore',
    'useTrialStore',
    'useCombatStore',
    'useUIStore',
    'useInventoryStore',
    'useActivityStore',
    'RewardService',
    'getTrialLifecycleSnapshot',
    'getTrialGateRewardBundle',
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'GateTrialReadinessCard',
    'GateTrialChecklist',
    'GateTrialSafetyNetCard',
    'GateTrialTopFixes',
    'GateTrialAttemptCluster',
    'CombatModuleTopLane',
    'InkCombatShell',
    'InkHealthBar',
    'OutskirtsExactMockupScreen',
    'RuinsExactMockupScreen',
    'GameIcon',
    'lucide-react',
    'startCombat',
    'startCombatFromPreview',
    'openCombatPreview',
    'spendCurrency',
    'grantRewards',
  ]) {
    assert.equal(source.includes(forbidden), false, `G6 source must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G6 SCSS contains bottom rail and CTA parity selectors', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialExactPage__readinessRailSlot',
    '.gateTrialReadinessRail',
    '.gateTrialReadinessRail__title',
    '.gateTrialReadinessRail__track',
    '.gateTrialReadinessRail__connector',
    '.gateTrialReadinessRail__nodeList',
    '.gateTrialReadinessRail__node',
    '.gateTrialReadinessRail__node--gate',
    '.gateTrialReadinessRail__nodeButton',
    '.gateTrialReadinessRail__medallion',
    '.gateTrialReadinessRail__medallionRing',
    '.gateTrialReadinessRail__medallionInner',
    '.gateTrialReadinessRail__medallion--check',
    '.gateTrialReadinessRail__medallion--warning',
    '.gateTrialReadinessRail__medallion--locked',
    '.gateTrialReadinessRail__medallion--gate-glow',
    '.gateTrialReadinessRail__mark',
    '.gateTrialReadinessRail__icon',
    '.gateTrialExactIcon--rail',
    '.gateTrialExactIcon--railGate',
    '.gateTrialReadinessRail__label',
    '.gateTrialReadinessRail__diamond',
    '.gateTrialExactPage__ctaSlot',
    '.gateTrialPrimaryCta',
    '.gateTrialPrimaryCta--enabled',
    '.gateTrialPrimaryCta--disabled',
    '.gateTrialPrimaryCta--ceremonial',
    '.gateTrialPrimaryCta__glow',
    '.gateTrialPrimaryCta__ring',
    '.gateTrialPrimaryCta__plate',
    '.gateTrialPrimaryCta__plateEdge',
    '.gateTrialPrimaryCta__label',
  ]) {
    assert.equal(scss.includes(required), true, `missing G6 SCSS selector ${required}`);
  }

  for (const forbidden of [
    '.gateTrialReadinessRail__mark--check::before',
    '.gateTrialReadinessRail__mark--warning::before',
    '.gateTrialReadinessRail__mark--locked::before',
    '.gateTrialReadinessRail__mark--locked::after',
    '.gateTrialReadinessRail__gateGlyph',
    '.gateTrialPrimaryCta__ornament',
    '.gateTrialPrimaryCta__ornament--left',
    '.gateTrialPrimaryCta__ornament--right',
    '.gateTrialPrimaryCta__ornamentCore',
    '.gateTrialPrimaryCta__plate::before',
    '.gateTrialPrimaryCta__plate::after',
    'gate-trial-primary-cta-ornament-left',
    'gate-trial-primary-cta-ornament-right',
  ]) {
    assert.equal(scss.includes(forbidden), false, `CTA de-green must remove ${forbidden}`);
  }
});

void test('Gate Trial Exact G6 SCSS avoids Unicode glyph icons and hover layout-shift transforms', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

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
    assert.equal(scss.includes(forbidden), false, `G6 SCSS must not contain ${forbidden}`);
  }

  for (const selector of [
    '.gateTrialReadinessRail__nodeButton:hover',
    '.gateTrialReadinessRail__nodeButton:focus-visible',
    '.gateTrialPrimaryCta--enabled:hover',
    '.gateTrialPrimaryCta--enabled:focus-visible',
  ]) {
    const start = scss.indexOf(selector);
    assert.equal(start >= 0, true, `missing G6 interactive selector ${selector}`);
    const end = scss.indexOf('}', start);
    const block = end >= 0 ? scss.slice(start, end + 1) : '';
    assert.equal(block.includes('transform:'), false, `${selector} must not transform on hover or focus`);
    assert.equal(block.includes('scale('), false, `${selector} must not scale on hover or focus`);
  }
});

void test('Gate Trial Exact G6 preserves route activation, side rails, and central scene contracts', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const screenSource = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.equal(openWorldModule.includes("normalizedModuleKey === 'gateTrial'"), true);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), true);

  for (const token of [
    'gate-trial-exact-left-rail',
    'gate-trial-minimum-checklist',
    'gate-trial-exact-right-rail',
    'gate-trial-recommended-panel',
    'gate-trial-exact-summary-dock',
    'gate-trial-trial-summary',
    'gate-trial-exact-gate-header-slot',
    'gate-trial-scenic-stage',
    'gate-trial-readiness-seal',
    'gate-trial-guardian-plaque',
  ]) {
    assert.equal(screenSource.includes(token), true, `G6 must preserve ${token}`);
  }
});
