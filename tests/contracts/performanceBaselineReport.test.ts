import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const runPerformanceReport = (root: string, args: string[] = ['--json']) => spawnSync(
  process.execPath,
  [
    '--loader=./scripts/relativeJsLoader.mjs',
    '--experimental-strip-types',
    'scripts/release/buildPerformanceBaselineReport.ts',
    `--root=${root}`,
    ...args,
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  },
);

const writeFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'ci-perf-baseline-'));
  mkdirSync(path.join(root, 'src', 'components'), { recursive: true });
  mkdirSync(path.join(root, 'src', 'features', 'world', 'demoExact'), { recursive: true });
  mkdirSync(path.join(root, 'src', 'systems'), { recursive: true });
  mkdirSync(path.join(root, 'docs', 'release'), { recursive: true });
  mkdirSync(path.join(root, 'public', 'cultivation_idle_content_bible_v1_config'), { recursive: true });
  mkdirSync(path.join(root, 'dist', 'assets'), { recursive: true });

  writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-game',
    version: '0.0.1',
    dependencies: {
      react: '19.0.0',
      zustand: '5.0.0',
      vite: '7.0.0',
    },
    devDependencies: {
      typescript: '5.9.0',
    },
  }), 'utf8');
  writeFileSync(path.join(root, 'vite.config.ts'), 'export default { plugins: [] };\n', 'utf8');
  writeFileSync(path.join(root, 'docs', 'release', 'current_implementation_baseline.md'), '# Baseline\n', 'utf8');
  writeFileSync(path.join(root, 'docs', 'release', 'performance_smoke_checklist.md'), '# Smoke\n', 'utf8');
  writeFileSync(path.join(root, 'public', 'cultivation_idle_content_bible_v1_config', 'pavilion_records.json'), '{"records":[]}\n', 'utf8');
  writeFileSync(path.join(root, 'dist', 'assets', 'app.js'), 'x'.repeat(310 * 1024), 'utf8');
  writeFileSync(path.join(root, 'dist', 'assets', 'chunk.css'), 'x'.repeat(12 * 1024), 'utf8');
  writeFileSync(path.join(root, 'src', 'systems', 'gameLoop.ts'), 'requestAnimationFrame(() => tick());\n', 'utf8');
  writeFileSync(path.join(root, 'src', 'components', 'Sidebar.tsx'), 'const store = useGameStore();\n', 'utf8');
  writeFileSync(path.join(root, 'src', 'features', 'world', 'demoExact', 'DemoOwner.tsx'), 'const key = JSON.stringify(props);\n', 'utf8');
  writeFileSync(path.join(root, 'src', 'components', 'LazyThing.tsx'), 'const LazyThing = React.lazy(() => import("./Thing"));\n', 'utf8');
  return root;
};

test('performance baseline JSON inventories source, content, chunks, and static smells', () => {
  const root = writeFixture();
  const run = runPerformanceReport(root);
  assert.equal(run.status, 0, run.stderr);

  const report = JSON.parse(run.stdout);
  assert.equal(report.package.name, 'fixture-game');
  assert.equal(report.previousPacketVerification.inspectedFiles.includes('docs/release/current_implementation_baseline.md'), true);
  assert.equal(report.staticAudit.contentFiles.length, 1);
  assert.equal(report.staticAudit.requestAnimationFrameUsages.length, 1);
  assert.equal(report.staticAudit.bareStoreSubscriptions.length, 1);
  assert.equal(report.staticAudit.jsonStringifyInReactOwners.length, 1);
  assert.equal(report.staticAudit.lazyImportInventory.length, 1);
  assert.equal(report.buildInventory.distExists, true);
  assert.equal(report.buildInventory.chunks.some((chunk: { over300kb: boolean }) => chunk.over300kb), true);
  assert.equal(report.budgets.some((budget: { id: string }) => budget.id === 'idle-react-commits'), true);
});

test('performance baseline human report includes budgets and previous packet verification', () => {
  const root = writeFixture();
  const run = runPerformanceReport(root, []);
  assert.equal(run.status, 0, run.stderr);

  assert.equal(run.stdout.includes('## Previous Packet Verification'), true);
  assert.equal(run.stdout.includes('## Budget Status'), true);
  assert.equal(run.stdout.includes('Mega Prompt 2'), true);
});
