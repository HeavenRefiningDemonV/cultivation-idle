import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
} from '../../src/content/index.js';
import {
  capDampening,
  fatigueDampening,
  TRAINING_REALM_BAND_MAX,
  trainingStatCap,
  xpToNextTrainingRating,
  resolveTrainingProgressPreview,
} from '../../src/systems/training/trainingProgressionResolver.js';
import {
  heartLawXpToNextLevel,
  resolveDaoHeartPracticePreview,
  resolveHeartLawPracticeTick,
} from '../../src/systems/daoHeart/daoHeartProgressionResolver.js';
import {
  resolveHeartLawLevelPreview,
} from '../../src/systems/daoHeart/heartLawLevelResolver.js';
import {
  resolveHeartLawParityPreview,
} from '../../src/systems/daoHeart/heartLawParityResolver.js';
import {
  resolveDaoHeartTurbulencePreview,
} from '../../src/systems/daoHeart/daoHeartTurbulenceResolver.js';
import { resolveSpiritRootCombatProc } from '../../src/systems/spiritRoots/spiritRootCombatAdapter.js';
import { resolveTechniqueScalingSnapshot } from '../../src/systems/techniques/techniqueScalingResolver.js';
import { resolveBreakthroughStabilitySnapshot } from '../../src/systems/breakthrough/breakthroughStabilityResolver.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const CANONICAL_MILESTONES = [100, 260, 520, 900, 1450, 2200, 3200, 4500, 6200, 8400];

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

test('mp0 runtime manifest anchors the new Training, Dao Heart, spirit-root, and readiness content files', async () => {
  assert.equal(RUNTIME_CONTENT_FILE_BY_KEY.cultivator_stats, 'stats.json');
  assert.equal(RUNTIME_CONTENT_FILE_BY_KEY.training_regimens, 'training_regimens.json');
  assert.equal(RUNTIME_CONTENT_FILE_BY_KEY.dao_heart_practices, 'dao_heart_practices.json');
  assert.equal(RUNTIME_CONTENT_FILE_BY_KEY.spirit_roots, 'spirit_roots.json');
  assert.equal(RUNTIME_CONTENT_FILE_BY_KEY.readiness_categories, 'readiness_categories.json');

  const raw = await loadRuntimeRawContent();
  const content = validateLoadedContent(raw);

  assert.equal(content.cultivator_stats.stats.length, 28);
  assert.equal(content.training_regimens.regimens.length, 18);
  assert.equal(content.dao_heart_practices.practices.length, 6);
  assert.equal(content.spirit_roots.roots.length, 14);
  assert.equal(content.readiness_categories.categories.length, 7);
});

test('mp0 stat and regimen content keeps canonical ids, path counts, and the single armor_harmony definition', async () => {
  const content = validateLoadedContent(await loadRuntimeRawContent());
  const statIds = content.cultivator_stats.stats.map((entry) => entry.id);

  assert.equal(statIds.filter((id) => id === 'armor_harmony').length, 1);
  assert.equal(content.cultivator_stats.stats.find((entry) => entry.id === 'armor_harmony')?.category, 'path');
  assert.deepEqual(content.training_regimens.masteryMilestones, CANONICAL_MILESTONES);

  const regimenCounts = content.training_regimens.regimens.reduce<Record<string, number>>((acc, regimen) => {
    acc[regimen.path] = (acc[regimen.path] ?? 0) + 1;
    assert.deepEqual(regimen.masteryMilestones, CANONICAL_MILESTONES);
    return acc;
  }, {});
  assert.deepEqual(regimenCounts, { earth: 6, heaven: 6, martial: 6 });
});

test('mp0 content validation rejects missing stat refs, cross-path refs, and base cost fields', async () => {
  const raw = await loadRuntimeRawContent();

  const costedTraining = structuredClone(raw) as LoadedContentRaw;
  Object.assign((costedTraining.training_regimens.regimens[0] as unknown as Record<string, unknown>), { goldCost: 1 });
  assert.throws(
    () => validateLoadedContent(costedTraining),
    /Training regimen still_star_breathing declares forbidden base cost field: goldCost/,
  );

  const missingStat = structuredClone(raw) as LoadedContentRaw;
  missingStat.training_regimens.regimens[0].primaryStatId = 'missing_stat';
  assert.throws(
    () => validateLoadedContent(missingStat),
    /Training regimen still_star_breathing references missing stat missing_stat/,
  );

  const crossPathStat = structuredClone(raw) as LoadedContentRaw;
  crossPathStat.training_regimens.regimens[0].primaryStatId = 'body_tempering';
  assert.throws(
    () => validateLoadedContent(crossPathStat),
    /Training regimen still_star_breathing references earth stat body_tempering from heaven/,
  );

  const costedDaoHeart = structuredClone(raw) as LoadedContentRaw;
  Object.assign((costedDaoHeart.dao_heart_practices.practices[0] as unknown as Record<string, unknown>), { requiredItems: { herb: 1 } });
  assert.throws(
    () => validateLoadedContent(costedDaoHeart),
    /Dao Heart practice silent_sitting declares forbidden base cost field: requiredItems/,
  );
});

