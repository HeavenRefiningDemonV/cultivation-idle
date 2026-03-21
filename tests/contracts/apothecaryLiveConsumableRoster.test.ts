import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { getConsumableSpec } from '../../src/systems/consumables/consumableCatalog.js';
import { getLiveConsumableRosterEntry, listLiveConsumableRosterEntries } from '../../src/systems/consumables/liveConsumableRoster.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedContentPromise: Promise<ValidatedContent> | null = null;

const loadValidatedContent = async (): Promise<ValidatedContent> => {
  if (!validatedContentPromise) {
    validatedContentPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedContentPromise;
};

test.beforeEach(async () => {
  const validated = await loadValidatedContent();
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...validated.cities].sort((a, b) => a.index - b.index),
  });
});

test('every live apothecary stock item and live cultivation brew output has an implemented consumable spec', () => {
  const content = useContentStore.getState().raw!;
  const liveRosterIds = new Set(listLiveConsumableRosterEntries().map((entry) => entry.itemId));

  content.apothecary_shops.forEach((shop) => {
    (shop.stock ?? []).forEach((stock) => {
      const entry = getLiveConsumableRosterEntry(stock.itemId);
      if (!entry?.isLive) return;
      assert.ok(liveRosterIds.has(stock.itemId), `${stock.itemId} should be in the live roster`);
      assert.ok(getConsumableSpec(stock.itemId), `${stock.itemId} should have a consumable spec`);
      assert.ok(entry.sourceKinds.includes('apothecary_shop'), `${stock.itemId} should record shop sourcing`);
    });
  });

  content.alchemy_recipes.forEach((recipe) => {
    Object.keys(recipe.outputs ?? {}).forEach((itemId) => {
      const entry = getLiveConsumableRosterEntry(itemId);
      if (!entry?.isLive || entry.domain !== 'cultivation') return;
      assert.ok(getConsumableSpec(itemId), `${itemId} should have a cultivation spec`);
      assert.ok(entry.sourceKinds.includes('alchemy_recipe'), `${itemId} should record recipe sourcing`);
    });
  });
});

test('deferred tribulation buffer stays out of the live roster requirement set', () => {
  const entry = getLiveConsumableRosterEntry('cons_tribulation_buffer_t1');
  assert.ok(entry);
  assert.equal(entry?.isLive, false);
  assert.equal(getConsumableSpec('cons_tribulation_buffer_t1'), null);
});

