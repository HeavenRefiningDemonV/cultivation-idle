import assert from 'node:assert/strict';
import test from 'node:test';

import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';
import { buildWorldModuleCardSurface } from '../../src/systems/world/moduleCardRegistry.js';

function hasRawIdLeak(text: string): boolean {
  return /^(mat_|item_|city_|trial_)/i.test(text);
}

test('runtime module card surfaces stay player-facing and preserve locked outskirts/ruins copy', async () => {
  const content = await getValidatedEconomicContent();
  const cityId = 'city_pinewind_hamlet';

  const outskirts = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'outskirts' });
  const ruins = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'ruins' });
  const bounties = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'bounties' });
  const expeditions = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'expeditions' });
  const manual = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'manualPavilion' });
  const gate = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'gateTrial' });

  assert.equal(outskirts.roleTag, 'Gold & Common Mats');
  assert.equal(outskirts.bestUsedWhen, 'Best used when you need gold, common materials, or low-risk combat reps.');
  assert.equal(ruins.roleTag, 'Targeted Mats');
  assert.equal(ruins.bestUsedWhen, 'Best used when you need targeted local materials and deterministic support rewards.');

  assert.deepEqual(bounties.outputs.map((entry) => entry.label), ['Merit', 'Spirit Stones']);
  assert.deepEqual(manual.outputs.map((entry) => entry.label), ['Manuals', 'Technique Fragments']);
  assert.equal(expeditions.outputs.some((entry) => ['Herbs', 'Ore', 'Fragments'].includes(entry.label)), true);
  assert.equal(gate.outputs.length <= 2, true);

  const allLabels = [
    outskirts.label,
    ruins.label,
    gate.label,
    ...outskirts.outputs.map((entry) => entry.label),
    ...ruins.outputs.map((entry) => entry.label),
    ...gate.outputs.map((entry) => entry.label),
  ];

  allLabels.forEach((label) => {
    assert.equal(hasRawIdLeak(label), false);
    assert.doesNotMatch(label, /mistwood|sunspire|emberhold/i);
  });
});
