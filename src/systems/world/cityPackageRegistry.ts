import type {
  ApothecaryShopDef,
  BountiesConfig,
  CityDef,
  ExpeditionCityYieldDef,
  ExpeditionTypeDef,
  ExpeditionsContent,
  LiveWorldModuleKey,
  OutskirtsDef,
  PavilionDef,
  RequiredLiveCityRefKey,
  RuinDef,
  TrialDef,
} from '../../content/types.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import {
  CITY_ARRIVAL_QUICK_OPEN_ORDER,
  getCityExpeditionEmphasis,
  getCityArrivalLesson,
  getCityPhaseRoleStatement,
} from './cityArrivalContract.js';
import { LIVE_CITY_MODULE_ORDER } from './liveWorldSchema.js';

export const LIVE_CITY_PACKAGE_REF_SPECS = [
  { refKey: 'outskirtsId', label: 'outskirts' },
  { refKey: 'gateTrialId', label: 'trials' },
  { refKey: 'ruinId', label: 'ruins' },
  { refKey: 'pavilionId', label: 'pavilions' },
  { refKey: 'apothecaryId', label: 'apothecary shops' },
] as const satisfies readonly { refKey: RequiredLiveCityRefKey; label: string }[];

export interface CityPackageRegistryEntry {
  cityId: string;
  cityIndex: number;
  leadOutskirtsId: string;
  leadRuinId: string;
  leadGateTrialId: string;
  leadSupportIdentity:
    | 'starter-loop'
    | 'forge-and-ore'
    | 'fragments-and-build-correction'
    | 'reagents-and-survival-prep'
    | 'final-convergence';
  isModelCity: boolean;
  defaultQuickOpenOrder: readonly LiveWorldModuleKey[];
  mustExposeModules: readonly LiveWorldModuleKey[];
  lesson: string;
  phaseRole: string;
  expeditionEmphasis: string;
}

export const SUPPORT_IDENTITY_LABELS: Record<CityPackageRegistryEntry['leadSupportIdentity'], string> = {
  'starter-loop': 'Starter Loop',
  'forge-and-ore': 'Forge & Ore',
  'fragments-and-build-correction': 'Fragments & Build Correction',
  'reagents-and-survival-prep': 'Reagents & Survival Prep',
  'final-convergence': 'Final Convergence',
};

export const getSupportIdentityLabel = (identity: CityPackageRegistryEntry['leadSupportIdentity']): string =>
  SUPPORT_IDENTITY_LABELS[identity];

const createRegistryEntry = (
  spec: Omit<CityPackageRegistryEntry, 'defaultQuickOpenOrder' | 'mustExposeModules' | 'lesson' | 'phaseRole' | 'expeditionEmphasis'>,
): CityPackageRegistryEntry => ({
  ...spec,
  defaultQuickOpenOrder: [...CITY_ARRIVAL_QUICK_OPEN_ORDER],
  mustExposeModules: [...LIVE_CITY_MODULE_ORDER],
  lesson: getCityArrivalLesson(spec.cityId) ?? '',
  phaseRole: getCityPhaseRoleStatement(spec.cityId) ?? '',
  expeditionEmphasis: getCityExpeditionEmphasis(spec.cityId) ?? '',
});

