import type { ValidatedContent } from '../../content/index.js';
import {
  OUTSKIRTS_CARD_OUTPUT_HINTS,
  RUINS_CARD_OUTPUT_HINTS,
  buildOutskirtsActivityRewardReadModel,
  buildRuinsActivityRewardReadModel,
} from '../economy/activityRewardReadModel.js';
import { inspectWorldFacingModuleTarget } from './liveWorldLeakAudit.js';
import {
  buildWorldModuleCardSurface,
  getWorldModuleCardDefinition,
  type WorldModuleOutputHint,
} from './moduleCardRegistry.js';

export type WorldCombatHandoffModuleKey = 'outskirts' | 'ruins' | 'gateTrial';

export interface WorldCombatHandoffSurface {
  moduleKey: WorldCombatHandoffModuleKey;
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  outputs: WorldModuleOutputHint[];
  boundaryLine: string | null;
  openLabel: string;
}

function asHints(labels: readonly string[]): WorldModuleOutputHint[] {
  return labels.slice(0, 2).map((label) => ({ key: label.toLowerCase().replace(/\s+/g, '_'), label }));
}

export function buildWorldCombatHandoffSurface(args: {
  content: ValidatedContent;
  cityId: string;
  moduleKey: WorldCombatHandoffModuleKey;
}): WorldCombatHandoffSurface {
  const { content, cityId, moduleKey } = args;
  const moduleAudit = inspectWorldFacingModuleTarget(moduleKey);
  if (!moduleAudit.ok) {
    throw new Error(`[WorldCombatHandoff] Invalid world module target '${moduleKey}' (${moduleAudit.reason}).`);
  }

  const definition = getWorldModuleCardDefinition(moduleKey);

  if (moduleKey === 'outskirts') {
    const readModel = buildOutskirtsActivityRewardReadModel(content, cityId);
    return {
      moduleKey,
      moduleName: definition.label,
      roleTag: readModel.roleTag,
      bestUsedWhen: readModel.bestUsedWhen,
      outputs: asHints(OUTSKIRTS_CARD_OUTPUT_HINTS),
      boundaryLine: readModel.boundaryLine,
      openLabel: definition.ctaLabel,
    };
  }

  if (moduleKey === 'ruins') {
    const readModel = buildRuinsActivityRewardReadModel(content, cityId);
    return {
      moduleKey,
      moduleName: definition.label,
      roleTag: readModel.roleTag,
      bestUsedWhen: readModel.bestUsedWhen,
      outputs: asHints(RUINS_CARD_OUTPUT_HINTS),
      boundaryLine: readModel.boundaryLine,
      openLabel: definition.ctaLabel,
    };
  }

  const surface = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'gateTrial' });
  return {
    moduleKey: 'gateTrial',
    moduleName: surface.label,
    roleTag: surface.roleTag,
    bestUsedWhen: surface.bestUsedWhen,
    outputs: surface.outputs.slice(0, 2),
    boundaryLine: surface.boundaryLine,
    openLabel: surface.ctaLabel,
  };
}
