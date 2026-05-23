import type {
  DaoBackgroundPlanSurface,
  DaoCurrentWorkSurface,
  DaoJadeSlip,
  DaoMandateGuidanceProfile,
  DaoMandateObstructionKind,
  DaoMandateRoute,
  DaoMandateRouteSource,
  DaoMandateSurfaceV1,
  DaoReadinessLedger,
  DaoReadinessRow,
  DaoRequirementLedger,
  DaoRequirementRow,
  DaoSafetyNetSurface,
  DaoSourceMapEntry,
  DaoSourceOption,
} from './daoMandateTypes.js';
import {
  DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE,
  createDefaultDaoMandateGuidanceSettings,
  sanitizeDaoMandateGuidanceSettings,
  type DaoMandateGuidanceSettings,
} from './daoMandateGuidanceSettings.js';
import { applyDaoMandateSourceMapProfileVisibility } from './daoMandateSourceMap.js';

export interface DaoMandateVisibilityOptions {
  /** @deprecated V2-3 accepts legacy Guidance Oath profiles only as inert compatibility input. */
  profile?: DaoMandateGuidanceProfile;
  settings?: Partial<DaoMandateGuidanceSettings>;
}

export function getDefaultDaoMandateGuidanceProfile(): DaoMandateGuidanceProfile {
  return DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE;
}

type LedgerBucketKey = keyof DaoRequirementLedger;

type SelectedLedgerRow = {
  bucket: LedgerBucketKey;
  row: DaoRequirementRow;
};

const LEDGER_BUCKETS: LedgerBucketKey[] = [
  'hardGates',
  'readinessFloors',
  'supportReserves',
  'sourceRoutes',
  'optionalOptimizations',
  'recentOmens',
];

const SOURCE_DETAIL_ROUTE_SOURCES: DaoMandateRouteSource[] = ['economy', 'readiness', 'build'];

const SOURCE_OBVIOUS_OBSTRUCTION_KINDS: DaoMandateObstructionKind[] = [
  'required_item_missing',
  'source_route_locked',
  'bounty_merit_shortfall',
  'apothecary_prep_shortfall',
  'forge_floor_shortfall',
  'manual_pavilion_gap',
  'expedition_shortage_smoothing',
];

function cloneRoute(route: DaoMandateRoute): DaoMandateRoute {
  return {
    ...route,
    target: route.target ? { ...route.target } : null,
  };
}

function cloneRow(row: DaoRequirementRow): DaoRequirementRow {
  return {
    ...row,
    route: row.route ? cloneRoute(row.route) : null,
  };
}

function cloneReadinessRow(row: DaoReadinessRow): DaoReadinessRow {
  return {
    ...row,
    route: row.route ? cloneRoute(row.route) : null,
  };
}

function cloneLedger(ledger: DaoRequirementLedger): DaoRequirementLedger {
  return {
    hardGates: ledger.hardGates.map(cloneRow),
    readinessFloors: ledger.readinessFloors.map(cloneRow),
    supportReserves: ledger.supportReserves.map(cloneRow),
    sourceRoutes: ledger.sourceRoutes.map(cloneRow),
    optionalOptimizations: ledger.optionalOptimizations.map(cloneRow),
    recentOmens: ledger.recentOmens.map(cloneRow),
  };
}

function cloneReadiness(readiness: DaoReadinessLedger): DaoReadinessLedger {
  return {
    ...readiness,
    rows: readiness.rows.map(cloneReadinessRow),
  };
}

function cloneSourceOption(option: DaoSourceOption): DaoSourceOption {
  return {
    ...option,
    route: option.route ? cloneRoute(option.route) : null,
  };
}

function cloneSourceMapEntry(entry: DaoSourceMapEntry): DaoSourceMapEntry {
  return {
    ...entry,
    route: entry.route ? cloneRoute(entry.route) : null,
    bestSources: entry.bestSources.map(cloneSourceOption),
    fallbackSources: entry.fallbackSources.map(cloneSourceOption),
  };
}

function cloneCurrentWork(currentWork: DaoCurrentWorkSurface): DaoCurrentWorkSurface {
  return {
    foreground: {
      ...currentWork.foreground,
      route: currentWork.foreground.route ? cloneRoute(currentWork.foreground.route) : null,
    },
    activeCombat: currentWork.activeCombat ? cloneRow(currentWork.activeCombat) : null,
    trackedBounty: currentWork.trackedBounty ? cloneRow(currentWork.trackedBounty) : null,
    expeditions: currentWork.expeditions ? cloneRow(currentWork.expeditions) : null,
    queues: currentWork.queues.map(cloneRow),
  };
}

