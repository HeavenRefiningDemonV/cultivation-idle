import assert from 'node:assert/strict';
import test from 'node:test';

import type { RunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/types.js';
import { buildModuleRoleBannerSurface } from '../../src/systems/world/moduleRoleBannerSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

function compassFor(moduleKey: string, blocker = 'Forge floor below recommended'): RunCompassSurfaceV2 {
  return {
    version: 2,
    generatedAt: 1,
    mode: 'fixture',
    milestone: {
      id: 'prep',
      label: 'Prepare',
      detail: 'Prepare for the next gate.',
      state: 'preparing',
      currentRealmLabel: 'Qi Condensation',
      nextRealmLabel: 'Foundation Establishment',
      contextLine: 'Gate prep',
    },
    primaryBlocker: {
      kind: 'forge_floor_shortfall',
      label: blocker,
      detail: 'Weapon floor is short.',
      severity: 'warning',
      source: 'economy',
      confidence: 'high',
    },
    primaryRoute: {
      id: 'route',
      label: 'Open Forge',
      actionLabel: 'Open Forge',
      detail: 'Fix weapon floor.',
      destinationLabel: 'Forge',
      target: { kind: 'world_module', cityId: 'city_stonecrag_town', moduleKey: moduleKey as never },
      blocked: false,
      blockedReason: null,
      expectedDeltaLabel: 'Weapon floor row changes.',
      source: 'economy',
      priority: 1,
    },
    secondaryRoutes: [],
    readiness: { score: null, label: 'Underforged', band: null, diagnosisLabel: null, primaryShortfallLabel: blocker, rows: [] },
    currentCity: {
      cityId: 'city_stonecrag_town',
      cityName: 'Stonecrag Town',
      visibleModuleKeys: ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'manualPavilion', 'bounties', 'expeditions'],
      recommendedModuleKey: moduleKey as never,
    },
    currentGate: null,
    safetyNet: null,
    prestigeHint: null,
    recentDeltas: [],
    debugNotes: [],
  };
}

test('legacy internal-only ModuleRoleBannerSurfaceV1 marks recommended Forge primary and keeps quiet modules silent', async () => {
  const content = await getValidatedEconomicContent();
  const runCompass = compassFor('forge');

  const forge = buildModuleRoleBannerSurface({
    content,
    cityId: 'city_stonecrag_town',
    moduleKey: 'forge',
    runCompass,
  });
  const apothecary = buildModuleRoleBannerSurface({
    content,
    cityId: 'city_stonecrag_town',
    moduleKey: 'apothecary',
    runCompass,
  });

  assert.equal(forge.version, 1);
  assert.equal(forge.currentBlockerFit.state, 'primary');
  assert.match(forge.expectedPayoff?.label ?? '', /floor|weapon|gear/i);
  assert.equal(apothecary.currentBlockerFit.state, 'irrelevant_now');
  assert.equal(apothecary.negativeRelevanceCopy, undefined);
  assert.equal(apothecary.recommendedAction, undefined);
  assert.equal(apothecary.routeButtons.length, 0);
  assert.doesNotMatch(apothecary.currentBlockerFit.reason, /points elsewhere|Open .* first/i);
});

test('legacy internal-only ModuleRoleBannerSurfaceV1 gives every P3 module a distinct hard role', async () => {
  const content = await getValidatedEconomicContent();
  const modules = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'manualPavilion', 'techniques', 'bounties', 'expeditions'] as const;
  const roles = modules.map((moduleKey) => buildModuleRoleBannerSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    moduleKey,
    runCompass: compassFor('forge'),
  }).normalRole);

  assert.equal(new Set(roles).size, modules.length);
  roles.forEach((role) => assert.doesNotMatch(role, /may help|continue progressing/i));
});
