import type { LiveWorldModuleKey } from '../../../content/index.js';
import type { RunCompassSurfaceV2 } from '../runCompass/types.js';
import type {
  DaoLocalLensSurface,
  DaoMandateConfidence,
  DaoMandateGuidanceProfile,
  DaoMandateObstructionKind,
  DaoMandateRoute,
  DaoMandateRouteSource,
  DaoMandateRouteTarget,
  DaoMandateSurfaceV1,
  DaoMandateTabTarget,
  DaoSourceMapEntry,
  DaoSourceOption,
} from './daoMandateTypes.js';

export type DaoSourceNeedKind =
  | 'item'
  | 'currency'
  | 'medicine_floor'
  | 'forge_floor'
  | 'manual_knowledge'
  | 'technique_loadout'
  | 'technique_mastery'
  | 'technique_rank'
  | 'technique_rune'
  | 'ai_posture'
  | 'merit_reserve'
  | 'expedition_yield'
  | 'bounty_overlap'
  | 'inventory_purpose'
  | 'records_evidence'
  | 'unknown';

export type DaoMandateSourceModuleKey = LiveWorldModuleKey | 'techniques' | 'inventory' | 'records';

export interface BuildDaoMandateSourceMapArgs {
  runCompass: RunCompassSurfaceV2;
  primaryRoute: DaoMandateRoute;
  secondaryRoutes: DaoMandateRoute[];
}

export interface BuildDaoMandateModuleSourceSinkSurfaceArgs {
  mandate: DaoMandateSurfaceV1;
  currentCityId?: string | null;
  currentModuleKey: DaoMandateSourceModuleKey;
  guidanceProfile?: DaoMandateGuidanceProfile;
}

export interface DaoMandateModuleSourceSinkSurface {
  moduleKey: DaoMandateSourceModuleKey;
  relation: DaoLocalLensSurface['relation'];
  headline: string;
  detail: string;
  entries: DaoSourceMapEntry[];
  primaryEntry: DaoSourceMapEntry | null;
  impactLabel: string | null;
  route: DaoMandateRoute | null;
  evidenceIds: string[];
}

type NeedDescriptor = {
  kind: DaoSourceNeedKind;
  problemKind: string;
  owner: DaoMandateSourceModuleKey;
  neededThingLabel: string;
  neededThingId: string | null;
  sinkLabel: string;
  expectedImpactLabel: string;
  bestLabel: string;
  bestDetail: string;
  fallbackModules: DaoMandateSourceModuleKey[];
  priority: number;
  evidenceId: string;
};

const MODULE_DESTINATION_LABELS: Record<DaoMandateSourceModuleKey, string> = {
  outskirts: 'Outskirts',
  ruins: 'Ruins',
  gateTrial: 'Gate Trial',
  trainingHall: 'Training Hall',
  manualPavilion: 'Manual Pavilion',
  apothecary: 'Apothecary',
  forge: 'Forge',
  bounties: 'Bounties',
  expeditions: 'Expeditions',
  techniques: 'Techniques',
  inventory: 'Inventory',
  records: 'Records',
};

const MODULE_ACTION_LABELS: Record<DaoMandateSourceModuleKey, string> = {
  outskirts: 'Open Outskirts',
  ruins: 'Open Ruins',
  gateTrial: 'Open Gate Trial',
  trainingHall: 'Open Training Hall',
  manualPavilion: 'Open Manual Pavilion',
  apothecary: 'Open Apothecary',
  forge: 'Open Forge',
  bounties: 'Open Bounties',
  expeditions: 'Open Expeditions',
  techniques: 'Open Techniques',
  inventory: 'Open Inventory',
  records: 'Open Records',
};

const SOURCE_PRIORITY: Record<DaoSourceNeedKind, number> = {
  item: 10,
  currency: 20,
  medicine_floor: 60,
  forge_floor: 50,
  manual_knowledge: 70,
  technique_loadout: 75,
  technique_mastery: 76,
  technique_rank: 77,
  technique_rune: 78,
  ai_posture: 79,
  merit_reserve: 80,
  bounty_overlap: 82,
  expedition_yield: 90,
  inventory_purpose: 100,
  records_evidence: 110,
  unknown: 999,
};

