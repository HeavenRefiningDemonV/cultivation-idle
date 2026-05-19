import {
  buildRouteComparisonReport,
  renderRouteComparisonReport,
  serializeRouteComparisonReport,
} from '../../src/services/diagnostics/release/routeComparisonReport.js';

interface CliOptions {
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    json: argv.includes('--json'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: routeComparisonReport [--json]');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = await buildRouteComparisonReport();
  if (options.json) {
    console.log(serializeRouteComparisonReport(report));
    return;
  }

  console.log(renderRouteComparisonReport(report));
}

run().catch((error) => {
  console.error('[routeComparisonReport] Failed');
  console.error(error);
  process.exit(1);
});
