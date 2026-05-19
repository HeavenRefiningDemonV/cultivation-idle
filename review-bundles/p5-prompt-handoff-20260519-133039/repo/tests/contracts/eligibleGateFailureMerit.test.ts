import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { getAllGateFailureMeritPolicies } from '../../src/systems/economy/gateFailureMeritPolicy.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function primeContent(validated: ValidatedContent) {
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...validated.cities].sort((a, b) => a.index - b.index),
    techniquesByPath: {
      heaven: validated.techniques.filter((tech) => tech.path === 'heaven'),
      earth: validated.techniques.filter((tech) => tech.path === 'earth'),
      martial: validated.techniques.filter((tech) => tech.path === 'martial'),
    },
    maps: {
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])),
      techniquesById: Object.fromEntries(validated.techniques.map((tech) => [tech.id, tech])),
      pavilionsById: Object.fromEntries(validated.pavilions.map((pavilion) => [pavilion.id, pavilion])),
      outskirtsById: Object.fromEntries(validated.outskirts.map((outskirts) => [outskirts.id, outskirts])),
      enemiesById: Object.fromEntries(validated.enemies.map((enemy) => [enemy.id, enemy])),
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])),
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])),
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])),
      runesById: Object.fromEntries(validated.runes.map((rune) => [rune.id, rune])),
      heartLawsById: Object.fromEntries(validated.heart_laws.map((law) => [law.id, law])),
      prestigeUpgradesById: Object.fromEntries(validated.prestige_store.upgrades.map((upgrade) => [upgrade.id, upgrade])),
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])),
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])),
    },
  });
}

function resetStores() {
  useCombatStore.getState().hardResetCombat();
  useInventoryStore.getState().hardResetInventory();
  useTrialStore.getState().hardResetTrials();
}

function runEligibleTrialDefeat(options: { validated: ValidatedContent; trialId: string; countsTowardFailSafe: boolean }) {
  const { validated, trialId, countsTowardFailSafe } = options;
  const trial = validated.trials.find((entry) => entry.id === trialId);
  assert.ok(trial);
  useCombatStore.getState().startCombat(trial.bossId, {
    type: 'trial',
    trialId: trial.id,
    cityId: trial.cityId,
    countsTowardFailSafe,
    rewardBundle: {},
  });
  useCombatStore.setState((state) => ({ ...state, playerHP: '0' }));
  useCombatStore.getState().playerDefeat();
}

test('eligible gate failure Merit policy is locked for all five gates', () => {
  assert.deepEqual(getAllGateFailureMeritPolicies().map((entry) => ({ gateIndex: entry.gateIndex, eligibleDefeatMerit: entry.eligibleDefeatMerit })), [
    { gateIndex: 1, eligibleDefeatMerit: 2 },
    { gateIndex: 2, eligibleDefeatMerit: 3 },
    { gateIndex: 3, eligibleDefeatMerit: 4 },
    { gateIndex: 4, eligibleDefeatMerit: 5 },
    { gateIndex: 5, eligibleDefeatMerit: 7 },
  ]);
});

test('eligible gate defeats award the correct Merit by gate and duplicate defeat processing does not double-award', async () => {
  const validated = await getValidated();
  primeContent(validated);

  const cases = [
    ['trial_novices_clearing', '2'],
    ['trial_stone_core_sanctum', '3'],
    ['trial_patriarchs_seal', '4'],
    ['trial_soul_lantern_vault', '5'],
    ['trial_severing_court', '7'],
  ] as const;

  for (const [trialId, expectedMerit] of cases) {
    resetStores();
    runEligibleTrialDefeat({ validated, trialId, countsTowardFailSafe: true });
    useCombatStore.getState().playerDefeat();
    assert.equal(useInventoryStore.getState().merit, expectedMerit);
  }
});

test('blocked or bypass-style non-eligible trial defeats do not award Merit', async () => {
  const validated = await getValidated();
  primeContent(validated);

  resetStores();
  runEligibleTrialDefeat({ validated, trialId: 'trial_novices_clearing', countsTowardFailSafe: false });
  assert.equal(useInventoryStore.getState().merit, '0');

  resetStores();
  useTrialStore.getState().markBypassed('trial_novices_clearing');
  runEligibleTrialDefeat({ validated, trialId: 'trial_novices_clearing', countsTowardFailSafe: false });
  assert.equal(useInventoryStore.getState().merit, '0');
});
