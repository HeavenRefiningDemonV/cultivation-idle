import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { RawProgressionContentLike } from '../../src/systems/progression/contract/index.js';
import { isRefundableHiddenPrestigeNode } from '../../src/systems/progression/contract/index.js';
import { buildPrestigeCategorySections } from '../../src/features/prestige/prestigeCategories.js';
import {
  canPurchasePrestigeNode,
  getPrestigeNodeRuntimeStatus,
  getPrestigeRuntimeCatalog,
  getVisiblePrestigeUpgrades,
} from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

type RuntimeContent = RawProgressionContentLike & {
  heart_laws: Array<{ id: string; tier?: string | null }>;
};

let runtimeContentPromise: Promise<RuntimeContent> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadRuntimeContent = async (): Promise<RuntimeContent> => {
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

test('runtime catalog exposes only the live consumed prestige nodes and hides deferred/unsupported ones', async () => {
  const content = await loadRuntimeContent();
  const catalog = getPrestigeRuntimeCatalog(content as never);

  assert.deepEqual(catalog.visibleLiveNodeIds, [
    'ap_idle_qi_mult',
    'ap_combat_mult',
    'ap_offline_efficiency',
    'ap_unlock_heartlaw_t1',
    'ap_unlock_heartlaw_t2',
    'ap_unlock_heartlaw_t3',
    'ap_extra_technique_slot_1',
    'ap_extra_technique_slot_2',
  ]);
  assert.equal(getPrestigeNodeRuntimeStatus('ap_unlock_meridian_hall', content as never), 'deferred');
  assert.equal(getPrestigeNodeRuntimeStatus('ap_fragment_gain_boost', content as never), 'hidden_unsupported');
  assert.equal(getPrestigeNodeRuntimeStatus('ap_autosell_filter', content as never), 'hidden_unsupported');
});

test('visible prestige category sections omit empty groups and hidden upgrades', async () => {
  const content = await loadRuntimeContent();
  const visibleUpgrades = getVisiblePrestigeUpgrades(content as never);
  const sections = buildPrestigeCategorySections(visibleUpgrades);

  assert.deepEqual(
    sections.map((section) => section.category.key),
    ['laws', 'combat', 'techniques'],
  );
  assert.equal(
    sections.some((section) => section.upgrades.some((upgrade) => upgrade.id === 'ap_unlock_meridian_hall')),
    false,
  );
  assert.equal(
    sections.some((section) => section.upgrades.some((upgrade) => upgrade.id === 'ap_fragment_gain_boost')),
    false,
  );
});

test('runtime catalog purchase checks allow visible nodes and reject hidden or deferred nodes', async () => {
  const content = await loadRuntimeContent();

  assert.deepEqual(canPurchasePrestigeNode('ap_idle_qi_mult', content as never), { ok: true });
  assert.deepEqual(canPurchasePrestigeNode('ap_unlock_pagoda', content as never), {
    ok: false,
    reason: 'Upgrade belongs to deferred content',
  });
  assert.deepEqual(canPurchasePrestigeNode('ap_fragment_gain_boost', content as never), {
    ok: false,
    reason: 'Upgrade is not available in the current live prestige tree',
  });
});

test('packet 1.6 refund classification matches the runtime hidden prestige set', async () => {
  const content = await loadRuntimeContent();
  const catalog = getPrestigeRuntimeCatalog(content as never);
  const hiddenByMigrationTruth = catalog.nodes
    .filter((node) => isRefundableHiddenPrestigeNode(node.upgrade.id, node.upgrade))
    .map((node) => node.upgrade.id);

  assert.deepEqual(hiddenByMigrationTruth, catalog.hiddenNodeIds);
});

test('live prestige source paths route purchase gating and runtime projection through the honesty layer', async () => {
  const prestigeStoreSource = await fs.readFile(path.join(process.cwd(), 'src/stores/prestigeStore.ts'), 'utf8');
  const applyEffectsSource = await fs.readFile(path.join(process.cwd(), 'src/systems/prestige/applyPrestigeEffects.ts'), 'utf8');

  assert.equal(prestigeStoreSource.includes('canPurchasePrestigeNode('), true);
  assert.equal(prestigeStoreSource.includes('getPrestigeNodeRuntimeStatus('), true);
  assert.equal(prestigeStoreSource.includes('getOfflineEfficiencyMultiplier'), true);
  assert.equal(prestigeStoreSource.includes('getCultivationMultiplier'), false);
  assert.equal(applyEffectsSource.includes('getVisiblePrestigeUpgrades'), true);
  assert.equal(applyEffectsSource.includes('expeditionSlotsAdd'), false);
});

test('off-label offline-efficiency drift and spirit-root floor promises are removed from touched live sources', async () => {
  const gameStoreSource = await fs.readFile(path.join(process.cwd(), 'src/stores/gameStore.ts'), 'utf8');
  const offlineSource = await fs.readFile(path.join(process.cwd(), 'src/systems/offline.ts'), 'utf8');
  const prestigeScreenSource = await fs.readFile(path.join(process.cwd(), 'src/components/screens/PrestigeScreen.tsx'), 'utf8');
  const ritualModalSource = await fs.readFile(path.join(process.cwd(), 'src/components/modals/PrestigeRitualModal.tsx'), 'utf8');
  const prestigeStoreSource = await fs.readFile(path.join(process.cwd(), 'src/stores/prestigeStore.ts'), 'utf8');

  assert.equal(gameStoreSource.includes('getCultivationMultiplier'), false);
  assert.equal(gameStoreSource.includes('offlineEfficiencyAdd'), false);
  assert.equal(offlineSource.includes('getOfflineEfficiencyBonusAdditive'), true);
  assert.equal(offlineSource.includes('getOfflineEfficiencyMultiplier'), false);
  assert.equal(prestigeScreenSource.includes('Keep spirit root floor level'), false);
  assert.equal(ritualModalSource.includes('Keep spirit root floor level'), false);
  assert.equal(prestigeStoreSource.includes('spiritRootFloor'), false);
});
