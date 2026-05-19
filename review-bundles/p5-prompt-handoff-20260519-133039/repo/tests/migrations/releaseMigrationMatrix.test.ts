import assert from 'node:assert/strict';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  RELEASE_MIGRATION_FIXTURE_CATALOG,
  type ReleaseMigrationFixtureDefinition,
} from '../../src/save/migrations/releaseMigrationFixtureCatalog.js';
import {
  buildReleaseMigrationMatrixReport,
  renderReleaseMigrationMatrixReport,
} from '../../src/save/migrations/migrationMatrix.js';
import { loadMigrationFixture } from './loadFixture.js';

const execFileAsync = promisify(execFile);

async function loadCatalogFixtures(catalog: readonly ReleaseMigrationFixtureDefinition[] = RELEASE_MIGRATION_FIXTURE_CATALOG) {
  const fixtures = await Promise.all(catalog.map(async (entry) => ({
    fixtureId: entry.fixtureId,
    save: await loadMigrationFixture(entry.fixtureId),
  })));
  return fixtures;
}

test('full release migration matrix builds and covers primary/compatibility groups', async () => {
  const report = buildReleaseMigrationMatrixReport({ fixtures: await loadCatalogFixtures(), generatedAt: 1736035200000 });

  assert.equal(report.totalFixtures, RELEASE_MIGRATION_FIXTURE_CATALOG.length);
  assert.equal(report.entries.some((entry) => entry.group === 'primary_risk'), true);
  assert.equal(report.entries.some((entry) => entry.group === 'compatibility'), true);
  assert.equal(report.overallPass, true);
});

test('hidden-craft fixture passes with packet 3.1 cleanup and idempotent apply semantics', async () => {
  const report = buildReleaseMigrationMatrixReport({ fixtures: await loadCatalogFixtures() });
  const entry = report.entries.find((row) => row.fixtureId === 'legacy-hidden-craft-outputs');

  assert.ok(entry);
  assert.equal(entry?.overallPass, true);
  assert.equal(entry?.apply.activeStepIds.includes('v2_0_0_refund_hidden_craft_outputs'), true);
  assert.deepEqual(entry?.semanticSnapshot.hiddenCraftOutputIdsRemaining, []);
  assert.equal(entry?.expectationResults.some((result) => result.key === 'applyIdempotent' && result.pass), true);
});

test('future-slice, gate alias, offline split, and current-save semantics are reported correctly', async () => {
  const report = buildReleaseMigrationMatrixReport({ fixtures: await loadCatalogFixtures() });

  const future = report.entries.find((row) => row.fixtureId === 'legacy-future-slice');
  assert.ok(future);
  assert.equal(future?.semanticSnapshot.realmName, 'Spirit Severing');
  assert.equal(future?.semanticSnapshot.currentCityId, 'city_ironpeak_bastion');
  assert.deepEqual(future?.semanticSnapshot.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ]);

  const gate = report.entries.find((row) => row.fixtureId === 'legacy-gate-item-ids');
  assert.ok(gate);
  assert.deepEqual(gate?.semanticSnapshot.legacyGateAliasIdsRemaining, []);

  const offline = report.entries.find((row) => row.fixtureId === 'legacy-offline-split');
  assert.ok(offline);
  assert.equal(offline?.semanticSnapshot.offlineTimestampsAligned, true);

  const current = report.entries.find((row) => row.fixtureId === 'current-save');
  assert.ok(current);
  assert.equal(current?.overallPass, true);
});

test('human renderer includes grouped sections, source version kind, and fixture status lines', async () => {
  const report = buildReleaseMigrationMatrixReport({ fixtures: await loadCatalogFixtures(), generatedAt: 1736035200000 });
  const human = renderReleaseMigrationMatrixReport(report);

  assert.equal(human.includes('Primary risk fixtures:'), true);
  assert.equal(human.includes('Compatibility fixtures:'), true);
  assert.equal(human.includes('legacy-hidden-craft-outputs'), true);
  assert.equal(human.includes('source: 2.0.0 (current)'), true);
  assert.equal(/- PASS legacy-path-conflict/.test(human), true);
});

test('CLI json output is stable enough for downstream release sign-off consumers', async () => {
  const scriptPath = path.join(process.cwd(), 'tmp-tests/scripts/release/runMigrationMatrix.js');
  const { stdout } = await execFileAsync('node', [
    '--loader=./scripts/relativeJsLoader.mjs',
    scriptPath,
    '--json',
  ], { cwd: process.cwd() });

  const parsed = JSON.parse(stdout) as {
    suiteVersion: string;
    overallPass: boolean;
    entries: Array<{ fixtureId: string; semanticSnapshot: { sourceVersionKind: string }; apply: { activeStepIds: string[] } }>;
  };

  assert.equal(parsed.suiteVersion, '7.2b');
  assert.equal(typeof parsed.overallPass, 'boolean');
  assert.equal(Array.isArray(parsed.entries), true);
  const hiddenCraft = parsed.entries.find((entry) => entry.fixtureId === 'legacy-hidden-craft-outputs');
  assert.ok(hiddenCraft);
  assert.equal(hiddenCraft?.apply.activeStepIds.includes('v2_0_0_refund_hidden_craft_outputs'), true);
  const unversioned = parsed.entries.find((entry) => entry.fixtureId === 'legacy-unversioned-save');
  assert.equal(unversioned?.semanticSnapshot.sourceVersionKind, 'legacy-unversioned');
});
