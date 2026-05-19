import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SECTION_C_EVIDENCE_TARGETS } from '../../src/dev/sectionCAudit/sectionCEvidenceManifest.js';
import { auditSectionCEvidence } from '../../scripts/release/validateSectionCEvidence.js';

function writeFile(filePath: string, contents: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

void test('section C evidence audit fails when required screenshot files are missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'section-c-evidence-missing-'));

  SECTION_C_EVIDENCE_TARGETS.forEach((target) => {
    const folder = path.join(root, target.evidenceFolder);
    fs.mkdirSync(folder, { recursive: true });
    const readme = [
      `# ${target.id}`,
      "",
      '- `03-truth-states.png` — **N/A**',
      '- `02-interaction.png` — **N/A**',
    ].join('\n');
    writeFile(path.join(folder, 'README.md'), readme);
  });

  const report = auditSectionCEvidence(root);
  assert.equal(report.overallPass, false);
  assert.equal(report.findings.some((finding) => finding.code === 'required_slot_missing'), true);
});

void test('section C evidence audit passes with complete fixture set and explicit N/A docs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'section-c-evidence-complete-'));

  SECTION_C_EVIDENCE_TARGETS.forEach((target) => {
    const folder = path.join(root, target.evidenceFolder);
    fs.mkdirSync(folder, { recursive: true });

    const readmeLines = [`# ${target.id}`];
    if (!target.interactionRequired) {
      readmeLines.push('- `02-interaction.png` — **N/A**');
    }
    if (!target.truthStatesRequired) {
      readmeLines.push('- `03-truth-states.png` — **N/A**');
    }
    writeFile(path.join(folder, 'README.md'), readmeLines.join('\n'));

    ['01-base.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'].forEach((name) => {
      writeFile(path.join(folder, name), 'png');
    });
    if (target.interactionRequired) {
      writeFile(path.join(folder, '02-interaction.png'), 'png');
    }
    if (target.truthStatesRequired) {
      writeFile(path.join(folder, '03-truth-states.png'), 'png');
    }
  });

  const report = auditSectionCEvidence(root);
  assert.equal(report.overallPass, true);
  assert.deepEqual(report.findings, []);
});
