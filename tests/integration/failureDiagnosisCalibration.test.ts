import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReadinessCalibrationRows } from '../../src/systems/readiness/readinessCalibrationReadModel.js';
import { diagnoseTrialFailure } from '../../src/systems/readiness/failureDiagnosis.js';
import { buildDefaultSection4DiagnosisFixtures } from '../../src/systems/readiness/validation/section4SemanticValidator.js';

function pickFixture(name: string) {
  const fixture = buildDefaultSection4DiagnosisFixtures().find((entry) => entry.name === name);
  if (!fixture) throw new Error(`Missing fixture: ${name}`);
  return fixture;
}

test('readiness calibration rows classify optimistic/pessimistic drift deterministically', () => {
  const rows = buildReadinessCalibrationRows([
    {
      gateIndex: 1,
      cohort: 'gate1-recommended',
      intendedBand: 'recommended_met',
      actualReadinessBand: 'recommended_met',
      actualWinRate: 0.85,
      componentBands: { build: 'recommended_met', forge: 'recommended_met', economic: 'recommended_met', posture: 'recommended_met' },
    },
    {
      gateIndex: 5,
      cohort: 'gate5-minimum',
      intendedBand: 'minimum_met_below_recommended',
      actualReadinessBand: 'minimum_met_below_recommended',
      actualWinRate: 0.05,
      componentBands: { build: 'minimum_met_below_recommended', forge: 'below_minimum', economic: 'minimum_met_below_recommended', posture: 'minimum_met_below_recommended' },
    },
  ]);

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.driftDirection, 'on_target');
  assert.equal(rows[1]?.driftDirection, 'too_optimistic');
});

test('diagnosis calibration keeps below-minimum failures out of close and maps dominant causes', () => {
  const underforged = diagnoseTrialFailure(pickFixture('underforged').input);
  const underprepared = diagnoseTrialFailure(pickFixture('underprepared').input);
  const underbuilt = diagnoseTrialFailure(pickFixture('underbuilt').input);
  const close = diagnoseTrialFailure(pickFixture('close').input);

  assert.equal(underforged.primary, 'underforged');
  assert.equal(underprepared.primary, 'underprepared');
  assert.equal(underbuilt.primary, 'underbuilt');
  assert.equal(close.primary, 'close');
});
