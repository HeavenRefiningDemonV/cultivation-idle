import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import {
  RUINS_BEST_USED_WHEN,
  RUINS_GOLD_SECONDARY_LINE,
  RUINS_ROLE_TAG,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { buildWorldModuleCardSurface, getWorldModuleCardDefinition } from '../../src/systems/world/moduleCardRegistry.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function loadValidatedContent(): Promise<ValidatedContent> {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

void test('ruins world-card and registry surfaces stay pinned to canonical role/best-used/boundary strings', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id ?? 'city_pinewind_hamlet';

  const definition = getWorldModuleCardDefinition('ruins');
  const surface = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'ruins' });

  assert.equal(RUINS_ROLE_TAG, 'Targeted Mats');
  assert.equal(RUINS_BEST_USED_WHEN, 'Best used when you need targeted local materials and deterministic support rewards.');
  assert.equal(RUINS_GOLD_SECONDARY_LINE, 'Gold is secondary here; the run is for targeted local materials and support stability.');

  assert.equal(definition.roleTag, RUINS_ROLE_TAG);
  assert.equal(definition.bestUsedWhen, RUINS_BEST_USED_WHEN);

  assert.equal(surface.roleTag, RUINS_ROLE_TAG);
  assert.equal(surface.bestUsedWhen, RUINS_BEST_USED_WHEN);
  assert.equal(surface.boundaryLine, RUINS_GOLD_SECONDARY_LINE);
});

void test('module card registry no longer hardcodes stale ruins role literal', () => {
  const registrySource = readFileSync(resolve(process.cwd(), 'src/systems/world/moduleCardRegistry.ts'), 'utf8');
  assert.doesNotMatch(registrySource, /roleTag:\s*'Targeted\s+Mats'/);
  assert.match(registrySource, /roleTag:\s*RUINS_ROLE_TAG/);
});
