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

void test('P6 adapter returns expectedRewardsCard with stable sections and formats', () => {
  const surface = buildOutskirtsMockupSurface(makeSnapshot());
  assert.equal(surface.expectedRewardsCard.title, 'Expected Rewards');
  assert.match(surface.expectedRewardsCard.goldRangeText, /\d{1,3}(,\d{3})?\s–\s\d{1,3}(,\d{3})?/);
  assert.equal(surface.expectedRewardsCard.commonMaterials.length, 4);
  assert.equal(surface.expectedRewardsCard.trackedBounty.hasTrackedBounty, true);
  assert.equal(typeof surface.expectedRewardsCard.estimatedEfficiency.timePerRunText, 'string');
  assert.equal(typeof surface.expectedRewardsCard.estimatedEfficiency.hourlyYieldText, 'string');
  assert.equal(surface.expectedRewardsCard.autoRepeat.enabled, true);
});

void test('P6 card renders section order and no CTA text', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: buildOutskirtsMockupSurface(makeSnapshot()) }));
  const ordered = ['Expected Rewards', 'Gold', 'Common Materials', 'Tracked Bounty', 'Estimated Efficiency', 'Auto-Repeat'];
  let cursor = 0;
  ordered.forEach((token) => {
    const next = html.indexOf(token, cursor);
    assert.ok(next >= 0, `missing token ${token}`);
    cursor = next;
  });
  assert.equal(html.includes('Start Hunt'), false);
  assert.equal(html.includes('outskirts-primary-action'), false);
});

void test('P6 tracked bounty empty state remains visible and reserved', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, {
    surface: buildOutskirtsMockupSurface(makeSnapshot({ trackedBountyLine: null })),
  }));
  assert.match(html, /Tracked Bounty/);
  assert.match(html, /No tracked bounty/);
  assert.match(html, /0 \/ 1/);
});
