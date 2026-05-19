import { SEMESTER_SLICE_CONTRACT } from '../../../systems/progression/contract/semesterSlice.js';
import { KNOWN_ISSUES_LEDGER } from './knownIssuesLedger.js';
import { RELEASE_GATE_MANIFEST } from './releaseGateManifest.js';
import type { KnownIssueLedgerEntry } from './knownIssuesLedger.js';
import type { ReleaseGateCheckId, ReleaseGateCheckResult, ReleaseGateReport } from './releaseGateTypes.js';
import type {
  ChecklistQuestionSpec,
  ChecklistRow,
  ChecklistStatus,
  ReleaseDecisionDocBuild,
  ReleaseDecisionDocsBundle,
} from './releaseDecisionDocTypes.js';

const UNKNOWN = 'unknown';

const CHECKLIST_QUESTIONS: ReadonlyArray<ChecklistQuestionSpec> = Object.freeze([
  {
    checklistId: 'eng_build_green',
    domain: 'Engineering / startup integrity',
    question: 'Is the build green with no unresolved build blockers?',
    checkIds: ['build_audit'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
  },
  {
    checklistId: 'eng_content_validation',
    domain: 'Engineering / startup integrity',
    question: 'Does content validation pass without startup-blocking content errors?',
    checkIds: ['content_validation'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
  },
  {
    checklistId: 'eng_full_test_suite',
    domain: 'Engineering / startup integrity',
    question: 'Does the full test suite pass?',
    checkIds: ['full_test_suite'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
  },
  {
    checklistId: 'prog_contract_drift',
    domain: 'Progression / playability truth',
    question: 'Does the progression contract show no unresolved error-level drift?',
    checkIds: ['progression_contract'],
    waiverAllowed: true,
    ownerRole: 'Progression/Content',
  },
  {
    checklistId: 'prog_fresh_run_completable',
    domain: 'Progression / playability truth',
    question: 'Does fresh-run acceptance prove the semester slice is completable?',
    checkIds: ['fresh_run_acceptance'],
    waiverAllowed: true,
    ownerRole: 'Progression/Content',
  },
  {
    checklistId: 'prog_manual_coverage',
    domain: 'Progression / playability truth',
    question: 'Is required manual fresh-run coverage complete and passing?',
    checkIds: ['fresh_run_acceptance'],
    waiverAllowed: false,
    ownerRole: 'QA/Release',
  },
  {
    checklistId: 'prog_migration_matrix',
    domain: 'Progression / playability truth',
    question: 'Does the migration matrix pass for the supported legacy-save cases?',
    checkIds: ['migration_matrix'],
    waiverAllowed: false,
    ownerRole: 'Progression/Content',
  },
  {
    checklistId: 'balance_regression',
    domain: 'Balance / route integrity',
    question: 'Does the balance regression suite pass the current locked envelopes?',
    checkIds: ['balance_regression'],
    waiverAllowed: true,
    ownerRole: 'Balance/Systems',
  },
  {
    checklistId: 'balance_route_truth',
    domain: 'Balance / route integrity',
    question: 'Does the route comparison report confirm the supported route classes remain viable and truthful?',
    checkIds: ['route_comparison'],
    waiverAllowed: true,
    ownerRole: 'Balance/Systems',
  },
  {
    checklistId: 'runtime_diagnostics_zero_errors',
    domain: 'Runtime / safety integrity',
    question: 'Does runtime diagnostics report zero unresolved error-level issues?',
    checkIds: ['runtime_diagnostics'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
  },
  {
    checklistId: 'runtime_save_reload_safety',
    domain: 'Runtime / safety integrity',
    question: 'Does save/reload safety coverage pass through the full test suite?',
    checkIds: ['full_test_suite'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
    extraEvidence: ['docs/release/save_load_safety_matrix.md'],
  },
  {
    checklistId: 'runtime_load_failure_explicit',
    domain: 'Runtime / safety integrity',
    question: 'If packet 7.2d exists, is migration/load failure handling still safe and explicit?',
    checkIds: ['runtime_diagnostics', 'full_test_suite'],
    waiverAllowed: false,
    ownerRole: 'Engineering',
    extraEvidence: ['docs/release/qa/failsafe_route.md'],
  },
  {
    checklistId: 'copy_vocabulary_audit',
    domain: 'Copy / presentation integrity',
    question: 'Does the vocabulary audit pass for the live semester surfaces?',
    checkIds: ['vocabulary_audit'],
    waiverAllowed: true,
    ownerRole: 'Progression/Content',
  },
  {
    checklistId: 'copy_surface_truth_coverage',
    domain: 'Copy / presentation integrity',
    question: 'Does surface truth coverage pass through the full test suite?',
    checkIds: ['full_test_suite'],
    waiverAllowed: false,
    ownerRole: 'QA/Release',
    extraEvidence: ['docs/release/surface_truth_audit.md'],
  },
  {
    checklistId: 'copy_visual_icon_consistency',
    domain: 'Copy / presentation integrity',
    question: 'Does live surface visual/icon consistency coverage pass through the full test suite and icon checks/build audit?',
    checkIds: ['full_test_suite', 'build_audit'],
    waiverAllowed: false,
    ownerRole: 'QA/Release',
    extraEvidence: ['docs/release/live_surface_visual_audit.md'],
  },
  {
    checklistId: 'issues_nonpass_ledgered',
    domain: 'Known issues / waiver discipline',
    question: 'Are all remaining non-pass findings explicitly represented in the known-issues ledger?',
    checkIds: ['build_audit', 'content_validation', 'progression_contract', 'fresh_run_acceptance', 'migration_matrix', 'balance_regression', 'route_comparison', 'runtime_diagnostics', 'vocabulary_audit', 'full_test_suite'],
    waiverAllowed: false,
    ownerRole: 'QA/Release',
  },
  {
    checklistId: 'issues_waivers_policy',
    domain: 'Known issues / waiver discipline',
    question: 'Are all accepted waivers policy-compliant and owner/rationale backed?',
    checkIds: ['build_audit', 'progression_contract', 'balance_regression', 'route_comparison', 'runtime_diagnostics', 'vocabulary_audit'],
    waiverAllowed: false,
    ownerRole: 'QA/Release',
  },
]);

const statusPriority: Record<ReleaseGateCheckResult['status'], number> = {
  pass: 0,
  skipped: 1,
  warning: 2,
  pending_manual: 3,
  fail: 4,
};

const isAcceptedWaiver = (entry: KnownIssueLedgerEntry) => entry.classification === 'accepted_waiver' && entry.status === 'accepted';

function binaryDecision(report: ReleaseGateReport): 'GO' | 'NO_GO' {
  return report.releaseReady ? 'GO' : 'NO_GO';
}

function byId(report: ReleaseGateReport): Record<ReleaseGateCheckId, ReleaseGateCheckResult> {
  return Object.fromEntries(report.checks.map((check) => [check.checkId, check])) as Record<ReleaseGateCheckId, ReleaseGateCheckResult>;
}

function aggregateQuestionStatus(checks: ReleaseGateCheckResult[]): ChecklistStatus {
  const ordered = [...checks].sort((a, b) => statusPriority[b.status] - statusPriority[a.status]);
  const worst = ordered[0]?.status;
  if (worst === 'fail') return 'NO';
  if (worst === 'pending_manual' || worst === 'skipped') return 'PENDING';
  if (worst === 'warning') return 'NO';
  return 'YES';
}

function buildChecklistRows(report: ReleaseGateReport): ChecklistRow[] {
  const checkById = byId(report);
  const acceptedWaivers = KNOWN_ISSUES_LEDGER.filter(isAcceptedWaiver);

  return CHECKLIST_QUESTIONS.map((question) => {
    const checks = question.checkIds.map((id) => checkById[id]).filter(Boolean);
    const manifestEvidence = question.checkIds.flatMap((checkId) => {
      const manifestEntry = RELEASE_GATE_MANIFEST.find((entry) => entry.checkId === checkId);
      if (!manifestEntry) return [];
      return [manifestEntry.evidenceCommand, ...manifestEntry.evidencePaths];
    });

    let status = aggregateQuestionStatus(checks);

    if (question.checklistId === 'issues_nonpass_ledgered') {
      status = report.unresolvedWaiverCandidateCount === 0 ? 'YES' : 'NO';
    }

    if (question.checklistId === 'issues_waivers_policy') {
      const policyCompliant = acceptedWaivers.every((entry) => entry.owner.trim().length > 0 && entry.rationale.trim().length > 0 && entry.mitigation.trim().length > 0 && entry.evidencePaths.length > 0);
      status = policyCompliant ? 'YES' : 'NO';
    }

    if (checks.some((check) => check.pendingManualCount > 0) && question.checklistId === 'prog_manual_coverage') {
      status = 'PENDING';
    }

    return {
      checklistId: question.checklistId,
      domain: question.domain,
      question: question.question,
      checkIds: question.checkIds,
      status,
      evidenceSources: [...new Set([...manifestEvidence, ...(question.extraEvidence ?? [])])],
      waiverAllowed: question.waiverAllowed,
      ownerRole: question.ownerRole,
    };
  });
}

function renderMarkdownTable(headers: string[], rows: string[][]): string[] {
  const lines: string[] = [];
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  rows.forEach((row) => lines.push(`| ${row.join(' | ')} |`));
  lines.push('');
  return lines;
}

function formatDecisionHeadline(report: ReleaseGateReport): string {
  return `${binaryDecision(report)} (gate headline: ${report.decisionSummary.headline})`;
}

function renderChecklistMarkdown(input: ReleaseDecisionDocBuild, rows: ChecklistRow[]): string {
  const { report } = input;
  const version = input.metadata?.version ?? UNKNOWN;
  const commit = input.metadata?.commit ?? UNKNOWN;
  const buildId = input.metadata?.buildId ?? UNKNOWN;
  const lines: string[] = [];

  lines.push('# Go / No-Go Checklist');
  lines.push('');
  lines.push(`- generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`- release gate status: ${formatDecisionHeadline(report)}`);
  lines.push(`- cleanPass: ${report.cleanPass}`);
  lines.push(`- acceptedWaivers: ${report.acceptedWaiverCount}`);
  lines.push(`- version: ${version}`);
  lines.push(`- buildId: ${buildId}`);
  lines.push(`- commit: ${commit}`);
  lines.push('');

  const domains = [...new Set(rows.map((row) => row.domain))];
  for (const domain of domains) {
    lines.push(`## ${domain}`);
    lines.push(...renderMarkdownTable(
      ['checklist id', 'linked checkId(s)', 'question', 'status', 'evidence source(s)', 'waiver allowed?', 'owner role'],
      rows
        .filter((row) => row.domain === domain)
        .map((row) => [
          `\`${row.checklistId}\``,
          row.checkIds.map((id) => `\`${id}\``).join(', '),
          row.question,
          row.status,
          row.evidenceSources.map((source) => `\`${source}\``).join('<br/>'),
          row.waiverAllowed ? 'YES' : 'NO',
          row.ownerRole,
        ]),
    ));
  }

  lines.push('## Final checklist rule');
  lines.push('- GO requires every checklist question to be `YES`.');
  lines.push('- Accepted waivers may exist only when still policy-compliant and explicitly represented in the known-issues ledger.');
  lines.push('- Any `NO` or `PENDING` checklist status means `NO_GO`.');
  lines.push('');

  return lines.join('\n');
}

function renderSignoffMarkdown(input: ReleaseDecisionDocBuild): string {
  const { report } = input;
  const lines: string[] = [];
  const decision = binaryDecision(report);
  const checkById = byId(report);

  const groups: Array<{ title: string; checkIds: ReleaseGateCheckId[] }> = [
    { title: 'Build / Content / Test', checkIds: ['build_audit', 'content_validation', 'full_test_suite'] },
    { title: 'Progression / Fresh-run / Migration', checkIds: ['progression_contract', 'fresh_run_acceptance', 'migration_matrix'] },
    { title: 'Balance / Routes', checkIds: ['balance_regression', 'route_comparison'] },
    { title: 'Runtime diagnostics', checkIds: ['runtime_diagnostics'] },
    { title: 'Vocabulary / Copy / Presentation', checkIds: ['vocabulary_audit'] },
  ];

  lines.push('# Release Sign-off Sheet');
  lines.push('');
  lines.push('## Release candidate identity');
  lines.push(`- generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`- releaseDecision: ${decision}`);
  lines.push(`- cleanPass: ${report.cleanPass}`);
  lines.push(`- acceptedWaiverCount: ${report.acceptedWaiverCount}`);
  lines.push(`- unresolvedBlockerCount: ${report.unresolvedBlockerCount}`);
  lines.push(`- pendingManualCount: ${report.pendingManualCount}`);
  lines.push(`- version: ${input.metadata?.version ?? UNKNOWN}`);
  lines.push(`- buildId: ${input.metadata?.buildId ?? UNKNOWN}`);
  lines.push(`- commit: ${input.metadata?.commit ?? UNKNOWN}`);
  lines.push('');

  lines.push('## Slice summary');
  lines.push(`- semesterSliceId: ${SEMESTER_SLICE_CONTRACT.id}`);
  lines.push(`- semesterSliceLabel: ${SEMESTER_SLICE_CONTRACT.label}`);
  lines.push(`- contentCapRealm: ${report.sliceSummary.contentCapRealmId}`);
  lines.push(`- liveCityChain: ${report.sliceSummary.liveCityIds.join(' -> ')}`);
  lines.push(`- liveGateCount: ${SEMESTER_SLICE_CONTRACT.liveTrialIds.length}`);
  lines.push(`- liveGateChain: ${SEMESTER_SLICE_CONTRACT.liveTrialIds.join(' -> ')}`);
  lines.push(`- deferredSystems: ${report.sliceSummary.deferredSystems.length > 0 ? report.sliceSummary.deferredSystems.join(', ') : 'none listed'}`);
  lines.push(`- fakeCity6Detected: ${report.sliceSummary.fakeCitySixDetected}`);
  lines.push('');

  groups.forEach((group) => {
    lines.push(`## Evidence summary: ${group.title}`);
    lines.push(...renderMarkdownTable(
      ['check id', 'status', 'evidence command/doc', 'summary', 'blockers', 'warnings'],
      group.checkIds.map((checkId) => {
        const check = checkById[checkId];
        const manifestEntry = RELEASE_GATE_MANIFEST.find((entry) => entry.checkId === checkId);
        return [
          `\`${checkId}\``,
          check.status,
          `\`${manifestEntry?.evidenceCommand ?? UNKNOWN}\``,
          check.summary,
          String(check.blockerCount),
          String(check.warningCount),
        ];
      }),
    ));
  });

  lines.push('## Route summary');
  const freshRunPayload = checkById.fresh_run_acceptance.rawPayload as { routeSummaries?: Record<string, { automatedStatus?: string; manualStatus?: string }> } | undefined;
  lines.push('- Fresh-run (normal/cautious/aggressive):');
  ['normal', 'cautious', 'aggressive'].forEach((routeId) => {
    const row = freshRunPayload?.routeSummaries?.[routeId];
    lines.push(`  - ${routeId}: automated=${row?.automatedStatus ?? UNKNOWN}, manual=${row?.manualStatus ?? UNKNOWN}`);
  });
  const routePayload = checkById.route_comparison.rawPayload as { routeSummaries?: Array<{ routeId: string; status: string; automationMode: string }> } | undefined;
  lines.push('- Route classes (fail_safe/offline_heavy/low_attention/high_skill/reclaim):');
  ['fail_safe', 'offline_heavy', 'low_attention', 'high_skill', 'reclaim'].forEach((routeId) => {
    const row = routePayload?.routeSummaries?.find((entry) => entry.routeId === routeId);
    lines.push(`  - ${routeId}: status=${row?.status ?? UNKNOWN}, automation=${row?.automationMode ?? UNKNOWN}`);
  });
  lines.push('- Automated proof source: `release:fresh-run-report` + `release:route-report`.');
  lines.push('- Manual coverage source: `docs/release/qa/manual_results.example.json` and fresh-run manual ingestion in fresh-run report.');
  lines.push('');

  const unresolvedBlockers = report.checks.flatMap((check) => check.findings.filter((finding) => finding.severity === 'blocker'));
  const acceptedWaivers = input.ledger.filter((entry) => entry.classification === 'accepted_waiver' && entry.status === 'accepted');
  const postSemesterDebt = input.ledger.filter((entry) => entry.classification === 'post_semester_debt' && entry.status !== 'resolved');

  lines.push('## Known issues / waivers');
  lines.push('### Accepted waivers');
  lines.push(...renderMarkdownTable(
    ['issue id', 'title', 'classification', 'owner', 'rationale', 'mitigation', 'evidence'],
    acceptedWaivers.length > 0
      ? acceptedWaivers.map((entry) => [entry.issueId, entry.title, entry.classification, entry.owner, entry.rationale, entry.mitigation, entry.evidencePaths.join(', ')])
      : [['none', 'none', 'none', 'none', 'none', 'none', 'none']],
  ));

  lines.push('### Post-semester debt');
  lines.push(...renderMarkdownTable(
    ['issue id', 'title', 'classification', 'owner', 'rationale', 'mitigation', 'evidence'],
    postSemesterDebt.length > 0
      ? postSemesterDebt.map((entry) => [entry.issueId, entry.title, entry.classification, entry.owner, entry.rationale, entry.mitigation, entry.evidencePaths.join(', ')])
      : [['none', 'none', 'none', 'none', 'none', 'none', 'none']],
  ));

  lines.push('### Unresolved blockers');
  lines.push(...renderMarkdownTable(
    ['issue id', 'title', 'classification', 'owner', 'rationale', 'mitigation', 'evidence'],
    unresolvedBlockers.length > 0
      ? unresolvedBlockers.map((finding) => [finding.findingId, finding.title, 'blocker', 'from_check', finding.message, 'fix before GO', finding.evidenceRef ?? finding.checkId])
      : [['none', 'none', 'none', 'none', 'none', 'none', 'none']],
  ));

  lines.push('## Sign-off owner fields');
  lines.push(...renderMarkdownTable(
    ['owner area', 'reviewer name', 'decision/initials', 'date', 'notes'],
    [
      ['Engineering', '', '', '', ''],
      ['Progression/Content', '', '', '', ''],
      ['Balance/Systems', '', '', '', ''],
      ['QA/Release', '', '', '', ''],
    ],
  ));

  lines.push('## Final decision');
  lines.push(`- RELEASE DECISION: ${decision}`);
  lines.push(`- reason: ${report.decisionSummary.rationale.join('; ')}`);
  lines.push(`- accepted waivers listed separately: ${acceptedWaivers.length}`);
  lines.push('');

  return lines.join('\n');
}

function renderHandoffMarkdown(input: ReleaseDecisionDocBuild): string {
  const { report } = input;
  const lines: string[] = [];
  const decision = binaryDecision(report);

  const commandMap = [
    'npm run release:gate',
    'npm run release:handoff',
    'npm run release:fresh-run-report',
    'npm run release:migration-matrix',
    'npm run balance:report',
    'npm run release:route-report',
    'npm run release:runtime-diagnostics',
    'npm run release:vocab-audit',
    'npm run release:build-audit',
    'npm run validate:content',
    'npm run progression:report',
    'npm run test',
  ];

  lines.push('# Release Handoff Bundle');
  lines.push('');
  lines.push('## What this build is');
  lines.push(`- semester slice: ${SEMESTER_SLICE_CONTRACT.id} (${SEMESTER_SLICE_CONTRACT.label})`);
  lines.push(`- content cap realm: ${report.sliceSummary.contentCapRealmId}`);
  lines.push(`- live city chain: ${report.sliceSummary.liveCityIds.join(' -> ')}`);
  lines.push(`- live gate chain: ${SEMESTER_SLICE_CONTRACT.liveTrialIds.join(' -> ')}`);
  lines.push('- live route matrix scope: fail_safe, offline_heavy, low_attention, high_skill, reclaim (packet 7.3 route comparison).');
  lines.push('- prestige/current-cap truth scope: fresh-run acceptance final-truth checks for cap reach, life summary, and chapter-exhausted signal.');
  lines.push('- section 7 verification scope: fresh-run acceptance, migration matrix, balance regression, route comparison, runtime diagnostics, vocabulary/build audits, release gate aggregation.');
  lines.push('');

  lines.push('## Current release status');
  lines.push(`- release gate headline: ${report.decisionSummary.headline}`);
  lines.push(`- binary decision: ${decision}`);
  lines.push(`- cleanPass: ${report.cleanPass}`);
  lines.push(`- acceptedWaivers: ${report.acceptedWaiverCount}`);
  lines.push(`- unresolvedBlockers: ${report.unresolvedBlockerCount}`);
  lines.push(`- pendingManual: ${report.pendingManualCount}`);
  lines.push('');

  lines.push('## Command map');
  commandMap.forEach((cmd) => lines.push(`- \`${cmd}\``));
  lines.push('');

  lines.push('## Evidence/doc map');
  [
    ['docs/release/known_issues.md', 'Current known-issues snapshot generated from ledger + gate findings.'],
    ['docs/release/waiver_policy.md', 'Waiver classification and never-waivable rules.'],
    ['docs/release/go_no_go_checklist.md', 'Fixed binary rubric rendered from manifest/report.'],
    ['docs/release/signoff_sheet.md', 'Reviewer-facing sign-off sheet with evidence and owner fields.'],
    ['docs/release/build_warning_inventory.md', 'Build warning inventory and disposition.'],
    ['docs/release/migration_fixture_catalog.md', 'Supported migration fixture coverage matrix.'],
    ['docs/release/vocabulary_audit.md', 'Player-facing copy audit report.'],
    ['docs/release/surface_truth_audit.md', 'Surface truth verification notes.'],
    ['docs/release/live_surface_visual_audit.md', 'Live surface visual/icon consistency audit notes.'],
    ['docs/release/save_load_safety_matrix.md', 'Save/reload safety coverage reference.'],
    ['docs/release/performance_smoke_checklist.md', 'Performance smoke checklist reference.'],
    ['docs/release/qa', 'Fresh-save and alternative-route QA route docs.'],
  ].forEach(([path, purpose]) => lines.push(`- \`${path}\`: ${purpose}`));
  lines.push('');

  lines.push('## Report/source map');
  [
    ['progression contract', 'scripts/progressionContractReport.ts', 'src/systems/progression/diagnostics/index.ts'],
    ['fresh-run acceptance', 'scripts/release/buildFreshRunAcceptanceReport.ts', 'src/services/diagnostics/release/freshRunAcceptanceReport.ts'],
    ['migration matrix', 'scripts/release/runMigrationMatrix.ts', 'src/save/migrations/migrationMatrix.ts'],
    ['balance regression', 'scripts/balanceRegressionReport.ts', 'tmp-tests/scripts/balanceRegressionReport.js'],
    ['route comparison', 'scripts/release/buildRouteComparisonReport.ts', 'src/services/diagnostics/release/routeComparisonReport.ts'],
    ['runtime diagnostics', 'scripts/release/runRuntimeDiagnostics.ts', 'src/services/diagnostics/release/runtimeDiagnosticsReport.ts'],
    ['release gate', 'scripts/release/runReleaseGate.ts', 'src/services/diagnostics/release/releaseGate.ts'],
  ].forEach(([name, script, source]) => lines.push(`- ${name}: script=\`${script}\`, source=\`${source}\``));
  lines.push('');

  const openBlockers = input.ledger.filter((entry) => entry.classification === 'blocker' && entry.status !== 'resolved');
  const acceptedWaivers = input.ledger.filter((entry) => entry.classification === 'accepted_waiver' && entry.status === 'accepted');
  const postSemesterDebt = input.ledger.filter((entry) => entry.classification === 'post_semester_debt' && entry.status !== 'resolved');

  lines.push('## Known issues snapshot');
  lines.push(`- open blockers: ${openBlockers.length}`);
  openBlockers.forEach((entry) => lines.push(`  - ${entry.issueId} (${entry.owner})`));
  lines.push(`- accepted waivers: ${acceptedWaivers.length}`);
  acceptedWaivers.forEach((entry) => lines.push(`  - ${entry.issueId} (${entry.owner})`));
  lines.push(`- post-semester debt: ${postSemesterDebt.length}`);
  postSemesterDebt.forEach((entry) => lines.push(`  - ${entry.issueId} (${entry.owner})`));
  lines.push('');

  lines.push('## How to continue');
  lines.push('- First command: run `npm run release:gate` to refresh the canonical gate report for this branch.');
  lines.push('- First docs to read: `docs/release/signoff_sheet.md`, `docs/release/go_no_go_checklist.md`, and `docs/release/known_issues.md`.');
  lines.push('- Do not assume oral-history approvals or cached CI state; always regenerate gate + handoff artifacts locally for the current commit.');
  lines.push('- Release truth lives in structured modules: `releaseGateManifest.ts`, `releaseGate.ts`, `knownIssuesLedger.ts`, and report builders under `src/services/diagnostics/release/`.');
  lines.push('');

  return lines.join('\n');
}

export function buildReleaseDecisionDocs(input: ReleaseDecisionDocBuild): ReleaseDecisionDocsBundle {
  const rows = buildChecklistRows(input.report);
  return {
    checklistRows: rows,
    checklistMarkdown: renderChecklistMarkdown(input, rows),
    signoffMarkdown: renderSignoffMarkdown(input),
    handoffMarkdown: renderHandoffMarkdown(input),
    binaryDecision: binaryDecision(input.report),
  };
}

export function buildReleaseDecisionDocsFromDefaults(report: ReleaseGateReport, metadata?: ReleaseDecisionDocBuild['metadata']) {
  return buildReleaseDecisionDocs({
    report,
    manifest: RELEASE_GATE_MANIFEST,
    ledger: KNOWN_ISSUES_LEDGER,
    metadata,
  });
}

export const RELEASE_CHECKLIST_QUESTIONS = CHECKLIST_QUESTIONS;
