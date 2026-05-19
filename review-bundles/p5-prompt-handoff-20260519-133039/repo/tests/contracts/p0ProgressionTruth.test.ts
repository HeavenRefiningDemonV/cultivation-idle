import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { RUNTIME_CONTENT_FILE_BY_KEY } from '../../src/content/runtimeContentManifest.js';
import type { TrialDef, ValidatedContent } from '../../src/content/index.js';
import { validateLoadedContent } from '../../src/content/index.js';
import { REALMS } from '../../src/constants/index.js';
import {
  adaptProgressionAuthoredContent,
  getCityUnlockForRealm,
  getContentCapRealm,
  getProgressionContract,
} from '../../src/systems/progression/contract/index.js';
import {
  getGateTransitionItemIdForRealmIndex,
  getSemesterCapRealm,
  getTrialGateItemId,
  getTrialGateRewardBundle,
  getTrialLifecycleSnapshot,
  hasNextLiveRealm,
  syncRuntimeCityStateToRealmEntry,
} from '../../src/systems/progression/runtime/index.js';
import { buildSliceSummary } from '../../src/services/diagnostics/release/releaseGateAdapters.js';
import { performPrestigeReset } from '../../src/services/prestige/PrestigeResetService.js';
import { CURRENT_SAVE_VERSION, runSaveMigrations } from '../../src/save/migrations/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCraftSessionStore } from '../../src/stores/craftSessionStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useManualSatchelStore } from '../../src/stores/manualSatchelStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { useProfessionStore } from '../../src/stores/professionStore.js';
import { useRecipeMasteryStore } from '../../src/stores/recipeMasteryStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { resolveCanonicalSelectedPath } from '../../src/utils/saveload.js';
import { loadMigrationFixture } from '../migrations/loadFixture.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

let contentPromise: Promise<ValidatedContent> | null = null;

async function loadContent(): Promise<ValidatedContent> {
  if (!contentPromise) {
    contentPromise = (async () => {
      const entries = await Promise.all(
        Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
      );
      return validateLoadedContent(Object.fromEntries(entries) as unknown as LoadedContentRaw);
    })();
  }
  return contentPromise;
}

function primeContentStore(content: ValidatedContent) {
  const citiesSorted = [...content.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState((state) => ({
    ...state,
    isLoading: false,
    isLoaded: true,
    error: null,
    loadFailure: null,
    loadFailureDiagnostics: null,
    raw: content,
    economy: content.economy,
    maps: {
      ...state.maps,
      citiesById: Object.fromEntries(content.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(content.items.map((item) => [item.id, item])),
      techniquesById: Object.fromEntries(content.techniques.map((technique) => [technique.id, technique])),
      pavilionsById: Object.fromEntries(content.pavilions.map((pavilion) => [pavilion.id, pavilion])),
      outskirtsById: Object.fromEntries(content.outskirts.map((outskirts) => [outskirts.id, outskirts])),
      enemiesById: Object.fromEntries(content.enemies.map((enemy) => [enemy.id, enemy])),
      trialsById: Object.fromEntries(content.trials.map((trial) => [trial.id, trial])),
      trialsByCityId: Object.fromEntries(content.trials.map((trial) => [trial.cityId, trial])),
      ruinsById: Object.fromEntries(content.ruins.map((ruin) => [ruin.id, ruin])),
      runesById: Object.fromEntries(content.runes.map((rune) => [rune.id, rune])),
      heartLawsById: Object.fromEntries(content.heart_laws.map((law) => [law.id, law])),
      prestigeUpgradesById: Object.fromEntries(content.prestige_store.upgrades.map((upgrade) => [upgrade.id, upgrade])),
      apothecariesById: Object.fromEntries(content.apothecary_shops.map((shop) => [shop.id, shop])),
      apothecariesByCityId: Object.fromEntries(content.apothecary_shops.map((shop) => [shop.cityId, shop])),
    },
    citiesSorted,
    techniquesByPath: {
      heaven: content.techniques.filter((technique) => technique.path === 'heaven'),
      earth: content.techniques.filter((technique) => technique.path === 'earth'),
      martial: content.techniques.filter((technique) => technique.path === 'martial'),
    },
  }));
}

test('P0 path truth keeps selectedPath canonical and consumes legacy lifePath only as input', async () => {
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: null, lifePath: 'earth' }), 'earth');
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: 'martial', lifePath: 'earth' }), 'martial');

  const passthrough = (save: Record<string, unknown>) => save;
  const legacyOnly = await loadMigrationFixture('legacy-path-only');
  const migratedLegacyOnly = runSaveMigrations(legacyOnly, { mode: 'apply', normalizeToCurrent: passthrough });
  assert.equal(migratedLegacyOnly.report.finalVersion, CURRENT_SAVE_VERSION);
  assert.equal((migratedLegacyOnly.migrated.gameState as Record<string, unknown>).selectedPath, 'earth');
  assert.equal('lifePath' in (migratedLegacyOnly.migrated.gameState as Record<string, unknown>), false);

  const conflict = await loadMigrationFixture('legacy-path-conflict');
  const migratedConflict = runSaveMigrations(conflict, { mode: 'apply', normalizeToCurrent: passthrough });
  assert.equal((migratedConflict.migrated.gameState as Record<string, unknown>).selectedPath, 'martial');
  assert.equal('lifePath' in (migratedConflict.migrated.gameState as Record<string, unknown>), false);
});

