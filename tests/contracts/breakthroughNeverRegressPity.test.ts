import assert from 'node:assert/strict';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useHeartLawStore } from '../../src/stores/heartLawStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { resolveTrialFailSafeConfig } from '../../src/systems/progression/runtime/trialLifecycle.js';

void test('M.II.1 thread — a failed tribulation roll never lowers earned realm state and applies only Qi + turbulence backlash', () => {
  // Fresh process: content is unloaded (raw=null) ⇒ realm-0 → Foundation needs no gate item,
  // so the tribulation roll runs and we can force it to fail.
  useCultivationStore.getState().resetForNewLife();
  useHeartLawStore.setState({ selectedHeartLawId: 'ember_thread_sutra', breathMode: 'balanced' });

  const finalSubstage = REALMS[0].substages;
  useGameStore.setState({
    realm: { index: 0, substage: finalSubstage, name: REALMS[0].name },
    selectedPath: 'heaven',
  });
  const required = useGameStore.getState().getBreakthroughRequirement();
  useGameStore.setState({ qi: String(required) });

  // Force the tribulation roll to always fail (roll 0 < riskPercent/100, riskPercent ≥ floor 1).
  useGameStore.getState().__setBreakthroughRiskRollForTest?.(() => 0);

  const qiBefore = Number(useGameStore.getState().qi);
  const turbulenceBefore = useCultivationStore.getState().turbulence;

  const result = useGameStore.getState().breakthrough();

  assert.equal(result, false, 'a failed rite returns false');
  // never-regress: earned realm/substage is invariant
  assert.equal(useGameStore.getState().realm.index, 0, 'realm index unchanged on failure');
  assert.equal(useGameStore.getState().realm.substage, finalSubstage, 'substage unchanged on failure');
  // backlash applied
  assert.ok(Number(useGameStore.getState().qi) < qiBefore, 'Qi backlash applied on failure');
  assert.ok(useCultivationStore.getState().turbulence > turbulenceBefore, 'turbulence backlash applied on failure');
});

void test('M.II.1 thread — pity: counted gate failures accrue toward the Safety Net guaranteed-clear threshold', () => {
  const trialId = 'mii1_pity_probe_trial';
  const threshold = resolveTrialFailSafeConfig(null).threshold;
  assert.equal(threshold, 3, 'the default Safety Net threshold is 3');

  for (let i = 0; i < threshold; i++) {
    useTrialStore.getState().recordFailure(trialId, true);
  }

  const eligibleFailures = useTrialStore.getState().getProgress(trialId).eligibleFailures;
  assert.equal(eligibleFailures, threshold, 'each counted failure accrues one eligible failure');
  assert.ok(eligibleFailures >= threshold, 'reaching the threshold makes the guaranteed clear (bypass) available');
});
