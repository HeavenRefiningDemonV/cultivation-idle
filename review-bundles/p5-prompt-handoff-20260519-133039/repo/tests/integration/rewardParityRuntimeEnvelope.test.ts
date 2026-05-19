import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildRewardParityAuditReport,
  buildRuinsFinalChestBonusBundle,
  getRuinsDropsConfig,
  mergeRewardBundles,
  rollRuinDropTable,
  type RewardRandomSource,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

class SeededRandom implements RewardRandomSource {
  constructor(private state: number) {}

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

let validatedPromise: Promise<Awaited<ReturnType<typeof loadValidated>>> | null = null;
async function loadValidated() {
  return validateLoadedContent((await loadRawProgressionContent()) as never);
}
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadValidated();
  return validatedPromise;
}

test('packet 3.2B runtime envelope keeps Outskirts gold/common-first and Ruins targeted/anchor-first for every live city', async () => {
  const validated = await getValidated();
  const report = buildRewardParityAuditReport(validated);

  report.cities.forEach((cityAudit) => {
    assert.ok(
      cityAudit.metrics.outskirts.goldPerItemUnit > cityAudit.metrics.ruins.goldPerItemUnit,
      `${cityAudit.cityId} outskirts should have the stronger gold posture`,
    );
    assert.ok(
      cityAudit.metrics.outskirts.commonShare >= 0.55,
      `${cityAudit.cityId} outskirts should stay common-material first`,
    );
    assert.ok(
      cityAudit.metrics.outskirts.targetedAndAnchorShare <= 0.35,
      `${cityAudit.cityId} outskirts targeted spikes should remain secondary`,
    );
    assert.ok(
      cityAudit.metrics.ruins.targetedAndAnchorShare > cityAudit.metrics.outskirts.targetedAndAnchorShare,
      `${cityAudit.cityId} ruins should remain the stronger targeted/anchor source`,
    );
    assert.ok(cityAudit.metrics.ruins.goldPerLoop > 0, `${cityAudit.cityId} ruins should still grant some gold`);
    assert.ok(
      cityAudit.metrics.ruins.targetedAndAnchorShare > cityAudit.metrics.ruins.commonShare,
      `${cityAudit.cityId} ruins should not become a generic common-material loop`,
    );
  });
});

test('packet 3.2B ruin pity/support bonus remains additive without replacing deterministic anchor identity', async () => {
  const validated = await getValidated();
  const ruinsDrops = getRuinsDropsConfig(validated.economy);
  const cityIds = ['city_pinewind_hamlet', 'city_ironpeak_bastion'] as const;

  cityIds.forEach((cityId, offset) => {
    const ruin = validated.ruins.find((entry) => entry.cityId === cityId);
    assert.ok(ruin, `missing ruin for ${cityId}`);
    const rng = new SeededRandom(9000 + offset);
    const chest = rollRuinDropTable(ruin!.finalChestDrops, `${ruin!.id}-final`, rng);
    const bonus = buildRuinsFinalChestBonusBundle(ruin!.cityIndex ?? offset, ruinsDrops, rng);
    const merged = mergeRewardBundles(chest, bonus);
    const guaranteedIds = new Set((ruin!.finalChestDrops.guaranteed ?? []).map((entry) => entry.itemId));
    const mergedIds = new Set((merged.items ?? []).map((entry) => entry.itemId));

    guaranteedIds.forEach((itemId) => {
      assert.ok(mergedIds.has(itemId), `${cityId} merged chest should still include guaranteed anchor/support ${itemId}`);
    });
    assert.ok((bonus.items ?? []).length > 0, `${cityId} should receive an additive ruin support bonus`);
    (bonus.items ?? []).forEach((item) => {
      assert.ok(!guaranteedIds.has(item.itemId), `${cityId} additive bonus should supplement, not replace, guaranteed anchor identity`);
    });
  });
});
