import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { getCanonicalMajorRealmIndex, getCanonicalMajorRealmName } from '../../src/systems/progression/contract/realmMap.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;
const readRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});

test('apply migration clamps legacy future-slice save to the semester cap', async () => {
  const fixture = await loadMigrationFixture('legacy-future-slice');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const gameState = readRecord(result.migrated.gameState);
  const prestigeState = readRecord(result.migrated.prestigeState);
  const realm = readRecord(gameState.realm);
  const capIndex = getCanonicalMajorRealmIndex(SEMESTER_SLICE_CONTRACT.contentCapRealm);
  const capName = getCanonicalMajorRealmName(SEMESTER_SLICE_CONTRACT.contentCapRealm);

  assert.equal(realm.index, capIndex);
  assert.equal(realm.name, capName);
  assert.equal(prestigeState.highestRealmReached, capIndex);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'OUT_OF_SLICE_PROGRESS_DETECTED'), true);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'OUT_OF_SLICE_PROGRESS_NORMALIZED'), true);
  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_clamp_semester_slice'), true);
});
