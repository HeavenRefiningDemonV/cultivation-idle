import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OUTSKIRTS_ASSETS } from '../../src/features/world/outskirts/outskirtsAssetRegistry.js';
import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';

void test('Packet A owner baseline keeps OutskirtsScreenOwner mounted for planning/active without legacy fallback', async () => {
  const panelSource = await readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const modalSource = await readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.match(panelSource, /OutskirtsScreenOwner/);
  assert.doesNotMatch(panelSource, /OutskirtsLegacyActiveSurface/);
  assert.doesNotMatch(panelSource, /Suspense/);
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
});

void test('Packet A asset registry contract resolves key Outskirts visual assets', () => {
  assert.equal(typeof OUTSKIRTS_ASSETS.scenic.approvedMockup, 'string');
  assert.equal(typeof OUTSKIRTS_ASSETS.scenic.cityOutskirtsBackdrop, 'string');
  assert.equal(typeof OUTSKIRTS_ASSETS.stripArt.wolfEnemy, 'string');

  assert.equal(typeof OUTSKIRTS_ASSETS.icons.tactical.hp, 'string');
  assert.equal(typeof OUTSKIRTS_ASSETS.icons.setupPrimary.loadoutSet, 'string');
  assert.equal(typeof OUTSKIRTS_ASSETS.icons.rewards.materials['wolf-pelt'], 'string');
  assert.equal(typeof OUTSKIRTS_ASSETS.icons.grindSummary.runs, 'string');
});

void test('Packet A no broken raw-src contract for Outskirts exact-screen module set', async () => {
  const exactModulePaths = [
    'src/features/world/outskirts/buildOutskirtsMockupSurface.ts',
    'src/features/world/outskirts/outskirtsMockupPresentation.ts',
    'src/features/world/outskirts/resolveOutskirtsScenicAsset.ts',
    'src/features/world/outskirts/resolveOutskirtsEncounterStripArt.ts',
    'src/features/world/outskirts/components/OutskirtsTacticalStrip.ts',
    'src/features/world/outskirts/components/OutskirtsSetupCard.ts',
    'src/features/world/outskirts/components/OutskirtsRewardsCard.ts',
    'src/features/world/outskirts/components/OutskirtsEncounterProgressStrip.ts',
    'src/features/world/outskirts/components/OutskirtsGrindSummaryCard.ts',
  ] as const;

  for (const path of exactModulePaths) {
    const source = await readFile(path, 'utf8');
    assert.equal(source.includes("'/assets/"), false, `${path} contains legacy single-quoted /assets path`);
    assert.equal(source.includes('"/assets/'), false, `${path} contains legacy double-quoted /assets path`);
  }
});

void test('Packet A render-tree truth preserves identity row + planning lower band', () => {
  const html = renderToStaticMarkup(
    React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(createOutskirtsMockupFixture()) }),
  );

  assert.equal(html.includes('data-testid="outskirts-exact-encounter-identity-row"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-encounter-name">Snarling Wolf<'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-encounter-safe-chip">Safe<'), true);
  assert.equal(html.includes('Watch</button>'), false);

  assert.equal(html.includes('data-testid="outskirts-exact-encounter-strip"'), true);
  assert.equal(html.includes('data-testid="outskirts-start-hunt-cta"'), true);
  assert.equal(html.includes('data-testid="outskirts-grind-summary"'), true);
});

void test('Packet A planning-state purity smoke keeps single CTA and static planning shell flags', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  assert.equal(surface.primaryAction.singleDominantCta, true);
  assert.equal(surface.shell.usePlanningState, true);
  assert.equal(surface.shell.showCombatTheater, false);
  assert.equal(surface.shell.rightCardHasPrimaryAction, false);
});
