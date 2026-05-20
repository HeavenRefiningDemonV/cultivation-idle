import { applySafeRepairs, runRuntimeValidation, type ValidationIssue } from '../runValidation.js';

export type RuntimeDiagnosticsDomain = NonNullable<ValidationIssue['domain']>;

export type RuntimeDiagnosticsSection = {
  id: RuntimeDiagnosticsDomain;
  errorCount: number;
  warningCount: number;
  repairableCount: number;
  entries: ValidationIssue[];
};

export type RuntimeDiagnosticsReport = {
  schemaVersion: '7.4c';
  generatedAt: number;
  overallPass: boolean;
  errorCount: number;
  warningCount: number;
  repairableCount: number;
  nonRepairableCount: number;
  groupedSections: RuntimeDiagnosticsSection[];
  issues: ValidationIssue[];
  notes: string[];
};

export type RuntimeDiagnosticsScenarioStatus = 'PASS' | 'EXPECTED_NEGATIVE_PASS' | 'BLOCKER';

export type RuntimeDiagnosticsScenarioClassification = {
  scenarioStatus: RuntimeDiagnosticsScenarioStatus;
  expectedNegative: boolean;
  expectedIssueIds: string[];
  actualIssueIds: string[];
  unexpectedIssueIds: string[];
  missingExpectedIssueIds: string[];
  releaseGateBlocking: boolean;
  summary: string;
};

const DOMAIN_ORDER: RuntimeDiagnosticsDomain[] = [
  'content',
  'progression',
  'inventory',
  'manuals',
  'techniques',
  'activity',
  'professions',
  'expeditions',
  'save_load',
  'diagnostics_internal',
];

function groupIssues(issues: ValidationIssue[]): RuntimeDiagnosticsSection[] {
  const map = new Map<RuntimeDiagnosticsDomain, RuntimeDiagnosticsSection>();
  for (const id of DOMAIN_ORDER) {
    map.set(id, { id, errorCount: 0, warningCount: 0, repairableCount: 0, entries: [] });
  }

  for (const issue of issues) {
    const domain = issue.domain ?? 'diagnostics_internal';
    const section = map.get(domain)!;
    section.entries.push(issue);
    if (issue.severity === 'error') section.errorCount += 1;
    else section.warningCount += 1;
    if (issue.repairable) section.repairableCount += 1;
  }

  return DOMAIN_ORDER.map((id) => map.get(id)!).filter((entry) => entry.entries.length > 0);
}

export function buildRuntimeDiagnosticsReport(options: { applyRepairs?: boolean } = {}): RuntimeDiagnosticsReport {
  const issues = runRuntimeValidation();
  const repairableCount = issues.filter((issue) => issue.repairable).length;
  const nonRepairableCount = issues.length - repairableCount;
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  const notes: string[] = [
    'Safe repair boundary is conservative: only unambiguous clamps/removals are auto-repaired.',
  ];

  if (options.applyRepairs) {
    const repairResult = applySafeRepairs(issues);
    notes.push(`Applied safe repairs: ${repairResult.repairedCount}.`);
    notes.push(...repairResult.notes.slice(0, 5));
  }

  return {
    schemaVersion: '7.4c',
    generatedAt: Date.now(),
    overallPass: errorCount === 0,
    errorCount,
    warningCount,
    repairableCount,
    nonRepairableCount,
    groupedSections: groupIssues(issues),
    issues,
    notes,
  };
}

export function classifyRuntimeDiagnosticsScenario(
  report: RuntimeDiagnosticsReport,
  expectation: { expectedNegative: boolean; expectedIssueIds?: readonly string[] },
): RuntimeDiagnosticsScenarioClassification {
  const actualIssueIds = report.issues.map((issue) => issue.id).sort();
  const expectedIssueIds = [...(expectation.expectedIssueIds ?? [])].sort();
  const expectedSet = new Set(expectedIssueIds);
  const actualSet = new Set(actualIssueIds);
  const unexpectedIssueIds = actualIssueIds.filter((id) => !expectedSet.has(id));
  const missingExpectedIssueIds = expectedIssueIds.filter((id) => !actualSet.has(id));

  if (!expectation.expectedNegative) {
    const pass = report.errorCount === 0;
    return {
      scenarioStatus: pass ? 'PASS' : 'BLOCKER',
      expectedNegative: false,
      expectedIssueIds,
      actualIssueIds,
      unexpectedIssueIds: actualIssueIds,
      missingExpectedIssueIds: [],
      releaseGateBlocking: !pass,
      summary: pass
        ? 'Clean runtime scenario produced no error-level diagnostics.'
        : `Clean runtime scenario produced ${report.errorCount} unexpected error-level diagnostic(s).`,
    };
  }

  const expectedNegativePass = unexpectedIssueIds.length === 0 && missingExpectedIssueIds.length === 0 && report.errorCount > 0;
  return {
    scenarioStatus: expectedNegativePass ? 'EXPECTED_NEGATIVE_PASS' : 'BLOCKER',
    expectedNegative: true,
    expectedIssueIds,
    actualIssueIds,
    unexpectedIssueIds,
    missingExpectedIssueIds,
    releaseGateBlocking: !expectedNegativePass,
    summary: expectedNegativePass
      ? 'Expected-negative runtime scenario emitted only the documented diagnostics.'
      : `Expected-negative runtime scenario drifted: unexpected=${unexpectedIssueIds.join(', ') || 'none'} missing=${missingExpectedIssueIds.join(', ') || 'none'}.`,
  };
}

export function renderRuntimeDiagnosticsReport(report: RuntimeDiagnosticsReport): string {
  const lines: string[] = [];
  lines.push('=== Release Runtime Diagnostics (Packet 7.4c) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`errors: ${report.errorCount}`);
  lines.push(`warnings: ${report.warningCount}`);
  lines.push(`repairable: ${report.repairableCount}`);
  lines.push(`nonRepairable: ${report.nonRepairableCount}`);
  lines.push('');
  lines.push('Sections:');
  report.groupedSections.forEach((section) => {
    lines.push(`- ${section.id}: errors=${section.errorCount}, warnings=${section.warningCount}, repairable=${section.repairableCount}`);
  });
  if (report.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    report.issues.forEach((issue) => {
      lines.push(`- [${issue.severity}] ${issue.id} (${issue.domain ?? 'diagnostics_internal'}): ${issue.message}`);
    });
  }
  return lines.join('\n');
}
