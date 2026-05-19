import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildForgeExactSurfaceFromStores } from '../../src/features/professions/forgeExact/buildForgeExactSurface.js';
import { getForgeBlueprint, useContentStore } from '../../src/stores/contentStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import {
  getAllowedForgeModes,
} from '../../src/systems/forge/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

async function loadContent() {
  const validated = await getValidated();
  useContentStore.setState({
    raw: validated,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])),
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])),
      runesById: Object.fromEntries(validated.runes.map((rune) => [rune.id, rune as { id: string }])),
    },
    citiesSorted: [...validated.cities].sort((a, b) => a.index - b.index),
  });
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
  });
}

test('forge exact keeps Refine queue-first and never exposes hands-on Refine', async () => {
  await loadContent();
  const surface = buildForgeExactSurfaceFromStores('city_pinewind_hamlet', {
    activeTab: 'refine',
    activeMode: 'handsOn',
  });
  const handsOn = surface.leftRail.modes.find((mode) => mode.id === 'handsOn');
  const selected = surface.meta.selectedBlueprintId ? getForgeBlueprint(surface.meta.selectedBlueprintId) : null;

  assert.ok(selected);
  assert.deepEqual(getAllowedForgeModes(selected), ['idle', 'assisted']);
  assert.equal(surface.meta.activeMode, 'idle');
  assert.equal(handsOn?.enabled, false);
  assert.match(handsOn?.note ?? '', /Refine|queue|Temper/i);
});

test('forge exact Temper and Runes hands-on rows mirror the existing mode policy', async () => {
  await loadContent();
  for (const activeTab of ['temper', 'runes'] as const) {
    const surface = buildForgeExactSurfaceFromStores('city_pinewind_hamlet', {
      activeTab,
      activeMode: 'handsOn',
    });
    const blueprint = surface.meta.selectedBlueprintId ? getForgeBlueprint(surface.meta.selectedBlueprintId) : null;
    assert.ok(blueprint);
    const policyAllowsHandsOn = getAllowedForgeModes(blueprint).includes('handsOn');
    const handsOn = surface.leftRail.modes.find((mode) => mode.id === 'handsOn');

    assert.equal(handsOn?.enabled, policyAllowsHandsOn);
    assert.equal(surface.meta.activeMode, policyAllowsHandsOn ? 'handsOn' : getAllowedForgeModes(blueprint)[0]);
  }
});
