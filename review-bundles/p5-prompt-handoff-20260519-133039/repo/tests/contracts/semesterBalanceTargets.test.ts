import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import {
  deriveRealmBaseQiPerSecond,
  getOfflineContributionPolicy,
  getPrestigeBaselinePolicy,
  getSemesterBalanceTargets,
} from '../../src/systems/balance/index.js';
import { STUDY_DURATION_BY_GRADE } from '../../src/systems/manuals/studyContract.js';

const ROOT_DIR = process.cwd();

test('packet 6.1 semester balance registry includes locked timing and offline truths', () => {
  const targets = getSemesterBalanceTargets();

  assert.equal(targets.semesterSlice.contentCapRealmId, 'spirit_severing');

  assert.deepEqual(targets.firstLifeCapTiming.envelopeSeconds, {
    minSeconds: 34_200,
    targetSeconds: 41_400,
    maxSeconds: 48_600,
  });

  assert.equal(targets.cityPhaseTimingTargets.length, 5);
  assert.deepEqual(
    targets.cityPhaseTimingTargets.map((target) => target.targetSeconds),
    [55, 80, 120, 170, 250].map((minutes) => minutes * 60),
  );

  const gate1 = targets.gateAvailabilityTargets.find((target) => target.gateId === 'gate_1_qi_condensation_to_foundation');
  assert.ok(gate1);
  assert.deepEqual(gate1.availabilityWindowSeconds, {
    minSeconds: 1_800,
    maxSeconds: 3_300,
  });

  const foundation = targets.earlyMilestoneWindows.find((target) => target.milestoneId === 'foundation_entry');
  assert.ok(foundation);
  assert.deepEqual(foundation.windowSeconds, {
    minSeconds: 2_700,
    maxSeconds: 4_500,
  });

  assert.deepEqual(getOfflineContributionPolicy(), {
    status: 'locked',
    sourcePacket: '6.1a',
    mode: 'passive_scaled_efficiency',
    baseEfficiency: 0.5,
    prestigeEfficiencyPerLevel: 0.08,
    maxEfficiency: 0.9,
    meditatingOnly: false,
    maxCatchupSeconds: 43_200,
  });
});

test('packet 6.1 deferred categories are explicitly present', () => {
  const targets = getSemesterBalanceTargets();
  assert.equal(targets.activityThroughputTargets.status, 'deferred');
  assert.equal(targets.gateWinRateTargets.status, 'deferred');
  assert.equal(targets.reclaimSpeedTargets.status, 'deferred');
  assert.equal(targets.readinessCalibrationTargets.status, 'deferred');
  assert.equal(targets.antiStallTargets.status, 'deferred');

  const prestigePolicy = getPrestigeBaselinePolicy();
  assert.equal(prestigePolicy.unlockRealmIndex, 2);
  assert.equal(prestigePolicy.timeBonusEnabled, false);
  assert.equal(prestigePolicy.recommendedResetRule, 'content_cap_only_for_now');
});

test('packet 6.1 realm base qi/s is helper-derived and no longer placeholder staircase', () => {
  const oldPlaceholders = new Set(['1', '10000', '100000', '1000000', '10000000', '100000000']);
  const constantsSource = fs.readFileSync(path.join(ROOT_DIR, 'src/constants/index.ts'), 'utf8');

  assert.match(constantsSource, /deriveRealmBaseQiPerSecond\(/);
  assert.doesNotMatch(constantsSource, /qiPerSecond:\s*'10000'/);

  const derivedQiValues = REALMS.map((realm) => Number.parseFloat(realm.qiPerSecond));
  assert.equal(derivedQiValues.length, 6);
  derivedQiValues.forEach((value) => {
    assert.ok(Number.isFinite(value));
    assert.ok(value > 0);
  });

  assert.ok(REALMS.every((realm) => !oldPlaceholders.has(realm.qiPerSecond)));

  const recomputed = deriveRealmBaseQiPerSecond({
    realmIndex: REALMS[0].index,
    realmId: 'qi_condensation',
    qiRequirement: REALMS[0].qiRequirement,
    substages: REALMS[0].substages,
    breakthroughQiMultiplier: 2.5,
    substageQiMultiplierStep: 0.2,
  });
  assert.equal(recomputed, REALMS[0].qiPerSecond);
});

test('packet 6.1 balance module remains pure and study contract remains canonical', () => {
  const balanceTypesSource = fs.readFileSync(path.join(ROOT_DIR, 'src/systems/balance/balanceTargetTypes.ts'), 'utf8');
  const balanceTargetsSource = fs.readFileSync(path.join(ROOT_DIR, 'src/systems/balance/semesterBalanceTargets.ts'), 'utf8');
  const studyContractSource = fs.readFileSync(path.join(ROOT_DIR, 'src/systems/manuals/studyContract.ts'), 'utf8');

  [balanceTypesSource, balanceTargetsSource].forEach((source) => {
    assert.doesNotMatch(source, /stores\//);
    assert.doesNotMatch(source, /zustand/i);
    assert.doesNotMatch(source, /react/i);
    assert.doesNotMatch(source, /constants\/index\.ts/);
  });

  assert.match(studyContractSource, /STUDY_DURATION_BY_GRADE/);
  assert.equal(STUDY_DURATION_BY_GRADE.mortal, 30_000);
});
