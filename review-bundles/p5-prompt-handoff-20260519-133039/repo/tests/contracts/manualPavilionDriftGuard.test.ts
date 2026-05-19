import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

test("packet 4.9 manualSatchelStore no longer contains placeholder duration or local fragment fallback math", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "src/stores/manualSatchelStore.ts"),
    "utf8",
  );

  assert.equal(source.includes("getStudyDurationByGrade"), true);
  assert.equal(source.includes("getDuplicateFragmentValue"), true);
  assert.equal(source.includes("mortal: 1_000"), false);
  assert.equal(source.includes("earth: 1_000"), false);
  assert.equal(source.includes("heaven: 1_000"), false);
  assert.equal(source.includes("mystic: 1_000"), false);
  assert.equal(source.includes("getFragmentConfig("), false);
  assert.equal(source.includes("DEFAULT_RARITY_FRAGMENT_VALUES"), false);
  assert.equal(source.includes("DEFAULT_GRADE_FRAGMENT_MULTIPLIER"), false);
});

test("packet 4.9 manualPavilionStore no longer contains ad hoc duplicate fragment math", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "src/stores/manualPavilionStore.ts"),
    "utf8",
  );

  assert.equal(source.includes("isDuplicateManualOffer"), true);
  assert.equal(source.includes("getDuplicateFragmentValue"), true);
  assert.equal(source.includes("rarityFragmentValue"), false);
  assert.equal(source.includes("gradeFragmentMultiplier"), false);
  assert.equal(source.includes("determineDuplicate("), false);
});

test("packet 4.9 pavilionStockGenerator now contains the correction pass and generation context", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "src/features/manuals/pavilionStockGenerator.ts"),
    "utf8",
  );

  assert.equal(source.includes("applyPavilionCorrectionPass"), true);
  assert.equal(source.includes("context?: PavilionGenerationContext"), true);
  assert.equal(source.includes("getVisibleSlotCount"), true);
});

test("packet 4.9 ManualPavilionPanel now uses packet-4.9 offer analysis", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "src/components/screens/ManualPavilionPanel.tsx"),
    "utf8",
  );

  assert.equal(source.includes("analyzeManualOffer"), true);
  assert.equal(source.includes("getStudyDurationLabelByGrade"), true);
  assert.equal(source.includes("offerAnalysisBySlotIndex"), true);
  assert.equal(source.includes("selectedOfferAnalysis"), true);
});

test("packet 4.9 ManualDetailModal now exposes packet-4.9 analysis copy", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "src/components/modals/ManualDetailModal.tsx"),
    "utf8",
  );

  assert.equal(source.includes("offerAnalysis"), true);
  assert.equal(source.includes("Study time:"), true);
  assert.equal(
    source.includes("Build fix: fills a current gap or empty unlocked slot."),
    true,
  );
  assert.equal(source.includes("Duplicate conversion: +"), true);
});
