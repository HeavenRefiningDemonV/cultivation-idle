import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { normalizeExpeditionRunOrigin, useExpeditionStore } from '../../src/stores/expeditionStore.js';
import {
  loadExpeditionValidatedContent,
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from './expeditionRuntimeTestUtils.js';

const PANEL_PATH = path.resolve(process.cwd(), 'src', 'components', 'screens', 'ExpeditionBoardPanel.tsx');

test.beforeEach(async () => {
  resetExpeditionRuntimeStores();
  await primeExpeditionRuntimeStores();
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
});

function unlockPinewindAndStonecrag() {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().syncRealmEntry('foundation_establishment');
}

function completeRun(slotIndex: number) {
  const run = useExpeditionStore.getState().active.find((entry) => entry.slotIndex === slotIndex);
  assert.ok(run);
  useExpeditionStore.setState((state) => ({
    ...state,
    active: state.active.map((entry) =>
      entry.slotIndex === slotIndex
        ? { ...entry, endsAt: Date.now() - 1, status: 'running' }
        : entry,
    ),
  }));
  useExpeditionStore.getState().tick(Date.now());
}

test('claims can happen from a different current city while rewards still use the origin city', () => {
  unlockPinewindAndStonecrag();
  useCityStore.getState().setCurrentCity('city_pinewind_hamlet');

  const started = useExpeditionStore.getState().start(0, 'forage', 'short', 'city_pinewind_hamlet', 0);
  assert.equal(started, true);
  completeRun(0);

  useCityStore.getState().setCurrentCity('city_stonecrag_town');
  const result = useExpeditionStore.getState().claim(0);

  assert.equal(result.ok, true);
  assert.equal(result.run?.cityId, 'city_pinewind_hamlet');
  const expectedItemIds = new Set((result.expected?.items ?? []).map((item) => item.itemId));
  const rolledItemIds = new Set((result.rolled?.items ?? []).map((item) => item.itemId));
  assert.equal(expectedItemIds.has('mat_spirit_leaf'), true);
  assert.equal(expectedItemIds.has('mat_spirit_dew'), true);
  assert.equal(expectedItemIds.has('mat_earth_essence'), false);
  assert.equal(rolledItemIds.has('mat_spirit_leaf') || rolledItemIds.has('mat_spirit_dew'), true);
});

test('expedition bounty credit goes to the origin city, not the current city', () => {
  unlockPinewindAndStonecrag();
  const pinewind = 'city_pinewind_hamlet';
  const stonecrag = 'city_stonecrag_town';

  useBountyStore.setState((state) => ({
    ...state,
    activeByCityId: {
      [pinewind]: [{
        instanceId: 'pinewind-expedition', cityId: pinewind, cityIndex: 0, templateId: 'test-pinewind-expedition', difficulty: 'medium', kind: 'EXPEDITION_COMPLETE', title: 'Pinewind Expedition', description: 'Claim 1 expedition.', progress: 0, target: 1, claimed: false, rewards: { currencies: {} }, createdAt: 1,
      }],
      [stonecrag]: [{
        instanceId: 'stonecrag-expedition', cityId: stonecrag, cityIndex: 1, templateId: 'test-stonecrag-expedition', difficulty: 'medium', kind: 'EXPEDITION_COMPLETE', title: 'Stonecrag Expedition', description: 'Claim 1 expedition.', progress: 0, target: 1, claimed: false, rewards: { currencies: {} }, createdAt: 1,
      }],
    },
  }));

  const started = useExpeditionStore.getState().start(0, 'forage', 'short', pinewind, 0);
  assert.equal(started, true);
  completeRun(0);
  useCityStore.getState().setCurrentCity(stonecrag);

  const result = useExpeditionStore.getState().claim(0);
  assert.equal(result.ok, true);
  assert.equal(useBountyStore.getState().activeByCityId[pinewind]?.[0]?.progress, 1);
  assert.equal(useBountyStore.getState().activeByCityId[stonecrag]?.[0]?.progress, 0);
});

test('active global runs keep origin-city identity visible in source wiring', async () => {
  const source = await readFile(PANEL_PATH, 'utf8');

  assert.match(source, /run\.cityId/);
  assert.match(source, /ceremony\.run\.cityId/);
});

test('hydration sanitation preserves claimability for legacy origin-less runs', async () => {
  const { validated } = await loadExpeditionValidatedContent();
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  useCityStore.getState().initializeFromContent(citiesSorted);

  useExpeditionStore.getState().hydrate({
    slots: 1,
    active: [{
      slotIndex: 0,
      expeditionTypeId: 'forage',
      durationId: 'short',
      cityId: '',
      cityIndex: 0,
      startedAt: Date.now() - 1_000_000,
      endsAt: Date.now() - 1,
      seed: 123,
      status: 'running',
    }],
    rareProgressByKey: {},
  }, Date.now());

  const hydrated = useExpeditionStore.getState().active[0];
  assert.equal(hydrated?.cityId, 'city_pinewind_hamlet');
  assert.equal(hydrated?.cityIndex, 0);

  const claim = useExpeditionStore.getState().claim(0);
  assert.equal(claim.ok, true);

  const citiesById = Object.fromEntries(validated.cities.map((city) => [city.id, city]));
  assert.equal(
    normalizeExpeditionRunOrigin({
      run: { cityId: '', cityIndex: 999, slotIndex: 0, expeditionTypeId: 'forage', durationId: 'short', startedAt: 0, endsAt: 0, seed: 0, status: 'running' },
      citiesById,
      currentCityId: 'missing_city',
    }),
    null,
  );
});

test('go use materials is now origin-city-safe in source wiring', async () => {
  const source = await readFile(PANEL_PATH, 'utf8');

  assert.match(source, /openWorldModule\s*\(/);
  assert.match(source, /cityId:\s*ceremony\.run\.cityId/);
  assert.match(source, /getLiveExpeditionRoutePurpose|recommendedModuleKey:\s*type\?\.recommendedModuleKey\s*\?\?\s*routePurpose\?\.moduleKey/);
  assert.doesNotMatch(source, /setSelectedModule\s*\(\s*ceremony\.run\.cityId/i);
});
