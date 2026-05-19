import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildLiveEconomyAuditReport,
  getLiveReagentPathAuditByBlueprintId,
  getVisibleAlchemyRecipes,
  hasVisibleLiveReagentPath,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('packet 3.6A live Quenching Oil t2 recipe path stays unique, visible, and connected to legendary refine', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const visibleRecipes = getVisibleAlchemyRecipes(validated).filter((recipe) => recipe.id === 'alc_reagent_quenching_oil_t2');
  const t5 = validated.forge_blueprints.find((blueprint) => blueprint.id === 'forge_refine_legendary_t5');
  const pathAudit = getLiveReagentPathAuditByBlueprintId(report, 'forge_refine_legendary_t5');

  assert.equal(visibleRecipes.length, 1);
  assert.equal(visibleRecipes[0]?.timeSec, 240);
  assert.deepEqual(visibleRecipes[0]?.inputs, {
    mat_furnace_cinder: 2,
    mat_thunder_sand: 1,
  });

  assert.equal(t5?.inputs?.reagent_quenching_oil_t2, 2);
  assert.equal(hasVisibleLiveReagentPath(report, 'forge_refine_legendary_t5', 'reagent_quenching_oil_t2'), true);
  assert.equal((pathAudit?.missingDependencyIds ?? []).includes('reagent_quenching_oil_t2'), false);
});