test('P0 trial entry does not require owning the gate reward proof', async () => {
  const content = await loadContent();
  const trial = content.trials.find((entry) => entry.id === 'trial_novices_clearing');
  assert.ok(trial);

  const snapshot = getTrialLifecycleSnapshot({
    content,
    trial,
    progress: {
      attempts: 0,
      sessionAttempts: 0,
      eligibleFailures: 0,
      resolution: 'none',
      cleared: false,
      lastAttemptAt: null,
      lastClearAt: null,
      bypassedAt: null,
      attemptStartAt: null,
      lastAttemptSummary: null,
    },
    realm: { index: 0, substage: REALMS[0].substages, name: REALMS[0].name },
    qi: '100',
    breakthroughRequirement: '100',
    requiredItemSatisfied: true,
  });

  assert.equal(snapshot.state, 'available');
  assert.equal(snapshot.canStart, true);
  assert.equal(snapshot.gateItemId, 'gate_foundation_pill');
  assert.equal(snapshot.requiredItemId, null);

  const requiredItemTrial = { ...trial, requiredItemId: 'item_separate_ticket' } as TrialDef;
  const missingTicketSnapshot = getTrialLifecycleSnapshot({
    content,
    trial: requiredItemTrial,
    progress: {
      attempts: 0,
      sessionAttempts: 0,
      eligibleFailures: 0,
      resolution: 'none',
      cleared: false,
      lastAttemptAt: null,
      lastClearAt: null,
      bypassedAt: null,
      attemptStartAt: null,
      lastAttemptSummary: null,
    },
    realm: { index: 0, substage: REALMS[0].substages, name: REALMS[0].name },
    qi: '100',
    breakthroughRequirement: '100',
    requiredItemSatisfied: false,
  });

  assert.equal(missingTicketSnapshot.state, 'locked');
  assert.equal(missingTicketSnapshot.reasonCode, 'missing_required_item');
  assert.equal(missingTicketSnapshot.requiredItemId, 'item_separate_ticket');
});

