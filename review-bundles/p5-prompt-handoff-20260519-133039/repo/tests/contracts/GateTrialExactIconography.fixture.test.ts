import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact T3 defines a unified icon component and canonical icon keys', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactIcon.ts', 'utf8');

  for (const required of [
    'export type GateTrialExactIconKey',
    'export type GateTrialExactIconSize',
    'export interface GateTrialExactIconProps',
    'export function normalizeGateTrialExactIconKey',
    'export function GateTrialExactIcon',
    'renderGateTrialExactIconPaths',
    "'hp'",
    "'gateMarker'",
    "'loadout'",
    "'aiProfile'",
    "'healing'",
    "'bounty'",
    "'expedition'",
    "'statusCheck'",
    "'statusWarning'",
    "'statusLock'",
    "'weapon'",
    "'technique'",
    "'foundationPill'",
    "'failureSeal'",
    "'currencySeal'",
    "'reserveSeal'",
    "'safetyNet'",
    "'ruinSupport'",
    "'unknown'",
  ]) {
    assert.equal(source.includes(required), true, `missing icon component token ${required}`);
  }
});

void test('Gate Trial Exact T3 icon component avoids external icon libraries and Unicode glyph shortcuts', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactIcon.ts', 'utf8');

  for (const forbidden of [
    'lucide-react',
    'GameIcon',
    'iconRegistry',
    'InkIcon',
    'dangerouslySetInnerHTML',
    '<text',
    'content:',
    '✓',
    '✔',
    '⚠',
    '🔒',
    '→',
    '›',
    '»',
    '◆',
    '✦',
  ]) {
    assert.equal(source.includes(forbidden), false, `Gate Trial exact icon component must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 renders unified tactical strip icons from surface icon keys', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const required of [
    'data-testid="gate-trial-icon-hp"',
    'data-testid="gate-trial-icon-gate"',
    'data-testid="gate-trial-icon-loadout"',
    'data-testid="gate-trial-icon-aiProfile"',
    'data-testid="gate-trial-icon-healing"',
    'data-testid="gate-trial-icon-bounty"',
    'data-testid="gate-trial-icon-expedition"',
    'data-icon-key="hp"',
    'data-icon-key="gateMarker"',
    'data-icon-key="loadout"',
    'data-icon-key="aiProfile"',
    'data-icon-key="healing"',
    'data-icon-key="bounty"',
    'data-icon-key="expedition"',
  ]) {
    assert.equal(html.includes(required), true, `missing tactical icon marker ${required}`);
  }

  for (const forbidden of [
    'gateTrialTacticalCell__icon--hp',
    'gateTrialTacticalCell__icon--gate',
    'gateTrialTacticalCell__icon--loadout',
    'gateTrialTacticalCell__icon--aiProfile',
    'gateTrialTacticalCell__icon--healing',
    'gateTrialTacticalCell__icon--bounty',
    'gateTrialTacticalCell__icon--expedition',
  ]) {
    assert.equal(html.includes(forbidden), false, `old tactical pseudo-icon class must not render ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 renders side-panel, reward, safety-net, and rail icons', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const required of [
    'data-testid="gate-trial-guardian-reward-icon"',
    'data-testid="gate-trial-icon-foundationPill"',
    'data-testid="gate-trial-icon-failsafe-eligibleFailures"',
    'data-testid="gate-trial-icon-failsafe-cost"',
    'data-testid="gate-trial-icon-failsafe-reserve"',
    'data-testid="gate-trial-icon-safetyNet"',
    'data-testid="gate-trial-icon-top-fix-forgeWeapon"',
    'data-testid="gate-trial-icon-top-fix-stockHealing"',
    'data-testid="gate-trial-icon-top-fix-upgradeTechnique"',
    'data-testid="gate-trial-icon-readiness-qiCap"',
    'data-testid="gate-trial-icon-readiness-loadout"',
    'data-testid="gate-trial-icon-readiness-weapon"',
    'data-testid="gate-trial-icon-readiness-medicine"',
    'data-testid="gate-trial-icon-readiness-techniques"',
    'data-testid="gate-trial-icon-readiness-safetyNet"',
    'data-testid="gate-trial-icon-readiness-gate"',
    'data-icon-key="foundationPill"',
    'data-icon-key="failureSeal"',
    'data-icon-key="currencySeal"',
    'data-icon-key="reserveSeal"',
    'data-icon-key="safetyNet"',
    'data-icon-key="weapon"',
    'data-icon-key="technique"',
  ]) {
    assert.equal(html.includes(required), true, `missing side/reward/rail icon marker ${required}`);
  }
});

