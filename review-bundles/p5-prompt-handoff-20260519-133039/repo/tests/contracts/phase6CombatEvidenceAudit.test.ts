import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';
import { auditPhase6CombatEvidence } from '../../scripts/release/validatePhase6CombatEvidence.js';

function writeFile(filePath: string, contents: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

void test('phase 6 combat evidence audit fails when required screenshot files are missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'phase6-combat-evidence-missing-'));

  PHASE6_COMBAT_EVIDENCE_TARGETS.forEach((target) => {
    const folder = path.join(root, target.evidenceFolder);
    fs.mkdirSync(folder, { recursive: true });
    writeFile(path.join(folder, 'README.md'), `# ${target.id}`);
  });

  const report = auditPhase6CombatEvidence(root);
  assert.equal(report.overallPass, false);
  assert.equal(report.findings.some((finding) => finding.code === 'required_slot_missing'), true);
});
