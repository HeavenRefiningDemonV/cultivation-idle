import assert from 'node:assert/strict';
import test from 'node:test';

import { migrateSave, SAVE_VERSION } from '../../src/save/defaultSaveState.js';
import { RELEASE_MIGRATION_FIXTURE_CATALOG } from '../../src/save/migrations/releaseMigrationFixtureCatalog.js';
import { loadMigrationFixture } from './loadFixture.js';

test('release fixtures pass hydration migration smoke through migrateSave runtime path', async () => {
  const fixtures = RELEASE_MIGRATION_FIXTURE_CATALOG.filter((entry) => entry.runtimeSmokeProfile || entry.postApplyProfile);

  for (const fixture of fixtures) {
    const raw = await loadMigrationFixture(fixture.fixtureId);
    const migrated = migrateSave(raw);

    assert.equal(migrated.version, SAVE_VERSION, `${fixture.fixtureId} should migrate to current save version`);
    assert.equal(typeof migrated.gameState?.qi, 'string', `${fixture.fixtureId} should keep game state integrity`);
    assert.equal(typeof migrated.inventoryState?.items, 'object', `${fixture.fixtureId} should keep inventory slice integrity`);
  }
});