test('mp3 heart-law formulas expose level caps, tier pressure, and overlevel inefficiency', () => {
  assert.deepEqual(TRAINING_REALM_BAND_MAX, [40, 60, 80, 100, 125, 150]);
  assert.equal(xpToNextTrainingRating(0), 8);
  assert.equal(xpToNextTrainingRating(10), 23);
  assert.equal(trainingStatCap({ realmIndex: 0, substageIndex: 0 }), 16);
  assert.equal(trainingStatCap({ realmIndex: 1, substageIndex: 4 }), 48);
  assert.equal(trainingStatCap({ realmIndex: 5, substageIndex: 9, prestigeFloor: 99 }), 150);
  assert.equal(fatigueDampening(40), 1);
  assert.equal(Number(fatigueDampening(70).toFixed(2)), 0.73);
  assert.equal(fatigueDampening(200), 0.4);
  assert.equal(capDampening({ rating: 60, cap: 60 }), 0.1);
  assert.equal(capDampening({ rating: 58, cap: 60 }), 0.35);
  assert.equal(capDampening({ rating: 55, cap: 60 }), 0.65);
  assert.equal(capDampening({ rating: 50, cap: 60 }), 1);
  assert.equal(heartLawXpToNextLevel({ level: 1, tierMultiplier: 1, chapterPressure: 1 }), 84);
  assert.equal(heartLawXpToNextLevel({ level: 10, tierMultiplier: 1.25, chapterPressure: 1.16 }), 479);

  const normal = resolveHeartLawLevelPreview({
    currentLevel: 10,
    currentXp: 470,
    gainedXp: 20,
    tier: 'tier2',
    cultivationEffectiveStage: 10,
  });
  assert.equal(normal.nextLevel, 11);
  assert.equal(normal.nextXp, 44);
  assert.equal(normal.chapterBand.id, 'chapter_2');
  assert.equal(normal.xpGainMultiplier, 1);

  const overleveled = resolveHeartLawLevelPreview({
    currentLevel: 20,
    currentXp: 0,
    gainedXp: 100,
    tier: 'tier1',
    cultivationEffectiveStage: 1,
  });
  assert.equal(overleveled.nextLevel, 20);
  assert.equal(overleveled.efficiencyLabel, 'doctrine exceeds vessel; expression inefficient.');
  assert.equal(Number(overleveled.xpGainMultiplier.toFixed(2)), 0.35);

  assert.deepEqual(resolveTrainingProgressPreview(), {
    xpGain: 0,
    ratingGain: 0,
    fatigueGain: 0,
    debug: { mode: 'stub_no_gameplay_effect' },
  });
});

test('mp3 dao-heart practices have no resource cost and apply XP, clarity, verse, and turbulence rules', () => {
  const preview = resolveDaoHeartPracticePreview({
    practiceId: 'verse_recitation',
    elapsedMs: 60_000,
    currentLevel: 10,
    tier: 'tier1',
    cultivationEffectiveStage: 10,
    clarity: 45,
    turbulence: 20,
  });

  assert.equal(preview.resourceDeltas.length, 0);
  assert.equal(preview.heartLawXpGain > 0, true);
  assert.equal(preview.clarityGain > 0, true);
  assert.equal(preview.verseMasteryGain > 0, true);
  assert.equal(preview.turbulenceGain >= 0, true);

  const debated = resolveHeartLawPracticeTick({
    practiceId: 'inner_demon_debate',
    elapsedMs: 60_000,
    currentLevel: 8,
    currentXp: 0,
    tier: 'starter',
    cultivationEffectiveStage: 12,
    clarity: 25,
    turbulence: 40,
  });
  assert.equal(debated.ok, false);
  assert.equal(debated.reason, 'heart_law_lag_too_high');
});

