import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorldModuleCardDefinition } from '../../src/systems/world/moduleCardRegistry.js';
import { getWorldCombatModuleTopLaneCopy } from '../../src/ui/world/combat/combatModuleTopLaneModel.js';
import { validateLoadedContent } from '../../src/content/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

void test('gate-trial top-lane copy helper mirrors world module registry source of truth', async () => {
  const content = validateLoadedContent((await loadRawProgressionContent()) as never);
  const cityId = content.cities[0]?.id ?? 'city_1';
  const registryCopy = getWorldModuleCardDefinition('gateTrial');
  const laneCopy = getWorldCombatModuleTopLaneCopy({ moduleKey: 'gateTrial', content, cityId });

  assert.equal(laneCopy.moduleName, registryCopy.label);
  assert.equal(laneCopy.roleTag, registryCopy.roleTag);
  assert.equal(laneCopy.bestUsedWhen, registryCopy.bestUsedWhen);
});