function cloneBackgroundPlan(backgroundPlan: DaoBackgroundPlanSurface): DaoBackgroundPlanSurface {
  return {
    ...backgroundPlan,
    routes: backgroundPlan.routes.map(cloneRoute),
  };
}

function cloneSafetyNet(safetyNet: DaoSafetyNetSurface | null): DaoSafetyNetSurface | null {
  return safetyNet
    ? {
      ...safetyNet,
      route: safetyNet.route ? cloneRoute(safetyNet.route) : null,
    }
    : null;
}

function cloneLessonSlip(slip: DaoJadeSlip): DaoJadeSlip {
  return {
    ...slip,
    route: slip.route ? cloneRoute(slip.route) : null,
  };
}

function cloneSurface(surface: DaoMandateSurfaceV1): DaoMandateSurfaceV1 {
  return {
    ...surface,
    meta: { ...surface.meta },
    milestone: { ...surface.milestone },
    obstruction: { ...surface.obstruction, evidenceIds: [...surface.obstruction.evidenceIds] },
    primaryRoute: cloneRoute(surface.primaryRoute),
    secondaryRoutes: surface.secondaryRoutes.map(cloneRoute),
    requirementLedger: cloneLedger(surface.requirementLedger),
    readiness: cloneReadiness(surface.readiness),
    sourceMap: surface.sourceMap.map(cloneSourceMapEntry),
    currentWork: cloneCurrentWork(surface.currentWork),
    backgroundPlan: cloneBackgroundPlan(surface.backgroundPlan),
    safetyNet: cloneSafetyNet(surface.safetyNet),
    prestige: surface.prestige
      ? { ...surface.prestige, route: surface.prestige.route ? cloneRoute(surface.prestige.route) : null }
      : null,
    recentOmens: surface.recentOmens.map((omen) => ({ ...omen })),
    lessonSlips: surface.lessonSlips.map(cloneLessonSlip),
    localLens: surface.localLens
      ? {
        ...surface.localLens,
        route: surface.localLens.route ? cloneRoute(surface.localLens.route) : null,
        evidenceIds: [...surface.localLens.evidenceIds],
      }
      : null,
  };
}

function createEmptyLedger(): DaoRequirementLedger {
  return {
    hardGates: [],
    readinessFloors: [],
    supportReserves: [],
    sourceRoutes: [],
    optionalOptimizations: [],
    recentOmens: [],
  };
}

function allLedgerRowsWithBucket(ledger: DaoRequirementLedger): SelectedLedgerRow[] {
  return LEDGER_BUCKETS.flatMap((bucket) => ledger[bucket].map((row) => ({ bucket, row })));
}

function isActionableState(row: DaoRequirementRow): boolean {
  return row.state === 'unmet' || row.state === 'partial' || row.state === 'blocked';
}

function isTrulyUnmetHardGate(row: DaoRequirementRow): boolean {
  return row.state === 'unmet' || row.state === 'blocked';
}

function findPrimaryObstructionRow(surface: DaoMandateSurfaceV1): SelectedLedgerRow | null {
  if (surface.obstruction.kind === 'none') return null;
  const rowId = `primary-${surface.obstruction.kind}`;
  return allLedgerRowsWithBucket(surface.requirementLedger).find((entry) => entry.row.id === rowId) ?? null;
}

function findFirstActionable(
  surface: DaoMandateSurfaceV1,
  buckets: LedgerBucketKey[],
): SelectedLedgerRow | null {
  for (const bucket of buckets) {
    const row = surface.requirementLedger[bucket].find(isActionableState);
    if (row) return { bucket, row };
  }
  return null;
}

function surfaceNeedsSourceRouteDetail(surface: DaoMandateSurfaceV1): boolean {
  if (SOURCE_DETAIL_ROUTE_SOURCES.includes(surface.primaryRoute.source)) return true;
  if (SOURCE_OBVIOUS_OBSTRUCTION_KINDS.includes(surface.obstruction.kind)) return true;
  return surface.requirementLedger.sourceRoutes.some(isActionableState);
}

