import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPrepEconomyTargets,
  getPrepRecoveryWindowTarget,
  validatePrepRecoveryWindowsAgainstPhaseTargets,
} from '../../src/systems/balance/prepEconomyTargets.js';

test('prep economy targets expose explicit 6.4 package-fit and isolated-recovery ownership', () => {
  const targets = getPrepEconomyTargets();
  assert.equal(targets.ownerPacket, '6.4a_6.4b');
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
  assert.equal(targets.validation.recoveryValidationToleranceMinutes > 0, true);
  assert.equal(targets.validation.recoveryValidationSlackRatio > 0, true);
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
