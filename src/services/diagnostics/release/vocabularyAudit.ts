import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { DIAGNOSIS_LABELS, PRESTIGE_RECOMMENDATION_LABELS, READINESS_LABELS, SHELL_TAB_LABELS, WORLD_MODULE_LABELS } from '../../../ui/text/playerFacingLabels.js';
import { LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS } from '../../../systems/world/liveWorldLeakAudit.js';
import { LIVE_SURFACE_MANIFEST } from './liveSurfaceManifest.js';

export type VocabularyAuditSeverity = 'blocker' | 'warning' | 'allowed' | 'info';
export type VocabularyAuditClassification =
  | 'reachable_public_ui'
  | 'internal_adapter'
  | 'test_guard'
  | 'historical_doc'
  | 'migration_compatibility'
  | 'owner_screen_detail'
  | 'debug_fixture_only'
  | 'unknown';

export interface VocabularyFinding {
  file: string;
  term: string;
  line: number;
  excerpt: string;
}

export interface DaoMandateVocabularyFinding extends VocabularyFinding {
  normalizedTerm: string;
  classification: VocabularyAuditClassification;
  severity: VocabularyAuditSeverity;
  reason: string;
}

export interface VocabularyAuditReport {
  schemaVersion: '7.5b-vocabulary-audit';
  generatedAt: number;
  overallPass: boolean;
  canonicalTerms: string[];
  staleFindings: VocabularyFinding[];
  placeholderFindings: VocabularyFinding[];
  replacementMap: Record<string, string>;
  trackedFiles: string[];
  notes: string[];
  daoMandateV2: {
    schemaVersion: 'status-v3-dao-decommission-vocabulary-audit';
    overallPass: boolean;
    blockerCount: number;
    warningCount: number;
    allowedCount: number;
    scannedRoots: string[];
    publicActiveRoots: string[];
    internalAllowlist: string[];
    forbiddenTerms: string[];
    matches: DaoMandateVocabularyFinding[];
    summaryByTerm: Record<string, number>;
    summaryByClassification: Record<VocabularyAuditClassification, number>;
  };
}

