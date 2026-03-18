import assert from 'node:assert/strict';
import test from 'node:test';

import { CURRENT_SAVE_VERSION, runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;

test('selectedPath is backfilled from lifePath for legacy-path-only fixture', async () => {
  const fixture = await loadMigrationFixture('legacy-path-only');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const gameState = result.migrated.gameState as Record<string, unknown>;

  assert.equal(result.report.finalVersion, CURRENT_SAVE_VERSION);
  assert.equal(gameState.selectedPath, 'earth');
  assert.equal('lifePath' in gameState, false);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'PATH_BACKFILLED_FROM_LIFEPATH'), true);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'LEGACY_LIFEPATH_ALIAS_DROPPED'), true);
});

test('path conflict resolves deterministically to selectedPath without preserving lifePath as current truth', async () => {
  const fixture = await loadMigrationFixture('legacy-path-conflict');
  const result = runSaveMigrations(fixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const gameState = result.migrated.gameState as Record<string, unknown>;

  assert.equal(gameState.selectedPath, 'martial');
  assert.equal('lifePath' in gameState, false);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'PATH_CONFLICT_RESOLVED_TO_SELECTED_PATH'), true);
  assert.equal(result.report.warnings.some((entry) => entry.code === 'LEGACY_LIFEPATH_ALIAS_DROPPED'), true);
});
