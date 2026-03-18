import { promises as fs } from 'node:fs';
import path from 'node:path';

import { runSaveMigrations } from '../src/save/migrations/index.js';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const fixtureFlag = args.find((arg) => arg.startsWith('--fixture='));
  const fileFlag = args.find((arg) => arg.startsWith('--file='));
  const positionalFile = args.find((arg) => !arg.startsWith('--'));

  return {
    json,
    fixture: fixtureFlag?.split('=')[1] ?? null,
    file: fileFlag?.split('=')[1] ?? positionalFile ?? null,
  };
};

const loadInputSave = async (options: { fixture: string | null; file: string | null }) => {
  if (options.fixture) {
    const fixturePath = path.join(FIXTURE_DIR, `${options.fixture}.json`);
    return JSON.parse(await fs.readFile(fixturePath, 'utf8')) as unknown;
  }

  if (options.file) {
    const filePath = path.resolve(process.cwd(), options.file);
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
  }

  throw new Error('No input specified. Use --fixture=<name> or --file=<path>.');
};

const printHumanReport = (report: ReturnType<typeof runSaveMigrations>['report']) => {
  console.log('=== Save Migration Dry Run ===');
  console.log(`Source version: ${report.sourceVersion} (${report.sourceVersionKind})`);
  console.log(`Target version: ${report.targetVersion}`);
  console.log(`Would final version be: ${report.finalVersion}`);
  console.log(`Transform steps: ${report.appliedTransformSteps.join(', ') || 'none'}`);
  console.log(`Report-only steps: ${report.reportOnlySteps.join(', ') || 'none'}`);
  console.log(`Planned transforms: ${report.plannedTransformSteps.join(', ') || 'none'}`);
  console.log(`Warnings: ${report.warnings.length} | Errors: ${report.errors.length}`);
  report.warnings.forEach((warning) => {
    console.log(`- [${warning.severity}] ${warning.code} (${warning.ownerPacket}) ${warning.message}`);
  });
  const planned = report.stepResults.flatMap((step) => step.plannedMutations);
  if (planned.length > 0) {
    console.log('Planned mutations:');
    planned.forEach((entry) => {
      console.log(`- (${entry.ownerPacket}) ${entry.action} ${entry.path}: ${entry.reason}`);
    });
  }
};

async function run(): Promise<void> {
  const options = parseArgs();
  const save = await loadInputSave(options);

  const result = runSaveMigrations(save, {
    mode: 'dry-run',
  });

  if (options.json) {
    console.log(JSON.stringify(result.report, null, 2));
    return;
  }

  printHumanReport(result.report);
}

run().catch((error) => {
  console.error('[MigrationDryRun] Failed');
  console.error(error);
  process.exit(1);
});
