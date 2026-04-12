import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDeferredModuleLeakKeysForModuleRoleRegistry,
  getEconomicModuleRoleEntries,
  getEconomicModuleRole,
  getExpeditionPurposeConsistencySummary,
} from '../../src/systems/economy/moduleRoleRegistry.js';
import { COMBAT_TRIO_TRUTH } from '../../src/systems/world/combatTrioTruth.js';

test('module-role registry covers every live economy-facing module with concise role truth', () => {
  const entries = getEconomicModuleRoleEntries();
  assert.deepEqual(
    entries.map((entry) => entry.moduleKey),
    ['outskirts', 'ruins', 'apothecary', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
  );

  assert.deepEqual(getEconomicModuleRole('outskirts'), {
    moduleKey: 'outskirts',
    roleTag: COMBAT_TRIO_TRUTH.outskirts.roleTag,
    bestUsedWhen: COMBAT_TRIO_TRUTH.outskirts.bestUsedWhenClause,
    economicCategory: 'resource_source',
    moduleKind: 'primary_source',
    activityMode: 'foreground',
  });
  assert.equal(getEconomicModuleRole('ruins')?.bestUsedWhen, COMBAT_TRIO_TRUTH.ruins.bestUsedWhenClause);
  assert.equal(getEconomicModuleRole('gateTrial')?.bestUsedWhen, COMBAT_TRIO_TRUTH.gateTrial.bestUsedWhenClause);
  assert.equal(getEconomicModuleRole('gateTrial')?.economicCategory, 'milestone');
  assert.equal(getEconomicModuleRole('apothecary')?.moduleKind, 'conversion_station');
});

test('module-role registry stays consistent with expedition-route and live-module truth', () => {
  const summary = getExpeditionPurposeConsistencySummary();
  assert.equal(summary.purposeCount, 3);
  assert.deepEqual(summary.referencedModuleKeys, ['apothecary', 'forge', 'manualPavilion']);
  assert.deepEqual(summary.missingModuleRoles, []);
  assert.deepEqual(getDeferredModuleLeakKeysForModuleRoleRegistry(), []);
});
