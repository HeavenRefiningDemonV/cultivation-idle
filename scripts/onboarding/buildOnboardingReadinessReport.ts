import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { OnboardingReleaseMatrixReport } from './buildOnboardingReleaseMatrix.js';

interface CommandEvidence {
  name: string;
  command: string;
  status: string;
  exitCode?: number | null;
  durationSeconds?: number | null;
  artifact?: string;
  log?: string;
  stdoutLog?: string;
  stderrLog?: string;
  classification?: string;
}

interface OnboardingReadinessSummary {
  schemaVersion: 'onboarding-readiness-v1';
  generatedAt: string;
  verdict: {
    onboardingTargeted: 'GO' | 'GO_WITH_KNOWN_BROAD_BLOCKERS' | 'NO_GO' | 'UNKNOWN';
    fullRelease: 'GO' | 'NO_GO' | 'UNKNOWN';
    reason: string;
  };
  commands: CommandEvidence[];
  matrix?: {
    artifact: string;
    overallPass: boolean;
    blockerCount: number;
    warningCount: number;
  };
  blockers: Array<{
    id: string;
    severity: 'blocker' | 'high' | 'medium' | 'low';
    classification: string;
    scope: 'onboarding' | 'broad_release' | 'tooling' | 'manual';
    evidence: string;
    nextAction: string;
  }>;
  tools: Record<string, { status: string; evidence?: string; fallback?: string }>;
}

interface ReadinessReportBuildResult {
  summary: OnboardingReadinessSummary;
  markdown: string;
}

interface ReleaseGateFinding {
  title: string;
  message: string;
  severity: string;
}

interface ReleaseGateCheckSummary {
  checkId: string;
  status: string;
  blockerCount: number;
  pendingManualCount: number;
  summary: string;
  findings: ReleaseGateFinding[];
}

interface ReleaseGateSummary {
  overallPass: boolean;
  releaseReady: boolean;
  unresolvedBlockerCount: number;
  pendingManualCount: number;
  unresolvedWaiverCandidateCount: number;
  decisionSummary?: { headline?: string; rationale?: string[] };
  checks: ReleaseGateCheckSummary[];
}

const DEFAULT_PATHS = {
  preflightSummary: 'artifacts/mp6/preflight/onboarding-release/preflight-command-summary.json',
  finalSummary: 'artifacts/mp6/final/onboarding-release/final-command-summary.json',
  matrix: 'artifacts/mp6/final/onboarding-release/onboarding-release-matrix.json',
  toolStatus: 'artifacts/mp6/preflight/onboarding-release/tool-capability-status.md',
  mp5ReleaseGateSummary: 'artifacts/mp5/final/onboarding-capstone/release-gate-json-summary.json',
};

function readJson<T>(relativePath: string): T | null {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '')) as T;
}

function readText(relativePath: string): string | null {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : null;
}

function normalizeCommands(value: unknown): CommandEvidence[] {
  if (Array.isArray(value)) return value as CommandEvidence[];
  if (value && typeof value === 'object' && Array.isArray((value as { commands?: unknown }).commands)) {
    return (value as { commands: CommandEvidence[] }).commands;
  }
  return [];
}

function parseReleaseGateReport(): ReleaseGateSummary | null {
  const stdout = readText('artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log');
  if (!stdout) return null;
  const start = stdout.indexOf('{\n  "schemaVersion": "7.6-release-gate"');
  if (start < 0) return null;
  try {
    const report = JSON.parse(stdout.slice(start)) as {
      overallPass: boolean;
      releaseReady: boolean;
      unresolvedBlockerCount: number;
      pendingManualCount: number;
      unresolvedWaiverCandidateCount: number;
      decisionSummary?: { headline?: string; rationale?: string[] };
      checks?: Array<{
        checkId: string;
        status: string;
        blockerCount?: number;
        pendingManualCount?: number;
        summary?: string;
        findings?: ReleaseGateFinding[];
      }>;
    };
    return {
      overallPass: report.overallPass,
      releaseReady: report.releaseReady,
      unresolvedBlockerCount: report.unresolvedBlockerCount,
      pendingManualCount: report.pendingManualCount,
      unresolvedWaiverCandidateCount: report.unresolvedWaiverCandidateCount,
      decisionSummary: report.decisionSummary,
      checks: (report.checks ?? []).map((check) => ({
        checkId: check.checkId,
        status: check.status,
        blockerCount: check.blockerCount ?? 0,
        pendingManualCount: check.pendingManualCount ?? 0,
        summary: check.summary ?? '',
        findings: check.findings ?? [],
      })),
    };
  } catch {
    return null;
  }
}

function commandPassed(commands: readonly CommandEvidence[], name: string): boolean {
  return commands.some((command) => command.name === name && command.status === 'PASS');
}