export const CITY_PACKAGE_REGISTRY = [
  createRegistryEntry({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    leadOutskirtsId: 'outskirts_training_forest',
    leadRuinId: 'ruin_hollow_log_den',
    leadGateTrialId: 'trial_novices_clearing',
    leadSupportIdentity: 'starter-loop',
    isModelCity: true,
  }),
  createRegistryEntry({
    cityId: 'city_stonecrag_town',
    cityIndex: 1,
    leadOutskirtsId: 'outskirts_rockfall_quarry',
    leadRuinId: 'ruin_broken_kiln',
    leadGateTrialId: 'trial_stone_core_sanctum',
    leadSupportIdentity: 'forge-and-ore',
    isModelCity: false,
  }),
  createRegistryEntry({
    cityId: 'city_spirit_cavern_city',
    cityIndex: 2,
    leadOutskirtsId: 'outskirts_spirit_cavern',
    leadRuinId: 'ruin_echo_crystal_tunnels',
    leadGateTrialId: 'trial_patriarchs_seal',
    leadSupportIdentity: 'fragments-and-build-correction',
    isModelCity: false,
  }),
  createRegistryEntry({
    cityId: 'city_lotusford',
    cityIndex: 3,
    leadOutskirtsId: 'outskirts_mist_marsh',
    leadRuinId: 'ruin_sunken_pavilion',
    leadGateTrialId: 'trial_soul_lantern_vault',
    leadSupportIdentity: 'reagents-and-survival-prep',
    isModelCity: false,
  }),
  createRegistryEntry({
    cityId: 'city_ironpeak_bastion',
    cityIndex: 4,
    leadOutskirtsId: 'outskirts_razor_ridge',
    leadRuinId: 'ruin_old_furnace_complex',
    leadGateTrialId: 'trial_severing_court',
    leadSupportIdentity: 'final-convergence',
    isModelCity: false,
  }),
] as const satisfies readonly CityPackageRegistryEntry[];

export const CITY_PACKAGE_REGISTRY_BY_ID = Object.fromEntries(
  CITY_PACKAGE_REGISTRY.map((entry) => [entry.cityId, entry]),
) as Record<string, CityPackageRegistryEntry>;

export interface LiveCityPackageCoverageIssue {
  cityId: string;
  refKey: RequiredLiveCityRefKey;
  targetId: string;
  targetCollectionLabel: (typeof LIVE_CITY_PACKAGE_REF_SPECS)[number]['label'];
}

export interface LiveCityPackageEntry<
  TOutskirts = OutskirtsDef,
  TTrial = TrialDef,
  TRuin = RuinDef,
  TPavilion = PavilionDef,
  TApothecary = ApothecaryShopDef,
> {
  city: CityDef;
  outskirts: TOutskirts;
  gateTrial: TTrial;
  ruin: TRuin;
  pavilion: TPavilion;
  apothecary: TApothecary;
}

export interface BuildLiveCityPackageRegistryOptions<
  TOutskirts = OutskirtsDef,
  TTrial = TrialDef,
  TRuin = RuinDef,
  TPavilion = PavilionDef,
  TApothecary = ApothecaryShopDef,
> {
  cities: CityDef[];
  outskirtsById: Record<string, TOutskirts>;
  trialsById: Record<string, TTrial>;
  ruinsById: Record<string, TRuin>;
  pavilionsById: Record<string, TPavilion>;
  apothecaryById: Record<string, TApothecary>;
}

type MinimalCityLike = Pick<CityDef, 'id' | 'index' | 'modules' | 'refs'>;
type MinimalContentEntry = { id: string; cityId?: string; cityIndex?: number };
type MinimalBountyTemplate = { id?: string; kind?: string; minCityIndex?: number };
type MinimalExpeditionType = { id: string; yieldTags: string[] };
type MinimalCityYield = { cityIndex: number; yieldsByTag: Record<string, unknown> };

export interface InspectCityPackageCoverageOptions {
  city: MinimalCityLike;
  registryEntry?: CityPackageRegistryEntry | null;
  outskirtsById: Record<string, MinimalContentEntry>;
  trialsById: Record<string, MinimalContentEntry>;
  ruinsById: Record<string, MinimalContentEntry>;
  pavilionsById: Record<string, MinimalContentEntry>;
  apothecaryById: Record<string, MinimalContentEntry>;
  bountyRewardTiersByCityIndex?: BountiesConfig['rewardTiersByCityIndex'] | Record<string, unknown>;
  bountyTemplates?: MinimalBountyTemplate[];
  expeditionTypes?: MinimalExpeditionType[];
  expeditionCityYields?: MinimalCityYield[];
}

export interface CityPackageCoverageReport {
  cityId: string;
  cityIndex: number;
  registryEntry: CityPackageRegistryEntry | null;
  isComplete: boolean;
  missingModules: string[];
  missingRefs: RequiredLiveCityRefKey[];
  refResolutionIssues: string[];
  missingSupportCoverage: string[];
  quickOpenCoverageIssues: string[];
}

