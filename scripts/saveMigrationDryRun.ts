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

const printStepGroup = (
  heading: string,
  entries: Array<{ stepId: string; ownerPacket: string; summary: string }>,
  report: ReturnType<typeof runSaveMigrations>['report'],
) => {
  console.log(heading);
  if (entries.length === 0) {
    console.log('- none');
    return;
  }

  entries.forEach((entry) => {
    const stepResult = report.stepResults.find((result) => result.stepId === entry.stepId);
    console.log(`- ${entry.stepId}`);
    console.log(`  owner packet: ${entry.ownerPacket}`);
    console.log(`  summary: ${entry.summary}`);
    if (stepResult?.touchedFieldPaths.length) {
      console.log(`  touched paths: ${stepResult.touchedFieldPaths.map((touch) => touch.path).join(', ')}`);
    }
    if (stepResult?.plannedMutations.length) {
      stepResult.plannedMutations.forEach((mutation) => {
        console.log(`  planned: (${mutation.ownerPacket}) ${mutation.action} ${mutation.path} — ${mutation.reason}`);
      });
    }
  });
};

const printHumanReport = (report: ReturnType<typeof runSaveMigrations>['report']) => {
  console.log('=== Save Migration Dry Run ===');
  console.log(`Source version: ${report.sourceVersion} (${report.sourceVersionKind})`);
  console.log(`Target version: ${report.targetVersion}`);
  console.log(`Would final version be: ${report.finalVersion}`);
  console.log('');
  printStepGroup('A) Active transforms applied now', report.grouped.activeTransforms, report);
  console.log('');
  printStepGroup('B) Planned transforms for later packets', report.grouped.plannedTransforms, report);
  console.log('');
  printStepGroup('C) Report-only detections', report.grouped.reportOnly, report);
  console.log('');
  console.log('D) Warnings requiring attention');
  if (report.warnings.length === 0 && report.errors.length === 0) {
    console.log('- none');
  } else {
    [...report.warnings, ...report.errors].forEach((entry) => {
      console.log(`- [${entry.severity}] ${entry.code} | owner ${entry.ownerPacket} | ${entry.message}`);
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