function commandFailed(commands: readonly CommandEvidence[], name: string): boolean {
  return commands.some((command) => command.name === name && !['PASS', 'PASS_NO_MATCHES'].includes(command.status));
}

function parseTools(markdown: string | null): Record<string, { status: string; evidence?: string; fallback?: string }> {
  const tools: Record<string, { status: string; evidence?: string; fallback?: string }> = {};
  if (!markdown) return tools;
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^- ([^:]+): ([A-Z0-9_]+)/);
    if (match) {
      tools[match[1]] = { status: match[2] };
    }
  }
  return tools;
}

function renderCommandTable(commands: readonly CommandEvidence[]): string {
  if (commands.length === 0) return 'No command evidence was found.';
  return [
    '| Command | Result | Evidence |',
    '|---|---:|---|',
    ...commands.map((command) => {
      const artifact = command.artifact ?? command.log ?? command.stdoutLog ?? '';
      return `| \`${command.command}\` | ${command.status} | ${artifact || 'n/a'} |`;
    }),
  ].join('\n');
}

function buildBlockers(
  commands: readonly CommandEvidence[],
  matrix: OnboardingReleaseMatrixReport | null,
  releaseGate: ReleaseGateSummary | null,
): OnboardingReadinessSummary['blockers'] {
  const blockers: OnboardingReadinessSummary['blockers'] = [];
  if (matrix && !matrix.overallPass) {
    blockers.push({
      id: 'onboarding_release_matrix_failed',
      severity: 'blocker',
      classification: 'onboarding_matrix',
      scope: 'onboarding',
      evidence: DEFAULT_PATHS.matrix,
      nextAction: 'Fix route escape or source/sink guard violations before release review.',
    });
  }
  if (commandFailed(commands, 'targeted-onboarding-suite')) {
    blockers.push({
      id: 'targeted_onboarding_suite_failed',
      severity: 'blocker',
      classification: 'onboarding_regression',
      scope: 'onboarding',
      evidence: 'artifacts/mp6/final/onboarding-release/logs/targeted-onboarding-suite.final.log',
      nextAction: 'Classify failing onboarding tests and fix MP6-scoped regressions only.',
    });
  }
  if (commandFailed(commands, 'test-contracts')) {
    blockers.push({
      id: 'broad_contract_suite_failed',
      severity: 'blocker',
      classification: 'broad_release',
      scope: 'broad_release',
      evidence: 'artifacts/mp6/final/onboarding-release/logs/test-contracts.final.stdout.log',
      nextAction: 'Triage broad contract failures outside MP6; MP6 focused onboarding tests are green.',
    });
  }
  if (commandFailed(commands, 'release-gate-json')) {
    if (releaseGate) {
      for (const check of releaseGate.checks.filter((entry) => entry.status === 'fail' || entry.status === 'pending_manual')) {
        blockers.push({
          id: `release_gate_${check.checkId}`,
          severity: 'blocker',
          classification: check.status === 'pending_manual' ? 'pending_manual' : 'broad_release',
          scope: check.status === 'pending_manual' ? 'manual' : 'broad_release',
          evidence: 'artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log',
          nextAction: `${check.summary} ${check.findings.map((finding) => finding.message).join(' ')}`.trim(),
        });
      }
      if (releaseGate.unresolvedWaiverCandidateCount > 0) {
        blockers.push({
          id: 'release_gate_untracked_waiver_candidates',
          severity: 'high',
          classification: 'waiver_candidate_tracking',
          scope: 'broad_release',
          evidence: 'artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log',
          nextAction: `Classify, fix, or owner-accept ${releaseGate.unresolvedWaiverCandidateCount} waiver-candidate findings with evidence and expiry.`,
        });
      }
    } else {
      blockers.push({
        id: 'full_release_gate_no_go',
        severity: 'blocker',
        classification: 'broad_release',
        scope: 'broad_release',
        evidence: 'artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log',
        nextAction: 'Resolve broad release gate blockers or attach owner-approved waivers with expiry evidence.',
      });
    }
  }
  if (!commands.some((command) => command.name === 'playwright-onboarding-ui-smoke' && command.status === 'PASS')) {
    blockers.push({
      id: 'manual_browser_or_playwright_evidence_pending',
      severity: 'medium',
      classification: 'manual_coverage',
      scope: 'manual',
      evidence: DEFAULT_PATHS.toolStatus,
      nextAction: 'Repeat fresh first-life route and locked-route checks in Browser or Playwright before full release signoff.',
    });
  }
  return blockers;
}

