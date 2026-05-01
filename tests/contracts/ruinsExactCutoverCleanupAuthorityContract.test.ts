import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

const APPROVAL_PATH = 'docs/release/qa/ui-cutover/ruins-exact/cutover/ruinsExactCleanupApproval.json';

test('ruins exact cleanup authority artifact is explicit and coherent', () => {
  assert.equal(existsSync(APPROVAL_PATH), true);
  const approval = JSON.parse(readFileSync(APPROVAL_PATH, 'utf8')) as {
    status: 'BLOCKED' | 'APPROVED_FOR_EXACT_CLEANUP'; blockers: string[]; requiredEvidence: string[];
  };

  assert.ok(['BLOCKED', 'APPROVED_FOR_EXACT_CLEANUP'].includes(approval.status));

  const preflightReadme = readFileSync('docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/README.md', 'utf8');
  const panel = readFileSync('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const reportScript = readFileSync('scripts/release/buildPhase6CombatPreflightReport.ts', 'utf8');

  if (approval.status === 'APPROVED_FOR_EXACT_CLEANUP') {
    for (const evidencePath of approval.requiredEvidence) assert.equal(existsSync(evidencePath), true);
    assert.match(preflightReadme, /APPROVED_FOR_EXACT_CLEANUP/);
    assert.match(panel, /RuinsScreenOwner/);
    for (const legacy of [/RuinsSummaryCard/, /RuinsProgress/, /RuinsCtaZone/]) assert.doesNotMatch(panel, legacy);
    assert.doesNotMatch(reportScript, /RuinsSummaryCard \+ RuinsProgress split owner/);
  } else {
    assert.equal(approval.blockers.length > 0, true);
    assert.match(preflightReadme, /Status:\s*\*\*BLOCKED\*\*/);
  }
});
