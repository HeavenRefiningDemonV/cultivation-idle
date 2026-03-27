import { promises as fs } from 'node:fs';
import path from 'node:path';

import { SEMESTER_SLICE_CONTRACT } from '../../../systems/progression/contract/semesterSlice.js';
import { assertNormalFreshSaveRouteResult } from '../../../../tests/helpers/release/routeAssertions.js';
import { FRESH_SAVE_ROUTE_CATALOG, runFreshSaveRoute } from '../../../../tests/helpers/release/runFreshSaveRoute.js';
import type {
  FreshSaveCheckpointId,
  FreshSaveRouteId,
  FreshSaveRouteResult,
} from '../../../../tests/helpers/release/freshSaveRouteTypes.js';

export type ManualIssueSeverity = 'blocker' | 'major' | 'minor' | 'cosmetic';
export type ManualOverallStatus = 'pass' | 'fail' | 'blocked';

export type FreshSaveManualIssue = {
  severity: ManualIssueSeverity;
  checkpointId?: FreshSaveCheckpointId;
  summary: string;
  notes?: string;
};

export type FreshSaveManualResult = {
  routeId: FreshSaveRouteId;
  tester: string;
  date: string;
  buildRef?: string;
  overallStatus: ManualOverallStatus;
  reachedSpiritSevering: boolean;
  reachedCurrentChapterExhausted: boolean;
  prestigeAdvisorSeen: boolean;
  lifeSummarySeen: boolean;
  issues: FreshSaveManualIssue[];
  notes?: string;
};

export type FreshRunAcceptanceIssue = {
  severity: ManualIssueSeverity;
  source: 'automated' | 'manual' | 'ingestion';
  routeId?: FreshSaveRouteId;
  checkpointId?: FreshSaveCheckpointId;
  summary: string;
  notes?: string;
};

export type FreshRunRouteSummary = {
  routeId: FreshSaveRouteId;
  automationMode: 'automated_smoke_blocking' | 'manual_coverage';
  automatedStatus: 'pass' | 'fail' | 'not_run';
  manualStatus: ManualOverallStatus | 'missing' | 'invalid';
  elapsedMsToCap: number | null;
  finalRealmId: string | null;
  finalCityId: string | null;
  unlockedCityIds: string[];
  assistedStepCount: number;
  blockerCount: number;
  warningCount: number;
};

export type FreshRunFinalTruthSummary = {
  spiritSeveringReached: boolean;
  currentCapReached: boolean;
  fiveCityChainHonest: boolean;
  noFakeCity6: boolean;
  prestigeAdvisorAtCapAvailable: boolean;
  currentChapterExhaustedTruthAvailable: boolean;
  lifeSummaryAvailable: boolean;
};

export type FreshRunAcceptanceReport = {
  suiteVersion: '7.1d';
  generatedAt: number;
  automatedPass: boolean;
  manualCoverageComplete: boolean;
  releaseReady: boolean;
  hardFailureCount: number;
  warningCount: number;
  routeSummaries: Record<FreshSaveRouteId, FreshRunRouteSummary>;
  issues: FreshRunAcceptanceIssue[];
  blockers: FreshRunAcceptanceIssue[];
  warnings: FreshRunAcceptanceIssue[];
  finalTruthSummary: FreshRunFinalTruthSummary;
};

type ParsedManualBundle = {
  entries: FreshSaveManualResult[];
  issues: FreshRunAcceptanceIssue[];
};

export type FreshRunAcceptanceReportOptions = {
  manualResultsPaths?: string[];
  runAutomatedRoutes?: boolean;
  automatedRouteRunner?: (routeId: FreshSaveRouteId) => Promise<FreshSaveRouteResult>;
};

