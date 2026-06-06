import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildPrestigeEffectAuditReport } from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';

type CliOptions = {
  json: boolean;
  write: boolean;
};

const parseArgs = (argv: string[]): CliOptions => ({
  json: argv.includes('--json'),
  write: argv.includes('--write'),
});

const readJson = async <T>(filePath: string): Promise<T> =>
  JSON.parse(await fs.readFile(filePath, 'utf8')) as T;

const renderMarkdown = (report: ReturnType<typeof buildPrestigeEffectAuditReport>): string => {
  const status = report.blockers.length > 0 ? 'NO_GO' : report.unknownBlockedCount > 0 ? 'WARN' : 'GO';
  const rows = report.rows.map((row) => (
    `| ${row.upgradeId} | ${row.status} | ${row.purchaseAllowed ? 'yes' : 'no'} | ${row.runtimeConsumers.join(', ') || 'none'} | ${row.remediation} |`
  ));
  return [
    '# Prestige Runtime Effect Audit',
    '',
    `Generated: ${new Date(report.generatedAt).toISOString()}`,
    `Status: ${status}`,
    '',
    '## Summary',
    `- Visible live: ${report.visibleLiveCount}`,
    `- Deferred: ${report.deferredCount}`,
    `- Hidden unsupported: ${report.hiddenUnsupportedCount}`,
    `- Unknown blocked: ${report.unknownBlockedCount}`,
    '',
    '## Rows',
    '| Upgrade | Status | Purchasable | Runtime consumers | Remediation |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Blockers',
    ...(report.blockers.length > 0 ? report.blockers.map((entry) => `- ${entry}`) : ['- None']),
    '',
    '## Warnings',
    ...(report.warnings.length > 0 ? report.warnings.map((entry) => `- ${entry}`) : ['- None']),
    '',
  ].join('\n');
};

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const prestigeStore = await readJson(path.join(root, 'public', 'cultivation_idle_content_bible_v1_config', 'prestige_store.json'));
  const report = buildPrestigeEffectAuditReport({ prestige_store: prestigeStore } as never);

  if (options.write) {
    const markdownPath = path.join(root, 'docs', 'release', 'p4_prestige_runtime_effect_audit.md');
    const jsonPath = path.join(root, 'docs', 'release', 'p4_prestige_runtime_effect_audit.json');
    await fs.writeFile(markdownPath, renderMarkdown(report), 'utf8');
    await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(renderMarkdown(report));
}

run().catch((error) => {
  console.error('[prestigeRuntimeEffectAudit] Failed');
  console.error(error);
  process.exit(1);
});
