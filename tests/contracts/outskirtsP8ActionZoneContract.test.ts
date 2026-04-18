import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import type { OutskirtsMockupRuntimeSnapshot } from '../../src/features/world/outskirts/types.js';

function makeSnapshot(overrides: Partial<OutskirtsMockupRuntimeSnapshot> = {}): OutskirtsMockupRuntimeSnapshot {
  return {
    cityId: 'city_pinewind_hamlet',
    cityName: 'Pinewind Hamlet',
    outskirtsId: 'outskirts_pinewind',
    killsToBoss: 10,
    progress: { killsSinceBoss: 4, totalKills: 22, bossDefeated: false },
    playerStats: { hp: '920', maxHp: '1100', atk: '145', crit: 17, dodge: 9 },
    selectedLoadoutName: 'Loadout 2',
    aiProfile: 'balanced',
    preferredTarget: 'boss',
    medicinePouchLine: 'Minor Tonic (hpBelowPct)',
    medicinePouchCountCurrent: 12,
    medicinePouchCountCap: 20,
    trackedBountyLine: 'Cull field beasts: 7 / 15',
    commonMaterialsLine: 'Common mats: Wolf Pelt, Beast Bone, Green Herb',
    autoRepeatLine: 'Auto-continue On • Stop at boss Off',
    autoRepeatEnabled: true,
    expeditionLine: '1 running • 0 complete',
    weaponName: 'Pinewind Saber',
    accessoryName: 'Warden Charm',
    weaponRefineLevel: 2,
    accessoryRefineLevel: 1,
    isOutskirtsActive: false,
    ...overrides,
  };
}

void test('P8 planning surface renders one dominant Start Hunt CTA and a subordinate Grind Summary card', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, {
    surface: buildOutskirtsMockupSurface(makeSnapshot()),
    onStartHunt: () => undefined,
  }));
  assert.match(html, /outskirts-start-hunt-cta/);
  assert.equal((html.match(/Start Hunt/g) ?? []).length, 1);
  assert.match(html, /outskirts-grind-summary-card/);
  assert.match(html, /Grind Summary/);
  assert.equal(html.includes('outskirts-primary-action'), false);
});

void test('P8 keeps CTA out of Expected Rewards card and keeps placeholder summary rows when needed', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, {
    surface: buildOutskirtsMockupSurface(makeSnapshot({ commonMaterialsLine: null })),
    onStartHunt: () => undefined,
  }));
  assert.match(html, /outskirts-expected-rewards-card/);
  assert.match(html, /outskirts-grind-summary-card/);
  assert.match(html, /Runs/);
  assert.match(html, /—/);
});

void test('P8 Start Hunt wiring reuses existing start path semantics in OutskirtsBuildingPanel', () => {
  const panelPath = path.resolve(process.cwd(), 'src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx');
  const source = fs.readFileSync(panelPath, 'utf-8');
  assert.match(source, /onStartHunt=\{handleStartHunt\}/);
  assert.match(source, /startActivity\('outskirts'/);
  assert.match(source, /startCombat\(/);
});
