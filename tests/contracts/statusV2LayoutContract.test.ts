import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const STRICT = process.env.STATUS_V3_STRICT === '1';

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readIfExists(relPath: string): string {
  const absPath = path.join(repoRoot, relPath);
  return existsSync(absPath) ? readFileSync(absPath, 'utf8') : '';
}

function statusSources(): string {
  return [
    readIfExists('src/components/screens/StatusScreen.tsx'),
    readIfExists('src/components/screens/StatusScreen.scss'),
    readIfExists('src/ui/status/ledger/StatusLedgerPage.tsx'),
    readIfExists('src/ui/status/ledger/StatusLedgerHero.tsx'),
    readIfExists('src/ui/status/ledger/StatusMetricStrip.tsx'),
    readIfExists('src/ui/status/ledger/StatusLedgerCard.tsx'),
    readIfExists('src/ui/status/ledger/StatusLedgerRows.tsx'),
    readIfExists('src/ui/status/ledger/StatusDetailsDrawer.tsx'),
    readIfExists('src/ui/status/ledger/StatusLedgerPage.scss'),
    readIfExists('src/systems/ui/status/statusRouteActions.ts'),
  ].join('\n');
}

test('Status V3 target is documented and stale Status V2 positive requirements are retired', () => {
  const agents = read('AGENTS.md');
  const packetRules = read('docs/codex-packet-rules.md');

  assert.match(agents, /Status V3|Cultivator Ledger|Status Ledger/i);
  assert.match(agents, /public Dao\/Omen|public Dao|Dao\/Omen\/Proof|decommission/i);
  assert.match(packetRules, /Status V3|Cultivator Ledger|Status Ledger/i);
  assert.match(packetRules, /Packet A[\s\S]*Packet B[\s\S]*Packet C[\s\S]*Packet D/i);

  assert.doesNotMatch(agents, /default player-facing UI must become sparse, omen\/proof\/reflection based/i);
  assert.doesNotMatch(agents, /Future public guidance should consume a sparse Omen Projection/i);
  assert.doesNotMatch(packetRules, /preserve sparse Omen|build sparse Omen|target.*sparse Omen/i);
});

test('Status Ledger future layout contract is explicit', () => {
  const docs = [
    read('AGENTS.md'),
    read('docs/codex-packet-rules.md'),
    readIfExists('docs/release/status_v3_dao_decommission_plan.md'),
  ].join('\n');

  for (const id of [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-ledger-grid',
    'status-ledger-mission-requirements',
    'status-ledger-cultivation-base',
    'status-ledger-current-work',
    'status-ledger-build-preparation',
  ]) {
    assert.match(docs, new RegExp(id), `Packet A docs should reserve future target id ${id}.`);
  }
});

test('Status Ledger strict render assertions activate after Packet C', (t) => {
  if (!STRICT) {
    t.skip('Strict Status Ledger render assertions activate in Packet C with STATUS_V3_STRICT=1.');
    return;
  }

  const src = statusSources();
  for (const id of [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-ledger-grid',
    'status-ledger-mission-requirements',
  ]) {
    assert.match(src, new RegExp(id), `Expected Packet C Status Ledger render id ${id}.`);
  }
});

test('Status strict public copy excludes old Dao/Omen labels after Packet C', (t) => {
  if (!STRICT) {
    t.skip('Strict public Status copy assertions activate after Packet C with STATUS_V3_STRICT=1.');
    return;
  }

  const src = statusSources();
  for (const term of ['Current Omen', 'Gate Proof', 'Recent Omens', 'Source Thread', 'Proof Detail', 'Preparation Health']) {
    assert.doesNotMatch(src, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Packet C must remove ${term}.`);
  }
});
