import type { LiveWorldModuleKey } from '../../content/index.js';
import {
  applyDaoMandateVisibility,
  type DaoLocalLensSurface,
  type DaoMandateGuidanceSettings,
  type DaoMandateRoute,
  type DaoMandateSurfaceV1,
} from '../ui/daoMandate/index.js';

export interface BuildLocalMandateLensSurfaceArgs {
  mandate: DaoMandateSurfaceV1;
  cityId: string;
  moduleKey: LiveWorldModuleKey;
  visibleModules?: readonly LiveWorldModuleKey[];
  currentCityId?: string | null;
  isModuleAvailable?: boolean;
  isModuleCompleted?: boolean;
  isClaimReady?: boolean;
  hasActiveForegroundHere?: boolean;
}

export interface WorldMandateRoutingLensSurface {
  primaryModuleKey: LiveWorldModuleKey | null;
  secondaryModuleKeys: LiveWorldModuleKey[];
  supportModuleKeys: LiveWorldModuleKey[];
  blockedModuleKeys: LiveWorldModuleKey[];
  strongestModuleKey: LiveWorldModuleKey | null;
  relationByModuleKey: Partial<Record<LiveWorldModuleKey, DaoLocalLensSurface>>;
  visibleRelationByModuleKey: Partial<Record<LiveWorldModuleKey, DaoLocalLensSurface>>;
}

type LocalMandateRouteOrigin =
  | 'primary'
  | 'secondary'
  | 'hard_gate'
  | 'readiness_floor'
  | 'support_reserve'
  | 'source_route'
  | 'readiness'
  | 'source_map'
  | 'current_work'
  | 'background'
  | 'safety_net'
  | 'lesson';

interface LocalMandateRouteCandidate {
  route: DaoMandateRoute;
  moduleKey: LiveWorldModuleKey;
  cityId: string;
  origin: LocalMandateRouteOrigin;
  priority: number;
  blocked: boolean;
  evidenceId: string;
}

const ORIGIN_PRIORITY: Record<LocalMandateRouteOrigin, number> = {
  primary: 0,
  hard_gate: 10,
  safety_net: 20,
  readiness_floor: 30,
  source_route: 40,
  source_map: 45,
  secondary: 50,
  support_reserve: 60,
  readiness: 65,
  current_work: 70,
  background: 80,
  lesson: 100,
};

type ModuleCopy = {
  label: Record<DaoLocalLensSurface['relation'], string>;
  detail: Record<DaoLocalLensSurface['relation'], string>;
};

