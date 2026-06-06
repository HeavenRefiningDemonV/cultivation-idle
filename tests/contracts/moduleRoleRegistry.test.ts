import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDeferredModuleLeakKeysForModuleRoleRegistry,
  getEconomicModuleRoleEntries,
  getEconomicModuleRole,
  getExpeditionPurposeConsistencySummary,
} from '../../src/systems/economy/moduleRoleRegistry.js';

test('module-role registry covers every live economy-facing module with concise role truth', () => {
  const entries = getEconomicModuleRoleEntries();
  assert.deepEqual(
    entries.map((entry) => entry.moduleKey),
    ['outskirts', 'ruins', 'apothecary', 'trainingHall', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
  );

  assert.deepEqual(getEconomicModuleRole('outskirts'), {
    moduleKey: 'outskirts',
    roleTag: 'Gold & Common Mats',
    bestUsedWhen: 'Best used when you need gold, common materials, or low-risk combat reps.',
    economicCategory: 'resource_source',
    moduleKind: 'primary_source',
    activityMode: 'foreground',
  });
  assert.equal(getEconomicModuleRole('gateTrial')?.economicCategory, 'milestone');
  assert.equal(getEconomicModuleRole('trainingHall')?.economicCategory, 'readiness');
  assert.equal(getEconomicModuleRole('apothecary')?.moduleKind, 'conversion_station');
});

test('module-role registry stays consistent with expedition-route and live-module truth', () => {
  const summary = getExpeditionPurposeConsistencySummary();
  assert.equal(summary.purposeCount, 3);
  assert.deepEqual(summary.referencedModuleKeys, ['apothecary', 'forge', 'manualPavilion']);
  assert.deepEqual(summary.missingModuleRoles, []);
  assert.deepEqual(getDeferredModuleLeakKeysForModuleRoleRegistry(), []);
});
