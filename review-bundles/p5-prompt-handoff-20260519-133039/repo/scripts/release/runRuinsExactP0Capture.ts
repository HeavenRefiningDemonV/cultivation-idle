import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const OUT_PATH = 'docs/release/qa/ui-cutover/ruins-exact/p0-freeze/ruinsExactP0CaptureAttempt.json';

interface CaptureAttemptRecord {
  schemaVersion: 'ruins-exact-p0-capture-attempt.v1';
  generatedAt: string;
  command: string;
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function runCapture(rootDir: string): CaptureAttemptRecord {
  const command = 'npm run release:phase6-combat-capture -- --surface=ruins --json --ruins-exact-mode=fixture';
  const result = spawnSync(process.execPath, [
    '--loader=./scripts/relativeJsLoader.mjs',
    '--experimental-strip-types',
    'scripts/release/capturePhase6CombatEvidence.ts',
    '--surface=ruins',
    '--json',
    '--ruins-exact-mode=fixture',
  ], {
    cwd: rootDir,
    encoding: 'utf-8',
    env: { ...process.env },
  });

  return {
    schemaVersion: 'ruins-exact-p0-capture-attempt.v1',
    generatedAt: new Date().toISOString(),
    command,
    ok: result.status === 0,
    exitCode: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? '',
  };
}

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

if (isMainModule()) {
  const attempt = runCapture(process.cwd());
  const outPath = path.resolve(process.cwd(), OUT_PATH);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(attempt, null, 2)}\n`);
  process.stdout.write(attempt.stdout);
  if (attempt.stderr) process.stderr.write(attempt.stderr);
  if (!attempt.ok) {
    process.stderr.write(`[ruins-exact-p0-capture] capture failed. Recorded attempt details in ${OUT_PATH}.\n`);
    process.exitCode = attempt.exitCode ?? 1;
  }
}
