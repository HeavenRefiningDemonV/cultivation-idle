import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildForgeExactSurfaceFromStores } from '../../src/features/professions/forgeExact/buildForgeExactSurface.js';
import { listForgeBlueprintsForCity, useContentStore } from '../../src/stores/contentStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useProfessionStore } from '../../src/stores/professionStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

async function primeStores() {
  const validated = await getValidated();
  useContentStore.setState({
    raw: validated,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])),
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])),
      runesById: Object.fromEntries(validated.runes.map((rune) => [rune.id, rune as { id: string }])),
    },
    citiesSorted: [...validated.cities].sort((a, b) => a.index - b.index),
  });
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
  });
  useInventoryStore.setState({
    items: {
      mat_low_grade_ore: 12,
      mat_stone_chunk: 3,
    },
    currencies: { gold: '1000', spiritStones: '0', merit: '0' },
    gold: '1000',
    spiritStones: '0',
    merit: '0',
  });
  useEquipmentStore.setState({
    equippedWeaponId: 'fixture_weapon',
    equippedAccessoryId: 'fixture_accessory',
    refineLevelBySlot: { weapon: 2, accessory: 1 },
    temperBonusesBySlot: { weapon: [], accessory: [] },
  });
  useProfessionStore.setState({ forgeQueue: [] });
}

test('forge exact live Pinewind mapping uses visible live Forge blueprints only', async () => {
  await primeStores();
  const surface = buildForgeExactSurfaceFromStores('city_pinewind_hamlet', {
    activeTab: 'refine',
    activeMode: 'assisted',
  });
  const visibleIds = surface.debug?.visibleBlueprintIds ?? [];
  const directGetterIds = listForgeBlueprintsForCity({ cityId: 'city_pinewind_hamlet' }).map((blueprint) => blueprint.id).sort();

  assert.deepEqual([...visibleIds].sort(), directGetterIds);
  assert.equal(visibleIds.includes('formation_plate_basic'), false);
  assert.equal(visibleIds.includes('forge_jade_core_shell_t1'), false);
  assert.equal(visibleIds.includes('rune_inscription_basic'), false);
  assert.deepEqual(surface.debug?.hiddenBlueprintLeakCheck, []);
});

test('forge exact maps floor read model values to the top strip and Permanent Floor rail', async () => {
  await primeStores();
  const surface = buildForgeExactSurfaceFromStores('city_pinewind_hamlet', {
    activeTab: 'refine',
    activeMode: 'assisted',
  });

  assert.equal(surface.topTruthStrip.find((cell) => cell.id === 'weapon-floor')?.value, '+2 / +3');
  assert.equal(surface.topTruthStrip.find((cell) => cell.id === 'accessory-floor')?.value, '+1 / +2');
  assert.equal(surface.topTruthStrip.find((cell) => cell.id === 'temper')?.value, '0 / 1');
  assert.equal(surface.topTruthStrip.find((cell) => cell.id === 'rune-target')?.value, 'None');
  assert.deepEqual(surface.floorRail.nodes.map((node) => [node.id, node.value]), [
    ['weapon', '+2 -> +3'],
    ['accessory', '+1 -> +2'],
    ['temper', '0 -> 1'],
    ['rune', 'None'],
    ['gate', 'Target'],
  ]);
});
