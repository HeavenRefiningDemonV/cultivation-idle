import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRuntimeSurfaceTruthEntries,
  auditSurfaceTruthEntries,
  type SurfaceTruthAuditEntry,
} from '../../../src/services/diagnostics/release/surfaceTruthAudit.js';
import { seedScenario } from '../../helpers/release/saveReloadHarness.js';

void test('surface truth audit passes across fresh, post-first-gate, prestige-ready, and cap-reached scenarios', async () => {
  const scenarios = [
    { id: 'fresh_life', seed: 'after_city_unlock' as const },
    { id: 'post_first_gate', seed: 'after_city_unlock' as const },
    { id: 'prestige_ready', seed: 'after_prestige_ready' as const },
    { id: 'cap_reached', seed: 'after_cap_acknowledged' as const },
  ];

  const entries: SurfaceTruthAuditEntry[] = [];
  for (const scenario of scenarios) {
    await seedScenario(scenario.seed);
    entries.push(...buildRuntimeSurfaceTruthEntries(scenario.id));
  }

  const report = auditSurfaceTruthEntries(entries);
  assert.equal(report.schemaVersion, '7.5b-surface-truth-audit');
  assert.equal(report.overallPass, true);
  assert.equal(report.findings.length, 0);
});
