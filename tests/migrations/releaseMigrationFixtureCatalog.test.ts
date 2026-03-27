import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RELEASE_MIGRATION_FIXTURE_CATALOG,
  RELEASE_MIGRATION_REQUIRED_RISK_CLASSES,
} from '../../src/save/migrations/releaseMigrationFixtureCatalog.js';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

test('release migration catalog covers every required risk class and has stable fixture ids', () => {
  const ids = RELEASE_MIGRATION_FIXTURE_CATALOG.map((entry) => entry.fixtureId);

  [
    'legacy-path-only',
    'legacy-path-conflict',
    'legacy-gate-item-ids',
    'legacy-future-slice',
    'legacy-hidden-prestige',
    'legacy-hidden-unsupported-prestige',
    'legacy-trial-mismatch',
    'legacy-city-current-invalid',
    'legacy-partial-reset-residue',
    'legacy-hidden-craft-outputs',
    'legacy-offline-split',
    'legacy-unversioned-save',
    'current-save',
  ].forEach((fixtureId) => {
    assert.equal(ids.includes(fixtureId), true, `${fixtureId} should remain in release migration catalog`);
  });

  RELEASE_MIGRATION_REQUIRED_RISK_CLASSES.forEach((riskClassId) => {
    assert.equal(
      RELEASE_MIGRATION_FIXTURE_CATALOG.some((entry) => entry.riskClassId === riskClassId),
      true,
      `risk class ${riskClassId} should map to at least one fixture`,
    );
  });
});

test('release migration catalog has no duplicate fixture ids and sane grouping', () => {
  const ids = RELEASE_MIGRATION_FIXTURE_CATALOG.map((entry) => entry.fixtureId);
  assert.equal(new Set(ids).size, ids.length, 'fixture ids must be unique');

  const primary = RELEASE_MIGRATION_FIXTURE_CATALOG.filter((entry) => entry.group === 'primary_risk');
  const compatibility = RELEASE_MIGRATION_FIXTURE_CATALOG.filter((entry) => entry.group === 'compatibility');
  assert.equal(primary.length > 0, true);
  assert.equal(compatibility.length > 0, true);

  primary.forEach((entry) => {
    assert.notEqual(entry.riskClassId, 'current_save_regression');
    assert.notEqual(entry.riskClassId, 'legacy_unversioned_source');
  });
});

test('hidden-craft fixture exists on disk and catalog points at it', async () => {
  const entry = RELEASE_MIGRATION_FIXTURE_CATALOG.find((fixture) => fixture.fixtureId === 'legacy-hidden-craft-outputs');
  assert.ok(entry);
  assert.equal(entry?.expectedPrimaryStepIds.includes('v2_0_0_refund_hidden_craft_outputs'), true);

  const fixturePath = path.join(FIXTURE_DIR, entry!.fileName);
  const raw = await fs.readFile(fixturePath, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  assert.equal(typeof parsed.version, 'string');
});
