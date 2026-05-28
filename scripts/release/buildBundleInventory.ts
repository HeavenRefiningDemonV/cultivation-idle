import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPerformanceBaselineReport } from './buildPerformanceBaselineReport.ts';

type CliOptions = {
  root: string;
  json: boolean;
  write: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  return {
    root: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    json: argv.includes('--json'),
    write: argv.includes('--write'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function renderBundleMarkdown(report: ReturnType<typeof buildPerformanceBaselineReport>): string {
  const lines: string[] = [];
  lines.push('# Cultivation Idle Bundle Inventory');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Package: ${report.package.name} ${report.package.version}`);
  lines.push('');
  lines.push('## Runtime Content');
  report.staticAudit.contentFiles.forEach((file) => {
    lines.push(`- ${file.path}: ${file.bytes} bytes`);
  });
  lines.push('');
  lines.push('## Dist Chunks');
  if (!report.buildInventory.distExists) {
    lines.push('- dist not present; run `npm run build` before interpreting chunk sizes.');
  } else {
    report.buildInventory.chunks.forEach((chunk) => {
      lines.push(`- ${chunk.file}: ${chunk.bytes} bytes (${chunk.kind}${chunk.over500kb ? ', >500KiB' : chunk.over300kb ? ', >300KiB' : ''})`);
    });
  }
  lines.push('');
  lines.push('## Static Loading Signals');
  lines.push(`- Lazy/dynamic import signals: ${report.staticAudit.lazyImportInventory.length}`);
  lines.push(`- Visual runtime imports: ${report.staticAudit.visualRuntimeImports.length}`);
  lines.push('');
  lines.push('## Full Baseline Context');
  lines.push('Run `npm run release:performance-baseline` for budgets, previous-packet verification, and static smell inventory.');
  lines.push('');
  return lines.join('\n');
}

function writeBundleInventory(root: string, report: ReturnType<typeof buildPerformanceBaselineReport>): void {
  const outDir = path.resolve(root, 'docs', 'release');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'bundle_inventory.json'), `${JSON.stringify({
    generatedAt: report.generatedAt,
    package: report.package,
    staticAudit: {
      contentFiles: report.staticAudit.contentFiles,
      largeContentFiles: report.staticAudit.largeContentFiles,
      lazyImportInventory: report.staticAudit.lazyImportInventory,
      visualRuntimeImports: report.staticAudit.visualRuntimeImports,
    },
    buildInventory: report.buildInventory,
  }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'bundle_inventory.md'), `${renderBundleMarkdown(report).trimEnd()}\n`, 'utf8');
}

const options = parseArgs(process.argv.slice(2));
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isMain) {
  if (options.help) {
    console.log('Usage: buildBundleInventory [--write] [--json] [--root=<path>]');
  } else {
    const report = buildPerformanceBaselineReport(options.root);
    if (options.write) writeBundleInventory(options.root, report);
    console.log(options.json ? JSON.stringify(report.buildInventory, null, 2) : renderBundleMarkdown(report));
  }
}

export { renderBundleMarkdown, writeBundleInventory };
