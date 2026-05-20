import {
  buildRuntimeDiagnosticsReport,
  classifyRuntimeDiagnosticsScenario,
  renderRuntimeDiagnosticsReport,
  type RuntimeDiagnosticsReport,
  type RuntimeDiagnosticsScenarioClassification,
} from '../../src/services/diagnostics/release/runtimeDiagnosticsReport.js';
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

type ScenarioName = 'clean_baseline' | 'seeded_runtime_residue' | 'content_failure_snapshot';

type RuntimeDiagnosticsScenarioEntry = RuntimeDiagnosticsReport & RuntimeDiagnosticsScenarioClassification;

const SCENARIO_EXPECTATIONS: Record<ScenarioName, { expectedNegative: boolean; expectedIssueIds: readonly string[]; intent: string }> = {
  clean_baseline: {
    expectedNegative: false,
    expectedIssueIds: [],
    intent: 'Loaded clean runtime state should produce no error-level diagnostics.',
  },
  seeded_runtime_residue: {
    expectedNegative: true,
    expectedIssueIds: ['fragment_invalid_bad_tech', 'inventory_item_invalid_bad_item', 'manual_missing_tech_0'],
    intent: 'Seeded residue fixture proves safe-repair diagnostics catch known repairable save residue.',
  },
  content_failure_snapshot: {
    expectedNegative: true,
    expectedIssueIds: ['content_not_loaded', 'manual_missing_tech_0'],
    intent: 'Content-failure fixture proves startup/content diagnostics surface missing loaded content and invalid manual residue.',
  },
};

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

function withScenarioClassification(
  scenarioName: ScenarioName,
  report: RuntimeDiagnosticsReport,
): RuntimeDiagnosticsScenarioEntry {
  const expectation = SCENARIO_EXPECTATIONS[scenarioName];
  return {
    ...report,
    ...classifyRuntimeDiagnosticsScenario(report, expectation),
    notes: [
      ...report.notes,
      `Scenario intent: ${expectation.intent}`,
    ],
  };
}

async function buildScenarioReports(options: CliOptions): Promise<Record<ScenarioName, RuntimeDiagnosticsScenarioEntry>> {
  const reports = {} as Record<ScenarioName, RuntimeDiagnosticsScenarioEntry>;

  await seedBaseline();
  reports.clean_baseline = withScenarioClassification(
    'clean_baseline',
    buildRuntimeDiagnosticsReport({ applyRepairs: options.applySafeRepairs }),
  );

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
  reports.seeded_runtime_residue = withScenarioClassification(
    'seeded_runtime_residue',
    buildRuntimeDiagnosticsReport({ applyRepairs: options.applySafeRepairs }),
  );

  await seedBaseline();
  useContentStore.setState({ isLoaded: false });
  reports.content_failure_snapshot = withScenarioClassification(
    'content_failure_snapshot',
    buildRuntimeDiagnosticsReport({ applyRepairs: false }),
  );

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
    blockerScenarioCount: Object.values(scenarioReports).filter((report) => report.scenarioStatus === 'BLOCKER').length,
  };

  if (options.json) {
    console.log(JSON.stringify(aggregated, null, 2));
  } else {
    console.log('=== Runtime Diagnostics Scenario Suite ===');
    for (const [name, report] of Object.entries(scenarioReports)) {
      console.log('');
      console.log(`Scenario: ${name}`);
      console.log(`Classification: ${report.scenarioStatus}`);
      console.log(`Release-gate blocking: ${report.releaseGateBlocking ? 'yes' : 'no'}`);
      console.log(`Expectation: ${report.summary}`);
      console.log(renderRuntimeDiagnosticsReport(report));
    }
  }

  if (options.failOnErrors) {
    const hasBlockingScenario = Object.values(scenarioReports).some((report) => report.scenarioStatus === 'BLOCKER');
    if (hasBlockingScenario) process.exit(2);
  }
}

run().catch((error) => {
  console.error('[runRuntimeDiagnostics] Failed');
  console.error(error);
  process.exit(1);
});
