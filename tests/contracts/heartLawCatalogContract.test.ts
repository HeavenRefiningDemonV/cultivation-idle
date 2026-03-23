import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildHeartLawCatalogFromDefinitions,
  getHeartLawChapterThresholds,
} from '../../src/systems/doctrine/index.js';
import type { HeartLawsConfig } from '../../src/content/index.js';

const HEART_LAWS_PATH = path.resolve(
  process.cwd(),
  'public',
  'cultivation_idle_content_bible_v1_config',
  'heart_laws.json',
);

const EXPECTED_FAMILIES = {
  heart_quiet_breath_method: 'circulation',
  heart_stone_root_tempering: 'stability',
  heart_ember_thread_sutra: 'burst',
  heart_river_mirror_art: 'endurance',
  heart_verdant_pulse_canon: 'endurance',
  heart_iron_intent_scripture: 'burst',
  heart_heaven_flame_manual: 'burst',
  heart_black_tortoise_codex: 'stability',
  heart_sword_river_heart_law: 'insight',
  heart_stormstep_diagram: 'burst',
  heart_soul_lantern_sutra: 'insight',
  heart_bloodseal_scripture: 'burst',
  heart_void_palm_record: 'burst',
  heart_moment_thread_chronicle: 'insight',
  heart_nine_heavens_scripture: 'breakthrough',
  heart_earth_dragon_spine_manual: 'breakthrough',
  heart_star_core_refinement_law: 'circulation',
  heart_unbroken_will_method: 'stability',
} as const;

async function readHeartLawsConfig(): Promise<HeartLawsConfig> {
  return JSON.parse(await fs.readFile(HEART_LAWS_PATH, 'utf8')) as HeartLawsConfig;
}

test('every live Heart Law resolves to an explicit family', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  assert.deepEqual(Object.keys(catalog), Object.keys(EXPECTED_FAMILIES));
  assert.deepEqual(
    Object.fromEntries(Object.entries(catalog).map(([id, profile]) => [id, profile.family])),
    EXPECTED_FAMILIES,
  );
});

test('every profile exposes the semester chapter thresholds through the builder path', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  Object.values(catalog).forEach((profile) => {
    assert.deepEqual(profile.chapterThresholds, [0, 100, 200, 300, 400]);
    assert.deepEqual(profile.chapterThresholds, getHeartLawChapterThresholds());
  });
});


test('normalized catalog preserves the validated affinity rules on every profile', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  Object.values(catalog).forEach((profile) => {
    assert.deepEqual(profile.affinityRules, {
      matchBonusByTier: {
        starter: 0.1,
        tier1: 0.14,
        tier2: 0.18,
        tier3: 0.22,
      },
      mismatchPenalty: 0.05,
      appliesTo: 'signatureOnly',
    });
    assert.notEqual(profile.affinityRules, config.affinityRules);
    assert.notEqual(profile.affinityRules.matchBonusByTier, config.affinityRules?.matchBonusByTier);
  });
});

test('signature and chapter duplication is preserved in normalized effects', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  const quietBreathCultivateEntries = catalog.heart_quiet_breath_method.normalizedEffects.filter(
    (effect) => effect.normalizedKey === 'cultivateQiMult',
  );
  assert.equal(quietBreathCultivateEntries.length, 2);
  assert.deepEqual(quietBreathCultivateEntries.map((effect) => effect.source), ['signature', 'chapter:1']);

  const heavenFlameCultivateEntries = catalog.heart_heaven_flame_manual.normalizedEffects.filter(
    (effect) => effect.normalizedKey === 'cultivateQiMult',
  );
  assert.equal(heavenFlameCultivateEntries.length, 2);
  assert.deepEqual(heavenFlameCultivateEntries.map((effect) => effect.source), ['signature', 'chapter:1']);

  const nineHeavensCultivateEntries = catalog.heart_nine_heavens_scripture.normalizedEffects.filter(
    (effect) => effect.normalizedKey === 'cultivateQiMult',
  );
  assert.equal(nineHeavensCultivateEntries.length, 2);
  assert.deepEqual(nineHeavensCultivateEntries.map((effect) => effect.source), ['signature', 'chapter:1']);
});

test('current non-live affinity tokens are preserved honestly', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  assert.deepEqual(catalog.heart_heaven_flame_manual.spiritRootAffinities, ['fire', 'lightning']);
  assert.deepEqual(catalog.heart_heaven_flame_manual.liveSpiritRootAffinities, ['fire']);

  assert.deepEqual(catalog.heart_soul_lantern_sutra.spiritRootAffinities, ['soul', 'water']);
  assert.deepEqual(catalog.heart_soul_lantern_sutra.liveSpiritRootAffinities, ['water']);

  assert.deepEqual(catalog.heart_star_core_refinement_law.spiritRootAffinities, ['astral', 'void']);
  assert.deepEqual(catalog.heart_star_core_refinement_law.liveSpiritRootAffinities, []);

  assert.deepEqual(catalog.heart_quiet_breath_method.spiritRootAffinities, ['any']);
  assert.deepEqual(catalog.heart_quiet_breath_method.liveSpiritRootAffinities, []);
});

test('object readers flatten deterministic normalized keys from authored laws', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  const emberKeys = new Set(catalog.heart_ember_thread_sutra.normalizedEffects.map((effect) => effect.normalizedKey));
  [
    'cultivationCharge.resourceId',
    'cultivationCharge.gainPerCultivateMinute',
    'cultivationCharge.cap',
    'combatOpenerBuff.durationSec',
    'combatOpenerBuff.atkMultPer10Charge',
    'combatOpenerBuff.burnChanceAdd',
  ].forEach((key) => assert.equal(emberKeys.has(key), true));

  const lanternKeys = new Set(catalog.heart_soul_lantern_sutra.normalizedEffects.map((effect) => effect.normalizedKey));
  ['bossKillLantern.resourceId', 'bossKillLantern.gainPerBossKill', 'bossKillLantern.cap'].forEach((key) => {
    assert.equal(lanternKeys.has(key), true);
  });

  const voidKeys = new Set(catalog.heart_void_palm_record.normalizedEffects.map((effect) => effect.normalizedKey));
  ['voidWindow.everySec', 'voidWindow.durationSec', 'voidWindow.ignoreDefPct'].forEach((key) => {
    assert.equal(voidKeys.has(key), true);
  });

  const swordRiverKeys = new Set(catalog.heart_sword_river_heart_law.normalizedEffects.map((effect) => effect.normalizedKey));
  assert.equal(swordRiverKeys.has('ruinsFragmentGainMult.cap'), true);

  const earthDragonKeys = new Set(catalog.heart_earth_dragon_spine_manual.normalizedEffects.map((effect) => effect.normalizedKey));
  assert.equal(earthDragonKeys.has('artifactShardGainMult.cap'), true);
});

test('no live Heart Law profile is empty and every profile exposes chapters 1 through 5', async () => {
  const config = await readHeartLawsConfig();
  const catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);

  Object.values(catalog).forEach((profile) => {
    assert.ok(profile.family);
    assert.ok(profile.normalizedEffects.length > 0);
    assert.deepEqual(Object.keys(profile.chapterEffectsByChapter), ['1', '2', '3', '4', '5']);
  });
});
