import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildProgressionContract, adaptProgressionAuthoredContent, type RawProgressionContentLike } from '../../../systems/progression/contract/index.js';
import { collectProgressionDiagnostics } from '../../../systems/progression/diagnostics/index.js';
import { SEMESTER_SLICE_CONTRACT } from '../../../systems/progression/contract/semesterSlice.js';
import { RUNTIME_CONTENT_FILE_BY_KEY } from '../../../content/runtimeContentManifest.js';
import { buildRuntimeContentManifestReport } from './runtimeContentManifestReport.js';
import type { ReleaseGateCheckId, ReleaseGateCheckResult, ReleaseGateFinding, ReleaseGateFindingSeverity } from './releaseGateTypes.js';

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  durationMs?: number;
};

export type ReleaseGateAdapterContext = {
  runCommand?: (command: string, args: string[]) => CommandResult;
};

const resolveCommand = (command: string, args: string[]): { executable: string; executableArgs: string[] } => {
  if (command !== 'npm') {
    return { executable: command, executableArgs: args };
  }

  if (process.platform === 'win32') {
    const npmExecPath = process.env.npm_execpath;
    const bundledNpmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    const npmCliPath = npmExecPath && existsSync(npmExecPath) ? npmExecPath : bundledNpmCli;
    if (existsSync(npmCliPath)) {
      return {
        executable: process.env.npm_node_execpath ?? process.execPath,
        executableArgs: [npmCliPath, ...args],
      };
    }
  }

  return {
    executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    executableArgs: args,
  };
};

const killProcessTree = (pid: number | undefined): void => {
  if (!pid || process.platform !== 'win32') {
    return;
  }

  spawnSync('taskkill', ['/pid', String(pid), '/t', '/f'], {
    encoding: 'utf8',
    stdio: 'ignore',
  });
};

const psQuote = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const windowsArgument = (value: string): string => `"${value.replace(/"/g, '\\"')}"`;

const runWindowsCommandWithTimeout = (executable: string, executableArgs: string[], timeoutMs: number): CommandResult => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-gate-command-'));
  const stdoutPath = path.join(tempDir, 'stdout.log');
  const stderrPath = path.join(tempDir, 'stderr.log');
  const startedAt = Date.now();

  const psScript = [
    '$ErrorActionPreference = "Continue"',
    `$stdoutPath = ${psQuote(stdoutPath)}`,
    `$stderrPath = ${psQuote(stderrPath)}`,
    '$psi = New-Object System.Diagnostics.ProcessStartInfo',
    `$psi.FileName = ${psQuote(executable)}`,
    `$psi.Arguments = ${psQuote(executableArgs.map(windowsArgument).join(' '))}`,
    `$psi.WorkingDirectory = ${psQuote(process.cwd())}`,
    '$psi.UseShellExecute = $false',
    '$psi.RedirectStandardOutput = $true',
    '$psi.RedirectStandardError = $true',
    '$psi.CreateNoWindow = $true',
    '$process = New-Object System.Diagnostics.Process',
    '$process.StartInfo = $psi',
    '[void]$process.Start()',
    '$stdoutTask = $process.StandardOutput.ReadToEndAsync()',
    '$stderrTask = $process.StandardError.ReadToEndAsync()',
    `$completed = $process.WaitForExit(${timeoutMs})`,
    'if (-not $completed) {',
    '  & taskkill.exe /PID $process.Id /T /F *> $null',
    '  [void]$process.WaitForExit(5000)',
    '  [System.IO.File]::WriteAllText($stdoutPath, $stdoutTask.Result)',
    '  [System.IO.File]::WriteAllText($stderrPath, $stderrTask.Result)',
    '  exit 124',
    '}',
    '[void]$stdoutTask.Wait(5000)',
    '[void]$stderrTask.Wait(5000)',
    '[System.IO.File]::WriteAllText($stdoutPath, $stdoutTask.Result)',
    '[System.IO.File]::WriteAllText($stderrPath, $stderrTask.Result)',
    'exit $process.ExitCode',
  ].join('; ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
    timeout: timeoutMs + 30_000,
    killSignal: 'SIGTERM',
  });

  const durationMs = Date.now() - startedAt;
  const wrapperTimedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT';
  const timedOut = wrapperTimedOut || result.status === 124;

  try {
    return {
      exitCode: timedOut ? 124 : result.status ?? 1,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: timedOut
        ? `${readFileSync(stderrPath, 'utf8')}\nCommand timed out after ${timeoutMs}ms.`.trim()
        : readFileSync(stderrPath, 'utf8'),
      timedOut,
      durationMs,
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

const defaultRunner = (command: string, args: string[]): CommandResult => {
  const { executable, executableArgs } = resolveCommand(command, args);
  const timeoutMs = Number(process.env.RELEASE_GATE_COMMAND_TIMEOUT_MS ?? 180_000);
  if (process.platform === 'win32') {
    return runWindowsCommandWithTimeout(executable, executableArgs, timeoutMs);
  }

  const startedAt = Date.now();
  const result = spawnSync(executable, executableArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
    timeout: timeoutMs,
    killSignal: 'SIGTERM',
  });
  const durationMs = Date.now() - startedAt;
  const timedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT';
  if (timedOut) {
    killProcessTree((result as { pid?: number }).pid);
  }
  return {
    exitCode: timedOut ? 124 : result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: timedOut
      ? `${result.stderr ?? ''}\nCommand timed out after ${timeoutMs}ms.`.trim()
      : result.stderr ?? '',
    timedOut,
    durationMs,
  };
};

const slug = (value: string) => String(value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);

const makeFinding = (checkId: ReleaseGateCheckId, title: string, message: string, severity: ReleaseGateFindingSeverity, sourceKind: ReleaseGateFinding['sourceKind'], waivable: boolean, evidenceRef?: string): ReleaseGateFinding => ({
  findingId: `${checkId}_${slug(title)}_${slug(message).slice(0, 20)}`,
  checkId,
  title,
  message,
  severity,
  waivable,
  sourceKind,
  evidenceRef,
});

const parseJsonFromStdout = <T>(stdout: string): T => {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    throw new Error('No stdout payload to parse as JSON.');
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Some npm commands prepend banner/warning lines before emitting JSON.
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');

    const objectSpanValid = firstBrace !== -1 && lastBrace > firstBrace;
    const arraySpanValid = firstBracket !== -1 && lastBracket > firstBracket;
    const useObjectSpan = objectSpanValid && (!arraySpanValid || firstBrace < firstBracket);

    if (!useObjectSpan && !arraySpanValid) {
      throw new Error('Unable to find a JSON object or array in stdout payload.');
    }

    const candidate = useObjectSpan
      ? trimmed.slice(firstBrace, lastBrace + 1)
      : trimmed.slice(firstBracket, lastBracket + 1);

    return JSON.parse(candidate) as T;
  }
};

