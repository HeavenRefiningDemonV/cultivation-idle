import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const scriptPath = path.resolve(process.cwd(), 'tmp-tests', 'scripts', 'saveMigrationDryRun.js');
const passthrough = (save: Record<string, unknown>) => save;

test('dry-run report groups active vs planned vs report-only sections', async () => {
  const fixture = await loadMigrationFixture('legacy-gate-item-ids');
  const report = runSaveMigrations(fixture, { mode: 'dry-run', normalizeToCurrent: passthrough }).report;

  assert.ok(report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_gate_item_alias_migration'));
  assert.ok(report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_trial_resolution_normalization'));
  assert.ok(report.grouped.plannedTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_semester_slice_clamp'));
  assert.ok(report.grouped.reportOnly.some((entry) => entry.stepId === 'm0_report_source_version'));
  assert.ok(report.touchedFieldPaths.length > 0);
});

test('human dry-run CLI output prints grouped sections and owner packets', () => {
  const proc = spawnSync(process.execPath, [scriptPath, '--fixture=legacy-hidden-prestige'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(proc.status, 0, proc.stderr);
  assert.match(proc.stdout, /A\) Active transforms applied now/);
  assert.match(proc.stdout, /B\) Planned transforms for later packets/);
  assert.match(proc.stdout, /owner packet: 1.6/);
});