test('P0 gate reward bundle and breakthrough consumption resolve the same proof item', async () => {
  const content = await loadContent();
  const contract = getProgressionContract(adaptProgressionAuthoredContent(content.raw));
  const itemsById = new Set(content.items.map((item) => item.id));

  for (const transition of contract.gateTransitions) {
    const fromRealmIndex = contract.majorRealms[transition.fromRealmId]?.index;
    assert.equal(typeof fromRealmIndex, 'number');

    const trial = content.trials.find((entry) => entry.id === transition.trialId);
    assert.ok(trial);

    const trialGateItemId = getTrialGateItemId(content, trial);
    const breakthroughItemId = getGateTransitionItemIdForRealmIndex(content, fromRealmIndex);
    const rewardBundle = getTrialGateRewardBundle(content, trial);

    assert.equal(trialGateItemId, transition.gateItemId);
    assert.equal(breakthroughItemId, transition.gateItemId);
    assert.deepEqual(rewardBundle.items, [{ itemId: transition.gateItemId, qty: 1 }]);
    assert.equal(itemsById.has(transition.gateItemId), true);
  }
});

test('P0 major realm entry city sync follows authored city unlock truth', async () => {
  const content = await loadContent();
  const contract = getProgressionContract(adaptProgressionAuthoredContent(content.raw));
  const expectedFoundationCity = getCityUnlockForRealm(contract, 'foundation_establishment');
  assert.ok(expectedFoundationCity);

  const sync = syncRuntimeCityStateToRealmEntry(content, 'foundation_establishment', ['city_pinewind_hamlet']);
  assert.equal(sync.newlyUnlockedCityIds.includes(expectedFoundationCity.cityId), true);
  assert.equal(sync.unlockedCityIds.includes('city_pinewind_hamlet'), true);
  assert.equal(sync.unlockedCityIds.includes(expectedFoundationCity.cityId), true);
});