const MODULE_COPY: Record<string, ModuleCopy> = {
  gateTrial: {
    label: {
      primary: 'Gate proof',
      support: 'Gate authority',
      future: 'Threshold route',
      quiet: 'Quiet gate',
      blocked: 'Gate proof blocked',
    },
    detail: {
      primary: 'The current Mandate points to this gate. Check the proof ledger, then attempt when readiness is viable.',
      support: 'This gate records threshold proof. Return here when your preparation rows are sealed.',
      future: 'This threshold will matter after the current preparation route matures.',
      quiet: 'No gate attempt is needed for the current Mandate.',
      blocked: 'The gate cannot be opened from this state. Resolve the listed proof before attempting.',
    },
  },
  outskirts: {
    label: {
      primary: 'Field route',
      support: 'Field support',
      future: 'Future field route',
      quiet: 'Quiet field',
      blocked: 'Field route blocked',
    },
    detail: {
      primary: 'The Mandate needs broad gold, common materials, or combat reps. The Outskirts are the safest field route.',
      support: 'Outskirts can keep gold, common materials, and safe combat reps moving while the main route matures.',
      future: 'This field route may help the next preparation step, but it is not the current obstruction.',
      quiet: 'Outskirts are available, but the current Mandate points elsewhere.',
      blocked: 'Outskirts are unavailable from this city or current activity.',
    },
  },
  ruins: {
    label: {
      primary: 'Relief route',
      support: 'Ancient support',
      future: 'Future relief route',
      quiet: 'Silent ruin',
      blocked: 'Sealed ruin',
    },
    detail: {
      primary: 'The Mandate needs a steadier relief route. Ruins can target scarce materials or relic support more directly.',
      support: 'Ruins can patch droughts while your main preparation continues.',
      future: 'Ruins may matter once the next scarcity appears.',
      quiet: 'No ruin relief is needed for the current Mandate.',
      blocked: 'This ruin route is not open from the current city or activity state.',
    },
  },
  forge: {
    label: {
      primary: 'Power floor',
      support: 'Power floor',
      future: 'Future power floor',
      quiet: 'Quiet forge',
      blocked: 'Forge route blocked',
    },
    detail: {
      primary: 'Forge work raises the build floor for the current Mandate.',
      support: 'Forge work can raise the build floor for the next gate.',
      future: 'Forge work may matter after the current route matures.',
      quiet: 'Forge is available, but the current Mandate points elsewhere.',
      blocked: 'Forge work is not open from this city or current activity.',
    },
  },
  apothecary: {
    label: {
      primary: 'Reserve route',
      support: 'Reserve route',
      future: 'Future reserve route',
      quiet: 'Quiet apothecary',
      blocked: 'Reserve route blocked',
    },
    detail: {
      primary: 'Apothecary work prepares medicine and survival reserves for the current Mandate.',
      support: 'Apothecary work prepares medicine and survival reserves for the next attempt.',
      future: 'Medicine reserves may matter after the current route matures.',
      quiet: 'Apothecary is available, but the current Mandate points elsewhere.',
      blocked: 'Apothecary reserves are not open from this city or current activity.',
    },
  },
  manualPavilion: {
    label: {
      primary: 'Doctrine source',
      support: 'Doctrine source',
      future: 'Future doctrine source',
      quiet: 'Quiet doctrine',
      blocked: 'Doctrine route blocked',
    },
    detail: {
      primary: 'Manual study shapes the build required by the current Mandate.',
      support: 'Manual study supports the current build path while the main Mandate points elsewhere.',
      future: 'Doctrine study may matter after the current route matures.',
      quiet: 'Manual Pavilion is available, but the current Mandate points elsewhere.',
      blocked: 'Manual Pavilion is not open from this city or current activity.',
    },
  },
  techniques: {
    label: {
      primary: 'Build expression',
      support: 'Build expression',
      future: 'Future build expression',
      quiet: 'Quiet techniques',
      blocked: 'Technique route blocked',
    },
    detail: {
      primary: 'Techniques express the build required by the current Mandate.',
      support: 'Technique refinement can strengthen the current route while another hall carries the main Mandate.',
      future: 'Technique work may matter after the current route matures.',
      quiet: 'Techniques are available, but the current Mandate points elsewhere.',
      blocked: 'Technique routing is not open from this city or current activity.',
    },
  },
  bounties: {
    label: {
      primary: 'Merit route',
      support: 'Merit route',
      future: 'Future merit route',
      quiet: 'Quiet bounty board',
      blocked: 'Merit route blocked',
    },
    detail: {
      primary: 'Bounties can supply the merit support requested by the current Mandate.',
      support: 'Bounties support the economy without replacing the main Mandate route.',
      future: 'Merit work may matter after the current route matures.',
      quiet: 'Bounties are available, but the current Mandate points elsewhere.',
      blocked: 'Bounties are not open from this city or current activity.',
    },
  },
  expeditions: {
    label: {
      primary: 'Background support',
      support: 'Background support',
      future: 'Future background support',
      quiet: 'Quiet expeditions',
      blocked: 'Background route blocked',
    },
    detail: {
      primary: 'Expeditions can support the current Mandate in the background.',
      support: 'Expeditions are passive support and should not replace the main Mandate route.',
      future: 'Background support may matter after the current route matures.',
      quiet: 'Expeditions are available, but the current Mandate points elsewhere.',
      blocked: 'Expeditions are not open from this city or current activity.',
    },
  },
};

