import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPrepEconomyTargets,
  getPrepRecoveryWindowTarget,
  validatePrepRecoveryWindowsAgainstPhaseTargets,
} from '../../src/systems/balance/prepEconomyTargets.js';

test('prep economy targets expose explicit 6.4 package-fit and isolated-recovery ownership', () => {
  const targets = getPrepEconomyTargets();
  assert.equal(targets.ownerPacket, '6.4a_6.4b_6.4c_6.4d');
  assert.deepEqual(targets.packageFitCategories, [
    'directCoreCoverage',
    'supplementLaneCoverage',
    'forgeFit',
    'sourceRealism',
    'goldBudgetFit',
    'backgroundExpectationFit',
  ]);
  assert.deepEqual(targets.isolatedRecoveryCategories, ['consumables_only', 'forge_floor_only', 'build_correction_only']);
  assert.equal(targets.packageFitPolicy.supplementLaneSatisfiedByAnyHonestOption, true);
  assert.equal(targets.emergencyBypassPolicy.bypassIsEmergencyValve, true);
});

test('prep economy targets lock bypass ratio bands and support pacing targets explicitly', () => {
  const targets = getPrepEconomyTargets();
  assert.deepEqual(targets.prepVsBypassRatioBands.minimumPrepToFailSafeGoldRatio, { min: 0.15, max: 0.25 });
  assert.deepEqual(targets.prepVsBypassRatioBands.recommendedPrepToFailSafeGoldRatio, { min: 0.35, max: 0.55 });
  assert.equal(Object.keys(targets.supportReservePacingTargetsByGate).length, 5);
  assert.equal(targets.supportReservePacingTargetsByGate[5].spiritStoneFromZero.idealReserveApproachRatioTarget, 0.8);
  assert.equal(targets.validation.supportReserveProgressToleranceRatio > 0, true);
  assert.equal(targets.validation.recoveryValidationToleranceMinutes > 0, true);
});

test('prep economy targets define all gate recovery windows with consumables as the shortest lane', () => {
  for (let gate = 1; gate <= 5; gate += 1) {
    const consumables = getPrepRecoveryWindowTarget(gate, 'consumables_only');
    const forge = getPrepRecoveryWindowTarget(gate, 'forge_floor_only');
    const correction = getPrepRecoveryWindowTarget(gate, 'build_correction_only');
    assert.ok(consumables.targetMinutes < forge.targetMinutes);
    assert.ok(consumables.targetMinutes < correction.targetMinutes);
    assert.ok(consumables.maxMinutes <= forge.maxMinutes);
  }

  const phaseChecks = validatePrepRecoveryWindowsAgainstPhaseTargets();
  assert.equal(phaseChecks.every((entry) => entry.checks.allSubPhaseHalf), true);
  assert.equal(phaseChecks.every((entry) => entry.checks.consumablesShortest), true);
});
