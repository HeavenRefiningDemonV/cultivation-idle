import { getWorldModuleCardDefinition } from '../../../systems/world/moduleCardRegistry.js';

export interface CombatModuleTopLaneCopy {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
}

export function getWorldCombatModuleTopLaneCopy(moduleKey: 'outskirts' | 'ruins' | 'gateTrial'): CombatModuleTopLaneCopy {
  const definition = getWorldModuleCardDefinition(moduleKey);
  return {
    moduleName: definition.label,
    roleTag: definition.roleTag,
    bestUsedWhen: definition.bestUsedWhen,
  };
}