const STALE_PATTERNS: Array<{ term: string; pattern: RegExp }> = [
  { term: 'legacy city name: Embermist', pattern: /\bEmbermist\b/ },
  { term: 'legacy city name: Silverkeep', pattern: /\bSilverkeep\b/ },
  { term: 'legacy city name: Starsea', pattern: /\bStarsea\b/ },
  { term: 'stale role tag: Milestone Gate', pattern: /\bMilestone Gate\b/i },
  { term: 'stale role tag: Gate Prep', pattern: /\bGate Prep\b/i },
  { term: 'stale role tag: Support Currency', pattern: /\bSupport Currency\b/i },
  { term: 'stale role tag: Passive Supply', pattern: /\bPassive Supply\b/i },
  { term: 'stale world shell label: Adventure', pattern: /\bAdventure\b/ },
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
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;

const DAO_MANDATE_PUBLIC_ACTIVE_ROOTS = [
  'src/components/screens/StatusScreen.tsx',
  'src/components/screens/SettingsScreen.tsx',
  'src/components/screens/WorldScreen.tsx',
  'src/components/screens/InventoryScreen.tsx',
  'src/components/modals/WorldBuildingModal.tsx',
  'src/components/modals/OfflineProgressModal.tsx',
  'src/features/cultivation/exact',
  'src/features/world/gateTrialExact',
  'src/features/world/outskirts',
  'src/features/world/ruinsExact',
  'src/features/apothecary/exact',
  'src/features/professions/forgeExact',
  'src/features/world/manualPavilionExact',
  'src/features/pavilion',
  'src/features/techniquesExact',
  'src/features/world/bountiesExact',
  'src/features/world/expeditionsExact',
  'src/systems/ui/status',
  'src/systems/ui/world',
  'src/ui/status',
];

const DAO_MANDATE_INTERNAL_ALLOWLIST = [
  'src/systems/ui/runCompass',
  'src/systems/ui/daoMandate',
  'src/systems/ui/status/statusV2Surface.ts',
  'src/systems/world/localMandateLensSurface.ts',
  'src/ui/daoMandate',
  'src/services/diagnostics',
  'src/stores/uiStore.ts',
  'src/types/index.ts',
  'src/save/defaultSaveState.ts',
  'src/save/migrations',
  'src/utils/saveload.ts',
];

const DAO_MANDATE_FORBIDDEN_PUBLIC_PATTERNS: Array<{ term: string; normalizedTerm: string; pattern: RegExp }> = [
  { term: 'Current Omen', normalizedTerm: 'Current Omen', pattern: /\bCurrent Omen\b/i },
  { term: 'Gate Proof', normalizedTerm: 'Gate Proof', pattern: /\bGate Proof\b/i },
  { term: 'Recent Omens', normalizedTerm: 'Recent Omens', pattern: /\bRecent Omens\b/i },
  { term: 'Source Thread', normalizedTerm: 'Source Thread', pattern: /\bSource Thread\b/i },
  { term: 'Proof Detail', normalizedTerm: 'Proof Detail', pattern: /\bProof Detail\b/i },
  { term: 'Preparation Health', normalizedTerm: 'Preparation Health', pattern: /\bPreparation Health\b/i },
  { term: 'Mandate Lens', normalizedTerm: 'Mandate Lens', pattern: /\bMandate Lens\b/i },
  { term: 'Module Source-Sink', normalizedTerm: 'Module Source-Sink', pattern: /\bModule Source-Sink\b/i },
  { term: 'Threshold Omen', normalizedTerm: 'Threshold Omen', pattern: /\bThreshold Omen\b/i },
  { term: 'Omen evidence', normalizedTerm: 'Omen evidence', pattern: /\bOmen evidence\b/i },
  { term: 'Proof sealed', normalizedTerm: 'Proof sealed', pattern: /\bProof sealed\b/i },
  { term: 'Source sealed', normalizedTerm: 'Source sealed', pattern: /\bSource sealed\b/i },
  { term: 'Mandate after return', normalizedTerm: 'Mandate after return', pattern: /\bMandate after return\b/i },
  { term: 'Current Mandate', normalizedTerm: 'Current Mandate', pattern: /\bCurrent Mandate\b/i },
  { term: 'proof source handoff', normalizedTerm: 'proof source handoff', pattern: /\bproof source handoff\b/i },
  { term: 'status snapshot only', normalizedTerm: 'status snapshot only', pattern: /status[- ]snapshot[- ]only/i },
  { term: 'cultivation compact only', normalizedTerm: 'cultivation compact only', pattern: /cultivation[- ]compact[- ]only/i },
  { term: 'Dao Mandate Interface', normalizedTerm: 'Dao Mandate Interface', pattern: /\bDao Mandate Interface\b/i },
  { term: 'Mandate points elsewhere', normalizedTerm: 'Mandate points elsewhere', pattern: /Mandate points elsewhere|points elsewhere/i },
  { term: 'Primary Route', normalizedTerm: 'Primary Route', pattern: /\bPrimary Route\b/i },
  { term: 'Primary Obstruction', normalizedTerm: 'Primary Obstruction', pattern: /\bPrimary Obstruction\b/i },
  { term: 'Biggest Shortfall', normalizedTerm: 'Biggest Shortfall', pattern: /\bBiggest Shortfall\b/i },
  { term: 'Guidance Oath', normalizedTerm: 'Guidance Oath', pattern: /Guidance Oath/i },
  { term: 'Sealed/Elder/Jade strategy labels', normalizedTerm: 'Legacy Guidance Profile Label', pattern: /Sealed Counsel|Elder's Counsel|Jade Slip Tutor/i },
  { term: 'Mandate Chamber Primary Route', normalizedTerm: 'Mandate Chamber Primary Route', pattern: /Mandate Chamber Primary Route/i },
  { term: 'Mandate Context', normalizedTerm: 'Mandate Context', pattern: /Mandate Context/i },
  { term: 'ModuleRoleBanner', normalizedTerm: 'ModuleRoleBanner', pattern: /\bModuleRoleBanner\b/ },
];

export interface VocabularyAuditFile {
  path: string;
  text: string;
}

export interface RunVocabularyAuditOptions {
  root?: string;
  files?: VocabularyAuditFile[];
  publicActiveRoots?: string[];
  internalAllowlist?: string[];
}

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

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function walk(root: string, relativePath: string): string[] {
  const absolutePath = path.resolve(root, relativePath);
  if (!existsSync(absolutePath)) return [];
  const stats = statSync(absolutePath);
  if (stats.isFile()) return SOURCE_FILE_PATTERN.test(relativePath) ? [normalizePath(relativePath)] : [];
  return readdirSync(absolutePath)
    .flatMap((entry) => walk(root, normalizePath(path.join(relativePath, entry))));
}

function rootContains(root: string, file: string): boolean {
  const normalizedRoot = normalizePath(root);
  const normalizedFile = normalizePath(file);
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(`${normalizedRoot}/`);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map(normalizePath))].sort((a, b) => a.localeCompare(b));
}

