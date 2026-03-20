import {
  DEFERRED_WORLD_MODULES,
  isDeferredWorldModule,
  isLiveWorldModule,
} from './liveWorldSchema.js';

export const LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS = {
  Embermist: 'Spirit Cavern',
  Silverkeep: 'Lotusford',
  Starsea: 'Ironpeak',
} as const;

const LEGACY_CITY_NAMES = Object.keys(
  LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS,
) as Array<keyof typeof LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS>;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findLegacySemesterCityNames(text: string | null | undefined): string[] {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  return LEGACY_CITY_NAMES.filter((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text));
}

export function inspectWorldFacingText(text: string | null | undefined): {
  ok: boolean;
  legacyCityNames: string[];
  reasons: string[];
} {
  const legacyCityNames = findLegacySemesterCityNames(text);
  return {
    ok: legacyCityNames.length === 0,
    legacyCityNames,
    reasons: legacyCityNames.map((name) => `legacy city name leaked: ${name}`),
  };
}

export function isAllowedLiveWorldSurfaceModule(moduleKey: string | null | undefined): boolean {
  if (typeof moduleKey !== 'string' || moduleKey.length === 0) return false;
  return isLiveWorldModule(moduleKey);
}

export function inspectWorldFacingModuleTarget(moduleKey: string | null | undefined): {
  ok: boolean;
  reason: string;
  moduleKey: string | null;
} {
  if (typeof moduleKey !== 'string' || moduleKey.trim().length === 0) {
    return { ok: false, reason: 'missing module target', moduleKey: moduleKey ?? null };
  }
  if (isDeferredWorldModule(moduleKey)) {
    return { ok: false, reason: 'deferred module target', moduleKey };
  }
  if (!isLiveWorldModule(moduleKey)) {
    return { ok: false, reason: 'unknown/non-live module target', moduleKey };
  }
  return { ok: true, reason: 'ok', moduleKey };
}

export function inspectHiddenWorldModuleSet(hiddenModules: Iterable<string>): {
  isCanonical: boolean;
  missing: string[];
  extra: string[];
  reasons: string[];
} {
  const actual = new Set<string>();
  for (const moduleKey of hiddenModules) {
    if (typeof moduleKey === 'string' && moduleKey.length > 0) {
      actual.add(moduleKey);
    }
  }

  const canonical = new Set<string>(DEFERRED_WORLD_MODULES);
  const missing = DEFERRED_WORLD_MODULES.filter((moduleKey) => !actual.has(moduleKey));
  const extra = [...actual].filter((moduleKey) => !canonical.has(moduleKey)).sort();
  const reasons = [
    ...missing.map((moduleKey) => `missing hidden deferred module: ${moduleKey}`),
    ...extra.map((moduleKey) => `extra hidden non-deferred module: ${moduleKey}`),
  ];

  return {
    isCanonical: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    reasons,
  };
}

export function inspectWorldFacingModuleList(moduleKeys: readonly string[] | null | undefined): {
  ok: boolean;
  deferred: string[];
  unknown: string[];
  reasons: string[];
} {
  const deferred: string[] = [];
  const unknown: string[] = [];

  for (const moduleKey of moduleKeys ?? []) {
    if (typeof moduleKey !== 'string' || moduleKey.length === 0) continue;
    if (isDeferredWorldModule(moduleKey)) {
      if (!deferred.includes(moduleKey)) deferred.push(moduleKey);
      continue;
    }
    if (!isLiveWorldModule(moduleKey) && !unknown.includes(moduleKey)) {
      unknown.push(moduleKey);
    }
  }

  return {
    ok: deferred.length === 0 && unknown.length === 0,
    deferred,
    unknown,
    reasons: [
      ...deferred.map((moduleKey) => `deferred module leaked: ${moduleKey}`),
      ...unknown.map((moduleKey) => `unknown/non-live module leaked: ${moduleKey}`),
    ],
  };
}
