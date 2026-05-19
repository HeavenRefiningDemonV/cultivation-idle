import assert from 'node:assert/strict';
import test from 'node:test';
import { PHASE6_COMBAT_CAPTURE_SLOT_FILES } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';

void test('phase 6 combat evidence manifest keeps fixed slot set and route shape', () => {
  assert.deepEqual(PHASE6_COMBAT_CAPTURE_SLOT_FILES, [
    '01-base.png',
    '02-interaction.png',
    '03-truth-states.png',
    '04-high-fx.png',
    '05-low-fx.png',
    '06-reduced-motion.png',
  ]);

  PHASE6_COMBAT_EVIDENCE_TARGETS.forEach((target) => {
    (['high', 'low', 'reduced'] as const).forEach((fx) => {
      const route = target.captureRoutes[fx];
      assert.match(route, /\?uiAudit=phase-6-combat/);
      assert.match(route, new RegExp(`surface=${target.id}`));
      assert.match(route, new RegExp(`fx=${fx}`));
    });
  });
});
