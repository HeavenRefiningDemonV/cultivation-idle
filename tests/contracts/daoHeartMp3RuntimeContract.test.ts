import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
} from '../../src/content/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { setInventoryStoreGetter, useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { mergeWithDefaults } from '../../src/save/defaultSaveState.js';

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

async function hydrateContent() {
  const content = validateLoadedContent(await loadRuntimeRawContent());
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    maps: {
      ...useContentStore.getState().maps,
      itemsById: Object.fromEntries(content.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(content.trials.map((trial) => [trial.id, trial])),
      heartLawsById: Object.fromEntries(content.heart_laws.map((law) => [law.id, law])),
    },
  });
  return content;
}

function resetRuntime() {
  useActivityStore.setState({ active: null, history: [], lastChangedAt: null });
  useCultivationStore.getState().resetForNewLife();
  useInventoryStore.getState().hardResetInventory();
  useGameStore.setState({
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    qi: '200000',
    selectedPath: 'heaven',
  });
  setInventoryStoreGetter(() => useInventoryStore.getState());
}

test('mp3 cultivation save defaults and old-save hydration include Dao Heart fields', async () => {
  await hydrateContent();
  resetRuntime();

  const merged = mergeWithDefaults({
    version: '2.1.0',
    heartLawState: {
      selectedHeartLawId: null,
      chapter: 1,
      comprehension: 0,
      unlockedHeartLawIds: [],
      breathMode: 'balanced',
      studyTechniqueId: null,
    },
  });

  assert.deepEqual(merged.heartLawState?.heartLawLevelById, {});
  assert.deepEqual(merged.heartLawState?.heartLawXpById, {});
  assert.deepEqual(merged.heartLawState?.verseMasteryByLawId, {});
  assert.equal(merged.heartLawState?.daoHeartClarity, 0);
  assert.equal(merged.heartLawState?.turbulence, 0);
  assert.equal(merged.heartLawState?.activeDaoHeartPracticeId, null);
});

test('mp3 Dao Heart practice uses ActivityStore gate and progresses offline only for allowed practices', async () => {
  await hydrateContent();
  resetRuntime();
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath_method',
    heartLawLevelById: { heart_quiet_breath_method: 1 },
    heartLawXpById: { heart_quiet_breath_method: 0 },
    daoHeartClarity: 0,
    turbulence: 0,
  });

  const started = useCultivationStore.getState().startDaoHeartPractice('verse_recitation', { now: 1_000 });
  assert.equal(started.ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'dao_heart_practice');

  applyOfflineCatchup({
    now: 61_000,
    lastActiveAtMs: 1_000,
    dtMs: 60_000,
    rawMs: 60_000,
    wasCapped: false,
    wasMeditating: false,
  });

  assert.equal((useCultivationStore.getState().heartLawXpById.heart_quiet_breath_method ?? 0) > 0, true);
  assert.ok(useCultivationStore.getState().lastDaoHeartOfflineSummary);

  useCultivationStore.getState().startDaoHeartPractice('doctrine_trial', { now: 62_000 });
  const xpBefore = useCultivationStore.getState().heartLawXpById.heart_quiet_breath_method ?? 0;
  applyOfflineCatchup({
    now: 122_000,
    lastActiveAtMs: 62_000,
    dtMs: 60_000,
    rawMs: 60_000,
    wasCapped: false,
    wasMeditating: false,
  });
  assert.equal(useCultivationStore.getState().heartLawXpById.heart_quiet_breath_method, xpBefore);
});

test('mp3 failed risky breakthrough keeps gate item and records failure diagnosis', async () => {
  const content = await hydrateContent();
  resetRuntime();
  const gateItemId = content.items.find((item) => item.id === 'gate_foundation_pill')?.id
    ?? 'gate_foundation_pill';
  useInventoryStore.getState().addItem(gateItemId, 1);
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath_method',
    heartLawLevelById: { heart_quiet_breath_method: 1 },
    daoHeartClarity: 0,
    turbulence: 95,
  });
  useTrialStore.getState().markBypassed('trial_novices_clearing');

  useGameStore.getState().__setBreakthroughRiskRollForTest?.(() => 0);
  const ok = useGameStore.getState().breakthrough();
  useGameStore.getState().__setBreakthroughRiskRollForTest?.(null);

  assert.equal(ok, false);
  assert.equal(useInventoryStore.getState().getItemCount(gateItemId), 1);
  assert.equal(useGameStore.getState().realm.index, 0);
  assert.equal(useCultivationStore.getState().lastBreakthroughFailureSummary?.reason, 'risk_failure');
  assert.ok(useCultivationStore.getState().lastBreakthroughRiskSnapshot?.rows.some((row) => row.id === 'dao_heart_turbulence'));
});
