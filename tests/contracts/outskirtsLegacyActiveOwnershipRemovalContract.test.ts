import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import {
  createActiveOutskirtsMockupFixture,
  createOutskirtsDefeatTransitionMockupFixture,
  createOutskirtsMockupFixture,
  createOutskirtsVictoryTransitionMockupFixture,
} from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('C9 Test A: legacy active files are gone', () => {
  const removed = [
    'src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx',
    'src/features/world/outskirts/components/OutskirtsActiveContainment.tsx',
    'src/features/world/outskirts/components/OutskirtsActiveContainment.scss',
    'src/ui/world/OutskirtsSummaryCard.tsx',
    'src/ui/world/buildOutskirtsActionStripState.ts',
    'src/ui/world/buildOutskirtsInformationHierarchySurface.ts',
    'src/ui/world/buildOutskirtsSupportContextSurface.ts',
    'src/ui/world/buildOutskirtsFxProfile.ts',
    'src/features/world/outskirts/shell/OutskirtsExactShellScaffold.ts',
    'src/features/world/outskirts/shell/index.ts',
  ];
  for (const path of removed) assert.equal(fs.existsSync(path), false);
});

void test('C9 Test B: router has only exact owner path', async () => {
  const source = await readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  assert.match(source, /OutskirtsScreenOwner/);
  assert.match(source, /return <OutskirtsScreenOwner cityId=\{cityId\} \/>/);
  assert.match(source, /outskirts-view-unavailable/);
  for (const forbidden of ['OutskirtsLegacyActiveSurface', 'lazy(', 'Suspense', 'InkCombatShell', 'InkHealthBar', 'CombatModuleTopLane', 'OutskirtsSummaryCard', 'buildOutskirtsActionStripState', 'buildOutskirtsInformationHierarchySurface', 'buildOutskirtsSupportContextSurface']) {
    assert.equal(source.includes(forbidden), false);
  }
});