export interface InspectSemesterCityPackageCoverageOptions {
  cities: CityDef[];
  outskirtsById: Record<string, MinimalContentEntry>;
  trialsById: Record<string, MinimalContentEntry>;
  ruinsById: Record<string, MinimalContentEntry>;
  pavilionsById: Record<string, MinimalContentEntry>;
  apothecaryById: Record<string, MinimalContentEntry>;
  bounties?: {
    rewardTiersByCityIndex?: BountiesConfig['rewardTiersByCityIndex'] | Record<string, unknown>;
    templates?: MinimalBountyTemplate[];
  };
  expeditions?: {
    types?: MinimalExpeditionType[];
    cityYields?: MinimalCityYield[];
  };
}

const hasOwn = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

const refSourceFor = (
  refKey: RequiredLiveCityRefKey,
  options: Pick<
    InspectCityPackageCoverageOptions,
    'outskirtsById' | 'trialsById' | 'ruinsById' | 'pavilionsById' | 'apothecaryById'
  >,
) =>
  refKey === 'outskirtsId'
    ? options.outskirtsById
    : refKey === 'gateTrialId'
      ? options.trialsById
      : refKey === 'ruinId'
        ? options.ruinsById
        : refKey === 'pavilionId'
          ? options.pavilionsById
          : options.apothecaryById;

const refSpecByKey = Object.fromEntries(
  LIVE_CITY_PACKAGE_REF_SPECS.map((spec) => [spec.refKey, spec]),
) as Record<RequiredLiveCityRefKey, (typeof LIVE_CITY_PACKAGE_REF_SPECS)[number]>;

const requiredYieldTagsFromTypes = (types: MinimalExpeditionType[]): string[] => {
  const tags = new Set<string>();
  types.forEach((type) => {
    type.yieldTags.forEach((tag) => {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        tags.add(tag);
      }
    });
  });
  return [...tags];
};

const formatRefResolutionIssue = (cityId: string, refKey: RequiredLiveCityRefKey, label: string, detail: string) =>
  `City ${cityId} refs.${refKey} ${detail} (${label})`;

export function formatLiveCityPackageCoverageIssue(issue: LiveCityPackageCoverageIssue): string {
  return `City ${issue.cityId} refs.${issue.refKey} missing in ${issue.targetCollectionLabel}`;
}

export function formatCityPackageCoverageReport(report: CityPackageCoverageReport): string[] {
  return [
    ...report.missingModules.map((moduleKey) => `City ${report.cityId} missing required live module ${moduleKey}`),
    ...report.missingRefs.map((refKey) => `City ${report.cityId} is missing required ref ${refKey}`),
    ...report.refResolutionIssues,
    ...report.missingSupportCoverage.map((detail) => `City ${report.cityId} ${detail}`),
    ...report.quickOpenCoverageIssues.map((detail) => `City ${report.cityId} ${detail}`),
  ];
}

