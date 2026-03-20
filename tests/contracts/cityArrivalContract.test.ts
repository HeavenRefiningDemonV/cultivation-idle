import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  getCityArrivalLesson,
  getCityArrivalQuickOpenModules,
  getQueuedCityArrivalCandidate,
  normalizeAcknowledgedArrivalCityIds,
} from '../../src/systems/world/cityArrivalContract.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

test('city arrival lesson helper exposes the exact packet 2.6 lesson copy', () => {
  assert.equal(getCityArrivalLesson('city_pinewind_hamlet'), 'Learn the loop.');
  assert.equal(getCityArrivalLesson('city_stonecrag_town'), 'Forge begins to matter.');
  assert.equal(getCityArrivalLesson('city_spirit_cavern_city'), 'Build correction starts to matter.');
  assert.equal(getCityArrivalLesson('city_lotusford'), 'Survival prep and reagents matter.');
  assert.equal(getCityArrivalLesson('city_ironpeak_bastion'), 'Final convergence city.');
});

test('city arrival quick-open helper preserves canonical module order', async () => {
  const cities = await readJson<Array<{ id: string; modules: string[] }>>('cities.json');
  const liveModules = cities.find((city) => city.id === 'city_pinewind_hamlet')?.modules ?? [];

  assert.deepEqual(getCityArrivalQuickOpenModules(liveModules), ['outskirts', 'ruins', 'gateTrial']);
  assert.deepEqual(
    getCityArrivalQuickOpenModules(liveModules.filter((moduleKey) => moduleKey !== 'ruins')),
    ['outskirts', 'gateTrial'],
  );
  assert.deepEqual(
    getCityArrivalQuickOpenModules(['gateTrial', 'outskirts', 'ruins']),
    ['outskirts', 'ruins', 'gateTrial'],
  );
});

test('acknowledgement normalization backfills unlocked cities for old saves when the field is missing', () => {
  assert.deepEqual(
    normalizeAcknowledgedArrivalCityIds({
      incoming: undefined,
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      validCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      fieldWasPresent: false,
    }),
    ['city_pinewind_hamlet', 'city_stonecrag_town'],
  );
});

test('acknowledgement normalization preserves an explicit empty array', () => {
  assert.deepEqual(
    normalizeAcknowledgedArrivalCityIds({
      incoming: [],
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      validCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      fieldWasPresent: true,
    }),
    [],
  );
});

test('acknowledgement normalization filters invalid or locked ids and dedupes to the unlocked order', () => {
  assert.deepEqual(
    normalizeAcknowledgedArrivalCityIds({
      incoming: ['city_stonecrag_town', 'bad_id', 'city_stonecrag_town', 'city_ironpeak_bastion'],
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      validCityIds: [
        'city_pinewind_hamlet',
        'city_stonecrag_town',
        'city_spirit_cavern_city',
        'city_lotusford',
        'city_ironpeak_bastion',
      ],
      fieldWasPresent: true,
    }),
    ['city_stonecrag_town'],
  );
});

test('pending city-arrival candidate helper prefers the requested unlocked city, falls back to the newest, and returns null when clear', () => {
  const citiesById = {
    city_pinewind_hamlet: { index: 0 },
    city_stonecrag_town: { index: 1 },
    city_spirit_cavern_city: { index: 2 },
  };

  assert.equal(
    getQueuedCityArrivalCandidate({
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      acknowledgedArrivalCityIds: ['city_pinewind_hamlet'],
      citiesById,
      preferredCityId: 'city_stonecrag_town',
    }),
    'city_stonecrag_town',
  );

  assert.equal(
    getQueuedCityArrivalCandidate({
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      acknowledgedArrivalCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      citiesById,
      preferredCityId: 'city_stonecrag_town',
    }),
    'city_spirit_cavern_city',
  );

  assert.equal(
    getQueuedCityArrivalCandidate({
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      acknowledgedArrivalCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      citiesById,
      preferredCityId: 'city_stonecrag_town',
    }),
    null,
  );
});
