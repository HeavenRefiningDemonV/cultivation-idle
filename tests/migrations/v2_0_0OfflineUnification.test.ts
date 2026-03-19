import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

test('offline unification dry-run reports packet-1.8-owned split without mutating output save', async () => {
  const fixture = await loadMigrationFixture('legacy-offline-split');
  const original = structuredClone(fixture);
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const step = dry.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_offline_unification');

  assert.equal(step?.ownerPacket, '1.8');
  assert.equal(step?.summary.includes('1736033000000'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'OFFLINE_STATE_SPLIT_DETECTED'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.code === 'OFFLINE_NORMALIZED_TO_CANONICAL_TIMESTAMP'), true);
  assert.deepEqual(dry.migrated, original);
});

test('offline unification apply normalizes conflicting timestamps to the latest valid value and is idempotent', async () => {
  const fixture = await loadMigrationFixture('legacy-offline-split');
  const once = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const meta = readRecord(once.migrated.meta);
  const gameState = readRecord(once.migrated.gameState);

  assert.equal(meta.lastActiveAtMs, 1736033000000);
  assert.equal(gameState.lastActiveTime, 1736033000000);
  assert.equal(gameState.lastTickTime, 1736033000000);

  const twice = runSaveMigrations(once.migrated, { mode: 'apply', normalizeToCurrent: passthrough });
  assert.deepEqual(twice.migrated, once.migrated);
  assert.equal(twice.report.warnings.some((entry) => entry.code === 'OFFLINE_STATE_SPLIT_DETECTED'), false);
});
