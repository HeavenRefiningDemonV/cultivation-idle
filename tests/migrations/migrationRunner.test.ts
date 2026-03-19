import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CURRENT_SAVE_VERSION,
  migrateIncomingSaveForHydration,
  runSaveMigrations,
} from '../../src/save/migrations/index.js';

const baseLegacy = {
  timestamp: 100,
  gameState: { lifePath: 'heaven' },
  unknownTopLevel: { keep: true },
  nested: { keepNested: { flag: true } },
};

const passthroughNormalizer = (save: Record<string, unknown>) => ({
  ...save,
  normalizedFlag: true,
  nested: {
    ...(save.nested as Record<string, unknown> | undefined),
    normalizedNested: true,
  },
});

test('runner dry-run never mutates input and apply mutates only through transform steps', () => {
  const input = structuredClone(baseLegacy);
  const dry = runSaveMigrations(input, { mode: 'dry-run', normalizeToCurrent: passthroughNormalizer });
  assert.equal((input as Record<string, unknown>).version, undefined);
  assert.equal((dry.migrated as Record<string, unknown>).version, undefined);
  assert.equal(dry.report.finalVersion, CURRENT_SAVE_VERSION);

  const apply = runSaveMigrations(input, { mode: 'apply', normalizeToCurrent: passthroughNormalizer });
  assert.equal((apply.migrated as Record<string, unknown>).version, CURRENT_SAVE_VERSION);
  assert.equal((apply.migrated as Record<string, unknown>).version, CURRENT_SAVE_VERSION);
  assert.equal(((apply.migrated.gameState as Record<string, unknown>) ?? {}).selectedPath, 'heaven');
  assert.equal('lifePath' in ((apply.migrated.gameState as Record<string, unknown>) ?? {}), false);
});

test('reportOnly and plannedTransform steps never mutate; ordering and idempotence stay stable', () => {
  const applyOnce = runSaveMigrations(structuredClone(baseLegacy), {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });

  assert.deepEqual(applyOnce.report.appliedTransformSteps, [
    'v2_0_0_seed_version_and_meta',
    'v2_0_0_normalize_path_truth',
    'v2_0_0_plan_trial_resolution_normalization',
    'v2_0_0_normalize_city_progression_state',
    'v2_0_0_plan_partial_reset_residue_cleanup',
    'v2_0_0_plan_offline_unification',
  ]);
  assert.deepEqual(applyOnce.report.reportOnlySteps, ['m0_report_source_version']);
  assert.deepEqual(applyOnce.report.plannedTransformSteps, ['v2_0_0_plan_semester_slice_clamp']);
  assert.ok(applyOnce.report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_trial_resolution_normalization'));
  assert.ok(applyOnce.report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_normalize_city_progression_state'));
  assert.ok(applyOnce.report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_partial_reset_residue_cleanup'));
  assert.ok(applyOnce.report.grouped.activeTransforms.some((entry) => entry.stepId === 'v2_0_0_plan_offline_unification'));

  const applyTwice = runSaveMigrations(applyOnce.migrated, {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });

  assert.deepEqual(applyTwice.report.appliedTransformSteps, [
    'v2_0_0_plan_gate_item_alias_migration',
    'v2_0_0_plan_trial_resolution_normalization',
    'v2_0_0_normalize_city_progression_state',
    'v2_0_0_plan_partial_reset_residue_cleanup',
    'v2_0_0_plan_offline_unification',
  ]);
  assert.deepEqual(applyTwice.report.plannedTransformSteps, ['v2_0_0_plan_semester_slice_clamp']);
  assert.deepEqual(applyTwice.migrated, applyOnce.migrated);
  assert.equal((applyTwice.migrated as Record<string, unknown>).version, CURRENT_SAVE_VERSION);
});

test('unknown top-level and nested fields are preserved', () => {
  const result = migrateIncomingSaveForHydration(structuredClone(baseLegacy), passthroughNormalizer);
  assert.equal(((result.migrated.unknownTopLevel as Record<string, unknown>) ?? {}).keep, true);
  assert.equal(((((result.migrated.nested as Record<string, unknown>) ?? {}).keepNested as Record<string, unknown>) ?? {}).flag, true);
});

test('report contains applied, report-only, planned sections and warnings when appropriate', () => {
  const malformed = { version: 'not.semver', timestamp: 1, gameState: { lifePath: 'earth' } };
  const result = runSaveMigrations(malformed, {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });

  assert.ok(result.report.grouped.reportOnly.length > 0);
  assert.ok(result.report.grouped.activeTransforms.length > 0);
  assert.ok(result.report.grouped.plannedTransforms.length > 0);
  assert.ok(result.report.touchedFieldPaths.length > 0);
  assert.ok(result.report.warnings.length > 0);
});

test('load-path integration wrapper migrates legacy save and no-ops current save', () => {
  const legacy = migrateIncomingSaveForHydration(structuredClone(baseLegacy), passthroughNormalizer);
  assert.equal((legacy.migrated as Record<string, unknown>).version, CURRENT_SAVE_VERSION);
  assert.equal(((legacy.migrated.gameState as Record<string, unknown>) ?? {}).selectedPath, 'heaven');
  assert.equal('lifePath' in ((legacy.migrated.gameState as Record<string, unknown>) ?? {}), false);

  const current = runSaveMigrations({ version: CURRENT_SAVE_VERSION, marker: true }, {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });
  assert.equal(current.report.appliedTransformSteps.length, 0);
  assert.equal((current.migrated as Record<string, unknown>).marker, true);
});
