import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type StoreSelectorIssueType =
  | 'bare-store-subscription'
  | 'json-signature';

export interface StoreSelectorAuditIssue {
  file: string;
  line: number;
  type: StoreSelectorIssueType;
  snippet: string;
  recommendation: string;
}

export interface AllowedSerializationSite {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

export interface StoreSelectorAuditReport {
  bareStoreSubscriptions: StoreSelectorAuditIssue[];
  forbiddenJsonSignatures: StoreSelectorAuditIssue[];
  allowedSerializationSites: AllowedSerializationSite[];
  versionCounters: Record<string, string[]>;
  warnings: string[];
  pass: boolean;
}

interface RunStoreSelectorAuditOptions {
  rootDir?: string;
}

const SOURCE_ROOTS = [
  path.join('src', 'components'),
  path.join('src', 'features'),
] as const;

const COMPONENT_EXTENSIONS = new Set(['.ts', '.tsx']);

const VERSION_COUNTER_TARGETS: Record<string, string[]> = {
  inventoryStore: ['inventoryVersion', 'currencyVersion'],
  equipmentStore: ['equipmentVersion'],
  trialStore: ['progressVersion', 'progressVersionByTrialId'],
  bountyStore: ['bountyVersion', 'bountyVersionByCityId'],
  expeditionStore: ['expeditionVersion'],
  medicinePouchStore: ['pouchVersion'],
  techniqueStore: ['loadoutVersion', 'aiProfileVersion', 'slotVersion'],
  techCollectionStore: ['collectionVersion', 'masteryVersion'],
  contentStore: ['contentVersion'],
  gameStore: ['realmVersion', 'qiDisplayVersion', 'statsVersion'],
  cultivationStore: ['heartLawVersion', 'insightDisplayVersion', 'consumableVersion'],
  combatStore: ['combatSessionVersion', 'combatViewVersion', 'combatResultVersion'],
  shopStore: ['shopVersion', 'shopVersionByCityId'],
  manualPavilionStore: ['stockVersion', 'pavilionVersionByCityId'],
};

const normalizePath = (value: string): string => value.split(path.sep).join('/');

const toRelativePath = (rootDir: string, absolutePath: string): string =>
  normalizePath(path.relative(rootDir, absolutePath));

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!(await fileExists(absoluteDir))) return [];

  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(rootDir, path.join(relativeDir, entry.name));
    }

    if (!entry.isFile() || !COMPONENT_EXTENSIONS.has(path.extname(entry.name))) {
      return [];
    }

    return [absolutePath];
  }));

  return files.flat();
}

function lineForIndex(source: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source[cursor] === '\n') line += 1;
  }
  return line;
}

function lineText(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1]?.trim() ?? '';
}

function contextAround(source: string, line: number, radius = 4): string {
  const lines = source.split(/\r?\n/);
  const start = Math.max(0, line - 1 - radius);
  const end = Math.min(lines.length, line + radius);
  return lines.slice(start, end).join('\n');
}

