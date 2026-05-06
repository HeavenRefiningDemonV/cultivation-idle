import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact G5 renders central header, scenic stage, readiness seal, and guardian plaque regions', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const token of [
    'data-testid="gate-trial-exact-gate-header-slot"',
    'data-testid="gate-trial-gate-header"',
    'data-testid="gate-trial-gate-header-plaque"',
    'data-testid="gate-trial-gate-header-title"',
    'data-testid="gate-trial-gate-header-subtitle"',
    'data-testid="gate-trial-gate-header-chips"',
    'data-testid="gate-trial-exact-scenic-slot"',
    'data-testid="gate-trial-scenic-stage"',
    'data-testid="gate-trial-scenic-frame"',
    'data-testid="gate-trial-scenic-approved-plate"',
    'data-testid="gate-trial-scenic-underpaint"',
    'data-testid="gate-trial-scenic-gate-silhouette"',
    'data-testid="gate-trial-scenic-portal-bloom"',
    'data-testid="gate-trial-scenic-stairs"',
    'data-testid="gate-trial-scenic-platform"',
    'data-testid="gate-trial-scenic-torch-left"',
    'data-testid="gate-trial-scenic-torch-right"',
    'data-testid="gate-trial-scenic-cultivator-shadow"',
    'data-testid="gate-trial-scenic-mist"',
    'data-testid="gate-trial-scenic-edge-fade"',
    'data-testid="gate-trial-readiness-seal"',
    'data-testid="gate-trial-readiness-seal-halo"',
    'data-testid="gate-trial-readiness-seal-ornament-left"',
    'data-testid="gate-trial-readiness-seal-ornament-right"',
    'data-testid="gate-trial-readiness-verdict"',
    'data-testid="gate-trial-readiness-score"',
    'data-testid="gate-trial-readiness-seal-bottom-gem"',
    'data-testid="gate-trial-guardian-plaque"',
    'data-testid="gate-trial-guardian-title"',
    'data-testid="gate-trial-guardian-subtitle"',
    'data-testid="gate-trial-guardian-reward-icon"',
    'data-testid="gate-trial-reward-line"',
  ]) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }
});

void test('Gate Trial Exact G5 preserves central fixture copy exactly', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const copy of [
    'Foundation Gate',
    'Milestone readiness check — clears the path to Foundation',
    'Milestone Gate',
    'Readiness Check',
    'Safety Net Tracked',
    'VIABLE',
    'Readiness 74 / 100',
    'Gate Guardian · Lv. 15',
    'Foundation Establishment Trial',
    'Clear Reward: Gate Foundation Pill ×1',
    'Used for Foundation Breakthrough',
  ]) {
    assert.equal(html.includes(copy), true, `missing G5 central copy ${copy}`);
  }
});

void test('Gate Trial Exact G5 does not leak deferred art or placeholder copy visibly', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const forbidden of [
    '.gateTrialGuardianPlaque__rewardIcon--foundationPill::before',
    '.gateTrialGuardianPlaque__rewardIcon--foundationPill::after',
    '>Deferred Foundation Gate threshold scene',
    '>Deferred',
    '>Art pending',
    '>Image missing',
    '>Placeholder',
    '>Missing scene',
    '>CSS gradients or generated mist',
    'city_gate.png',
    'InsideDungeon.png',
    'entrygate.png',
    'gate.png',
    'Outskirts',
    'Ruins Chamber',
    'Hollow Log Den',
    'Start Hunt',
    'Expected Rewards',
  ]) {
    assert.equal(html.includes(forbidden), false, `central scene must not visibly leak ${forbidden}`);
  }
});

void test('Gate Trial Exact G5 reports honest scenic art binding status', () => {
  assert.equal(
    existsSync('src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png'),
    true,
    'approved Foundation Gate scenic plate must exist at the canonical runtime path',
  );

  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  assert.equal(html.includes('data-art-status="approved-bound"'), true);
  assert.equal(html.includes('data-final-art-required="false"'), true);
  assert.equal(html.includes('data-approved-plate-bound="true"'), true);
  assert.equal(html.includes('data-strict-visual-parity-blocked="false"'), true);
  assert.equal(html.includes('data-bound="true"'), true);
});

void test('Gate Trial Exact G5 source does not use support-only or legacy scene substitutes', () => {
  const screenSource = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  const combined = `${screenSource}\n${scss}`;

  for (const forbidden of [
    'city_gate.png',
    'InsideDungeon.png',
    'entrygate.png',
    'gate.png',
    'cultivator_backshots.png',
    'OutskirtsExactMockupScreen',
    'OutskirtsScenicStage',
    'RuinsExactMockupScreen',
    'RuinsScenicStage',
    'GateTrialWorldLayout',
    'GateTrialFxScene',
    'ScreenFxStage',
    'InkCombatShell',
    'InkHealthBar',
    'GameIcon',
    'lucide-react',
  ]) {
    assert.equal(combined.includes(forbidden), false, `G5 must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G5 SCSS contains central scene, seal, and guardian plaque selectors', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialExactPage__gateHeaderSlot',
    '.gateTrialGateHeader',
    '.gateTrialGateHeader--black-gold-foundation',
    '.gateTrialGateHeader__plaqueShell',
    '.gateTrialGateHeader__title',
    '.gateTrialGateHeader__flourish',
    '.gateTrialGateHeader__subtitle',
    '.gateTrialGateHeader__chipRow',
    '.gateTrialGateHeader__chip',
    '.gateTrialScenicStage',
    '.gateTrialScenicStage--approvedBound',
    '.gateTrialScenicStage--deferredArt',
    '.gateTrialScenicStage__frame',
    '.gateTrialScenicStage__approvedPlate',
    '.gateTrialScenicStage__underpaint',
    '.gateTrialScenicStage__gateSilhouette',
    '.gateTrialScenicStage__portalBloom',
    '.gateTrialScenicStage__stairs',
    '.gateTrialScenicStage__platform',
    '.gateTrialScenicStage__torch',
    '.gateTrialScenicStage__cultivatorShadow',
    '.gateTrialScenicStage__mist',
    '.gateTrialScenicStage__edgeFade',
    '.gateTrialReadinessSeal',
    '.gateTrialReadinessSeal--viable',
    '.gateTrialReadinessSeal__halo',
    '.gateTrialReadinessSeal__ornament',
    '.gateTrialReadinessSeal__body',
    '.gateTrialReadinessSeal__verdict',
    '.gateTrialReadinessSeal__score',
    '.gateTrialReadinessSeal__bottomGem',
    '.gateTrialGuardianPlaque',
    '.gateTrialGuardianPlaque__header',
    '.gateTrialGuardianPlaque__title',
    '.gateTrialGuardianPlaque__subtitle',
    '.gateTrialGuardianPlaque__reward',
    '.gateTrialGuardianPlaque__rewardIconDock',
    '.gateTrialGuardianPlaque__rewardIcon',
    '.gateTrialExactIcon--reward',
    '.gateTrialGuardianPlaque__rewardLine',
  ]) {
    assert.equal(scss.includes(required), true, `missing G5 SCSS selector ${required}`);
  }
});

void test('Gate Trial Exact G5 SCSS avoids Unicode glyph icons', () => {
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
    assert.equal(scss.includes(forbidden), false, `G5 SCSS must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact G5 preserves route activation and G4 side rail contracts', () => {
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
  ]) {
    assert.equal(screenSource.includes(token), true, `G5 must preserve ${token}`);
  }
});