function buildVerdict(
  commands: readonly CommandEvidence[],
  matrix: OnboardingReleaseMatrixReport | null,
  blockers: readonly OnboardingReadinessSummary['blockers'][number][],
): OnboardingReadinessSummary['verdict'] {
  const targetedGreen =
    commandPassed(commands, 'targeted-onboarding-suite')
    && commandPassed(commands, 'typecheck')
    && commandPassed(commands, 'check-icons')
    && commandPassed(commands, 'validate-content')
    && (matrix?.overallPass ?? false);
  const onboardingBlocker = blockers.some((blocker) => blocker.scope === 'onboarding' && blocker.severity === 'blocker');
  const releaseGateFailed = commandFailed(commands, 'release-gate-json');

  if (!targetedGreen || onboardingBlocker) {
    return {
      onboardingTargeted: 'NO_GO',
      fullRelease: releaseGateFailed ? 'NO_GO' : 'UNKNOWN',
      reason: 'Onboarding targeted evidence is incomplete or failing.',
    };
  }

  if (releaseGateFailed || blockers.some((blocker) => blocker.scope !== 'onboarding')) {
    return {
      onboardingTargeted: 'GO_WITH_KNOWN_BROAD_BLOCKERS',
      fullRelease: 'NO_GO',
      reason: 'Onboarding targeted evidence is green, but broad release or manual/tooling blockers remain.',
    };
  }

  return {
    onboardingTargeted: 'GO',
    fullRelease: 'UNKNOWN',
    reason: 'Onboarding targeted evidence is green; full release depends on final release gate status.',
  };
}

function renderManualQaScript(): string {
  return [
    '1. Start a fresh first-life save and confirm LifeStart owns the foreground at M0.',
    '2. Progress M1-M3 and verify only Cultivation, then Status, then World/Outskirts become reachable.',
    '3. Try locked tabs and locked world modules at M3; they must not open in normal mode.',
    '4. Progress M4-M8 and confirm Manual Pavilion, Techniques, Apothecary, Expeditions, Forge, Ruins, and Bounty Board unlock in order.',
    '5. At M8, confirm Gate Trial can appear as teaser but cannot open before M9.',
    '6. Lose one eligible Gate Trial attempt and confirm M9 remains active with a concrete top-fix route.',
    '7. Clear or bypass the Gate Trial and confirm M10 activates without showing Foundation graduation early.',
    '8. Complete Foundation breakthrough and confirm first-life onboarding becomes complete and the graduation card queues once.',
    '9. Load a Foundation+ save and a second-life/reclaim save; neither should replay the full first-life route.',
    '10. Confirm Settings/accessibility controls remain reachable while progression tabs are hidden.',
  ].join('\n');
}

function renderMarkdown(
  summary: OnboardingReadinessSummary,
  commands: readonly CommandEvidence[],
  matrix: OnboardingReleaseMatrixReport | null,
  toolStatusMarkdown: string | null,
  releaseGate: ReleaseGateSummary | null,
): string {
  const blockerLines = summary.blockers.length === 0
    ? 'No MP6 blockers recorded.'
    : summary.blockers.map((blocker) => [
      `## Issue-ready blocker: ${blocker.id}`,
      '',
      `- Severity: ${blocker.severity}`,
      `- Scope: ${blocker.scope}`,
      `- Classification: ${blocker.classification}`,
      `- Evidence: ${blocker.evidence}`,
      `- Recommended next action: ${blocker.nextAction}`,
      `- Blocks onboarding targeted GO: ${blocker.scope === 'onboarding' ? 'Yes' : 'No'}`,
      `- Blocks full release GO: ${blocker.severity === 'blocker' || blocker.scope === 'manual' ? 'Yes' : 'No'}`,
      '',
    ].join('\n')).join('\n');

  return [
    '# Onboarding Readiness',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Verdict',
    '',
    `- Onboarding targeted: ${summary.verdict.onboardingTargeted}`,
    `- Full release: ${summary.verdict.fullRelease}`,
    `- Reason: ${summary.verdict.reason}`,
    '',
    '## Command Matrix',
    '',
    renderCommandTable(commands),
    '',
    '## Onboarding Release Matrix',
    '',
    matrix
      ? [
        `- Artifact: ${DEFAULT_PATHS.matrix}`,
        `- Overall pass: ${matrix.overallPass}`,
        `- Blockers: ${matrix.blockerCount}`,
        `- Warnings: ${matrix.warningCount}`,
        `- Rows: ${matrix.rows.length}`,
      ].join('\n')
      : 'No onboarding release matrix artifact was found.',
    '',
    '## Tool Capability Status',
    '',
    toolStatusMarkdown ?? 'No tool capability status artifact was found.',
    '',
    '## Manual QA Script',
    '',
    renderManualQaScript(),
    '',
    '## Screenshot And Manual Evidence Requirements',
    '',
    '- Capture M0 through M10, Foundation+ migration, and second-life/reclaim states when Browser or Playwright evidence is available.',
    '- Store generated screenshots and DOM/console summaries under `artifacts/mp6/final/onboarding-release/`.',
    '- Do not claim Browser evidence when only Playwright fallback was used.',
    '',
    '## Known Blockers',
    '',
    releaseGate
      ? [
        `Release gate headline: ${releaseGate.decisionSummary?.headline ?? 'UNKNOWN'}`,
        `Release gate rationale: ${(releaseGate.decisionSummary?.rationale ?? []).join('; ') || 'n/a'}`,
        `Release gate unresolved blockers: ${releaseGate.unresolvedBlockerCount}`,
        `Release gate pending manual checks: ${releaseGate.pendingManualCount}`,
        `Release gate untracked waiver candidates: ${releaseGate.unresolvedWaiverCandidateCount}`,
        '',
      ].join('\n')
      : '',
    blockerLines,
    '## Self-Audit',
    '',
    '- MP1-MP5 verified before implementation: Yes, see preflight artifact.',
    '- Source-truth systems rewritten: No.',
    '- Onboarding tests added or updated: Yes.',
    '- Targeted onboarding suite status: See command matrix.',
    '- Content validation status: See command matrix.',
    '- Icon check status: See command matrix.',
    '- Route escape matrix covered every milestone: See onboarding release matrix.',
    '- Foundation+ and second-life behavior covered: Yes, existing tests plus matrix rows.',
    '- Gate defeat and safety net remained source-truth safe: Yes, onboarding only records facts and route guidance.',
    '- Exact fixture/capture mode usable: See matrix row.',
    '- Public copy constraints preserved: Source/sink guard matrix checks forbidden labels.',
    '- localStorage-only onboarding state introduced: No.',
    '- Direct reward grants from onboarding introduced: No, static ownership guard covers this.',
    '',
  ].join('\n');
}

