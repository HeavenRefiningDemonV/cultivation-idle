#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  buildBalanceTelemetryCsvFiles,
  buildBalanceTelemetryExportEnvelope,
  parseBalanceTelemetryInput,
  serializeBalanceTelemetryExport,
  summarizeBalanceTelemetryReport,
} from '../src/services/diagnostics/balanceTelemetryExport.ts';

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node --experimental-strip-types scripts/exportBalanceTelemetry.ts --input <path> [--out-dir <path>]');
  process.exit(0);
}

const inputPath = getArg('--input');
if (!inputPath) {
  console.error('Missing --input <path>');
  process.exit(1);
}

const outputDir = resolve(getArg('--out-dir') ?? join(dirname(inputPath), `${basename(inputPath).replace(/\.[^.]+$/, '')}_balance_export`));

try {
  const raw = readFileSync(resolve(inputPath), 'utf8');
  const parsed = JSON.parse(raw);
  const events = parseBalanceTelemetryInput(parsed);
  const envelope = buildBalanceTelemetryExportEnvelope({
    events,
    balanceCaptureEnabled: parsed?.capture?.balanceCaptureEnabled ?? parsed?.telemetry?.balanceCaptureEnabled ?? true,
    maxBalanceEvents: parsed?.capture?.maxBalanceEvents ?? parsed?.telemetry?.maxBalanceEvents ?? 5000,
    app: parsed?.app,
  });

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'balance_telemetry_export.json'), serializeBalanceTelemetryExport(envelope));
  const csvFiles = buildBalanceTelemetryCsvFiles(events);
  Object.entries(csvFiles).forEach(([name, content]) => writeFileSync(join(outputDir, name), content));
  writeFileSync(join(outputDir, 'balance_summary.txt'), summarizeBalanceTelemetryReport(envelope.summary));
  console.log(`Exported balance telemetry to ${outputDir}`);
} catch (error) {
  console.error(`Failed to export balance telemetry: ${String(error)}`);
  process.exit(1);
}
