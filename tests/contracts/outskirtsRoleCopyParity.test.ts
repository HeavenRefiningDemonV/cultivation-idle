import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import {
  OUTSKIRTS_BEST_USED_WHEN,
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
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

void test('outskirts world-card and registry surfaces stay pinned to canonical role/best-used/boundary strings', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id ?? 'city_pinewind_hamlet';

  const definition = getWorldModuleCardDefinition('outskirts');
  const surface = buildWorldModuleCardSurface({ content, cityId, moduleKey: 'outskirts' });

  assert.equal(OUTSKIRTS_ROLE_TAG, 'Gold & Common Mats');
  assert.equal(OUTSKIRTS_BEST_USED_WHEN, 'Best used when you need gold, common materials, or low-risk combat reps.');
  assert.equal(OUTSKIRTS_BOUNDARY_LINE, 'Not the best source for targeted city materials.');

  assert.equal(definition.roleTag, OUTSKIRTS_ROLE_TAG);
  assert.equal(definition.bestUsedWhen, OUTSKIRTS_BEST_USED_WHEN);

  assert.equal(surface.roleTag, OUTSKIRTS_ROLE_TAG);
  assert.equal(surface.bestUsedWhen, OUTSKIRTS_BEST_USED_WHEN);
  assert.equal(surface.boundaryLine, OUTSKIRTS_BOUNDARY_LINE);
});

void test('module card registry no longer hardcodes stale outskirts role literal', () => {
  const registrySource = readFileSync(resolve(process.cwd(), 'src/systems/world/moduleCardRegistry.ts'), 'utf8');
  assert.doesNotMatch(registrySource, /roleTag:\s*'Gold\s*&\s*Common\s*Mats'/);
  assert.match(registrySource, /roleTag:\s*OUTSKIRTS_ROLE_TAG/);
});