export function inspectCityPackageCoverage(options: InspectCityPackageCoverageOptions): CityPackageCoverageReport {
  const registryEntry = options.registryEntry ?? CITY_PACKAGE_REGISTRY_BY_ID[options.city.id] ?? null;
  const refs = options.city.refs ?? ({} as CityDef['refs']);
  const moduleSet = new Set(options.city.modules ?? []);

  const missingModules = (registryEntry?.mustExposeModules ?? LIVE_CITY_MODULE_ORDER).filter(
    (moduleKey) => !moduleSet.has(moduleKey),
  );
  const missingRefs = LIVE_CITY_PACKAGE_REF_SPECS.filter(({ refKey }) => {
    const value = refs?.[refKey];
    return typeof value !== 'string' || value.trim().length === 0;
  }).map(({ refKey }) => refKey);

  const refResolutionIssues: string[] = [];
  LIVE_CITY_PACKAGE_REF_SPECS.forEach(({ refKey, label }) => {
    const targetId = refs?.[refKey];
    if (typeof targetId !== 'string' || targetId.trim().length === 0) return;

    const source = refSourceFor(refKey, options);
    if (!hasOwn(source as Record<string, unknown>, targetId)) {
      refResolutionIssues.push(formatRefResolutionIssue(options.city.id, refKey, label, `does not resolve target ${targetId}`));
      return;
    }

    const resolved = source[targetId];
    if (resolved.cityId && resolved.cityId !== options.city.id) {
      refResolutionIssues.push(
        formatRefResolutionIssue(options.city.id, refKey, label, `resolves ${targetId} for ${resolved.cityId}`),
      );
    }
  });

  if (registryEntry) {
    if ((refs.outskirtsId ?? null) !== registryEntry.leadOutskirtsId) {
      refResolutionIssues.push(
        `City ${options.city.id} lead outskirts drift: expected ${registryEntry.leadOutskirtsId}, got ${refs.outskirtsId ?? 'missing'}`,
      );
    }
    if ((refs.ruinId ?? null) !== registryEntry.leadRuinId) {
      refResolutionIssues.push(
        `City ${options.city.id} lead ruin drift: expected ${registryEntry.leadRuinId}, got ${refs.ruinId ?? 'missing'}`,
      );
    }
    if ((refs.gateTrialId ?? null) !== registryEntry.leadGateTrialId) {
      refResolutionIssues.push(
        `City ${options.city.id} lead gate trial drift: expected ${registryEntry.leadGateTrialId}, got ${refs.gateTrialId ?? 'missing'}`,
      );
    }
  }

  const quickOpenCoverageIssues: string[] = [];
  (registryEntry?.defaultQuickOpenOrder ?? CITY_ARRIVAL_QUICK_OPEN_ORDER).forEach((moduleKey) => {
    if (!moduleSet.has(moduleKey)) {
      quickOpenCoverageIssues.push(`quick-open package hole: module ${moduleKey} is missing`);
      return;
    }

    const requiredRefKey =
      moduleKey === 'outskirts'
        ? 'outskirtsId'
        : moduleKey === 'ruins'
          ? 'ruinId'
          : moduleKey === 'gateTrial'
            ? 'gateTrialId'
            : null;

    if (!requiredRefKey) return;
    const targetId = refs?.[requiredRefKey];
    const source = refSourceFor(requiredRefKey, options);
    if (typeof targetId !== 'string' || targetId.trim().length === 0 || !hasOwn(source as Record<string, unknown>, targetId)) {
      quickOpenCoverageIssues.push(
        `quick-open package hole: module ${moduleKey} is missing resolved ${refSpecByKey[requiredRefKey].label}`,
      );
    }
  });

  const missingSupportCoverage: string[] = [];
  const rewardTiersByCityIndex = options.bountyRewardTiersByCityIndex ?? {};
  if (!hasOwn(rewardTiersByCityIndex as Record<string, unknown>, String(options.city.index))) {
    missingSupportCoverage.push(`is missing bounty reward tier coverage for city index ${options.city.index}`);
  }

  const bountyTemplates = options.bountyTemplates ?? [];
  const hasLocalCraftSupport = bountyTemplates.some(
    (template) => template.kind === 'CRAFT_COMPLETE' && template.minCityIndex === options.city.index,
  );
  if (!hasLocalCraftSupport) {
    missingSupportCoverage.push(`is missing local craft support coverage (CRAFT_COMPLETE minCityIndex === ${options.city.index})`);
  }

  const hasLocalExpeditionSupport = bountyTemplates.some(
    (template) => template.kind === 'EXPEDITION_COMPLETE' && template.minCityIndex === options.city.index,
  );
  if (!hasLocalExpeditionSupport) {
    missingSupportCoverage.push(`is missing local expedition support coverage (EXPEDITION_COMPLETE minCityIndex === ${options.city.index})`);
  }

  const expeditionTypes = options.expeditionTypes ?? [];
  const requiredYieldTags = requiredYieldTagsFromTypes(expeditionTypes);
  const cityYieldEntry = (options.expeditionCityYields ?? []).find((entry) => entry.cityIndex === options.city.index);
  if (!cityYieldEntry) {
    missingSupportCoverage.push(`is missing expedition yield coverage for city index ${options.city.index}`);
  } else {
    const yieldTags = new Set(Object.keys(cityYieldEntry.yieldsByTag ?? {}));
    const missingYieldTags = requiredYieldTags.filter((tag) => !yieldTags.has(tag));
    if (missingYieldTags.length > 0) {
      missingSupportCoverage.push(
        `is missing expedition yield tag coverage for city index ${options.city.index}: ${missingYieldTags.join(', ')}`,
      );
    }
  }

  return {
    cityId: options.city.id,
    cityIndex: options.city.index,
    registryEntry,
    isComplete:
      missingModules.length === 0 &&
      missingRefs.length === 0 &&
      refResolutionIssues.length === 0 &&
      missingSupportCoverage.length === 0 &&
      quickOpenCoverageIssues.length === 0,
    missingModules,
    missingRefs,
    refResolutionIssues,
    missingSupportCoverage,
    quickOpenCoverageIssues,
  };
}

