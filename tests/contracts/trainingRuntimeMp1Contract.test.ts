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
  TRAINING_BASE_REALM_XP,
  TRAINING_OUTPUT_WEIGHTS,
  capDampening,
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  fatigueDampening,
  resolveTrainingOffline,
  resolveTrainingTick,
  sanitizeTrainingSaveState,
  trainingStatCap,
  xpToNextTrainingRating,
} from '../../src/systems/training/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

function approx(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test('mp1 training constants match numeric lockdown', () => {
  assert.deepEqual(TRAINING_BASE_REALM_XP, [12, 18, 27, 40, 60, 90]);
  assert.deepEqual(TRAINING_OUTPUT_WEIGHTS, {
    primaryStat: 1,
    secondaryStat: 0.45,
    foundationStat: 0.12,
    regimenMastery: 0.33,
    cappedPrimaryMastery: 0.5,
  });
  assert.equal(xpToNextTrainingRating(0), 8);
  assert.equal(xpToNextTrainingRating(10), 23);
  assert.equal(trainingStatCap({ realmIndex: 0, substageIndex: 0 }), 16);
  assert.equal(trainingStatCap({ realmIndex: 1, substageIndex: 4 }), 48);
  assert.equal(trainingStatCap({ realmIndex: 5, substageIndex: 9, prestigeFloor: 99 }), 150);
  assert.equal(fatigueDampening(40), 1);
  assert.equal(Number(fatigueDampening(70).toFixed(2)), 0.73);
  assert.equal(fatigueDampening(200), 0.4);
  assert.equal(capDampening({ rating: 60, cap: 60 }), 0.1);
});

test('mp1 tick grants weighted stat xp, mastery xp, rating steps, and fatigue without resources', async () => {
  const content = createTrainingRuntimeContent(validateLoadedContent(await loadRuntimeRawContent()));
  const state = createDefaultTrainingSaveState();

  const result = resolveTrainingTick({
    state,
    content,
    regimenId: 'still_star_breathing',
    intensityId: 'steady',
    elapsedMs: 60_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(result.resourceDeltas.length, 0);

  const baseXp = 12 * 0.98;
  approx(result.statXpGainedById.qi_control, baseXp);
  approx(result.statXpGainedById.mind_clarity, baseXp * 0.45);
  approx(result.statXpGainedById.qi_purity, baseXp * 0.12);
  approx(result.masteryXpGainedByRegimenId.still_star_breathing, baseXp * 0.33);
  approx(result.fatigueGained, 0.14);

  assert.equal(result.nextState.statRatingsById.qi_control, 1);
  approx(result.nextState.statXpById.qi_control, baseXp - xpToNextTrainingRating(0));
  approx(result.nextState.statXpById.mind_clarity, baseXp * 0.45);
  approx(result.nextState.statXpById.qi_purity, baseXp * 0.12);
});

test('mp1 capped primary stat stops direct stat power and routes only dampened overflow to mastery', async () => {
  const content = createTrainingRuntimeContent(validateLoadedContent(await loadRuntimeRawContent()));
  const state = createDefaultTrainingSaveState();
  state.statRatingsById.qi_control = 16;
  state.activeRegimenId = 'still_star_breathing';
  state.activeIntensityId = 'steady';

  const result = resolveTrainingTick({
    state,
    content,
    regimenId: 'still_star_breathing',
    intensityId: 'steady',
    elapsedMs: 60_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 1,
  });

  const baseXp = 12 * 0.98;
  assert.equal(result.ok, true);
  assert.equal(result.nextState.statRatingsById.qi_control, 16);
  assert.equal(result.nextState.statXpById.qi_control ?? 0, 0);
  approx(result.statXpGainedById.qi_control ?? 0, 0);
  approx(result.masteryXpGainedByRegimenId.still_star_breathing, baseXp * 0.1 * 0.5);
});

test('mp1 offline resolver applies only active path training and excludes combat activity', async () => {
  const content = createTrainingRuntimeContent(validateLoadedContent(await loadRuntimeRawContent()));
  const state = createDefaultTrainingSaveState();
  state.activeRegimenId = 'still_star_breathing';
  state.activeIntensityId = 'steady';

  const trained = resolveTrainingOffline({
    state,
    content,
    activeActivityType: 'path_training',
    elapsedMs: 120_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 0.5,
  });

  assert.equal(trained.appliedMs, 120_000);
  approx(trained.totalStatXpGainedById.qi_control, 12 * 0.98);
  approx(trained.totalFatigueGained, 0.28);

  const blocked = resolveTrainingOffline({
    state,
    content,
    activeActivityType: 'trial',
    elapsedMs: 120_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 0.5,
  });

  assert.equal(blocked.appliedMs, 0);
  assert.equal(blocked.blockedReason, 'combat_activity_active');
  assert.deepEqual(blocked.nextState, state);
});

test('mp1 training save sanitizer backfills defaults and drops malformed active training', async () => {
  const content = createTrainingRuntimeContent(validateLoadedContent(await loadRuntimeRawContent()));
  const sanitized = sanitizeTrainingSaveState({
    schemaVersion: -1,
    statRatingsById: { qi_control: 3.7, missing_stat: 99, mind_clarity: Number.POSITIVE_INFINITY },
    statXpById: { qi_control: 4.5, missing_stat: 100 },
    regimenMasteryXpById: { still_star_breathing: 12.25, missing_regimen: 50 },
    fatigue: 144,
    activeRegimenId: 'missing_regimen',
    activeIntensityId: 'missing_intensity',
    lastTickAt: 'bad',
  }, content);

  assert.equal(sanitized.schemaVersion, 1);
  assert.deepEqual(sanitized.statRatingsById, { qi_control: 3 });
  assert.deepEqual(sanitized.statXpById, { qi_control: 4.5 });
  assert.deepEqual(sanitized.regimenMasteryXpById, { still_star_breathing: 12.25 });
  assert.equal(sanitized.fatigue, 100);
  assert.equal(sanitized.activeRegimenId, null);
  assert.equal(sanitized.activeIntensityId, null);
  assert.equal(sanitized.lastTickAt, null);
});
