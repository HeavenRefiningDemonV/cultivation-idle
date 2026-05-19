import assert from 'node:assert/strict';
import test from 'node:test';

import { buildResourceProvenanceSurface } from '../../src/systems/economy/resourceProvenanceSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('P3 provenance gives reward-summary-ready source to sink callouts', async () => {
  const content = await getValidatedEconomicContent();
  const ore = buildResourceProvenanceSurface({
    content,
    id: 'mat_quarry_ore',
    kind: 'item',
    currentCityId: 'city_stonecrag_town',
    currentShortageIds: ['mat_quarry_ore'],
  });
  const merit = buildResourceProvenanceSurface({
    content,
    id: 'merit',
    kind: 'merit',
    currentCityId: 'city_pinewind_hamlet',
  });

  assert.match(`${ore.quantityLine ?? ''} ${ore.bestSinkRoute?.reason ?? ''}`, /Forge|floor|shortage/i);
  assert.match(`${merit.purpose.label} ${merit.bestSinkRoute?.reason ?? ''}`, /Safety Net|reserve|fallback/i);
});