const SEALED_CRITICAL_KINDS = new Set<string>([
  'required_item_missing',
  'source_route_locked',
  'medicine_floor',
  'forge_floor',
  'manual_knowledge',
  'technique_loadout',
  'merit_reserve',
]);

function sourceFromRoute(route: DaoMandateRoute | null | undefined): DaoMandateRouteSource {
  return route?.source ?? 'economy';
}

function currentCityId(runCompass: RunCompassSurfaceV2, route: DaoMandateRoute): string | null {
  if (runCompass.currentCity?.cityId) return runCompass.currentCity.cityId;
  if (route.target?.kind === 'world_module') return route.target.cityId;
  return null;
}

function currentVisibleModules(runCompass: RunCompassSurfaceV2): readonly LiveWorldModuleKey[] {
  return runCompass.currentCity?.visibleModuleKeys ?? [];
}

function isWorldModuleKey(moduleKey: DaoMandateSourceModuleKey): moduleKey is LiveWorldModuleKey {
  return moduleKey !== 'techniques' && moduleKey !== 'inventory' && moduleKey !== 'records';
}

function moduleTargetFor(
  moduleKey: DaoMandateSourceModuleKey,
  cityId: string | null,
): DaoMandateRouteTarget | null {
  if (moduleKey === 'techniques' || moduleKey === 'inventory' || moduleKey === 'records') {
    return { kind: 'tab', tab: moduleKey as DaoMandateTabTarget };
  }
  if (!cityId) return null;
  return { kind: 'world_module', cityId, moduleKey };
}

function routeTargetsModule(route: DaoMandateRoute | null | undefined, moduleKey: DaoMandateSourceModuleKey): boolean {
  if (!route?.target) return false;
  if (route.target.kind === 'world_module') return route.target.moduleKey === moduleKey;
  return route.target.tab === moduleKey;
}

function targetModuleKey(route: DaoMandateRoute | null | undefined): DaoMandateSourceModuleKey | null {
  if (!route?.target) return null;
  if (route.target.kind === 'world_module') return route.target.moduleKey;
  if (route.target.tab === 'techniques' || route.target.tab === 'inventory' || route.target.tab === 'records') {
    return route.target.tab;
  }
  return null;
}

function routeAvailability(args: {
  moduleKey: DaoMandateSourceModuleKey;
  cityId: string | null;
  visibleModules: readonly LiveWorldModuleKey[];
}): { blocked: boolean; blockedReason: string | null } {
  if (args.moduleKey === 'techniques' || args.moduleKey === 'inventory' || args.moduleKey === 'records') {
    return { blocked: false, blockedReason: null };
  }
  if (!args.cityId) {
    return { blocked: true, blockedReason: 'This source is not open in the current city.' };
  }
  if (!args.visibleModules.includes(args.moduleKey)) {
    return { blocked: true, blockedReason: 'This source is not open in the current city.' };
  }
  return { blocked: false, blockedReason: null };
}

function buildModuleRoute(args: {
  moduleKey: DaoMandateSourceModuleKey;
  cityId: string | null;
  visibleModules: readonly LiveWorldModuleKey[];
  label: string;
  detail: string;
  source: DaoMandateRouteSource;
  priority: number;
  expectedDeltaLabel: string | null;
}): DaoMandateRoute {
  const availability = routeAvailability({
    moduleKey: args.moduleKey,
    cityId: args.cityId,
    visibleModules: args.visibleModules,
  });
  const target = moduleTargetFor(args.moduleKey, args.cityId);
  const blocked = availability.blocked || !target;
  return {
    id: `dao-source-${args.moduleKey}-${args.priority}`,
    label: args.label,
    actionLabel: MODULE_ACTION_LABELS[args.moduleKey],
    detail: args.detail,
    destinationLabel: MODULE_DESTINATION_LABELS[args.moduleKey],
    target,
    blocked,
    blockedReason: blocked ? availability.blockedReason ?? 'The source is known, but the route is blocked from this screen.' : null,
    expectedDeltaLabel: args.expectedDeltaLabel,
    source: args.source,
    priority: args.priority,
    activityMode: args.moduleKey === 'expeditions' ? 'background' : args.moduleKey === 'inventory' || args.moduleKey === 'records' ? 'passive' : 'active',
  };
}

