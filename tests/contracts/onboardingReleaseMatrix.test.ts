import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOnboardingReleaseMatrixReport } from '../../scripts/onboarding/buildOnboardingReleaseMatrix.js';

const REQUIRED_ROWS = [
  'M0_life_start',
  'M1_cultivation_only',
  'M2_status_unlock',
  'M3_world_outskirts',
  'M4_pavilion_satchel',
  'M5_techniques_loadout',
  'M6_apothecary_expedition',
  'M7_forge',
  'M8_ruins_bounties',
  'M9_gate_trial',
  'M10_foundation_graduation',
  'complete_first_life',
  'foundation_plus_existing_save',
  'second_life_reclaim',
  'dev_override_unlock_all',
  'exact_fixture_capture_mode',
] as const;

test('onboarding release matrix exposes all release-review states', () => {
  const report = buildOnboardingReleaseMatrixReport({ generatedAt: 'test-clock' });

  assert.equal(report.schemaVersion, 'onboarding-release-matrix-v1');
  assert.equal(report.generatedAt, 'test-clock');
  assert.deepEqual(report.rows.map((row) => row.id), [...REQUIRED_ROWS]);
  assert.equal(report.overallPass, true);

  for (const row of report.rows) {
    assert.equal(typeof row.pass, 'boolean', `${row.id} pass missing`);
    assert.equal(Array.isArray(row.visibleTabs), true, `${row.id} visibleTabs missing`);
    assert.equal(Array.isArray(row.availableWorldModules), true, `${row.id} availableWorldModules missing`);
    assert.equal(Array.isArray(row.teaserWorldModules), true, `${row.id} teaserWorldModules missing`);
    assert.equal(Array.isArray(row.tabEscapeChecks), true, `${row.id} tabEscapeChecks missing`);
    assert.equal(Array.isArray(row.worldModuleEscapeChecks), true, `${row.id} worldModuleEscapeChecks missing`);
    assert.equal(Array.isArray(row.sourceSinkGuardChecks), true, `${row.id} sourceSinkGuardChecks missing`);
  }
});

test('normal onboarding matrix blocks locked tab and world-module escape routes', () => {
  const report = buildOnboardingReleaseMatrixReport({ generatedAt: 'test-clock' });
  const normalRows = report.rows.filter(
    (row) => row.id !== 'dev_override_unlock_all' && row.id !== 'exact_fixture_capture_mode',
  );

  for (const row of normalRows) {
    for (const check of [...row.tabEscapeChecks, ...row.worldModuleEscapeChecks]) {
      assert.equal(check.pass, true, `${row.id} ${check.kind} ${check.key}: ${check.reason ?? 'route guard drift'}`);
    }
  }

  const m3 = report.rows.find((row) => row.id === 'M3_world_outskirts');
  assert.ok(m3, 'M3 row missing');
  assert.equal(m3.worldModuleEscapeChecks.find((check) => check.key === 'manualPavilion')?.actualAllowed, false);
  assert.equal(m3.worldModuleEscapeChecks.find((check) => check.key === 'outskirts')?.actualAllowed, true);
});

test('onboarding source and sink matrix routes guarded dead ends to concrete unlocked surfaces', () => {
  const report = buildOnboardingReleaseMatrixReport({ generatedAt: 'test-clock' });

  assert.equal(report.sourceSinkRouteViolations.length, 0);

  const guardedRows = report.rows.filter((row) => row.sourceSinkGuardChecks.length > 0);
  assert.equal(guardedRows.some((row) => row.id === 'M9_gate_trial'), true);
  for (const row of guardedRows) {
    for (const check of row.sourceSinkGuardChecks) {
      assert.equal(check.pass, true, `${row.id} guard ${check.guardId}: ${check.reason ?? 'invalid route'}`);
    }
  }
});

