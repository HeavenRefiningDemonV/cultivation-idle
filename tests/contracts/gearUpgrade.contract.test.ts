import assert from 'node:assert/strict';
import test from 'node:test';

import { upgradeMultiplier, canUpgrade, upgradeGearInstance } from '../../src/systems/equipment/gearUpgrade.js';
import type { GearInstance } from '../../src/systems/equipment/gearModel.js';

const inst = (upgradeLevel?: number): GearInstance => ({ instanceId: 'i', defId: 'd', rarity: 'common', affixes: [], upgradeLevel });

void test('D8 upgrade — INERT while held: the multiplier is the identity 1 at every level', () => {
  for (const lvl of [0, 1, 5, 100]) assert.equal(upgradeMultiplier(lvl), 1, 'held rate/cap ⇒ ×1 (no effect)');
});

void test('D8 upgrade — INERT while held: no upgrade is possible (held max -1 ⇒ null)', () => {
  assert.equal(canUpgrade(inst(0)), false);
  assert.equal(upgradeGearInstance(inst(0)), null);
  assert.equal(upgradeGearInstance(inst(7)), null);
});

void test('D8 upgrade — the multiplier algo is provable with injected non-held rate + cap', () => {
  assert.ok(Math.abs(upgradeMultiplier(5, 0.02, 1.25) - 1.1) < 1e-9, '1 + 0.02×5 = 1.10');
  assert.equal(upgradeMultiplier(100, 0.02, 1.25), 1.25, 'clamped to the injected cap');
  assert.equal(upgradeMultiplier(-3, 0.02, 1.25), 1, 'negative level floored to 0 ⇒ 1');
});

void test('D8 upgrade — the level-step algo is provable with an injected max; pure', () => {
  const before = inst(0);
  const up = upgradeGearInstance(before, 10);
  assert.equal(up?.upgradeLevel, 1, 'increments by one under the injected cap');
  assert.equal(before.upgradeLevel, 0, 'pure: the input is not mutated');
  // at the injected cap, no further upgrade
  assert.equal(upgradeGearInstance(inst(10), 10), null, 'at the cap ⇒ null');
  assert.equal(canUpgrade(inst(9), 10), true);
});