function lineExcerpt(line: string): string {
  return line.trim().replace(/\s+/g, ' ').slice(0, 220);
}

function classifyDaoMandateMatch(args: {
  file: string;
  lineText: string;
  publicActiveRoots: string[];
  internalAllowlist: string[];
}): Pick<DaoMandateVocabularyFinding, 'classification' | 'severity' | 'reason'> {
  const file = normalizePath(args.file);
  const line = args.lineText;

  if (file.startsWith('tests/')) {
    const isGuard = /doesNotMatch|not\.match|forbidden|absence|absent|retire|decommission|compatibility|legacy|no longer/i.test(line);
    return {
      classification: 'test_guard',
      severity: isGuard ? 'allowed' : 'warning',
      reason: isGuard
        ? 'Test mentions old vocabulary as a negative guard or compatibility fixture.'
        : 'Test mentions old vocabulary without an obvious negative guard; inspect for stale expectation.',
    };
  }

  if (file.startsWith('docs/')) {
    return {
      classification: 'historical_doc',
      severity: 'allowed',
      reason: 'Documentation and release evidence may describe forbidden vocabulary as historical context.',
    };
  }

  if (file.includes('daoMandateGuidanceSettings.ts') || file.includes('daoMandateVisibility.ts')) {
    return {
      classification: 'migration_compatibility',
      severity: 'allowed',
      reason: 'Legacy guidance profile names are retained only for save/settings compatibility.',
    };
  }

  if (args.internalAllowlist.some((entry) => rootContains(entry, file))) {
    const isSpecimen = file.includes('ComponentSpecimens') || file.includes('MandateChamberHero') || file.includes('ModuleRoleBanner');
    return {
      classification: isSpecimen ? 'debug_fixture_only' : 'internal_adapter',
      severity: 'allowed',
      reason: isSpecimen
        ? 'Legacy component/specimen code is retained outside normal player navigation.'
        : 'Raw/internal adapter keeps route truth or forbidden-string guards without rendering default public UI.',
    };
  }

  if (args.publicActiveRoots.some((entry) => rootContains(entry, file))) {
    return {
      classification: 'reachable_public_ui',
      severity: 'blocker',
      reason: 'Active public/default source must not expose old route-board vocabulary.',
    };
  }

  if (file.startsWith('src/')) {
    return {
      classification: 'unknown',
      severity: 'blocker',
      reason: 'Production source match is not classified as active public, internal, migration, or owner detail.',
    };
  }

  return {
    classification: 'unknown',
    severity: 'warning',
    reason: 'Match is outside the configured V2-11 scan roots.',
  };
}

function collectDaoMandateV2Findings(args: {
  files: VocabularyAuditFile[];
  publicActiveRoots: string[];
  internalAllowlist: string[];
}): DaoMandateVocabularyFinding[] {
  const findings: DaoMandateVocabularyFinding[] = [];

  args.files.forEach((file) => {
    const lines = file.text.split('\n');
    lines.forEach((line, index) => {
      DAO_MANDATE_FORBIDDEN_PUBLIC_PATTERNS.forEach(({ term, normalizedTerm, pattern }) => {
        if (!pattern.test(line)) return;
        const classification = classifyDaoMandateMatch({
          file: file.path,
          lineText: line,
          publicActiveRoots: args.publicActiveRoots,
          internalAllowlist: args.internalAllowlist,
        });
        findings.push({
          file: normalizePath(file.path),
          term,
          normalizedTerm,
          line: index + 1,
          excerpt: lineExcerpt(line),
          ...classification,
        });
      });
    });
  });

  return findings;
}

