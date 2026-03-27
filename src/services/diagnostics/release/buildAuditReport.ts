export type BuildAuditLevel = 'blocker' | 'warning';
export type BuildAuditSourceFamily = 'typescript' | 'vite' | 'react-babel' | 'rollup' | 'sass_css' | 'icon_content_script_checks' | 'unknown';
export type BuildAuditDisposition = 'fix_now' | 'acceptable_for_semester_rc' | 'post_semester_debt';

export type BuildAuditEntry = {
  id: string;
  level: BuildAuditLevel;
  sourceFamily: BuildAuditSourceFamily;
  summary: string;
  rawExcerpt: string;
  disposition: BuildAuditDisposition;
  owner: string;
  fixNotes: string;
};

export type BuildAuditReport = {
  schemaVersion: '7.4a';
  generatedAt: number;
  buildPassed: boolean;
  blockerCount: number;
  warningCount: number;
  entries: BuildAuditEntry[];
  groupedCounts: Record<BuildAuditSourceFamily, { blocker: number; warning: number }>;
  notes: string[];
};

function toId(summary: string, index: number): string {
  const slug = summary.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48);
  return `build_${index + 1}_${slug || 'entry'}`;
}

function detectSourceFamily(line: string): BuildAuditSourceFamily {
  const lower = line.toLowerCase();
  if (lower.includes('typescript') || lower.includes('tsc') || /\bts\d{4}\b/i.test(line)) return 'typescript';
  if (lower.includes('vite')) return 'vite';
  if (lower.includes('react') || lower.includes('jsx') || lower.includes('tsx')) return 'react-babel';
  if (lower.includes('rollup')) return 'rollup';
  if (lower.includes('sass') || lower.includes('css')) return 'sass_css';
  if (lower.includes('check:icons') || lower.includes('contentvalidation') || lower.includes('[content]')) return 'icon_content_script_checks';
  return 'unknown';
}

function detectLevel(line: string): BuildAuditLevel | null {
  const lower = line.toLowerCase();
  if (lower.includes('error') || lower.includes('failed') || lower.includes('unexpected token') || lower.includes('transform failed')) return 'blocker';
  if (lower.includes('warning') || lower.startsWith('npm warn')) return 'warning';
  return null;
}

function summarize(line: string): string {
  return line.replace(/^\s*#?\s*/, '').slice(0, 220);
}

function toDisposition(level: BuildAuditLevel): BuildAuditDisposition {
  return level === 'blocker' ? 'fix_now' : 'post_semester_debt';
}

export function parseBuildAuditOutput(rawOutput: string): BuildAuditEntry[] {
  const dedupe = new Set<string>();
  const entries: BuildAuditEntry[] = [];

  for (const line of rawOutput.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const level = detectLevel(trimmed);
    if (!level) continue;
    if (dedupe.has(trimmed)) continue;
    dedupe.add(trimmed);

    const summary = summarize(trimmed);
    entries.push({
      id: toId(summary, entries.length),
      level,
      sourceFamily: detectSourceFamily(trimmed),
      summary,
      rawExcerpt: trimmed,
      disposition: toDisposition(level),
      owner: 'release_engineering',
      fixNotes: level === 'blocker' ? 'Resolve before RC sign-off.' : 'Track and triage for follow-up packet.',
    });
  }

  return entries;
}

export function buildBuildAuditReport(args: { output: string; buildPassed: boolean }): BuildAuditReport {
  const entries = parseBuildAuditOutput(args.output);
  const groupedCounts: BuildAuditReport['groupedCounts'] = {
    typescript: { blocker: 0, warning: 0 },
    vite: { blocker: 0, warning: 0 },
    'react-babel': { blocker: 0, warning: 0 },
    rollup: { blocker: 0, warning: 0 },
    sass_css: { blocker: 0, warning: 0 },
    icon_content_script_checks: { blocker: 0, warning: 0 },
    unknown: { blocker: 0, warning: 0 },
  };

  for (const entry of entries) {
    groupedCounts[entry.sourceFamily][entry.level] += 1;
  }

  const blockerCount = entries.filter((entry) => entry.level === 'blocker').length;
  const warningCount = entries.filter((entry) => entry.level === 'warning').length;

  return {
    schemaVersion: '7.4a',
    generatedAt: Date.now(),
    buildPassed: args.buildPassed,
    blockerCount,
    warningCount,
    entries,
    groupedCounts,
    notes: [
      args.buildPassed ? 'Build command exited successfully.' : 'Build command exited with non-zero status.',
      entries.length === 0 ? 'No warnings or blockers were parsed from captured output.' : 'Entries normalized from build stdout/stderr.',
    ],
  };
}

export function renderBuildAuditReport(report: BuildAuditReport): string {
  const lines: string[] = [];
  lines.push('=== Build Warning Inventory (Packet 7.4a) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`buildPassed: ${report.buildPassed}`);
  lines.push(`blockers: ${report.blockerCount}`);
  lines.push(`warnings: ${report.warningCount}`);
  lines.push('');

  if (report.entries.length === 0) {
    lines.push('No normalized warning/blocker entries found.');
  } else {
    lines.push('Entries:');
    for (const entry of report.entries) {
      lines.push(`- [${entry.level}] (${entry.sourceFamily}) ${entry.id}: ${entry.summary}`);
      lines.push(`  disposition=${entry.disposition} owner=${entry.owner}`);
    }
  }

  return lines.join('\n');
}
