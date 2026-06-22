import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveBreakthroughRiskInputs,
  realmInjuryRiskPressure,
  type BreakthroughRiskStatInput,
} from '../../src/systems/breakthrough/breakthroughRiskInputs.js';
import {
  resolveBreakthroughStabilitySnapshot,
  breakthroughTransitionRiskForRealm,
} from '../../src/systems/breakthrough/breakthroughStabilityResolver.js';

const ZERO: BreakthroughRiskStatInput = { qiPurity: 0, bodyIntegrity: 0, daoStability: 0, fatigue: 0 };

// Realm 4 carries real injury pressure (minorInjuryPct 20 / majorInjuryPct 5) so body_integrity matters.
const REALM_4 = breakthroughTransitionRiskForRealm(4);
const REALM_4_INJURY_PRESSURE = realmInjuryRiskPressure(REALM_4.minorInjuryPct, REALM_4.majorInjuryPct);

// A major-transition scenario with risk well above the per-realm floor so reductions are visible.
function riskWith(stat: BreakthroughRiskStatInput): number {
  const inputs = resolveBreakthroughRiskInputs(stat, { injuryPressure: REALM_4_INJURY_PRESSURE });
  return resolveBreakthroughStabilitySnapshot({
    fromRealmIndex: 4,
    toRealmIndex: 5,
    currentQi: 1000,
    requiredQi: 1000, // tight margin → qi-rush risk, lifts base above the floor
    heartLawStage: 1,
    cultivationEffectiveStage: 1,
    clarity: 0,
    turbulence: 0,
    gateResolution: 'none',
    rootResonance: 'neutral',
    recklessConfirmation: true,
    qiPurityRiskReduction: inputs.qiPurityRiskReduction,
    safetyPrepRiskReduction: inputs.safetyPrepRiskReduction,
    injuryRiskDelta: inputs.injuryRiskDelta,
    fatigueRiskDelta: inputs.fatigueRiskDelta,
  }).riskPercent;
}

void test('M.II.1-A — an untrained cultivator at an injury-free realm is byte-identical to pre-packet (all four inputs zero)', () => {
  const inputs = resolveBreakthroughRiskInputs(ZERO);
  assert.equal(inputs.qiPurityRiskReduction, 0);
  assert.equal(inputs.safetyPrepRiskReduction, 0);
  assert.equal(inputs.fatigueRiskDelta, 0);
  // no realm injury pressure (e.g. Qi Condensation) ⇒ no injury penalty for a fresh body.
  assert.equal(inputs.injuryRiskDelta, 0, 'no injury penalty where the realm carries no injury risk');
  // realm 0 carries zero authored injury pressure
  const realm0 = breakthroughTransitionRiskForRealm(0);
  assert.equal(realmInjuryRiskPressure(realm0.minorInjuryPct, realm0.majorInjuryPct), 0);
});

void test('M.II.1-A — raising a live stat lowers the resolved breakthrough risk (the formerly-inert terms are real)', () => {
  const base = riskWith(ZERO);
  assert.ok(base > 5, 'the scenario sits above the per-realm risk floor');

  assert.ok(riskWith({ ...ZERO, qiPurity: 1000 }) < base, 'qi_purity lowers risk');
  assert.ok(riskWith({ ...ZERO, daoStability: 1000 }) < base, 'dao_stability lowers risk');
  assert.ok(riskWith({ ...ZERO, bodyIntegrity: 1000 }) < base, 'body_integrity lowers risk');
});

void test('M.II.1-A — the mappings are monotonic soft-caps bounded by the authored ceilings', () => {
  const lo = resolveBreakthroughRiskInputs({ ...ZERO, qiPurity: 30 }).qiPurityRiskReduction;
  const hi = resolveBreakthroughRiskInputs({ ...ZERO, qiPurity: 300 }).qiPurityRiskReduction;
  assert.ok(hi > lo && lo > 0, 'qi_purity reduction is monotonic increasing');

  // body_integrity REDUCES the injury addend under real injury pressure (high body ⇒ less risk).
  const pressure = { injuryPressure: 8 };
  assert.ok(
    resolveBreakthroughRiskInputs({ ...ZERO, bodyIntegrity: 1000 }, pressure).injuryRiskDelta
      < resolveBreakthroughRiskInputs(ZERO, pressure).injuryRiskDelta,
    'body_integrity shrinks the injury addend',
  );
  // the injury addend never exceeds the realm's pressure
  assert.ok(resolveBreakthroughRiskInputs(ZERO, pressure).injuryRiskDelta <= 8 + 1e-6);

  // ceilings: qi_purity "risk -8", dao_stability "risk -12" (stats.json maxEffectSummary).
  assert.ok(resolveBreakthroughRiskInputs({ ...ZERO, qiPurity: 1e9 }).qiPurityRiskReduction <= 8 + 1e-6);
  assert.ok(resolveBreakthroughRiskInputs({ ...ZERO, daoStability: 1e9 }).safetyPrepRiskReduction <= 12 + 1e-6);
  assert.ok(resolveBreakthroughRiskInputs({ ...ZERO, fatigue: 1e9 }).fatigueRiskDelta <= 10 + 1e-6);
});
