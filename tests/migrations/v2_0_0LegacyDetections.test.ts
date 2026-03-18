import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;
const readRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});

test('gate item alias migration dry-run detects legacy IDs without mutating save', async () => {
  const fixture = await loadMigrationFixture('legacy-gate-item-ids');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const inventoryState = readRecord(dry.migrated.inventoryState);
  const items = readRecord(inventoryState.items);

  assert.equal(dry.report.appliedTransformSteps.includes('v2_0_0_plan_gate_item_alias_migration'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'LEGACY_GATE_ITEM_ALIAS_PRESENT'), true);
  assert.equal(items.foundation_pill, 2);
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_gate_item_alias_migration');
  assert.equal(step?.ownerPacket, '1.3');
  assert.equal(step?.didMutate, false);
});

test('future-slice detection reports owner packet 1.1 without mutating save', async () => {
  const fixture = await loadMigrationFixture('legacy-future-slice');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const planStep = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_semester_slice_clamp');
  const clampStep = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_clamp_semester_slice');
  const gameState = readRecord(dry.migrated.gameState);
  const realm = readRecord(gameState.realm);

  assert.equal(planStep?.ownerPacket, '1.1');
  assert.equal(clampStep?.ownerPacket, '1.1');
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'OUT_OF_SLICE_PROGRESS_DETECTED'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'OUT_OF_SLICE_PROGRESS_NORMALIZED'), true);
  assert.equal(dry.report.appliedTransformSteps.includes('v2_0_0_clamp_semester_slice'), true);
  assert.equal(realm.index, 7);
});

test('hidden prestige refund dry-run detects purchases, reports owner packet 1.6, and does not mutate save', async () => {
  const fixture = await loadMigrationFixture('legacy-hidden-prestige');
  const original = structuredClone(fixture);
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_deferred_prestige_refund');

  assert.equal(step?.ownerPacket, '1.6');
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'HIDDEN_PRESTIGE_PURCHASE_PRESENT'), true);
  assert.equal(step?.summary.includes('totalRefundAP=240'), true);
  assert.equal(step?.summary.includes('ap_unlock_pagoda'), true);
  assert.equal(step?.summary.includes('ap_unlock_jade_core'), true);
  assert.deepEqual(dry.migrated, original);
});

test('trial mismatch planning detects contradictory realm and gate/trial proof state', async () => {
  const fixture = await loadMigrationFixture('legacy-trial-mismatch');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_trial_resolution_normalization');

  assert.equal(step?.ownerPacket, '1.4');
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'TRIAL_RESOLUTION_MISMATCH'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'GATE_STATE_NORMALIZED_TO_BYPASS'), true);
});

test('partial reset residue planning detects clean-life inconsistencies', async () => {
  const fixture = await loadMigrationFixture('legacy-partial-reset-residue');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_partial_reset_residue_cleanup');

  assert.equal(step?.ownerPacket, '1.7');
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'PARTIAL_RESET_RESIDUE_DETECTED'), true);
});

test('offline split detection reports owner packet 1.8 when split metadata is present', async () => {
  const fixture = await loadMigrationFixture('legacy-offline-split');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_offline_unification');

  assert.equal(step?.ownerPacket, '1.8');
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'OFFLINE_STATE_SPLIT_DETECTED'), true);
});
