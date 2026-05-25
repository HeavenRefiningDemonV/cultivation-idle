import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('AGENTS declares Status Ledger and public Dao/Omen decommission doctrine', () => {
  const agents = read('AGENTS.md');

  assert.match(agents, /Status V3|Cultivator Ledger|Status Ledger/i);
  assert.match(agents, /old-look|old Status page family/i);
  assert.match(agents, /public Dao\/Omen|Dao\/Omen\/Proof|public Dao/i);
  assert.match(agents, /Cultivation Base|Mission Requirements|Gate Readiness|Current Bottleneck|Best Improvements|Build & Preparation/i);

  assert.doesNotMatch(agents, /default player-facing UI must become sparse, omen\/proof\/reflection based/i);
  assert.doesNotMatch(agents, /Future public guidance should consume a sparse Omen Projection/i);
});

test('packet rules encode the A through D decommission sequence and stale-test policy', () => {
  const rules = read('docs/codex-packet-rules.md');

  assert.match(rules, /Status V3 \/ Dao decommission packet sequence|Status V3.*decommission/i);
  assert.match(rules, /Packet A[\s\S]*guardrails[\s\S]*stale-test[\s\S]*audit/i);
  assert.match(rules, /Packet B[\s\S]*StatusLedgerSurfaceV1|Status Ledger data/i);
  assert.match(rules, /Packet C[\s\S]*Status UI|Status Ledger UI/i);
  assert.match(rules, /Packet D[\s\S]*non-Status|public Dao/i);
  assert.match(rules, /verify previous packet|previous-packet/i);
  assert.match(rules, /stale tests must be rewritten|old architecture tests must be rewritten/i);
});
