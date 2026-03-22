import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildLiveForgeCatalog } from '../../src/systems/forge/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

test('packet 3.5A live forge visibility only surfaces refine temper and runes', async () => {
  const validated = await getValidated();
  const catalog = buildLiveForgeCatalog(validated);
  const visibleEntries = Object.values(catalog.entriesById).filter((entry) => entry.status === 'visible_live');

  assert.deepEqual(Array.from(new Set(visibleEntries.map((entry) => entry.familyLabel))).sort(), ['Refine', 'Runes', 'Temper']);
  ['formation_plate_basic', 'forge_jade_core_shell_t1', 'forge_jade_core_upgrade_t2', 'forge_jade_core_upgrade_t3'].forEach((id) => {
    assert.notEqual(catalog.entriesById[id]?.status, 'visible_live');
  });
  ['rune_inscription_basic', 'rune_inscription_advanced'].forEach((id) => {
    assert.notEqual(catalog.entriesById[id]?.status, 'visible_live');
  });
});
