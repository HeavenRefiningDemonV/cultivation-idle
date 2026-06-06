const toGroupEntry = (result) => ({
    stepId: result.stepId,
    ownerPacket: result.ownerPacket,
    summary: result.summary,
});
const buildSummaryLines = (report) => [
    `Mode: ${report.mode}`,
    `Source version: ${report.sourceVersion} (${report.sourceVersionKind})`,
    `Target version: ${report.targetVersion}`,
    `Final version: ${report.finalVersion}`,
    `Active transforms: ${report.grouped.activeTransforms.length}`,
    `Report-only detections: ${report.grouped.reportOnly.length}`,
    `Planned transforms: ${report.grouped.plannedTransforms.length}`,
    `Warnings: ${report.counts.warningCount} | Errors: ${report.counts.errorCount}`,
];
export const createMigrationRunReport = (ctx, finalVersion, stepResults) => {
    const warnings = stepResults.flatMap((result) => result.warnings).filter((w) => w.severity !== 'error');
    const errors = stepResults.flatMap((result) => result.warnings).filter((w) => w.severity === 'error');
    const touchedFieldPaths = stepResults.flatMap((result) => result.touchedFieldPaths);
    const report = {
        sourceVersion: ctx.sourceVersion,
        sourceVersionKind: ctx.sourceVersionKind,
        targetVersion: ctx.targetVersion,
        finalVersion,
        mode: ctx.mode,
        appliedTransformSteps: stepResults.filter((result) => result.kind === 'transform' && result.didRun).map((result) => result.stepId),
        reportOnlySteps: stepResults.filter((result) => result.kind === 'reportOnly' && result.didRun).map((result) => result.stepId),
        plannedTransformSteps: stepResults.filter((result) => result.kind === 'plannedTransform' && result.didRun).map((result) => result.stepId),
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
        grouped: {
            activeTransforms: stepResults.filter((result) => result.kind === 'transform' && result.didRun).map(toGroupEntry),
            plannedTransforms: stepResults.filter((result) => result.kind === 'plannedTransform' && result.didRun).map(toGroupEntry),
            reportOnly: stepResults.filter((result) => result.kind === 'reportOnly' && result.didRun).map(toGroupEntry),
        },
    };
    report.summaryLines = buildSummaryLines(report);
    return report;
};
