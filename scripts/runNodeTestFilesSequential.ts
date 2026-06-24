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

// Opt-in: run every file and collect all failures instead of exiting on the first one. Default stays
// fail-fast (test:contracts relies on it). The full `npm run test` sweep uses this to report the whole
// failure set in a single pass.
const continueOnFailure = process.env.NODE_TEST_CONTINUE_ON_FAILURE === '1';

let passed = 0;
const failures: string[] = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--loader=./scripts/relativeJsLoader.mjs', '--import=./scripts/nodeTestDomShim.mjs', '--test', file], {
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
    const rel = path.relative(process.cwd(), file);
    console.error(`[runNodeTestFilesSequential] ${timedOut ? 'Timed out' : 'Failed'}: ${rel}`);
    failures.push(rel);
    if (!continueOnFailure) {
      console.error(`[runNodeTestFilesSequential] passed=${passed} total=${files.length}`);
      process.exit(timedOut ? 124 : result.status ?? 1);
    }
    continue;
  }
  passed += 1;
}

if (failures.length > 0) {
  console.error(`[runNodeTestFilesSequential] FAILED ${failures.length}/${files.length} file(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[runNodeTestFilesSequential] passed=${passed} total=${files.length}`);
