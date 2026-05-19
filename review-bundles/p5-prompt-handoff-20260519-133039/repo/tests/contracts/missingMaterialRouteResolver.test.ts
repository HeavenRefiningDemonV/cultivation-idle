import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { resolveMissingMaterialRoutes } from '../../src/systems/economy/missingMaterialRouteResolver.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('shop-stocked consumables route to Apothecary Buy first when the current city can still cover the gap', async () => {
  const validated = await getValidated();
  const routes = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'cons_meridian_warmth_draft_t1',
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
    shortageQty: 3,
    purchasedTodayByStockId: {},
  });

  assert.equal(routes[0]?.routeType, 'apothecary_buy');
  assert.equal(routes[0]?.blockedReason, null);
  assert.equal(routes[1]?.routeType, 'apothecary_brew');
});

test('shop-capped consumables route to Apothecary Brew when immediate shelf stock can no longer cover the shortage', async () => {
  const validated = await getValidated();
  const routes = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'cons_meridian_warmth_draft_t1',
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
    shortageQty: 3,
    purchasedTodayByStockId: { cons_meridian_warmth_draft_t1_3: 10 },
  });

  assert.equal(routes[0]?.routeType, 'apothecary_buy');
  assert.match(routes[0]?.blockedReason ?? '', /Shop cap/);
  assert.equal(routes[1]?.routeType, 'apothecary_brew');
  assert.equal(routes[1]?.blockedReason, null);
});

test('targeted local shortages prefer Ruins primary and Expedition secondary, without deferred module leakage', async () => {
  const validated = await getValidated();
  const routes = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'mat_spirit_leaf',
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
  });

  assert.equal(routes[0]?.routeType, 'ruins');
  assert.equal(routes[1]?.routeType, 'expeditions');
  assert.equal(routes.some((route) => route.destinationModuleKey === 'alchemy' as never), false);
});

test('forge inputs resolve through honest live-semester material sources', async () => {
  const validated = await getValidated();
  const routes = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'mat_spirit_steel_ore',
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: validated.cities.map((city) => city.id),
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
  });

  assert.equal(routes[0]?.routeType, 'ruins');
  assert.equal(routes[1]?.routeType, 'expeditions');
});
