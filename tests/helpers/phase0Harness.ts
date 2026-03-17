import assert from 'node:assert/strict';

import type { ValidatedContent, MajorRealmId } from '../../src/content/index.ts';
import { REALMS } from '../../src/constants/index.ts';
import { getRealmTransitions, type ProgressionTransition } from '../../src/systems/progression/index.ts';
import { GATE_ITEMS } from '../../src/systems/loot.ts';
import { useActivityStore } from '../../src/stores/activityStore.ts';
import { useCityStore } from '../../src/stores/cityStore.ts';
import { useCombatStore } from '../../src/stores/combatStore.ts';
import { useContentStore } from '../../src/stores/contentStore.ts';
import { useGameStore } from '../../src/stores/gameStore.ts';
import { useInventoryStore } from '../../src/stores/inventoryStore.ts';
import { usePrestigeStore } from '../../src/stores/prestigeStore.ts';
import { useTrialStore } from '../../src/stores/trialStore.ts';
import { useUIStore } from '../../src/stores/uiStore.ts';
import { bootstrapContentStore, loadValidatedContentFromDisk } from './contentHarness.ts';
import { resetAllStoresForTest, wireStoreDependenciesForTests } from './storeHarness.ts';

export type Phase0Harness = {
  content: ValidatedContent;
  firstTransition: ProgressionTransition;
  fromRealmIndex: number;
};

let cachedContent: ValidatedContent | null = null;

function getCachedContent(): ValidatedContent {
  if (cachedContent) return cachedContent;
  cachedContent = loadValidatedContentFromDisk();
  return cachedContent;
}

function getMajorRealmIndex(content: ValidatedContent, realmId: MajorRealmId): number {
  const realm = content.economy.majorRealms.find((entry) => entry.id === realmId);
  assert.ok(realm, `Unknown major realm in content: ${realmId}`);
  return realm.index;
}

export function createPhase0Harness(): Phase0Harness {
  resetAllStoresForTest();
  wireStoreDependenciesForTests();

  const content = getCachedContent();
  bootstrapContentStore(content);
  useCityStore.getState().initializeFromContent(content.cities);

  const transitions = getRealmTransitions(content);
  const firstTransition = transitions[0];
  assert.ok(firstTransition, 'Expected at least one progression transition in content');
  const fromRealmIndex = firstTransition.fromMajorRealm
    ? getMajorRealmIndex(content, firstTransition.fromMajorRealm)
    : (() => {
        const targetRealmIndex = getMajorRealmIndex(content, firstTransition.toMajorRealm);
        assert.ok(targetRealmIndex > 0, 'First transition target realm index should be > 0.');
        return targetRealmIndex - 1;
      })();

  return {
    content,
    firstTransition,
    fromRealmIndex,
  };
}

export function seedCraftedProgressedLifeForPrestige(): void {
  const game = useGameStore.getState();
  const inventory = useInventoryStore.getState();
  const city = useCityStore.getState();
  const trial = useTrialStore.getState();

  useGameStore.setState({
    realm: { ...game.realm, index: 2, substage: 5, name: 'Golden Core' },
    qi: '999999',
    selectedPath: 'earth',
    lifePath: 'earth',
  });

  inventory.addItem('gate_foundation_pill', 2);
  city.unlockCity('city_stonecrag_town');
  trial.recordFailure('trial_novices_clearing');

  useActivityStore.getState().startActivity(
    'trial',
    {
      cityId: 'city_pinewind_hamlet',
      sourceId: 'trial_novices_clearing',
    },
    'test-seed',
  );
  useCombatStore.setState({
    inCombat: true,
    combatContext: {
      type: 'trial',
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      gateItemId: 'gate_foundation_pill',
      eligible: true,
    },
  });
}

export function seedPrestigeMetaState(): void {
  usePrestigeStore.setState((state) => ({
    ...state,
    totalAP: 42,
    lifetimeAP: 100,
    prestigeCount: 2,
    purchasesById: { offline_flow: 1 },
    runStartTime: Date.now() - 120_000,
    highestRealmReached: 2,
  }));
}

export function performPrestigeRitual(): void {
  usePrestigeStore.getState().performPrestige();
}

export function createFreshLife(path: 'heaven' | 'earth' | 'martial'): void {
  useGameStore.getState().setLifePath(path);
}

export function getLifeStartPath(): string | null {
  return useGameStore.getState().lifePath;
}

export function getMechanicalPath(): string | null {
  return useGameStore.getState().selectedPath;
}

export function advanceToGateThreshold(realmIndex: number): void {
  const realmDef = REALMS[realmIndex];
  assert.ok(realmDef, `Missing runtime realm definition at index ${realmIndex}`);

  const gameState = useGameStore.getState();
  useGameStore.setState({
    realm: {
      ...gameState.realm,
      index: realmIndex,
      substage: realmDef.substages,
      name: realmDef.name,
    },
    qi: '1e30',
  });
}

export function grantItem(itemId: string, qty: number = 1): void {
  const inventory = useInventoryStore.getState();
  inventory.addItem(itemId, qty);
}

export function openFirstTrialPreview(trialId: string, cityId: string): void {
  const uiState = useUIStore.getState();
  useUIStore.setState({
    combatPresentation: {
      ...uiState.combatPresentation,
      context: { type: 'trial', sourceId: trialId, cityId },
      mode: 'preview',
    },
  });
}

export function startCombatFromPreview(): void {
  useUIStore.getState().startCombatFromPreview();
}

export function completeTrialByCombatStore(
  trialId: string,
  cityId: string,
  bossId: string,
  gateItemId: string,
): void {
  useActivityStore.getState().startActivity('trial', { cityId, sourceId: trialId }, 'test-start');
  useCombatStore.getState().startCombat(bossId, {
    type: 'trial',
    cityId,
    trialId,
    gateItemId,
    eligible: true,
  });
  useCombatStore.getState().defeatEnemy();
}

export function performBreakthrough(): boolean {
  return useGameStore.getState().breakthrough();
}

export function getUnlockedCities(): string[] {
  return useCityStore.getState().unlockedCityIds;
}

export function getFirstBreakthroughRuntimeGateItem(realmIndex: number): string | null {
  return GATE_ITEMS[realmIndex] ?? null;
}

export function getInventoryCount(itemId: string): number {
  return useInventoryStore.getState().getItemCount(itemId);
}

export function getTrialCombatStarted(): boolean {
  return useCombatStore.getState().combatContext.type === 'trial' && useActivityStore.getState().isActive('trial');
}

export function getCurrentTrialGateItemFromContent(trialId: string): string {
  const trial = useContentStore.getState().maps.trialsById[trialId];
  assert.ok(trial, `Missing trial in content maps: ${trialId}`);
  return trial.gateItemId;
}
