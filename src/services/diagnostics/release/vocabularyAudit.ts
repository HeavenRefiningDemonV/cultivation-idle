import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DIAGNOSIS_LABELS, PRESTIGE_RECOMMENDATION_LABELS, READINESS_LABELS, SHELL_TAB_LABELS, WORLD_MODULE_LABELS } from '../../../ui/text/playerFacingLabels.js';
import { LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS } from '../../../systems/world/liveWorldLeakAudit.js';
import { LIVE_SURFACE_MANIFEST } from './liveSurfaceManifest.js';

export interface VocabularyFinding {
  file: string;
  term: string;
  line: number;
  excerpt: string;
}

export interface VocabularyAuditReport {
  schemaVersion: '7.5a-vocabulary-audit';
  generatedAt: number;
  overallPass: boolean;
  canonicalTerms: string[];
  staleFindings: VocabularyFinding[];
  placeholderFindings: VocabularyFinding[];
  replacementMap: Record<string, string>;
  trackedFiles: string[];
  notes: string[];
}

const STALE_PATTERNS: Array<{ term: string; pattern: RegExp }> = [
  { term: 'coming soon', pattern: /coming soon/i },
  { term: 'under development', pattern: /under development/i },
  { term: 'not implemented yet', pattern: /not implemented yet/i },
  { term: 'debug wording', pattern: /\bfor debugging\b|\bdebug tools\b|\(debug\)/i },
];

const PLACEHOLDER_PATTERNS: Array<{ term: string; pattern: RegExp }> = [
  { term: 'placeholder', pattern: /\bplaceholder\b/i },
  { term: 'todo', pattern: /\btodo\b/i },
  { term: 'wip', pattern: /\bwip\b/i },
];

const PLAYER_STRING_LITERAL = /['"`][^'"`]*['"`]/g;

function collectFindings(file: string, source: string, patterns: Array<{ term: string; pattern: RegExp }>): VocabularyFinding[] {
  const findings: VocabularyFinding[] = [];
  const lines = source.split('\n');

  lines.forEach((line, index) => {
    const literals = line.match(PLAYER_STRING_LITERAL) ?? [];
    literals.forEach((literal) => {
      patterns.forEach(({ term, pattern }) => {
        if (!pattern.test(literal)) return;
        findings.push({
          file,
          term,
          line: index + 1,
          excerpt: literal.slice(0, 200),
        });
      });
    });
  });

  return findings;
}

function canonicalTermInventory(): string[] {
  const terms = new Set<string>([
    ...Object.values(SHELL_TAB_LABELS),
    ...Object.values(WORLD_MODULE_LABELS),
    ...Object.values(READINESS_LABELS),
    ...Object.values(DIAGNOSIS_LABELS),
    ...Object.values(PRESTIGE_RECOMMENDATION_LABELS),
    ...Object.values(LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS),
  ]);
  return [...terms].sort((a, b) => a.localeCompare(b));
}

export function runVocabularyAudit(): VocabularyAuditReport {
  const root = process.cwd();
  const trackedFiles = [...LIVE_SURFACE_MANIFEST.trackedFiles];
  const staleFindings: VocabularyFinding[] = [];
  const placeholderFindings: VocabularyFinding[] = [];

  trackedFiles.forEach((relativePath) => {
    const source = readFileSync(path.resolve(root, relativePath), 'utf8');
    staleFindings.push(...collectFindings(relativePath, source, STALE_PATTERNS));
    placeholderFindings.push(...collectFindings(relativePath, source, PLACEHOLDER_PATTERNS));
  });

  const replacementMap: Record<string, string> = {
    ...LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS,
    'Coming Soon': 'Unavailable in current semester',
    'under development': 'unavailable in current semester',
    'Not implemented yet': 'Unavailable in current semester',
    '(debug)': '',
    'for debugging': 'for diagnostics',
    'debug tools': 'diagnostics tools',
  };

  return {
    schemaVersion: '7.5a-vocabulary-audit',
    generatedAt: Date.now(),
    overallPass: staleFindings.length === 0,
    canonicalTerms: canonicalTermInventory(),
    staleFindings,
    placeholderFindings,
    replacementMap,
    trackedFiles,
    notes: [...LIVE_SURFACE_MANIFEST.notes],
  };
}

export function renderVocabularyAuditReport(report: VocabularyAuditReport): string {
  const lines: string[] = [];
  lines.push('=== Release Vocabulary Audit (Packet 7.5a) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`trackedFiles: ${report.trackedFiles.length}`);
  lines.push(`staleFindings: ${report.staleFindings.length}`);
  lines.push(`placeholderFindings: ${report.placeholderFindings.length}`);
  lines.push('');
  lines.push('Replacement map:');
  Object.entries(report.replacementMap).forEach(([from, to]) => {
    lines.push(`- ${from} -> ${to}`);
  });
  if (report.staleFindings.length > 0) {
    lines.push('');
    lines.push('Stale findings:');
    report.staleFindings.forEach((finding) => {
      lines.push(`- ${finding.file}:${finding.line} [${finding.term}] ${finding.excerpt}`);
    });
  }
  if (report.placeholderFindings.length > 0) {
    lines.push('');
    lines.push('Placeholder findings:');
    report.placeholderFindings.forEach((finding) => {
      lines.push(`- ${finding.file}:${finding.line} [${finding.term}] ${finding.excerpt}`);
    });
  }
  if (LIVE_SURFACE_MANIFEST.narrowExceptions.length > 0) {
    lines.push('');
    lines.push('Narrow exceptions:');
    LIVE_SURFACE_MANIFEST.narrowExceptions.forEach((entry) => {
      lines.push(`- ${entry.file}: ${entry.reason}`);
    });
  }
  return lines.join('\n');
}
