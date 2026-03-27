#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildBalanceTelemetryReport,
  parseBalanceTelemetryInput,
  summarizeBalanceTelemetryReport,
} from '../src/services/diagnostics/balanceTelemetryExport.ts';

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node --experimental-strip-types scripts/summarizeBalanceTelemetry.ts --input <path> [--json]');
  process.exit(0);
}

const inputPath = getArg('--input');
if (!inputPath) {
  console.error('Missing --input <path>');
  process.exit(1);
}

try {
  const raw = readFileSync(resolve(inputPath), 'utf8');
  const parsed = JSON.parse(raw);
  const events = parseBalanceTelemetryInput(parsed);
  const report = buildBalanceTelemetryReport(events);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(summarizeBalanceTelemetryReport(report));
  }
} catch (error) {
  console.error(`Failed to summarize balance telemetry: ${String(error)}`);
  process.exit(1);
}
