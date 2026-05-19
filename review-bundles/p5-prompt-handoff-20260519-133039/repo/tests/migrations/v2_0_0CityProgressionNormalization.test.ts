import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;

test('current-save fixture now preserves canonical packet-1.5 cityState truth', async () => {
  const fixture = await loadMigrationFixture('current-save');
  const cityState = fixture.cityState as {
    currentCityId?: string;
    unlockedCityIds?: string[];
    selectedModuleByCity?: Record<string, string>;
  };

  assert.equal(cityState.currentCityId, 'city_pinewind_hamlet');
  assert.deepEqual(cityState.unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(cityState.selectedModuleByCity?.city_pinewind_hamlet, 'outskirts');
});

test('apply-mode migration backfills missing cityState from later realm entry without inventing city six', async () => {
  const fixture = await loadMigrationFixture('legacy-trial-mismatch');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const cityState = result.migrated.cityState as {
    currentCityId?: string | null;
    unlockedCityIds?: string[];
    selectedModuleByCity?: Record<string, string>;
  };
  const step = result.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_normalize_city_progression_state');

  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_normalize_city_progression_state'), true);
  assert.equal(step?.ownerPacket, '1.5');
  assert.deepEqual(cityState.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
  assert.equal(cityState.currentCityId, 'city_stonecrag_town');
  assert.equal(cityState.selectedModuleByCity?.city_stonecrag_town, 'outskirts');
  assert.equal(cityState.unlockedCityIds?.includes('city_six'), false);
});

test('dry-run and apply normalize invalid current city to the highest unlocked in-slice city', async () => {
  const fixture = await loadMigrationFixture('legacy-city-current-invalid');
  const dry = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough });
  const apply = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const cityState = apply.migrated.cityState as {
    currentCityId?: string | null;
    unlockedCityIds?: string[];
    selectedModuleByCity?: Record<string, string>;
  };

  assert.equal(dry.report.appliedTransformSteps.includes('v2_0_0_normalize_city_progression_state'), true);
  assert.equal(dry.report.warnings.some((entry) => entry.ownerPacket === '1.5'), true);
  assert.deepEqual(cityState.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
  ]);
  assert.equal(cityState.currentCityId, 'city_lotusford');
  assert.equal(cityState.selectedModuleByCity?.city_lotusford, 'outskirts');
});

test('apply-mode migration clamps cap-edge city progression to the five live cities only', async () => {
  const fixture = await loadMigrationFixture('legacy-future-slice');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const cityState = result.migrated.cityState as { unlockedCityIds?: string[]; currentCityId?: string | null };

  assert.deepEqual(cityState.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ]);
  assert.equal(cityState.currentCityId, 'city_ironpeak_bastion');
  assert.equal(cityState.unlockedCityIds?.includes('city_six'), false);
});
