import type { CityDef, ValidatedContent } from '../../content/index.js';
import { REALMS } from '../../constants/index.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../ui/runCompass/index.js';
import type { RunCompassSurfaceV2 } from '../ui/runCompass/types.js';
import type { DaoMandateSurfaceV1 } from '../ui/daoMandate/index.js';
import { labelForP3Module, p3ModuleRoute, type P3ModuleKey, type P3Route } from './p3SurfaceTypes.js';

export interface CityPhaseSurfaceV1 {
  version: 1;
  cityId: string;
  cityName: string;
  phaseIndex: number;
  realmId?: string;
  realmName?: string;
  state: 'locked' | 'newly_arrived' | 'active' | 'completed' | 'cap';
  phaseLesson: CityPhaseLesson;
  dominantBottleneck: CityDominantBottleneck;
  firstRecommendedModule: CityPhaseModuleRoute;
  secondaryTour: CityPhaseModuleRoute[];
  newPressure: CityPhasePressure;
  nextGateLine?: string;
  cityMemoryLine?: string;
  warnings: CityPhaseWarning[];
  debugNotes: string[];
}

export interface CityPhaseLesson {
  code:
    | 'foundations'
    | 'permanent_floor'
    | 'doctrine_shape'
    | 'medicine_discipline'
    | 'support_infrastructure'
    | 'content_cap';
  title: string;
  body: string;
  xianxiaLine: string;
}

export interface CityDominantBottleneck {
  code:
    | 'qi'
    | 'gear_floor'
    | 'medicine_stock'
    | 'build_doctrine'
    | 'targeted_materials'
    | 'support_run'
    | 'safety_net'
    | 'prestige';
  label: string;
  explanation: string;
}

export interface CityPhaseModuleRoute extends P3Route {
  moduleKey: P3ModuleKey;
}

export interface CityPhasePressure {
  label: string;
  explanation: string;
  gateId?: string;
  readinessFocus?: string;
}

export interface CityPhaseWarning {
  code: 'city_not_unlocked' | 'content_missing' | 'route_unavailable';
  message: string;
}

export interface BuildCityPhaseSurfaceSnapshot {
  content: ValidatedContent;
  cityId: string | null;
  unlockedCityIds: readonly string[];
  acknowledgedArrivalCityIds: readonly string[];
  pendingCityArrivalId?: string | null;
  currentRealmIndex: number;
  runCompass?: RunCompassSurfaceV2 | null;
  mandate?: DaoMandateSurfaceV1 | null;
}

interface CityPhaseProfile {
  lesson: CityPhaseLesson;
  bottleneck: CityDominantBottleneck;
  firstModule: P3ModuleKey;
  pressureFocus: string;
  tour: P3ModuleKey[];
}

const CITY_PHASE_PROFILES: Record<string, CityPhaseProfile> = {
  city_pinewind_hamlet: {
    lesson: {
      code: 'foundations',
      title: 'Foundations',
      body: 'Pinewind teaches the first loop: cultivate, earn safe resources, shape a first build, and read the gate checklist.',
      xianxiaLine: 'Refine the vessel before chasing the threshold.',
    },
    bottleneck: { code: 'qi', label: 'Qi and basics', explanation: 'The city is still teaching cultivation rhythm, safe income, and first preparation.' },
    firstModule: 'cultivation',
    pressureFocus: 'Qi, first medicines, and a stable starter build.',
    tour: ['outskirts', 'manualPavilion', 'apothecary'],
  },
  city_stonecrag_town: {
    lesson: {
      code: 'permanent_floor',
      title: 'Permanent Floor',
      body: 'Stonecrag teaches permanent refinement: raise weapon and accessory floor before trusting consumables.',
      xianxiaLine: 'Ore becomes a promise the body can keep.',
    },
    bottleneck: { code: 'gear_floor', label: 'Gear floor', explanation: 'The next guardian tests the floor of your gear as much as raw breath.' },
    firstModule: 'forge',
    pressureFocus: 'Weapon floor, accessory floor, and ore routes.',
    tour: ['ruins', 'expeditions', 'apothecary'],
  },
  city_spirit_cavern_city: {
    lesson: {
      code: 'doctrine_shape',
      title: 'Doctrine Shape',
      body: 'Spirit Cavern City teaches that manuals, slots, mastery, and AI posture decide whether owned power is expressed.',
      xianxiaLine: 'A manual is only ink until the inner palace gives it form.',
    },
    bottleneck: { code: 'build_doctrine', label: 'Build doctrine', explanation: 'The current pressure is likely missing technique coverage, rank, mastery, or posture.' },
    firstModule: 'manualPavilion',
    pressureFocus: 'Technique category, path fit, and loadout expression.',
    tour: ['techniques', 'expeditions', 'ruins'],
  },
  city_lotusford: {
    lesson: {
      code: 'medicine_discipline',
      title: 'Medicine Discipline',
      body: 'Lotusford teaches that stock is different from pouch-ready medicine and support pills must be prepared before pressure arrives.',
      xianxiaLine: 'A pellet on the shelf is not a seal in the pouch.',
    },
    bottleneck: { code: 'medicine_stock', label: 'Medicine stock', explanation: 'The city pressures healing stock, support consumables, and pouch triggers.' },
    firstModule: 'apothecary',
    pressureFocus: 'Pouch coverage, support pills, and herb routes.',
    tour: ['expeditions', 'ruins', 'forge'],
  },
  city_ironpeak_bastion: {
    lesson: {
      code: 'support_infrastructure',
      title: 'Support Infrastructure',
      body: 'Ironpeak teaches coordinated support: targeted relief, bounties, expeditions, and doctrine converge before the authored cap.',
      xianxiaLine: 'A city becomes a formation when every route supports the gate.',
    },
    bottleneck: { code: 'support_run', label: 'Support run', explanation: 'The pressure is broad enough that foreground and background support must agree.' },
    firstModule: 'ruins',
    pressureFocus: 'Targeted relief, Merit reserve, and expedition smoothing.',
    tour: ['bounties', 'expeditions', 'forge'],
  },
};

