import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;

test('trial mismatch apply-mode normalization converts legacy first-gate contradiction into bypassed resolution', async () => {
  const fixture = await loadMigrationFixture('legacy-trial-mismatch');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const trialState = result.migrated.trialState as {
    progressByTrialId?: Record<string, { resolution?: string; cleared?: boolean; bypassedAt?: number | null }>;
  };
  const progress = trialState.progressByTrialId?.trial_novices_clearing;
  const step = result.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_trial_resolution_normalization');

  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_plan_trial_resolution_normalization'), true);
  assert.equal(step?.ownerPacket, '1.4');
  assert.equal(progress?.resolution, 'bypassed');
  assert.equal(progress?.cleared, false);
  assert.equal(typeof progress?.bypassedAt, 'number');
});
