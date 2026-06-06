import type {
  CityDef,
  CityRefs,
  DeferredWorldModuleKey,
  LiveWorldModuleKey,
  RequiredLiveCityRefKey,
} from '../../content/types.js';

export const LIVE_CITY_MODULE_ORDER = [
  'outskirts',
  'ruins',
  'gateTrial',
  'trainingHall',
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
] as const satisfies readonly LiveWorldModuleKey[];

export const LIVE_WORLD_MODULES = [...LIVE_CITY_MODULE_ORDER] as LiveWorldModuleKey[];
export const DEFERRED_WORLD_MODULES = ['alchemy', 'talismanStudio'] as const satisfies readonly DeferredWorldModuleKey[];

export const REQUIRED_CITY_REFS_FOR_LIVE_SLICE = [
  'outskirtsId',
  'gateTrialId',
  'ruinId',
  'pavilionId',
  'apothecaryId',
] as const satisfies readonly RequiredLiveCityRefKey[];

const LIVE_WORLD_MODULE_SET = new Set<string>(LIVE_CITY_MODULE_ORDER);
const DEFERRED_WORLD_MODULE_SET = new Set<string>(DEFERRED_WORLD_MODULES);
const MODULE_REF_REQUIREMENTS: Partial<Record<LiveWorldModuleKey, RequiredLiveCityRefKey>> = {
  outskirts: 'outskirtsId',
  ruins: 'ruinId',
  gateTrial: 'gateTrialId',
  manualPavilion: 'pavilionId',
  apothecary: 'apothecaryId',
};

export function isLiveWorldModule(moduleKey: string): moduleKey is LiveWorldModuleKey {
  return LIVE_WORLD_MODULE_SET.has(moduleKey);
}

export function isDeferredWorldModule(moduleKey: string): moduleKey is DeferredWorldModuleKey {
  return DEFERRED_WORLD_MODULE_SET.has(moduleKey);
}

export function normalizeCityModulesForLiveSlice(modules: readonly string[] | null | undefined): LiveWorldModuleKey[] {
  const seenLiveModules = new Set<LiveWorldModuleKey>();
  for (const moduleKey of modules ?? []) {
    if (isLiveWorldModule(moduleKey)) {
      seenLiveModules.add(moduleKey);
    }
  }
  return LIVE_CITY_MODULE_ORDER.filter((moduleKey) => seenLiveModules.has(moduleKey));
}

export type LiveCitySchemaDriftReport = {
  duplicateModules: string[];
  missingLiveModules: LiveWorldModuleKey[];
  deferredModulesPresent: DeferredWorldModuleKey[];
  unknownModulesPresent: string[];
  actualOrderMatchesCanonical: boolean;
  missingRequiredRefs: RequiredLiveCityRefKey[];
  canonicalModules: LiveWorldModuleKey[];
  canonicalOverall: boolean;
};

type LiveCitySchemaInput = Pick<CityDef, 'modules'> & {
  refs?: Partial<CityRefs> | Record<string, string> | null | undefined;
};

export function inspectLiveCitySchema(city: LiveCitySchemaInput): LiveCitySchemaDriftReport {
  const duplicateModules: string[] = [];
  const seenModules = new Set<string>();
  const actualModules = Array.isArray(city.modules) ? [...city.modules] : [];

  for (const moduleKey of actualModules) {
    if (seenModules.has(moduleKey) && !duplicateModules.includes(moduleKey)) {
      duplicateModules.push(moduleKey);
      continue;
    }
    seenModules.add(moduleKey);
  }

  const canonicalModules = normalizeCityModulesForLiveSlice(actualModules);
  const missingLiveModules = LIVE_CITY_MODULE_ORDER.filter((moduleKey) => !seenModules.has(moduleKey));
  const deferredModulesPresent = actualModules.filter(isDeferredWorldModule).filter((moduleKey, index, values) => values.indexOf(moduleKey) === index);
  const unknownModulesPresent = actualModules.filter(
    (moduleKey) => !isLiveWorldModule(moduleKey) && !isDeferredWorldModule(moduleKey),
  ).filter((moduleKey, index, values) => values.indexOf(moduleKey) === index);
  const actualOrderMatchesCanonical =
    actualModules.length === LIVE_CITY_MODULE_ORDER.length &&
    actualModules.every((moduleKey, index) => moduleKey === LIVE_CITY_MODULE_ORDER[index]);

  const refs = city.refs;
  const missingRequiredRefs = REQUIRED_CITY_REFS_FOR_LIVE_SLICE.filter((refKey) => {
    const value = refs?.[refKey];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  return {
    duplicateModules,
    missingLiveModules,
    deferredModulesPresent,
    unknownModulesPresent,
    actualOrderMatchesCanonical,
    missingRequiredRefs,
    canonicalModules,
    canonicalOverall:
      duplicateModules.length === 0 &&
      missingLiveModules.length === 0 &&
      deferredModulesPresent.length === 0 &&
      unknownModulesPresent.length === 0 &&
      actualOrderMatchesCanonical &&
      missingRequiredRefs.length === 0,
  };
}