function fallbackCopy(moduleKey: LiveWorldModuleKey): ModuleCopy {
  return {
    label: {
      primary: 'Mandate route',
      support: 'Support route',
      future: 'Future route',
      quiet: 'Quiet route',
      blocked: 'Route blocked',
    },
    detail: {
      primary: `The Mandate points to ${moduleKey} for the current obstruction.`,
      support: `${moduleKey} can support the current Mandate without replacing the main route.`,
      future: `${moduleKey} may matter after the current route matures.`,
      quiet: `${moduleKey} is available, but the current Mandate points elsewhere.`,
      blocked: `This route is unavailable from the current city or activity state.`,
    },
  };
}

function localCopy(moduleKey: LiveWorldModuleKey, relation: DaoLocalLensSurface['relation']): { label: string; detail: string } {
  const copy = MODULE_COPY[moduleKey] ?? fallbackCopy(moduleKey);
  return {
    label: copy.label[relation],
    detail: copy.detail[relation],
  };
}

export function normalizeDaoMandateModuleTarget(
  route: DaoMandateRoute | null | undefined,
): { cityId: string; moduleKey: LiveWorldModuleKey } | null {
  const target = route?.target;
  return target?.kind === 'world_module'
    ? { cityId: target.cityId, moduleKey: target.moduleKey }
    : null;
}

function routeCandidate(
  route: DaoMandateRoute | null | undefined,
  origin: LocalMandateRouteOrigin,
  evidenceId: string,
  priorityOffset = 0,
): LocalMandateRouteCandidate | null {
  const target = normalizeDaoMandateModuleTarget(route);
  if (!route || !target) return null;
  return {
    route,
    cityId: target.cityId,
    moduleKey: target.moduleKey,
    origin,
    priority: ORIGIN_PRIORITY[origin] + priorityOffset + Math.max(0, route.priority),
    blocked: route.blocked,
    evidenceId,
  };
}

function pushCandidate(
  candidates: LocalMandateRouteCandidate[],
  route: DaoMandateRoute | null | undefined,
  origin: LocalMandateRouteOrigin,
  evidenceId: string,
  priorityOffset = 0,
): void {
  const candidate = routeCandidate(route, origin, evidenceId, priorityOffset);
  if (candidate) candidates.push(candidate);
}

function collectCandidates(mandate: DaoMandateSurfaceV1): LocalMandateRouteCandidate[] {
  const candidates: LocalMandateRouteCandidate[] = [];
  pushCandidate(candidates, mandate.primaryRoute, 'primary', `primaryRoute:${mandate.primaryRoute.id}`);
  mandate.secondaryRoutes.forEach((route, index) => {
    pushCandidate(candidates, route, 'secondary', `secondaryRoutes:${route.id}`, index);
  });

  mandate.requirementLedger.hardGates.forEach((row, index) => pushCandidate(candidates, row.route, 'hard_gate', `hardGates:${row.id}`, index));
  mandate.requirementLedger.readinessFloors.forEach((row, index) => pushCandidate(candidates, row.route, 'readiness_floor', `readinessFloors:${row.id}`, index));
  mandate.requirementLedger.supportReserves.forEach((row, index) => pushCandidate(candidates, row.route, 'support_reserve', `supportReserves:${row.id}`, index));
  mandate.requirementLedger.sourceRoutes.forEach((row, index) => pushCandidate(candidates, row.route, 'source_route', `sourceRoutes:${row.id}`, index));
  mandate.readiness.rows.forEach((row, index) => pushCandidate(candidates, row.route, 'readiness', `readiness:${row.id}`, index));
  mandate.sourceMap.forEach((entry, index) => {
    pushCandidate(candidates, entry.route, 'source_map', `sourceMap:${entry.id}`, index);
    entry.bestSources.forEach((source, sourceIndex) => pushCandidate(candidates, source.route, 'source_map', `sourceMap:${entry.id}:best:${source.id}`, index + sourceIndex));
    entry.fallbackSources.forEach((source, sourceIndex) => pushCandidate(candidates, source.route, 'source_map', `sourceMap:${entry.id}:fallback:${source.id}`, index + sourceIndex + 20));
  });
  pushCandidate(candidates, mandate.currentWork.foreground.route, 'current_work', 'currentWork:foreground');
  pushCandidate(candidates, mandate.currentWork.activeCombat?.route, 'current_work', `currentWork:activeCombat:${mandate.currentWork.activeCombat?.id ?? 'none'}`, 5);
  pushCandidate(candidates, mandate.currentWork.trackedBounty?.route, 'current_work', `currentWork:trackedBounty:${mandate.currentWork.trackedBounty?.id ?? 'none'}`, 10);
  pushCandidate(candidates, mandate.currentWork.expeditions?.route, 'current_work', `currentWork:expeditions:${mandate.currentWork.expeditions?.id ?? 'none'}`, 15);
  mandate.currentWork.queues.forEach((row, index) => pushCandidate(candidates, row.route, 'current_work', `currentWork:queues:${row.id}`, index + 20));
  mandate.backgroundPlan.routes.forEach((route, index) => pushCandidate(candidates, route, 'background', `backgroundPlan:${route.id}`, index));
  pushCandidate(candidates, mandate.safetyNet?.route, 'safety_net', `safetyNet:${mandate.safetyNet?.state ?? 'none'}`);
  mandate.lessonSlips.forEach((slip, index) => pushCandidate(candidates, slip.route, 'lesson', `lessonSlips:${slip.id}`, index));

  return candidates.sort((left, right) => left.priority - right.priority);
}

