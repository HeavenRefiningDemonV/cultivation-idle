import assert from 'node:assert/strict';
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
    selectedLoadoutName: 'Loadout 2',
    aiProfile: 'balanced',
    preferredTarget: 'boss',
    medicinePouchLine: 'Minor Tonic (hpBelowPct)',
    medicinePouchCountCurrent: 12,
    medicinePouchCountCap: 20,
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

void test('P5 setup card model exposes required groups and keeps derived fallback stats visible', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot({ selectedLoadoutName: null, preferredTarget: null }));
  assert.equal(surface.setupCard.title, 'Your Setup');
  assert.deepEqual(surface.setupCard.primaryRows.map((row) => row.label), ['Loadout Set', 'AI Profile', 'Attack Focus']);
  assert.deepEqual(surface.setupCard.offenseRows.map((row) => row.label), ['ATK', 'ACC', 'CRIT']);
  assert.deepEqual(surface.setupCard.defenseRows.map((row) => row.label), ['HP', 'EVA', 'RES']);
  assert.equal(surface.setupCard.offenseRows[1].value.text.length > 0, true);
  assert.equal(surface.setupCard.defenseRows[1].value.text.length > 0, true);
  assert.equal(surface.setupCard.defenseRows[2].value.text.length > 0, true);
  assert.equal(surface.setupCard.medicinePouchRow.count.text, '12 / 20');
  assert.equal(surface.setupCard.equipmentSlots.length, 6);
});

void test('P5 setup card renders sections in exact order and fixed 2x3 grid without rewards/cta leakage', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(makeSnapshot()) }));
  const ordered = ['Your Setup', 'Loadout Set', 'AI Profile', 'Attack Focus', 'Offense', 'ATK', 'ACC', 'CRIT', 'Defense', 'HP', 'EVA', 'RES', 'Medicine Pouch', 'Equipment'];
  let cursor = 0;
  ordered.forEach((token) => {
    const next = html.indexOf(token, cursor);
    assert.ok(next >= 0, `missing token ${token}`);
    cursor = next;
  });

  const cellCount = (html.match(/outskirtsSetupCard__equipmentCell/g) ?? []).length;
  assert.equal(cellCount, 6);
  assert.match(html, /outskirts-setup-medicine/);
  assert.equal(html.includes('Rewards & Route'), false);
  assert.equal(html.includes('outskirts-primary-action'), false);
});
