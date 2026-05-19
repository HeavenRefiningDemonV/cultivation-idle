import {
  buildFreshRunAcceptanceReport,
  renderFreshRunAcceptanceReport,
} from '../../src/services/diagnostics/release/freshRunAcceptanceReport.js';

interface CliOptions {
  json: boolean;
  manualResultsPaths: string[];
  runAutomatedRoutes: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    json: false,
    manualResultsPaths: [],
    runAutomatedRoutes: true,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--skip-automated') {
      options.runAutomatedRoutes = false;
      continue;
    }
    if (arg.startsWith('--manual-results=')) {
      const value = arg.split('=')[1];
      if (value) options.manualResultsPaths.push(value);
    }
  }

  return options;
}

function printHelp() {
  console.log('Usage: freshRunAcceptanceReport [--json] [--manual-results=<path>] [--skip-automated]');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = await buildFreshRunAcceptanceReport({
    manualResultsPaths: options.manualResultsPaths,
    runAutomatedRoutes: options.runAutomatedRoutes,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(renderFreshRunAcceptanceReport(report));
}

run().catch((error) => {
  console.error('[freshRunAcceptanceReport] Failed');
  console.error(error);
  process.exit(1);
});
