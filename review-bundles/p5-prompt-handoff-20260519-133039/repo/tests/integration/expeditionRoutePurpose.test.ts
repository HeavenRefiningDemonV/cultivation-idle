import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent, type LoadedContentRaw } from '../../src/content/index.js';
import { getLiveExpeditionRoutePurpose, getLiveExpeditionRoutePurposes } from '../../src/systems/world/expeditionRouteContract.js';
import { normalizeExpeditionRunOrigin, useExpeditionStore } from '../../src/stores/expeditionStore.js';
import {
  FILES,
  loadExpeditionValidatedContent,
  primeExpeditionRuntimeStores,
  readJson,
  resetExpeditionRuntimeStores,
} from './expeditionRuntimeTestUtils.js';

const PANEL_PATH = path.resolve(process.cwd(), 'src', 'components', 'screens', 'ExpeditionBoardPanel.tsx');

test.beforeEach(async () => {
  resetExpeditionRuntimeStores();
  await primeExpeditionRuntimeStores();
});

test('real validated expedition content matches the live semester route-purpose contract', async () => {
  const { validated } = await loadExpeditionValidatedContent();
  const byId = Object.fromEntries(validated.expeditions.types.map((entry) => [entry.id, entry]));

  assert.equal(byId.forage?.recommendedModuleKey, 'apothecary');
  assert.equal(byId.mine?.recommendedModuleKey, 'forge');
  assert.equal(byId.scout?.recommendedModuleKey, 'manualPavilion');

  assert.equal(getLiveExpeditionRoutePurpose('forage')?.moduleKey, 'apothecary');
  assert.equal(getLiveExpeditionRoutePurpose('mine')?.moduleKey, 'forge');
  assert.equal(getLiveExpeditionRoutePurpose('scout')?.moduleKey, 'manualPavilion');

  const livePurposes = getLiveExpeditionRoutePurposes();
  assert.equal(livePurposes.length, 3);
  assert.equal(new Set(livePurposes.map((entry) => entry.moduleKey)).size, 3);
  assert.equal(livePurposes.some((entry) => String(entry.moduleKey) === 'alchemy'), false);
});

test('content validation rejects semester route-purpose drift', async () => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  const raw = Object.fromEntries(entries) as unknown as LoadedContentRaw;
  const drifted = structuredClone(raw);
  const forage = drifted.expeditions.types.find((entry) => entry.id === 'forage');
  assert.ok(forage);
(forage as { recommendedModuleKey?: string }).recommendedModuleKey = 'alchemy';

  assert.throws(
    () => validateLoadedContent(drifted),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /route-purpose drift/i);
      assert.match(error.message, /forage/i);
      assert.match(error.message, /apothecary/i);
      return true;
    },
  );
});

test('the route-purpose helper exposes the right player-facing CTA labels', () => {
  assert.deepEqual(getLiveExpeditionRoutePurpose('forage'), {
    expeditionTypeId: 'forage',
    moduleKey: 'apothecary',
    moduleLabel: 'Apothecary',
    ctaLabel: 'Open Apothecary',
  });
  assert.deepEqual(getLiveExpeditionRoutePurpose('mine'), {
    expeditionTypeId: 'mine',
    moduleKey: 'forge',
    moduleLabel: 'Forge',
    ctaLabel: 'Open Forge',
  });
  assert.deepEqual(getLiveExpeditionRoutePurpose('scout'), {
    expeditionTypeId: 'scout',
    moduleKey: 'manualPavilion',
    moduleLabel: 'Manual Pavilion',
    ctaLabel: 'Open Manual Pavilion',
  });
});

test('ExpeditionBoardPanel source no longer contains the stale Alchemy fallback', async () => {
  const source = await readFile(PANEL_PATH, 'utf8');

  assert.doesNotMatch(source, /forage\s*[:=]\s*['"]alchemy['"]/i);
  assert.doesNotMatch(source, /['"]Alchemy['"]\s*[:)]/i);
  assert.match(source, /openWorldModule\s*\(/);
  assert.match(source, /getLiveExpeditionRoutePurpose|moduleLabel|ctaLabel/);
});

test('useExpeditionStore.start derives the stored city index from the city id', () => {
  const success = useExpeditionStore.getState().start(0, 'forage', 'short', 'city_stonecrag_town', 999);
  const run = useExpeditionStore.getState().active[0];

  assert.equal(success, true);
  assert.equal(run?.cityId, 'city_stonecrag_town');
  assert.equal(run?.cityIndex, 1);
});

test('origin-normalization helper backfills legacy runs correctly', async () => {
  const { validated } = await loadExpeditionValidatedContent();
  const citiesById = Object.fromEntries(validated.cities.map((city) => [city.id, city]));

  assert.deepEqual(
    normalizeExpeditionRunOrigin({
      run: { cityId: 'invalid_city', cityIndex: 0, slotIndex: 0, expeditionTypeId: 'forage', durationId: 'short', startedAt: 0, endsAt: 0, seed: 0, status: 'running' },
      citiesById,
    }),
    { cityId: 'city_pinewind_hamlet', cityIndex: 0 },
  );

  assert.deepEqual(
    normalizeExpeditionRunOrigin({
      run: { cityId: '', cityIndex: 999, slotIndex: 0, expeditionTypeId: 'forage', durationId: 'short', startedAt: 0, endsAt: 0, seed: 0, status: 'running' },
      citiesById,
      currentCityId: 'city_stonecrag_town',
    }),
    { cityId: 'city_stonecrag_town', cityIndex: 1 },
  );

  assert.deepEqual(
    normalizeExpeditionRunOrigin({
      run: { cityId: 'city_stonecrag_town', cityIndex: 999, slotIndex: 0, expeditionTypeId: 'forage', durationId: 'short', startedAt: 0, endsAt: 0, seed: 0, status: 'running' },
      citiesById,
      currentCityId: 'city_pinewind_hamlet',
    }),
    { cityId: 'city_stonecrag_town', cityIndex: 1 },
  );

  assert.equal(
    normalizeExpeditionRunOrigin({
      run: { cityId: '', cityIndex: 999, slotIndex: 0, expeditionTypeId: 'forage', durationId: 'short', startedAt: 0, endsAt: 0, seed: 0, status: 'running' },
      citiesById,
      currentCityId: 'invalid_city',
    }),
    null,
  );
});
