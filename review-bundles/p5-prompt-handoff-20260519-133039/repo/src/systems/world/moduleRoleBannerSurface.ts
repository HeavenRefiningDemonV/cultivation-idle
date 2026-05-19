import type { ValidatedContent } from '../../content/index.js';
import { getWorldModuleCardDefinition } from './moduleCardRegistry.js';
import type { RunCompassSurfaceV2 } from '../ui/runCompass/types.js';
import { labelForP3Module, p3ModuleRoute, type P3ModuleKey, type P3Route } from './p3SurfaceTypes.js';
import { buildLiveRunCompassSurfaceV2 } from '../ui/runCompass/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';

export interface ModuleRoleBannerSurfaceV1 {
  version: 1;
  moduleKey: P3ModuleKey;
  cityId?: string;
  title: string;
  normalRole: string;
  currentBlockerFit: ModuleCurrentFit;
  recommendedAction?: ModuleRecommendedAction;
  expectedPayoff?: ModuleExpectedPayoff;
  sourceTags: string[];
  sinkTags: string[];
  routeButtons: ModuleRoleRouteButton[];
  negativeRelevanceCopy?: string;
  debugNotes: string[];
}

export type ModuleCurrentFit =
  | { state: 'primary'; reason: string }
  | { state: 'secondary'; reason: string }
  | { state: 'long_term'; reason: string }
  | { state: 'irrelevant_now'; reason: string };

export interface ModuleRecommendedAction {
  label: string;
  detail: string;
  target?: unknown;
}

