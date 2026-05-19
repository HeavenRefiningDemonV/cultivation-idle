import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  getCumulativeMajorEntryTargetSeconds,
  getDeferredGateAvailabilityTargets,
  getFirstLifeCapBandSeconds,
  getFoundationEntryWindowSeconds,
  getGate1AvailabilityWindowSeconds,
  getPhaseTargetDurationsSeconds,
  PHASE_TIMING_NORMALIZATION,
  PROGRESSION_MILESTONE_IDS,
} from '../../src/systems/balance/phaseTimingTargets.js';

test('phase timing targets expose normalized milestone ids for the full semester ladder', () => {
  assert.equal(PROGRESSION_MILESTONE_IDS.LIFE_START, 'life_start');
  assert.equal(PROGRESSION_MILESTONE_IDS.GATE_1_AVAILABLE, 'gate_1_available');
  assert.equal(PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY, 'foundation_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY, 'core_formation_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY, 'nascent_soul_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY, 'soul_formation_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY, 'spirit_severing_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED, 'content_cap_reached');
});

test('phase timing targets expose locked early windows', () => {
  assert.deepEqual(getGate1AvailabilityWindowSeconds(), {
    minSeconds: 30 * 60,
    maxSeconds: 55 * 60,
  });

  assert.deepEqual(getFoundationEntryWindowSeconds(), {
    minSeconds: 45 * 60,
    maxSeconds: 75 * 60,
  });
});

test('phase timing targets expose full city phase ladder and cumulative major-entry targets', () => {
  assert.deepEqual(getPhaseTargetDurationsSeconds(), [
    { phaseId: 'pinewind_phase_target_seconds', targetSeconds: 3300, startMilestoneId: 'life_start', endMilestoneId: 'foundation_entry' },
    {
      phaseId: 'stonecrag_phase_target_seconds',
      targetSeconds: 4800,
      startMilestoneId: 'foundation_entry',
      endMilestoneId: 'core_formation_entry',
    },
    {
      phaseId: 'spirit_cavern_phase_target_seconds',
      targetSeconds: 7200,
      startMilestoneId: 'core_formation_entry',
      endMilestoneId: 'nascent_soul_entry',
    },
    {
      phaseId: 'lotusford_phase_target_seconds',
      targetSeconds: 10200,
      startMilestoneId: 'nascent_soul_entry',
      endMilestoneId: 'soul_formation_entry',
    },
    {
      phaseId: 'ironpeak_phase_target_seconds',
      targetSeconds: 15000,
      startMilestoneId: 'soul_formation_entry',
      endMilestoneId: 'spirit_severing_entry',
    },
  ]);

  assert.deepEqual(getCumulativeMajorEntryTargetSeconds(), [
    { milestoneId: 'foundation_entry', targetSecondsFromLifeStart: 3300 },
    { milestoneId: 'core_formation_entry', targetSecondsFromLifeStart: 8100 },
    { milestoneId: 'nascent_soul_entry', targetSecondsFromLifeStart: 15300 },
    { milestoneId: 'soul_formation_entry', targetSecondsFromLifeStart: 25500 },
    { milestoneId: 'spirit_severing_entry', targetSecondsFromLifeStart: 40500 },
  ]);
});

test('phase timing targets expose explicit first-life cap band and normalization rules', () => {
  assert.deepEqual(getFirstLifeCapBandSeconds(), {
    minSeconds: 34_200,
    maxSeconds: 48_600,
  });

  assert.equal(PHASE_TIMING_NORMALIZATION.contentCapMilestoneId, PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED);
  assert.equal(PHASE_TIMING_NORMALIZATION.contentCapEquivalentRealmEntryMilestoneId, PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY);
  assert.equal(PHASE_TIMING_NORMALIZATION.phaseBoundaryAuthority, 'major_realm_entry');
  assert.equal(PHASE_TIMING_NORMALIZATION.cityEnteredEventRole, 'telemetry_only');
});

test('phase timing target adapter keeps later gate availability explicit and deferred', () => {
  const deferred = getDeferredGateAvailabilityTargets().map((target) => target.gateId);
  assert.ok(deferred.includes('core_to_nascent_availability'));
  assert.ok(deferred.includes('nascent_to_soul_availability'));
  assert.ok(deferred.includes('soul_to_severing_availability'));
  assert.equal(deferred.includes('foundation_to_core_availability'), false);
});

test('phase timing targets consume the semester balance spine and do not create a parallel registry', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/systems/balance/phaseTimingTargets.ts'), 'utf8');
  assert.match(source, /getSemesterBalanceTargets\(/);
  assert.equal(source.includes('const SEMESTER_TIMING_REGISTRY'), false);
});

test('progression timing tracker anchors gate availability to canonical lifecycle and avoids ambiguous milestone naming', () => {
  const trackerSource = fs.readFileSync(path.join(process.cwd(), 'src/services/diagnostics/progressionTimingTracker.ts'), 'utf8');
  assert.match(trackerSource, /getTrialLifecycleSnapshot/);
  assert.doesNotMatch(trackerSource, /foundation_available/);
});
