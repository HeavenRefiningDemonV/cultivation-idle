import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
  type ValidatedContent,
} from '../../src/content/index.js';
import { cultivationService } from '../../src/services/cultivationService.js';
import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { SimulationScheduler } from '../../src/services/time/SimulationScheduler.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTrainingStore } from '../../src/stores/trainingStore.js';
import { registerSimulationSchedulerJobs } from '../../src/systems/gameLoop.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const TEN_MINUTES_MS = 600_000;
const HEART_LAW_ID = 'heart_quiet_breath_method';
const TRAINING_REGIMEN_ID = 'still_star_breathing';

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

function primeContentStore(content: ValidatedContent): void {
  useContentStore.setState((state) => ({
    ...state,
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...state.maps,
      itemsById: Object.fromEntries(content.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(content.trials.map((trial) => [trial.id, trial])),
      heartLawsById: Object.fromEntries(content.heart_laws.map((law) => [law.id, law])),
    },
  }));
}

function resetRuntime(content: ValidatedContent): void {
  useGameStore.getState().hardResetGameState();
  useActivityStore.getState().hardResetActivity();
  useTrainingStore.getState().hardResetTraining();
  useCultivationStore.getState().resetForNewLife();
  primeContentStore(content);
  useGameStore.setState({
    selectedPath: 'heaven',
    realm: { index: 0, substage: 1, name: 'Qi Condensation' },
    qi: '0',
    qiPerSecond: '1',
    lastActiveTime: 1_000,
    lastTickTime: 1_000,
  });
  useCultivationStore.setState({
    selectedHeartLawId: HEART_LAW_ID,
    unlockedHeartLawIds: [HEART_LAW_ID],
    breathMode: 'balanced',
    heartLawLevelById: { [HEART_LAW_ID]: 1 },
    heartLawXpById: { [HEART_LAW_ID]: 0 },
    verseMasteryByLawId: {},
    daoHeartClarity: 0,
    turbulence: 0,
    rootResonanceByPair: {},
    activeDaoHeartPracticeId: null,
    lastDaoHeartPracticeTickAt: null,
  });
}

function trainingScore(): number {
  const state = useTrainingStore.getState();
  const statXp = Object.values(state.statXpById).reduce((total, value) => total + value, 0);
  const ratings = Object.values(state.statRatingsById).reduce((total, value) => total + value, 0);
  const mastery = Object.values(state.regimenMasteryXpById).reduce((total, value) => total + value, 0);
  return statXp + ratings + mastery + state.fatigue;
}

function daoHeartScore(): number {
  const state = useCultivationStore.getState();
  const xp = state.heartLawXpById[HEART_LAW_ID] ?? 0;
  const level = state.heartLawLevelById[HEART_LAW_ID] ?? 1;
  const verse = state.verseMasteryByLawId[HEART_LAW_ID] ?? 0;
  const resonance = Object.values(state.rootResonanceByPair).reduce((total, value) => total + value, 0);
  return xp + level + verse + resonance + state.daoHeartClarity + state.turbulence;
}

function simulateAuthoritativeOnline(elapsedMs: number): void {
  const scheduler = new SimulationScheduler({ autoStartHost: false });
  registerSimulationSchedulerJobs(scheduler, {
    gameTick: (stepMs) => useGameStore.getState().tick(stepMs),
    cultivationTick: (stepMs) => cultivationService.tick(stepMs),
    trainingTick: (stepMs) => {
      useTrainingStore.getState().tickTraining(stepMs);
    },
    combatTick: () => {},
    queueTick: () => {},
    progressionDiagnosticsTick: () => {},
    autosaveTick: () => true,
    nowWall: () => Date.now(),
    isCombatActivityActive: () => {
      const active = useActivityStore.getState().active;
      return active?.type === 'outskirts' || active?.type === 'trial' || active?.type === 'ruins';
    },
  });
  scheduler.start();
  scheduler.drain(0, 'test');
  for (let now = 250; now <= elapsedMs; now += 250) {
    scheduler.drain(now, 'test');
  }
  useGameStore.getState().flushCultivationAccumulation('foreground-growth-contract');
}

let content: ValidatedContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
});

test.beforeEach(() => {
  resetRuntime(content);
});

test('mp1 online Path Training advances training for 10 minutes and grants zero full Qi', () => {
  const started = useTrainingStore.getState().startTraining(TRAINING_REGIMEN_ID, 'steady', { now: 1_000 });
  assert.equal(started.ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'path_training');

  simulateAuthoritativeOnline(TEN_MINUTES_MS);

  assert.equal(useGameStore.getState().qi, '0');
  assert.equal(trainingScore() > 0, true);
  assert.equal(daoHeartScore(), 1);
});

test('mp1 online Dao Heart practice advances only while Dao Heart is active and grants zero full Qi', () => {
  const started = useCultivationStore.getState().startDaoHeartPractice('verse_recitation', { now: 1_000 });
  assert.equal(started.ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'dao_heart_practice');
  const trainingBefore = trainingScore();

  simulateAuthoritativeOnline(TEN_MINUTES_MS);

  assert.equal(useGameStore.getState().qi, '0');
  assert.equal(daoHeartScore() > 1, true);
  assert.equal(trainingScore(), trainingBefore);
});

