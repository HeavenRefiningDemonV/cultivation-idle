import fs from 'node:fs';
import path from 'node:path';
import {
  buildRuntimeContentManifestReport,
  renderRuntimeContentManifestMarkdown,
} from '../../src/services/diagnostics/release/runtimeContentManifestReport.ts';

type CliOptions = {
  json: boolean;
  write: boolean;
  built: boolean;
  root: string;
  distDir?: string;
  help: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const distArg = argv.find((arg) => arg.startsWith('--dist='));
  return {
    json: argv.includes('--json'),
    write: argv.includes('--write') || argv.includes('--write-doc'),
    built: argv.includes('--built') || argv.includes('--dist'),
    root: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    distDir: distArg ? distArg.slice('--dist='.length) : undefined,
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: validateRuntimeContentManifest [--json] [--write|--write-doc] [--built] [--dist=<path>] [--root=<path>]');
}

function writeDocs(root: string, markdown: string) {
  const outputPath = path.resolve(root, 'docs', 'release', 'runtime_content_manifest.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${markdown.trimEnd()}\n`, 'utf8');
  return outputPath;
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = buildRuntimeContentManifestReport({
    root: options.root,
    built: options.built,
    distDir: options.distDir,
  });
  const markdown = renderRuntimeContentManifestMarkdown(report);

  if (options.write) {
    const outputPath = writeDocs(options.root, markdown);
    if (!options.json) {
      console.log(`[runtime-content-manifest] wrote ${outputPath}`);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(markdown);
  }

  if (report.blockers.length > 0) {
    process.exit(2);
  }
}

run();

