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

test('packet 3.2A Outskirts common pools stay gold/common-first and keep targeted leakage limited to rare spikes', async () => {
  const audit = await getAudit();

  audit.cities.forEach((cityAudit) => {
    const profile = getCityRewardRoleProfile(cityAudit.cityId);
    assert.equal(cityAudit.outskirts.goldPosture, 'primary', `${cityAudit.cityId} should remain the gold-forward field loop`);
    assert.deepEqual(cityAudit.outskirts.targetedLeakageInCommon, [], `${cityAudit.cityId} common pool should not leak targeted materials`);
    assert.deepEqual(cityAudit.outskirts.anchorLeakage, [], `${cityAudit.cityId} should not duplicate the ruins anchor job`);
    assert.ok(cityAudit.outskirts.commonFieldHits.length >= Math.min(3, profile.commonFieldMaterialIds.length));
    assert.ok(cityAudit.outskirts.targetedRareSpikes.length >= 1, `${cityAudit.cityId} should keep at least one intentional local rare spike`);
    assert.ok(cityAudit.outskirts.localFlavorItems.length >= 4, `${cityAudit.cityId} should preserve local flavor instead of flattening to generic drops`);
  });
});