const REQUIRED_MANUAL_ROUTES: readonly FreshSaveRouteId[] = ['normal', 'cautious', 'aggressive'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isSeverity = (value: unknown): value is ManualIssueSeverity =>
  value === 'blocker' || value === 'major' || value === 'minor' || value === 'cosmetic';

const isOverallStatus = (value: unknown): value is ManualOverallStatus =>
  value === 'pass' || value === 'fail' || value === 'blocked';

const isRouteId = (value: unknown): value is FreshSaveRouteId =>
  value === 'normal' || value === 'cautious' || value === 'aggressive';

const validateManualResult = (input: unknown): { ok: true; result: FreshSaveManualResult } | { ok: false; error: string } => {
  if (!isObject(input)) return { ok: false, error: 'Manual result entry must be an object.' };

  if (!isRouteId(input.routeId)) return { ok: false, error: 'routeId must be normal|cautious|aggressive.' };
  if (typeof input.tester !== 'string' || input.tester.trim().length === 0) return { ok: false, error: 'tester is required.' };
  if (typeof input.date !== 'string' || input.date.trim().length === 0) return { ok: false, error: 'date is required.' };
  if (!isOverallStatus(input.overallStatus)) return { ok: false, error: 'overallStatus must be pass|fail|blocked.' };

  const boolKeys = [
    'reachedSpiritSevering',
    'reachedCurrentChapterExhausted',
    'prestigeAdvisorSeen',
    'lifeSummarySeen',
  ] as const;
  for (const key of boolKeys) {
    if (typeof input[key] !== 'boolean') {
      return { ok: false, error: `${key} must be boolean.` };
    }
  }

  if (!Array.isArray(input.issues)) return { ok: false, error: 'issues must be an array.' };

  const issues: FreshSaveManualIssue[] = [];
  for (const issue of input.issues) {
    if (!isObject(issue)) return { ok: false, error: 'issue entries must be objects.' };
    if (!isSeverity(issue.severity)) return { ok: false, error: 'issue severity must be blocker|major|minor|cosmetic.' };
    if (typeof issue.summary !== 'string' || issue.summary.trim().length === 0) {
      return { ok: false, error: 'issue summary is required.' };
    }

    issues.push({
      severity: issue.severity,
      checkpointId: typeof issue.checkpointId === 'string' ? (issue.checkpointId as FreshSaveCheckpointId) : undefined,
      summary: issue.summary,
      notes: typeof issue.notes === 'string' ? issue.notes : undefined,
    });
  }

  return {
    ok: true,
    result: {
      routeId: input.routeId,
      tester: input.tester,
      date: input.date,
      buildRef: typeof input.buildRef === 'string' ? input.buildRef : undefined,
      overallStatus: input.overallStatus,
      reachedSpiritSevering: input.reachedSpiritSevering as boolean,
      reachedCurrentChapterExhausted: input.reachedCurrentChapterExhausted as boolean,
      prestigeAdvisorSeen: input.prestigeAdvisorSeen as boolean,
      lifeSummarySeen: input.lifeSummarySeen as boolean,
      issues,
      notes: typeof input.notes === 'string' ? input.notes : undefined,
    },
  };
};

async function loadManualResults(paths: readonly string[]): Promise<ParsedManualBundle> {
  const entries: FreshSaveManualResult[] = [];
  const issues: FreshRunAcceptanceIssue[] = [];

  for (const rawPath of paths) {
    const resolvedPath = path.resolve(process.cwd(), rawPath);
    try {
      const content = await fs.readFile(resolvedPath, 'utf8');
      const parsed = JSON.parse(content) as unknown;
      const array = Array.isArray(parsed) ? parsed : [parsed];

      for (const row of array) {
        const validated = validateManualResult(row);
        if (!validated.ok) {
          issues.push({
            severity: 'blocker',
            source: 'ingestion',
            summary: `Malformed manual result in ${rawPath}: ${validated.error}`,
          });
          continue;
        }
        entries.push(validated.result);
      }
    } catch (error) {
      issues.push({
        severity: 'blocker',
        source: 'ingestion',
        summary: `Unable to load manual results file ${rawPath}.`,
        notes: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { entries, issues };
}

const toWarning = (summary: string, routeId?: FreshSaveRouteId): FreshRunAcceptanceIssue => ({
  severity: 'minor',
  source: 'ingestion',
  routeId,
  summary,
});

const summarizeFinalTruth = (automatedResults: FreshSaveRouteResult[]): FreshRunFinalTruthSummary => {
  const blockingRoutes = automatedResults.filter((entry) => {
    const routeDef = FRESH_SAVE_ROUTE_CATALOG.find((route) => route.id === entry.routeId);
    return routeDef?.isBlockingSmokeRoute;
  });

  if (blockingRoutes.length === 0) {
    return {
      spiritSeveringReached: false,
      currentCapReached: false,
      fiveCityChainHonest: false,
      noFakeCity6: true,
      prestigeAdvisorAtCapAvailable: false,
      currentChapterExhaustedTruthAvailable: false,
      lifeSummaryAvailable: false,
    };
  }

  const expectedChain = [...SEMESTER_SLICE_CONTRACT.liveCityIds];
  return {
    spiritSeveringReached: blockingRoutes.every((entry) => entry.finalSnapshot.finalRealmId === 'spirit_severing'),
    currentCapReached: blockingRoutes.every((entry) => entry.finalSnapshot.elapsedMsToCap !== null),
    fiveCityChainHonest: blockingRoutes.every((entry) =>
      entry.finalSnapshot.unlockedCityIds.length === expectedChain.length
      && entry.finalSnapshot.unlockedCityIds.every((cityId, index) => cityId === expectedChain[index]),
    ),
    noFakeCity6: blockingRoutes.every((entry) => !entry.finalSnapshot.unlockedCityIds.some((cityId) => !expectedChain.includes(cityId as never))),
    prestigeAdvisorAtCapAvailable: blockingRoutes.every((entry) => Boolean(entry.finalSnapshot.prestigeAdvisorLabel)),
    currentChapterExhaustedTruthAvailable: blockingRoutes.every((entry) => entry.finalSnapshot.currentChapterExhaustedTruth),
    lifeSummaryAvailable: blockingRoutes.every((entry) => entry.finalSnapshot.lifeSummaryAvailable),
  };
};

export function renderFreshRunAcceptanceReport(report: FreshRunAcceptanceReport): string {
  const lines: string[] = [];
  lines.push('=== Fresh-save Acceptance Report (Packet 7.1d) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`automatedPass: ${report.automatedPass ? 'PASS' : 'FAIL'}`);
  lines.push(`manualCoverageComplete: ${report.manualCoverageComplete ? 'YES' : 'NO'}`);
  lines.push(`releaseReady: ${report.releaseReady ? 'YES' : 'NO'}`);
  lines.push(`hardFailureCount: ${report.hardFailureCount}`);
  lines.push(`warningCount: ${report.warningCount}`);
  lines.push('');
  lines.push('Route Summaries:');
  for (const routeId of ['normal', 'cautious', 'aggressive'] as const) {
    const row = report.routeSummaries[routeId];
    lines.push(`- ${routeId}: automated=${row.automatedStatus}, manual=${row.manualStatus}, realm=${row.finalRealmId ?? 'n/a'}, city=${row.finalCityId ?? 'n/a'}, blockers=${row.blockerCount}, warnings=${row.warningCount}`);
  }

  lines.push('');
  lines.push('Final Truth Summary:');
  for (const [key, value] of Object.entries(report.finalTruthSummary)) {
    lines.push(`- ${key}: ${value}`);
  }

  if (report.blockers.length > 0) {
    lines.push('');
    lines.push('Blockers:');
    for (const blocker of report.blockers) {
      lines.push(`- [${blocker.source}] ${blocker.routeId ?? 'global'}: ${blocker.summary}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of report.warnings) {
      lines.push(`- [${warning.source}] ${warning.routeId ?? 'global'}: ${warning.summary}`);
    }
  }

  lines.push('');
  lines.push('Note: Packet 7.6 global release sign-off is not implemented by this report.');

  return lines.join('\n');
}

export async function buildFreshRunAcceptanceReport(options: FreshRunAcceptanceReportOptions = {}): Promise<FreshRunAcceptanceReport> {
  const routeSummaries = Object.fromEntries(
    FRESH_SAVE_ROUTE_CATALOG.map((route) => [
      route.id,
      {
        routeId: route.id,
        automationMode: route.automationMode,
        automatedStatus: 'not_run',
        manualStatus: 'missing',
        elapsedMsToCap: null,
        finalRealmId: null,
        finalCityId: null,
        unlockedCityIds: [],
        assistedStepCount: 0,
        blockerCount: 0,
        warningCount: 0,
      } as FreshRunRouteSummary,
    ]),
  ) as Record<FreshSaveRouteId, FreshRunRouteSummary>;

  const issues: FreshRunAcceptanceIssue[] = [];
  const automatedResults: FreshSaveRouteResult[] = [];
  const runAutomatedRoutes = options.runAutomatedRoutes !== false;
  const automatedRouteRunner = options.automatedRouteRunner ?? runFreshSaveRoute;

  if (runAutomatedRoutes) {
    for (const route of FRESH_SAVE_ROUTE_CATALOG.filter((entry) => entry.automationMode === 'automated_smoke_blocking')) {
      try {
        const result = await automatedRouteRunner(route.id);
        automatedResults.push(result);

        let automatedStatus: FreshRunRouteSummary['automatedStatus'] = result.failures.length === 0 ? 'pass' : 'fail';
        if (route.id === 'normal' && automatedStatus === 'pass') {
          try {
            assertNormalFreshSaveRouteResult(result);
          } catch (error) {
            automatedStatus = 'fail';
            issues.push({
              severity: 'blocker',
              source: 'automated',
              routeId: route.id,
              summary: 'Normal route assertion contract failed.',
              notes: error instanceof Error ? error.message : String(error),
            });
          }
        }

        routeSummaries[route.id] = {
          ...routeSummaries[route.id],
          automatedStatus,
          elapsedMsToCap: result.finalSnapshot.elapsedMsToCap,
          finalRealmId: result.finalSnapshot.finalRealmId,
          finalCityId: result.finalSnapshot.currentCityId,
          unlockedCityIds: [...result.finalSnapshot.unlockedCityIds],
          assistedStepCount: result.assistedSteps.length,
          blockerCount: result.failures.filter((entry) => entry.blocker).length,
          warningCount: result.warnings.length,
        };

        issues.push(
          ...result.failures.map((failure) => ({
            severity: failure.blocker ? 'blocker' : 'major',
            source: 'automated',
            routeId: route.id,
            summary: failure.message,
            notes: failure.code,
          } as FreshRunAcceptanceIssue)),
        );

        issues.push(
          ...result.warnings.map((warning) => ({
            severity: 'minor',
            source: 'automated',
            routeId: route.id,
            summary: warning.message,
            notes: warning.code,
          } as FreshRunAcceptanceIssue)),
        );
      } catch (error) {
        issues.push({
          severity: 'blocker',
          source: 'automated',
          routeId: route.id,
          summary: `Automated route execution failed for ${route.id}.`,
          notes: error instanceof Error ? error.message : String(error),
        });
        routeSummaries[route.id] = {
          ...routeSummaries[route.id],
          automatedStatus: 'fail',
          blockerCount: routeSummaries[route.id].blockerCount + 1,
        };
      }
    }
  } else {
    issues.push(toWarning('Automated route execution was skipped by configuration.'));
  }

  const manualBundle = await loadManualResults(options.manualResultsPaths ?? []);
  issues.push(...manualBundle.issues);

  const manualByRoute = new Map<FreshSaveRouteId, FreshSaveManualResult>();
  for (const row of manualBundle.entries) {
    if (manualByRoute.has(row.routeId)) {
      issues.push(toWarning(`Multiple manual results provided for ${row.routeId}; using the first entry.`, row.routeId));
      continue;
    }
    manualByRoute.set(row.routeId, row);
  }

  for (const routeId of REQUIRED_MANUAL_ROUTES) {
    const manual = manualByRoute.get(routeId);
    if (!manual) {
      issues.push(toWarning(`Manual coverage missing for route ${routeId}.`, routeId));
      routeSummaries[routeId] = { ...routeSummaries[routeId], manualStatus: 'missing' };
      continue;
    }

    routeSummaries[routeId] = {
      ...routeSummaries[routeId],
      manualStatus: manual.overallStatus,
      blockerCount: routeSummaries[routeId].blockerCount + manual.issues.filter((entry) => entry.severity === 'blocker').length,
      warningCount: routeSummaries[routeId].warningCount + manual.issues.filter((entry) => entry.severity !== 'blocker').length,
    };

    issues.push(...manual.issues.map((issue): FreshRunAcceptanceIssue => ({
      severity: issue.severity,
      source: 'manual',
      routeId,
      checkpointId: issue.checkpointId,
      summary: issue.summary,
      notes: issue.notes,
    })));
  }

  const blockingAutomatedRoutes = FRESH_SAVE_ROUTE_CATALOG.filter((route) => route.isBlockingSmokeRoute && route.automationMode === 'automated_smoke_blocking');
  const automatedPass = blockingAutomatedRoutes.every((route) => routeSummaries[route.id].automatedStatus === 'pass');
  const manualCoverageComplete = REQUIRED_MANUAL_ROUTES.every((routeId) => routeSummaries[routeId].manualStatus !== 'missing' && routeSummaries[routeId].manualStatus !== 'invalid');
  const manualRequiredRoutesPassed = REQUIRED_MANUAL_ROUTES.every((routeId) => routeSummaries[routeId].manualStatus === 'pass');

  const blockers = issues.filter((issue) => issue.severity === 'blocker');
  const warnings = issues.filter((issue) => issue.severity !== 'blocker');

  const releaseReady = automatedPass
    && manualCoverageComplete
    && manualRequiredRoutesPassed
    && blockers.length === 0;

  return {
    suiteVersion: '7.1d',
    generatedAt: Date.now(),
    automatedPass,
    manualCoverageComplete,
    releaseReady,
    hardFailureCount: blockers.length,
    warningCount: warnings.length,
    routeSummaries,
    issues,
    blockers,
    warnings,
    finalTruthSummary: summarizeFinalTruth(automatedResults),
  };
}
