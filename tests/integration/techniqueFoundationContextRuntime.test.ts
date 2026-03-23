import test from "node:test";
import assert from "node:assert/strict";

import { useGameStore } from "../../src/stores/gameStore.js";
import { useTechniqueStore } from "../../src/stores/techniqueStore.js";
import { useTechCollectionStore } from "../../src/stores/techCollectionStore.js";
import { buildTechniqueFoundationContext } from "../../src/systems/builds/index.js";
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from "./expeditionRuntimeTestUtils.js";

test("packet 4.9 runtime foundation context uses selected runtime doctrine and loadout truth", async () => {
  resetExpeditionRuntimeStores();
  await primeExpeditionRuntimeStores();

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 0 },
    selectedPath: "heaven",
  }));

  useTechniqueStore.getState().hydrateFromSave({
    selectedLoadoutId: "loadout_1",
    loadouts: [
      {
        id: "loadout_1",
        name: "Loadout 1",
        aiProfile: "balanced",
        castingPolicy: "balanced",
        slots: {
          active: [
            "tech_heaven_starfire_bolt",
            "",
            "tech_earth_world_pillar_slam",
          ],
          passive: ["tech_heaven_astral_focus"],
          ultimate: "tech_martial_ninefold_sword_rain",
        },
      },
    ],
  });

  useTechCollectionStore.getState().hardReset();
  const collection = useTechCollectionStore.getState();
  collection.unlockTech("tech_heaven_starfire_bolt");
  collection.unlockTech("tech_heaven_astral_focus");
  collection.unlockTech("tech_earth_world_pillar_slam");
  collection.unlockTech("tech_martial_ninefold_sword_rain");

  const context = buildTechniqueFoundationContext();

  assert.equal(context.doctrine.path, "heaven");
  assert.equal(context.loadout.loadoutId, "loadout_1");
  assert.deepEqual(context.alignmentSummary, { strong: 1, neutral: 1, off: 2 });
  assert.deepEqual(
    context.parkedLockedTechniques.map((entry) => [
      entry.slotType,
      entry.slotIndex,
      entry.techId,
    ]),
    [
      ["active", 2, "tech_earth_world_pillar_slam"],
      ["ultimate", 0, "tech_martial_ninefold_sword_rain"],
    ],
  );
});
