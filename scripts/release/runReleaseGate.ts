import { buildReleaseGateReport, renderReleaseGateReport, writeKnownIssuesDoc } from '../../src/services/diagnostics/release/releaseGate.js';
import type { ReleaseGateCheckId } from '../../src/services/diagnostics/release/releaseGateTypes.js';
import { RELEASE_GATE_CHECK_IDS } from '../../src/services/diagnostics/release/releaseGateManifest.js';
import { readFileSync } from 'node:fs';

type CliOptions = {
  json: boolean;
  failOnBlockers: boolean;
  only: ReleaseGateCheckId[];
  skip: ReleaseGateCheckId[];
  writeKnownIssues: boolean;
  help: boolean;
};

const parseCsvCheckIds = (value: string | undefined): ReleaseGateCheckId[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is ReleaseGateCheckId => RELEASE_GATE_CHECK_IDS.includes(entry as ReleaseGateCheckId));
};

function parseArgs(argv: string[]): CliOptions {
  const onlyArg = argv.find((arg) => arg.startsWith('--only='))?.split('=')[1];
  const skipArg = argv.find((arg) => arg.startsWith('--skip='))?.split('=')[1];
  return {
    json: argv.includes('--json'),
    failOnBlockers: argv.includes('--fail-on-blockers'),
    only: parseCsvCheckIds(onlyArg),
    skip: parseCsvCheckIds(skipArg),
    writeKnownIssues: argv.includes('--write-known-issues'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: runReleaseGate [--json] [--fail-on-blockers] [--only=<id,id>] [--skip=<id,id>] [--write-known-issues]');
  console.log(`Known checks: ${RELEASE_GATE_CHECK_IDS.join(', ')}`);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const stubResultsPath = process.env.RELEASE_GATE_STUB_RESULTS;
  const adapterOverrides = stubResultsPath
    ? (JSON.parse(readFileSync(stubResultsPath, 'utf8')) as Record<ReleaseGateCheckId, { status: 'pass' | 'fail' | 'warning' | 'pending_manual' }>)
    : null;

  const report = await buildReleaseGateReport({
    only: options.only,
    skip: options.skip,
    adapterOverrides: adapterOverrides
      ? Object.fromEntries(
        Object.entries(adapterOverrides).map(([checkId, value]) => [
          checkId,
          async () => ({
            status: value.status,
            commandOrBuilder: 'stub',
            summary: `stub ${value.status}`,
            blockerCount: value.status === 'fail' ? 1 : 0,
            warningCount: value.status === 'warning' ? 1 : 0,
            pendingManualCount: value.status === 'pending_manual' ? 1 : 0,
            findings: value.status === 'fail'
              ? [{
                findingId: `${checkId}_stub_blocker`,
                checkId: checkId as ReleaseGateCheckId,
                title: 'stub_blocker',
                message: 'stub blocker',
                severity: 'blocker' as const,
                waivable: false,
                sourceKind: 'derived' as const,
              }]
              : [],
            evidence: [],
          }),
        ]),
      ) as never
      : undefined,
  });

  if (options.writeKnownIssues) {
    const outputPath = writeKnownIssuesDoc(report);
    if (!options.json) console.log(`[release:gate] wrote known issues doc: ${outputPath}`);
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderReleaseGateReport(report));
  }

  if (options.failOnBlockers && !report.releaseReady) {
    process.exit(2);
  }
}

run().catch((error) => {
  console.error('[runReleaseGate] Failed');
  console.error(error);
  process.exit(1);
});