function summarizeFindings<T extends string>(
  findings: DaoMandateVocabularyFinding[],
  getKey: (finding: DaoMandateVocabularyFinding) => T,
): Record<T, number> {
  return findings.reduce((summary, finding) => {
    const key = getKey(finding);
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {} as Record<T, number>);
}

function buildDaoMandateV2Audit(root: string, options: RunVocabularyAuditOptions): VocabularyAuditReport['daoMandateV2'] {
  const publicActiveRoots = uniqueSorted(options.publicActiveRoots ?? DAO_MANDATE_PUBLIC_ACTIVE_ROOTS);
  const internalAllowlist = uniqueSorted(options.internalAllowlist ?? DAO_MANDATE_INTERNAL_ALLOWLIST);
  const sourceFiles = options.files ?? uniqueSorted([
    ...publicActiveRoots.flatMap((entry) => walk(root, entry)),
    ...internalAllowlist.flatMap((entry) => walk(root, entry)),
  ]).map((relativePath) => ({
    path: relativePath,
    text: readFileSync(path.resolve(root, relativePath), 'utf8'),
  }));
  const matches = collectDaoMandateV2Findings({
    files: sourceFiles,
    publicActiveRoots,
    internalAllowlist,
  });
  const blockerCount = matches.filter((finding) => finding.severity === 'blocker').length;
  const warningCount = matches.filter((finding) => finding.severity === 'warning').length;
  const allowedCount = matches.filter((finding) => finding.severity === 'allowed').length;

  return {
    schemaVersion: 'status-v3-dao-decommission-vocabulary-audit',
    overallPass: blockerCount === 0,
    blockerCount,
    warningCount,
    allowedCount,
    scannedRoots: uniqueSorted([...publicActiveRoots, ...internalAllowlist]),
    publicActiveRoots,
    internalAllowlist,
    forbiddenTerms: DAO_MANDATE_FORBIDDEN_PUBLIC_PATTERNS.map((entry) => entry.term),
    matches,
    summaryByTerm: summarizeFindings(matches, (finding) => finding.normalizedTerm),
    summaryByClassification: summarizeFindings(matches, (finding) => finding.classification),
  };
}

export function runVocabularyAudit(options: RunVocabularyAuditOptions = {}): VocabularyAuditReport {
  const root = options.root ?? process.cwd();
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

  const daoMandateV2 = buildDaoMandateV2Audit(root, options);

  return {
    schemaVersion: '7.5b-vocabulary-audit',
    generatedAt: Date.now(),
    overallPass: staleFindings.length === 0 && daoMandateV2.overallPass,
    canonicalTerms: canonicalTermInventory(),
    staleFindings,
    placeholderFindings,
    replacementMap,
    trackedFiles,
    notes: [...LIVE_SURFACE_MANIFEST.notes],
    daoMandateV2,
  };
}

export function renderVocabularyAuditReport(report: VocabularyAuditReport): string {
  const lines: string[] = [];
  lines.push('=== Release Vocabulary Audit (Packet 7.5b) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`trackedFiles: ${report.trackedFiles.length}`);
  lines.push(`staleFindings: ${report.staleFindings.length}`);
  lines.push(`placeholderFindings: ${report.placeholderFindings.length}`);
  lines.push(`daoMandateV2Blockers: ${report.daoMandateV2.blockerCount}`);
  lines.push(`daoMandateV2Warnings: ${report.daoMandateV2.warningCount}`);
  lines.push(`daoMandateV2Allowed: ${report.daoMandateV2.allowedCount}`);
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
  lines.push('');
  lines.push('Status V3 public Dao/Omen decommission vocabulary:');
  lines.push(`- overallPass: ${report.daoMandateV2.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`- publicActiveRoots: ${report.daoMandateV2.publicActiveRoots.length}`);
  lines.push(`- internalAllowlist: ${report.daoMandateV2.internalAllowlist.length}`);
  if (report.daoMandateV2.blockerCount > 0) {
    lines.push('Blockers:');
    report.daoMandateV2.matches
      .filter((finding) => finding.severity === 'blocker')
      .forEach((finding) => {
        lines.push(`- ${finding.file}:${finding.line} [${finding.normalizedTerm}] ${finding.excerpt}`);
      });
  }
  if (report.daoMandateV2.warningCount > 0) {
    lines.push('Warnings:');
    report.daoMandateV2.matches
      .filter((finding) => finding.severity === 'warning')
      .forEach((finding) => {
        lines.push(`- ${finding.file}:${finding.line} [${finding.classification}] ${finding.excerpt}`);
      });
  }
  if (report.daoMandateV2.allowedCount > 0) {
    lines.push('Allowed internal/test/doc/debug matches:');
    report.daoMandateV2.matches
      .filter((finding) => finding.severity === 'allowed')
      .slice(0, 20)
      .forEach((finding) => {
        lines.push(`- ${finding.file}:${finding.line} [${finding.classification}] ${finding.normalizedTerm}`);
      });
    if (report.daoMandateV2.allowedCount > 20) {
      lines.push(`- ... ${report.daoMandateV2.allowedCount - 20} more allowed matches`);
    }
  }
  return lines.join('\n');
}
