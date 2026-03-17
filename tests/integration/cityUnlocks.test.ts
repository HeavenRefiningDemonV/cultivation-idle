import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCityUnlockForRealm,
  getContentCapRealm,
} from '../../src/systems/progression/contract/index.js';
import { createPostFirstGateScenario, loadProgressionContract } from '../helpers/progression/index.js';

test('Foundation maps to city 2 unlock in contract mapping', async () => {
  const contract = await loadProgressionContract();
  const unlock = getCityUnlockForRealm(contract, 'foundation_establishment');
  assert.equal(unlock?.cityId, 'city_stonecrag_town');
});

test('content cap does not map to a fake city six unlock', async () => {
  const contract = await loadProgressionContract();
  const capRealm = getContentCapRealm(contract);
  const capUnlock = getCityUnlockForRealm(contract, capRealm);
  assert.equal(capUnlock, null);
});

test('post-first-gate scenario represents city 2 acknowledgement shape', async () => {
  const contract = await loadProgressionContract();
  const scenario = createPostFirstGateScenario({ contract });
  assert.equal(scenario.cityState.unlockedCityIds.includes('city_stonecrag_town'), true);
});

// Future runtime assertions (packet 1.5): enable after city unlock flow is centralized on realm-entry truth.
test('TODO(packet 1.5): Foundation breakthrough unlocks city 2 in runtime flow', { todo: true }, () => {});
test('TODO(packet 1.5): city unlock occurs on actual realm entry, not scattered helper behavior', { todo: true }, () => {});
