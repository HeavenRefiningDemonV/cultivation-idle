import assert from 'node:assert/strict';
import test from 'node:test';

import { buildExpeditionShortageSurface } from '../../src/features/world/expeditionsExact/expeditionShortageSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('ExpeditionShortageSurfaceV1 routes idle slots toward current shortages', async () => {
  const content = await getValidatedEconomicContent();
  const surface = buildExpeditionShortageSurface({
    content,
    cityId: 'city_stonecrag_town',
    activeRuns: [],
    slots: 1,
    shortageItemIds: ['mat_quarry_ore'],
  });

  assert.equal(surface.version, 1);
  assert.ok(surface.currentShortages.some((shortage) => /Quarry Ore|Ore/i.test(shortage.label)));
  assert.ok(surface.recommendedRoutes.some((route) => route.fit === 'primary' && /ore/i.test(route.expectedYieldLine)));
  assert.match(surface.summaryLine, /shortage|slot|route|claim/i);
});