const CONTENT_CAP_PROFILE: CityPhaseProfile = {
  lesson: {
    code: 'content_cap',
    title: 'Authored Slice Complete',
    body: 'The current authored chapter ends here; do not chase a hidden future city.',
    xianxiaLine: 'The road closes for now. Reincarnation is the honest outer route.',
  },
  bottleneck: { code: 'prestige', label: 'Prestige route', explanation: 'The next meaningful outer-loop route is Prestige, not a fake future gate.' },
  firstModule: 'prestige',
  pressureFocus: 'Preserve memory and prepare the next life.',
  tour: ['status', 'cultivation', 'inventory'].filter((key): key is P3ModuleKey => key !== 'status' && key !== 'inventory'),
};

function cityDisplayName(city: CityDef | null | undefined): string {
  return city?.name ?? 'Unknown City';
}

function profileForCity(cityId: string | null, cap: boolean): CityPhaseProfile {
  if (cap) return CONTENT_CAP_PROFILE;
  return (cityId ? CITY_PHASE_PROFILES[cityId] : null) ?? CITY_PHASE_PROFILES.city_pinewind_hamlet;
}

function resolveCurrentCity(snapshot: BuildCityPhaseSurfaceSnapshot): CityDef | null {
  if (snapshot.cityId) return snapshot.content.cities.find((city) => city.id === snapshot.cityId) ?? null;
  return snapshot.content.cities.find((city) => snapshot.unlockedCityIds.includes(city.id)) ?? snapshot.content.cities[0] ?? null;
}

function routeFromModule(moduleKey: P3ModuleKey, cityId: string | null, reason: string): CityPhaseModuleRoute {
  return { ...p3ModuleRoute(moduleKey, reason, cityId), moduleKey };
}

function runCompassWorldModule(runCompass: RunCompassSurfaceV2 | null | undefined): P3ModuleKey | null {
  const target = runCompass?.primaryRoute.target;
  if (target?.kind === 'world_module') return target.moduleKey;
  if (target?.kind === 'tab' && (target.tab === 'cultivation' || target.tab === 'techniques' || target.tab === 'prestige')) return target.tab;
  return null;
}

function mandateWorldModule(mandate: DaoMandateSurfaceV1 | null | undefined): P3ModuleKey | null {
  const target = mandate?.primaryRoute.target;
  if (target?.kind === 'world_module') return target.moduleKey;
  if (target?.kind === 'tab' && (target.tab === 'cultivation' || target.tab === 'techniques' || target.tab === 'prestige')) return target.tab;
  return null;
}

function nextGateLine(content: ValidatedContent, cityId: string | null, cap: boolean): { line?: string; gateId?: string } {
  if (cap) return { line: 'Authored content cap reached. Route toward Prestige rather than hidden progression.' };
  const trial = cityId ? content.trials.find((entry) => entry.cityId === cityId) ?? null : null;
  if (!trial) return { line: 'Next gate unavailable for this city.' };
  const target = trial.gatesToMajorRealm
    ? REALMS.find((realm) => realm.majorRealm === trial.gatesToMajorRealm)?.name ?? trial.gatesToMajorRealm
    : 'next realm';
  return { line: `Next gate pressure: ${trial.name ?? 'Gate Trial'} toward ${target}.`, gateId: trial.id };
}

