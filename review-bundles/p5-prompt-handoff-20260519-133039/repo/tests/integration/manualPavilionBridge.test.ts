import assert from "node:assert/strict";
import test from "node:test";

import { useGameStore } from "../../src/stores/gameStore.js";
import { useTechniqueStore } from "../../src/stores/techniqueStore.js";
import { useTechCollectionStore } from "../../src/stores/techCollectionStore.js";
import { useManualPavilionStore } from "../../src/stores/manualPavilionStore.js";
import { useManualSatchelStore } from "../../src/stores/manualSatchelStore.js";
import { analyzeManualOffer } from "../../src/systems/manuals/index.js";
import { buildDoctrineSnapshot } from "../../src/systems/doctrine/index.js";
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from "./expeditionRuntimeTestUtils.js";

const FIXED_NOW = 1_735_689_600_000;

function resetManualRuntimeStores() {
  resetExpeditionRuntimeStores();
  useManualPavilionStore.getState().hardReset();
  useManualSatchelStore.getState().hardReset();
  useTechCollectionStore.getState().hardReset();
  useTechniqueStore.getState().resetLoadouts();
  useGameStore.getState().hardResetGameState();
}

test.beforeEach(async () => {
  resetManualRuntimeStores();
  await primeExpeditionRuntimeStores();
});

test("packet 4.9 startStudy now uses the shared duration contract", () => {
  const satchel = useManualSatchelStore.getState();
  const mortal = satchel.addManual({
    techId: "tech_heaven_starfire_bolt",
    grade: "mortal",
    rarity: "common",
  });
  assert.equal(satchel.startStudy(mortal.id, FIXED_NOW).ok, true);
  let activeStudy = useManualSatchelStore.getState().activeStudy;
  assert.ok(activeStudy);
  assert.equal(activeStudy.endsAt - activeStudy.startedAt, 30_000);

  useManualSatchelStore.getState().hardReset();
  const heaven = useManualSatchelStore
    .getState()
    .addManual({
      techId: "tech_heaven_starfire_bolt",
      grade: "heaven",
      rarity: "rare",
    });
  assert.equal(
    useManualSatchelStore.getState().startStudy(heaven.id, FIXED_NOW).ok,
    true,
  );
  activeStudy = useManualSatchelStore.getState().activeStudy;
  assert.ok(activeStudy);
  assert.equal(activeStudy.endsAt - activeStudy.startedAt, 240_000);
});

test("packet 4.9 dismantleManual now uses the shared duplicate fragment helper", () => {
  const manual = useManualSatchelStore
    .getState()
    .addManual({
      techId: "tech_heaven_starfire_bolt",
      grade: "earth",
      rarity: "rare",
    });
  const result = useManualSatchelStore.getState().dismantleManual(manual.id);

  assert.equal(result.ok, true);
  assert.equal(result.fragmentsGained, 132);
});

test("packet 4.9 better-quality owned manual upgrades instead of converting to fragments", () => {
  useTechCollectionStore.getState().unlockTech("tech_heaven_starfire_bolt", {
    unlocked: true,
    manualGrade: "earth",
    rarity: "rare",
    rank: 1,
    masteryXp: 0,
  });
  const manual = useManualSatchelStore
    .getState()
    .addManual({
      techId: "tech_heaven_starfire_bolt",
      grade: "heaven",
      rarity: "rare",
    });

  assert.equal(
    useManualSatchelStore.getState().startStudy(manual.id, FIXED_NOW).ok,
    true,
  );
  const completion =
    useManualSatchelStore.getState().activeStudy?.endsAt ?? FIXED_NOW;
  useManualSatchelStore.getState().tick(completion);

  const owned = useTechCollectionStore
    .getState()
    .ensureTechState("tech_heaven_starfire_bolt");
  assert.equal(owned.manualGrade, "heaven");
  assert.equal(owned.rarity, "rare");
  assert.equal(
    useTechCollectionStore.getState().getFragments("tech_heaven_starfire_bolt"),
    0,
  );
});

test("packet 4.9 worse/equal owned manual still converts to fragments", () => {
  useTechCollectionStore.getState().unlockTech("tech_heaven_starfire_bolt", {
    unlocked: true,
    manualGrade: "heaven",
    rarity: "epic",
    rank: 1,
    masteryXp: 0,
  });
  const manual = useManualSatchelStore
    .getState()
    .addManual({
      techId: "tech_heaven_starfire_bolt",
      grade: "earth",
      rarity: "rare",
    });

  assert.equal(
    useManualSatchelStore.getState().startStudy(manual.id, FIXED_NOW).ok,
    true,
  );
  const completion =
    useManualSatchelStore.getState().activeStudy?.endsAt ?? FIXED_NOW;
  useManualSatchelStore.getState().tick(completion);

  const owned = useTechCollectionStore
    .getState()
    .ensureTechState("tech_heaven_starfire_bolt");
  assert.equal(owned.manualGrade, "heaven");
  assert.equal(owned.rarity, "epic");
  assert.equal(
    useTechCollectionStore.getState().getFragments("tech_heaven_starfire_bolt"),
    132,
  );
});

test("packet 4.9 manualPavilionStore.ensureStock passes the correction context into runtime stock generation", () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: "heaven",
    realm: { ...state.realm, index: 0 },
  }));
  useTechniqueStore.getState().resetLoadouts();

  useManualPavilionStore.getState().ensureStock("pavilion_pinewind", FIXED_NOW);
  const stock = useManualPavilionStore.getState().getStock("pavilion_pinewind");
  assert.ok(stock);

  const snapshot = buildDoctrineSnapshot();
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
