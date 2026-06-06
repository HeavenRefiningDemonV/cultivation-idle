import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTrainingSupportMultipliers } from '../../src/systems/training/index.js';

test('training support multipliers preserve real upstream values and explain each source', () => {
  const support = resolveTrainingSupportMultipliers({
    pathAffinity: 1.12,
    heartLawSupport: 1.06,
    rootSupport: 1.1,
    offlineEfficiency: 0.5,
    prestigeFloor: 8,
  });

  assert.equal(support.pathAffinity, 1.12);
  assert.equal(support.heartLawSupport, 1.06);
  assert.equal(support.rootSupport, 1.1);
  assert.equal(support.offlineEfficiency, 0.5);
  assert.equal(support.prestigeFloor, 8);
  assert.equal(support.rows.length, 5);
  assert.deepEqual(support.rows.map((row) => row.id), [
    'pathAffinity',
    'heartLawSupport',
    'rootSupport',
    'offlineEfficiency',
    'prestigeFloor',
  ]);
  assert.match(support.rows.find((row) => row.id === 'heartLawSupport')?.detail ?? '', /upstream/i);
});

test('training support multipliers fall back safely when upstream values are absent or unsafe', () => {
  const support = resolveTrainingSupportMultipliers({
    pathAffinity: Number.NaN,
    heartLawSupport: -4,
    rootSupport: Number.POSITIVE_INFINITY,
    offlineEfficiency: 0,
    prestigeFloor: -3,
  });

  assert.equal(support.pathAffinity, 1);
  assert.equal(support.heartLawSupport, 1);
  assert.equal(support.rootSupport, 1);
  assert.equal(support.offlineEfficiency, 1);
  assert.equal(support.prestigeFloor, 0);
  assert.equal(support.totalOnlineMultiplier, 1);
  assert.equal(support.rows.every((row) => row.source === 'neutral_default'), true);
});
