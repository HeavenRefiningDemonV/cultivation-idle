import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRuinsReliefSurface } from '../../src/features/world/ruinsExact/ruinsReliefSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('RuinsReliefSurfaceV1 names targeted shortage relief without claiming unrelated sources', async () => {
  const content = await getValidatedEconomicContent();
  const stoneRuin = content.ruins.find((ruin) => ruin.cityId === 'city_stonecrag_town')!;

  const ore = buildRuinsReliefSurface({
    content,
    cityId: 'city_stonecrag_town',
    ruinId: stoneRuin.id,
    shortageItemId: 'mat_quarry_ore',
  });
  assert.equal(ore.version, 1);
  assert.match(ore.currentShortageTarget?.label ?? '', /Quarry Ore|Ore|material/i);
  assert.ok(ore.expectedMaterialRelief.length > 0);
  assert.ok(ore.supportRunContribution);

  const proof = buildRuinsReliefSurface({
    content,
    cityId: 'city_stonecrag_town',
    ruinId: stoneRuin.id,
    shortageItemId: 'gate_foundation_pill',
  });
  assert.equal(proof.currentShortageTarget, undefined);
  assert.match(proof.debugNotes.join(' '), /not obtainable|no ruin/i);
});
