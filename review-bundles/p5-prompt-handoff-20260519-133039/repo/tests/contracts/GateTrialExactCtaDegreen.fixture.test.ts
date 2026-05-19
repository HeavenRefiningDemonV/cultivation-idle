import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact T2 renders primary CTA without green ornament DOM', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const required of [
    'data-testid="gate-trial-exact-cta-slot"',
    'data-testid="gate-trial-primary-cta"',
    'data-testid="gate-trial-primary-cta-glow"',
    'data-testid="gate-trial-primary-cta-ring"',
    'data-testid="gate-trial-primary-cta-plate"',
    'data-testid="gate-trial-primary-cta-label"',
    'Attempt Gate',
  ]) {
    assert.equal(html.includes(required), true, `missing CTA token ${required}`);
  }

  for (const forbidden of [
    'data-testid="gate-trial-primary-cta-ornament-left"',
    'data-testid="gate-trial-primary-cta-ornament-right"',
    'gateTrialPrimaryCta__ornament',
    'gateTrialPrimaryCta__ornamentCore',
  ]) {
    assert.equal(html.includes(forbidden), false, `CTA must not render removed ornament token ${forbidden}`);
  }
});

void test('Gate Trial Exact T2 keeps primary CTA as one enabled ceremonial action button', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

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

void test('Gate Trial Exact T2 removes CTA green ornament selectors and pseudo-elements', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialPrimaryCta',
    '.gateTrialPrimaryCta__glow',
    '.gateTrialPrimaryCta__ring',
    '.gateTrialPrimaryCta__plate',
    '.gateTrialPrimaryCta__plateEdge',
    '.gateTrialPrimaryCta__label',
    'grid-template-columns: minmax(0, 1fr)',
  ]) {
    assert.equal(scss.includes(required), true, `missing de-greened CTA SCSS token ${required}`);
  }

  for (const forbidden of [
    '.gateTrialPrimaryCta__ornament',
    '.gateTrialPrimaryCta__ornament--left',
    '.gateTrialPrimaryCta__ornament--right',
    '.gateTrialPrimaryCta__ornamentCore',
    '.gateTrialPrimaryCta__plate::before',
    '.gateTrialPrimaryCta__plate::after',
  ]) {
    assert.equal(scss.includes(forbidden), false, `CTA SCSS must remove ${forbidden}`);
  }
});

void test('Gate Trial Exact T2 CTA SCSS slice contains no green blob palette', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  const ctaStart = scss.indexOf('.gateTrialPrimaryCta {');
  assert.notEqual(ctaStart, -1, 'CTA SCSS block missing');

  const nextSectionCandidates = [
    scss.indexOf('.gateTrialScenicStage--active', ctaStart),
    scss.indexOf('.gateTrialScenicStage--hasResult', ctaStart),
    scss.indexOf('.gateTrialResultTransition', ctaStart),
  ].filter((index) => index > ctaStart);

  const ctaEnd = nextSectionCandidates.length > 0
    ? Math.min(...nextSectionCandidates)
    : scss.length;

  const ctaSlice = scss.slice(ctaStart, ctaEnd);

  for (const forbidden of [
    'rgba(47, 106, 76',
    'rgba(22, 69, 50',
    'rgba(63, 126, 82',
    'rgba(28, 78, 55',
    'rgba(207, 238, 190',
    'rgba(231, 251, 206',
    'rgba(70, 119, 80',
    'scaleX(-1)',
  ]) {
    assert.equal(ctaSlice.includes(forbidden), false, `CTA slice must not contain green ornament marker ${forbidden}`);
  }

  for (const required of [
    '#d8b35d',
    '#bd8d3f',
    '#99682b',
    'rgba(166, 116, 42',
  ]) {
    assert.equal(ctaSlice.includes(required), true, `CTA slice should retain gold/bronze marker ${required}`);
  }
});

void test('Gate Trial Exact T2 preserves gameplay actions while live route ownership is exact', () => {
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const actionController = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');

  assert.equal(screen.includes('onPrimaryAction?.()'), true, 'CTA must still call provided primary action handler');
  assert.equal(actionController.includes('attempt-gate'), true, 'G8 action controller must remain present');
  assert.equal(actionController.includes('stop-attempt'), true, 'G8 stop action must remain present');
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false, 'normal World route must not default to fixture mode');
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true, 'normal World route must open the live exact Gate Trial');
});

void test('Gate Trial Exact T2 preserves T1 layout refit tokens', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '--gate-scenic-min-height',
    '--gate-page-pad-bottom',
    '--gate-left-rail-top-offset',
    '--gate-right-rail-top-offset',
    '--gate-summary-lift',
    'minmax(var(--gate-scenic-min-height), 1fr)',
    '.gateTrialExactPage__readinessRailSlot',
    '.gateTrialExactPage__ctaSlot',
  ]) {
    assert.equal(scss.includes(required), true, `T2 must preserve T1 layout token ${required}`);
  }

  assert.equal(
    scss.includes('minmax(0, var(--gate-scenic-height))'),
    false,
    'T2 must not regress to old fixed scenic row',
  );
});
