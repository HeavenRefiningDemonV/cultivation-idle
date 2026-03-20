import { getLiveExpeditionRoutePurpose, type ExpeditionRouteModuleKey } from '../systems/world/expeditionRouteContract.js';
import { normalizeCityModulesForLiveSlice } from '../systems/world/liveWorldSchema.js';

export type BountyDestination =
  | { kind: 'module'; moduleKey: string; cityId: string; reason?: string }
  | { kind: 'unavailable'; cityId: string; reason: string };

function hasModule(cityModules: readonly string[], moduleKey: string): boolean {
  return Array.isArray(cityModules) && cityModules.includes(moduleKey);
}

export function resolveBountyDestination(args: {
  cityId: string;
  bountyKind: string;
  cityModules: string[];
}): BountyDestination {
  const { cityId, bountyKind, cityModules } = args;
  const modules = normalizeCityModulesForLiveSlice(cityModules);

  if (bountyKind.startsWith('OUTSKIRTS_')) {
    return hasModule(modules, 'outskirts')
      ? { kind: 'module', moduleKey: 'outskirts', cityId }
      : { kind: 'unavailable', cityId, reason: 'Outskirts unavailable' };
  }

  if (bountyKind.startsWith('RUINS_')) {
    return hasModule(modules, 'ruins')
      ? { kind: 'module', moduleKey: 'ruins', cityId }
      : { kind: 'unavailable', cityId, reason: 'Ruins unavailable' };
  }

  if (bountyKind === 'TRIAL_CLEAR') {
    return hasModule(modules, 'gateTrial')
      ? { kind: 'module', moduleKey: 'gateTrial', cityId }
      : { kind: 'unavailable', cityId, reason: 'Gate Trial unavailable' };
  }

  if (bountyKind === 'EXPEDITION_COMPLETE') {
    return hasModule(modules, 'expeditions')
      ? { kind: 'module', moduleKey: 'expeditions', cityId }
      : { kind: 'unavailable', cityId, reason: 'Expeditions unavailable' };
  }

  if (bountyKind === 'CRAFT_COMPLETE') {
    return hasModule(modules, 'forge')
      ? { kind: 'module', moduleKey: 'forge', cityId }
      : { kind: 'unavailable', cityId, reason: 'Forge unavailable' };
  }

  return { kind: 'unavailable', cityId, reason: 'Unknown bounty kind' };
}

export function bountyKindToLabel(kind: string): string {
  switch (kind) {
    case 'OUTSKIRTS_KILL':
      return 'Outskirts Hunt';
    case 'OUTSKIRTS_BOSS_KILL':
      return 'Outskirts Boss';
    case 'RUINS_ROOM_CLEAR':
      return 'Ruins Room Clear';
    case 'RUINS_RUN_CLEAR':
      return 'Ruins Run';
    case 'TRIAL_CLEAR':
      return 'Gate Trial';
    case 'CRAFT_COMPLETE':
      return 'Crafting Task';
    case 'EXPEDITION_COMPLETE':
      return 'Expedition';
    default:
      return kind;
  }
}

export function bountyKindToProgressRule(kind: string): string {
  switch (kind) {
    case 'OUTSKIRTS_KILL':
      return 'Defeat enemies in the outskirts.';
    case 'OUTSKIRTS_BOSS_KILL':
      return 'Defeat outskirts bosses.';
    case 'RUINS_ROOM_CLEAR':
      return 'Clear rooms in the ruins.';
    case 'RUINS_RUN_CLEAR':
      return 'Complete ruins runs.';
    case 'TRIAL_CLEAR':
      return 'Clear gate trials.';
    case 'CRAFT_COMPLETE':
      return 'Claim completed crafting jobs (1 per job).';
    case 'EXPEDITION_COMPLETE':
      return 'Claim completed expeditions (1 per run).';
    default:
      return 'Progress the associated activity.';
  }
}

export type ExpeditionUseMaterialsDestination = {
  cityId: string;
  moduleKey: ExpeditionRouteModuleKey;
};

export function resolveExpeditionUseMaterialsDestinations(args: {
  cityId: string;
  expeditionTypeId: string;
  cityModules: readonly string[];
  recommendedModuleKey?: ExpeditionRouteModuleKey;
}): ExpeditionUseMaterialsDestination[] {
  const { cityId, expeditionTypeId, cityModules, recommendedModuleKey } = args;
  const modules = normalizeCityModulesForLiveSlice([...cityModules]);
  const canonicalModuleKey = getLiveExpeditionRoutePurpose(expeditionTypeId)?.moduleKey ?? null;
  const orderedCandidates = [recommendedModuleKey, canonicalModuleKey]
    .filter((moduleKey, index, values): moduleKey is ExpeditionUseMaterialsDestination['moduleKey'] =>
      Boolean(moduleKey) && values.indexOf(moduleKey) === index,
    );

  return orderedCandidates
    .filter((moduleKey) => hasModule(modules, moduleKey))
    .map((moduleKey) => ({ cityId, moduleKey }));
}
