import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  RELEASE_MIGRATION_FIXTURE_CATALOG,
  getReleaseMigrationFixtureDefinition,
} from '../../src/save/migrations/releaseMigrationFixtureCatalog.js';
import {
  buildReleaseMigrationMatrixReport,
  renderReleaseMigrationMatrixReport,
  serializeReleaseMigrationMatrixReport,
} from '../../src/save/migrations/migrationMatrix.js';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

type CliOptions = {
  json: boolean;
  fixtureId: string | null;
  failOnDrift: boolean;
  help: boolean;
};

const parseArgs = (argv: string[]): CliOptions => {
  const fixtureFlag = argv.find((arg) => arg.startsWith('--fixture='));
  return {
    json: argv.includes('--json'),
    fixtureId: fixtureFlag?.split('=')[1] ?? null,
    failOnDrift: argv.includes('--fail-on-drift'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
};

const printHelp = () => {
  console.log('Usage: runMigrationMatrix [--json] [--fixture=<id>] [--fail-on-drift]');
};

async function loadFixtureFromCatalog(fixtureId: string) {
  const definition = getReleaseMigrationFixtureDefinition(fixtureId);
  if (!definition) {
    throw new Error(`Unknown fixture id: ${fixtureId}`);
  }

  const fixturePath = path.join(FIXTURE_DIR, definition.fileName);
  let raw: string;
  try {
    raw = await fs.readFile(fixturePath, 'utf8');
  } catch (error) {
    throw new Error(`Fixture file missing for ${fixtureId}: ${fixturePath}. ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    fixtureId,
    save: JSON.parse(raw) as Record<string, unknown>,
  };
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const selectedCatalog = options.fixtureId
    ? RELEASE_MIGRATION_FIXTURE_CATALOG.filter((entry) => entry.fixtureId === options.fixtureId)
    : RELEASE_MIGRATION_FIXTURE_CATALOG;

  if (selectedCatalog.length === 0) {
    throw new Error(`No fixtures selected. Unknown fixture id: ${options.fixtureId}`);
  }

  const fixtures = await Promise.all(selectedCatalog.map((entry) => loadFixtureFromCatalog(entry.fixtureId)));
  const report = buildReleaseMigrationMatrixReport({ fixtures, catalog: selectedCatalog });

  if (options.json) {
    console.log(serializeReleaseMigrationMatrixReport(report));
  } else {
    console.log(renderReleaseMigrationMatrixReport(report));
  }

  if (options.failOnDrift && !report.overallPass) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('[runMigrationMatrix] Failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
