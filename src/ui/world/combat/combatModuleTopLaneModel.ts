import type { ValidatedContent } from '../../../content/index.js';
import { buildWorldCombatHandoffSurface, type WorldCombatHandoffModuleKey } from '../../../systems/world/worldCombatHandoff.js';

export interface CombatModuleTopLaneCopy {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
}

export function getWorldCombatModuleTopLaneCopy(args: {
  moduleKey: WorldCombatHandoffModuleKey;
  content: ValidatedContent;
  cityId: string;
}): CombatModuleTopLaneCopy {
  const handoff = buildWorldCombatHandoffSurface(args);
  return {
    moduleName: handoff.moduleName,
    roleTag: handoff.roleTag,
    bestUsedWhen: handoff.bestUsedWhen,
  };
}