function findSealedLedgerRow(surface: DaoMandateSurfaceV1): SelectedLedgerRow | null {
  const primaryRow = findPrimaryObstructionRow(surface);
  if (primaryRow) return primaryRow;

  const actionable = findFirstActionable(surface, ['hardGates', 'readinessFloors', 'supportReserves']);
  if (actionable) return actionable;

  if (surfaceNeedsSourceRouteDetail(surface)) {
    const sourceRoute = surface.requirementLedger.sourceRoutes[0];
    if (sourceRoute) return { bucket: 'sourceRoutes', row: sourceRoute };
  }

  if (surface.obstruction.kind === 'attempt_gate_now' || surface.obstruction.kind === 'none') {
    const optional = surface.requirementLedger.optionalOptimizations[0];
    if (optional) return { bucket: 'optionalOptimizations', row: optional };
  }

  return allLedgerRowsWithBucket(surface.requirementLedger)[0] ?? null;
}

function pushSelectedRow(ledger: DaoRequirementLedger, entry: SelectedLedgerRow): void {
  ledger[entry.bucket].push(entry.row);
}

function ledgerWithOnly(entry: SelectedLedgerRow | null): DaoRequirementLedger {
  const ledger = createEmptyLedger();
  if (entry) pushSelectedRow(ledger, entry);
  return ledger;
}

function selectedKey(entry: SelectedLedgerRow): string {
  return `${entry.bucket}:${entry.row.id}`;
}

function buildStandardSparseLedger(surface: DaoMandateSurfaceV1): DaoRequirementLedger {
  const ledger = createEmptyLedger();
  const selectedKeys = new Set<string>();

  const add = (entry: SelectedLedgerRow | null): void => {
    if (!entry) return;
    const key = selectedKey(entry);
    if (selectedKeys.has(key)) return;
    selectedKeys.add(key);
    pushSelectedRow(ledger, entry);
  };

  const primaryRow = findPrimaryObstructionRow(surface);
  add(primaryRow);

  for (const row of surface.requirementLedger.hardGates.filter(isTrulyUnmetHardGate)) {
    add({ bucket: 'hardGates', row });
  }

  if (surfaceNeedsSourceRouteDetail(surface)) {
    add(surface.requirementLedger.sourceRoutes[0] ? { bucket: 'sourceRoutes', row: surface.requirementLedger.sourceRoutes[0] } : null);
  }

  const additionalRows = allLedgerRowsWithBucket(surface.requirementLedger)
    .filter((entry) => !selectedKeys.has(selectedKey(entry)))
    .filter((entry) => {
      if (entry.bucket === 'hardGates') return isActionableState(entry.row);
      if (entry.bucket === 'readinessFloors' || entry.bucket === 'supportReserves') return isActionableState(entry.row);
      if (entry.bucket === 'sourceRoutes') return surfaceNeedsSourceRouteDetail(surface);
      if (entry.bucket === 'optionalOptimizations') {
        return surface.obstruction.kind === 'attempt_gate_now' || surface.obstruction.kind === 'none';
      }
      return entry.bucket === 'recentOmens' && !primaryRow;
    })
    .slice(0, 2);

  for (const entry of additionalRows) add(entry);

  if (allLedgerRowsWithBucket(ledger).length === 0) {
    add(findSealedLedgerRow(surface));
  }

  return ledger;
}

function applyStandardSparseVisibility(surface: DaoMandateSurfaceV1): void {
  surface.secondaryRoutes = surface.secondaryRoutes.slice(0, 2);
  surface.requirementLedger = buildStandardSparseLedger(surface);
}

function resolveVisibilitySettings(options: DaoMandateVisibilityOptions): DaoMandateGuidanceSettings {
  return sanitizeDaoMandateGuidanceSettings({
    ...createDefaultDaoMandateGuidanceSettings(),
    ...(options.profile ? { guidanceOath: options.profile } : {}),
    ...(options.settings ?? {}),
  });
}

function hideSourceRouteDetails(surface: DaoMandateSurfaceV1): void {
  surface.sourceMap = [];
  surface.requirementLedger = {
    ...surface.requirementLedger,
    sourceRoutes: [],
  };
}

function applySourceRouteDetail(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.sourceRouteDetail === 'always') return;
  if (settings.sourceRouteDetail === 'never' || !surfaceNeedsSourceRouteDetail(surface)) {
    hideSourceRouteDetails(surface);
    return;
  }
  surface.sourceMap = applyDaoMandateSourceMapProfileVisibility(
    surface.sourceMap,
    DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE,
  );
}

function applyLessonCadence(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.jadeSlipLessons === 'off') {
    surface.lessonSlips = [];
    return;
  }
  if (settings.jadeSlipLessons === 'first_time') {
    surface.lessonSlips = surface.lessonSlips.slice(0, 1);
    return;
  }
  surface.lessonSlips = surface.lessonSlips.slice(0, 3);
}

