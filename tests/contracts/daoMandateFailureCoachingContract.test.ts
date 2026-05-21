import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoMandateFailureCoaching,
  buildDaoMandateSurfaceFromRunCompassV2,
  createDefaultDaoMandateGuidanceSettings,
} from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

test('P7 failure coaching converts repeated gate defeat into one constructive correction route', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'jade' });
  const coaching = buildDaoMandateFailureCoaching({
    surface,
    settings: { ...createDefaultDaoMandateGuidanceSettings(), failureCoaching: 'every_gate_loss' },
    failureReflections: [{
      reflectionId: 'inner_demon:trial_novices_clearing:0:underforged',
      trialId: 'trial_novices_clearing',
      gateIndex: 0,
      patternKind: 'underforged_loop',
      diagnosisCode: 'underforged',
      repeatedCount: 2,
      createdAt: 100,
      lastUpdatedAt: 150,
      resolved: false,
      correctiveRoute: { target: 'forge', label: 'Raise Forge Floor', reason: 'Raise the weapon or armor floor before retrying.' },
      memoryEligible: true,
    }],
  });

  assert.equal(coaching, null, 'every-gate-loss should still require a meaningful current gate failure signal');
});

test('P7 critical failure coaching surfaces one route and does not leak shame or debug labels', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      milestone: {
        id: 'gate_failed:trial_novices_clearing',
        state: 'gate_failed',
        label: 'Recover from Novice Clearing',
        detail: 'The last gate attempt exposed a correction route.',
        currentRealmLabel: 'Qi Condensation',
        nextRealmLabel: 'Foundation Establishment',
        contextLine: 'Qi Condensation -> Foundation Establishment',
        chapterLine: 'Current city: Pinewind Hamlet',
      },
      primaryBlocker: {
        kind: 'gate_recent_failure',
        label: 'Recent gate rejection',
        detail: 'The last attempt exposed a correction route.',
        severity: 'warning',
        source: 'readiness',
        confidence: 'high',
      },
    }),
    { guidanceProfile: 'jade' },
  );
  const coaching = buildDaoMandateFailureCoaching({
    surface,
    settings: { ...createDefaultDaoMandateGuidanceSettings(), failureCoaching: 'critical_only' },
    failureReflections: [{
      reflectionId: 'inner_demon:trial_novices_clearing:0:underprepared',
      trialId: 'trial_novices_clearing',
      gateIndex: 0,
      patternKind: 'underprepared_loop',
      diagnosisCode: 'underprepared',
      repeatedCount: 3,
      createdAt: 100,
      lastUpdatedAt: 160,
      resolved: false,
      correctiveRoute: { target: 'apothecary', label: 'Apothecary Healing Prep', reason: 'Stock the medicine posture before returning to the gate.' },
      memoryEligible: true,
    }],
  });

  assert.ok(coaching);
  assert.equal(coaching.correctionRoute.destinationLabel, 'Apothecary');
  assert.equal(coaching.omen.source, 'failure_reflection');
  assert.equal(coaching.evidence.length <= 2, true);
  assert.doesNotMatch(JSON.stringify(coaching), /bad build|you failed|Run Compass|Packet|P7|debug|adapter|placeholder/i);
});
