import { buildReclaimRouteReport } from '../../tests/helpers/release/runAlternativeRoute.js';

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
  console.log('Usage: reclaimRouteReport [--json]');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = await buildReclaimRouteReport();
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== Reclaim Route Report (Packet 7.3e) ===');
  console.log(`Generated: ${new Date(report.generatedAt).toISOString()}`);
  console.log(`Status: ${report.route.status}`);
  console.log(`Overall pass: ${report.overallPass}`);
  console.log(`Starter spend plan: ${report.starterSpendPlan.join(', ') || 'none'}`);
  console.log('Milestone speedups:');
  console.log(`- foundation: ${report.milestoneTimings.foundationSpeedupRatio}`);
  console.log(`- core: ${report.milestoneTimings.coreSpeedupRatio}`);
  console.log(`- nascent: ${report.milestoneTimings.nascentSpeedupRatio}`);
  if (report.route.failures.length > 0) {
    console.log('Failures:');
    report.route.failures.forEach((failure) => console.log(`- ${failure.code}: ${failure.message}`));
  }
  if (report.route.warnings.length > 0) {
    console.log('Warnings:');
    report.route.warnings.forEach((warning) => console.log(`- ${warning.code}: ${warning.message}`));
  }
}

run().catch((error) => {
  console.error('[reclaimRouteReport] Failed');
  console.error(error);
  process.exit(1);
});
