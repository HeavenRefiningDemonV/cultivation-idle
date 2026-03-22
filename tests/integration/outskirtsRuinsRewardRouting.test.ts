import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildOutskirtsRewardBundle,
  buildRuinsFinalChestBonusBundle,
  classifyActivityRewardItem,
  getOutskirtsDropsConfig,
  getRuinsDropsConfig,
  mergeRewardBundles,
  rollRuinDropTable,
  type RewardRandomSource,
} from '../../src/systems/economy/index.js';
import type { RewardBundle } from '../../src/services/rewards/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

type RewardSampleSummary = {
  gold: number;
  common: number;
  targeted: number;
  anchors: number;
  support: number;
  other: number;
};

class SeededRandom implements RewardRandomSource {
  constructor(private state: number) {}

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

function summarizeBundle(cityId: string, bundle: RewardBundle): RewardSampleSummary {
  const summary: RewardSampleSummary = { gold: Number(bundle.currencies?.gold ?? '0'), common: 0, targeted: 0, anchors: 0, support: 0, other: 0 };
  bundle.items?.forEach((item) => {
    const bucket = classifyActivityRewardItem(cityId, item.itemId);
    if (bucket === 'common_field') summary.common += item.qty;
    else if (bucket === 'targeted_local') summary.targeted += item.qty;
    else if (bucket === 'anchor') summary.anchors += item.qty;
    else if (bucket === 'support') summary.support += item.qty;
    else summary.other += item.qty;
  });
  return summary;
}

function addSummary(target: RewardSampleSummary, source: RewardSampleSummary) {
  target.gold += source.gold;
  target.common += source.common;
  target.targeted += source.targeted;
  target.anchors += source.anchors;
  target.support += source.support;
  target.other += source.other;
}

let validatedPromise: Promise<Awaited<ReturnType<typeof loadValidated>>> | null = null;
async function loadValidated() {
  return validateLoadedContent((await loadRawProgressionContent()) as never);
}
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadValidated();
  return validatedPromise;
}

test('packet 3.2A runtime reward routing makes Outskirts gold/common-first and Ruins targeted/anchor-first', async () => {
  const validated = await getValidated();
  const outskirtsDrops = getOutskirtsDropsConfig(validated.economy);
  const ruinsDrops = getRuinsDropsConfig(validated.economy);
  const cityIds = ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_ironpeak_bastion'] as const;

  cityIds.forEach((cityId, cityOffset) => {
    const outskirts = validated.outskirts.find((entry) => entry.cityId === cityId);
    const ruin = validated.ruins.find((entry) => entry.cityId === cityId);
    assert.ok(outskirts, `missing outskirts for ${cityId}`);
    assert.ok(ruin, `missing ruin for ${cityId}`);

    const outskirtsRng = new SeededRandom(1000 + cityOffset);
    const ruinsRng = new SeededRandom(2000 + cityOffset);
    const outskirtsTotals: RewardSampleSummary = { gold: 0, common: 0, targeted: 0, anchors: 0, support: 0, other: 0 };
    const ruinsTotals: RewardSampleSummary = { gold: 0, common: 0, targeted: 0, anchors: 0, support: 0, other: 0 };

    for (let run = 0; run < 25; run += 1) {
      for (let mob = 0; mob < 5; mob += 1) {
        addSummary(outskirtsTotals, summarizeBundle(cityId, buildOutskirtsRewardBundle(outskirts!, outskirtsDrops, outskirts!.cityIndex, false, outskirtsRng)));
      }
      addSummary(outskirtsTotals, summarizeBundle(cityId, buildOutskirtsRewardBundle(outskirts!, outskirtsDrops, outskirts!.cityIndex, true, outskirtsRng)));

      const roomBundles = Array.from({ length: ruin!.roomCount }, () =>
        rollRuinDropTable(ruin!.dropsPerRoom, `${ruin!.id}-room`, ruinsRng),
      );
      const chestBundle = mergeRewardBundles(
        rollRuinDropTable(ruin!.finalChestDrops, `${ruin!.id}-chest`, ruinsRng),
        buildRuinsFinalChestBonusBundle(outskirts!.cityIndex, ruinsDrops, ruinsRng),
      );
      roomBundles.forEach((bundle) => addSummary(ruinsTotals, summarizeBundle(cityId, bundle)));
      addSummary(ruinsTotals, summarizeBundle(cityId, chestBundle));
    }

    assert.ok(outskirtsTotals.gold > 0, `${cityId} outskirts should pay gold routinely`);
    assert.ok(outskirtsTotals.common > outskirtsTotals.targeted + outskirtsTotals.anchors, `${cityId} outskirts should skew toward common field materials`);
    assert.ok(ruinsTotals.targeted + ruinsTotals.anchors > 0, `${cityId} ruins should still surface targeted and anchor rewards at runtime`);
    assert.ok(ruinsTotals.gold > 0, `${cityId} ruins should still grant some gold`);
    assert.ok(ruinsTotals.targeted + ruinsTotals.anchors > outskirtsTotals.targeted + outskirtsTotals.anchors, `${cityId} ruins should be the stronger targeted-material source`);
  });
});
