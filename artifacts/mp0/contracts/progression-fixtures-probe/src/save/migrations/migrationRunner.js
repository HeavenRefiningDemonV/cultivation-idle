import { createMigrationContext } from './migrationContext.js';
import { migrationRegistry } from './migrationRegistry.js';
import { createMigrationRunReport } from './migrationReport.js';
import { CURRENT_SAVE_VERSION } from './saveVersion.js';
const clone = (value) => JSON.parse(JSON.stringify(value));
let lastMigrationReport = null;
export const getLastMigrationReport = () => lastMigrationReport;
export const runSaveMigrations = (saveInput, params) => {
    const initial = (saveInput && typeof saveInput === 'object' ? clone(saveInput) : {});
    const ctx = createMigrationContext({ ...params, save: initial });
    let working = clone(initial);
    let simulatedWorking = clone(initial);
    const stepResults = [];
    for (const step of migrationRegistry) {
        if (!step.appliesTo(working, ctx)) {
            continue;
        }
        const stepInput = ctx.mode === 'dry-run' ? clone(simulatedWorking) : working;
        const result = step.run(stepInput, ctx);
        stepResults.push(result);
        if (step.kind === 'transform' && ctx.mode === 'apply') {
            working = clone(result.save);
        }
        if (step.kind === 'transform' && ctx.mode === 'dry-run') {
            simulatedWorking = clone(result.save);
        }
    }
    if (ctx.mode === 'apply' && typeof working.version !== 'string') {
        working.version = CURRENT_SAVE_VERSION;
    }
    const finalVersionSource = ctx.mode === 'dry-run' ? simulatedWorking : working;
    const report = createMigrationRunReport(ctx, typeof finalVersionSource.version === 'string' ? finalVersionSource.version : ctx.targetVersion, stepResults);
    lastMigrationReport = report;
    return {
        migrated: working,
        report,
    };
};