function isVisibleInCity(
  candidate: LocalMandateRouteCandidate,
  cityId: string,
  visibleModules: readonly LiveWorldModuleKey[] | undefined,
): boolean {
  if (candidate.cityId !== cityId) return false;
  return !visibleModules || visibleModules.includes(candidate.moduleKey);
}

function relationFromCandidate(candidate: LocalMandateRouteCandidate): DaoLocalLensSurface['relation'] {
  if (candidate.blocked) return 'blocked';
  if (candidate.origin === 'primary') return 'primary';
  if (candidate.origin === 'lesson') return 'future';
  return 'support';
}

function routeWithBlockedReason(route: DaoMandateRoute, blockedReason: string): DaoMandateRoute {
  if (route.blocked && route.blockedReason) return route;
  return {
    ...route,
    blocked: true,
    blockedReason,
  };
}

function evidenceForCandidate(candidate: LocalMandateRouteCandidate | null, mandate: DaoMandateSurfaceV1): string[] {
  const ids = new Set<string>();
  if (candidate) ids.add(candidate.evidenceId);
  for (const evidenceId of mandate.obstruction.evidenceIds) ids.add(`obstruction:${evidenceId}`);
  if (candidate?.route.id) ids.add(`route:${candidate.route.id}`);
  return [...ids];
}

export function buildLocalMandateLensSurface(args: BuildLocalMandateLensSurfaceArgs): DaoLocalLensSurface | null {
  const candidates = collectCandidates(args.mandate)
    .filter((candidate) => isVisibleInCity(candidate, args.cityId, args.visibleModules))
    .filter((candidate) => candidate.moduleKey === args.moduleKey);
  const candidate = candidates[0] ?? null;
  const moduleUnavailable = args.isModuleAvailable === false;
  const relation: DaoLocalLensSurface['relation'] = moduleUnavailable
    ? 'blocked'
    : candidate
      ? relationFromCandidate(candidate)
      : 'quiet';
  const blockedReason = moduleUnavailable
    ? 'This building is not open in this city.'
    : candidate?.route.blockedReason ?? null;
  const copy = localCopy(args.moduleKey, relation);
  const detail = relation === 'blocked' && blockedReason
    ? `${copy.detail} ${blockedReason}`
    : args.isModuleCompleted && relation === 'quiet'
      ? `${copy.detail} This role is already resolved for now.`
      : copy.detail;
  const route = candidate?.route
    ? relation === 'blocked' && blockedReason
      ? routeWithBlockedReason(candidate.route, blockedReason)
      : candidate.route
    : null;

  return {
    screenId: `world:${args.cityId}:${args.moduleKey}`,
    relation,
    label: copy.label,
    detail,
    route,
    evidenceIds: evidenceForCandidate(candidate, args.mandate),
  };
}