function shouldKeepLocalLens(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): boolean {
  if (!surface.localLens) return false;
  if (surface.localLens.relation === 'quiet') return false;
  if (settings.localLensBanners === 'hidden') return false;
  if (settings.localLensBanners === 'full') return true;
  return true;
}

function applyLocalLensBanners(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (!shouldKeepLocalLens(surface, settings)) {
    surface.localLens = null;
  }
}

function applyAdvancedReadinessMath(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.advancedReadinessMath === 'off') {
    surface.readiness = {
      ...surface.readiness,
      rows: [],
    };
    return;
  }
  if (settings.advancedReadinessMath === 'collapsed') {
    surface.readiness = {
      ...surface.readiness,
      rows: surface.readiness.rows.slice(0, 3),
    };
  }
}

function applyFailureCoaching(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.failureCoaching !== 'critical_only') return;
  if (surface.obstruction.kind === 'gate_recent_failure' || surface.obstruction.source === 'failure_reflection') return;

  const removeFailureRows = (rows: DaoRequirementRow[]): DaoRequirementRow[] =>
    rows.filter((row) => row.source !== 'failure_reflection');

  surface.requirementLedger = {
    hardGates: removeFailureRows(surface.requirementLedger.hardGates),
    readinessFloors: removeFailureRows(surface.requirementLedger.readinessFloors),
    supportReserves: removeFailureRows(surface.requirementLedger.supportReserves),
    sourceRoutes: removeFailureRows(surface.requirementLedger.sourceRoutes),
    optionalOptimizations: removeFailureRows(surface.requirementLedger.optionalOptimizations),
    recentOmens: removeFailureRows(surface.requirementLedger.recentOmens),
  };
  surface.recentOmens = surface.recentOmens.filter((omen) => omen.source !== 'failure_reflection');
  surface.lessonSlips = surface.lessonSlips.filter((slip) => slip.trigger !== 'gate_recent_failure');
}

function applyBackgroundReminders(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.backgroundReminders === 'full_optimization') return;

  const routes = surface.backgroundPlan.routes;
  if (settings.backgroundReminders === 'normal') {
    surface.backgroundPlan = {
      ...surface.backgroundPlan,
      routes: routes.slice(0, 1),
    };
    return;
  }

  const blockedRoute = routes.find((route) => route.blocked);
  const hasIdleSlots = (surface.backgroundPlan.idleSlotCount ?? 0) > 0;
  surface.backgroundPlan = {
    ...surface.backgroundPlan,
    routes: blockedRoute ? [blockedRoute] : hasIdleSlots ? routes.slice(0, 1) : [],
  };
}

function applyRecentOmensFeed(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (settings.recentOmensFeed === 'full') {
    const cap = 5;
    surface.recentOmens = surface.recentOmens.slice(0, cap);
    surface.requirementLedger = {
      ...surface.requirementLedger,
      recentOmens: surface.requirementLedger.recentOmens.slice(0, cap),
    };
    return;
  }
  if (settings.recentOmensFeed === 'hidden') {
    surface.recentOmens = [];
    surface.requirementLedger = {
      ...surface.requirementLedger,
      recentOmens: [],
    };
    return;
  }
  surface.recentOmens = surface.recentOmens.slice(0, 3);
  surface.requirementLedger = {
    ...surface.requirementLedger,
    recentOmens: surface.requirementLedger.recentOmens.slice(0, 3),
  };
}

function applyPrestigeCounsel(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  if (!surface.prestige) return;
  if (surface.prestige.state === 'too_early') {
    surface.prestige = null;
  }
}

function applyGranularSettings(surface: DaoMandateSurfaceV1, settings: DaoMandateGuidanceSettings): void {
  applySourceRouteDetail(surface, settings);
  applyLessonCadence(surface, settings);
  applyLocalLensBanners(surface, settings);
  applyAdvancedReadinessMath(surface, settings);
  applyFailureCoaching(surface, settings);
  applyBackgroundReminders(surface, settings);
  applyRecentOmensFeed(surface, settings);
  applyPrestigeCounsel(surface, settings);
}

export function applyDaoMandateVisibility(
  surface: DaoMandateSurfaceV1,
  options: DaoMandateVisibilityOptions = {},
): DaoMandateSurfaceV1 {
  const settings = resolveVisibilitySettings(options);
  const next = cloneSurface(surface);
  next.meta.guidanceProfile = DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE;

  applyStandardSparseVisibility(next);
  applyGranularSettings(next, settings);

  return next;
}
