import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBountyRouteSurface, buildCityRecognitionSurface } from '../../src/features/world/bountiesExact/bountyRouteSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('BountyRouteSurfaceV1 and CityRecognitionSurfaceV1 show Merit support without a social sim', async () => {
  const content = await getValidatedEconomicContent();
  const bounty = content.bounties.templates[0]!;

  const route = buildBountyRouteSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    bountyId: bounty.id,
    currentBlockerKind: 'belowMeritReserve',
    currentMerit: '0',
  });
  assert.equal(route.version, 1);
  assert.ok(route.fitTags.includes('supports_safety_net'));
  assert.match(route.meritTargetLine ?? '', /Merit|Safety Net|reserve/i);

  const recognition = buildCityRecognitionSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    gateCleared: true,
    realmIndex: 1,
  });
  assert.equal(recognition.version, 1);
  assert.equal(recognition.state, 'gate_challenger');
  assert.deepEqual(recognition.unlockedBenefits, []);
});
