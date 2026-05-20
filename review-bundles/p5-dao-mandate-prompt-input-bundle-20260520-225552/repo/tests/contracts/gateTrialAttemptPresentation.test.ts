import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGateTrialAttemptPresentation, type GateTrialReadinessSurface } from '../../src/systems/readiness/section5Adapters.js';

function makeSurface(partial: Partial<GateTrialReadinessSurface>): GateTrialReadinessSurface {
  return {
    trialId: 'trial_novices_clearing' as never,
    trialName: 'Novice Gate',
    bossName: null,
    gateStateLabel: 'Available',
    gateRewardLabel: 'Token',
    requiredItemLabel: null,
    readinessLabel: 'Risky',
    readinessDetail: '',
    minimumMetCount: 3,
    minimumTotalCount: 5,
    recommendedMetCount: 1,
    recommendedTotalCount: 5,
    minimumChecklist: [],
    recommendedChecklist: [],
    compactCompass: null,
    rawReadiness: null,
    rawDiagnosis: null,
    lifecycle: {
      state: 'available',
      canStart: true,
      isResolved: false,
      resolution: 'none',
      reasonCode: 'available',
      reason: 'Ready',
      gateItemId: null,
      requiredItemId: null,
      countsTowardFailSafeOnStart: true,
      failSafe: { threshold: 3, eligibleFailures: 0, remainingEligibleFailures: 3, cost: null, status: 'locked', canPurchase: false, blockedReasonCode: null, blockedReason: null },
    },
    ...partial,
  } as GateTrialReadinessSurface;
}

test('attempt presentation maps to not_ready / attempt_gate / attempt_anyway / break_through states', () => {
  assert.equal(buildGateTrialAttemptPresentation(makeSurface({ lifecycle: { ...makeSurface({}).lifecycle, canStart: false, reason: 'Blocked' } })).state, 'not_ready');
  assert.equal(buildGateTrialAttemptPresentation(makeSurface({ readinessLabel: 'Ready' })).state, 'attempt_gate');
  assert.equal(buildGateTrialAttemptPresentation(makeSurface({ readinessLabel: 'Risky' })).state, 'attempt_anyway');
  assert.equal(buildGateTrialAttemptPresentation(makeSurface({ lifecycle: { ...makeSurface({}).lifecycle, isResolved: true, state: 'cleared', resolution: 'cleared' } })).state, 'break_through');
});