export function buildCityPhaseSurfaceFromSnapshot(snapshot: BuildCityPhaseSurfaceSnapshot): CityPhaseSurfaceV1 {
  const currentCity = resolveCurrentCity(snapshot);
  const cityId = currentCity?.id ?? snapshot.cityId ?? 'unknown_city';
  const unlocked = snapshot.unlockedCityIds.includes(cityId);
  const mandateState = snapshot.mandate?.milestone.state;
  const capByMandate = mandateState === 'content_cap' || mandateState === 'prestige_recommended';
  const capByCompass = !snapshot.mandate && (snapshot.runCompass?.milestone.state === 'content_cap' || snapshot.runCompass?.milestone.state === 'prestige_recommended');
  const capByRealm = snapshot.currentRealmIndex >= 5 && cityId === (snapshot.content.cities.at(-1)?.id ?? cityId);
  const cap = capByMandate || capByCompass || capByRealm;
  const profile = profileForCity(cityId, cap);
  const gate = nextGateLine(snapshot.content, cityId, cap);
  const currentRouteModule = mandateWorldModule(snapshot.mandate) ?? runCompassWorldModule(snapshot.runCompass);
  const firstModule = cap ? 'prestige' : profile.firstModule;
  const firstReason = currentRouteModule && currentRouteModule === firstModule
    ? snapshot.mandate?.primaryRoute.detail ?? snapshot.runCompass?.primaryRoute.detail ?? profile.bottleneck.explanation
    : profile.bottleneck.explanation;
  const state: CityPhaseSurfaceV1['state'] = !unlocked
    ? 'locked'
    : cap
      ? 'cap'
      : snapshot.pendingCityArrivalId === cityId || !snapshot.acknowledgedArrivalCityIds.includes(cityId)
        ? 'newly_arrived'
        : snapshot.content.cities.findIndex((city) => city.id === cityId) < snapshot.content.cities.findIndex((city) => city.id === snapshot.content.cities.find((city) => snapshot.unlockedCityIds.includes(city.id))?.id)
          ? 'completed'
          : 'active';

  const realm = REALMS[snapshot.currentRealmIndex] ?? null;
  return {
    version: 1,
    cityId,
    cityName: cityDisplayName(currentCity),
    phaseIndex: currentCity?.index ?? 0,
    realmId: realm?.majorRealm,
    realmName: realm?.name,
    state,
    phaseLesson: profile.lesson,
    dominantBottleneck: profile.bottleneck,
    firstRecommendedModule: routeFromModule(firstModule, cityId, firstReason),
    secondaryTour: profile.tour
      .filter((moduleKey) => moduleKey !== firstModule)
      .slice(0, 3)
      .map((moduleKey) => routeFromModule(moduleKey, cityId, `${labelForP3Module(moduleKey)} supports this phase after the first route is handled.`)),
    newPressure: {
      label: profile.bottleneck.label,
      explanation: profile.pressureFocus,
      gateId: gate.gateId,
      readinessFocus: profile.bottleneck.code,
    },
    nextGateLine: gate.line,
    cityMemoryLine: profile.lesson.xianxiaLine,
    warnings: unlocked ? [] : [{ code: 'city_not_unlocked', message: `${cityDisplayName(currentCity)} is not unlocked by current city state.` }],
    debugNotes: currentRouteModule ? [`mandate.primary=${currentRouteModule}`] : [],
  };
}

export function buildLiveCityPhaseSurface(): CityPhaseSurfaceV1 {
  const content = useContentStore.getState().raw;
  if (!content) {
    throw new Error('[CityPhaseSurface] Content must be loaded.');
  }
  const city = useCityStore.getState();
  const ui = useUIStore.getState();
  const game = useGameStore.getState();
  let runCompass: RunCompassSurfaceV2 | null = null;
  try {
    runCompass = buildLiveRunCompassSurfaceV2();
  } catch {
    runCompass = null;
  }
  return buildCityPhaseSurfaceFromSnapshot({
    content,
    cityId: city.currentCityId,
    unlockedCityIds: city.unlockedCityIds,
    acknowledgedArrivalCityIds: city.acknowledgedArrivalCityIds,
    pendingCityArrivalId: ui.pendingCityArrivalId,
    currentRealmIndex: game.realm.index,
    runCompass,
  });
}