void test('Gate Trial Exact T3 screen imports unified icon component and removes crude tactical pseudo-icon usage', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.equal(source.includes("import { GateTrialExactIcon } from './GateTrialExactIcon.js'"), true);

  for (const required of [
    'GateTrialExactIcon',
    'cell.iconKey',
    'row.iconKey',
    'fix.iconKey',
    'surface.scenicStage.guardianPlaque.rewardIconKey',
    'gate-trial-icon-readiness-',
    'gate-trial-icon-top-fix-',
  ]) {
    assert.equal(source.includes(required), true, `screen must use icon token ${required}`);
  }

  for (const forbidden of [
    'gateTrialTacticalCell__icon--${cell.id}',
    'gateTrialTacticalCell__icon--hp',
    'gateTrialTacticalCell__icon--gate',
    'gateTrialTacticalCell__icon--loadout',
    'gateTrialTacticalCell__icon--aiProfile',
    'gateTrialTacticalCell__icon--healing',
    'gateTrialTacticalCell__icon--bounty',
    'gateTrialTacticalCell__icon--expedition',
  ]) {
    assert.equal(source.includes(forbidden), false, `screen must not use old pseudo icon token ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 SCSS contains unified icon selectors and removes old pseudo-icon selectors', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialExactIcon',
    '.gateTrialExactIcon__svg',
    '.gateTrialExactIcon__stroke',
    '.gateTrialExactIcon__fill',
    '.gateTrialExactIcon__accent',
    '.gateTrialExactIcon__softFill',
    '.gateTrialExactIcon--micro',
    '.gateTrialExactIcon--tactical',
    '.gateTrialExactIcon--chip',
    '.gateTrialExactIcon--status',
    '.gateTrialExactIcon--panel',
    '.gateTrialExactIcon--reward',
    '.gateTrialExactIcon--rail',
    '.gateTrialExactIcon--railGate',
    '.gateTrialExactIcon--tone-positive',
    '.gateTrialExactIcon--tone-warning',
    '.gateTrialExactIcon--tone-locked',
    '.gateTrialExactIcon--tone-ceremonial',
    '.gateTrialTacticalCell__iconDock',
    '.gateTrialStatusMedallion__icon',
    '.gateTrialGateHeader__chipIcon',
    '.gateTrialRecommendedPanel__factIcon',
    '.gateTrialRecommendedPanel__safetyNetIcon',
    '.gateTrialRecommendedPanel__topFixIcon',
    '.gateTrialGuardianPlaque__rewardIcon',
    '.gateTrialReadinessRail__icon',
  ]) {
    assert.equal(scss.includes(required), true, `missing unified icon SCSS selector ${required}`);
  }

  for (const forbidden of [
    '.gateTrialTacticalCell__icon--hp::before',
    '.gateTrialTacticalCell__icon--gate::before',
    '.gateTrialTacticalCell__icon--gate::after',
    '.gateTrialTacticalCell__icon--loadout::before',
    '.gateTrialTacticalCell__icon--aiProfile::before',
    '.gateTrialTacticalCell__icon--healing::before',
    '.gateTrialTacticalCell__icon--healing::after',
    '.gateTrialTacticalCell__icon--bounty::before',
    '.gateTrialTacticalCell__icon--expedition::before',
    '.gateTrialTacticalCell__icon--expedition::after',
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
  ]) {
    assert.equal(scss.includes(forbidden), false, `SCSS must not contain old pseudo-icon or glyph token ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 preserves T1 layout refit and T2 CTA de-green', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const required of [
    '--gate-scenic-min-height',
    '--gate-page-pad-bottom',
    '--gate-left-rail-top-offset',
    '--gate-right-rail-top-offset',
    '--gate-summary-lift',
    'minmax(var(--gate-scenic-min-height), 1fr)',
    'grid-template-columns: minmax(0, 1fr)',
    '.gateTrialPrimaryCta__glow',
    '.gateTrialPrimaryCta__ring',
    '.gateTrialPrimaryCta__plate',
    '.gateTrialPrimaryCta__plateEdge',
    '.gateTrialPrimaryCta__label',
  ]) {
    assert.equal(scss.includes(required), true, `T3 must preserve layout/CTA token ${required}`);
  }

  for (const forbidden of [
    'minmax(0, var(--gate-scenic-height))',
    'gate-trial-primary-cta-ornament-left',
    'gate-trial-primary-cta-ornament-right',
    'gateTrialPrimaryCta__ornamentCore',
    '.gateTrialPrimaryCta__ornament',
    '.gateTrialPrimaryCta__plate::before',
    '.gateTrialPrimaryCta__plate::after',
  ]) {
    assert.equal(`${scss}\n${screen}`.includes(forbidden), false, `T3 must not regress T1/T2 token ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 barrel exports unified icon component', () => {
  const source = readFileSync('src/features/world/gateTrialExact/index.ts', 'utf8');

  assert.equal(source.includes('./GateTrialExactIcon.js'), true);
});
