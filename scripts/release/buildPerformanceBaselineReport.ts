import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type BudgetStatus = 'pass' | 'fail' | 'warning' | 'baseline-only' | 'not-measured';

type CliOptions = {
  root: string;
  json: boolean;
  write: boolean;
  help: boolean;
};

type StaticMatch = {
  path: string;
  line: number;
  text: string;
};

type BuildChunk = {
  file: string;
  bytes: number;
  kind: 'js' | 'css' | 'asset' | 'other';
  over300kb: boolean;
  over500kb: boolean;
};

type PerformanceBaselineReportJson = {
  generatedAt: string;
  package: {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  environment: {
    nodeVersion: string;
    npmVersion?: string;
    platform: string;
    cwd: string;
  };
  git?: {
    branch?: string;
    dirty?: boolean;
    statusPreview?: string[];
  };
  previousPacketVerification: {
    status: 'pass' | 'warning' | 'blocked' | 'not-found';
    inspectedFiles: string[];
    notes: string[];
  };
  plugins: Record<string, {
    available: boolean;
    used: boolean;
    notes: string[];
  }>;
  staticAudit: {
    sourceFileCounts: Record<string, number>;
    largestSourceFiles: Array<{ path: string; bytes: number }>;
    contentFiles: Array<{ path: string; bytes: number }>;
    largeContentFiles: Array<{ path: string; bytes: number }>;
    requestAnimationFrameUsages: StaticMatch[];
    clockLoopUsages: StaticMatch[];
    bareStoreSubscriptions: StaticMatch[];
    jsonStringifyInReactOwners: StaticMatch[];
    lazyImportInventory: StaticMatch[];
    visualRuntimeImports: StaticMatch[];
    localStorageWrites: StaticMatch[];
  };
  buildInventory: {
    distExists: boolean;
    chunks: BuildChunk[];
    warnings: string[];
  };
  runtimeScenarios?: Record<string, unknown>;
  budgets: Array<{
    id: string;
    label: string;
    target: string;
    status: BudgetStatus;
    evidence: string;
  }>;
  commandsRun: Array<{
    command: string;
    status: 'pass' | 'fail' | 'skipped';
    notes?: string;
  }>;
  nextRecommendedPrompt: string;
};

const PREVIOUS_PACKET_FILES = [
  'AGENTS.md',
  'docs/release/current_implementation_baseline.md',
  'docs/release/current_implementation_baseline.json',
  'docs/release/build_warning_inventory.md',
  'docs/release/performance_smoke_checklist.md',
  'docs/release/release_handoff_bundle.md',
  'docs/release/go_no_go_checklist.md',
  'docs/release/known_issues.md',
  'docs/release/waiver_policy.md',
  'docs/codex/PROMPT_STYLE.md',
  'docs/codex/TASK_QUEUE.md',
] as const;

const PERF_PLUGIN_NAMES = [
  'Browser',
  'Linear',
  'Game Studio',
  'Superpowers',
  'GitHub',
  'Sentry',
  'CodeRabbit',
  'HyperFrames by HeyGen',
  'Codex Security',
] as const;

const STORE_SUBSCRIPTION_PATTERN = /\buse(?:Game|UI|Combat|Content|Technique|Inventory|Equipment|Trial|Bounty|Expedition|MedicinePouch|Cultivation|Prestige)Store\(\)/;
const JSON_OWNER_PATH_PATTERN = /(?:Owner\.tsx$|src\/components\/.*\.tsx$|src\/ui\/.*\.tsx$)/;

function parseArgs(argv: string[]): CliOptions {
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  return {
    root: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    json: argv.includes('--json'),
    write: argv.includes('--write'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp(): void {
  console.log('Usage: buildPerformanceBaselineReport [--write] [--json] [--root=<path>]');
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

function relative(root: string, target: string): string {
  return normalizePath(path.relative(root, target));
}

function exists(root: string, rel: string): boolean {
  return fs.existsSync(path.resolve(root, rel));
}

function safeReadJson(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function runPreview(command: string, args: string[], root: string): string | undefined {
  try {
    const executable = process.platform === 'win32' && command === 'npm' ? 'cmd.exe' : command;
    const executableArgs = process.platform === 'win32' && command === 'npm'
      ? ['/d', '/s', '/c', [command, ...args].join(' ')]
      : args;
    return execFileSync(executable, executableArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      maxBuffer: 256 * 1024,
    }).trim();
  } catch {
    return undefined;
  }
}

function listFiles(root: string, relDir: string): string[] {
  const start = path.resolve(root, relDir);
  if (!fs.existsSync(start) || !fs.statSync(start).isDirectory()) return [];
  const stack = [start];
  const files: string[] = [];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        stack.push(child);
      } else if (entry.isFile()) {
        files.push(child);
      }
    }
  }
  return files.sort();
}

function buildPackage(root: string): PerformanceBaselineReportJson['package'] {
  const packageJson = safeReadJson(path.resolve(root, 'package.json'));
  const dependencies = typeof packageJson.dependencies === 'object' && packageJson.dependencies
    ? packageJson.dependencies as Record<string, string>
    : {};
  const devDependencies = typeof packageJson.devDependencies === 'object' && packageJson.devDependencies
    ? packageJson.devDependencies as Record<string, string>
    : {};
  return {
    name: typeof packageJson.name === 'string' ? packageJson.name : 'unknown',
    version: typeof packageJson.version === 'string' ? packageJson.version : 'unknown',
    dependencies,
    devDependencies,
  };
}

function verifyPreviousPacket(root: string): PerformanceBaselineReportJson['previousPacketVerification'] {
  const inspectedFiles = PREVIOUS_PACKET_FILES.filter((file) => exists(root, file));
  const missing = PREVIOUS_PACKET_FILES.filter((file) => !exists(root, file));
  const notes: string[] = [];
  if (missing.length > 0) notes.push(`Missing optional/baseline docs: ${missing.join(', ')}`);
  if (!exists(root, 'docs/release/performance_budget.md')) {
    notes.push('performance_budget.md was not present before Mega Prompt 1.');
  }
  if (!exists(root, 'scripts/release/buildPerformanceBaselineReport.ts')) {
    notes.push('Performance baseline report script is being introduced by Mega Prompt 1.');
  }
  return {
    status: inspectedFiles.length === 0 ? 'not-found' : missing.includes('AGENTS.md') ? 'blocked' : missing.length > 0 ? 'warning' : 'pass',
    inspectedFiles,
    notes,
  };
}

function findMatches(root: string, files: string[], pattern: RegExp, filterPath?: (rel: string) => boolean): StaticMatch[] {
  const matches: StaticMatch[] = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (filterPath && !filterPath(rel)) continue;
    const text = fs.readFileSync(file, 'utf8');
    text.split(/\r?\n/).forEach((line, index) => {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push({
          path: rel,
          line: index + 1,
          text: line.trim().slice(0, 220),
        });
      }
    });
  }
  return matches;
}

