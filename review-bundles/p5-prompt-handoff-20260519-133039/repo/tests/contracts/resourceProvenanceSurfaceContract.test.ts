import assert from 'node:assert/strict';
import test from 'node:test';

import { buildResourceProvenanceSurface } from '../../src/systems/economy/resourceProvenanceSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('ResourceProvenanceSurfaceV1 explains ore, gate proof, Merit, fragments, and future items', async () => {
  const content = await getValidatedEconomicContent();

  const ore = buildResourceProvenanceSurface({
    content,
    id: 'mat_quarry_ore',
    kind: 'item',
    currentCityId: 'city_stonecrag_town',
    currentShortageIds: ['mat_quarry_ore'],
  });
  assert.equal(ore.version, 1);
  assert.equal(ore.displayPriority, 'critical');
  assert.ok(ore.sourceTags.some((tag) => tag.moduleKey === 'ruins' || tag.moduleKey === 'expeditions'));
  assert.ok(ore.sinkTags.some((tag) => /Forge|floor|weapon/i.test(tag.label)));

  const proof = buildResourceProvenanceSurface({ content, id: 'gate_foundation_pill', kind: 'item', currentCityId: 'city_pinewind_hamlet' });
  assert.ok(proof.sinkTags.some((tag) => /Breakthrough|proof/i.test(tag.label)));
  assert.notEqual(proof.bestSinkRoute?.moduleKey, 'gateTrial');

  const merit = buildResourceProvenanceSurface({ content, id: 'merit', kind: 'merit', currentCityId: 'city_pinewind_hamlet' });
  assert.ok(merit.sourceTags.some((tag) => tag.moduleKey === 'bounties'));
  assert.ok(merit.sinkTags.some((tag) => /Safety Net|reserve/i.test(tag.label)));

  const fragment = buildResourceProvenanceSurface({ content, id: 'mat_technique_fragment', kind: 'fragment', currentCityId: 'city_spirit_cavern_city' });
  assert.ok(fragment.sinkTags.some((tag) => /Technique|rank|Manual/i.test(tag.label)));

  const future = buildResourceProvenanceSurface({ content, id: 'item_jade_core_shell_t1', kind: 'item', currentCityId: 'city_pinewind_hamlet' });
  assert.notEqual(future.displayPriority, 'critical');
});
