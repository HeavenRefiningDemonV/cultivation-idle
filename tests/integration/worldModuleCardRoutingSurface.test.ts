import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorldModuleRoutingSurface, resolveWorldStrongRecommendationModuleKey } from '../../src/systems/ui/world/worldModuleRoutingSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('world module routing surface groups cards and limits strong recommendation to one card', async () => {
  const content = await getValidatedEconomicContent();
  const city = content.cities.find((entry) => entry.id === 'city_pinewind_hamlet');
  assert.ok(city);
  if (!city) throw new Error('Expected city fixture.');

  const surface = buildWorldModuleRoutingSurface({
    content,
    cityId: city.id,
    visibleModules: city.modules as any,
    activeModuleKey: 'ruins',
    runCompassPrimaryModuleKey: 'gateTrial',
    runCompassSecondaryModuleKey: 'apothecary',
    economicModuleKeys: ['apothecary', 'forge'],
    economicPrimaryProblemKind: 'belowMinimumForgeFloor',
    trackedBountyModuleKey: 'bounties',
    trackedBountyAlert: null,
    expeditionIdleAlert: null,
    readyBountyCount: 1,
    idleExpeditionSlots: 1,
  });

  assert.deepEqual(surface.groups.map((entry) => entry.id), ['combat', 'preparation', 'support']);
  const allCards = surface.groups.flatMap((entry) => entry.cards);
  const strongChipCount = allCards.flatMap((entry) => entry.chips).filter((chip) => chip.tone === 'strong').length;
  assert.equal(strongChipCount, 1);
  const expectedStrong = resolveWorldStrongRecommendationModuleKey({
    visibleModules: city.modules as any,
    runCompassPrimaryModuleKey: 'gateTrial',
    runCompassSecondaryModuleKey: 'apothecary',
    economicModuleKeys: ['apothecary', 'forge'],
    trackedBountyModuleKey: 'bounties',
  });
  assert.equal(surface.strongRecommendationModuleKey, expectedStrong);

  const firstCard = allCards[0];
  assert.ok(firstCard.label.length > 0);
  assert.ok(firstCard.roleTag.length > 0);
  assert.ok(firstCard.bestUsedWhen.length > 0);
  assert.equal(firstCard.outputs.length >= 1 && firstCard.outputs.length <= 2, true);
});