function activityModeForRoute(route: DaoMandateRoute): DaoSourceOption['activityMode'] {
  if (route.activityMode === 'background') return 'background';
  if (route.activityMode === 'passive') return 'passive';
  if (route.target?.kind === 'tab') return 'passive';
  return route.target?.kind === 'world_module' && route.target.moduleKey === 'expeditions'
    ? 'background'
    : 'active';
}

function sourceOptionFromRoute(route: DaoMandateRoute, label?: string, detail?: string): DaoSourceOption {
  return {
    id: `source-${route.id}`,
    label: label ?? route.label,
    detail: detail ?? route.detail,
    route,
    lockedReason: route.blocked ? route.blockedReason ?? 'The source is known, but the route is blocked from this screen.' : null,
    activityMode: activityModeForRoute(route),
    confidence: route.blocked ? 'medium' : 'high',
  };
}

function sourceOptionForModule(args: {
  moduleKey: DaoMandateSourceModuleKey;
  cityId: string | null;
  visibleModules: readonly LiveWorldModuleKey[];
  label: string;
  detail: string;
  source: DaoMandateRouteSource;
  priority: number;
  expectedDeltaLabel: string | null;
}): DaoSourceOption {
  const route = buildModuleRoute(args);
  return sourceOptionFromRoute(route, args.label, args.detail);
}

function gateSinkLabel(runCompass: RunCompassSurfaceV2, fallback: string): string {
  const gateLabel = runCompass.currentGate?.gateLabel;
  if (gateLabel) return `${gateLabel} ${fallback}`;
  return `${runCompass.milestone.label} ${fallback}`;
}

