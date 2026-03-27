import {
  buildBalanceRegressionReport,
  renderBalanceRegressionReport,
  serializeBalanceRegressionReport,
} from '../src/systems/balance/balanceRegressionReport.js';
import { runCanonicalBalanceRegressionSuite, type BalanceRegressionSectionId } from '../tests/helpers/balance/runBalanceRegressionSuite.js';

interface CliOptions {
  json: boolean;
  failOnDrift: boolean;
  sectionId?: BalanceRegressionSectionId;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { json: false, failOnDrift: false, help: false };
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    else if (arg === '--fail-on-drift') options.failOnDrift = true;
    else if (arg.startsWith('--section=')) options.sectionId = arg.split('=')[1] as BalanceRegressionSectionId;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }
  return options;
}

function printHelp() {
  console.log('Usage: balanceRegressionReport [--json] [--section=<id>] [--fail-on-drift]');
  console.log('Sections: timing, activities, prep, combat, offline, prestige, telemetry');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const suite = await runCanonicalBalanceRegressionSuite();
  const report = buildBalanceRegressionReport(suite);

  if (options.json) {
    console.log(serializeBalanceRegressionReport(report));
  } else {
    console.log(renderBalanceRegressionReport(report, options.sectionId ? { sectionId: options.sectionId } : undefined));
  }

  if (options.failOnDrift && !report.overallPass) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('[balanceRegressionReport] Failed');
  console.error(error);
  process.exit(1);
});