function classifyAllowedSerialization(file: string, snippet: string, context: string): string | null {
  const normalized = normalizePath(file);

  if (/data-testid="[^"]*(?:debug|shell-flags)[^"]*"/.test(context) || /React\.createElement\('aside'/.test(context)) {
    return 'hidden exact-screen fixture/debug serialization, not a selector';
  }

  if (/localStorage\.setItem/.test(context) || normalized.includes('/SettingsScreen.tsx')) {
    return 'save/settings/import-export serialization, not a selector';
  }

  if (/new Blob/.test(context) || normalized.includes('/ContentInitGate.tsx')) {
    return 'diagnostic download serialization, not a selector';
  }

  if (/JSON\.stringify\(value,\s*null,\s*2\)/.test(snippet)) {
    return 'pretty-printed modal debug serialization, not a selector';
  }

  return null;
}

function collectBareStoreSubscriptions(rootDir: string, file: string, source: string): StoreSelectorAuditIssue[] {
  const issues: StoreSelectorAuditIssue[] = [];
  const regex = /use[A-Za-z0-9]*Store\s*\(\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const line = lineForIndex(source, match.index);
    issues.push({
      file: toRelativePath(rootDir, file),
      line,
      type: 'bare-store-subscription',
      snippet: lineText(source, line),
      recommendation: 'Use atomic selectors or a useShallow view model instead of subscribing to the whole store.',
    });
  }

  return issues;
}

function collectJsonSerialization(rootDir: string, file: string, source: string): {
  forbidden: StoreSelectorAuditIssue[];
  allowed: AllowedSerializationSite[];
} {
  const forbidden: StoreSelectorAuditIssue[] = [];
  const allowed: AllowedSerializationSite[] = [];
  const relativeFile = toRelativePath(rootDir, file);
  const regex = /JSON\.stringify/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const line = lineForIndex(source, match.index);
    const snippet = lineText(source, line);
    const context = contextAround(source, line);
    const signatureContext = /\b\w*Signature\w*\b/.test(context);
    const storeSelectorContext = /use[A-Za-z0-9]*Store\s*\(/.test(context);
    const ownerContext = /Owner\.tsx$/.test(relativeFile);

    if (ownerContext && (signatureContext || storeSelectorContext)) {
      forbidden.push({
        file: relativeFile,
        line,
        type: 'json-signature',
        snippet,
        recommendation: 'Replace deep JSON signatures with scalar semantic version counters.',
      });
      continue;
    }

    const reason = classifyAllowedSerialization(relativeFile, snippet, context);
    if (reason) {
      allowed.push({
        file: relativeFile,
        line,
        snippet,
        reason,
      });
      continue;
    }

    forbidden.push({
      file: relativeFile,
      line,
      type: 'json-signature',
      snippet,
      recommendation: 'Classify this serialization explicitly or remove it from selector/dependency code.',
    });
  }

  return { forbidden, allowed };
}

async function collectVersionCounters(rootDir: string): Promise<Record<string, string[]>> {
  const detected: Record<string, string[]> = {};

  await Promise.all(Object.entries(VERSION_COUNTER_TARGETS).map(async ([storeName, counters]) => {
    const file = path.join(rootDir, 'src', 'stores', `${storeName}.ts`);
    if (!(await fileExists(file))) return;

    const source = await fs.readFile(file, 'utf8');
    detected[storeName] = counters.filter((counter) => new RegExp(`\\b${counter}\\b`).test(source));
  }));

  return Object.fromEntries(Object.entries(detected).sort(([left], [right]) => left.localeCompare(right)));
}

export async function runStoreSelectorAudit(options: RunStoreSelectorAuditOptions = {}): Promise<StoreSelectorAuditReport> {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const files = (await Promise.all(SOURCE_ROOTS.map((sourceRoot) => walkFiles(rootDir, sourceRoot)))).flat();

  const bareStoreSubscriptions: StoreSelectorAuditIssue[] = [];
  const forbiddenJsonSignatures: StoreSelectorAuditIssue[] = [];
  const allowedSerializationSites: AllowedSerializationSite[] = [];

  await Promise.all(files.map(async (file) => {
    const source = await fs.readFile(file, 'utf8');
    bareStoreSubscriptions.push(...collectBareStoreSubscriptions(rootDir, file, source));
    const serialization = collectJsonSerialization(rootDir, file, source);
    forbiddenJsonSignatures.push(...serialization.forbidden);
    allowedSerializationSites.push(...serialization.allowed);
  }));

  bareStoreSubscriptions.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
  forbiddenJsonSignatures.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
  allowedSerializationSites.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);

  const versionCounters = await collectVersionCounters(rootDir);
  const warnings = Object.entries(versionCounters)
    .filter(([, counters]) => counters.length === 0)
    .map(([storeName]) => `${storeName}: no packet-3 version counters detected`);

  return {
    bareStoreSubscriptions,
    forbiddenJsonSignatures,
    allowedSerializationSites,
    versionCounters,
    warnings,
    pass: bareStoreSubscriptions.length === 0 && forbiddenJsonSignatures.length === 0,
  };
}

function renderHumanReport(report: StoreSelectorAuditReport): string {
  const lines: string[] = [
    'Selector hygiene audit',
    '======================',
    `Bare store subscriptions: ${report.bareStoreSubscriptions.length}`,
    `Forbidden JSON.stringify selector/dependency signatures: ${report.forbiddenJsonSignatures.length}`,
    `Allowed JSON.stringify serialization sites: ${report.allowedSerializationSites.length}`,
    'Store version counters detected:',
  ];

  for (const [storeName, counters] of Object.entries(report.versionCounters)) {
    lines.push(`  ${storeName}: ${counters.length > 0 ? counters.join(', ') : '(none)'}`);
  }

  if (report.bareStoreSubscriptions.length > 0) {
    lines.push('', 'Bare store subscription findings:');
    for (const issue of report.bareStoreSubscriptions) {
      lines.push(`  - ${issue.file}:${issue.line}: ${issue.snippet}`);
    }
  }

  if (report.forbiddenJsonSignatures.length > 0) {
    lines.push('', 'Forbidden JSON signature findings:');
    for (const issue of report.forbiddenJsonSignatures) {
      lines.push(`  - ${issue.file}:${issue.line}: ${issue.snippet}`);
    }
  }

  if (report.allowedSerializationSites.length > 0) {
    lines.push('', 'Allowed serialization sites:');
    for (const site of report.allowedSerializationSites) {
      lines.push(`  - ${site.file}:${site.line}: ${site.reason}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:');
    for (const warning of report.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  lines.push('', `Result: ${report.pass ? 'pass' : 'fail'}`);
  return lines.join('\n');
}

async function main() {
  const json = process.argv.includes('--json');
  const report = await runStoreSelectorAudit({ rootDir: process.cwd() });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderHumanReport(report));
  }

  if (!report.pass) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  void main();
}
