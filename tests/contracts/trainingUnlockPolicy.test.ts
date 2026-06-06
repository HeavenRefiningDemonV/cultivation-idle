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
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  resolveTrainingOffline,
  resolveTrainingTick,
  resolveTrainingUnlockPolicy,
  type TrainingRuntimeContent,
} from '../../src/systems/training/index.js';
import type { PathId } from '../../src/content/types.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const EXPECTED_STAT_ORDER: Record<PathId, string[]> = {
  heaven: ['qi_control', 'dao_resonance', 'divine_sense', 'law_weaving', 'tribulation_insight', 'star_rhythm'],
  earth: ['body_tempering', 'meridian_fortitude', 'rooted_guard', 'blood_essence', 'armor_harmony', 'recovery_depth'],
  martial: ['weapon_intent', 'battle_rhythm', 'flow_step', 'precision', 'counter_sense', 'killing_momentum'],
};

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

let rawContent: LoadedContentRaw;
let trainingContent: TrainingRuntimeContent;

test.before(async () => {
  rawContent = await loadRuntimeRawContent();
  trainingContent = createTrainingRuntimeContent(validateLoadedContent(rawContent));
});

test('training unlock policy opens one path stat per realm and keeps future stats separate', () => {
  (Object.keys(EXPECTED_STAT_ORDER) as PathId[]).forEach((pathId) => {
    for (let realmIndex = 0; realmIndex <= 5; realmIndex += 1) {
      const expectedLive = EXPECTED_STAT_ORDER[pathId].slice(0, realmIndex + 1);
      const expectedFuture = EXPECTED_STAT_ORDER[pathId].slice(realmIndex + 1);
      const policy = resolveTrainingUnlockPolicy({
        content: trainingContent,
        path: pathId,
        realmIndex,
      });

      assert.deepEqual(policy.unlockedStatIds, expectedLive, `${pathId} realm ${realmIndex} live stats`);
      assert.deepEqual(policy.futureStats.map((row) => row.statId), expectedFuture, `${pathId} realm ${realmIndex} future stats`);
      assert.equal(policy.availableRegimens.length, expectedLive.length, `${pathId} realm ${realmIndex} available regimen count`);
      assert.deepEqual(
        policy.availableRegimens.map((regimen) => regimen.primaryStatId),
        expectedLive,
        `${pathId} realm ${realmIndex} available regimen primary stats`,
      );
      assert.deepEqual(
        policy.lockedRegimens.map((entry) => entry.regimen.primaryStatId),
        expectedFuture,
        `${pathId} realm ${realmIndex} locked regimen primary stats`,
      );
      assert.equal(policy.nextUnlock?.statId ?? null, expectedFuture[0] ?? null);
      assert.equal(policy.nextUnlock?.realmIndex ?? null, realmIndex < 5 ? realmIndex + 1 : null);
    }
  });
});

test('content validation rejects all training regimens authored at realm zero', () => {
  const invalidRaw = structuredClone(rawContent);
  invalidRaw.training_regimens.regimens = invalidRaw.training_regimens.regimens.map((regimen) => ({
    ...regimen,
    unlockRealmIndex: 0,
  }));

  assert.throws(
    () => validateLoadedContent(invalidRaw),
    /training_regimens\.json.*unlockRealmIndex.*all.*0/i,
  );
});

test('locked training regimens cannot tick online or offline', () => {
  const state = createDefaultTrainingSaveState();
  const online = resolveTrainingTick({
    state,
    content: trainingContent,
    regimenId: 'cloud_seal_weaving',
    intensityId: 'steady',
    elapsedMs: 60_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 1,
  });

  assert.equal(online.ok, false);
  assert.equal(online.reason, 'regimen_locked');
  assert.deepEqual(online.nextState, state);

  const activeState = createDefaultTrainingSaveState();
  activeState.activeRegimenId = 'cloud_seal_weaving';
  activeState.activeIntensityId = 'steady';
  const offline = resolveTrainingOffline({
    state: activeState,
    content: trainingContent,
    activeActivityType: 'path_training',
    elapsedMs: 120_000,
    realmIndex: 0,
    substageIndex: 0,
    selectedPath: 'heaven',
    offlineEfficiency: 0.5,
  });

  assert.equal(offline.appliedMs, 0);
  assert.equal(offline.blockedReason, 'regimen_locked');
});
