import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  compareSaveVersions,
  CURRENT_SAVE_VERSION,
  parseSaveVersion,
} from '../../src/save/migrations/index.js';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

const readFixture = async (name: string) =>
  JSON.parse(await fs.readFile(path.join(FIXTURE_DIR, `${name}.json`), 'utf8')) as Record<string, unknown>;

test('version detection handles current, unversioned, and malformed versions', async () => {
  const current = await readFixture('current-save');
  assert.equal(parseSaveVersion(current.version).kind, 'current');

  const legacyUnversioned = await readFixture('legacy-unversioned-save');
  assert.equal(parseSaveVersion(legacyUnversioned.version).kind, 'legacy-unversioned');

  assert.equal(parseSaveVersion('v2').kind, 'malformed-version');
  assert.equal(compareSaveVersions('1.9.9', CURRENT_SAVE_VERSION) < 0, true);
});

test('default save version constant is wired to current migration version', async () => {
  const file = await fs.readFile(path.resolve(process.cwd(), 'src', 'save', 'defaultSaveState.ts'), 'utf8');
  assert.match(file, /export const SAVE_VERSION = CURRENT_SAVE_VERSION;/);
});