function commandCheckBase(checkId: ReleaseGateCheckId, command: string, commandResult: CommandResult): Pick<ReleaseGateCheckResult, 'commandOrBuilder' | 'evidence' | 'commandEvidence'> {
  return {
    commandOrBuilder: command,
    evidence: [command],
    commandEvidence: {
      command,
      exitCode: commandResult.exitCode,
      stdoutPreview: commandResult.stdout.slice(0, 2400),
      stderrPreview: commandResult.stderr.slice(0, 2400),
      timedOut: commandResult.timedOut,
      durationMs: commandResult.durationMs,
    },
  };
}

const runtimePaths = [
  'src/stores/gameStore.ts',
  'src/stores/prestigeStore.ts',
  'src/systems/offline.ts',
  'src/services/time/OfflineCatchup.ts',
  'src/systems/loot.ts',
  'src/constants/itemsDatabase.ts',
];

function loadProgressionRawContent(): RawProgressionContentLike {
  const base = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
  const read = (name: string) => JSON.parse(readFileSync(path.join(base, name), 'utf8'));
  return Object.fromEntries(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(([key, fileName]) => [key, read(fileName)]),
  ) as unknown as RawProgressionContentLike;
}

export async function runReleaseGateAdapter(checkId: ReleaseGateCheckId, context: ReleaseGateAdapterContext = {}): Promise<Omit<ReleaseGateCheckResult, 'checkId' | 'elapsedMs'>> {
  const runCommand = context.runCommand ?? defaultRunner;

  if (checkId === 'runtime_content_manifest') {
    const report = buildRuntimeContentManifestReport({ root: process.cwd() });
    const findings: ReleaseGateFinding[] = [
      ...report.blockers.map((message) => makeFinding(checkId, 'runtime_content_manifest_blocker', message, 'blocker', 'builder', false, 'npm run release:runtime-content-manifest:json')),
      ...report.warnings.map((message) => makeFinding(checkId, 'runtime_content_manifest_warning', message, 'waiver_candidate', 'builder', true, 'npm run release:runtime-content-manifest:json')),
    ];
    const blockerCount = findings.filter((entry) => entry.severity === 'blocker').length;
    const warningCount = findings.filter((entry) => entry.severity === 'waiver_candidate').length;
    return {
      status: blockerCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
      summary: blockerCount > 0
        ? `Runtime content manifest failed with ${blockerCount} blocker(s).`
        : warningCount > 0
          ? `Runtime content manifest passed with ${warningCount} warning(s).`
          : 'Runtime content manifest passed.',
      blockerCount,
      warningCount,
      pendingManualCount: 0,
      findings,
      commandOrBuilder: 'buildRuntimeContentManifestReport',
      evidence: ['public/cultivation_idle_content_bible_v1_config', 'docs/release/runtime_content_manifest.md'],
      rawPayload: report,
    };
  }

  if (checkId === 'content_validation') {
    const command = 'npm run validate:content';
    const result = runCommand('npm', ['run', 'validate:content']);
    const findings: ReleaseGateFinding[] = [];
    if (result.exitCode !== 0) {
      findings.push(makeFinding(checkId, 'content_validation_failed', 'validate:content returned non-zero exit code.', 'blocker', 'command', false, command));
    }
    return {
      status: findings.length > 0 ? 'fail' : 'pass',
      summary: findings.length > 0 ? 'Content validation failed.' : 'Content validation passed.',
      blockerCount: findings.length,
      warningCount: 0,
      pendingManualCount: 0,
      findings,
      ...commandCheckBase(checkId, command, result),
      rawPayload: undefined,
    };
  }

  if (checkId === 'progression_contract') {
    const raw = loadProgressionRawContent();
    const authored = adaptProgressionAuthoredContent(raw);
    const contract = buildProgressionContract(authored);
    const runtimeFileTextByPath: Record<string, string> = Object.fromEntries(
      runtimePaths.map((runtimePath) => [runtimePath, readFileSync(path.resolve(process.cwd(), runtimePath), 'utf8')]),
    );
    const diagnostics = collectProgressionDiagnostics(contract, {
      authoredContent: {
        economyRealms: authored.economy.majorRealms.map((x: { id: string }) => x.id),
        cities: authored.cities,
        trials: authored.trials.map((trial: { id: string; gateItemId: string; eligibilityRule?: unknown; gatesToMajorRealm?: string }) => ({
          id: trial.id,
          gateItemId: trial.gateItemId,
          fromMajorRealm: trial.eligibilityRule && typeof trial.eligibilityRule === 'object'
            ? (trial.eligibilityRule as { fromMajorRealm?: string }).fromMajorRealm
            : undefined,
          toMajorRealm: trial.gatesToMajorRealm,
        })),
        items: authored.items.items.map((x: { id: string }) => x.id),
      },
      runtimeFileTextByPath,
    });
    const findings = diagnostics.map((issue: { category: string; summary: string; severity: string; id: string }) =>
      makeFinding(
        checkId,
        issue.category,
        issue.summary,
        issue.severity === 'error' ? 'blocker' : issue.severity === 'warning' ? 'waiver_candidate' : 'info',
        'builder',
        issue.severity !== 'error',
        issue.id,
      ),
    );
    const blockerCount = findings.filter((entry) => entry.severity === 'blocker').length;
    const warningCount = findings.filter((entry) => entry.severity === 'waiver_candidate').length;
    return {
      status: blockerCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
      summary: `Progression diagnostics: ${blockerCount} blockers, ${warningCount} warnings.`,
      blockerCount,
      warningCount,
      pendingManualCount: 0,
      findings,
      commandOrBuilder: 'buildProgressionContract + collectProgressionDiagnostics',
      evidence: ['src/systems/progression/contract', 'src/systems/progression/diagnostics'],
      rawPayload: { diagnosticsCount: diagnostics.length },
    };
  }

  const commandById: Record<Exclude<ReleaseGateCheckId, 'runtime_content_manifest' | 'content_validation' | 'progression_contract'>, { command: string; args: string[]; json: boolean }> = {
    build_audit: { command: 'npm', args: ['run', 'release:build-audit:json'], json: true },
    fresh_run_acceptance: { command: 'npm', args: ['run', 'release:fresh-run-report:json'], json: true },
    migration_matrix: { command: 'npm', args: ['run', 'release:migration-matrix:json'], json: true },
    balance_regression: { command: 'npm', args: ['run', 'balance:report:json'], json: true },
    route_comparison: { command: 'npm', args: ['run', 'release:route-report:json'], json: true },
    runtime_diagnostics: { command: 'npm', args: ['run', 'release:runtime-diagnostics:json'], json: true },
    mp5_reset_memory: { command: 'npm', args: ['run', 'test:mp5'], json: false },
    mp5_offline_trust: { command: 'npm', args: ['run', 'test:mp5'], json: false },
    mp5_telemetry_schema: { command: 'npm', args: ['run', 'validate:balance-telemetry'], json: false },
    mp5_balance_simulations: { command: 'npm', args: ['run', 'release:mp5-balance-simulations:json'], json: true },
    mp5_prestige_runtime_audit: { command: 'npm', args: ['run', 'release:prestige-runtime-audit:json'], json: true },
    vocabulary_audit: { command: 'npm', args: ['run', 'release:vocab-audit:json'], json: true },
    full_test_suite: { command: 'npm', args: ['run', 'test'], json: false },
  };

  const commandDef = commandById[checkId as keyof typeof commandById];
  const commandLabel = `${commandDef.command} ${commandDef.args.join(' ')}`;
  const commandResult = runCommand(commandDef.command, commandDef.args);
  const findings: ReleaseGateFinding[] = [];

  let rawPayload: unknown = undefined;
  if (commandDef.json && commandResult.exitCode === 0) {
    rawPayload = parseJsonFromStdout<unknown>(commandResult.stdout);
  }

  if (checkId === 'full_test_suite') {
    if (commandResult.timedOut) {
      findings.push(makeFinding(checkId, 'test_suite_timeout', `npm run test timed out after ${commandResult.durationMs ?? 'unknown'}ms.`, 'blocker', 'command', false, commandLabel));
      return {
        status: 'fail',
        summary: 'Full test suite timed out.',
        blockerCount: findings.length,
        warningCount: 0,
        pendingManualCount: 0,
        findings,
        ...commandCheckBase(checkId, commandLabel, commandResult),
        rawPayload,
      };
    }
    if (commandResult.exitCode !== 0) {
      findings.push(makeFinding(checkId, 'test_suite_failed', 'npm run test failed.', 'blocker', 'command', false, commandLabel));
    }
    return {
      status: findings.length > 0 ? 'fail' : 'pass',
      summary: findings.length > 0 ? 'Full test suite failed.' : 'Full test suite passed.',
      blockerCount: findings.length,
      warningCount: 0,
      pendingManualCount: 0,
      findings,
      ...commandCheckBase(checkId, commandLabel, commandResult),
      rawPayload,
    };
  }

  if (commandResult.exitCode !== 0) {
    findings.push(makeFinding(checkId, `${checkId}_command_failed`, `${checkId} command returned non-zero exit code.`, 'blocker', 'command', false, commandLabel));
    return {
      status: 'fail',
      summary: `${checkId} failed.`,
      blockerCount: 1,
      warningCount: 0,
      pendingManualCount: 0,
      findings,
      ...commandCheckBase(checkId, commandLabel, commandResult),
      rawPayload,
    };
  }

  if (checkId === 'build_audit' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { blockerCount?: number; warningCount?: number; entries?: Array<{ id: string; summary: string; disposition: string }> };
    (payload.entries ?? []).forEach((entry) => {
      if (entry.disposition === 'fix_now') {
        findings.push(makeFinding(checkId, entry.id, entry.summary, 'blocker', 'builder', false, commandLabel));
      } else if (payload.warningCount && payload.warningCount > 0) {
        findings.push(makeFinding(checkId, entry.id, entry.summary, 'waiver_candidate', 'builder', true, commandLabel));
      }
    });
  }

  if (checkId === 'fresh_run_acceptance' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { automatedPass?: boolean; manualCoverageComplete?: boolean; blockers?: Array<{ summary: string }>; warnings?: Array<{ summary: string }> };
    if (!payload.automatedPass) {
      findings.push(makeFinding(checkId, 'fresh_run_automated_fail', 'Automated fresh-run acceptance failed.', 'blocker', 'builder', false, commandLabel));
    }
    if (!payload.manualCoverageComplete) {
      findings.push(makeFinding(checkId, 'fresh_run_manual_pending', 'Required manual fresh-run coverage is incomplete.', 'blocker', 'builder', false, commandLabel));
    }
    (payload.warnings ?? []).forEach((warning, index) => findings.push(makeFinding(checkId, `fresh_run_warning_${index + 1}`, warning.summary, 'waiver_candidate', 'builder', true, commandLabel)));
  }

  if (checkId === 'migration_matrix' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { primaryRiskPass?: boolean; overallPass?: boolean; failedFixtureIds?: string[] };
    if (!payload.primaryRiskPass || !payload.overallPass) {
      findings.push(makeFinding(checkId, 'migration_matrix_failed', `Migration matrix failed: ${(payload.failedFixtureIds ?? []).join(', ') || 'see report'}.`, 'blocker', 'builder', false, commandLabel));
    }
  }

  if (checkId === 'balance_regression' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { overallPass?: boolean; hardFailureCount?: number; warningCount?: number };
    if (!payload.overallPass || (payload.hardFailureCount ?? 0) > 0) {
      findings.push(makeFinding(checkId, 'balance_regression_failed', 'Balance regression report contains hard failures.', 'blocker', 'builder', false, commandLabel));
    } else if ((payload.warningCount ?? 0) > 0) {
      findings.push(makeFinding(checkId, 'balance_regression_warning', 'Balance regression report has non-blocking warnings.', 'waiver_candidate', 'builder', true, commandLabel));
    }
  }

  if (checkId === 'route_comparison' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { overallPass?: boolean; finalTruthSummary?: Record<string, boolean>; warnings?: Array<string | { summary?: string }> };
    const failedTruth = Object.entries(payload.finalTruthSummary ?? {}).filter(([, value]) => value === false);
    if (!payload.overallPass || failedTruth.length > 0) {
      findings.push(makeFinding(checkId, 'route_comparison_failed', `Route comparison failed truth keys: ${failedTruth.map(([key]) => key).join(', ') || 'unknown'}.`, 'blocker', 'builder', false, commandLabel));
    }
    (payload.warnings ?? []).forEach((warning, index) => {
      const message = typeof warning === 'string' ? warning : warning.summary ?? 'Route comparison report emitted an unspecified warning.';
      findings.push(makeFinding(checkId, `route_warning_${index + 1}`, message, 'waiver_candidate', 'builder', true, commandLabel));
    });
  }

  if (checkId === 'runtime_diagnostics' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as {
      scenarios?: Record<string, {
        errorCount?: number;
        warningCount?: number;
        scenarioStatus?: 'PASS' | 'EXPECTED_NEGATIVE_PASS' | 'BLOCKER';
        releaseGateBlocking?: boolean;
        summary?: string;
      }>;
    };
    const entries = Object.entries(payload.scenarios ?? {});
    const hasClassifiedScenarios = entries.some(([, row]) => typeof row.scenarioStatus === 'string');
    if (hasClassifiedScenarios) {
      const blocking = entries.filter(([, row]) => row.scenarioStatus === 'BLOCKER' || row.releaseGateBlocking === true);
      const warningCount = entries
        .filter(([, row]) => row.scenarioStatus !== 'EXPECTED_NEGATIVE_PASS')
        .reduce((sum, [, row]) => sum + (row.warningCount ?? 0), 0);
      if (blocking.length > 0) {
        findings.push(makeFinding(
          checkId,
          'runtime_diagnostics_blocking_scenarios',
          `Runtime diagnostics blocking scenarios: ${blocking.map(([name]) => name).join(', ')}.`,
          'blocker',
          'builder',
          false,
          commandLabel,
        ));
      } else if (warningCount > 0) {
        findings.push(makeFinding(checkId, 'runtime_diagnostics_warnings', `Runtime diagnostics reported ${warningCount} warning-level findings in non-negative scenarios.`, 'waiver_candidate', 'builder', true, commandLabel));
      }
    } else {
      const scenarios = entries.map(([, row]) => row);
      const errorCount = scenarios.reduce((sum, row) => sum + (row.errorCount ?? 0), 0);
      const warningCount = scenarios.reduce((sum, row) => sum + (row.warningCount ?? 0), 0);
      if (errorCount > 0) {
        findings.push(makeFinding(checkId, 'runtime_diagnostics_errors', `Runtime diagnostics reported ${errorCount} error-level findings.`, 'blocker', 'builder', false, commandLabel));
      } else if (warningCount > 0) {
        findings.push(makeFinding(checkId, 'runtime_diagnostics_warnings', `Runtime diagnostics reported ${warningCount} warning-level findings.`, 'waiver_candidate', 'builder', true, commandLabel));
      }
    }
  }

  if (checkId === 'mp5_balance_simulations' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { overallPass?: boolean; routeScenarioCount?: number; exploitCaseCount?: number; exploitCases?: Array<{ id: string; prevented: boolean }> };
    const failedExploitIds = (payload.exploitCases ?? []).filter((entry) => !entry.prevented).map((entry) => entry.id);
    if (!payload.overallPass || payload.routeScenarioCount !== 36 || payload.exploitCaseCount !== 10 || failedExploitIds.length > 0) {
      findings.push(makeFinding(
        checkId,
        'mp5_balance_simulations_failed',
        `MP5 balance simulations failed or lost coverage: routes=${payload.routeScenarioCount ?? 'unknown'} exploits=${payload.exploitCaseCount ?? 'unknown'} failedExploits=${failedExploitIds.join(',') || 'none'}.`,
        'blocker',
        'builder',
        false,
        commandLabel,
      ));
    }
  }

  if (checkId === 'mp5_prestige_runtime_audit' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as {
      blockers?: string[];
      unknownBlockedCount?: number;
      rows?: Array<{ upgradeId: string; status: string; runtimeConsumers?: string[] }>;
    };
    const blockers = payload.blockers ?? [];
    const requiredLive = ['form_memory', 'scripture_echo', 'root_clarity', 'calm_first_breath', 'old_sparring_shadows'];
    const missingLive = requiredLive.filter((id) => {
      const row = payload.rows?.find((entry) => entry.upgradeId === id);
      return row?.status !== 'visible_live' || (row.runtimeConsumers?.length ?? 0) === 0;
    });
    const doctrineArchive = payload.rows?.find((entry) => entry.upgradeId === 'doctrine_archive');
    if (blockers.length > 0 || (payload.unknownBlockedCount ?? 0) > 0 || missingLive.length > 0 || doctrineArchive?.status !== 'hidden_unsupported') {
      findings.push(makeFinding(
        checkId,
        'mp5_prestige_runtime_audit_failed',
        `MP5 prestige runtime audit failed: blockers=${blockers.length} unknown=${payload.unknownBlockedCount ?? 0} missingLive=${missingLive.join(',') || 'none'} doctrine=${doctrineArchive?.status ?? 'missing'}.`,
        'blocker',
        'builder',
        false,
        commandLabel,
      ));
    }
  }

  if (checkId === 'vocabulary_audit' && rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as { overallPass?: boolean; staleFindings?: unknown[]; placeholderFindings?: unknown[] };
    const staleCount = payload.staleFindings?.length ?? 0;
    const placeholderCount = payload.placeholderFindings?.length ?? 0;
    if (!payload.overallPass || staleCount > 0 || placeholderCount > 0) {
      findings.push(makeFinding(checkId, 'vocabulary_audit_failed', `Vocabulary audit has stale=${staleCount} placeholder=${placeholderCount}.`, 'blocker', 'builder', false, commandLabel));
    }
  }

  const blockerCount = findings.filter((entry: ReleaseGateFinding) => entry.severity === 'blocker').length;
  const warningCount = findings.filter((entry: ReleaseGateFinding) => entry.severity === 'waiver_candidate').length;
  const pendingManualCount = checkId === 'fresh_run_acceptance' && rawPayload && typeof rawPayload === 'object' && (rawPayload as { manualCoverageComplete?: boolean }).manualCoverageComplete === false ? 1 : 0;
  return {
    status: pendingManualCount > 0 ? 'pending_manual' : blockerCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
    summary: pendingManualCount > 0 ? `${checkId} is pending manual coverage.` : blockerCount > 0 ? `${checkId} failed with blocker findings.` : warningCount > 0 ? `${checkId} completed with warnings.` : `${checkId} passed.`,
    blockerCount,
    warningCount,
    pendingManualCount,
    findings,
    ...commandCheckBase(checkId, commandLabel, commandResult),
    rawPayload,
  };
}

export function buildSliceSummary() {
  return {
    contentCapRealmId: SEMESTER_SLICE_CONTRACT.contentCapRealm,
    liveCityIds: [...SEMESTER_SLICE_CONTRACT.liveCityIds],
    liveCityCount: SEMESTER_SLICE_CONTRACT.liveCityIds.length,
    fakeCitySixDetected: SEMESTER_SLICE_CONTRACT.liveCityIds.some((cityId: string) => cityId.includes('city_6')),
    deferredSystems: [],
  };
}