test('P0 prestige reset behavior clears per-life state while preserving permanent prestige truth', async () => {
  const content = await loadContent();
  primeContentStore(content);

  const [firstCity, secondCity] = [...content.cities].sort((a, b) => a.index - b.index);
  assert.ok(firstCity);
  assert.ok(secondCity);

  usePrestigeStore.getState().hardResetPrestige();
  usePrestigeStore.setState({
    totalAP: 88,
    lifetimeAP: 144,
    purchasesById: { ap_mastery_retention_10: 1 },
  });
  useInventoryStore.getState().hardResetInventory();
  useInventoryStore.getState().addCurrency('gold', '50');
  useInventoryStore.getState().addItem('item_iron_ore', 4);
  useActivityStore.getState().hardResetActivity();
  useActivityStore.getState().startActivity('meditate', undefined, 'p0_prestige_seed');
  useTrialStore.getState().hardResetTrials();
  useTrialStore.getState().markCleared('trial_novices_clearing');
  useManualSatchelStore.getState().hardReset();
  useManualSatchelStore.getState().addManual({
    id: 'manual_seed_spark',
    techId: 'tech_spark_strike',
    grade: 'mortal',
    rarity: 'common',
    acquiredAt: 1,
  });
  useTechCollectionStore.getState().hardReset();
  useTechCollectionStore.setState({
    unlockedTechs: {
      tech_spark_strike: {
        unlocked: true,
        masteryXp: 100,
        rank: 2,
        manualGrade: 'earth',
        rarity: 'rare',
        traits: [],
        runes: [],
        favorite: true,
      },
    },
    fragments: { tech_spark_strike: 9 },
    rngSeed: 123,
  });
  useRecipeMasteryStore.setState({ alchemy: { recipe_seed_elixir: 80 } });
  useCityStore.getState().hardResetCity();
  useCityStore.getState().initializeFromContent(content.cities);
  useCityStore.setState({
    currentCityId: secondCity.id,
    unlockedCityIds: [firstCity.id, secondCity.id],
    initializedFromContent: true,
  });
  useProfessionStore.setState({
    alchemyQueue: [{ id: 'alchemy_seed', recipeId: 'recipe_seed_elixir', qty: 1, startedAt: 1, endsAt: 2, cityId: firstCity.id }],
    talismanQueue: [],
    forgeQueue: [],
    lastTickAt: 99,
  });
  useExpeditionStore.setState((state) => ({
    ...state,
    active: [{
      slotIndex: 0,
      expeditionTypeId: 'expedition_seed',
      durationId: 'short',
      cityId: firstCity.id,
      cityIndex: firstCity.index,
      startedAt: 1,
      endsAt: 2,
      seed: 1,
      status: 'running',
    }],
  }));
  useCraftSessionStore.setState({
    activeSession: {
      sessionId: 'craft_seed',
      station: 'alchemy',
      mode: 'assisted',
      sourceId: 'recipe_seed_elixir',
      qty: 1,
      createdAt: 1,
      seed: 1,
      startedAt: 1,
      endsAt: 2,
      script: { station: 'alchemy', mode: 'assisted', sourceId: 'recipe_seed_elixir', steps: [] },
      cursor: { stepIndex: 0 },
      payment: {},
      prompts: [],
    } as never,
  });

  let resetGameRunCalls = 0;
  const summary = performPrestigeReset({
    resetGameRun: () => {
      resetGameRunCalls += 1;
    },
  });

  assert.equal(resetGameRunCalls, 1);
  assert.deepEqual(summary.permanent, {
    totalAP: 88,
    purchasesById: { ap_mastery_retention_10: 1 },
  });
  assert.equal(summary.hybrid.masteryRetentionCarryOver, 0.1);
  assert.equal(summary.reset.clearedActivity, true);
  assert.equal(summary.reset.cityBaselineId, firstCity.id);

  assert.equal(usePrestigeStore.getState().totalAP, 88);
  assert.deepEqual(usePrestigeStore.getState().purchasesById, { ap_mastery_retention_10: 1 });
  assert.deepEqual(useInventoryStore.getState().currencies, { gold: '0', spiritStones: '0', merit: '0' });
  assert.deepEqual(useInventoryStore.getState().items, {});
  assert.equal(useActivityStore.getState().active, null);
  assert.deepEqual(useTrialStore.getState().progressByTrialId, {});
  assert.deepEqual(useManualSatchelStore.getState().manuals, []);
  assert.deepEqual(useProfessionStore.getState().alchemyQueue, []);
  assert.equal(useProfessionStore.getState().lastTickAt, 0);
  assert.deepEqual(useExpeditionStore.getState().active, []);
  assert.equal(useCraftSessionStore.getState().activeSession, null);
  assert.equal(useCityStore.getState().currentCityId, firstCity.id);
  assert.deepEqual(useCityStore.getState().unlockedCityIds, [firstCity.id]);
  assert.equal(useTechCollectionStore.getState().unlockedTechs.tech_spark_strike?.unlocked, false);
  assert.equal(useTechCollectionStore.getState().unlockedTechs.tech_spark_strike?.masteryXp, 10);
  assert.deepEqual(useTechCollectionStore.getState().fragments, {});
  assert.deepEqual(useRecipeMasteryStore.getState().alchemy, { recipe_seed_elixir: 8 });
});

test('P0 content cap does not expose fake future gate or city progression', async () => {
  const content = await loadContent();
  const contract = getProgressionContract(adaptProgressionAuthoredContent(content.raw));
  const capRealm = getSemesterCapRealm();
  const capIndex = contract.majorRealms[capRealm.id]?.index;
  assert.equal(getContentCapRealm(contract), capRealm.id);
  assert.equal(typeof capIndex, 'number');

  assert.equal(hasNextLiveRealm(capIndex), false);
  assert.equal(getGateTransitionItemIdForRealmIndex(content, capIndex), null);

  const sync = syncRuntimeCityStateToRealmEntry(content, capRealm.id, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ]);
  assert.equal(sync.cityUnlock, null);
  assert.equal(sync.newlyUnlockedCityIds.length, 0);
  assert.equal(sync.unlockedCityIds.includes('city_six'), false);

  const slice = buildSliceSummary();
  assert.equal(slice.contentCapRealmId, capRealm.id);
  assert.equal(slice.liveCityCount, 5);
  assert.equal(slice.fakeCitySixDetected, false);
});
