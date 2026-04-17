import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const OUT_PATH = 'docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/outskirtsExactP0CaptureAttempt.json';

interface CaptureAttemptRecord {
  schemaVersion: 'outskirts-exact-p0-capture-attempt.v1';
  generatedAt: string;
  command: string;
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function runCapture(rootDir: string): CaptureAttemptRecord {
  const command = 'npm run release:phase6-combat-capture -- --surface=outskirts --json';
  const result = spawnSync('npm', ['run', 'release:phase6-combat-capture', '--', '--surface=outskirts', '--json'], {
    cwd: rootDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      NODE_OPTIONS: '--loader=./scripts/relativeJsLoader.mjs',
    },
  });

  return {
    schemaVersion: 'outskirts-exact-p0-capture-attempt.v1',
    generatedAt: new Date().toISOString(),
    command,
    ok: result.status === 0,
    exitCode: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const attempt = runCapture(rootDir);
  const outPath = path.resolve(rootDir, OUT_PATH);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(attempt, null, 2)}\n`);

  process.stdout.write(attempt.stdout);
  if (attempt.stderr.length > 0) {
    process.stderr.write(attempt.stderr);
  }

  if (!attempt.ok) {
    process.stderr.write(`[outskirts-exact-p0-capture] capture failed. Recorded attempt details in ${OUT_PATH}.\n`);
    process.exitCode = attempt.exitCode ?? 1;
  }
}
