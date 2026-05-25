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
      'primary-evidence': 'Gate proof',
      'supporting-source': 'Gate record',
      blocked: 'Gate sealed',
      completed: 'Proof sealed',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'This threshold holds the proof behind the current omen. Review readiness here when the gate is involved.',
      'supporting-source': 'Gate records preserve threshold evidence without replacing the current local work.',
      blocked: 'The gate is relevant, but one proof condition still blocks it.',
      completed: 'The gate proof is already held. Breakthrough belongs in Cultivation.',
      quiet: 'No visible local Omen relation.',
    },
  },
  outskirts: {
    label: {
      'primary-evidence': 'Field evidence',
      'supporting-source': 'Field support',
      blocked: 'Field closed',
      completed: 'Field settled',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'The current omen is tied to broad field support such as gold, common materials, or safe combat reps.',
      'supporting-source': 'Outskirts can support reserves with gold, common materials, and safe combat reps without replacing the main proof owner.',
      blocked: 'This field support is relevant but not open from the current state.',
      completed: 'This field support is settled for the current omen.',
      quiet: 'No visible local Omen relation.',
    },
  },
  ruins: {
    label: {
      'primary-evidence': 'Ruin evidence',
      'supporting-source': 'Relief source',
      blocked: 'Ruin sealed',
      completed: 'Relief settled',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'The current omen is tied to deterministic relief or scarce material proof.',
      'supporting-source': 'Ruins can patch a known drought after the source thread has been inspected.',
      blocked: 'This relief source is relevant but the ruin is not open from the current state.',
      completed: 'The needed ruin support is settled for now.',
      quiet: 'No visible local Omen relation.',
    },
  },
  forge: {
    label: {
      'primary-evidence': 'Forge evidence',
      'supporting-source': 'Forge support',
      blocked: 'Forge sealed',
      completed: 'Floor sealed',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'The weapon floor is part of the current omen evidence.',
      'supporting-source': 'Forge work can strengthen the permanent floor when gear pressure is inspected.',
      blocked: 'Forge support is relevant but this hall is not open from the current state.',
      completed: 'The relevant forge floor proof is settled for now.',
      quiet: 'No visible local Omen relation.',
    },
  },
  apothecary: {
    label: {
      'primary-evidence': 'Reserve evidence',
      'supporting-source': 'Reserve support',
      blocked: 'Reserve sealed',
      completed: 'Reserve sealed',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'Medicine reserve is part of the current omen evidence.',
      'supporting-source': 'Apothecary work can support survival reserve after reserve pressure is inspected.',
      blocked: 'The reserve source is relevant but this hall is not open from the current state.',
      completed: 'The relevant survival reserve proof is settled for now.',
      quiet: 'No visible local Omen relation.',
    },
  },
  manualPavilion: {
    label: {
      'primary-evidence': 'Doctrine evidence',
      'supporting-source': 'Doctrine source',
      blocked: 'Doctrine sealed',
      completed: 'Doctrine settled',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'Manual study is part of the current doctrine evidence.',
      'supporting-source': 'Manual study can support build expression without solving the whole path for the player.',
      blocked: 'This doctrine source is relevant but not open from the current state.',
      completed: 'The relevant doctrine source is settled for now.',
      quiet: 'No visible local Omen relation.',
    },
  },
  techniques: {
    label: {
      'primary-evidence': 'Expression evidence',
      'supporting-source': 'Expression support',
      blocked: 'Technique sealed',
      completed: 'Expression settled',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'Combat doctrine expression is part of the current omen evidence.',
      'supporting-source': 'Technique work can support doctrine expression after the gap is inspected.',
      blocked: 'This expression source is relevant but blocked from the current state.',
      completed: 'The relevant technique expression proof is settled for now.',
      quiet: 'No visible local Omen relation.',
    },
  },
  bounties: {
    label: {
      'primary-evidence': 'Merit evidence',
      'supporting-source': 'Merit support',
      blocked: 'Board sealed',
      completed: 'Bounty ready',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'Merit reserve is part of the current omen evidence.',
      'supporting-source': 'Bounties can support reserve or mercy proof when Merit pressure is inspected.',
      blocked: 'The bounty source is relevant but unavailable from the current state.',
      completed: 'A relevant board proof or claim is ready.',
      quiet: 'No visible local Omen relation.',
    },
  },
  expeditions: {
    label: {
      'primary-evidence': 'Background evidence',
      'supporting-source': 'Background support',
      blocked: 'Route sealed',
      completed: 'Route ready',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': 'Passive support is part of the current omen evidence.',
      'supporting-source': 'Expeditions can support the current shortage passively without replacing the main proof owner.',
      blocked: 'This background source is relevant but unavailable from the current state.',
      completed: 'A relevant expedition support result is ready.',
      quiet: 'No visible local Omen relation.',
    },
  },
};

function fallbackCopy(moduleKey: LiveWorldModuleKey): ModuleCopy {
  return {
    label: {
      'primary-evidence': 'Omen evidence',
      'supporting-source': 'Supporting source',
      blocked: 'Source sealed',
      completed: 'Role settled',
      quiet: 'Quiet',
    },
    detail: {
      'primary-evidence': `${moduleKey} carries current omen evidence.`,
      'supporting-source': `${moduleKey} can support the current omen without replacing the main proof owner.`,
      blocked: 'This source is unavailable from the current city or activity state.',
      completed: `${moduleKey} is settled for the current omen.`,
      quiet: 'No visible local Omen relation.',
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

function relationFromCandidate(
  candidate: LocalMandateRouteCandidate,
  args: Pick<BuildLocalMandateLensSurfaceArgs, 'isModuleAvailable' | 'isModuleCompleted' | 'isClaimReady'>,
): DaoLocalLensSurface['relation'] {
  if (candidate.blocked || args.isModuleAvailable === false) return 'blocked';
  if (args.isModuleCompleted || args.isClaimReady) return 'completed';
  if (candidate.origin === 'primary' || candidate.origin === 'hard_gate' || candidate.origin === 'safety_net') {
    return 'primary-evidence';
  }
  return 'supporting-source';
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
  if (!candidate) return null;

  const relation = relationFromCandidate(candidate, args);
  const blockedReason = args.isModuleAvailable === false
    ? 'This building is not open in this city.'
    : candidate?.route.blockedReason ?? null;
  const copy = localCopy(args.moduleKey, relation);
  const detail = relation === 'blocked' && blockedReason
    ? `${copy.detail} ${blockedReason}`
    : copy.detail;
  const route = relation === 'primary-evidence' || relation === 'blocked'
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
    blockedModuleKeys[0] ?? null,
    primaryModuleKey,
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
