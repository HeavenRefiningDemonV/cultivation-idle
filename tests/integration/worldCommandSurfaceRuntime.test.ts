import assert from 'node:assert/strict';
import test from 'node:test';

import { buildModulePurposeSourceSurface, buildPurposeSourceContext } from '../../src/systems/economy/purposeSourceSurface.js';
import { buildWorldCommandSurface } from '../../src/systems/ui/world/worldCommandSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('world command runtime surface carries tracked bounty and expedition idle alerts and no fake future wording', async () => {
  const content = await getValidatedEconomicContent();
  const currentCity = content.cities.find((city) => city.id === 'city_pinewind_hamlet');
  assert.ok(currentCity);
  if (!currentCity) throw new Error('Expected pinewind city fixture');

  const context = buildPurposeSourceContext(content);
  const visibleModules = currentCity.modules;
  const moduleSurfacesByKey = Object.fromEntries(
    visibleModules
      .map((moduleKey) => buildModulePurposeSourceSurface(content, context, currentCity.id, moduleKey as any))
      .filter((surface): surface is NonNullable<typeof surface> => surface != null)
      .map((surface) => [surface.moduleKey, surface]),
  );

  const surface = buildWorldCommandSurface({
    visibleModules,
    moduleSurfacesByKey,
    runCompassPrimaryAction: null,
    economicTopModuleKey: 'ruins',
    economicReason: 'Need targeted local materials now.',
    trackedBountyModuleKey: 'bounties',
    trackedBountyAlert: {
      id: 'tracked_bounty',
      title: 'Tracked bounty: Pinewind task',
      detail: '2/5 progress',
      ctaLabel: 'View bounty board',
      ctaModuleKey: 'bounties',
    },
    expeditionIdleAlert: {
      id: 'expedition_idle',
      title: 'Expedition slot idle',
      detail: '1 expedition slot is available right now.',
      ctaLabel: 'Open Expeditions',
      ctaModuleKey: 'expeditions',
    },
  });

  assert.equal(surface.recommendation.moduleKey, 'ruins');
  assert.equal(surface.alerts.some((alert) => alert.id === 'tracked_bounty'), true);
  assert.equal(surface.alerts.some((alert) => alert.id === 'expedition_idle'), true);
  surface.alerts.forEach((alert) => {
    assert.equal(visibleModules.includes(alert.ctaModuleKey), true);
    assert.doesNotMatch(alert.ctaModuleKey, /alchemy|talisman/i);
  });
  assert.doesNotMatch(surface.recommendation.reason, /next|future city/i);
});
