import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OUTSKIRTS_ALLOWED_PLANNING_SHELL } from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { OutskirtsStartHuntCta } from '../../src/features/world/outskirts/components/OutskirtsStartHuntCta.js';

void test('C0 active surface model contract keeps exact-shell ownership and stop CTA intent', () => {
  const fixture = createOutskirtsMockupFixture({ isOutskirtsActive: true });
  const surface = buildOutskirtsMockupSurface(fixture, { activityMode: 'active' });

  assert.equal(surface.meta.activityMode, 'active');
  assert.equal(surface.primaryAction.label, 'Stop Hunt');
  assert.equal(surface.primaryAction.intent, 'stop-hunt');
  assert.equal(surface.primaryAction.enabled, true);
  assert.equal(surface.areaHeader.subtitle, 'Quiet Glade hunt in progress');
  assert.equal(surface.shell.showCombatModuleTopLane, false);
  assert.equal(surface.shell.showCombatTheater, false);
  assert.equal(surface.shell.showCombatHpBars, false);
  assert.equal(surface.shell.showCombatLog, false);
  assert.equal(surface.shell.showCombatOptions, false);
  assert.equal(surface.shell.singleDominantCta, true);
  assert.equal(surface.shell.useScenicCenter, true);
  assert.equal(surface.shell.usePlanningState, false);
});

void test('C0 active exact page render contract keeps exact screen mounted and blocks legacy tokens', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: true }), { activityMode: 'active' });
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page"'), true);
  assert.equal(html.includes('data-activity-mode="active"'), true);
  assert.equal(html.includes('Stop Hunt'), true);
  assert.equal(html.includes('data-intent="stop-hunt"'), true);
  assert.equal(html.includes('Quiet Glade hunt in progress'), true);

  for (const token of [
    'outskirts-exact-left-rail',
    'outskirts-exact-center-scenic-slot',
    'outskirts-exact-right-rail',
    'outskirts-exact-strip-slot',
    'outskirts-exact-cta-slot',
    'outskirts-exact-summary-dock',
  ]) {
    assert.equal(html.includes(token), true);
  }

  for (const forbidden of [
    'ink-combat-shell',
    'combatPathModule',
    'images-div',
    'cultivator-image-wrapper',
    'enemy-image-wrapper',
    'outskirts-view-active-contained',
  ]) {
    assert.equal(html.includes(forbidden), false);
  }
});

void test('C0 planning surface remains unchanged', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' });

  assert.equal(surface.meta.activityMode, 'planning');
  assert.equal(surface.primaryAction.label, 'Start Hunt');
  assert.equal(surface.primaryAction.intent, 'start-hunt');
  assert.equal(surface.areaHeader.subtitle, 'Gold and common materials');
  assert.deepEqual(surface.shell, OUTSKIRTS_ALLOWED_PLANNING_SHELL);
});

void test('C0 CTA callback contract uses primary action callback for stop intent', () => {
  let called = 0;
  const element = OutskirtsStartHuntCta({
    cta: {
      label: 'Stop Hunt',
      ariaLabel: 'Stop Outskirts hunt',
      visible: true,
      enabled: true,
      intent: 'stop-hunt',
      singleDominantCta: true,
      isPrimary: true,
    },
    onPrimaryAction: () => {
      called += 1;
    },
  });

  assert.equal(element?.props['data-testid'], 'outskirts-start-hunt-cta');
  assert.equal(element?.props['data-intent'], 'stop-hunt');
  element?.props.onClick?.();
  assert.equal(called, 1);
});

void test('C0 source guard: router no longer references legacy active surface or lazy boundaries', async () => {
  const router = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');

  assert.doesNotMatch(router, /OutskirtsLegacyActiveSurface/);
  assert.doesNotMatch(router, /lazy\(/);
  assert.doesNotMatch(router, /Suspense/);
  assert.match(router, /OutskirtsScreenOwner/);
});
