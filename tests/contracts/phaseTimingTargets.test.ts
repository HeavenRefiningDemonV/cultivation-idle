import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  getDeferredGateAvailabilityTargets,
  getFoundationEntryWindowSeconds,
  getGate1AvailabilityWindowSeconds,
  getLockedCityPhaseTargetDurations,
  getPinewindTargetDurationSeconds,
  PROGRESSION_MILESTONE_IDS,
} from '../../src/systems/balance/phaseTimingTargets.js';

test('phase timing targets expose normalized early milestone ids', () => {
  assert.equal(PROGRESSION_MILESTONE_IDS.LIFE_START, 'life_start');
  assert.equal(PROGRESSION_MILESTONE_IDS.GATE_1_AVAILABLE, 'gate_1_available');
  assert.equal(PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY, 'foundation_entry');
  assert.equal(PROGRESSION_MILESTONE_IDS.STONECRAG_ENTERED, 'stonecrag_entered');
  assert.equal(PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED, 'content_cap_reached');
});

test('phase timing targets expose locked early windows and pinewind target', () => {
  assert.deepEqual(getGate1AvailabilityWindowSeconds(), {
    minSeconds: 30 * 60,
    maxSeconds: 55 * 60,
  });

  assert.deepEqual(getFoundationEntryWindowSeconds(), {
    minSeconds: 45 * 60,
    maxSeconds: 75 * 60,
  });

  assert.equal(getPinewindTargetDurationSeconds(), 55 * 60);
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

  const phases = getLockedCityPhaseTargetDurations();
  assert.equal(phases.length >= 5, true);
  assert.equal(phases[0]?.phaseId, 'pinewind_qi_condensation');
});

test('progression timing tracker anchors gate availability to canonical lifecycle and avoids ambiguous milestone naming', () => {
  const trackerSource = fs.readFileSync(path.join(process.cwd(), 'src/services/diagnostics/progressionTimingTracker.ts'), 'utf8');
  assert.match(trackerSource, /getTrialLifecycleSnapshot/);
  assert.doesNotMatch(trackerSource, /foundation_available/);
});
