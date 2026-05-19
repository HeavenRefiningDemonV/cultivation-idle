import assert from 'node:assert/strict';
import test from 'node:test';
import { SECTION_C_SURFACE_IDS } from '../../src/dev/sectionCAudit/sectionCSurfaceIds.js';
import { SECTION_C_EVIDENCE_TARGETS } from '../../src/dev/sectionCAudit/sectionCEvidenceManifest.js';

void test('section C harness surfaces and evidence manifest ids remain aligned', () => {
  const harnessIds = [...SECTION_C_SURFACE_IDS].sort();
  const manifestIds = SECTION_C_EVIDENCE_TARGETS.map((entry) => entry.id).sort();
  assert.deepEqual(manifestIds, harnessIds);
});
