import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeForgeBlueprint, validateLoadedContent } from '../../src/content/index.js';
import {
  getAllowedForgeModes,
  getDefaultForgeMode,
  isForgeModeAllowed,
} from '../../src/systems/forge/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

test('packet 3.5B forge mode policy is explicit for refine, temper, and rune ladders', async () => {
  const validated = await getValidated();
  const byId = Object.fromEntries(validated.forge_blueprints.map((blueprint) => [blueprint.id, normalizeForgeBlueprint(blueprint as never)]));

  assert.deepEqual(getAllowedForgeModes(byId.forge_refine_basic), ['idle', 'assisted']);
  assert.deepEqual(getAllowedForgeModes(byId.forge_temper_weapon_t1), ['idle', 'assisted', 'handsOn']);
  assert.deepEqual(getAllowedForgeModes(byId.forge_rune_ember_t1), ['idle', 'assisted', 'handsOn']);

  assert.equal(isForgeModeAllowed(byId.forge_temper_weapon_t1, 'handsOn'), true);
  assert.equal(isForgeModeAllowed(byId.forge_refine_basic, 'handsOn'), false);
  assert.equal(isForgeModeAllowed(byId.forge_rune_ember_t1, 'handsOn'), true);

  assert.equal(getDefaultForgeMode(byId.forge_refine_basic), 'idle');
  assert.equal(getDefaultForgeMode(byId.forge_temper_weapon_t1), 'idle');
});
