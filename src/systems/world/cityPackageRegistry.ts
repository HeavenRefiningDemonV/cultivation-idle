import type {
  ApothecaryShopDef,
  CityDef,
  OutskirtsDef,
  PavilionDef,
  RequiredLiveCityRefKey,
  RuinDef,
  TrialDef,
} from '../../content/types.js';

export const LIVE_CITY_PACKAGE_REF_SPECS = [
  { refKey: 'outskirtsId', label: 'outskirts' },
  { refKey: 'gateTrialId', label: 'trials' },
  { refKey: 'ruinId', label: 'ruins' },
  { refKey: 'pavilionId', label: 'pavilions' },
  { refKey: 'apothecaryId', label: 'apothecary shops' },
] as const satisfies readonly { refKey: RequiredLiveCityRefKey; label: string }[];

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

const hasOwn = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

export function formatLiveCityPackageCoverageIssue(issue: LiveCityPackageCoverageIssue): string {
  return `City ${issue.cityId} refs.${issue.refKey} missing in ${issue.targetCollectionLabel}`;
}

export function buildLiveCityPackageRegistry<
  TOutskirts = OutskirtsDef,
  TTrial = TrialDef,
  TRuin = RuinDef,
  TPavilion = PavilionDef,
  TApothecary = ApothecaryShopDef,
>(
  options: BuildLiveCityPackageRegistryOptions<TOutskirts, TTrial, TRuin, TPavilion, TApothecary>,
) {
  const coverageIssues: LiveCityPackageCoverageIssue[] = [];
  const packages: LiveCityPackageEntry<TOutskirts, TTrial, TRuin, TPavilion, TApothecary>[] = [];

  options.cities.forEach((city) => {
    const refs = city.refs ?? {};
    const missing = LIVE_CITY_PACKAGE_REF_SPECS.flatMap(({ refKey, label }) => {
      const targetId = refs[refKey];
      if (typeof targetId !== 'string' || targetId.trim().length === 0) {
        return [{ cityId: city.id, refKey, targetId: '', targetCollectionLabel: label } satisfies LiveCityPackageCoverageIssue];
      }

      const source =
        refKey === 'outskirtsId'
          ? options.outskirtsById
          : refKey === 'gateTrialId'
            ? options.trialsById
            : refKey === 'ruinId'
              ? options.ruinsById
              : refKey === 'pavilionId'
                ? options.pavilionsById
                : options.apothecaryById;

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