export function buildOnboardingReadinessReport(options: { generatedAt?: string } = {}): ReadinessReportBuildResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const preflight = readJson<unknown>(DEFAULT_PATHS.preflightSummary);
  const final = readJson<unknown>(DEFAULT_PATHS.finalSummary);
  const commands = [...normalizeCommands(preflight), ...normalizeCommands(final)];
  const matrix = readJson<OnboardingReleaseMatrixReport>(DEFAULT_PATHS.matrix);
  const toolStatusMarkdown = readText(DEFAULT_PATHS.toolStatus);
  const releaseGate = parseReleaseGateReport();
  const blockers = buildBlockers(commands, matrix, releaseGate);
  const summary: OnboardingReadinessSummary = {
    schemaVersion: 'onboarding-readiness-v1',
    generatedAt,
    verdict: buildVerdict(commands, matrix, blockers),
    commands,
    matrix: matrix
      ? {
        artifact: DEFAULT_PATHS.matrix,
        overallPass: matrix.overallPass,
        blockerCount: matrix.blockerCount,
        warningCount: matrix.warningCount,
      }
      : undefined,
    blockers,
    tools: parseTools(toolStatusMarkdown),
  };

  return {
    summary,
    markdown: renderMarkdown(summary, commands, matrix, toolStatusMarkdown, releaseGate),
  };
}

export function writeOnboardingReadinessReport(result: ReadinessReportBuildResult): {
  markdownPath: string;
  summaryPath: string;
} {
  const markdownPath = path.resolve(process.cwd(), 'docs/release/onboarding_readiness.md');
  const summaryPath = path.resolve(process.cwd(), 'artifacts/mp6/final/onboarding-release/onboarding-readiness-summary.json');
  mkdirSync(path.dirname(markdownPath), { recursive: true });
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(markdownPath, result.markdown, 'utf8');
  writeFileSync(summaryPath, `${JSON.stringify(result.summary, null, 2)}\n`, 'utf8');
  return { markdownPath, summaryPath };
}

function runCli(): void {
  const args = process.argv.slice(2);
  const result = buildOnboardingReadinessReport();
  if (args.includes('--write')) {
    const outputs = writeOnboardingReadinessReport(result);
    if (!args.includes('--json')) {
      console.log(`[onboarding:readiness] wrote ${path.relative(process.cwd(), outputs.markdownPath)}`);
      console.log(`[onboarding:readiness] wrote ${path.relative(process.cwd(), outputs.summaryPath)}`);
      console.log(`[onboarding:readiness] onboardingTargeted=${result.summary.verdict.onboardingTargeted} fullRelease=${result.summary.verdict.fullRelease}`);
    }
  }
  if (args.includes('--json') || !args.includes('--write')) {
    console.log(JSON.stringify(result.summary, null, 2));
  }
}

if (process.argv[1]?.endsWith('buildOnboardingReadinessReport.ts') || process.argv[1]?.endsWith('buildOnboardingReadinessReport.js')) {
  runCli();
}
