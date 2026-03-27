import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildBuildAuditReport,
  renderBuildAuditReport,
} from '../../src/services/diagnostics/release/buildAuditReport.js';

interface CliOptions {
  json: boolean;
  failOnBlockers: boolean;
  writeDoc: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    json: argv.includes('--json'),
    failOnBlockers: argv.includes('--fail-on-blockers'),
    writeDoc: argv.includes('--write-doc'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: captureBuildWarnings [--json] [--fail-on-blockers] [--write-doc]');
}

function renderInventoryDoc(report: ReturnType<typeof buildBuildAuditReport>): string {
  const lines: string[] = [];
  lines.push('# Build Warning Inventory (Packet 7.4a)');
  lines.push('');
  lines.push(`- Generated: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`- Build passed: ${report.buildPassed}`);
  lines.push(`- Blockers: ${report.blockerCount}`);
  lines.push(`- Warnings: ${report.warningCount}`);
  lines.push('');
  lines.push('| id | level | source family | summary | disposition | owner | notes |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');

  if (report.entries.length === 0) {
    lines.push('| build_clean_inventory | warning | unknown | No warning/blocker entries captured in this audit run. | acceptable_for_semester_rc | release_engineering | Inventory currently clean. |');
  } else {
    for (const entry of report.entries) {
      lines.push(`| ${entry.id} | ${entry.level} | ${entry.sourceFamily} | ${entry.summary.replace(/\|/g, '\\|')} | ${entry.disposition} | ${entry.owner} | ${entry.fixNotes.replace(/\|/g, '\\|')} |`);
    }
  }

  return lines.join('\n');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  let combinedOutput = '';
  let buildPassed = true;

  try {
    combinedOutput = execSync('npm run build', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    buildPassed = false;
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const stdout = String((error as { stdout?: string }).stdout ?? '');
      const stderr = String((error as { stderr?: string }).stderr ?? '');
      combinedOutput = `${stdout}\n${stderr}`;
    } else {
      combinedOutput = String(error);
    }
  }

  const report = buildBuildAuditReport({ output: combinedOutput, buildPassed });

  if (options.writeDoc) {
    const doc = renderInventoryDoc(report);
    writeFileSync(path.resolve(process.cwd(), 'docs/release/build_warning_inventory.md'), doc, 'utf8');
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderBuildAuditReport(report));
  }

  if (options.failOnBlockers && report.blockerCount > 0) {
    process.exit(2);
  }
}

run().catch((error) => {
  console.error('[captureBuildWarnings] Failed');
  console.error(error);
  process.exit(1);
});
