import { getLiveExpeditionRoutePurpose, type ExpeditionRouteModuleKey } from '../systems/world/expeditionRouteContract.js';
import { normalizeCityModulesForLiveSlice } from '../systems/world/liveWorldSchema.js';

export type LiveCraftBountyProgressSource =
  | 'forge_claim'
  | 'apothecary_brew_claim'
  | 'talisman_claim'
  | 'shop_buy'
  | 'deferred_craft';

const LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES: Record<LiveCraftBountyProgressSource, { counts: boolean; label: string }> = {
  forge_claim: { counts: true, label: 'Forge claim' },
  apothecary_brew_claim: { counts: true, label: 'Apothecary Brew claim' },
  talisman_claim: { counts: false, label: 'Talisman claim' },
  shop_buy: { counts: false, label: 'Shop buy' },
  deferred_craft: { counts: false, label: 'Deferred craft module claim' },
};

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

  if (bountyKind === 'EXPEDITION_COMPLETE') {
    return hasModule(modules, 'expeditions')
      ? { kind: 'module', moduleKey: 'expeditions', cityId }
      : { kind: 'unavailable', cityId, reason: 'Expeditions unavailable' };
  }

  if (bountyKind === 'CRAFT_COMPLETE') {
    if (hasModule(modules, 'forge')) {
      return { kind: 'module', moduleKey: 'forge', cityId, reason: 'Forge claims count for craft support bounties.' };
    }
    if (hasModule(modules, 'apothecary')) {
      return { kind: 'module', moduleKey: 'apothecary', cityId, reason: 'Apothecary Brew claims count for craft support bounties.' };
    }
    return { kind: 'unavailable', cityId, reason: 'Forge or Apothecary unavailable' };
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
    case 'CRAFT_COMPLETE':
      return 'Craft Support';
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
    case 'CRAFT_COMPLETE':
      return 'Claim completed forge or Apothecary Brew jobs.';
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

export function doesLiveCraftBountySourceCount(source: LiveCraftBountyProgressSource): boolean {
  return LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts;
}

export function getLiveCraftBountyCountedSources(): LiveCraftBountyProgressSource[] {
  return (Object.keys(LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES) as LiveCraftBountyProgressSource[]).filter(
    (source) => LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts,
  );
}

export function getLiveCraftBountyExcludedSources(): LiveCraftBountyProgressSource[] {
  return (Object.keys(LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES) as LiveCraftBountyProgressSource[]).filter(
    (source) => !LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].counts,
  );
}

export function getLiveCraftBountySourceLabel(source: LiveCraftBountyProgressSource): string {
  return LIVE_CRAFT_BOUNTY_PROGRESS_SOURCES[source].label;
}

export function getExpeditionBountyCreditCityId(run: { cityId: string }): string {
  return run.cityId;
}
