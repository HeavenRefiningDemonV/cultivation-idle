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
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const HEART_LAW_ID = 'heart_quiet_breath_method';

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

function hydrateContent(content: ValidatedContent): void {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...useContentStore.getState().maps,
      itemsById: Object.fromEntries(content.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(content.trials.map((trial) => [trial.id, trial])),
      heartLawsById: Object.fromEntries(content.heart_laws.map((law) => [law.id, law])),
    },
  });
}

function resetRuntime(content: ValidatedContent): void {
  useGameStore.getState().hardResetGameState();
  useActivityStore.getState().hardResetActivity();
  useCultivationStore.getState().resetForNewLife();
  hydrateContent(content);
  useGameStore.setState({
    selectedPath: 'heaven',
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    qi: '0',
    qiPerSecond: '1',
  });
  useCultivationStore.setState({
    selectedHeartLawId: HEART_LAW_ID,
    unlockedHeartLawIds: [HEART_LAW_ID],
    heartLawLevelById: { [HEART_LAW_ID]: 9 },
    heartLawXpById: { [HEART_LAW_ID]: 0 },
    verseMasteryByLawId: { [HEART_LAW_ID]: 0 },
    daoHeartClarity: 50,
    turbulence: 50,
    activeDaoHeartPracticeId: null,
    lastDaoHeartPracticeTickAt: null,
  });
}

let content: ValidatedContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
});

test.beforeEach(() => {
  resetRuntime(content);
});

test('MP6 Dao Heart practice turbulence changes are owned by CultivationStore practice ticks', () => {
  assert.equal(useCultivationStore.getState().startDaoHeartPractice('silent_sitting', { now: 1_000 }).ok, true);
  const quietBefore = useCultivationStore.getState().turbulence;
  const quietTick = useCultivationStore.getState().tickDaoHeartPractice(10 * 60_000, { now: 601_000 });
  assert.equal(quietTick.ok, true);
  assert.equal(useCultivationStore.getState().turbulence < quietBefore, true);

  useCultivationStore.getState().stopDaoHeartPractice('test:reset-practice');
  useCultivationStore.setState({ turbulence: 10 });
  assert.equal(useCultivationStore.getState().startDaoHeartPractice('inner_demon_debate', { now: 602_000 }).ok, true);
  const debateBefore = useCultivationStore.getState().turbulence;
  const debateTick = useCultivationStore.getState().tickDaoHeartPractice(10 * 60_000, { now: 1_202_000 });
  assert.equal(debateTick.ok, true);
  assert.equal(useCultivationStore.getState().turbulence > debateBefore, true);
});

test('MP6 Inner Demon Debate is blocked when Heart Law lag is severe', () => {
  useCultivationStore.setState({
    heartLawLevelById: { [HEART_LAW_ID]: 1 },
    turbulence: 10,
    daoHeartClarity: 50,
  });

  const blocked = useCultivationStore.getState().startDaoHeartPractice('inner_demon_debate', { now: 1_000 });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'heart_law_lag_too_high');
  assert.equal(useActivityStore.getState().active, null);
});