test('mp1 stale activeDaoHeartPracticeId does not tick Dao Heart after foreground switches to Training', () => {
  assert.equal(useCultivationStore.getState().startDaoHeartPractice('verse_recitation', { now: 1_000 }).ok, true);
  const xpBeforeSwitch = useCultivationStore.getState().heartLawXpById[HEART_LAW_ID] ?? 0;
  assert.equal(useTrainingStore.getState().startTraining(TRAINING_REGIMEN_ID, 'steady', { now: 2_000 }).ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'path_training');
  assert.equal(useCultivationStore.getState().activeDaoHeartPracticeId, 'verse_recitation');

  simulateAuthoritativeOnline(TEN_MINUTES_MS);

  assert.equal(useGameStore.getState().qi, '0');
  assert.equal(useCultivationStore.getState().heartLawXpById[HEART_LAW_ID] ?? 0, xpBeforeSwitch);
  assert.equal(trainingScore() > 0, true);
});

test('mp1 cultivation foreground grants Qi and does not grant Training or Dao Heart primary progress', () => {
  const trainingBefore = trainingScore();
  const daoBefore = daoHeartScore();

  simulateAuthoritativeOnline(TEN_MINUTES_MS);

  assert.equal(Number(useGameStore.getState().qi) > 0, true);
  assert.equal(trainingScore(), trainingBefore);
  assert.equal(daoHeartScore(), daoBefore);
});

test('mp1 combat foreground blocks full Qi, Training, and Dao Heart primary growth online', () => {
  assert.equal(useTrainingStore.getState().startTraining(TRAINING_REGIMEN_ID, 'steady', { now: 1_000 }).ok, true);
  const trainingBefore = trainingScore();
  useActivityStore.getState().startActivity('trial', { sourceId: 'trial_novices_clearing' }, 'test:combat');
  const daoBefore = daoHeartScore();

  simulateAuthoritativeOnline(TEN_MINUTES_MS);

  assert.equal(useGameStore.getState().qi, '0');
  assert.equal(trainingScore(), trainingBefore);
  assert.equal(daoHeartScore(), daoBefore);
});

test('mp1 offline Path Training resolves one foreground focus without Qi or Dao Heart primary gains', () => {
  assert.equal(useTrainingStore.getState().startTraining(TRAINING_REGIMEN_ID, 'steady', { now: 10_000 }).ok, true);

  const result = applyOfflineCatchup({
    lastActiveAtMs: 10_000,
    now: 10_000 + TEN_MINUTES_MS,
    dtMs: TEN_MINUTES_MS,
    rawMs: TEN_MINUTES_MS,
    wasCapped: false,
    wasMeditating: false,
  });

  assert.equal(result.summary?.foregroundFocus?.mode, 'path_training');
  assert.equal(result.surface?.foregroundFocus?.mode, 'path_training');
  assert.equal(result.summary?.parts.some((part) => part.kind === 'path_training'), true);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'qi_gained'), false);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'dao_heart'), false);
  assert.match(result.surface?.foregroundFocus?.pausedLabel ?? '', /Full cultivation was paused while Path Training was active/i);
});

test('mp1 offline Dao Heart resolves one foreground focus without Qi or Training primary gains', () => {
  assert.equal(useCultivationStore.getState().startDaoHeartPractice('verse_recitation', { now: 10_000 }).ok, true);

  const result = applyOfflineCatchup({
    lastActiveAtMs: 10_000,
    now: 10_000 + TEN_MINUTES_MS,
    dtMs: TEN_MINUTES_MS,
    rawMs: TEN_MINUTES_MS,
    wasCapped: false,
    wasMeditating: false,
  });

  assert.equal(result.summary?.foregroundFocus?.mode, 'dao_heart');
  assert.equal(result.surface?.foregroundFocus?.mode, 'dao_heart');
  assert.equal(result.summary?.parts.some((part) => part.kind === 'dao_heart'), true);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'qi_gained'), false);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'path_training'), false);
  assert.match(result.surface?.foregroundFocus?.pausedLabel ?? '', /Full cultivation was paused while Dao Heart practice was active/i);
});

test('mp1 offline combat reports combat excluded and no primary growth parts', () => {
  useActivityStore.getState().startActivity('trial', { sourceId: 'trial_novices_clearing' }, 'test:combat-offline');

  const result = applyOfflineCatchup({
    lastActiveAtMs: 10_000,
    now: 10_000 + TEN_MINUTES_MS,
    dtMs: TEN_MINUTES_MS,
    rawMs: TEN_MINUTES_MS,
    wasCapped: false,
    wasMeditating: false,
  });

  assert.equal(result.summary?.foregroundFocus?.mode, 'combat');
  assert.equal(result.summary?.parts.some((part) => part.kind === 'qi_gained'), false);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'path_training'), false);
  assert.equal(result.summary?.parts.some((part) => part.kind === 'dao_heart'), false);
  assert.equal(result.surface?.blockedReasons.some((reason) => reason.id === 'combat_excluded'), true);
});
