import assert from "node:assert/strict";
import test from "node:test";

import {
  getDuplicateFragmentValue,
  getStudyDurationByGrade,
  getStudyDurationLabelByGrade,
} from "../../src/systems/manuals/index.js";

test("packet 4.9 study durations are exact", () => {
  assert.equal(getStudyDurationByGrade("mortal"), 30_000);
  assert.equal(getStudyDurationByGrade("earth"), 90_000);
  assert.equal(getStudyDurationByGrade("heaven"), 240_000);
  assert.equal(getStudyDurationByGrade("mystic"), 600_000);
});

test("packet 4.9 study duration labels are exact", () => {
  assert.equal(getStudyDurationLabelByGrade("mortal"), "30s");
  assert.equal(getStudyDurationLabelByGrade("earth"), "1m 30s");
  assert.equal(getStudyDurationLabelByGrade("heaven"), "4m");
  assert.equal(getStudyDurationLabelByGrade("mystic"), "10m");
});

test("packet 4.9 duplicate fragment values are exact", () => {
  assert.equal(getDuplicateFragmentValue("mortal", "common"), 20);
  assert.equal(getDuplicateFragmentValue("earth", "common"), 24);
  assert.equal(getDuplicateFragmentValue("earth", "rare"), 132);
  assert.equal(getDuplicateFragmentValue("heaven", "rare"), 165);
  assert.equal(getDuplicateFragmentValue("mystic", "legendary"), 1400);
});

test("packet 4.9 study contract degrades invalid grade/rarity input safely", () => {
  assert.equal(getStudyDurationByGrade(undefined), 30_000);
  assert.equal(getStudyDurationLabelByGrade(undefined), "30s");
  assert.equal(getDuplicateFragmentValue(undefined, undefined), 20);
});