function inferNeedDescriptor(
  runCompass: RunCompassSurfaceV2,
  primaryRoute: DaoMandateRoute,
): NeedDescriptor | null {
  const primaryTarget = targetModuleKey(primaryRoute);
  const kind = runCompass.primaryBlocker.kind as DaoMandateObstructionKind;
  const sourceLine = runCompass.readiness.primaryShortfallLabel ?? runCompass.primaryBlocker.label;
  const expectedDelta = primaryRoute.expectedDeltaLabel;

  if (kind === 'apothecary_prep_shortfall' || primaryTarget === 'apothecary') {
    return {
      kind: 'medicine_floor',
      problemKind: 'medicine_floor',
      owner: 'apothecary',
      neededThingLabel: 'Medicine reserve',
      neededThingId: null,
      sinkLabel: gateSinkLabel(runCompass, 'gate reserve'),
      expectedImpactLabel: expectedDelta ?? 'Raises medicine reserve toward the current gate floor.',
      bestLabel: 'Apothecary stock or brew route',
      bestDetail: sourceLine || 'Prepare medicine reserves in the Apothecary before returning to the gate.',
      fallbackModules: ['outskirts', 'expeditions', 'bounties', 'inventory'],
      priority: SOURCE_PRIORITY.medicine_floor,
      evidenceId: 'sourceMap:medicine_floor',
    };
  }

  if (kind === 'forge_floor_shortfall' || primaryTarget === 'forge') {
    return {
      kind: 'forge_floor',
      problemKind: 'forge_floor',
      owner: 'forge',
      neededThingLabel: 'Power floor',
      neededThingId: null,
      sinkLabel: gateSinkLabel(runCompass, 'gate floor'),
      expectedImpactLabel: expectedDelta ?? 'Improves forge readiness floor.',
      bestLabel: 'Forge temper route',
      bestDetail: sourceLine || 'Raise weapon or accessory floor before the current gate attempt.',
      fallbackModules: ['ruins', 'outskirts', 'expeditions', 'inventory'],
      priority: SOURCE_PRIORITY.forge_floor,
      evidenceId: 'sourceMap:forge_floor',
    };
  }

  if (kind === 'manual_pavilion_gap' || primaryTarget === 'manualPavilion') {
    return {
      kind: 'manual_knowledge',
      problemKind: 'manual_knowledge',
      owner: 'manualPavilion',
      neededThingLabel: 'Doctrine source',
      neededThingId: null,
      sinkLabel: gateSinkLabel(runCompass, 'build knowledge'),
      expectedImpactLabel: expectedDelta ?? 'Can close the current build-expression gap.',
      bestLabel: 'Manual Pavilion offer',
      bestDetail: sourceLine || 'Find the manual that addresses the current build or knowledge gap.',
      fallbackModules: ['records', 'techniques', 'inventory'],
      priority: SOURCE_PRIORITY.manual_knowledge,
      evidenceId: 'sourceMap:manual_knowledge',
    };
  }

  if (kind === 'build_correction_gap' || primaryTarget === 'techniques') {
    return {
      kind: 'technique_loadout',
      problemKind: 'technique_loadout',
      owner: 'techniques',
      neededThingLabel: 'Build expression',
      neededThingId: null,
      sinkLabel: gateSinkLabel(runCompass, 'build expression'),
      expectedImpactLabel: expectedDelta ?? 'Can close the current build-expression gap.',
      bestLabel: 'Technique loadout route',
      bestDetail: sourceLine || 'Equip, refine, rank, socket, or adjust posture for the current Mandate.',
      fallbackModules: ['manualPavilion', 'inventory', 'records'],
      priority: SOURCE_PRIORITY.technique_loadout,
      evidenceId: 'sourceMap:technique_loadout',
    };
  }

  if (kind === 'bounty_merit_shortfall' || primaryTarget === 'bounties') {
    return {
      kind: 'merit_reserve',
      problemKind: 'merit_reserve',
      owner: 'bounties',
      neededThingLabel: 'Merit reserve',
      neededThingId: 'merit',
      sinkLabel: 'Gate safety net reserve',
      expectedImpactLabel: expectedDelta ?? 'Feeds the Merit reserve for the current safety net.',
      bestLabel: 'Bounty merit route',
      bestDetail: sourceLine || 'Take bounty work that overlaps the current shortage or Merit reserve.',
      fallbackModules: ['expeditions', 'outskirts', 'inventory'],
      priority: SOURCE_PRIORITY.merit_reserve,
      evidenceId: 'sourceMap:merit_reserve',
    };
  }

  if (kind === 'expedition_shortage_smoothing' || primaryTarget === 'expeditions') {
    return {
      kind: 'expedition_yield',
      problemKind: 'expedition_yield',
      owner: 'expeditions',
      neededThingLabel: 'Background support',
      neededThingId: null,
      sinkLabel: 'Current shortage support',
      expectedImpactLabel: expectedDelta ?? 'Smooths the current material drought while you cultivate.',
      bestLabel: 'Expedition yield route',
      bestDetail: sourceLine || 'Use idle route yield to support the current bottleneck.',
      fallbackModules: ['bounties', 'inventory', 'outskirts'],
      priority: SOURCE_PRIORITY.expedition_yield,
      evidenceId: 'sourceMap:expedition_yield',
    };
  }

  if (
    primaryRoute.source === 'economy' ||
    primaryRoute.source === 'readiness' ||
    primaryRoute.source === 'build'
  ) {
    return {
      kind: 'unknown',
      problemKind: kind,
      owner: primaryTarget ?? 'inventory',
      neededThingLabel: runCompass.readiness.primaryShortfallLabel ?? runCompass.primaryBlocker.label,
      neededThingId: runCompass.currentGate?.gateProofItemId ?? null,
      sinkLabel: runCompass.currentGate?.gateLabel ?? runCompass.milestone.label,
      expectedImpactLabel: expectedDelta ?? 'Clarifies the next source route for the current Mandate.',
      bestLabel: primaryRoute.label,
      bestDetail: primaryRoute.detail,
      fallbackModules: ['inventory', 'records'],
      priority: SOURCE_PRIORITY.unknown,
      evidenceId: `sourceMap:${kind}`,
    };
  }

  return null;
}

