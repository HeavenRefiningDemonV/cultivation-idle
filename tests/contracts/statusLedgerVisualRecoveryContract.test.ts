import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const scss = read('src/ui/status/ledger/StatusLedgerPage.scss');
const rows = read('src/ui/status/ledger/StatusLedgerRows.tsx');

test('Status Ledger root does not paint a full beige screen wash', () => {
  assert.doesNotMatch(
    scss,
    /linear-gradient\(180deg,\s*#efe5d2\s+0%,\s*#e3d6bd\s+72%,\s*#d7c6a7\s+100%\)/i,
  );
  assert.match(
    scss,
    /\.statusLedgerRoot\s*\{[\s\S]*?background:\s*transparent;/,
    'Status Ledger root should let the app background art show through.',
  );
  assert.doesNotMatch(
    scss,
    /\.statusLedgerRoot::before\s*\{[\s\S]*?url\(/,
    'Status Ledger root should not own an extra fixed background art layer by default.',
  );
});

test('Status Ledger uses pearly row and chip display grammar', () => {
  assert.match(scss, /--status-paper-pearl/);
  assert.match(scss, /--status-paper-slip/);
  assert.match(scss, /--status-ledger-pearl-edge/);
  assert.match(scss, /statusLedgerChip/);
  assert.match(scss, /statusLedgerRowSeal/);
  assert.match(scss, /statusLedgerRich--cultivation/);
  assert.match(rows, /StatusRowSeal|statusLedgerRowSeal/);
  assert.match(rows, /StatusLedgerRichText/);
  assert.match(rows, /statusLedgerChip/);
});

test('Status Ledger prevents screenshot regressions for element identity and cramped rows', () => {
  assert.match(scss, /\.statusSpiritRootBadge\[data-element="fire"\]/);
  assert.match(scss, /\.statusSpiritRootBadge\[data-element="water"\]/);
  assert.match(scss, /\.statusDoctrineTileGrid/);
  assert.match(scss, /\.statusBuildPrepPanel/);
  assert.match(scss, /\.statusBuildPrepPanel__warning/);
  assert.match(scss, /grid-template-areas:[\s\S]*"buildprep buildprep buildprep"/);
  assert.doesNotMatch(
    scss,
    /\.statusLedgerRow__label,\s*[\s\S]*?\.statusLedgerRequirement__label,\s*[\s\S]*?\.statusLedgerActionRow__label\s*\{[\s\S]*?overflow-wrap:\s*anywhere/,
    'Primary Status row labels must not use arbitrary one-letter wrapping.',
  );
  assert.match(scss, /overflow-wrap:\s*normal/);
  assert.match(scss, /word-break:\s*normal/);
});

test('Status Ledger supports restrained VFX and reduced motion', () => {
  assert.match(scss, /@keyframes\s+statusLedgerPearlGlint/);
  assert.match(scss, /statusLedgerActionButton--primary::after/);
  assert.match(scss, /prefers-reduced-motion:\s*reduce/);
  assert.match(scss, /transition-duration:\s*0\.001ms !important/);
});