test('mp3 parity and turbulence resolvers produce risk cause rows and confirmation states', () => {
  assert.deepEqual(resolveHeartLawParityPreview({ heartLawStage: 12, cultivationEffectiveStage: 12 }), {
    parity: 0,
    riskDelta: -10,
    mismatchHardLock: false,
    confirmationRequired: false,
    innerDemonDebateAvailable: true,
    label: 'Heart Law matches vessel',
  });
  assert.deepEqual(resolveHeartLawParityPreview({ heartLawStage: 8, cultivationEffectiveStage: 11 }), {
    parity: -3,
    riskDelta: 18,
    mismatchHardLock: false,
    confirmationRequired: false,
    innerDemonDebateAvailable: false,
    label: 'Heart Law lags behind vessel',
  });
  assert.equal(resolveHeartLawParityPreview({ heartLawStage: 7, cultivationEffectiveStage: 12 }).confirmationRequired, true);

  assert.deepEqual(resolveDaoHeartTurbulencePreview({ turbulence: 70 }), {
    band: 'disturbed',
    riskDelta: 9,
    heartLawXpMultiplier: 1,
    verseMasteryMultiplier: 0.9,
    breakthroughBlocked: false,
  });
  assert.equal(resolveDaoHeartTurbulencePreview({ turbulence: 90 }).breakthroughBlocked, true);
});

test('mp3 breakthrough risk rows are concrete, routed, and bounded by transition risk', () => {
  const snapshot = resolveBreakthroughStabilitySnapshot({
    fromRealmIndex: 1,
    toRealmIndex: 2,
    currentQi: '105',
    requiredQi: '100',
    heartLawStage: 5,
    cultivationEffectiveStage: 8,
    clarity: 38,
    turbulence: 72,
    gateResolution: 'bypassed',
    rootResonance: 'mismatch',
  });

  assert.equal(snapshot.minRisk, 2);
  assert.equal(snapshot.maxRisk, 50);
  assert.equal(snapshot.riskPercent, 47);
  assert.equal(snapshot.band, 'dangerous');
  assert.ok(snapshot.rows.some((row) => row.id === 'heart_law_parity' && row.route?.target === 'daoHeart'));
  assert.ok(snapshot.rows.some((row) => row.id === 'dao_heart_turbulence' && row.sourceSystem === 'daoHeart'));
  assert.ok(snapshot.rows.some((row) => row.id === 'gate_confidence' && row.value === -3));
  assert.equal(snapshot.topFixes.length > 0, true);
  assert.match(snapshot.failureOutcomePreview, /18% Qi loss/);
  const rootProc = resolveSpiritRootCombatProc();
  assert.equal(rootProc.didProc, false);
  assert.equal(rootProc.effectId, null);
  assert.equal(rootProc.modifiers.damageMult, 1);

  const scaling = resolveTechniqueScalingSnapshot();
  assert.equal(scaling.totalMultiplier, 1);
  assert.equal(scaling.cappedBonusPct, 0);
  assert.equal(scaling.combatEffectActive, false);
  assert.equal(scaling.debug.mode, 'inactive_missing_metadata');
});

test('mp0 scaffold modules do not bypass RewardService, CombatStore, or Heart Law ownership', async () => {
  const checkedFiles = [
    // F1 SA-A3: the two cultivatorStats dead stubs (statProgressionResolver /
    // statEffectResolver) were removed as confirmed zero-caller dead code — their absence
    // is a stronger guarantee than this inertness guard, so they are dropped from the list.
    'src/systems/training/trainingProgressionResolver.ts',
    'src/systems/training/trainingFatigueResolver.ts',
    'src/systems/training/trainingOfflineAdapter.ts',
    'src/systems/training/trainingPrestigeMemory.ts',
    'src/systems/daoHeart/daoHeartProgressionResolver.ts',
    'src/systems/daoHeart/heartLawLevelResolver.ts',
    'src/systems/daoHeart/daoHeartTurbulenceResolver.ts',
    'src/systems/daoHeart/heartLawParityResolver.ts',
    'src/systems/spiritRoots/spiritRootCombatAdapter.ts',
    'src/systems/techniques/techniqueScalingResolver.ts',
    'src/systems/breakthrough/breakthroughStabilityResolver.ts',
  ];

  const source = (
    await Promise.all(checkedFiles.map((file) => fs.readFile(path.resolve(process.cwd(), file), 'utf8')))
  ).join('\n');

  assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency|useCombatStore|CombatStore|startCombat|markCleared|recordFailure/);
  assert.doesNotMatch(source, /useCultivationStore|selectedHeartLawId|create<|create\(/);
});
