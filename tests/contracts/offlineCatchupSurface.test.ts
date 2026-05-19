import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { buildOfflineContext } from '../../src/systems/offline.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

test.beforeEach(async () => {
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  const prestigeStore = await readJson('prestige_store.json');
  const heartLaws = await readJson('heart_laws.json');
  useContentStore.setState((state) => ({
    ...state,
    raw: {
      ...(state.raw ?? {}),
      prestige_store: prestigeStore,
      heart_laws: heartLaws,
    } as never,
    isLoaded: true,
    isLoading: false,
    error: null,
  }));
  useGameStore.setState({
    qi: '0',
    qiPerSecond: '10',
    lastActiveTime: 0,
    lastTickTime: 0,
  });
});

test('offline catchup surface explains cap, efficiency, gains, and combat exclusion', () => {
  usePrestigeStore.setState({ purchasesById: { ap_offline_efficiency: 1 } });

  const result = applyOfflineCatchup(buildOfflineContext(0, { now: 48 * 60 * 60 * 1000 }));

  assert.ok(result.summary);
  assert.ok(result.surface);
  assert.equal(result.surface!.version, 1);
  assert.equal(result.surface!.cap.wasCapped, true);
  assert.equal(result.surface!.cap.maxSeconds, 43_200);
  assert.equal(result.surface!.efficiency.sources.some((source) => source.id === 'base'), true);
  assert.equal(result.surface!.efficiency.sources.some((source) => source.id === 'prestige'), true);
  assert.equal(result.surface!.summaryGroups.some((group) => group.id === 'cultivation'), true);
  assert.equal(result.surface!.blockedReasons.some((reason) => reason.category === 'combat'), true);
});

test('offline catchup surface reports a no-op safely without mutating combat or queues', () => {
  const result = applyOfflineCatchup(buildOfflineContext(Date.now(), { now: Date.now() }));

  assert.equal(result.summary, null);
  assert.ok(result.surface);
  assert.equal(result.surface!.secondsConsidered, 0);
  assert.equal(result.surface!.summaryGroups.some((group) => group.id === 'none'), true);
  assert.equal(result.surface!.blockedReasons.some((reason) => reason.id === 'combat_excluded'), true);
});
