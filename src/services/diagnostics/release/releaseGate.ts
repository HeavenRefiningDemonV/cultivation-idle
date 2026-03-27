import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { KNOWN_ISSUES_LEDGER, matchKnownIssueEntries, renderKnownIssuesMarkdown, validateKnownIssuesLedger } from './knownIssuesLedger.js';
import { RELEASE_GATE_MANIFEST } from './releaseGateManifest.js';
import { buildSliceSummary, runReleaseGateAdapter, type ReleaseGateAdapterContext } from './releaseGateAdapters.js';
import type { ReleaseGateCheckId, ReleaseGateCheckResult, ReleaseGateDecisionSummary, ReleaseGateFinding, ReleaseGateReport } from './releaseGateTypes.js';

export type RunReleaseGateOptions = {
  only?: ReleaseGateCheckId[];
  skip?: ReleaseGateCheckId[];
  adapterContext?: ReleaseGateAdapterContext;
  adapterOverrides?: Partial<Record<ReleaseGateCheckId, () => Promise<Omit<ReleaseGateCheckResult, 'checkId' | 'elapsedMs'>>>>;
};

const shouldRunCheck = (checkId: ReleaseGateCheckId, options: RunReleaseGateOptions): boolean => {
  if (options.only && options.only.length > 0 && !options.only.includes(checkId)) return false;
  if (options.skip && options.skip.includes(checkId)) return false;
  return true;
};

const finalizeDecision = (args: {
  unresolvedBlockerCount: number;
  pendingManualCount: number;
  unresolvedWaiverCandidateCount: number;
  acceptedWaiverCount: number;
}): ReleaseGateDecisionSummary => {
  if (args.unresolvedBlockerCount > 0 || args.pendingManualCount > 0 || args.unresolvedWaiverCandidateCount > 0) {
    const reasons: string[] = [];
    if (args.unresolvedBlockerCount > 0) reasons.push(`${args.unresolvedBlockerCount} unresolved blockers remain`);
    if (args.pendingManualCount > 0) reasons.push(`${args.pendingManualCount} pending-manual checks remain`);
    if (args.unresolvedWaiverCandidateCount > 0) reasons.push(`${args.unresolvedWaiverCandidateCount} waiver-candidate findings are untracked/unaccepted`);
    return { headline: 'NO_GO', rationale: reasons };
  }
  if (args.acceptedWaiverCount > 0) {
    return { headline: 'PASS_WITH_ACCEPTED_WAIVERS', rationale: [`${args.acceptedWaiverCount} accepted waivers are active`] };
  }
  return { headline: 'PASS', rationale: ['All checks passed with no accepted waivers'] };
};

