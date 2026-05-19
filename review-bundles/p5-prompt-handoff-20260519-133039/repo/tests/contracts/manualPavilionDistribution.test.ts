import assert from "node:assert/strict";
import test from "node:test";

import { buildDoctrineSnapshot } from "../../src/systems/doctrine/index.js";
import { buildInitialStock } from "../../src/features/manuals/pavilionStockGenerator.js";
import {
  applyPavilionCorrectionPass,
  analyzeManualOffer,
} from "../../src/systems/manuals/index.js";
import { useContentStore } from "../../src/stores/contentStore.js";
import { useGameStore } from "../../src/stores/gameStore.js";
import { useTechniqueStore } from "../../src/stores/techniqueStore.js";
import type { TechRarity } from "../../src/types/index.js";
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from "../integration/expeditionRuntimeTestUtils.js";

const FIXED_NOW = 1_735_689_600_000;

function createHeavenDoctrineSnapshot() {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: "heaven",
    realm: { ...state.realm, index: 0 },
  }));
  useTechniqueStore.getState().resetLoadouts();
  return buildDoctrineSnapshot();
}

test.beforeEach(async () => {
  resetExpeditionRuntimeStores();
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().resetLoadouts();
  await primeExpeditionRuntimeStores();
});

test("packet 4.9 visible slot counts per city are unchanged", () => {
  const snapshot = createHeavenDoctrineSnapshot();
  assert.equal(
    buildInitialStock("pavilion_pinewind", FIXED_NOW, {
      snapshot,
      buildAnalysis: null,
    }).slots.length,
    10,
  );
  assert.equal(
    buildInitialStock("pavilion_stonecrag", FIXED_NOW, {
      snapshot,
      buildAnalysis: null,
    }).slots.length,
    14,
  );
  assert.equal(
    buildInitialStock("pavilion_spirit_cavern", FIXED_NOW, {
      snapshot,
      buildAnalysis: null,
    }).slots.length,
    16,
  );
  assert.equal(
    buildInitialStock("pavilion_lotusford", FIXED_NOW, {
      snapshot,
      buildAnalysis: null,
    }).slots.length,
    20,
  );
  assert.equal(
    buildInitialStock("pavilion_ironpeak", FIXED_NOW, {
      snapshot,
      buildAnalysis: null,
    }).slots.length,
    24,
  );
});

test("packet 4.9 corrected stock contains build-relevant offers", () => {
  const snapshot = createHeavenDoctrineSnapshot();
  const stock = buildInitialStock("pavilion_pinewind", FIXED_NOW, {
    snapshot,
    buildAnalysis: null,
  });
  const analyses = stock.slots.map((slot) =>
    analyzeManualOffer({
      techniqueId: slot.techniqueId,
      manualGrade: slot.grade,
      manualRarity: slot.rarity,
      snapshot,
      buildAnalysis: null,
    }),
  );

  assert.ok(analyses.filter((entry) => entry.pathAligned).length >= 2);
  assert.ok(analyses.filter((entry) => entry.supportOffer).length >= 1);
  assert.ok(analyses.filter((entry) => entry.fillsCurrentGap).length >= 1);
});

test("packet 4.9 core visible uniqueness is still preserved", () => {
  const snapshot = createHeavenDoctrineSnapshot();
  const stock = buildInitialStock("pavilion_pinewind", FIXED_NOW, {
    snapshot,
    buildAnalysis: null,
  });
  const coreIds = stock.slots.slice(0, 10).map((slot) => slot.techniqueId);

  assert.equal(new Set(coreIds).size, coreIds.length);
});

test("packet 4.9 correction pass preserves slot metadata and only swaps technique ids", () => {
  const snapshot = createHeavenDoctrineSnapshot();
  const raw = buildInitialStock("pavilion_pinewind", FIXED_NOW);
  const pavilion =
    useContentStore.getState().maps.pavilionsById.pavilion_pinewind;
  const candidatePool = Object.values(pavilion.poolByPath)
    .flat()
    .map((entry) => {
      if (typeof entry === "string") {
        const technique = useContentStore.getState().maps.techniquesById[entry];
        return { techniqueId: entry, rarity: technique?.rarity as TechRarity | undefined, weight: 1 };
      }
      const technique =
        useContentStore.getState().maps.techniquesById[entry.techId];
      return {
        techniqueId: entry.techId,
        rarity: (entry.rarity ?? technique?.rarity) as TechRarity | undefined,
        weight: Number(entry.weight ?? 1),
      };
    });
  const corrected = applyPavilionCorrectionPass({
    pavilionId: "pavilion_pinewind",
    slots: raw.slots,
    candidates: candidatePool,
    context: { snapshot, buildAnalysis: null },
  });

  assert.equal(corrected.slots.length, raw.slots.length);
  corrected.slots.forEach((slot, index) => {
    const before = raw.slots[index];
    assert.ok(before);
    assert.equal(slot.slotIndex, before.slotIndex);
    assert.equal(slot.shelf, before.shelf);
    assert.equal(slot.grade, before.grade);
    assert.equal(slot.rarity, before.rarity);
    assert.deepEqual(slot.price, before.price);
    assert.equal(slot.notSold, before.notSold);
    assert.equal(slot.sealed, before.sealed);
    assert.equal(slot.sold, before.sold);
    assert.equal(slot.soldAt, before.soldAt);
  });
});
