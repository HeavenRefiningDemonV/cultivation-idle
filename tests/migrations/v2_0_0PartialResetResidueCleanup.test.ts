import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;
const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const readArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

test('packet 1.7 apply normalizes legacy partial-reset residue to a clean new-life baseline', async () => {
  const fixture = await loadMigrationFixture('legacy-partial-reset-residue');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const cityState = readRecord(result.migrated.cityState);
  const trialState = readRecord(result.migrated.trialState);
  const ruinsState = readRecord(result.migrated.ruinsState);
  const equipmentState = readRecord(result.migrated.equipmentState);
  const inventoryState = readRecord(result.migrated.inventoryState);
  const prestigeState = readRecord(result.migrated.prestigeState);
  const techniqueState = readRecord(result.migrated.techniqueState);
  const medicinePouchState = readRecord(result.migrated.medicinePouchState);
  const craftSessionState = readRecord(result.migrated.craftSessionState);
  const expeditionState = readRecord(result.migrated.expeditionState);

  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_plan_partial_reset_residue_cleanup'), true);
  assert.deepEqual(cityState.unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(cityState.currentCityId, 'city_pinewind_hamlet');
  assert.deepEqual(cityState.selectedModuleByCity, { city_pinewind_hamlet: 'outskirts' });
  assert.deepEqual(readRecord(trialState.progressByTrialId), {});
  assert.equal(trialState.activeTrialSessionId, null);
  assert.deepEqual(readRecord(ruinsState.progressByRuinId), {});
  assert.equal(ruinsState.activeRun, null);
  assert.equal(equipmentState.equippedWeaponId, null);
  assert.equal(equipmentState.equippedAccessoryId, null);
  assert.deepEqual(equipmentState.refineLevelBySlot, { weapon: 0, accessory: 0 });
  assert.deepEqual(readRecord(inventoryState.items), {});
  assert.deepEqual(inventoryState.currencies, { gold: '0', spiritStones: '0', merit: '0' });
  assert.equal(prestigeState.totalAP, 15);
  assert.equal(prestigeState.lifetimeAP, 45);
  assert.deepEqual(prestigeState.purchasesById, { ap_mastery_retention_25: 1, ap_unlock_heartlaw_t1: 1 });
  const firstLoadout = readArray<Record<string, unknown>>(techniqueState.loadouts)[0] ?? {};
  const firstLoadoutSlots = readRecord(firstLoadout.slots);
  assert.equal(firstLoadoutSlots.ultimate ?? null, null);
  assert.equal(readRecord(medicinePouchState.slots).healing ? readRecord(readRecord(medicinePouchState.slots).healing).equippedItemId : undefined, null);
  assert.equal(craftSessionState.activeSession, null);
  assert.deepEqual(expeditionState.active, []);
  assert.deepEqual(expeditionState.rareProgressByKey, {});
});

test('packet 1.7 apply is idempotent for partial-reset residue cleanup', async () => {
  const fixture = await loadMigrationFixture('legacy-partial-reset-residue');
  const applyOnce = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const applyTwice = runSaveMigrations(applyOnce.migrated, { mode: 'apply', normalizeToCurrent: passthrough });

  assert.deepEqual(applyTwice.migrated, applyOnce.migrated);
  const step = applyTwice.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_partial_reset_residue_cleanup');
  assert.equal(step?.didMutate, false);
});