function buildStaticAudit(root: string): PerformanceBaselineReportJson['staticAudit'] {
  const sourceFiles = listFiles(root, 'src');
  const sourceFileCounts: Record<string, number> = {};
  const largestSourceFiles = sourceFiles
    .map((file) => {
      const ext = path.extname(file) || '<none>';
      sourceFileCounts[ext] = (sourceFileCounts[ext] ?? 0) + 1;
      return { path: relative(root, file), bytes: fs.statSync(file).size };
    })
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);

  const contentFiles = listFiles(root, 'public/cultivation_idle_content_bible_v1_config')
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ path: relative(root, file), bytes: fs.statSync(file).size }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    sourceFileCounts,
    largestSourceFiles,
    contentFiles,
    largeContentFiles: contentFiles.filter((file) => file.bytes >= 100 * 1024),
    requestAnimationFrameUsages: findMatches(root, sourceFiles, /\brequestAnimationFrame\b/),
    clockLoopUsages: findMatches(root, sourceFiles, /\b(setInterval|setTimeout)\b/),
    bareStoreSubscriptions: findMatches(root, sourceFiles.filter((file) => file.endsWith('.tsx')), STORE_SUBSCRIPTION_PATTERN),
    jsonStringifyInReactOwners: findMatches(
      root,
      sourceFiles.filter((file) => /\.(tsx|ts)$/.test(file)),
      /\bJSON\.stringify\b/,
      (rel) => JSON_OWNER_PATH_PATTERN.test(rel),
    ),
    lazyImportInventory: findMatches(root, sourceFiles, /\b(React\.lazy|lazy\s*\(|Suspense|import\s*\()/),
    visualRuntimeImports: findMatches(root, sourceFiles, /\b(framer-motion|motion\/react|react-spring|pixi\.js|@pixi\/react)\b/),
    localStorageWrites: findMatches(root, sourceFiles, /\blocalStorage\.setItem\b/),
  };
}

function classifyChunk(file: string): BuildChunk['kind'] {
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'js';
  if (file.endsWith('.css')) return 'css';
  if (/\.(png|jpg|jpeg|webp|gif|svg|woff2?)$/i.test(file)) return 'asset';
  return 'other';
}

