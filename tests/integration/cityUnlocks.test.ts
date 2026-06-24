import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  type RawProgressionContentLike,
  getCityUnlockForRealm,
  getContentCapRealm,
} from '../../src/systems/progression/contract/index.js';
import {
  getCityUnlockForRealmEntry,
  getCityUnlockRequirementText,
  getUnlockedCitiesForEnteredRealms,
  isCityProgressionCapRealm,
} from '../../src/systems/progression/runtime/index.js';
import { createPostFirstGateScenario, loadProgressionContract } from '../helpers/progression/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

test('Foundation maps to city 2 unlock in contract mapping', async () => {
  const contract = await loadProgressionContract();
  const unlock = getCityUnlockForRealm(contract, 'foundation_establishment');
  assert.equal(unlock?.cityId, 'city_stonecrag_town');
});

test('packet 1.5 runtime helper resolves each live city unlock from contract truth', async () => {
  const contract = await loadProgressionContract();

  assert.equal(getCityUnlockForRealmEntry(contract, 'foundation_establishment')?.cityId, 'city_stonecrag_town');
  assert.equal(getCityUnlockForRealmEntry(contract, 'core_formation')?.cityId, 'city_spirit_cavern_city');
  assert.equal(getCityUnlockForRealmEntry(contract, 'nascent_soul')?.cityId, 'city_lotusford');
  assert.equal(getCityUnlockForRealmEntry(contract, 'soul_formation')?.cityId, 'city_ironpeak_bastion');
  assert.equal(getCityUnlockForRealmEntry(contract, 'spirit_severing'), null);
});

test('content cap does not map to a fake city six unlock', async () => {
  const contract = await loadProgressionContract();
  const capRealm = getContentCapRealm(contract);
  const capUnlock = getCityUnlockForRealm(contract, capRealm);
  assert.equal(capUnlock, null);
  assert.equal(isCityProgressionCapRealm(contract, capRealm), true);
});

test('post-first-gate scenario represents city 2 acknowledgement shape', async () => {
  const contract = await loadProgressionContract();
  const scenario = createPostFirstGateScenario({ contract });
  assert.equal(scenario.cityState.unlockedCityIds.includes('city_stonecrag_town'), true);
});

test('runtime helper backfills unlocked cities from entered-realm truth in canonical order', async () => {
  const contract = await loadProgressionContract();
  assert.deepEqual(
    getUnlockedCitiesForEnteredRealms(contract, [
      'qi_condensation',
      'foundation_establishment',
      'core_formation',
      'nascent_soul',
    ]),
    [
      'city_pinewind_hamlet',
      'city_stonecrag_town',
      'city_spirit_cavern_city',
      'city_lotusford',
    ],
  );
});

test('World screen source labels locked cities with explicit realm-entry requirement text', async () => {
  const [worldScreenSource, ribbonSource, economy, cities, items, trials, prestigeStore] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'src/components/screens/WorldScreen.tsx'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'src/ui/world/WorldOverlayRibbon.tsx'), 'utf8'),
    readJson<RawProgressionContentLike['economy']>('economy.json'),
    readJson<RawProgressionContentLike['cities']>('cities.json'),
    readJson<RawProgressionContentLike['items']>('items.json'),
    readJson<RawProgressionContentLike['trials']>('trials.json'),
    readJson<NonNullable<RawProgressionContentLike['prestige_store']>>('prestige_store.json'),
  ]);
  const contract = buildProgressionContract(
    adaptProgressionAuthoredContent({
      economy,
      cities,
      items,
      trials,
      prestige_store: prestigeStore,
    }),
  );

  // The locked-city label moved out of WorldScreen into the WorldOverlayRibbon city
  // selector during the world-surface rework. WorldScreen still wires the realm-entry
  // requirement text into the ribbon's selector entries (requirementText), and the
  // ribbon renders it as the explicit "Locked" label for each locked city.
  assert.equal(worldScreenSource.includes('requirementText: requirementText'), true);
  assert.equal(ribbonSource.includes('Locked'), true);
  assert.equal(ribbonSource.includes('requirementText'), true);
  assert.equal(getCityUnlockRequirementText(contract, 'city_stonecrag_town'), 'Reach Foundation Establishment');
});
