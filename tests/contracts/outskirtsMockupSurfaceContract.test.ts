import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import {
  FALLBACK_OUTSKIRTS_MOCKUP_CITY_ID,
  OUTSKIRTS_MOCKUP_PRESENTATION_BY_CITY,
  getOutskirtsMockupPresentation,
} from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';
import type { OutskirtsMockupRuntimeSnapshot } from '../../src/features/world/outskirts/types.js';

function makeSnapshot(overrides: Partial<OutskirtsMockupRuntimeSnapshot> = {}): OutskirtsMockupRuntimeSnapshot {
  return {
    cityId: 'city_pinewind_hamlet',
    cityName: 'Pinewind Hamlet',
    outskirtsId: 'outskirts_pinewind',
    killsToBoss: 10,
    progress: {
      killsSinceBoss: 4,
      totalKills: 22,
      bossDefeated: false,
    },
    playerStats: {
      hp: '920',
      maxHp: '1100',
      atk: '145',
      crit: 17,
      dodge: 9,
    },
    selectedLoadoutName: 'Loadout 1',
    aiProfile: 'balanced',
    preferredTarget: 'boss',
    medicinePouchLine: 'Minor Tonic (hpBelowPct)',
    trackedBountyLine: 'Cull field beasts: 4 / 10',
    commonMaterialsLine: 'Common mats: Fur, Bone, Bark',
    autoRepeatLine: 'Auto-continue On • Stop at boss Off',
    expeditionLine: '1 running • 0 complete',
    weaponName: 'Pinewind Saber',
    accessoryName: 'Warden Charm',
    weaponRefineLevel: 2,
    accessoryRefineLevel: 1,
    isOutskirtsActive: false,
    ...overrides,
  };
}

void test('presentation manifest includes Pinewind and required structure', () => {
  const manifest = OUTSKIRTS_MOCKUP_PRESENTATION_BY_CITY[FALLBACK_OUTSKIRTS_MOCKUP_CITY_ID];
  assert.ok(manifest);
  assert.equal(typeof manifest.screenTitle, 'string');
  assert.equal(typeof manifest.selectorLabel, 'string');
  assert.equal(typeof manifest.subtitle, 'string');
  assert.equal(typeof manifest.scenicPlateAsset, 'string');
  assert.equal(typeof manifest.grindSummaryLabel, 'string');
  assert.equal(typeof manifest.defaultRoleLine, 'string');
  assert.ok(manifest.encounterNodes.length >= 6);
});

void test('pinewind encounter node sequence is locked and ordered', () => {
  const manifest = getOutskirtsMockupPresentation('city_pinewind_hamlet');
  const names = manifest.encounterNodes.map((node) => node.displayName);
  assert.deepEqual(names, [
    'Quiet Glade',
    'Rockjaw Boar',
    'Snarling Wolf',
    'Venomcoil',
    'Shade Stalker',
    'Mire Serpent',
  ]);
  assert.equal(manifest.selectedEncounterId, 'quiet-glade');
});

void test('builder returns fully shaped OutskirtsMockupSurface', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot());
  assert.equal(surface.page.title, 'Outskirts');
  assert.equal(surface.tacticalStrip.cells.length, 7);
  assert.equal(surface.selectorPlaque.selectorLabel.length > 0, true);
  assert.equal(surface.setupCard.offense.acc.id, 'acc');
  assert.equal(surface.setupCard.defense.res.id, 'res');
  assert.equal(surface.rewardsCard.goldRange.text.length > 0, true);
  assert.equal(surface.encounterStrip.nodes.length, 6);
  assert.equal(surface.primaryAction.binding.actionId, 'outskirts:start');
  assert.equal(surface.shell.liveMounted, false);
});

void test('builder emits explicit synthetic/derived fallbacks when first-class fields are absent', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot({
    selectedLoadoutName: null,
    medicinePouchLine: null,
    trackedBountyLine: null,
    commonMaterialsLine: null,
    expeditionLine: 'No expedition overlap',
  }));

  assert.equal(surface.setupCard.offense.acc.value.source, 'synthetic');
  assert.equal(surface.setupCard.defense.res.value.source, 'synthetic');
  assert.equal(surface.grindSummary.goldPerHour.source, 'synthetic');
  assert.equal(surface.setupCard.loadoutSet.source, 'derived');
  assert.equal(surface.rewardsCard.trackedBountyProgress.source, 'derived');
});

void test('exact mockup entry component renders top-region scaffold from one surface object with no store imports', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  [
    'outskirts-exact-top-region',
    'outskirts-top-title',
    'outskirts-macro-line',
    'outskirts-tactical-strip',
    'outskirts-area-plaque',
    'outskirts-exact-lower-scaffold',
  ].forEach((testId) => {
    assert.match(html, new RegExp(testId));
  });

  const componentPath = path.resolve(process.cwd(), 'src/features/world/outskirts/OutskirtsExactMockupScreen.ts');
  const source = fs.readFileSync(componentPath, 'utf-8');
  assert.equal(source.includes('/stores/'), false);
});