function pushUniqueModuleKey(target: LiveWorldModuleKey[], moduleKey: LiveWorldModuleKey): void {
  if (!target.includes(moduleKey)) target.push(moduleKey);
}

export function buildWorldMandateRoutingLensSurface(args: {
  mandate: DaoMandateSurfaceV1;
  cityId: string;
  visibleModules: readonly LiveWorldModuleKey[];
  guidanceSettings?: Partial<DaoMandateGuidanceSettings>;
}): WorldMandateRoutingLensSurface {
  const visibleSet = new Set(args.visibleModules);
  const candidates = collectCandidates(args.mandate)
    .filter((candidate) => candidate.cityId === args.cityId && visibleSet.has(candidate.moduleKey));
  const primaryTarget = normalizeDaoMandateModuleTarget(args.mandate.primaryRoute);
  const primaryModuleKey = primaryTarget
    && primaryTarget.cityId === args.cityId
    && visibleSet.has(primaryTarget.moduleKey)
    ? primaryTarget.moduleKey
    : null;
  const secondaryModuleKeys: LiveWorldModuleKey[] = [];
  const supportModuleKeys: LiveWorldModuleKey[] = [];
  const blockedModuleKeys: LiveWorldModuleKey[] = [];

  for (const candidate of candidates) {
    if (candidate.blocked) {
      pushUniqueModuleKey(blockedModuleKeys, candidate.moduleKey);
      continue;
    }
    if (candidate.origin === 'secondary') {
      pushUniqueModuleKey(secondaryModuleKeys, candidate.moduleKey);
      continue;
    }
    if (candidate.origin !== 'primary') {
      pushUniqueModuleKey(supportModuleKeys, candidate.moduleKey);
    }
  }

  const strongestModuleKey = [
    primaryModuleKey,
    blockedModuleKeys[0] ?? null,
    secondaryModuleKeys[0] ?? null,
    supportModuleKeys[0] ?? null,
  ].find((moduleKey): moduleKey is LiveWorldModuleKey => moduleKey !== null && visibleSet.has(moduleKey)) ?? null;

  const relationByModuleKey: Partial<Record<LiveWorldModuleKey, DaoLocalLensSurface>> = {};
  const visibleRelationByModuleKey: Partial<Record<LiveWorldModuleKey, DaoLocalLensSurface>> = {};
  for (const moduleKey of args.visibleModules) {
    const lens = buildLocalMandateLensSurface({
      mandate: args.mandate,
      cityId: args.cityId,
      moduleKey,
      visibleModules: args.visibleModules,
    });
    if (lens) {
      relationByModuleKey[moduleKey] = lens;
      const visibleLens = args.guidanceSettings
        ? applyLocalMandateLensVisibility(lens, args.mandate, args.guidanceSettings)
        : lens;
      if (visibleLens) visibleRelationByModuleKey[moduleKey] = visibleLens;
    }
  }

  return {
    primaryModuleKey,
    secondaryModuleKeys,
    supportModuleKeys,
    blockedModuleKeys,
    strongestModuleKey,
    relationByModuleKey,
    visibleRelationByModuleKey,
  };
}

export function applyLocalMandateLensVisibility(
  lens: DaoLocalLensSurface | null,
  mandate: DaoMandateSurfaceV1,
  settings: Partial<DaoMandateGuidanceSettings>,
): DaoLocalLensSurface | null {
  if (!lens) return null;
  if (lens.relation === 'quiet') return null;
  return applyDaoMandateVisibility({ ...mandate, localLens: lens }, { settings }).localLens;
}
