import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

type BaselineCheck = {
  id: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  summary: string;
  evidence?: string[];
};

type BaselineReport = {
  checks: BaselineCheck[];
  blockers: BaselineCheck[];
};

const runBaseline = (root: string): BaselineReport => {
  const output = execFileSync(
    process.execPath,
    [
      '--loader=./scripts/relativeJsLoader.mjs',
      '--experimental-strip-types',
      'scripts/release/buildImplementationBaselineReport.ts',
      `--root=${root}`,
      '--json',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    },
  );
  return JSON.parse(output) as BaselineReport;
};

const writeMinimalBaselineRoot = async (withEntry: boolean): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cultivation-baseline-entry-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'public', 'cultivation_idle_content_bible_v1_config'), { recursive: true });
  mkdirSync(path.join(root, 'scripts', 'release'), { recursive: true });
  mkdirSync(path.join(root, 'docs', 'release'), { recursive: true });
  mkdirSync(path.join(root, 'tests'), { recursive: true });
  mkdirSync(path.join(root, 'vendor'), { recursive: true });

  writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'baseline-fixture',
    version: '0.0.0',
    scripts: {
      typecheck: 'tsc --noEmit',
      'check:icons': 'node scripts/checkNoEmojiIcons.ts',
      test: 'node --test',
      'test:contracts': 'node --test tests/contracts/**/*.js',
      'validate:content': 'node scripts/validateContent.ts',
      'progression:report': 'node tmp-tests/scripts/progressionContractReport.js',
      'release:gate': 'node scripts/release/runReleaseGate.ts',
      'release:runtime-content-manifest': 'node scripts/release/validateRuntimeContentManifest.ts',
      'release:implementation-baseline': 'node scripts/release/buildImplementationBaselineReport.ts',
      'release:gate-trial-exact-p0:capture': 'node scripts/release/runGateTrialExactP0Capture.ts',
      'release:gate-trial-exact-p0:audit': 'node scripts/release/validatePhase6CombatEvidence.ts',
      'release:outskirts-exact-p0:capture': 'node scripts/release/runOutskirtsExactP0Capture.ts',
      'release:ruins-exact-p0:capture': 'node scripts/release/runRuinsExactP0Capture.ts',
      'release:apothecary-exact-p0:capture': 'node scripts/release/runApothecaryExactP0Capture.ts',
      'release:runtime-diagnostics': 'node scripts/release/runRuntimeDiagnostics.ts',
      'release:migration-matrix': 'node scripts/release/runMigrationMatrix.ts',
      'release:offline-route-report': 'node scripts/release/offlineRouteReport.ts',
      'release:reclaim-route-report': 'node scripts/release/reclaimRouteReport.ts',
    },
  }), 'utf8');
  writeFileSync(path.join(root, 'package-lock.json'), '{}\n', 'utf8');
  writeFileSync(path.join(root, 'vite.config.ts'), 'export default {};\n', 'utf8');
  writeFileSync(path.join(root, 'playwright.config.ts'), 'export default {};\n', 'utf8');
  writeFileSync(path.join(root, 'tsconfig.tests.json'), '{}\n', 'utf8');
  writeFileSync(path.join(root, 'tsconfig.progression-fixtures.json'), '{}\n', 'utf8');
  writeFileSync(path.join(root, 'scripts', 'relativeJsLoader.mjs'), 'export {};\n', 'utf8');
  writeFileSync(path.join(root, 'scripts', 'checkNoEmojiIcons.ts'), 'export {};\n', 'utf8');
  if (withEntry) {
    writeFileSync(path.join(root, 'index.html'), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n', 'utf8');
    writeFileSync(path.join(root, 'src', 'main.tsx'), 'export {};\n', 'utf8');
  }
  return root;
};

test('implementation baseline reports root index.html and Vite entry readiness', async () => {
  const root = await writeMinimalBaselineRoot(true);
  const report = runBaseline(root);
  const check = report.checks.find((entry) => entry.id === 'vite_entry');

  assert.equal(check?.status, 'pass');
  assert.equal(check?.evidence?.some((entry) => entry.includes('index.html: present')), true);
  assert.equal(check?.evidence?.some((entry) => entry.includes('src/main.tsx: present')), true);
});

test('implementation baseline blocks review bundles missing root index.html', async () => {
  const root = await writeMinimalBaselineRoot(false);
  const report = runBaseline(root);
  const check = report.checks.find((entry) => entry.id === 'vite_entry');

  assert.equal(check?.status, 'fail');
  assert.equal(report.blockers.some((entry) => entry.id === 'vite_entry'), true);
});
