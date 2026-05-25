import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('status fx scene keeps atmosphere-only DOM contract with explicit budget gating', () => {
  const source = read('src/ui/fx/scenes/StatusFxScene.tsx');
  assert.match(source, /statusFxScene__halo/);
  assert.match(source, /statusFxScene__ring/);
  assert.match(source, /statusFxScene__mist/);
  assert.match(source, /statusFxScene__glint/);
  assert.match(source, /data-glints=/);
  assert.match(source, /data-mists=/);
  assert.match(source, /data-resonance=/);
  assert.match(source, /data-urgency=/);
  assert.doesNotMatch(source, /Biggest Shortfall|Readiness|Best Next Action|Safety Net/);
});

test('Status Ledger owns reduced motion after Packet C visual cutover', () => {
  const screenStyles = read('src/components/screens/StatusScreen.scss');
  const ledgerStyles = read('src/ui/status/ledger/StatusLedgerPage.scss');

  assert.doesNotMatch(screenStyles, /statusFxScene/);
  assert.match(ledgerStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(ledgerStyles, /\.statusLedgerRoot \*,\n\s+\.statusLedgerRoot \*::before,\n\s+\.statusLedgerRoot \*::after/);
  assert.match(ledgerStyles, /animation-duration: 0\.001ms !important/);
  assert.match(ledgerStyles, /transition-duration: 0\.001ms !important/);
});
