import type { MigrationContext, MigrationRunReport, MigrationStepResult } from './migrationTypes.js';

const buildSummaryLines = (report: MigrationRunReport): string[] => [
  `Mode: ${report.mode}`,
  `Source version: ${report.sourceVersion} (${report.sourceVersionKind})`,
  `Target version: ${report.targetVersion}`,
  `Final version: ${report.finalVersion}`,
  `Applied transforms: ${report.appliedTransformSteps.length}`,
  `Report-only steps: ${report.reportOnlySteps.length}`,
  `Planned transforms: ${report.plannedTransformSteps.length}`,
  `Warnings: ${report.counts.warningCount} | Errors: ${report.counts.errorCount}`,
];

export const createMigrationRunReport = (
  ctx: MigrationContext,
  finalVersion: string,
  stepResults: MigrationStepResult[],
): MigrationRunReport => {
  const warnings = stepResults.flatMap((result) => result.warnings).filter((w) => w.severity !== 'error');
  const errors = stepResults.flatMap((result) => result.warnings).filter((w) => w.severity === 'error');
  const touchedFieldPaths = stepResults.flatMap((result) => result.touchedFieldPaths);

  const report: MigrationRunReport = {
    sourceVersion: ctx.sourceVersion,
    sourceVersionKind: ctx.sourceVersionKind,
    targetVersion: ctx.targetVersion,
    finalVersion,
    mode: ctx.mode,
    appliedTransformSteps: stepResults.filter((result) => result.kind === 'transform' && result.didRun).map((result) => result.stepId),
    reportOnlySteps: stepResults.filter((result) => result.kind === 'reportOnly' && result.didRun).map((result) => result.stepId),
    plannedTransformSteps: stepResults
      .filter((result) => result.kind === 'plannedTransform' && result.didRun)
      .map((result) => result.stepId),
    warnings,
    errors,
    touchedFieldPaths,
    counts: {
      totalSteps: stepResults.length,
      ranSteps: stepResults.filter((result) => result.didRun).length,
      mutatedSteps: stepResults.filter((result) => result.didMutate).length,
      warningCount: warnings.length,
      errorCount: errors.length,
      touchedFieldCount: touchedFieldPaths.length,
      plannedMutationCount: stepResults.flatMap((result) => result.plannedMutations).length,
    },
    summaryLines: [],
    stepResults,
  };

  report.summaryLines = buildSummaryLines(report);

  return report;
};
