import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getPrestigeRuntimeCatalog } from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

test('MP5 prestige memory nodes are authored and runtime-classified truthfully', async () => {
  const prestigeStore = await readJson<{ upgrades: Array<{ id: string; effect?: Record<string, unknown> }> }>('prestige_store.json');
  const ids = prestigeStore.upgrades.map((upgrade) => upgrade.id);

  assert.equal(ids.includes('form_memory'), true);
  assert.equal(ids.includes('scripture_echo'), true);
  assert.equal(ids.includes('root_clarity'), true);
  assert.equal(ids.includes('calm_first_breath'), true);
  assert.equal(ids.includes('old_sparring_shadows'), true);
  assert.equal(ids.includes('doctrine_archive'), true);

  const catalog = getPrestigeRuntimeCatalog({ prestige_store: prestigeStore } as never);
  assert.equal(catalog.nodeById.form_memory.status, 'visible_live');
  assert.equal(catalog.nodeById.scripture_echo.status, 'visible_live');
  assert.equal(catalog.nodeById.root_clarity.status, 'visible_live');
  assert.equal(catalog.nodeById.calm_first_breath.status, 'visible_live');
  assert.equal(catalog.nodeById.old_sparring_shadows.status, 'visible_live');
  assert.equal(catalog.nodeById.doctrine_archive.status, 'hidden_unsupported');
});
