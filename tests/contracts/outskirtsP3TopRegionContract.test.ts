import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';
import type { OutskirtsMockupRuntimeSnapshot } from '../../src/features/world/outskirts/types.js';

function makeSnapshot(overrides: Partial<OutskirtsMockupRuntimeSnapshot> = {}): OutskirtsMockupRuntimeSnapshot {
  return {
    cityId: 'city_pinewind_hamlet',
    cityName: 'Pinewind Hamlet',
    outskirtsId: 'outskirts_pinewind',
    killsToBoss: 10,
    progress: { killsSinceBoss: 2, totalKills: 8, bossDefeated: false },
    playerStats: { hp: '1000', maxHp: '1200', atk: '130', crit: 16, dodge: 8 },
    selectedLoadoutName: 'Loadout 1',
    aiProfile: 'balanced',
    preferredTarget: 'boss',
    medicinePouchLine: 'Minor Tonic (hpBelowPct)',
    medicinePouchCountCurrent: 12,
    medicinePouchCountCap: 20,
    trackedBountyLine: 'Cull field beasts: 4 / 10',
    commonMaterialsLine: 'Common mats: Fur, Bone, Bark',
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

void test('tactical strip keeps exactly seven cells in locked order', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot());
  const ids = surface.tacticalStrip.cells.map((cell) => cell.id);
  assert.deepEqual(ids, ['hp', 'danger', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition']);
});

void test('top region renders title, macro line, tactical strip, and centered plaque', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(makeSnapshot()) }));
  assert.match(html, /Outskirts/);
  assert.match(html, /outskirts-macro-line/);
  assert.match(html, /outskirts-tactical-strip/);
  assert.match(html, /outskirts-area-plaque/);
});

void test('planning exact screen source does not import RunCompass or CombatModuleTopLane', () => {
  const screenPath = path.resolve(process.cwd(), 'src/features/world/outskirts/OutskirtsExactMockupScreen.ts');
  const source = fs.readFileSync(screenPath, 'utf-8');
  assert.equal(source.includes('RunCompassCompact'), false);
  assert.equal(source.includes('CombatModuleTopLane'), false);
});

void test('world route contract and non-outskirts shell branches remain intact', () => {
  const modalPath = path.resolve(process.cwd(), 'src/components/modals/WorldBuildingModal.tsx');
  const modalSource = fs.readFileSync(modalPath, 'utf-8');
  assert.match(modalSource, /case 'outskirts':\s+content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/s);

  const ruinsSurface = resolveWorldModalEntrySurface({
    buildingKey: 'ruins',
    cityName: 'Pinewind',
    intent: null,
    isStoreMode: true,
  });
  const gateSurface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(ruinsSurface.backgroundVariant, 'inside-dungeon');
  assert.equal(gateSurface.backgroundVariant, 'inside-dungeon');
});
