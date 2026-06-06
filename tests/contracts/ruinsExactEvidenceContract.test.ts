import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

void test('ruins evidence manifest and readme target exact surface', () => {
  const manifest = readFileSync('src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.ts', 'utf8');
  const readme = readFileSync('docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/README.md', 'utf8');
  assert.equal(manifest.includes("id: 'ruins'"), true);
  assert.equal(manifest.includes('Hollow Log Den active mockup values'), true);
  for (const token of ['Ruins Exact', 'Continue Exploration', 'Exploration Summary', 'Guaranteed Anchor', 'Rare Pity 1 / 6', 'Auto-Repeat Off']) {
    assert.equal(readme.includes(token), true);
  }
});

void test('phase6 capture/validate include ruins exact route + dom audit guards', () => {
  const capture = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');
  const validate = readFileSync('scripts/release/validatePhase6CombatEvidence.ts', 'utf8');
  assert.equal(capture.includes('target.captureRoutes[fx]'), true);
  assert.equal(capture.includes('controls'), true);
  assert.equal(capture.includes('.dom.json'), true);
  assert.equal(validate.includes('ruins_old_shell_marker'), true);
  for (const token of ['combatPathModule', 'ruinsPanel', 'RuinsSummaryCard', 'RuinsProgress', 'RuinsCtaZone']) {
    assert.equal(capture.includes(token), true);
  }
});