export function inspectSemesterCityPackageCoverage(
  options: InspectSemesterCityPackageCoverageOptions,
): CityPackageCoverageReport[] {
  const citiesById = Object.fromEntries(options.cities.map((city) => [city.id, city]));

  return SEMESTER_SLICE_CONTRACT.liveCityIds.map((cityId) => {
    const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID[cityId];
    const city = citiesById[cityId] ?? {
      id: cityId,
      index: registryEntry?.cityIndex ?? -1,
      name: cityId,
      unlockMajorRealm: 'missing',
      modules: [],
      refs: {} as CityDef['refs'],
    };

    return inspectCityPackageCoverage({
      city,
      registryEntry,
      outskirtsById: options.outskirtsById,
      trialsById: options.trialsById,
      ruinsById: options.ruinsById,
      pavilionsById: options.pavilionsById,
      apothecaryById: options.apothecaryById,
      bountyRewardTiersByCityIndex: options.bounties?.rewardTiersByCityIndex,
      bountyTemplates: options.bounties?.templates,
      expeditionTypes: options.expeditions?.types,
      expeditionCityYields: options.expeditions?.cityYields,
    });
  });
}

export function buildLiveCityPackageRegistry<
  TOutskirts extends MinimalContentEntry = OutskirtsDef,
  TTrial extends MinimalContentEntry = TrialDef,
  TRuin extends MinimalContentEntry = RuinDef,
  TPavilion extends MinimalContentEntry = PavilionDef,
  TApothecary extends MinimalContentEntry = ApothecaryShopDef,
>(
  options: BuildLiveCityPackageRegistryOptions<TOutskirts, TTrial, TRuin, TPavilion, TApothecary>,
) {
  const coverageIssues: LiveCityPackageCoverageIssue[] = [];
  const packages: LiveCityPackageEntry<TOutskirts, TTrial, TRuin, TPavilion, TApothecary>[] = [];
  const citiesById = Object.fromEntries(options.cities.map((city) => [city.id, city]));

  SEMESTER_SLICE_CONTRACT.liveCityIds.forEach((cityId) => {
    const city = citiesById[cityId];
    if (!city) return;
    const refs = city.refs ?? ({} as CityDef['refs']);
    const missing = LIVE_CITY_PACKAGE_REF_SPECS.flatMap(({ refKey, label }) => {
      const targetId = refs[refKey];
      if (typeof targetId !== 'string' || targetId.trim().length === 0) {
        return [{ cityId: city.id, refKey, targetId: '', targetCollectionLabel: label } satisfies LiveCityPackageCoverageIssue];
      }

      const source = refSourceFor(refKey, options);
      if (hasOwn(source as Record<string, unknown>, targetId)) {
        return [];
      }

      return [{ cityId: city.id, refKey, targetId, targetCollectionLabel: label } satisfies LiveCityPackageCoverageIssue];
    });

    if (missing.length > 0) {
      coverageIssues.push(...missing);
      return;
    }

    packages.push({
      city,
      outskirts: options.outskirtsById[refs.outskirtsId],
      gateTrial: options.trialsById[refs.gateTrialId],
      ruin: options.ruinsById[refs.ruinId],
      pavilion: options.pavilionsById[refs.pavilionId],
      apothecary: options.apothecaryById[refs.apothecaryId],
    });
  });

  return {
    packages,
    coverageIssues,
    packagesByCityId: Object.fromEntries(packages.map((entry) => [entry.city.id, entry])),
  };
}
