import type {
  DaoBackgroundPlanSurface,
  DaoCurrentWorkSurface,
  DaoJadeSlip,
  DaoMandateGuidanceProfile,
  DaoMandateRoute,
  DaoMandateSurfaceV1,
  DaoReadinessLedger,
  DaoReadinessRow,
  DaoRequirementLedger,
  DaoRequirementRow,
  DaoSafetyNetSurface,
  DaoSourceMapEntry,
  DaoSourceOption,
} from './daoMandateTypes.js';

export interface DaoMandateVisibilityOptions {
  profile: DaoMandateGuidanceProfile;
}

export function getDefaultDaoMandateGuidanceProfile(): DaoMandateGuidanceProfile {
  return 'elder';
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

function primaryRouteNeedsSourceExplanation(surface: DaoMandateSurfaceV1): boolean {
  return surface.primaryRoute.source === 'economy' ||
    surface.primaryRoute.source === 'readiness' ||
    surface.primaryRoute.source === 'build';
}

function findSealedLedgerRow(surface: DaoMandateSurfaceV1): SelectedLedgerRow | null {
  const primaryRow = findPrimaryObstructionRow(surface);
  if (primaryRow) return primaryRow;

  const actionable = findFirstActionable(surface, ['hardGates', 'readinessFloors', 'supportReserves']);
  if (actionable) return actionable;

  if (primaryRouteNeedsSourceExplanation(surface)) {
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

function buildElderLedger(surface: DaoMandateSurfaceV1): DaoRequirementLedger {
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

  const additionalRows = allLedgerRowsWithBucket(surface.requirementLedger)
    .filter((entry) => !selectedKeys.has(selectedKey(entry)))
    .filter((entry) => {
      if (entry.bucket === 'hardGates') return isActionableState(entry.row);
      if (entry.bucket === 'readinessFloors' || entry.bucket === 'supportReserves') return isActionableState(entry.row);
      if (entry.bucket === 'sourceRoutes') return primaryRouteNeedsSourceExplanation(surface);
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

function applySealed(surface: DaoMandateSurfaceV1): void {
  surface.secondaryRoutes = surface.primaryRoute.blocked ? surface.secondaryRoutes.slice(0, 1) : [];
  surface.requirementLedger = ledgerWithOnly(findSealedLedgerRow(surface));
  surface.readiness = {
    ...surface.readiness,
    rows: surface.readiness.rows.slice(0, 1),
  };
  surface.sourceMap = [];
  surface.backgroundPlan = { ...surface.backgroundPlan, routes: [] };
  surface.lessonSlips = [];
}

function applyElder(surface: DaoMandateSurfaceV1): void {
  surface.secondaryRoutes = surface.secondaryRoutes.slice(0, 2);
  surface.requirementLedger = buildElderLedger(surface);
  surface.readiness = {
    ...surface.readiness,
    rows: surface.readiness.rows.slice(0, 3),
  };
  surface.sourceMap = surface.sourceMap.slice(0, 1).map((entry) => ({
    ...entry,
    fallbackSources: entry.fallbackSources.slice(0, 1),
  }));
  surface.backgroundPlan = {
    ...surface.backgroundPlan,
    routes: surface.backgroundPlan.routes.slice(0, 1),
  };
  surface.lessonSlips = surface.lessonSlips.slice(0, 1);
}

export function applyDaoMandateVisibility(
  surface: DaoMandateSurfaceV1,
  options: DaoMandateVisibilityOptions,
): DaoMandateSurfaceV1 {
  const next = cloneSurface(surface);
  next.meta.guidanceProfile = options.profile;

  if (options.profile === 'sealed') {
    applySealed(next);
  } else if (options.profile === 'elder') {
    applyElder(next);
  }

  return next;
}
