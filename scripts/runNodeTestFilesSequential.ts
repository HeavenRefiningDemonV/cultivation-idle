import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function collectJsFiles(inputPath: string): string[] {
  const resolved = path.resolve(process.cwd(), inputPath);
  if (!existsSync(resolved)) return [];
  const stat = statSync(resolved);
  if (stat.isFile()) return resolved.endsWith('.js') ? [resolved] : [];
  return readdirSync(resolved)
    .flatMap((entry) => collectJsFiles(path.join(resolved, entry)))
    .filter((entry) => entry.endsWith('.js'));
}

const targets = process.argv.slice(2);
const files = targets.flatMap(collectJsFiles).sort((a, b) => a.localeCompare(b));
const timeoutMs = Number(process.env.NODE_TEST_FILE_TIMEOUT_MS ?? 120_000);

if (files.length === 0) {
  console.error('[runNodeTestFilesSequential] No JS test files found.');
  process.exit(1);
}

let passed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--loader=./scripts/relativeJsLoader.mjs', '--test', file], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    timeout: timeoutMs,
    maxBuffer: 50 * 1024 * 1024,
  });
  const timedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT';
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (timedOut || result.status !== 0) {
    console.error(`[runNodeTestFilesSequential] ${timedOut ? 'Timed out' : 'Failed'}: ${path.relative(process.cwd(), file)}`);
    console.error(`[runNodeTestFilesSequential] passed=${passed} total=${files.length}`);
    process.exit(timedOut ? 124 : result.status ?? 1);
  }
  passed += 1;
}

console.log(`[runNodeTestFilesSequential] passed=${passed} total=${files.length}`);
