import { buildOfflineRouteReport } from '../../tests/helpers/release/runAlternativeRoute.js';

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
  console.log('Usage: offlineRouteReport [--json]');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = await buildOfflineRouteReport();
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== Offline-heavy Route Report (Packet 7.3b) ===');
  console.log(`Generated: ${new Date(report.generatedAt).toISOString()}`);
  console.log(`Status: ${report.route.status}`);
  console.log(`Elapsed: ${report.route.elapsedMs} ms`);
  console.log(`Offline windows: ${report.route.finalSnapshot.offlineWindowsApplied ?? 0}`);
  console.log('Comparisons:');
  report.topComparisons.forEach((row) => {
    console.log(`- ${row.metric}: route=${String(row.routeValue)} baseline=${String(row.baselineValue)} verdict=${row.verdict}`);
  });
  if (report.route.failures.length > 0) {
    console.log('Failures:');
    report.route.failures.forEach((failure) => console.log(`- ${failure.code}: ${failure.message}`));
  }
}

run().catch((error) => {
  console.error('[offlineRouteReport] Failed');
  console.error(error);
  process.exit(1);
});