void test('C9 Test C: exact owner sources have no legacy active imports', async () => {
  const files = await Promise.all([
    readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8'),
    readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
    readFile('src/features/world/outskirts/components/OutskirtsCenterStage.ts', 'utf8'),
    readFile('src/features/world/outskirts/components/OutskirtsCombatTheater.ts', 'utf8'),
  ]);
  for (const source of files) {
    for (const forbidden of ['OutskirtsLegacyActiveSurface', 'OutskirtsActiveContainment', 'InkCombatShell', 'InkHealthBar', 'CombatModuleTopLane', 'OutskirtsSummaryCard', 'TrackedBountyProgressLine', 'buildOutskirtsActionStripState', 'buildOutskirtsInformationHierarchySurface', 'buildOutskirtsSupportContextSurface', 'buildOutskirtsFxProfile', 'CombatStyles.scss', 'useRunCompassSurface', 'utilityTrayShell', 'combat-options', 'images-div', 'enemy-hit-text']) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C9 Test D: production Outskirts source has no old ownership tokens', async () => {
  const files = await Promise.all([
    readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8'),
    readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8'),
    readFile('src/features/world/outskirts/components/OutskirtsCenterStage.ts', 'utf8'),
    readFile('src/features/world/outskirts/components/OutskirtsCombatTheater.ts', 'utf8'),
    readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8'),
    readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8'),
  ]);
  for (const source of files) {
    for (const forbidden of ['OutskirtsLegacyActiveSurface', 'OutskirtsActiveContainment', 'OutskirtsSummaryCard', 'buildOutskirtsActionStripState', 'buildOutskirtsInformationHierarchySurface', 'buildOutskirtsSupportContextSurface', 'buildOutskirtsFxProfile', 'outskirts-view-active-contained', 'outskirtsActiveContainment', 'cultivator-image-wrapper', 'enemy-image-wrapper', 'enemy-hit-text', 'enemy-hit-overlay', 'images-div']) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C9 Test E/F/G: active, transition, and planning exact outputs remain correct', () => {
  const activeHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' }) }));
  for (const token of ['data-testid="outskirts-exact-page"', 'data-activity-mode="active"', 'data-testid="outskirts-combat-theater"', 'data-testid="outskirts-combat-health-bars"', 'data-testid="outskirts-combat-actors"', 'data-testid="outskirts-combat-floating-hits"', 'data-testid="outskirts-combat-log-slip"', 'data-testid="outskirts-combat-chips"', 'data-testid="outskirts-active-chain-badge"', 'data-testid="outskirts-live-summary"', 'data-testid="outskirts-start-hunt-cta"', 'data-intent="stop-hunt"']) assert.equal(activeHtml.includes(token), true);
  for (const forbidden of ['ink-combat-shell', 'combatPathModule', 'outskirts-view-active-contained', 'images-div', 'enemy-hit-text', 'utilityTrayShell', 'combat-options']) assert.equal(activeHtml.includes(forbidden), false);

  const victoryHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(createOutskirtsVictoryTransitionMockupFixture(), { activityMode: 'active' }) }));
  for (const token of ['data-testid="outskirts-exact-page"', 'data-testid="outskirts-combat-theater"', 'data-testid="outskirts-combat-theater-layer-result"', 'data-testid="outskirts-combat-result-overlay"', 'Victory', 'Stop Hunt', 'Live Summary']) assert.equal(victoryHtml.includes(token), true);
  for (const forbidden of ['ink-combat-shell', 'outskirts-view-active-contained', 'combatPathModule', 'utilityTrayShell']) assert.equal(victoryHtml.includes(forbidden), false);

  const defeatHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(createOutskirtsDefeatTransitionMockupFixture(), { activityMode: 'active' }) }));
  assert.equal(defeatHtml.includes('data-testid="outskirts-combat-result-overlay"'), true);
  assert.equal(defeatHtml.includes('Defeated'), true);
  assert.equal(defeatHtml.includes('data-testid="outskirts-exact-page"'), true);

  const planningHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ isOutskirtsActive: false }), { activityMode: 'planning' }) }));
  for (const token of ['data-testid="outskirts-exact-page"', 'data-center-mode="planning"', 'data-testid="outskirts-exact-scene-plane"', 'Start Hunt']) assert.equal(planningHtml.includes(token), true);
  for (const forbidden of ['data-testid="outskirts-combat-theater"', 'data-testid="outskirts-active-chain-badge"', 'data-testid="outskirts-live-summary"', 'Stop Hunt']) assert.equal(planningHtml.includes(forbidden), false);
});

void test('C9 Test H: modal entry keeps combat-world exact modules screen-owned', async () => {
  const source = await readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');
  assert.match(source, /case 'outskirts':[\s\S]*backgroundVariant = 'outskirts-exact'/);
  assert.match(source, /case 'outskirts':[\s\S]*shellFamily = 'outskirts-scenic'/);
  assert.match(source, /case 'outskirts':[\s\S]*shellMode = 'screen-owned'/);
  assert.match(source, /case 'outskirts':[\s\S]*showShellClose = false/);
  assert.match(source, /case 'gateTrial':[\s\S]*shellFamily = 'gate-trial-scenic'/);
  assert.match(source, /case 'gateTrial':[\s\S]*shellMode = 'screen-owned'/);
  assert.match(source, /case 'ruins':[\s\S]*shellFamily = 'ruins-scenic'/);
  assert.match(source, /case 'ruins':[\s\S]*shellMode = 'screen-owned'/);
});

void test('C9 Test I: shared combat infrastructure remains available', () => {
  for (const path of [
    'src/ui/combat/InkCombatShell.tsx',
    'src/ui/combat/InkHealthBar.tsx',
    'src/ui/world/combat/CombatModuleTopLane.tsx',
    'src/ui/world/combat/combatModuleTopLaneModel.ts',
    'src/ui/world/TrackedBountyProgressLine.tsx',
  ]) {
    assert.equal(fs.existsSync(path), true);
  }
});
