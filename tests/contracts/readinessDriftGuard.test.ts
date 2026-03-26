import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import * as readiness from '../../src/systems/readiness/index.js';

const repoRoot = process.cwd();
const scoringEngineSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/readinessScoringEngine.ts'), 'utf8');
const runtimeSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/readinessRuntime.ts'), 'utf8');

test('packet 4.13 readinessScoringEngine stays pure and component-driven', () => {
  assert.match(scoringEngineSource, /GateBuildFloor/);
  assert.match(scoringEngineSource, /BuildAnalysis/);
  assert.match(scoringEngineSource, /ForgeFloorReadModel/);
  assert.match(scoringEngineSource, /CombatPostureFit/);
  assert.match(scoringEngineSource, /EconomicShortfall/);

  [
    'useGameStore',
    'useTechniqueStore',
    'useTechCollectionStore',
    'useUIStore',
    'buildDoctrineSnapshot',
    'buildLiveEconomicRecommendationEngine',
    'React',
  ].forEach((forbiddenToken) => {
    assert.equal(scoringEngineSource.includes(forbiddenToken), false, `${forbiddenToken} must not appear in readinessScoringEngine.ts`);
  });
});

test('packet 4.13 readinessRuntime uses live wrappers instead of raw heuristics', () => {
  [
    'buildDoctrineSnapshot',
    'analyzeSelectedBuild',
    'evaluateCurrentCombatPostureFit',
    'buildLiveEconomicRecommendationEngine',
    'getGateBuildFloor',
    'getPrepBudgetByTransitionId',
    'scoreGateReadiness',
  ].forEach((requiredToken) => {
    assert.equal(runtimeSource.includes(requiredToken), true, `${requiredToken} must appear in readinessRuntime.ts`);
  });

  [
    'trial_novices_clearing',
    'Math.random',
    'activeSlotsFilled',
    'weaponRefine: 2',
  ].forEach((forbiddenToken) => {
    assert.equal(runtimeSource.includes(forbiddenToken), false, `${forbiddenToken} must not appear in readinessRuntime.ts`);
  });
});

test('packet 4.13 readiness namespace exports the scoring and runtime surface', () => {
  assert.equal(typeof readiness.scoreGateReadiness, 'function');
  assert.equal(typeof readiness.evaluateBuildReadiness, 'function');
  assert.equal(typeof readiness.evaluateForgeReadiness, 'function');
  assert.equal(typeof readiness.evaluateEconomicReadiness, 'function');
  assert.equal(typeof readiness.evaluatePostureReadiness, 'function');
  assert.equal(typeof readiness.buildCurrentGateReadinessInput, 'function');
  assert.equal(typeof readiness.evaluateCurrentGateReadiness, 'function');
  assert.equal(typeof readiness.getCurrentGateTrialId, 'function');
});

test('packet 4.13 readiness engine does not leak packet 4.14 diagnosis logic early', () => {
  ['diagnosis', 'close', 'bypass', 'failSafe', 'winnable'].forEach((forbiddenToken) => {
    assert.equal(scoringEngineSource.includes(forbiddenToken), false, `${forbiddenToken} must not appear in readinessScoringEngine.ts`);
  });
});

test('packet 6.5 keeps close-call and outcome calibration in canonical readiness/failure layers', () => {
  const failureSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/failureDiagnosis.ts'), 'utf8');
  const calibrationSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/readinessCalibrationReadModel.ts'), 'utf8');
  const section5Source = readFileSync(path.join(repoRoot, 'src/systems/readiness/section5Adapters.ts'), 'utf8');

  assert.equal(failureSource.includes('READINESS_CLOSE_CALL_POLICY'), true);
  assert.equal(calibrationSource.includes('getReadinessOutcomeTarget'), true);
  assert.equal(section5Source.includes("diagnosis?.primary === 'close'"), true);
  assert.equal(section5Source.includes('bossHpPct <= 20'), false);
});
