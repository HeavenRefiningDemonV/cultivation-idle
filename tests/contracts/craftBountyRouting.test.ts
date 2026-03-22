import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import {
  doesLiveCraftBountySourceCount,
  getLiveCraftBountyCountedSources,
  getLiveCraftBountyExcludedSources,
} from '../../src/utils/bountyRouting.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useProfessionStore } from '../../src/stores/professionStore.js';
import { useRecipeMasteryStore } from '../../src/stores/recipeMasteryStore.js';
import { useShopStore } from '../../src/stores/shopStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function primeStores(validated: ValidatedContent) {
  useBountyStore.getState().hardResetBounties();
  useCityStore.getState().hardResetCity();
  useInventoryStore.getState().hardResetInventory();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useRecipeMasteryStore.getState().hardReset();
  useShopStore.getState().hardResetShop();
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
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
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().setCurrentCity('city_pinewind_hamlet');
  useInventoryStore.getState().addCurrency('gold', '999999');
}

function setCraftBounty(cityId: string) {
  useBountyStore.setState((state) => ({
    ...state,
    activeByCityId: {
      [cityId]: [{
        instanceId: 'craft-support',
        cityId,
        cityIndex: 0,
        templateId: 'bounty_pinewind_craft',
        difficulty: 'easy',
        kind: 'CRAFT_COMPLETE',
        title: 'Craft Support',
        description: 'Claim completed forge or Apothecary Brew jobs.',
        progress: 0,
        target: 3,
        claimed: false,
        rewards: { currencies: {} },
        createdAt: 1,
      }],
    },
  }));
}

test('live craft bounty routing policy counts only forge and Apothecary Brew claims', () => {
  assert.deepEqual(getLiveCraftBountyCountedSources().sort(), ['apothecary_brew_claim', 'forge_claim']);
  assert.equal(doesLiveCraftBountySourceCount('forge_claim'), true);
  assert.equal(doesLiveCraftBountySourceCount('apothecary_brew_claim'), true);
  assert.deepEqual(getLiveCraftBountyExcludedSources().sort(), ['deferred_craft', 'shop_buy', 'talisman_claim']);
});

test('forge claims increment CRAFT_COMPLETE while talisman claims and shop buying do not', async () => {
  const validated = await getValidated();
  primeStores(validated);
  setCraftBounty('city_pinewind_hamlet');

  useProfessionStore.setState((state) => ({
    ...state,
    forgeQueue: [{
      id: 'forge-job',
      blueprintId: 'forge_rune_ember_t1',
      qty: 1,
      startedAt: Date.now() - 1000,
      endsAt: Date.now() - 1,
      cityId: 'city_pinewind_hamlet',
      mode: 'IDLE',
      status: 'READY_TO_CLAIM',
    }],
  }));
  const forgeClaim = useProfessionStore.getState().claimForge('forge-job');
  assert.equal(forgeClaim.ok, true);
  assert.equal(useBountyStore.getState().activeByCityId['city_pinewind_hamlet']?.[0]?.progress, 1);

  useProfessionStore.setState((state) => ({
    ...state,
    talismanQueue: [{
      id: 'talisman-job',
      recipeId: validated.talisman_recipes[0].id,
      qty: 1,
      startedAt: Date.now() - 1000,
      endsAt: Date.now() - 1,
      cityId: 'city_pinewind_hamlet',
    }],
  }));
  const talismanClaim = useProfessionStore.getState().claimTalisman('talisman-job');
  assert.equal(talismanClaim.ok, true);
  assert.equal(useBountyStore.getState().activeByCityId['city_pinewind_hamlet']?.[0]?.progress, 1);

  const shop = validated.apothecary_shops.find((entry) => entry.cityId === 'city_pinewind_hamlet');
  assert.ok(shop);
  const buyResult = useShopStore.getState().buy(shop.id, shop.stock[0].id, 1);
  assert.equal(buyResult.ok, true);
  assert.equal(useBountyStore.getState().activeByCityId['city_pinewind_hamlet']?.[0]?.progress, 1);
});

test('Apothecary Brew claims increment CRAFT_COMPLETE while deferred craft stays excluded by policy', async () => {
  const validated = await getValidated();
  primeStores(validated);
  setCraftBounty('city_pinewind_hamlet');

  useProfessionStore.setState((state) => ({
    ...state,
    alchemyQueue: [{
      id: 'brew-job',
      recipeId: validated.alchemy_recipes[0].id,
      qty: 1,
      startedAt: Date.now() - 1000,
      endsAt: Date.now() - 1,
      cityId: 'city_pinewind_hamlet',
    }],
  }));
  const brewClaim = useProfessionStore.getState().claimAlchemy('brew-job');
  assert.equal(brewClaim.ok, true);
  assert.equal(useBountyStore.getState().activeByCityId['city_pinewind_hamlet']?.[0]?.progress, 1);
  assert.equal(doesLiveCraftBountySourceCount('deferred_craft'), false);
});
