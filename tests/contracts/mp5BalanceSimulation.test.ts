import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMp5BalanceSimulationReport } from '../../src/systems/balance/mp5BalanceSimulation.js';

test('MP5 balance simulation covers route matrix and named exploit cases', () => {
  const report = buildMp5BalanceSimulationReport({ generatedAt: 123 });

  assert.equal(report.schemaVersion, 'mp5-balance-simulation-v1');
  assert.equal(report.generatedAt, 123);
  assert.equal(report.routeScenarioCount, 36);
  assert.equal(report.exploitCaseCount, 10);
  assert.equal(report.overallPass, true);
  assert.equal(report.scenarios.every((scenario) => scenario.passed), true);

  const exploitIds = new Set(report.exploitCases.map((entry) => entry.id));
  [
    'train_cap_only',
    'heart_law_overlevel',
    'high_fatigue_offline',
    'mismatch_builds',
    'repeated_prestige_floor',
    'breakthrough_failure',
    'no_training',
    'no_dao_heart',
    'second_life_sweep',
    'reset_while_active',
  ].forEach((id) => assert.equal(exploitIds.has(id), true, id));
  assert.equal(report.exploitCases.every((entry) => entry.prevented), true);
});
