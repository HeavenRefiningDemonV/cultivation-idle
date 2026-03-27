import assert from 'node:assert/strict';
import test from 'node:test';
import CryptoJS from 'crypto-js';

import { useActivityStore } from '../../../src/stores/activityStore.js';
import { useCombatStore } from '../../../src/stores/combatStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useUIStore } from '../../../src/stores/uiStore.js';
import { saveGame, loadGame } from '../../../src/utils/saveload.js';
import { SaveService } from '../../../src/services/save/SaveService.js';
import { ensureHarnessEnvironment, resetRuntimeButKeepStorage, saveAndReloadSnapshot, seedScenario } from '../../helpers/release/saveReloadHarness.js';

const SAVE_KEY = 'cultivation-idle-save-v3';
const BACKUP_A_KEY = 'cultivation-idle-save-v3-backup-A';
const TEST_SAVE_ENCRYPTION_KEY = 'cultivation-idle-secret-2025';

const decryptSlotJson = (encrypted: string): Record<string, any> => {
  const decrypted = CryptoJS.AES.decrypt(encrypted, TEST_SAVE_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted) as Record<string, any>;
};

const encryptSlotJson = (json: Record<string, any>): string => CryptoJS.AES.encrypt(JSON.stringify(json), TEST_SAVE_ENCRYPTION_KEY).toString();

void test('save/reload safety matrix: after combat state clears ghost combat activity without breaking core truth', async () => {
  await seedScenario('after_city_unlock');

  useActivityStore.getState().startActivity('outskirts', { cityId: 'city_stonecrag_town', sourceId: 'outskirts_stonecrag' });
  useCombatStore.setState({
    inCombat: true,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_stonecrag_town',
      sourceId: 'outskirts_stonecrag',
      cityIndex: 1,
      isBoss: false,
    },
  });

  const { before, after } = saveAndReloadSnapshot();
  assert.equal(before.activeActivityType, 'outskirts');
  assert.equal(before.combatActive, true);

  assert.equal(after.activeActivityType, null);
  assert.equal(after.combatActive, false);
  assert.equal(after.hasCombatContext, false);
  assert.equal(after.currentCityId, 'city_stonecrag_town');
  assert.equal(after.selectedPath, before.selectedPath);
  assert.equal(after.realmIndex, before.realmIndex);
});

void test('save/reload safety matrix: after city unlock preserves unlocked set, current city validity, and no fake city six', async () => {
  await seedScenario('after_city_unlock');

  const { after } = saveAndReloadSnapshot();
  assert.deepEqual(after.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
  assert.equal(after.currentCityId, 'city_stonecrag_town');
  assert.equal(after.unlockedCityIds.includes(after.currentCityId!), true);
  assert.equal(after.noFakeCitySix, true);
});

void test('save/reload safety matrix: prestige-ready state preserves AP projection coherence', async () => {
  await seedScenario('after_prestige_ready');

  const { before, after } = saveAndReloadSnapshot();
  assert.equal(after.selectedPath, before.selectedPath);
  assert.equal(after.currentCityId, before.currentCityId);
  assert.equal(after.projectedAp >= 0, true);
  assert.equal(after.canPrestige, before.canPrestige);
});

void test('save/reload safety matrix: chapter-cap acknowledgement persists within life and resets on prestige', async () => {
  await seedScenario('after_cap_acknowledged');
  useUIStore.getState().acknowledgeCurrentChapterExhausted();

  const { after } = saveAndReloadSnapshot();
  assert.equal(after.currentChapterExhaustedAcknowledgedThisLife, true);

  useGameStore.getState().performPrestigeReset();
  assert.equal(useUIStore.getState().currentChapterExhaustedAcknowledgedThisLife, false);
});

void test('save/reload safety matrix: offline timestamp normalization and immediate second-load safety', async () => {
  await seedScenario('after_city_unlock');
  useInventoryStore.getState().addCurrency('gold', '10');
  saveGame();

  const rawMain = localStorage.getItem(SAVE_KEY);
  assert.ok(rawMain, 'Expected main save to exist.');
  const firstPayload = decryptSlotJson(rawMain!);
  firstPayload.meta.lastActiveAtMs = 1000;
  firstPayload.gameState.lastActiveTime = 2000;
  firstPayload.gameState.lastTickTime = 3000;
  localStorage.setItem(SAVE_KEY, encryptSlotJson(firstPayload));

  resetRuntimeButKeepStorage();
  assert.equal(SaveService.load(), true);
  const goldAfterFirstLoad = useInventoryStore.getState().currencies.gold;

  resetRuntimeButKeepStorage();
  assert.equal(SaveService.load(), true);
  const goldAfterSecondLoad = useInventoryStore.getState().currencies.gold;

  assert.equal(goldAfterFirstLoad, goldAfterSecondLoad);

  const normalizedSave = decryptSlotJson(localStorage.getItem(SAVE_KEY)!);
  const normalizedValues = [
    Number(normalizedSave.meta.lastActiveAtMs),
    Number(normalizedSave.gameState.lastActiveTime),
    Number(normalizedSave.gameState.lastTickTime),
  ];
  const spread = Math.max(...normalizedValues) - Math.min(...normalizedValues);
  assert.equal(spread <= 5000, true);
});

void test('save/reload safety matrix: corrupted main slot recovers from backup and exposes load failure context', async () => {
  ensureHarnessEnvironment();
  await seedScenario('after_city_unlock');
  saveGame();

  const main = localStorage.getItem(SAVE_KEY);
  assert.ok(main);
  localStorage.setItem(BACKUP_A_KEY, main!);
  localStorage.setItem(SAVE_KEY, 'corrupted-main-save');

  resetRuntimeButKeepStorage();
  assert.equal(loadGame(), true);
  const failure = SaveService.getLastLoadFailure();
  assert.ok(failure);
  assert.equal(failure?.slot, SAVE_KEY);
  assert.equal(useGameStore.getState().realm.index >= 0, true);
});
