import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('save-load source uses quarantine + explicit failure codes and avoids default fallback on invalid migrated saves', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/utils/saveload.ts'), 'utf8');

  assert.equal(source.includes('QUARANTINE_KEY_PREFIX'), true);
  assert.equal(source.includes('quarantineCorruptSlot('), true);
  assert.equal(source.includes("'MIGRATED_SAVE_INVALID'"), true);
  assert.equal(source.includes("'NO_VALID_SAVE_FOUND'"), true);
  assert.equal(source.includes('Migrated save data failed validation, using defaults'), false);
});

test('save service publishes migration issue modal hooks and exposes last load failure surface', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/services/save/SaveService.ts'), 'utf8');

  assert.equal(source.includes('openMigrationIssuesModal'), true);
  assert.equal(source.includes('getLastLoadFailure()'), true);
  assert.equal(source.includes('Migration Notes'), true);
});

test('diagnostics bundle exports migration report + save-load failure diagnostics', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/services/diagnostics/buildDiagnosticsBundle.ts'), 'utf8');

  assert.equal(source.includes('lastMigrationReport'), true);
  assert.equal(source.includes('lastLoadFailure'), true);
});
