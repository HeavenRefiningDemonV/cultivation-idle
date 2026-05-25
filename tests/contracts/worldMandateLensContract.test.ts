import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  applyLocalMandateLensVisibility,
  buildWorldMandateRoutingLensSurface,
} from '../../src/systems/world/localMandateLensSurface.js';
import { buildWorldModuleRoutingSurface, resolveWorldStrongRecommendationModuleKey } from '../../src/systems/ui/world/worldModuleRoutingSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

function gateTrialMandate(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: {
        id: 'attempt-gate',
        label: 'Attempt Gate Trial',
        actionLabel: 'Open Gate Trial',
        detail: 'Challenge the gate now.',
        destinationLabel: 'Gate Trial',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
        blocked: false,
        blockedReason: null,
        expectedDeltaLabel: 'Gate result updates.',
        source: 'trial_lifecycle',
        priority: 1,
      },
      secondaryRoutes: [{
        id: 'field-support',
        label: 'Gather Field Support',
        actionLabel: 'Open Outskirts',
        detail: 'Gather broad materials safely.',
        destinationLabel: 'Outskirts',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'outskirts' },
        blocked: false,
        blockedReason: null,
        expectedDeltaLabel: 'Common materials improve.',
        source: 'economy',
        priority: 30,
      }],
    }),
    { guidanceProfile: 'jade', currentScreen: 'world' },
  );
}

test('world module routing gives Mandate primary the only strong chip while keeping claim and idle auxiliary cues', async () => {
  const content = await getValidatedEconomicContent();
  const city = content.cities.find((entry) => entry.id === 'city_pinewind_hamlet');
  assert.ok(city);
  if (!city) throw new Error('Expected city fixture.');

  const mandateRouting = buildWorldMandateRoutingLensSurface({
    mandate: gateTrialMandate(),
    cityId: city.id,
    visibleModules: city.modules as never,
  });
  const surface = buildWorldModuleRoutingSurface({
    content,
    cityId: city.id,
    visibleModules: city.modules as never,
    activeModuleKey: 'outskirts',
    primaryModuleKey: mandateRouting.primaryModuleKey,
    secondaryModuleKeys: mandateRouting.secondaryModuleKeys,
    supportModuleKeys: mandateRouting.supportModuleKeys,
    blockedModuleKeys: mandateRouting.blockedModuleKeys,
    economicModuleKeys: ['forge'],
    economicPrimaryProblemKind: 'belowMinimumForgeFloor',
    trackedBountyModuleKey: 'bounties',
    trackedBountyAlert: null,
    expeditionIdleAlert: null,
    readyBountyCount: 1,
    idleExpeditionSlots: 1,
  });

  const allCards = surface.groups.flatMap((entry) => entry.cards);
  const strongCards = allCards.filter((card) => card.chips.some((chip) => chip.tone === 'strong'));
  const bounty = allCards.find((card) => card.moduleKey === 'bounties');
  const expeditions = allCards.find((card) => card.moduleKey === 'expeditions');

  assert.equal(surface.strongRecommendationModuleKey, 'gateTrial');
  assert.deepEqual(strongCards.map((card) => card.moduleKey), ['gateTrial']);
  assert.equal(bounty?.chips.some((chip) => chip.kind === 'claim_ready' && chip.tone === 'support'), true);
  assert.equal(expeditions?.chips.some((chip) => chip.kind === 'idle_slot' && chip.tone === 'support'), true);
});

test('world strong recommendation priority is Mandate first, then economy and tracked fallback', () => {
  const visibleModules = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'bounties'] as const;

  assert.equal(resolveWorldStrongRecommendationModuleKey({
    visibleModules,
    primaryModuleKey: 'gateTrial',
    secondaryModuleKeys: ['outskirts'],
    supportModuleKeys: ['forge'],
    blockedModuleKeys: [],
    economicModuleKeys: ['forge'],
    trackedBountyModuleKey: 'bounties',
  }), 'gateTrial');

  assert.equal(resolveWorldStrongRecommendationModuleKey({
    visibleModules,
    primaryModuleKey: null,
    secondaryModuleKeys: [],
    supportModuleKeys: [],
    blockedModuleKeys: [],
    economicModuleKeys: ['forge'],
    trackedBountyModuleKey: 'bounties',
  }), 'forge');

  assert.equal(resolveWorldStrongRecommendationModuleKey({
    visibleModules,
    primaryModuleKey: null,
    secondaryModuleKeys: [],
    supportModuleKeys: [],
    blockedModuleKeys: [],
    economicModuleKeys: [],
    trackedBountyModuleKey: 'bounties',
  }), 'bounties');
});

test('world Mandate lens exposes raw relations but hides quiet inspector lines by granular setting', () => {
  const visibleModules = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'bounties'] as const;
  const world = buildWorldMandateRoutingLensSurface({
    mandate: gateTrialMandate(),
    cityId: 'city_pinewind_hamlet',
    visibleModules,
    guidanceSettings: { guidanceOath: 'sealed', localLensBanners: 'compact' },
  });

  assert.equal(world.strongestModuleKey, 'gateTrial');
  assert.equal(world.relationByModuleKey.ruins ?? null, null);
  assert.equal(world.visibleRelationByModuleKey.ruins ?? null, null);
  assert.equal(world.visibleRelationByModuleKey.gateTrial?.relation, 'primary-evidence');
});

test('world inspector visibility keeps support detail profile-invariant without promoting quiet modules', () => {
  const visibleModules = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'bounties'] as const;
  const mandate = gateTrialMandate();
  const elder = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules,
    guidanceSettings: { guidanceOath: 'elder', localLensBanners: 'compact' },
  });
  const jade = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules,
    guidanceSettings: { guidanceOath: 'jade', localLensBanners: 'full' },
  });
  const sealed = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules,
    guidanceSettings: { guidanceOath: 'sealed', localLensBanners: 'compact' },
  });

  assert.equal(sealed.visibleRelationByModuleKey.outskirts?.relation, 'supporting-source');
  assert.equal(elder.visibleRelationByModuleKey.outskirts?.relation, 'supporting-source');
  assert.equal(elder.visibleRelationByModuleKey.ruins ?? null, null);
  assert.equal(jade.visibleRelationByModuleKey.outskirts?.relation, 'supporting-source');
  assert.equal(applyLocalMandateLensVisibility(jade.relationByModuleKey.ruins ?? null, mandate, { guidanceOath: 'jade', localLensBanners: 'full' }), null);
});
