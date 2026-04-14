import assert from 'node:assert/strict';
import test from 'node:test';
import { PHASE6_COMBAT_SURFACE_IDS } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';

void test('phase 6 combat harness surfaces and evidence manifest ids remain aligned', () => {
  const harnessIds = [...PHASE6_COMBAT_SURFACE_IDS].sort();
  const manifestIds = PHASE6_COMBAT_EVIDENCE_TARGETS.map((entry) => entry.id).sort();
  assert.deepEqual(manifestIds, harnessIds);
});
