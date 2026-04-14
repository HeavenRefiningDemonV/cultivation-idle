import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorldModuleCardDefinition } from '../../src/systems/world/moduleCardRegistry.js';
import { getWorldCombatModuleTopLaneCopy } from '../../src/ui/world/combat/combatModuleTopLaneModel.js';

void test('gate-trial top-lane copy helper mirrors world module registry source of truth', () => {
  const registryCopy = getWorldModuleCardDefinition('gateTrial');
  const laneCopy = getWorldCombatModuleTopLaneCopy('gateTrial');

  assert.equal(laneCopy.moduleName, registryCopy.label);
  assert.equal(laneCopy.roleTag, registryCopy.roleTag);
  assert.equal(laneCopy.bestUsedWhen, registryCopy.bestUsedWhen);
});
