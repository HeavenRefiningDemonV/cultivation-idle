import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import { CITY_ARRIVAL_QUICK_OPEN_ORDER, getCityExpeditionEmphasis, getCityArrivalLesson, getCityPhaseRoleStatement, } from './cityArrivalContract.js';
import { LIVE_CITY_MODULE_ORDER } from './liveWorldSchema.js';
export const LIVE_CITY_PACKAGE_REF_SPECS = [
    { refKey: 'outskirtsId', label: 'outskirts' },
    { refKey: 'gateTrialId', label: 'trials' },
    { refKey: 'ruinId', label: 'ruins' },
    { refKey: 'pavilionId', label: 'pavilions' },
    { refKey: 'apothecaryId', label: 'apothecary shops' },
];
export const SUPPORT_IDENTITY_LABELS = {
    'starter-loop': 'Starter Loop',
    'forge-and-ore': 'Forge & Ore',
    'fragments-and-build-correction': 'Fragments & Build Correction',
    'reagents-and-survival-prep': 'Reagents & Survival Prep',
    'final-convergence': 'Final Convergence',
};
export const getSupportIdentityLabel = (identity) => SUPPORT_IDENTITY_LABELS[identity];
const createRegistryEntry = (spec) => ({
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
];
export const CITY_PACKAGE_REGISTRY_BY_ID = Object.fromEntries(CITY_PACKAGE_REGISTRY.map((entry) => [entry.cityId, entry]));
const hasOwn = (record, key) => Object.prototype.hasOwnProperty.call(record, key);
const refSourceFor = (refKey, options) => refKey === 'outskirtsId'
    ? options.outskirtsById
    : refKey === 'gateTrialId'
        ? options.trialsById
        : refKey === 'ruinId'
            ? options.ruinsById
            : refKey === 'pavilionId'
                ? options.pavilionsById
                : options.apothecaryById;
const refSpecByKey = Object.fromEntries(LIVE_CITY_PACKAGE_REF_SPECS.map((spec) => [spec.refKey, spec]));
const requiredYieldTagsFromTypes = (types) => {
    const tags = new Set();
    types.forEach((type) => {
        type.yieldTags.forEach((tag) => {
            if (typeof tag === 'string' && tag.trim().length > 0) {
                tags.add(tag);
            }
        });
    });
    return [...tags];
};
const formatRefResolutionIssue = (cityId, refKey, label, detail) => `City ${cityId} refs.${refKey} ${detail} (${label})`;
export function formatLiveCityPackageCoverageIssue(issue) {
    return `City ${issue.cityId} refs.${issue.refKey} missing in ${issue.targetCollectionLabel}`;
}
export function formatCityPackageCoverageReport(report) {
    return [
        ...report.missingModules.map((moduleKey) => `City ${report.cityId} missing required live module ${moduleKey}`),
        ...report.missingRefs.map((refKey) => `City ${report.cityId} is missing required ref ${refKey}`),
        ...report.refResolutionIssues,
        ...report.missingSupportCoverage.map((detail) => `City ${report.cityId} ${detail}`),
        ...report.quickOpenCoverageIssues.map((detail) => `City ${report.cityId} ${detail}`),
    ];
}
export function inspectCityPackageCoverage(options) {
    const registryEntry = options.registryEntry ?? CITY_PACKAGE_REGISTRY_BY_ID[options.city.id] ?? null;
    const refs = options.city.refs ?? {};
    const moduleSet = new Set(options.city.modules ?? []);
    const missingModules = (registryEntry?.mustExposeModules ?? LIVE_CITY_MODULE_ORDER).filter((moduleKey) => !moduleSet.has(moduleKey));
    const missingRefs = LIVE_CITY_PACKAGE_REF_SPECS.filter(({ refKey }) => {
        const value = refs?.[refKey];
        return typeof value !== 'string' || value.trim().length === 0;
    }).map(({ refKey }) => refKey);
    const refResolutionIssues = [];
    LIVE_CITY_PACKAGE_REF_SPECS.forEach(({ refKey, label }) => {
        const targetId = refs?.[refKey];
        if (typeof targetId !== 'string' || targetId.trim().length === 0)
            return;
        const source = refSourceFor(refKey, options);
        if (!hasOwn(source, targetId)) {
            refResolutionIssues.push(formatRefResolutionIssue(options.city.id, refKey, label, `does not resolve target ${targetId}`));
            return;
        }
        const resolved = source[targetId];
        if (resolved.cityId && resolved.cityId !== options.city.id) {
            refResolutionIssues.push(formatRefResolutionIssue(options.city.id, refKey, label, `resolves ${targetId} for ${resolved.cityId}`));
        }
    });
    if (registryEntry) {
        if ((refs.outskirtsId ?? null) !== registryEntry.leadOutskirtsId) {
            refResolutionIssues.push(`City ${options.city.id} lead outskirts drift: expected ${registryEntry.leadOutskirtsId}, got ${refs.outskirtsId ?? 'missing'}`);
        }
        if ((refs.ruinId ?? null) !== registryEntry.leadRuinId) {
            refResolutionIssues.push(`City ${options.city.id} lead ruin drift: expected ${registryEntry.leadRuinId}, got ${refs.ruinId ?? 'missing'}`);
        }
        if ((refs.gateTrialId ?? null) !== registryEntry.leadGateTrialId) {
            refResolutionIssues.push(`City ${options.city.id} lead gate trial drift: expected ${registryEntry.leadGateTrialId}, got ${refs.gateTrialId ?? 'missing'}`);
        }
    }
    const quickOpenCoverageIssues = [];
    (registryEntry?.defaultQuickOpenOrder ?? CITY_ARRIVAL_QUICK_OPEN_ORDER).forEach((moduleKey) => {
        if (!moduleSet.has(moduleKey)) {
            quickOpenCoverageIssues.push(`quick-open package hole: module ${moduleKey} is missing`);
            return;
        }
        const requiredRefKey = moduleKey === 'outskirts'
            ? 'outskirtsId'
            : moduleKey === 'ruins'
                ? 'ruinId'
                : moduleKey === 'gateTrial'
                    ? 'gateTrialId'
                    : null;
        if (!requiredRefKey)
            return;
        const targetId = refs?.[requiredRefKey];
        const source = refSourceFor(requiredRefKey, options);
        if (typeof targetId !== 'string' || targetId.trim().length === 0 || !hasOwn(source, targetId)) {
            quickOpenCoverageIssues.push(`quick-open package hole: module ${moduleKey} is missing resolved ${refSpecByKey[requiredRefKey].label}`);
        }
    });
    const missingSupportCoverage = [];
    const rewardTiersByCityIndex = options.bountyRewardTiersByCityIndex ?? {};
    if (!hasOwn(rewardTiersByCityIndex, String(options.city.index))) {
        missingSupportCoverage.push(`is missing bounty reward tier coverage for city index ${options.city.index}`);
    }
    const bountyTemplates = options.bountyTemplates ?? [];
    const hasLocalCraftSupport = bountyTemplates.some((template) => template.kind === 'CRAFT_COMPLETE' && template.minCityIndex === options.city.index);
    if (!hasLocalCraftSupport) {
        missingSupportCoverage.push(`is missing local craft support coverage (CRAFT_COMPLETE minCityIndex === ${options.city.index})`);
    }
    const hasLocalExpeditionSupport = bountyTemplates.some((template) => template.kind === 'EXPEDITION_COMPLETE' && template.minCityIndex === options.city.index);
    if (!hasLocalExpeditionSupport) {
        missingSupportCoverage.push(`is missing local expedition support coverage (EXPEDITION_COMPLETE minCityIndex === ${options.city.index})`);
    }
    const expeditionTypes = options.expeditionTypes ?? [];
    const requiredYieldTags = requiredYieldTagsFromTypes(expeditionTypes);
    const cityYieldEntry = (options.expeditionCityYields ?? []).find((entry) => entry.cityIndex === options.city.index);
    if (!cityYieldEntry) {
        missingSupportCoverage.push(`is missing expedition yield coverage for city index ${options.city.index}`);
    }
    else {
        const yieldTags = new Set(Object.keys(cityYieldEntry.yieldsByTag ?? {}));
        const missingYieldTags = requiredYieldTags.filter((tag) => !yieldTags.has(tag));
        if (missingYieldTags.length > 0) {
            missingSupportCoverage.push(`is missing expedition yield tag coverage for city index ${options.city.index}: ${missingYieldTags.join(', ')}`);
        }
    }
    return {
        cityId: options.city.id,
        cityIndex: options.city.index,
        registryEntry,
        isComplete: missingModules.length === 0 &&
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
export function inspectSemesterCityPackageCoverage(options) {
    const citiesById = Object.fromEntries(options.cities.map((city) => [city.id, city]));
    return SEMESTER_SLICE_CONTRACT.liveCityIds.map((cityId) => {
        const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID[cityId];
        const city = citiesById[cityId] ?? {
            id: cityId,
            index: registryEntry?.cityIndex ?? -1,
            name: cityId,
            unlockMajorRealm: 'missing',
            modules: [],
            refs: {},
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
export function buildLiveCityPackageRegistry(options) {
    const coverageIssues = [];
    const packages = [];
    const citiesById = Object.fromEntries(options.cities.map((city) => [city.id, city]));
    SEMESTER_SLICE_CONTRACT.liveCityIds.forEach((cityId) => {
        const city = citiesById[cityId];
        if (!city)
            return;
        const refs = city.refs ?? {};
        const missing = LIVE_CITY_PACKAGE_REF_SPECS.flatMap(({ refKey, label }) => {
            const targetId = refs[refKey];
            if (typeof targetId !== 'string' || targetId.trim().length === 0) {
                return [{ cityId: city.id, refKey, targetId: '', targetCollectionLabel: label }];
            }
            const source = refSourceFor(refKey, options);
            if (hasOwn(source, targetId)) {
                return [];
            }
            return [{ cityId: city.id, refKey, targetId, targetCollectionLabel: label }];
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