export interface ModuleExpectedPayoff {
  label: string;
  before?: string;
  after?: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

export interface ModuleRoleRouteButton extends P3Route {
  id: string;
}

interface BuildModuleRoleBannerSurfaceArgs {
  content: ValidatedContent;
  cityId: string | null;
  moduleKey: P3ModuleKey;
  runCompass: RunCompassSurfaceV2 | null;
}

interface RoleDefinition {
  title: string;
  normalRole: string;
  sourceTags: string[];
  sinkTags: string[];
  payoff: string;
}

const ROLE_DEFINITIONS: Record<P3ModuleKey, RoleDefinition> = {
  cultivation: {
    title: 'Sacred Center',
    normalRole: 'Qi pressure and breakthrough handoff.',
    sourceTags: ['Qi', 'Heart Law'],
    sinkTags: ['Breakthrough proof', 'Realm entry'],
    payoff: 'Qi or breakthrough readiness changes.',
  },
  outskirts: {
    title: 'Safe Income Lane',
    normalRole: 'Safe income, common materials, and low-risk confidence testing.',
    sourceTags: ['Gold', 'Common materials'],
    sinkTags: ['Apothecary reserve', 'Forge common inputs'],
    payoff: 'Gold and baseline materials improve without gate-risk pressure.',
  },
  ruins: {
    title: 'Targeted Relief',
    normalRole: 'Targeted material relief, drought recovery, and support-run credit.',
    sourceTags: ['Targeted materials', 'Support runs'],
    sinkTags: ['Forge floor', 'Apothecary ingredients', 'Gate prep support'],
    payoff: 'A named material shortage or support row moves closer.',
  },
  gateTrial: {
    title: 'Threshold Chamber',
    normalRole: 'Gate attempt, proof acquisition, Safety Net, and defeat diagnosis.',
    sourceTags: ['Gate proof', 'Failure diagnosis'],
    sinkTags: ['Breakthrough', 'Safety Net'],
    payoff: 'The gate resolves or the next fix becomes explicit.',
  },
  apothecary: {
    title: 'Immediate Survival',
    normalRole: 'Healing stock, support pills, and medicine pouch readiness.',
    sourceTags: ['Shop stock', 'Brew recipes', 'Herbs'],
    sinkTags: ['Pouch-ready medicine', 'Gate prep package'],
    payoff: 'Healing/support rows or pouch coverage improve.',
  },
  forge: {
    title: 'Permanent Floor',
    normalRole: 'Weapon, accessory, temper, and rune floors that every attempt leans on.',
    sourceTags: ['Ore', 'Forge materials'],
    sinkTags: ['Gear floor', 'Recommended gate floor'],
    payoff: 'A gear floor row moves from missing toward minimum.',
  },
  manualPavilion: {
    title: 'Doctrine Acquisition',
    normalRole: 'Manual offers, duplicate support, and missing technique-category fixes.',
    sourceTags: ['Manual offers', 'Fragments'],
    sinkTags: ['Technique unlocks', 'Rank support'],
    payoff: 'A build gap gains a concrete technique or duplicate route.',
  },
  techniques: {
    title: 'Doctrine Workbench',
    normalRole: 'Loadout slots, mastery, rank, runes, and AI posture expression.',
    sourceTags: ['Owned techniques', 'Manuals', 'Runes'],
    sinkTags: ['Gate-fit loadout', 'AI posture'],
    payoff: 'A slot, coverage, mastery, rank, rune, or AI row improves.',
  },
  bounties: {
    title: 'Directed Support',
    normalRole: 'Directed rotation, Merit reserve, claimable support, and city recognition notices.',
    sourceTags: ['Merit', 'Spirit Stones', 'Tracked tasks'],
    sinkTags: ['Safety Net reserve', 'Support spending'],
    payoff: 'Merit reserve or a tracked support objective advances.',
  },
  expeditions: {
    title: 'Background Smoothing',
    normalRole: 'Idle-time shortage smoothing for herbs, ore, fragments, and routine support.',
    sourceTags: ['Herbs', 'Ore', 'Fragments'],
    sinkTags: ['Apothecary package', 'Forge inputs', 'Manual support'],
    payoff: 'An idle slot targets a shortage while foreground play continues.',
  },
  prestige: {
    title: 'Outer Loop',
    normalRole: 'Reincarnation route at authored cap. P3 references it without previewing P4 reset math.',
    sourceTags: ['Life memory'],
    sinkTags: ['Next life'],
    payoff: 'The cap route stays honest instead of implying hidden future city content.',
  },
};

function targetModule(target: RunCompassSurfaceV2['primaryRoute']['target']): P3ModuleKey | null {
  if (target?.kind === 'world_module') return target.moduleKey;
  if (target?.kind === 'tab' && (target.tab === 'cultivation' || target.tab === 'techniques' || target.tab === 'prestige')) return target.tab;
  return null;
}

function routeMatches(route: RunCompassSurfaceV2['primaryRoute'], moduleKey: P3ModuleKey): boolean {
  return targetModule(route.target) === moduleKey;
}

function phaseModule(cityId: string | null): P3ModuleKey | null {
  switch (cityId) {
    case 'city_stonecrag_town':
      return 'forge';
    case 'city_spirit_cavern_city':
      return 'manualPavilion';
    case 'city_lotusford':
      return 'apothecary';
    case 'city_ironpeak_bastion':
      return 'ruins';
    case 'city_pinewind_hamlet':
      return 'outskirts';
    default:
      return null;
  }
}

function currentFit(args: BuildModuleRoleBannerSurfaceArgs): ModuleCurrentFit {
  const { runCompass, moduleKey, cityId } = args;
  if (runCompass && routeMatches(runCompass.primaryRoute, moduleKey)) {
    return { state: 'primary', reason: runCompass.primaryRoute.detail || runCompass.primaryBlocker.detail };
  }
  const secondary = runCompass?.secondaryRoutes.find((route) => routeMatches(route, moduleKey)) ?? null;
  if (secondary) {
    return { state: 'secondary', reason: secondary.detail };
  }
  if (phaseModule(cityId) === moduleKey) {
    return { state: 'long_term', reason: `${labelForP3Module(moduleKey)} is this city phase's durable lesson, even when another blocker is first.` };
  }
  const blocker = runCompass?.primaryBlocker.label ?? 'the current blocker';
  return { state: 'irrelevant_now', reason: `${labelForP3Module(moduleKey)} remains useful, but ${blocker} points elsewhere first.` };
}

function actualBlockerRoute(runCompass: RunCompassSurfaceV2 | null, cityId: string | null): P3Route | null {
  const moduleKey = targetModule(runCompass?.primaryRoute.target ?? null);
  if (!moduleKey) return null;
  return p3ModuleRoute(moduleKey, runCompass?.primaryRoute.detail ?? 'Current Run Compass route.', cityId);
}

export function buildModuleRoleBannerSurface(args: BuildModuleRoleBannerSurfaceArgs): ModuleRoleBannerSurfaceV1 {
  const definition = ROLE_DEFINITIONS[args.moduleKey];
  const fit = currentFit(args);
  const blockerRoute = actualBlockerRoute(args.runCompass, args.cityId);
  const ownRoute = p3ModuleRoute(args.moduleKey, fit.reason, args.cityId);
  const expectedLabel = fit.state === 'primary'
    ? args.runCompass?.primaryRoute.expectedDeltaLabel ?? definition.payoff
    : definition.payoff;
  const negative = fit.state === 'irrelevant_now' && blockerRoute?.moduleKey && blockerRoute.moduleKey !== args.moduleKey
    ? `${definition.title} matters long-term, but your current blocker is ${labelForP3Module(blockerRoute.moduleKey)}. Open ${labelForP3Module(blockerRoute.moduleKey)} first.`
    : undefined;

  return {
    version: 1,
    moduleKey: args.moduleKey,
    cityId: args.cityId ?? undefined,
    title: definition.title,
    normalRole: definition.normalRole,
    currentBlockerFit: fit,
    recommendedAction: {
      label: fit.state === 'primary' ? ownRoute.actionLabel : blockerRoute?.actionLabel ?? ownRoute.actionLabel,
      detail: fit.state === 'primary' ? fit.reason : negative ?? fit.reason,
      target: fit.state === 'primary' ? ownRoute.target : blockerRoute?.target ?? ownRoute.target,
    },
    expectedPayoff: {
      label: expectedLabel,
      confidence: fit.state === 'primary' ? 'high' : fit.state === 'secondary' ? 'medium' : 'unknown',
    },
    sourceTags: [...definition.sourceTags],
    sinkTags: [...definition.sinkTags],
    routeButtons: [
      { id: 'module-role-primary', ...(fit.state === 'primary' ? ownRoute : blockerRoute ?? ownRoute) },
    ],
    negativeRelevanceCopy: negative,
    debugNotes: [
      args.runCompass ? `runCompass.primary=${targetModule(args.runCompass.primaryRoute.target) ?? 'none'}` : 'runCompass unavailable',
    ],
  };
}

export function buildLiveModuleRoleBannerSurface(moduleKey: P3ModuleKey, cityId?: string | null): ModuleRoleBannerSurfaceV1 {
  const content = useContentStore.getState().raw;
  if (!content) throw new Error('[ModuleRoleBannerSurface] Content must be loaded.');
  const resolvedCityId = cityId ?? useCityStore.getState().currentCityId;
  let runCompass: RunCompassSurfaceV2 | null = null;
  try {
    runCompass = buildLiveRunCompassSurfaceV2();
  } catch {
    runCompass = null;
  }
  if (moduleKey !== 'techniques' && moduleKey !== 'cultivation' && moduleKey !== 'prestige') {
    void getWorldModuleCardDefinition(moduleKey);
  }
  return buildModuleRoleBannerSurface({ content, cityId: resolvedCityId, moduleKey, runCompass });
}
