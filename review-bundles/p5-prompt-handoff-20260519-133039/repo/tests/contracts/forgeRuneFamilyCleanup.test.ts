import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildLiveForgeCatalog, LIVE_RUNE_CITY_PAIRS } from '../../src/systems/forge/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

test('packet 3.5A rune visibility keeps only canonical forge_rune families by city', async () => {
  const validated = await getValidated();
  const catalog = buildLiveForgeCatalog(validated);
  const visibleIds = catalog.visibleBlueprintIds;

  assert.equal(visibleIds.includes('rune_inscription_basic'), false);
  assert.equal(visibleIds.includes('rune_inscription_advanced'), false);
  Object.entries(LIVE_RUNE_CITY_PAIRS).forEach(([cityId, ids]) => {
    const liveCityRunes = ids.filter((id) => visibleIds.includes(id));
    assert.deepEqual(liveCityRunes, [...ids], `expected canonical rune pair for ${cityId}`);
  });
});
