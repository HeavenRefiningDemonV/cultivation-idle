import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { PHASE6_COMBAT_CAPTURE_SLOT_FILES } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';

void test('outskirts P0 docs wrapper files exist and point to canonical phase-6 evidence root', async () => {
  const docs = [
    'docs/release/qa/ui-cutover/outskirts-exact/README.md',
    'docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/README.md',
    'docs/release/qa/ui-cutover/outskirts-exact/capture-instructions.md',
    'docs/release/qa/ui-cutover/outskirts-exact/mockup-binding.md',
    'docs/release/qa/ui-cutover/outskirts-exact/current-owner-inventory.md',
    'docs/release/qa/ui-cutover/outskirts-exact/visible-regressions.md',
  ];

  for (const docPath of docs) {
    const source = await fs.readFile(docPath, 'utf8');
    assert.match(source, /outskirts/i);
  }

  const captureDoc = await fs.readFile('docs/release/qa/ui-cutover/outskirts-exact/capture-instructions.md', 'utf8');
  assert.match(captureDoc, /phase-6-combat-preflight\/01-outskirts/);
  assert.match(captureDoc, /surface=outskirts&slot=<slot>&fx=<mode>&controls=0/);
});

void test('outskirts P0 slot contract remains six canonical files with explicit semantic notes', async () => {
  assert.deepEqual(PHASE6_COMBAT_CAPTURE_SLOT_FILES, [
    '01-base.png',
    '02-interaction.png',
    '03-truth-states.png',
    '04-high-fx.png',
    '05-low-fx.png',
    '06-reduced-motion.png',
  ]);

  const outskirtsTarget = PHASE6_COMBAT_EVIDENCE_TARGETS.find((entry) => entry.id === 'outskirts');
  assert.ok(outskirtsTarget);
  assert.match(outskirtsTarget?.slotNotes['01-base.png'] ?? '', /idle/i);
  assert.match(outskirtsTarget?.slotNotes['02-interaction.png'] ?? '', /HP bars/i);
  assert.match(outskirtsTarget?.slotNotes['03-truth-states.png'] ?? '', /RunCompass/i);
});

void test('outskirts P0 wrappers are wired in package scripts', async () => {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const scripts = pkg.scripts ?? {};
  assert.match(scripts['release:outskirts-exact-p0:capture'] ?? '', /runOutskirtsExactP0Capture/);
  assert.match(scripts['release:outskirts-exact-p0:audit'] ?? '', /release:phase6-combat-evidence-audit/);
  assert.match(scripts['release:outskirts-exact-p0:report'] ?? '', /buildOutskirtsExactP0Baseline/);
});
