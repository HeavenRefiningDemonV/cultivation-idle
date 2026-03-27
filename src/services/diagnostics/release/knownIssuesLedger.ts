import type { ReleaseGateCheckId, ReleaseGateFinding } from './releaseGateTypes.js';
import { RELEASE_GATE_CHECK_IDS } from './releaseGateManifest.js';

export type KnownIssueClassification = 'blocker' | 'accepted_waiver' | 'post_semester_debt' | 'resolved';
export type KnownIssueStatus = 'open' | 'accepted' | 'resolved';

export type KnownIssueLedgerEntry = {
  issueId: string;
  sourceCheckId: ReleaseGateCheckId;
  sourceFindingId?: string;
  classification: KnownIssueClassification;
  title: string;
  owner: string;
  rationale: string;
  mitigation: string;
  evidencePaths: string[];
  firstRecordedAt?: string;
  lastReviewedAt?: string;
  status: KnownIssueStatus;
  expiresAt?: string;
  notes?: string;
};

export const KNOWN_ISSUES_LEDGER: ReadonlyArray<KnownIssueLedgerEntry> = Object.freeze([
  {
    issueId: 'waiver_build_npm_env_http_proxy_warning',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'http-proxy',
    owner: 'release_engineering',
    rationale: 'The warning is environment/tooling metadata and does not indicate product/runtime drift.',
    mitigation: 'Track npm config cleanup outside the semester RC critical path.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
  {
    issueId: 'waiver_build_node_experimental_loader_warning',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'experimental-loader',
    owner: 'release_engineering',
    rationale: 'Node experimental-loader warnings are emitted by strip-types test/runtime wiring in this environment and are non-blocking for product correctness.',
    mitigation: 'Remove loader warnings when Node/register migration is completed in follow-up tooling cleanup.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
  {
    issueId: 'waiver_build_node_trace_warning_hint',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'trace-warnings',
    owner: 'release_engineering',
    rationale: 'The trace-warnings hint line is emitted with experimental warnings and does not indicate a standalone build defect.',
    mitigation: 'Treat as coupled noise with experimental-loader warnings until loader migration is complete.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
  {
    issueId: 'waiver_build_css_syntax_minifier_warning',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'css-syntax-error',
    owner: 'release_engineering',
    rationale: 'Current minifier warnings are stable non-fatal diagnostics from generated CSS token interpolation and do not fail build output generation.',
    mitigation: 'Track style-pipeline cleanup separately; keep as explicit accepted warning while build remains green.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
  {
    issueId: 'waiver_build_chunk_size_warning_limit',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'chunksizewarninglimit',
    owner: 'release_engineering',
    rationale: 'Rollup chunk-size warning is advisory and expected for current bundle composition.',
    mitigation: 'Track chunking optimization separately from release-blocking build correctness.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
  {
    issueId: 'waiver_build_chunk_size_guidance_line',
    sourceCheckId: 'build_audit',
    classification: 'accepted_waiver',
    title: 'adjust chunk size limit',
    owner: 'release_engineering',
    rationale: 'Chunk-size guidance text is a non-blocking advisory line emitted by Vite after successful build output.',
    mitigation: 'Keep advisory tracked while bundle-splitting backlog is addressed.',
    evidencePaths: ['docs/release/build_warning_inventory.md'],
    firstRecordedAt: '2026-03-27',
    lastReviewedAt: '2026-03-27',
    status: 'accepted',
    expiresAt: '2026-06-30',
  },
]);

export function validateKnownIssuesLedger(entries: ReadonlyArray<KnownIssueLedgerEntry>): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  entries.forEach((entry) => {
    if (seen.has(entry.issueId)) issues.push(`Duplicate issueId: ${entry.issueId}`);
    seen.add(entry.issueId);
    if (!RELEASE_GATE_CHECK_IDS.includes(entry.sourceCheckId)) {
      issues.push(`Unknown sourceCheckId on ${entry.issueId}: ${entry.sourceCheckId}`);
    }
    if ((entry.classification === 'accepted_waiver' || entry.classification === 'post_semester_debt') && entry.owner.trim().length === 0) {
      issues.push(`Missing owner for ${entry.issueId}`);
    }
    if ((entry.classification === 'accepted_waiver' || entry.classification === 'post_semester_debt') && entry.rationale.trim().length === 0) {
      issues.push(`Missing rationale for ${entry.issueId}`);
    }
    if (entry.classification === 'accepted_waiver' && entry.evidencePaths.length === 0) {
      issues.push(`Accepted waiver missing evidencePaths: ${entry.issueId}`);
    }
  });
  return issues;
}

const findingMatchesEntry = (finding: ReleaseGateFinding, entry: KnownIssueLedgerEntry): boolean => {
  if (entry.sourceCheckId !== finding.checkId) return false;
  if (entry.sourceFindingId && entry.sourceFindingId === finding.findingId) return true;
  const needle = entry.title.toLowerCase();
  return finding.title.toLowerCase().includes(needle) || finding.message.toLowerCase().includes(needle);
};

export function matchKnownIssueEntries(findings: ReleaseGateFinding[], entries: ReadonlyArray<KnownIssueLedgerEntry>) {
  const matched = new Map<string, KnownIssueLedgerEntry>();
  const untracked: ReleaseGateFinding[] = [];
  findings.forEach((finding) => {
    const entry = entries.find((candidate) => findingMatchesEntry(finding, candidate) && candidate.status !== 'resolved');
    if (!entry) {
      untracked.push(finding);
      return;
    }
    matched.set(finding.findingId, entry);
  });
  return { matched, untracked };
}

export function renderKnownIssuesMarkdown(input: {
  generatedAt: number;
  headline: string;
  blockers: ReleaseGateFinding[];
  acceptedWaivers: ReleaseGateFinding[];
  postSemesterDebt: ReleaseGateFinding[];
  untracked: ReleaseGateFinding[];
  ledger: ReadonlyArray<KnownIssueLedgerEntry>;
}): string {
  const lines: string[] = [];
  lines.push('# Known Issues Ledger');
  lines.push('');
  lines.push(`- Generated: ${new Date(input.generatedAt).toISOString()}`);
  lines.push(`- Release gate headline: ${input.headline}`);
  lines.push('');

  const renderFindings = (title: string, findings: ReleaseGateFinding[]) => {
    lines.push(`## ${title}`);
    if (findings.length === 0) {
      lines.push('- None');
      lines.push('');
      return;
    }
    findings.forEach((finding) => {
      lines.push(`- [${finding.checkId}] ${finding.findingId}: ${finding.title}`);
      lines.push(`  - Severity: ${finding.severity}`);
      lines.push(`  - Message: ${finding.message}`);
      if (finding.evidenceRef) lines.push(`  - Evidence: ${finding.evidenceRef}`);
    });
    lines.push('');
  };

  renderFindings('Open blockers', input.blockers);
  renderFindings('Accepted waivers', input.acceptedWaivers);
  renderFindings('Post-semester debt', input.postSemesterDebt);
  renderFindings('Untracked findings (must classify)', input.untracked);

  lines.push('## Typed ledger entries');
  input.ledger.forEach((entry) => {
    lines.push(`- ${entry.issueId} [${entry.classification}] (${entry.status})`);
    lines.push(`  - sourceCheckId: ${entry.sourceCheckId}`);
    lines.push(`  - owner: ${entry.owner}`);
    lines.push(`  - rationale: ${entry.rationale}`);
    lines.push(`  - mitigation: ${entry.mitigation}`);
    if (entry.evidencePaths.length > 0) lines.push(`  - evidence: ${entry.evidencePaths.join(', ')}`);
  });
  lines.push('');

  return lines.join('\n');
}
