import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  ACTIVITY_LOOP_ROLE_OWNERSHIP,
  ACTIVITY_THROUGHPUT_CATEGORY_IDS,
  LOCKED_ACTIVITY_ROLE_STATEMENTS,
  getActivityThroughputTargets,
} from '../../src/systems/balance/activityThroughputTargets.js';

test('activity throughput targets expose canonical category ids and explicit role ownership', () => {
  assert.deepEqual(ACTIVITY_THROUGHPUT_CATEGORY_IDS, [
    'goldPerMinute',
    'commonMaterialUnitsPerMinute',
    'targetedMaterialUnitsPerMinute',
    'anchorUnitsPerRun',
    'rareBundleCadence',
    'bossSpiritStoneSupportPerHour',
    'runDurationSeconds',
    'cycleDurationSeconds',
    'shortageRecoveryValue',
  ]);

  assert.equal(ACTIVITY_LOOP_ROLE_OWNERSHIP.outskirts.status, 'locked');
  assert.equal(ACTIVITY_LOOP_ROLE_OWNERSHIP.ruins.status, 'locked');
  assert.equal(ACTIVITY_LOOP_ROLE_OWNERSHIP.bounties.status, 'deferred');
  assert.equal(ACTIVITY_LOOP_ROLE_OWNERSHIP.expeditions.status, 'deferred');
});

test('activity throughput targets encode locked role statements and additive ruins bonus truth', () => {
  assert.match(LOCKED_ACTIVITY_ROLE_STATEMENTS.outskirtsPrimaryGoldAndCommon.statement, /primary active gold lane/i);
  assert.match(LOCKED_ACTIVITY_ROLE_STATEMENTS.ruinsPrimaryTargetedAndAnchor.statement, /primary active targeted-material/i);
  assert.match(LOCKED_ACTIVITY_ROLE_STATEMENTS.ruinsBonusAdditiveToAnchor.statement, /additive/i);

  const targets = getActivityThroughputTargets();
  assert.equal(targets.deferredTargets.bountyMeritSpiritStoneThroughput.status, 'deferred');
  assert.equal(targets.deferredTargets.expeditionEquivalenceRatios.status, 'deferred');
});

test('activity throughput target layer extends the 6.1 spine instead of creating a competing balance registry', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/systems/balance/activityThroughputTargets.ts'), 'utf8');
  assert.match(source, /getSemesterBalanceTargets\(/);
  assert.equal(source.includes('const SEMESTER_BALANCE_REGISTRY'), false);
});
