import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

test('packet 1.6 apply refunds deferred hidden prestige purchases into spendable totalAP and clears purchases', async () => {
  const fixture = await loadMigrationFixture('legacy-hidden-prestige');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const prestigeState = readRecord(result.migrated.prestigeState);
  const purchases = readRecord(prestigeState.purchasesById);

  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_plan_deferred_prestige_refund'), true);
  assert.equal(prestigeState.totalAP, 240);
  assert.equal(prestigeState.currentRunAP, 0);
  assert.equal(prestigeState.lifetimeAP, 0);
  assert.equal('ap_unlock_pagoda' in purchases, false);
  assert.equal('ap_unlock_jade_core' in purchases, false);
});

test('packet 1.6 apply refunds hidden unsupported prestige purchases using authored level costs and is idempotent', async () => {
  const fixture = await loadMigrationFixture('legacy-hidden-unsupported-prestige');
  const applied = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const prestigeState = readRecord(applied.migrated.prestigeState);
  const purchases = readRecord(prestigeState.purchasesById);

  assert.equal(prestigeState.totalAP, 47);
  assert.equal(prestigeState.currentRunAP, 7);
  assert.equal(prestigeState.lifetimeAP, 99);
  assert.equal('ap_fragment_gain_boost' in purchases, false);
  assert.equal('ap_autosell_filter' in purchases, false);

  const appliedTwice = runSaveMigrations(applied.migrated, { mode: 'apply', normalizeToCurrent: passthrough });
  const prestigeStateTwice = readRecord(appliedTwice.migrated.prestigeState);

  assert.equal(prestigeStateTwice.totalAP, 47);
  assert.deepEqual(appliedTwice.migrated, applied.migrated);
});
