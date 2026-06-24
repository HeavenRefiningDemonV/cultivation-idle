import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { buildReleaseGateReport } from '../../src/services/diagnostics/release/releaseGate.js';
import { buildReleaseDecisionDocsFromDefaults } from '../../src/services/diagnostics/release/releaseDecisionDocs.js';
import type { ReleaseGateReport } from '../../src/services/diagnostics/release/releaseGateTypes.js';

// Output dir is overridable via RELEASE_HANDOFF_OUTPUT_DIR so concurrent test invocations write to isolated
// temp dirs instead of racing on the shared docs/release/ files (the source of the flaky-under-load failures).
const OUTPUT_DIR = path.resolve(process.cwd(), process.env.RELEASE_HANDOFF_OUTPUT_DIR ?? 'docs/release');
const OUTPUT_PATHS = {
  checklist: path.join(OUTPUT_DIR, 'go_no_go_checklist.md'),
  signoff: path.join(OUTPUT_DIR, 'signoff_sheet.md'),
  handoff: path.join(OUTPUT_DIR, 'release_handoff_bundle.md'),
} as const;

type CliOptions = {
  dryRun: boolean;
  failOnBlockers: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes('--dry-run'),
    failOnBlockers: argv.includes('--fail-on-blockers'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: buildReleaseHandoffBundle [--dry-run] [--fail-on-blockers] [--help]');
}

function loadStubReportIfPresent(): ReleaseGateReport | null {
  const stubPath = process.env.RELEASE_HANDOFF_STUB_REPORT;
  if (!stubPath) return null;
  return JSON.parse(readFileSync(path.resolve(process.cwd(), stubPath), 'utf8')) as ReleaseGateReport;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = loadStubReportIfPresent() ?? await buildReleaseGateReport();
  const docs = buildReleaseDecisionDocsFromDefaults(report, {
    buildId: process.env.BUILD_ID,
    version: process.env.RELEASE_VERSION,
    commit: process.env.GIT_COMMIT,
  });

  const writtenPaths: string[] = [];
  if (!options.dryRun) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(OUTPUT_PATHS.checklist, docs.checklistMarkdown, 'utf8');
    writeFileSync(OUTPUT_PATHS.signoff, docs.signoffMarkdown, 'utf8');
    writeFileSync(OUTPUT_PATHS.handoff, docs.handoffMarkdown, 'utf8');
    writtenPaths.push(OUTPUT_PATHS.checklist, OUTPUT_PATHS.signoff, OUTPUT_PATHS.handoff);
  }

  console.log(`[release:handoff] decision=${docs.binaryDecision}`);
  console.log(`[release:handoff] acceptedWaivers=${report.acceptedWaiverCount} unresolvedBlockers=${report.unresolvedBlockerCount} pendingManual=${report.pendingManualCount}`);
  if (options.dryRun) {
    console.log('[release:handoff] dry-run: no files written');
  } else {
    writtenPaths.forEach((outputPath) => console.log(`[release:handoff] wrote ${outputPath}`));
  }

  if (options.failOnBlockers && docs.binaryDecision === 'NO_GO') {
    process.exit(2);
  }
}

run().catch((error) => {
  console.error('[release:handoff] Failed');
  console.error(error);
  process.exit(1);
});
