import { promises as fs } from 'node:fs';

import {
  renderBalanceTelemetryValidation,
  serializeBalanceTelemetryValidation,
  validateBalanceTelemetryEvents,
  validateBalanceTelemetryInput,
} from '../src/services/diagnostics/balanceTelemetryValidation.js';
import { runBalanceTelemetryProbe } from '../tests/helpers/telemetry/runBalanceTelemetryProbe.js';

interface CliOptions {
  json: boolean;
  inputPath?: string;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { json: false, help: false };
  for (let idx = 0; idx < argv.length; idx += 1) {
    const arg = argv[idx]!;
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--input') options.inputPath = argv[idx + 1];
    else if (arg.startsWith('--input=')) options.inputPath = arg.split('=')[1];
  }
  return options;
}

function printHelp() {
  console.log('Usage: validateBalanceTelemetry [--input <path>] [--json]');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const result = options.inputPath
    ? validateBalanceTelemetryInput(JSON.parse(await fs.readFile(options.inputPath, 'utf8')))
    : validateBalanceTelemetryEvents(runBalanceTelemetryProbe().balanceEvents);

  if (options.json) {
    console.log(serializeBalanceTelemetryValidation(result));
  } else {
    console.log(renderBalanceTelemetryValidation(result));
  }

  if (!result.passed) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('[validateBalanceTelemetry] Failed');
  console.error(error);
  process.exit(1);
});
