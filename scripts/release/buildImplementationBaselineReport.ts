import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildRuntimeContentManifestReport } from '../../src/services/diagnostics/release/runtimeContentManifestReport.ts';
import { RUNTIME_CONTENT_FILE_BY_KEY } from '../../src/content/runtimeContentManifest.ts';

type BaselineStatus = 'pass' | 'fail' | 'warning' | 'info';

type BaselineCheck = {
  id: string;
  title: string;
  status: BaselineStatus;
  summary: string;
  evidence?: string[];
};

type ImplementationBaselineReport = {
  schemaVersion: 'implementation-baseline-v1';
  generatedAt: string;
  cwd: string;
  packageName?: string;
  packageVersion?: string;
  nodeVersion: string;
  npmVersion?: string;
  git?: {
    branch?: string;
    dirty?: boolean;
    statusPreview?: string[];
  };
  checks: BaselineCheck[];
  blockers: BaselineCheck[];
  warnings: BaselineCheck[];
  recommendedNextCommands: string[];
};

type CliOptions = {
  json: boolean;
  write: boolean;
  root: string;
  help: boolean;
};

const CORE_SCRIPT_IDS = [
  'typecheck',
  'check:icons',
  'test',
  'test:contracts',
  'validate:content',
  'progression:report',
  'release:gate',
  'release:runtime-content-manifest',
  'release:implementation-baseline',
] as const;

const RELEASE_CAPTURE_SCRIPT_IDS = [
  'release:gate-trial-exact-p0:capture',
  'release:gate-trial-exact-p0:audit',
  'release:outskirts-exact-p0:capture',
  'release:ruins-exact-p0:capture',
  'release:apothecary-exact-p0:capture',
  'release:runtime-diagnostics',
  'release:migration-matrix',
  'release:offline-route-report',
  'release:reclaim-route-report',
] as const;

const ROOT_PROJECT_FILES = [
  'AGENTS.md',
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'playwright.config.ts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'tsconfig.tests.json',
  'tsconfig.progression-fixtures.json',
  'eslint.config.js',
  'postcss.config.js',
] as const;

const REQUIRED_ROOT_SCRIPT_FILES = [
  'scripts/relativeJsLoader.mjs',
  'scripts/checkNoEmojiIcons.ts',
] as const;

function parseArgs(argv: string[]): CliOptions {
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  return {
    json: argv.includes('--json'),
    write: argv.includes('--write'),
    root: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: buildImplementationBaselineReport [--write] [--json] [--root=<path>]');
}

function exists(root: string, relativePath: string): boolean {
  return fs.existsSync(path.resolve(root, relativePath));
}

function isFile(root: string, relativePath: string): boolean {
  const target = path.resolve(root, relativePath);
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function isDirectory(root: string, relativePath: string): boolean {
  const target = path.resolve(root, relativePath);
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

function countFiles(root: string, dir: string, extension: string): number {
  const target = path.resolve(root, dir);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return 0;
  const stack = [target];
  let count = 0;
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(child);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        count += 1;
      }
    });
  }
  return count;
}

function resolveExecutable(command: string): string {
  if (process.platform === 'win32' && command === 'npm') return 'npm.cmd';
  return command;
}

