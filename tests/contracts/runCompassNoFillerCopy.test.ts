import assert from 'node:assert/strict';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/buildRunCompassSurfaceV2.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

const FORBIDDEN_FILLER = [
  'Waiting',
  'Stay the course',
  'No additional action needed right now.',
  'No stronger corrective route is surfaced right now.',
  'Maybe try',
  'Explore the world',
];

function flattenText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenText(entry));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => flattenText(entry));
  }
  return [];
}

test('RunCompassSurfaceV2 does not expose filler copy in live computable states', async () => {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  const text = flattenText(surface);
  for (const forbidden of FORBIDDEN_FILLER) {
    assert.equal(
      text.some((entry) => entry.includes(forbidden)),
      false,
      `Run Compass V2 must not expose filler copy: ${forbidden}`,
    );
  }
});
