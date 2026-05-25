import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

const STATUS_LEDGER_FILES = [
  'src/components/screens/StatusScreen.tsx',
  'src/components/screens/StatusScreen.scss',
  'src/ui/status/ledger/StatusLedgerPage.tsx',
  'src/ui/status/ledger/StatusLedgerHero.tsx',
  'src/ui/status/ledger/StatusMetricStrip.tsx',
  'src/ui/status/ledger/StatusLedgerCard.tsx',
  'src/ui/status/ledger/StatusLedgerRows.tsx',
  'src/ui/status/ledger/StatusDetailsDrawer.tsx',
  'src/ui/status/ledger/StatusLedgerPage.scss',
  'src/ui/status/ledger/index.ts',
  'src/systems/ui/status/statusRouteActions.ts',
] as const;

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function readIfExists(relPath: string): string {
  return existsSync(absPath(relPath)) ? read(relPath) : '';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Packet C Status Ledger render files exist', () => {
  for (const file of STATUS_LEDGER_FILES) {
    assert.equal(existsSync(absPath(file)), true, `${file} should exist.`);
  }
});

test('StatusScreen renders the Status Ledger surface without old Dao public components', () => {
  const src = read('src/components/screens/StatusScreen.tsx');

  assert.match(src, /StatusLedgerPage/, 'StatusScreen should render the Status Ledger page.');
  assert.match(src, /surface\.statusLedger/, 'StatusScreen should pass surface.statusLedger to the renderer.');
  assert.match(src, /performStatusLedgerAction/, 'StatusScreen should use the Status-specific route adapter.');
  assert.doesNotMatch(src, /statusV2/, 'StatusScreen must not render the transitional Status V2 surface.');
  assert.doesNotMatch(
    src,
    /OmenSeal|ProofSealRow|PressureBadgeRow|ReflectionPlaque|SourceThreadDrawer|performDaoMandateRouteAction|DaoMandateRoute/,
    'StatusScreen must not import/render old public Dao components or route actions.',
  );
});

test('Status Ledger exposes required public test ids', () => {
  const src = STATUS_LEDGER_FILES.map((file) => readIfExists(file)).join('\n');

  for (const id of [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-ledger-grid',
    'status-ledger-card-milestone',
    'status-ledger-card-cultivation-base',
    'status-ledger-card-mission-requirements',
    'status-ledger-card-best-improvements',
    'status-ledger-card-safety-net',
    'status-ledger-card-identity-doctrine',
    'status-ledger-card-current-work',
    'status-ledger-card-build-preparation',
    'status-ledger-details',
    'status-ledger-recent-changes',
  ]) {
    assert.match(src, new RegExp(escapeRegex(id)), `${id} should be present in Packet C render files.`);
  }
});

test('Status Ledger SCSS owns V3 structure, parchment layout, and reduced motion', () => {
  const screenScss = read('src/components/screens/StatusScreen.scss');
  const ledgerScss = readIfExists('src/ui/status/ledger/StatusLedgerPage.scss');
  const scss = `${screenScss}\n${ledgerScss}`;

  for (const selector of [
    '.statusLedgerRoot',
    '.statusLedgerHero',
    '.statusLedgerMetrics',
    '.statusLedgerGrid',
    '.statusLedgerCard',
    '.statusLedgerDetails',
  ]) {
    assert.match(scss, new RegExp(escapeRegex(selector)), `${selector} should be styled.`);
  }

  assert.match(scss, /prefers-reduced-motion:\s*reduce/, 'Status Ledger styles should honor reduced motion.');
  assert.doesNotMatch(scss, /DaoMandateTokens|statusV2|--dao-/, 'Status V3 public styles should not depend on V2 Dao tokens.');
});