function runPreview(command: string, args: string[], root: string): string | undefined {
  try {
    const executable = process.platform === 'win32' && command === 'npm' ? 'cmd.exe' : resolveExecutable(command);
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

function readPackageJson(root: string): { raw?: Record<string, unknown>; scripts: Record<string, string>; check: BaselineCheck } {
  const packagePath = path.resolve(root, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return {
      scripts: {},
      check: {
        id: 'package_json',
        title: 'package.json',
        status: 'fail',
        summary: 'package.json is missing.',
        evidence: ['package.json'],
      },
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as Record<string, unknown>;
    const scripts = raw.scripts && typeof raw.scripts === 'object'
      ? raw.scripts as Record<string, string>
      : {};
    return {
      raw,
      scripts,
      check: {
        id: 'package_json',
        title: 'package.json',
        status: 'pass',
        summary: 'package.json parsed successfully.',
        evidence: [`name=${String(raw.name ?? '')}`, `version=${String(raw.version ?? '')}`],
      },
    };
  } catch (error) {
    return {
      scripts: {},
      check: {
        id: 'package_json',
        title: 'package.json',
        status: 'fail',
        summary: `package.json could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
        evidence: ['package.json'],
      },
    };
  }
}

function buildScriptCheck(
  id: string,
  title: string,
  scripts: Record<string, string>,
  required: readonly string[],
  missingStatus: BaselineStatus,
): BaselineCheck {
  const missing = required.filter((scriptId) => !scripts[scriptId]);
  return {
    id,
    title,
    status: missing.length === 0 ? 'pass' : missingStatus,
    summary: missing.length === 0
      ? `All ${required.length} expected scripts are present.`
      : `Missing scripts: ${missing.join(', ')}`,
    evidence: required.map((scriptId) => `${scriptId}: ${scripts[scriptId] ? 'present' : 'missing'}`),
  };
}

function normalizeLocalEntryPath(src: string): string | null {
  const withoutFragment = src.split('#')[0]?.split('?')[0]?.trim() ?? '';
  if (!withoutFragment || /^[a-z]+:\/\//i.test(withoutFragment) || withoutFragment.startsWith('//')) return null;
  return withoutFragment.replace(/^\/+/, '').replace(/\\/g, '/');
}

function extractModuleScriptSrc(indexHtml: string): string | null {
  const scriptTags = indexHtml.match(/<script\b[^>]*>/gi) ?? [];
  for (const tag of scriptTags) {
    if (!/\btype\s*=\s*["']module["']/i.test(tag)) continue;
    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch?.[1]) return srcMatch[1];
  }
  return null;
}

function buildViteEntryCheck(root: string): BaselineCheck {
  const indexPath = path.resolve(root, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return {
      id: 'vite_entry',
      title: 'Vite app entry',
      status: 'fail',
      summary: 'Root index.html is missing; Vite cannot resolve the app entry from an exported bundle.',
      evidence: ['index.html: missing'],
    };
  }

  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (error) {
    return {
      id: 'vite_entry',
      title: 'Vite app entry',
      status: 'fail',
      summary: `Root index.html could not be read: ${error instanceof Error ? error.message : String(error)}`,
      evidence: ['index.html: unreadable'],
    };
  }

  const moduleSrc = extractModuleScriptSrc(html);
  const entryPath = moduleSrc ? normalizeLocalEntryPath(moduleSrc) : null;
  if (!entryPath) {
    return {
      id: 'vite_entry',
      title: 'Vite app entry',
      status: 'fail',
      summary: 'Root index.html does not reference a local module script entry.',
      evidence: ['index.html: present', `moduleScript=${moduleSrc ?? 'missing'}`],
    };
  }

  const entryExists = isFile(root, entryPath);
  return {
    id: 'vite_entry',
    title: 'Vite app entry',
    status: entryExists ? 'pass' : 'fail',
    summary: entryExists
      ? `Root index.html references existing Vite entry ${entryPath}.`
      : `Root index.html references missing Vite entry ${entryPath}.`,
    evidence: [
      'index.html: present',
      `moduleScript=${moduleSrc}`,
      `${entryPath}: ${entryExists ? 'present' : 'missing'}`,
    ],
  };
}

function buildRequiredFilesCheck(root: string): BaselineCheck {
  const missing = ROOT_PROJECT_FILES.filter((file) => !isFile(root, file));
  return {
    id: 'root_project_files',
    title: 'Root project files',
    status: missing.length === 0 ? 'pass' : 'warning',
    summary: missing.length === 0
      ? 'All expected root project/config files are present.'
      : `Missing optional/required root files for review bundles: ${missing.join(', ')}`,
    evidence: ROOT_PROJECT_FILES.map((file) => `${file}: ${isFile(root, file) ? 'present' : 'missing'}`),
  };
}

function buildRequiredScriptFilesCheck(root: string): BaselineCheck {
  const missing = REQUIRED_ROOT_SCRIPT_FILES.filter((file) => !isFile(root, file));
  return {
    id: 'root_script_files',
    title: 'Root script files',
    status: missing.length === 0 ? 'pass' : 'fail',
    summary: missing.length === 0
      ? 'Required root helper scripts are present.'
      : `Missing required root helper scripts: ${missing.join(', ')}`,
    evidence: REQUIRED_ROOT_SCRIPT_FILES.map((file) => `${file}: ${isFile(root, file) ? 'present' : 'missing'}`),
  };
}

function buildRuntimeContentDirectoryCheck(root: string): BaselineCheck {
  const contentDir = 'public/cultivation_idle_content_bible_v1_config';
  const missingFiles = Object.values(RUNTIME_CONTENT_FILE_BY_KEY).filter((fileName) => !isFile(root, path.join(contentDir, fileName)));
  return {
    id: 'runtime_content_files',
    title: 'Runtime content source files',
    status: isDirectory(root, contentDir) && missingFiles.length === 0 ? 'pass' : 'fail',
    summary: !isDirectory(root, contentDir)
      ? 'Runtime content source directory is missing.'
      : missingFiles.length > 0
        ? `Missing runtime content files: ${missingFiles.join(', ')}`
        : `All ${Object.keys(RUNTIME_CONTENT_FILE_BY_KEY).length} runtime content files are present.`,
    evidence: [
      `${contentDir}: ${isDirectory(root, contentDir) ? 'present' : 'missing'}`,
      `requiredFiles=${Object.keys(RUNTIME_CONTENT_FILE_BY_KEY).length}`,
      `missingFiles=${missingFiles.length}`,
      ...missingFiles.slice(0, 8).map((fileName) => `${fileName}: missing`),
    ],
  };
}

function buildBaselineReport(root: string): ImplementationBaselineReport {
  const { raw: packageJson, scripts, check: packageCheck } = readPackageJson(root);
  const npmVersion = runPreview('npm', ['-v'], root);
  const gitBranch = runPreview('git', ['branch', '--show-current'], root);
  const gitStatus = runPreview('git', ['status', '--short'], root);
  const gitStatusPreview = gitStatus ? gitStatus.split(/\r?\n/).filter(Boolean).slice(0, 20) : [];
  const contentManifest = buildRuntimeContentManifestReport({ root });
  const testsCount = countFiles(root, 'tests', '.ts');

  const checks: BaselineCheck[] = [
    packageCheck,
    buildViteEntryCheck(root),
    buildRequiredFilesCheck(root),
    buildRequiredScriptFilesCheck(root),
    {
      id: 'node_modules',
      title: 'Dependencies',
      status: exists(root, 'node_modules') ? 'pass' : 'warning',
      summary: exists(root, 'node_modules')
        ? 'node_modules is present.'
        : 'node_modules is missing; typecheck/test/build commands cannot run in this checkout until dependencies are installed.',
      evidence: ['node_modules'],
    },
    {
      id: 'lockfile',
      title: 'Lockfile',
      status: exists(root, 'package-lock.json') ? 'pass' : 'warning',
      summary: exists(root, 'package-lock.json') ? 'package-lock.json is present.' : 'package-lock.json is missing.',
      evidence: ['package-lock.json'],
    },
    {
      id: 'vendor_deps',
      title: 'Local vendor dependencies',
      status: exists(root, 'vendor') ? 'pass' : 'warning',
      summary: exists(root, 'vendor') ? 'vendor directory is present.' : 'vendor directory is missing.',
      evidence: ['vendor'],
    },
    {
      id: 'runtime_content_manifest',
      title: 'Runtime content manifest',
      status: contentManifest.blockers.length > 0 ? 'fail' : contentManifest.warnings.length > 0 ? 'warning' : 'pass',
      summary: contentManifest.blockers.length > 0
        ? `Runtime content blockers: ${contentManifest.blockers.join('; ')}`
        : contentManifest.warnings.length > 0
          ? `Runtime content warnings: ${contentManifest.warnings.join('; ')}`
          : 'All runtime content files required by the manifest are present and non-empty.',
      evidence: [
        `source=${contentManifest.sourceDir}`,
        `requiredFiles=${contentManifest.requiredFiles.length}`,
        `missingFiles=${contentManifest.source.missingFiles.length}`,
        `emptyFiles=${contentManifest.source.emptyFiles.length}`,
      ],
    },
    buildRuntimeContentDirectoryCheck(root),
    {
      id: 'test_sources',
      title: 'Test sources',
      status: testsCount > 0 ? 'pass' : 'warning',
      summary: testsCount > 0 ? `${testsCount} TypeScript test source files found under tests/.` : 'No TypeScript test source files found under tests/.',
      evidence: ['tests/**/*.ts'],
    },
    {
      id: 'compiled_tmp_tests',
      title: 'Compiled tmp-tests',
      status: exists(root, 'tmp-tests') ? 'info' : 'warning',
      summary: exists(root, 'tmp-tests') ? 'tmp-tests directory is present.' : 'tmp-tests is absent; this is expected before tests compile.',
      evidence: ['tmp-tests'],
    },
    {
      id: 'test_configs',
      title: 'Test tsconfig files',
      status: exists(root, 'tsconfig.tests.json') && exists(root, 'tsconfig.progression-fixtures.json') ? 'pass' : 'warning',
      summary: 'Checks for tsconfig.tests.json and tsconfig.progression-fixtures.json.',
      evidence: [
        `tsconfig.tests.json: ${exists(root, 'tsconfig.tests.json') ? 'present' : 'missing'}`,
        `tsconfig.progression-fixtures.json: ${exists(root, 'tsconfig.progression-fixtures.json') ? 'present' : 'missing'}`,
      ],
    },
    buildScriptCheck('key_scripts', 'Key package scripts', scripts, CORE_SCRIPT_IDS, 'fail'),
    buildScriptCheck('release_capture_scripts', 'Release/capture package scripts', scripts, RELEASE_CAPTURE_SCRIPT_IDS, 'warning'),
    {
      id: 'release_docs',
      title: 'Release docs directory',
      status: exists(root, 'docs/release') ? 'pass' : 'warning',
      summary: exists(root, 'docs/release') ? 'docs/release is present.' : 'docs/release is missing.',
      evidence: ['docs/release'],
    },
  ];

  const recommendedNextCommands = [
    !exists(root, 'node_modules') ? 'npm install' : null,
    scripts['release:runtime-content-manifest:json'] ? 'npm run release:runtime-content-manifest:json' : null,
    scripts.typecheck ? 'npm run typecheck' : null,
    scripts['check:icons'] ? 'npm run check:icons' : null,
    scripts['test:contracts'] ? 'npm run test:contracts' : null,
    scripts['validate:content'] ? 'npm run validate:content' : null,
    scripts['progression:report'] ? 'npm run progression:report' : null,
    scripts.build ? 'npm run build' : null,
    scripts['release:gate'] ? 'npm run release:gate -- --json' : null,
  ].filter((entry): entry is string => Boolean(entry));

  const blockers = checks.filter((check) => check.status === 'fail');
  const warnings = checks.filter((check) => check.status === 'warning');

  return {
    schemaVersion: 'implementation-baseline-v1',
    generatedAt: new Date().toISOString(),
    cwd: root,
    packageName: typeof packageJson?.name === 'string' ? packageJson.name : undefined,
    packageVersion: typeof packageJson?.version === 'string' ? packageJson.version : undefined,
    nodeVersion: process.version,
    npmVersion,
    git: gitBranch || gitStatusPreview.length > 0
      ? {
          branch: gitBranch,
          dirty: gitStatusPreview.length > 0,
          statusPreview: gitStatusPreview,
        }
      : undefined,
    checks,
    blockers,
    warnings,
    recommendedNextCommands,
  };
}

function renderMarkdown(report: ImplementationBaselineReport): string {
  const lines: string[] = [];
  lines.push('# Current Implementation Baseline');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`CWD: \`${report.cwd}\``);
  lines.push(`Package: ${report.packageName ?? 'unknown'} ${report.packageVersion ?? ''}`.trim());
  lines.push(`Node: ${report.nodeVersion}`);
  if (report.npmVersion) lines.push(`npm: ${report.npmVersion}`);
  if (report.git) {
    lines.push(`Git branch: ${report.git.branch ?? 'unknown'}`);
    lines.push(`Git dirty: ${report.git.dirty ? 'yes' : 'no'}`);
    if (report.git.statusPreview && report.git.statusPreview.length > 0) {
      lines.push('');
      lines.push('## Git status preview');
      report.git.statusPreview.forEach((entry) => lines.push(`- \`${entry}\``));
    }
  }
  lines.push('');
  lines.push('## Checks');
  lines.push('| Check | Status | Summary |');
  lines.push('| --- | --- | --- |');
  report.checks.forEach((check) => {
    lines.push(`| ${check.title} | ${check.status.toUpperCase()} | ${check.summary.replace(/\|/g, '\\|')} |`);
  });
  lines.push('');
  lines.push('## Blockers');
  if (report.blockers.length === 0) {
    lines.push('- None');
  } else {
    report.blockers.forEach((check) => lines.push(`- ${check.title}: ${check.summary}`));
  }
  lines.push('');
  lines.push('## Warnings');
  if (report.warnings.length === 0) {
    lines.push('- None');
  } else {
    report.warnings.forEach((check) => lines.push(`- ${check.title}: ${check.summary}`));
  }
  lines.push('');
  lines.push('## Recommended next commands');
  report.recommendedNextCommands.forEach((command) => lines.push(`- \`${command}\``));
  lines.push('');
  return lines.join('\n');
}

function writeReportFiles(root: string, report: ImplementationBaselineReport) {
  const outDir = path.resolve(root, 'docs', 'release');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'current_implementation_baseline.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'current_implementation_baseline.md'), `${renderMarkdown(report).trimEnd()}\n`, 'utf8');
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
} else {
  const report = buildBaselineReport(options.root);
  if (options.write) {
    writeReportFiles(options.root, report);
  }
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderMarkdown(report));
  }
}
