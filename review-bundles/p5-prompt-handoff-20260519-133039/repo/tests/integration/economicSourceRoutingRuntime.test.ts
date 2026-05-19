import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { resolveMissingMaterialRoutes } from '../../src/systems/economy/missingMaterialRouteResolver.js';
import { buildBestSourceIndex } from '../../src/systems/economy/bestSourceIndex.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('runtime source routing respects unlocked-city limits and never reaches through multiple older-city hops', async () => {
  const validated = await getValidated();
  const routes = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'mat_mist_pearl',
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
  });

  routes.forEach((route) => {
    assert.equal(/multiple older cities/.test(route.blockedReason ?? ''), false);
    assert.notEqual(route.destinationModuleKey, 'alchemy' as never);
  });
});

test('runtime source routing preserves current-city and non-deferred module truth for live-critical targets', async () => {
  const validated = await getValidated();
  const index = buildBestSourceIndex(validated);
  const healingPellet = index.entriesByTargetId.cons_healing_pellet_t1;
  const merit = resolveMissingMaterialRoutes({
    content: validated,
    targetId: 'merit',
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
    problemKind: 'belowMeritReserve',
  });

  assert.equal(healingPellet.primarySource?.sourceKind, 'apothecary_buy');
  assert.equal(merit[0]?.destinationModuleKey, 'bounties');
  assert.equal(merit.some((route) => route.destinationModuleKey === 'alchemy' as never), false);
});
