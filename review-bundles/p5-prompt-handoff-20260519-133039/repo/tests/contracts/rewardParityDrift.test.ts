import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildAllCityActivityRewardReadModels,
  buildRewardParityAuditReport,
  OUTSKIRTS_BEST_USED_WHEN,
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
  RUINS_BEST_USED_WHEN,
  RUINS_ROLE_TAG,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<Awaited<ReturnType<typeof loadValidated>>> | null = null;
async function loadValidated() {
  return validateLoadedContent((await loadRawProgressionContent()) as never);
}
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadValidated();
  return validatedPromise;
}

test('packet 3.2B read-model exposes the locked Outskirts and Ruins role summaries for every live city', async () => {
  const validated = await getValidated();
  const readModels = buildAllCityActivityRewardReadModels(validated);

  assert.ok(readModels.length >= 5, 'expected read-model coverage for the live semester cities');
  readModels.forEach((city) => {
    assert.equal(city.outskirts.roleTag, OUTSKIRTS_ROLE_TAG);
    assert.equal(city.outskirts.bestUsedWhen, OUTSKIRTS_BEST_USED_WHEN);
    assert.equal(city.outskirts.boundaryLine, OUTSKIRTS_BOUNDARY_LINE);
    assert.ok(city.outskirts.keyExpectedOutputs.includes('gold'), `${city.cityId} outskirts should advertise gold`);

    assert.equal(city.ruins.roleTag, RUINS_ROLE_TAG);
    assert.equal(city.ruins.bestUsedWhen, RUINS_BEST_USED_WHEN);
    assert.ok(city.ruins.leadLocalMaterials.length >= 1, `${city.cityId} ruins should expose lead local materials`);
    assert.ok(city.ruins.deterministicFinalAnchor.length > 0, `${city.cityId} ruins should expose a deterministic anchor`);
    assert.match(city.ruins.rarePitySummary, /Rare pity/i, `${city.cityId} ruins should mention rare pity`);
    assert.equal(city.ruins.goldIsSecondary, true, `${city.cityId} ruins should remain marked as secondary gold`);
  });
});

test('packet 3.2B parity audit flags no live-city drift and keeps activity lessons distinct', async () => {
  const validated = await getValidated();
  const report = buildRewardParityAuditReport(validated);

  report.cities.forEach((cityAudit) => {
    assert.equal(cityAudit.outskirtsHeadlineRole, OUTSKIRTS_ROLE_TAG, `${cityAudit.cityId} outskirts headline role drifted`);
    assert.equal(cityAudit.ruinsHeadlineRole, RUINS_ROLE_TAG, `${cityAudit.cityId} ruins headline role drifted`);
    assert.equal(cityAudit.driftDetected, false, `${cityAudit.cityId} should not have reward parity drift`);
    assert.deepEqual(cityAudit.driftReasons, [], `${cityAudit.cityId} should not report drift reasons`);
    assert.deepEqual(cityAudit.localOverlapRisks, [], `${cityAudit.cityId} should not report overlap risks`);
    assert.equal(cityAudit.metrics.ruins.anchorUnitsPerLoop > 0, true, `${cityAudit.cityId} ruins should retain deterministic anchor quantity`);
    assert.equal(cityAudit.metrics.outskirts.commonShare > cityAudit.metrics.ruins.commonShare, true, `${cityAudit.cityId} outskirts should teach the common-material lesson`);
    assert.equal(cityAudit.metrics.ruins.targetedAndAnchorShare > cityAudit.metrics.outskirts.targetedAndAnchorShare, true, `${cityAudit.cityId} ruins should teach the targeted-material lesson`);
    cityAudit.rules.forEach((rule) => {
      assert.equal(rule.passed, true, `${cityAudit.cityId} failed ${rule.ruleId}: ${rule.detail}`);
    });
  });
});
