import fs from 'node:fs';
import path from 'node:path';
import {
  RUNTIME_CONTENT_DIR,
  RUNTIME_CONTENT_FILES,
  type RuntimeContentFileName,
} from '../../../content/runtimeContentManifest.js';

export type RuntimeContentManifestStatus = 'pass' | 'fail' | 'warning';

export type RuntimeContentDirectoryReport = {
  path: string;
  exists: boolean;
  missingFiles: RuntimeContentFileName[];
  emptyFiles: RuntimeContentFileName[];
  extraJsonFiles: string[];
  status: RuntimeContentManifestStatus;
};

export type RuntimeContentManifestReport = {
  schemaVersion: 'runtime-content-manifest-v1';
  generatedAt: string;
  root: string;
  contentDirName: typeof RUNTIME_CONTENT_DIR;
  sourceDir: string;
  builtDir?: string;
  requiredFiles: RuntimeContentFileName[];
  source: RuntimeContentDirectoryReport;
  built?: RuntimeContentDirectoryReport;
  blockers: string[];
  warnings: string[];
};

export type BuildRuntimeContentManifestReportOptions = {
  root?: string;
  built?: boolean;
  distDir?: string;
};

const REQUIRED_FILE_SET = new Set<string>(RUNTIME_CONTENT_FILES);

function relativeFromRoot(root: string, target: string): string {
  return path.relative(root, target).replace(/\\/g, '/') || '.';
}

function scanContentDirectory(root: string, dirPath: string): RuntimeContentDirectoryReport {
  if (!fs.existsSync(dirPath)) {
    return {
      path: relativeFromRoot(root, dirPath),
      exists: false,
      missingFiles: [...RUNTIME_CONTENT_FILES],
      emptyFiles: [],
      extraJsonFiles: [],
      status: 'fail',
    };
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    return {
      path: relativeFromRoot(root, dirPath),
      exists: false,
      missingFiles: [...RUNTIME_CONTENT_FILES],
      emptyFiles: [],
      extraJsonFiles: [],
      status: 'fail',
    };
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const fileNames = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
  const missingFiles = RUNTIME_CONTENT_FILES.filter((fileName) => !fileNames.has(fileName));
  const emptyFiles = RUNTIME_CONTENT_FILES.filter((fileName) => {
    const filePath = path.join(dirPath, fileName);
    return fs.existsSync(filePath) && fs.statSync(filePath).size === 0;
  });
  const extraJsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !REQUIRED_FILE_SET.has(entry.name))
    .map((entry) => entry.name)
    .sort();

  const hasBlockers = missingFiles.length > 0 || emptyFiles.length > 0;
  return {
    path: relativeFromRoot(root, dirPath),
    exists: true,
    missingFiles,
    emptyFiles,
    extraJsonFiles,
    status: hasBlockers ? 'fail' : extraJsonFiles.length > 0 ? 'warning' : 'pass',
  };
}

function collectDirectoryFindings(label: 'source' | 'built', report: RuntimeContentDirectoryReport): {
  blockers: string[];
  warnings: string[];
} {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!report.exists) {
    blockers.push(`Missing ${label} runtime content directory: ${report.path}`);
  }

  report.missingFiles.forEach((fileName) => {
    blockers.push(`Missing ${label} runtime content file: ${fileName}`);
  });

  report.emptyFiles.forEach((fileName) => {
    blockers.push(`Empty ${label} runtime content file: ${fileName}`);
  });

  report.extraJsonFiles.forEach((fileName) => {
    warnings.push(`Extra ${label} runtime JSON file not required by manifest: ${fileName}`);
  });

  return { blockers, warnings };
}

export function buildRuntimeContentManifestReport(
  options: BuildRuntimeContentManifestReportOptions = {},
): RuntimeContentManifestReport {
  const root = path.resolve(options.root ?? process.cwd());
  const sourceDir = path.resolve(root, 'public', RUNTIME_CONTENT_DIR);
  const source = scanContentDirectory(root, sourceDir);
  const sourceFindings = collectDirectoryFindings('source', source);
  const blockers = [...sourceFindings.blockers];
  const warnings = [...sourceFindings.warnings];

  let built: RuntimeContentDirectoryReport | undefined;
  let builtDir: string | undefined;
  if (options.built) {
    builtDir = path.resolve(root, options.distDir ?? 'dist', RUNTIME_CONTENT_DIR);
    built = scanContentDirectory(root, builtDir);
    const builtFindings = collectDirectoryFindings('built', built);
    blockers.push(...builtFindings.blockers);
    warnings.push(...builtFindings.warnings);
  }

  return {
    schemaVersion: 'runtime-content-manifest-v1',
    generatedAt: new Date().toISOString(),
    root,
    contentDirName: RUNTIME_CONTENT_DIR,
    sourceDir: relativeFromRoot(root, sourceDir),
    builtDir: builtDir ? relativeFromRoot(root, builtDir) : undefined,
    requiredFiles: [...RUNTIME_CONTENT_FILES],
    source,
    built,
    blockers,
    warnings,
  };
}

function renderDirectorySection(lines: string[], title: string, report: RuntimeContentDirectoryReport) {
  lines.push(`## ${title}`);
  lines.push(`- Path: \`${report.path}\``);
  lines.push(`- Status: ${report.status.toUpperCase()}`);
  lines.push(`- Directory exists: ${report.exists ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('| File | Status |');
  lines.push('| --- | --- |');
  RUNTIME_CONTENT_FILES.forEach((fileName) => {
    const status = report.missingFiles.includes(fileName)
      ? 'missing'
      : report.emptyFiles.includes(fileName)
        ? 'empty'
        : 'present';
    lines.push(`| ${fileName} | ${status} |`);
  });
  if (report.extraJsonFiles.length > 0) {
    lines.push('');
    lines.push('Extra JSON files:');
    report.extraJsonFiles.forEach((fileName) => lines.push(`- ${fileName}`));
  }
  lines.push('');
}

export function renderRuntimeContentManifestMarkdown(report: RuntimeContentManifestReport): string {
  const lines: string[] = [];
  const status = report.blockers.length > 0 ? 'FAIL' : report.warnings.length > 0 ? 'WARNING' : 'PASS';
  lines.push('# Runtime Content Manifest');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`## Result`);
  lines.push(status);
  lines.push('');
  lines.push('## Required directory');
  lines.push(`- Source: \`${report.sourceDir}\``);
  if (report.builtDir) lines.push(`- Built: \`${report.builtDir}\``);
  lines.push('');
  lines.push('## Required files');
  report.requiredFiles.forEach((fileName) => lines.push(`- ${fileName}`));
  lines.push('');
  renderDirectorySection(lines, 'Source content', report.source);
  if (report.built) renderDirectorySection(lines, 'Built content', report.built);
  lines.push('## Blockers');
  if (report.blockers.length === 0) {
    lines.push('- None');
  } else {
    report.blockers.forEach((entry) => lines.push(`- ${entry}`));
  }
  lines.push('');
  lines.push('## Warnings');
  if (report.warnings.length === 0) {
    lines.push('- None');
  } else {
    report.warnings.forEach((entry) => lines.push(`- ${entry}`));
  }
  lines.push('');
  return lines.join('\n');
}

