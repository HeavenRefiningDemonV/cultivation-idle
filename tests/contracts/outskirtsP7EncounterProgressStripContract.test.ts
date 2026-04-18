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

void test('P7 adapter exposes manifest-driven encounterProgressStrip in locked Pinewind order', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot());
  assert.ok(surface.encounterProgressStrip);
  const labels = surface.encounterProgressStrip.nodes.map((node) => node.label);
  assert.deepEqual(labels, ['Quiet Glade', 'Rockjaw Boar', 'Snarling Wolf', 'Venomcoil', 'Shade Stalker', 'Mire Serpent']);
  assert.equal(surface.encounterProgressStrip.leftArrow.visible, true);
  assert.equal(surface.encounterProgressStrip.rightArrow.visible, true);
});

void test('P7 strip renders arrows and distinct completed/current/future node states', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(makeSnapshot()) }));
  assert.match(html, /outskirts-encounter-progress-left-arrow/);
  assert.match(html, /outskirts-encounter-progress-right-arrow/);
  assert.match(html, /data-node-state="completed"/);
  assert.match(html, /data-node-state="current"/);
  assert.match(html, /data-node-state="future"/);
  assert.equal(html.includes('Start Hunt'), false);
});

void test('P7 component remains presentation-only and does not inspect raw mobPool', () => {
  const stripPath = path.resolve(process.cwd(), 'src/features/world/outskirts/components/OutskirtsEncounterProgressStrip.ts');
  const source = fs.readFileSync(stripPath, 'utf-8');
  assert.equal(source.includes('mobPool'), false);
});