function routeDedupKey(route: DaoMandateRoute): string {
  if (route.target?.kind === 'world_module') return `world:${route.target.cityId}:${route.target.moduleKey}`;
  if (route.target?.kind === 'tab') return `tab:${route.target.tab}`;
  return `route:${route.id}`;
}

function buildFallbackSources(args: {
  descriptor: NeedDescriptor;
  runCompass: RunCompassSurfaceV2;
  primaryRoute: DaoMandateRoute;
  secondaryRoutes: DaoMandateRoute[];
}): DaoSourceOption[] {
  const cityId = currentCityId(args.runCompass, args.primaryRoute);
  const visibleModules = currentVisibleModules(args.runCompass);
  const seen = new Set<string>();
  seen.add(routeDedupKey(args.primaryRoute));

  const fromSecondary = args.secondaryRoutes
    .filter((route) => route.source === 'economy' || route.source === 'readiness' || route.source === 'build')
    .map((route) => sourceOptionFromRoute(route))
    .filter((source) => {
      const route = source.route;
      if (!route) return true;
      const key = routeDedupKey(route);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const synthesized = args.descriptor.fallbackModules.map((moduleKey, index) =>
    sourceOptionForModule({
      moduleKey,
      cityId,
      visibleModules,
      label: `${MODULE_DESTINATION_LABELS[moduleKey]} source`,
      detail: fallbackDetailFor(args.descriptor.kind, moduleKey),
      source: sourceFromRoute(args.primaryRoute),
      priority: args.descriptor.priority + 10 + index,
      expectedDeltaLabel: args.descriptor.expectedImpactLabel,
    }),
  ).filter((source) => {
    const route = source.route;
    if (!route) return true;
    const key = routeDedupKey(route);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...fromSecondary, ...synthesized]
    .sort((left, right) => (left.route?.priority ?? 999) - (right.route?.priority ?? 999))
    .slice(0, 4);
}

function fallbackDetailFor(kind: DaoSourceNeedKind, moduleKey: DaoMandateSourceModuleKey): string {
  if (moduleKey === 'inventory') return 'Check owned stock before choosing a new route.';
  if (moduleKey === 'records') return 'Use discovered records as evidence for the source pattern.';
  if (moduleKey === 'outskirts') return 'Gather broad gold, herbs, or common materials through the field route.';
  if (moduleKey === 'ruins') return 'Target scarce materials through the relief route when it is open.';
  if (moduleKey === 'expeditions') return 'Use background yield to smooth the shortage while cultivation continues.';
  if (moduleKey === 'bounties') return 'Use bounty work when the reward overlaps the current reserve or material route.';
  if (moduleKey === 'manualPavilion') return 'Return to doctrine sources if the expression gap is actually missing knowledge.';
  if (moduleKey === 'techniques') return 'Refine the known doctrine through loadout, mastery, rank, rune, or posture.';
  if (kind === 'medicine_floor') return 'Use this source only if Apothecary stock or brew inputs are thin.';
  return 'Use this as support only when it overlaps the current Mandate.';
}

function buildEntry(args: {
  descriptor: NeedDescriptor;
  runCompass: RunCompassSurfaceV2;
  primaryRoute: DaoMandateRoute;
  secondaryRoutes: DaoMandateRoute[];
}): DaoSourceMapEntry {
  const bestRoute = routeTargetsModule(args.primaryRoute, args.descriptor.owner)
    ? args.primaryRoute
    : buildModuleRoute({
      moduleKey: args.descriptor.owner,
      cityId: currentCityId(args.runCompass, args.primaryRoute),
      visibleModules: currentVisibleModules(args.runCompass),
      label: args.descriptor.bestLabel,
      detail: args.descriptor.bestDetail,
      source: sourceFromRoute(args.primaryRoute),
      priority: args.descriptor.priority,
      expectedDeltaLabel: args.descriptor.expectedImpactLabel,
    });

  const bestSource = sourceOptionFromRoute(bestRoute, args.descriptor.bestLabel, args.descriptor.bestDetail);
  const fallbackSources = buildFallbackSources(args);
  return {
    id: `source-map-${args.descriptor.kind}`,
    neededThingLabel: args.descriptor.neededThingLabel,
    neededThingId: args.descriptor.neededThingId,
    problemKind: args.descriptor.problemKind,
    sinkLabel: args.descriptor.sinkLabel,
    expectedImpactLabel: args.descriptor.expectedImpactLabel,
    bestSources: [bestSource],
    fallbackSources,
    route: bestRoute,
  };
}

function priorityForEntry(entry: DaoSourceMapEntry): number {
  const kind = entry.problemKind;
  if (kind === 'required_item_missing') return SOURCE_PRIORITY.item;
  if (kind === 'source_route_locked') return 15;
  if (kind === 'forge_floor') return SOURCE_PRIORITY.forge_floor;
  if (kind === 'medicine_floor') return SOURCE_PRIORITY.medicine_floor;
  if (kind === 'manual_knowledge') return SOURCE_PRIORITY.manual_knowledge;
  if (kind === 'technique_loadout') return SOURCE_PRIORITY.technique_loadout;
  if (kind === 'merit_reserve') return SOURCE_PRIORITY.merit_reserve;
  if (kind === 'expedition_yield') return SOURCE_PRIORITY.expedition_yield;
  return SOURCE_PRIORITY.unknown;
}

export function buildDaoMandateSourceMap(args: BuildDaoMandateSourceMapArgs): DaoSourceMapEntry[] {
  const descriptor = inferNeedDescriptor(args.runCompass, args.primaryRoute);
  if (!descriptor) return [];
  const entry = buildEntry({ descriptor, ...args });
  return [entry].sort((left, right) => priorityForEntry(left) - priorityForEntry(right) || left.id.localeCompare(right.id));
}

function cloneSourceOption(option: DaoSourceOption): DaoSourceOption {
  return {
    ...option,
    route: option.route ? { ...option.route, target: option.route.target ? { ...option.route.target } : null } : null,
  };
}

function cloneEntry(entry: DaoSourceMapEntry): DaoSourceMapEntry {
  return {
    ...entry,
    route: entry.route ? { ...entry.route, target: entry.route.target ? { ...entry.route.target } : null } : null,
    bestSources: entry.bestSources.map(cloneSourceOption),
    fallbackSources: entry.fallbackSources.map(cloneSourceOption),
  };
}

function isSealedCriticalEntry(entry: DaoSourceMapEntry): boolean {
  if (entry.route?.blocked) return true;
  return SEALED_CRITICAL_KINDS.has(entry.problemKind ?? '');
}

export function applyDaoMandateSourceMapProfileVisibility(
  entries: readonly DaoSourceMapEntry[],
  profile: DaoMandateGuidanceProfile,
): DaoSourceMapEntry[] {
  if (profile === 'sealed') {
    return entries
      .filter(isSealedCriticalEntry)
      .slice(0, 1)
      .map((entry) => ({
        ...cloneEntry(entry),
        fallbackSources: [],
      }));
  }
  if (profile === 'elder') {
    return entries.slice(0, 1).map((entry) => ({
      ...cloneEntry(entry),
      fallbackSources: entry.fallbackSources.slice(0, 1).map(cloneSourceOption),
    }));
  }
  return entries.map(cloneEntry);
}

function relationForModule(
  entry: DaoSourceMapEntry,
  moduleKey: DaoMandateSourceModuleKey,
): DaoLocalLensSurface['relation'] | null {
  if (routeTargetsModule(entry.route, moduleKey)) {
    return entry.route?.blocked ? 'blocked' : 'primary-evidence';
  }
  if (entry.bestSources.some((source) => routeTargetsModule(source.route, moduleKey))) {
    const blocked = entry.bestSources.find((source) => routeTargetsModule(source.route, moduleKey))?.route?.blocked;
    return blocked ? 'blocked' : 'supporting-source';
  }
  if (entry.fallbackSources.some((source) => routeTargetsModule(source.route, moduleKey))) {
    const blocked = entry.fallbackSources.find((source) => routeTargetsModule(source.route, moduleKey))?.route?.blocked;
    return blocked ? 'blocked' : 'supporting-source';
  }
  return null;
}

function strongestRelation(relations: DaoLocalLensSurface['relation'][]): DaoLocalLensSurface['relation'] {
  if (relations.includes('primary-evidence')) return 'primary-evidence';
  if (relations.includes('blocked')) return 'blocked';
  if (relations.includes('completed')) return 'completed';
  if (relations.includes('supporting-source')) return 'supporting-source';
  return 'quiet';
}

function moduleHeadline(moduleKey: DaoMandateSourceModuleKey, relation: DaoLocalLensSurface['relation'], entry: DaoSourceMapEntry | null): string {
  if (moduleKey === 'inventory') return entry ? 'Needed Now' : 'Inventory record';
  if (moduleKey === 'records') return entry ? 'Source memory' : 'Source record';
  if (entry) return entry.neededThingLabel;
  if (relation === 'blocked') return `${MODULE_DESTINATION_LABELS[moduleKey]} source sealed`;
  if (relation === 'completed') return `${MODULE_DESTINATION_LABELS[moduleKey]} source settled`;
  return `${MODULE_DESTINATION_LABELS[moduleKey]} support`;
}

function moduleDetail(moduleKey: DaoMandateSourceModuleKey, relation: DaoLocalLensSurface['relation'], entry: DaoSourceMapEntry | null): string {
  if (moduleKey === 'records') {
    return entry
      ? 'Records preserve source discoveries and pattern evidence. They explain the route without replacing Status as the main guide.'
      : 'Records remain evidence and history for the current Mandate.';
  }
  if (moduleKey === 'inventory') {
    return entry
      ? `Sink: ${entry.sinkLabel}. Source: ${entry.bestSources[0]?.label ?? 'Known source'}.`
      : 'Inventory remains a normal storage surface when no local source entry is visible.';
  }
  if (entry) {
    const impact = entry.expectedImpactLabel ? ` ${entry.expectedImpactLabel}` : '';
    return `${entry.sinkLabel}.${impact}`.trim();
  }
  if (relation === 'blocked') return 'The source is known, but the route is blocked from this screen.';
  return 'No visible local source relation.';
}

function confidenceEvidence(entry: DaoSourceMapEntry | null): string[] {
  if (!entry) return [];
  const evidence = new Set<string>([`sourceMap:${entry.id}`]);
  if (entry.problemKind) evidence.add(`problemKind:${entry.problemKind}`);
  for (const source of entry.bestSources) evidence.add(`bestSource:${source.id}`);
  for (const source of entry.fallbackSources) evidence.add(`fallbackSource:${source.id}`);
  return [...evidence];
}

export function buildDaoMandateModuleSourceSinkSurface(
  args: BuildDaoMandateModuleSourceSinkSurfaceArgs,
): DaoMandateModuleSourceSinkSurface | null {
  const visibleEntries = args.mandate.sourceMap.map(cloneEntry);
  const relations = visibleEntries
    .map((entry) => relationForModule(entry, args.currentModuleKey))
    .filter((relation): relation is DaoLocalLensSurface['relation'] => relation !== null);
  const relation = args.currentModuleKey === 'records' && visibleEntries.length > 0
    ? 'supporting-source'
    : args.currentModuleKey === 'inventory' && visibleEntries.length > 0
      ? 'supporting-source'
      : strongestRelation(relations);
  const matchingEntries = visibleEntries.filter((entry) => {
    if (args.currentModuleKey === 'inventory') return relation !== 'quiet';
    if (args.currentModuleKey === 'records') return relation !== 'quiet';
    return relationForModule(entry, args.currentModuleKey) !== null;
  });
  const entries = matchingEntries;
  const primaryEntry = entries[0] ?? null;
  if (relation === 'quiet' && !primaryEntry) return null;
  const route = primaryEntry?.route
    ?? primaryEntry?.bestSources[0]?.route
    ?? null;

  return {
    moduleKey: args.currentModuleKey,
    relation,
    headline: moduleHeadline(args.currentModuleKey, relation, primaryEntry),
    detail: moduleDetail(args.currentModuleKey, relation, primaryEntry),
    entries,
    primaryEntry,
    impactLabel: primaryEntry?.expectedImpactLabel ?? null,
    route,
    evidenceIds: confidenceEvidence(primaryEntry),
  };
}