export async function buildReleaseGateReport(options: RunReleaseGateOptions = {}): Promise<ReleaseGateReport> {
  const checks: ReleaseGateCheckResult[] = [];
  for (const entry of RELEASE_GATE_MANIFEST) {
    if (!shouldRunCheck(entry.checkId, options)) {
      checks.push({
        checkId: entry.checkId,
        status: 'skipped',
        elapsedMs: 0,
        commandOrBuilder: 'skipped',
        summary: 'Skipped by filter.',
        blockerCount: 0,
        warningCount: 0,
        pendingManualCount: 0,
        findings: [],
        evidence: [],
      });
      continue;
    }
    const startedAt = Date.now();
    try {
      const override = options.adapterOverrides?.[entry.checkId];
      const result = override ? await override() : await runReleaseGateAdapter(entry.checkId, options.adapterContext);
      checks.push({ ...result, checkId: entry.checkId, elapsedMs: Date.now() - startedAt });
    } catch (error) {
      const finding: ReleaseGateFinding = {
        findingId: `${entry.checkId}_adapter_exception`,
        checkId: entry.checkId,
        title: 'adapter_exception',
        message: error instanceof Error ? error.message : String(error),
        severity: 'blocker',
        waivable: false,
        sourceKind: 'derived',
      };
      checks.push({
        checkId: entry.checkId,
        status: 'fail',
        elapsedMs: Date.now() - startedAt,
        commandOrBuilder: 'adapter_exception',
        summary: 'Adapter execution failed.',
        blockerCount: 1,
        warningCount: 0,
        pendingManualCount: 0,
        findings: [finding],
        evidence: [],
      });
    }
  }

  const allFindings = checks.flatMap((check) => check.findings);
  const ledgerValidation = validateKnownIssuesLedger(KNOWN_ISSUES_LEDGER);
  const { matched, untracked } = matchKnownIssueEntries(
    allFindings.filter((finding) => finding.severity === 'waiver_candidate' || finding.severity === 'post_semester_debt'),
    KNOWN_ISSUES_LEDGER,
  );

  const unresolvedBlockerCount = checks.reduce((sum, check) => sum + check.blockerCount, 0);
  const pendingManualCount = checks.reduce((sum, check) => sum + check.pendingManualCount, 0);
  const acceptedWaiverCount = Array.from(matched.values()).filter((entry) => entry.classification === 'accepted_waiver' && entry.status === 'accepted').length;
  const unresolvedWaiverCandidateCount = untracked.length + ledgerValidation.length;

  const decisionSummary = finalizeDecision({
    unresolvedBlockerCount,
    pendingManualCount,
    unresolvedWaiverCandidateCount,
    acceptedWaiverCount,
  });

  const releaseReady = decisionSummary.headline !== 'NO_GO';
  const overallPass = decisionSummary.headline !== 'NO_GO';
  const cleanPass = releaseReady && acceptedWaiverCount === 0;

  return {
    schemaVersion: '7.6-release-gate',
    generatedAt: Date.now(),
    overallPass,
    cleanPass,
    releaseReady,
    unresolvedBlockerCount,
    acceptedWaiverCount,
    unresolvedWaiverCandidateCount,
    pendingManualCount,
    checks,
    knownIssueSummary: {
      openBlockers: KNOWN_ISSUES_LEDGER.filter((entry) => entry.classification === 'blocker' && entry.status !== 'resolved').length,
      acceptedWaivers: KNOWN_ISSUES_LEDGER.filter((entry) => entry.classification === 'accepted_waiver' && entry.status === 'accepted').length,
      postSemesterDebt: KNOWN_ISSUES_LEDGER.filter((entry) => entry.classification === 'post_semester_debt' && entry.status !== 'resolved').length,
      resolved: KNOWN_ISSUES_LEDGER.filter((entry) => entry.status === 'resolved').length,
      untrackedFindings: untracked.length + ledgerValidation.length,
    },
    decisionSummary,
    sliceSummary: buildSliceSummary(),
  };
}

export function renderReleaseGateReport(report: ReleaseGateReport): string {
  const lines: string[] = [];
  const headline =
    report.decisionSummary.headline === 'PASS'
      ? 'PASS'
      : report.decisionSummary.headline === 'PASS_WITH_ACCEPTED_WAIVERS'
        ? 'PASS WITH ACCEPTED WAIVERS'
        : 'NO GO';
  lines.push(`=== RELEASE GATE: ${headline} ===`);
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`releaseReady: ${report.releaseReady}`);
  lines.push(`cleanPass: ${report.cleanPass}`);
  lines.push(`unresolvedBlockers: ${report.unresolvedBlockerCount}`);
  lines.push(`pendingManual: ${report.pendingManualCount}`);
  lines.push(`acceptedWaivers: ${report.acceptedWaiverCount}`);
  lines.push(`unresolvedWaiverCandidates: ${report.unresolvedWaiverCandidateCount}`);
  lines.push('');
  lines.push('Per-check status:');
  report.checks.forEach((check) => {
    lines.push(`- ${check.checkId}: ${check.status} | blockers=${check.blockerCount} warnings=${check.warningCount} pending_manual=${check.pendingManualCount}`);
  });
  lines.push('');
  lines.push('Decision rationale:');
  report.decisionSummary.rationale.forEach((line) => lines.push(`- ${line}`));
  lines.push('');
  lines.push('Evidence hints:');
  RELEASE_GATE_MANIFEST.forEach((entry) => lines.push(`- ${entry.checkId}: ${entry.evidenceCommand}`));
  return lines.join('\n');
}

export function writeKnownIssuesDoc(report: ReleaseGateReport): string {
  const findings = report.checks.flatMap((check) => check.findings);
  const markdown = renderKnownIssuesMarkdown({
    generatedAt: report.generatedAt,
    headline: report.decisionSummary.headline,
    blockers: findings.filter((entry) => entry.severity === 'blocker'),
    acceptedWaivers: findings.filter((entry) => entry.severity === 'waiver_candidate'),
    postSemesterDebt: findings.filter((entry) => entry.severity === 'post_semester_debt'),
    untracked: [],
    ledger: KNOWN_ISSUES_LEDGER,
  });
  const outputPath = path.resolve(process.cwd(), 'docs/release/known_issues.md');
  writeFileSync(outputPath, markdown, 'utf8');
  return outputPath;
}
