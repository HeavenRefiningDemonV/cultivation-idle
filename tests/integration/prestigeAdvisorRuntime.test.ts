import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getPrestigeAdvisorSurface } from '../../src/features/prestige/prestigeAdvisorSurface.js';
import type { RawProgressionContentLike } from '../../src/systems/progression/contract/index.js';
import { getPrestigeRuntimeCatalog } from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

let runtimeContentPromise: Promise<RawProgressionContentLike> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadRuntimeContent = async (): Promise<RawProgressionContentLike> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      economy: await readJson('economy.json'),
      cities: await readJson('cities.json'),
      items: await readJson('items.json'),
      trials: await readJson('trials.json'),
      prestige_store: await readJson('prestige_store.json'),
      heart_laws: await readJson('heart_laws.json'),
    }))();
  }
  return runtimeContentPromise;
};

test.beforeEach(async () => {
  usePrestigeStore.getState().hardResetPrestige();
  const content = await loadRuntimeContent();
  useContentStore.setState((state) => ({
    ...state,
    raw: content as never,
    isLoaded: true,
    isLoading: false,
    error: null,
  }));
});

test('top recommended purchase is bounded to visible live prestige nodes', async () => {
  usePrestigeStore.setState({
    totalAP: 300,
    purchasesById: {
      ap_idle_qi_mult: 1,
    },
  });

  const surface = getPrestigeAdvisorSurface();
  const recommendation = surface.topRecommendedPurchase;
  assert.notEqual(recommendation, null);

  const runtimeCatalog = getPrestigeRuntimeCatalog((await loadRuntimeContent()) as never);
  const visibleIds = new Set(runtimeCatalog.visibleLiveNodeIds);
  assert.equal(visibleIds.has(recommendation!.id), true);
  assert.equal(runtimeCatalog.hiddenNodeIds.includes(recommendation!.id), false);
});

test('advisor recommendation does not leak hidden/deferred nodes even when AP is abundant', () => {
  usePrestigeStore.setState({
    totalAP: 9_999,
    purchasesById: {},
  });

  const recommendation = getPrestigeAdvisorSurface().topRecommendedPurchase;
  assert.notEqual(recommendation, null);

  assert.notEqual(recommendation!.id, 'ap_unlock_meridian_hall');
  assert.notEqual(recommendation!.id, 'ap_fragment_gain_boost');
  assert.notEqual(recommendation!.id, 'ap_autosell_filter');
  assert.notEqual(recommendation!.id, 'ap_unlock_pagoda');
});

test('advisor spirit-root classification follows live spirit root state', () => {
  usePrestigeStore.setState({ spiritRoot: null });
  assert.equal(getPrestigeAdvisorSurface().spiritRootClassification, 'Dormant');

  usePrestigeStore.setState({ spiritRoot: { grade: 3, element: 'fire', purity: 78 } });
  assert.equal(getPrestigeAdvisorSurface().spiritRootClassification, 'Awakened');
});