function buildBuildInventory(root: string): PerformanceBaselineReportJson['buildInventory'] {
  const distDir = path.resolve(root, 'dist');
  const distExists = fs.existsSync(distDir) && fs.statSync(distDir).isDirectory();
  const chunks = distExists
    ? listFiles(root, 'dist')
      .map((file) => {
        const bytes = fs.statSync(file).size;
        return {
          file: relative(root, file),
          bytes,
          kind: classifyChunk(file),
          over300kb: bytes > 300 * 1024,
          over500kb: bytes > 500 * 1024,
        };
      })
      .sort((a, b) => b.bytes - a.bytes)
    : [];
  const warnings = chunks
    .filter((chunk) => chunk.kind === 'js' && chunk.over500kb)
    .map((chunk) => `${chunk.file} is over 500 KiB uncompressed.`);
  return { distExists, chunks, warnings };
}

function buildBudgets(report: Pick<PerformanceBaselineReportJson, 'staticAudit' | 'buildInventory'>): PerformanceBaselineReportJson['budgets'] {
  return [
    {
      id: 'idle-react-commits',
      label: 'Idle React commits',
      target: 'No global shell component should commit at requestAnimationFrame cadence while idle.',
      status: 'not-measured',
      evidence: 'Runtime scenario capture is required; render counters are available when ?ciPerf=1 is enabled.',
    },
    {
      id: 'idle-store-writes',
      label: 'Idle store writes',
      target: 'Core stores should not write more than planned cadence after the scheduler refactor.',
      status: 'baseline-only',
      evidence: 'Mega Prompt 1 records current behavior without failing on it.',
    },
    {
      id: 'long-tasks-loaf',
      label: 'Long tasks / LoAF',
      target: 'No common interaction should create >50ms long tasks/long animation frames in optimized state.',
      status: 'not-measured',
      evidence: 'PerformanceObserver data appears in runtime snapshots when supported by the browser.',
    },
    {
      id: 'initial-chunks',
      label: 'Initial chunks',
      target: 'No unexpected initial app chunk over 500KB uncompressed; heavy features lazy.',
      status: report.buildInventory.chunks.some((chunk) => chunk.kind === 'js' && chunk.over500kb) ? 'warning' : 'baseline-only',
      evidence: `${report.buildInventory.chunks.filter((chunk) => chunk.kind === 'js' && chunk.over500kb).length} JS chunks over 500 KiB found in dist.`,
    },
    {
      id: 'content-startup',
      label: 'Content startup',
      target: 'Core startup should avoid heavy optional records after future content split.',
      status: report.staticAudit.largeContentFiles.length > 0 ? 'warning' : 'baseline-only',
      evidence: `${report.staticAudit.largeContentFiles.length} runtime content files over 100 KiB found.`,
    },
    {
      id: 'save-cost',
      label: 'Save cost',
      target: 'No repeated direct save bursts after future SaveScheduler.',
      status: 'not-measured',
      evidence: 'Save gather/stringify/encrypt/localStorage timers are available in runtime snapshots.',
    },
  ];
}

function buildPluginSummary(): PerformanceBaselineReportJson['plugins'] {
  return Object.fromEntries(PERF_PLUGIN_NAMES.map((name) => [name, {
    available: false,
    used: false,
    notes: ['Static release script cannot query Codex plugin state; see packet handoff for live plugin usage.'],
  }]));
}

export function buildPerformanceBaselineReport(root: string): PerformanceBaselineReportJson {
  const packageInfo = buildPackage(root);
  const npmVersion = runPreview('npm', ['--version'], root);
  const gitBranch = runPreview('git', ['branch', '--show-current'], root);
  const gitStatus = runPreview('git', ['status', '--short'], root);
  const statusPreview = gitStatus ? gitStatus.split(/\r?\n/).filter(Boolean).slice(0, 30) : [];
  const staticAudit = buildStaticAudit(root);
  const buildInventory = buildBuildInventory(root);
  return {
    generatedAt: new Date().toISOString(),
    package: packageInfo,
    environment: {
      nodeVersion: process.version,
      npmVersion,
      platform: process.platform,
      cwd: path.basename(root),
    },
    git: gitBranch || statusPreview.length > 0
      ? { branch: gitBranch, dirty: statusPreview.length > 0, statusPreview }
      : undefined,
    previousPacketVerification: verifyPreviousPacket(root),
    plugins: buildPluginSummary(),
    staticAudit,
    buildInventory,
    budgets: buildBudgets({ staticAudit, buildInventory }),
    commandsRun: [
      {
        command: 'npm run release:performance-baseline',
        status: 'pass',
        notes: 'This command generated the static baseline report.',
      },
    ],
    nextRecommendedPrompt: 'Mega Prompt 2: fixed-step SimulationScheduler and removal of authoritative gameplay publication from requestAnimationFrame.',
  };
}

