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
  assert.equal((input as any).version, undefined);
  assert.equal((dry.migrated as any).version, undefined);
  assert.equal(dry.report.finalVersion, CURRENT_SAVE_VERSION);

  const apply = runSaveMigrations(input, { mode: 'apply', normalizeToCurrent: passthroughNormalizer });
  assert.equal((apply.migrated as any).version, CURRENT_SAVE_VERSION);
  assert.equal((apply.migrated as any).version, CURRENT_SAVE_VERSION);
  assert.equal((apply.migrated.gameState as any).selectedPath, 'heaven');
  assert.equal('lifePath' in ((apply.migrated.gameState as any) ?? {}), false);
});

test('reportOnly and plannedTransform steps never mutate; ordering and idempotence stay stable', () => {
  const applyOnce = runSaveMigrations(structuredClone(baseLegacy), {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });

  assert.deepEqual(applyOnce.report.appliedTransformSteps, [
    'v2_0_0_seed_version_and_meta',
    'v2_0_0_normalize_path_truth',
  ]);
  assert.deepEqual(applyOnce.report.reportOnlySteps, ['m0_report_source_version', 'v2_0_0_plan_offline_unification']);
  assert.ok(applyOnce.report.plannedTransformSteps.length > 0);

  const applyTwice = runSaveMigrations(applyOnce.migrated, {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });

  assert.deepEqual(applyTwice.report.appliedTransformSteps, []);
  assert.equal((applyTwice.migrated as any).version, CURRENT_SAVE_VERSION);
});

test('unknown top-level and nested fields are preserved', () => {
  const result = migrateIncomingSaveForHydration(structuredClone(baseLegacy), passthroughNormalizer);
  assert.equal((result.migrated as any).unknownTopLevel.keep, true);
  assert.equal((result.migrated as any).nested.keepNested.flag, true);
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
  assert.equal((legacy.migrated as any).version, CURRENT_SAVE_VERSION);
  assert.equal((legacy.migrated.gameState as any).selectedPath, 'heaven');
  assert.equal('lifePath' in ((legacy.migrated.gameState as any) ?? {}), false);

  const current = runSaveMigrations({ version: CURRENT_SAVE_VERSION, marker: true }, {
    mode: 'apply',
    normalizeToCurrent: passthroughNormalizer,
  });
  assert.equal(current.report.appliedTransformSteps.length, 0);
  assert.equal((current.migrated as any).marker, true);
});
