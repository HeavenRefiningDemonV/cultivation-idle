import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import * as readiness from '../../src/systems/readiness/index.js';

const repoRoot = process.cwd();
const failureDiagnosisSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/failureDiagnosis.ts'), 'utf8');
const section5AdapterSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/section5Adapters.ts'), 'utf8');
const section4ValidatorSource = readFileSync(path.join(repoRoot, 'src/systems/readiness/validation/section4SemanticValidator.ts'), 'utf8');

test('packet 4.14 readiness namespace exports the diagnosis and section-5 bridge surface', () => {
  assert.equal(typeof readiness.isTrialFailureClose, 'function');
  assert.equal(typeof readiness.diagnoseTrialFailure, 'function');
  assert.equal(typeof readiness.buildSection5ReadinessSurface, 'function');
  assert.equal(typeof readiness.buildSection5StatusSurface, 'function');
  assert.equal(typeof readiness.validateSection4Semantics, 'function');
  assert.equal(typeof readiness.buildDefaultSection4DiagnosisFixtures, 'function');
});

test('packet 4.14 failure diagnosis stays deterministic and store-free', () => {
  [
    'useGameStore',
    'useTrialStore',
    'useContentStore',
    'buildDoctrineSnapshot',
    'React',
    'Math.random',
  ].forEach((forbiddenToken) => {
    assert.equal(failureDiagnosisSource.includes(forbiddenToken), false, `${forbiddenToken} must not appear in failureDiagnosis.ts`);
  });

  [
    'isTrialFailureClose',
    'buildReasonsForUnderbuilt',
    'buildReasonsForUnderforged',
    'buildReasonsForUnderprepared',
    'buildTopFixes',
    'buildDominanceScores',
    'READINESS_CLOSE_CALL_POLICY',
    'bypassAvailable',
  ].forEach((requiredToken) => {
    assert.equal(failureDiagnosisSource.includes(requiredToken), true, `${requiredToken} must appear in failureDiagnosis.ts`);
  });
});

test('packet 4.14 adapters and semantic validator stay wired to shared diagnosis truth', () => {
  ['diagnoseTrialFailure', 'buildSection5ReadinessSurface', 'buildSection5StatusSurface'].forEach((requiredToken) => {
    assert.equal(section5AdapterSource.includes(requiredToken), true, `${requiredToken} must appear in section5Adapters.ts`);
  });

  ['buildDefaultSection4DiagnosisFixtures', 'diagnoseTrialFailure', 'UNREACHABLE_FAILURE_DIAGNOSIS'].forEach((requiredToken) => {
    assert.equal(section4ValidatorSource.includes(requiredToken), true, `${requiredToken} must appear in section4SemanticValidator.ts`);
  });
});
