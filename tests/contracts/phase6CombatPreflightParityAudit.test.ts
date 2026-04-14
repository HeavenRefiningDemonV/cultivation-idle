import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPhase6CombatPreflightReport } from '../../scripts/release/buildPhase6CombatPreflightReport.js';

void test('phase 6 combat preflight report reads world and panel copy sources for trio surfaces', () => {
  const report = buildPhase6CombatPreflightReport(process.cwd());
  assert.equal(report.visibleTruthSurfaceInventory.length, 3);

  const outskirts = report.parityTable.find((entry) => entry.surfaceId === 'outskirts');
  assert.ok(outskirts);
  assert.equal(outskirts?.worldRoleTag, 'Gold & Common Mats');
  assert.match(outskirts?.worldBestUsedWhen ?? '', /low-risk combat reps/);

  const ruins = report.parityTable.find((entry) => entry.surfaceId === 'ruins');
  assert.ok(ruins);
  assert.equal(ruins?.worldRoleTag, 'Targeted Mats');

  const gate = report.parityTable.find((entry) => entry.surfaceId === 'gate-trial');
  assert.ok(gate);
  assert.equal(gate?.parityStatus, 'drift');
  assert.match(gate?.panelRoleOrLead ?? '', /readiness/i);
});
