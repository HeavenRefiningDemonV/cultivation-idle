import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildActivityRewardAuditReport, getCityRewardRoleProfile } from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let auditPromise: Promise<Awaited<ReturnType<typeof loadAudit>>> | null = null;

async function loadAudit() {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  return buildActivityRewardAuditReport(validated);
}

async function getAudit() {
  if (!auditPromise) auditPromise = loadAudit();
  return auditPromise;
}

test('packet 3.2A Ruins preserve deterministic anchors, targeted local materials, and rare-pity identity', async () => {
  const audit = await getAudit();

  audit.cities.forEach((cityAudit) => {
    const profile = getCityRewardRoleProfile(cityAudit.cityId);
    assert.equal(cityAudit.ruins.goldPosture, 'secondary', `${cityAudit.cityId} ruins should keep some gold without becoming the main gold engine`);
    assert.equal(cityAudit.ruins.hasDeterministicAnchor, true, `${cityAudit.cityId} ruins should guarantee ${profile.deterministicAnchorItemId}`);
    assert.ok(cityAudit.ruins.leadMaterialsInRooms.length >= 1, `${cityAudit.cityId} ruins rooms should carry local targeted materials`);
    assert.ok(cityAudit.ruins.targetedMaterialsInChest.length >= 1, `${cityAudit.cityId} ruins chest should stay targeted/anchor-first`);
    assert.equal(cityAudit.ruins.rarePityConfigured, true, `${cityAudit.cityId} ruins should retain boss chest rare pity wiring`);
  });
});
