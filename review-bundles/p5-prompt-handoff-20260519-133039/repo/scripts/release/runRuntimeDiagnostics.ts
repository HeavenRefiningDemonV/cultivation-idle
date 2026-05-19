import { buildRuntimeDiagnosticsReport, renderRuntimeDiagnosticsReport } from '../../src/services/diagnostics/release/runtimeDiagnosticsReport.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useManualSatchelStore } from '../../src/stores/manualSatchelStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../../tests/helpers/economy/setupEconomicRuntimeScenario.js';

interface CliOptions {
  json: boolean;
  applySafeRepairs: boolean;
  failOnErrors: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    json: argv.includes('--json'),
    applySafeRepairs: argv.includes('--apply-safe-repairs'),
    failOnErrors: argv.includes('--fail-on-errors'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: runRuntimeDiagnostics [--json] [--apply-safe-repairs] [--fail-on-errors]');
}

async function seedBaseline() {
  resetEconomicRuntimeStores();
  const content = await getValidatedEconomicContent();
  primeContentStore(content);
}

async function buildScenarioReports(options: CliOptions) {
  const reports: Record<string, ReturnType<typeof buildRuntimeDiagnosticsReport>> = {};

  await seedBaseline();
  reports.clean_baseline = buildRuntimeDiagnosticsReport({ applyRepairs: options.applySafeRepairs });

  await seedBaseline();
  useInventoryStore.setState((state) => {
    state.items.bad_item = -10;
  });
  useTechCollectionStore.setState((state) => {
    state.fragments.bad_tech = -2;
  });
  useManualSatchelStore.setState((state) => {
    state.manuals.push({ id: 'bad_manual', techId: '' as never, grade: 'mortal', rarity: 'common', stackCount: 1, earnedAt: Date.now(), source: 'debug' } as never);
  });
  reports.seeded_runtime_residue = buildRuntimeDiagnosticsReport({ applyRepairs: options.applySafeRepairs });

  await seedBaseline();
  useContentStore.setState({ isLoaded: false });
  reports.content_failure_snapshot = buildRuntimeDiagnosticsReport({ applyRepairs: false });

  return reports;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const scenarioReports = await buildScenarioReports(options);
  const aggregated = {
    schemaVersion: '7.4c-runtime-cli',
    generatedAt: Date.now(),
    scenarios: scenarioReports,
  };

  if (options.json) {
    console.log(JSON.stringify(aggregated, null, 2));
  } else {
    console.log('=== Runtime Diagnostics Scenario Suite ===');
    for (const [name, report] of Object.entries(scenarioReports)) {
      console.log('');
      console.log(`Scenario: ${name}`);
      console.log(renderRuntimeDiagnosticsReport(report));
    }
  }

  if (options.failOnErrors) {
    const hasErrors = Object.values(scenarioReports).some((report) => report.errorCount > 0);
    if (hasErrors) process.exit(2);
  }
}

run().catch((error) => {
  console.error('[runRuntimeDiagnostics] Failed');
  console.error(error);
  process.exit(1);
});