export function renderPerformanceBaselineMarkdown(report: PerformanceBaselineReportJson): string {
  const lines: string[] = [];
  lines.push('# Cultivation Idle Performance Baseline Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Package: ${report.package.name} ${report.package.version}`);
  lines.push(`Node: ${report.environment.nodeVersion}`);
  if (report.environment.npmVersion) lines.push(`npm: ${report.environment.npmVersion}`);
  if (report.git) {
    lines.push(`Branch: ${report.git.branch ?? 'unknown'}`);
    lines.push(`Dirty: ${report.git.dirty ? 'yes' : 'no'}`);
  }
  lines.push('');
  lines.push('## Previous Packet Verification');
  lines.push(`Status: ${report.previousPacketVerification.status}`);
  report.previousPacketVerification.inspectedFiles.forEach((file) => lines.push(`- ${file}`));
  report.previousPacketVerification.notes.forEach((note) => lines.push(`- ${note}`));
  lines.push('');
  lines.push('## Static Findings');
  lines.push(`- Runtime content files: ${report.staticAudit.contentFiles.length}`);
  lines.push(`- Largest content file: ${report.staticAudit.contentFiles[0]?.path ?? 'none'} (${report.staticAudit.contentFiles[0]?.bytes ?? 0} bytes)`);
  lines.push(`- requestAnimationFrame usages: ${report.staticAudit.requestAnimationFrameUsages.length}`);
  lines.push(`- bare store subscriptions: ${report.staticAudit.bareStoreSubscriptions.length}`);
  lines.push(`- JSON.stringify owner/component usages: ${report.staticAudit.jsonStringifyInReactOwners.length}`);
  lines.push(`- lazy/dynamic import signals: ${report.staticAudit.lazyImportInventory.length}`);
  lines.push('');
  lines.push('### Largest Source Files');
  report.staticAudit.largestSourceFiles.forEach((file) => lines.push(`- ${file.path}: ${file.bytes} bytes`));
  lines.push('');
  lines.push('### Bundle Chunks');
  if (!report.buildInventory.distExists) {
    lines.push('- dist not present; run build to refresh chunk inventory.');
  } else {
    report.buildInventory.chunks.slice(0, 15).forEach((chunk) => {
      lines.push(`- ${chunk.file}: ${chunk.bytes} bytes (${chunk.kind}${chunk.over500kb ? ', >500KiB' : chunk.over300kb ? ', >300KiB' : ''})`);
    });
  }
  lines.push('');
  lines.push('## Runtime Scenario Findings');
  lines.push('- Not measured by the static report. Use `?ciPerf=1` and `window.__CI_PERF__.export()` for runtime snapshots.');
  lines.push('');
  lines.push('## Budget Status');
  lines.push('| Budget | Status | Evidence |');
  lines.push('| --- | --- | --- |');
  report.budgets.forEach((budget) => {
    lines.push(`| ${budget.label} | ${budget.status} | ${budget.evidence.replace(/\|/g, '\\|')} |`);
  });
  lines.push('');
  lines.push('## Plugin Evidence');
  Object.entries(report.plugins).forEach(([name, plugin]) => {
    lines.push(`- ${name}: ${plugin.used ? 'used' : plugin.available ? 'available-not-used' : 'not captured by static script'}`);
  });
  lines.push('');
  lines.push('## Next Actions');
  lines.push(`Proceed to ${report.nextRecommendedPrompt}`);
  lines.push('');
  return lines.join('\n');
}

export function writePerformanceBaselineReport(root: string, report: PerformanceBaselineReportJson): void {
  const outDir = path.resolve(root, 'docs', 'release');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'performance_baseline_report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'performance_baseline_report.md'), `${renderPerformanceBaselineMarkdown(report).trimEnd()}\n`, 'utf8');
}

const options = parseArgs(process.argv.slice(2));
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isMain) {
  if (options.help) {
    printHelp();
  } else {
    const report = buildPerformanceBaselineReport(options.root);
    if (options.write) writePerformanceBaselineReport(options.root, report);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderPerformanceBaselineMarkdown(report));
  }
}
