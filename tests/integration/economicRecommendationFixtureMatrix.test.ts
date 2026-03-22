import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLiveEconomicRecommendationEngine } from '../../src/systems/economy/economicRecommendationEngine.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

const scenarios = [
  {
    name: 'fresh save',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_pinewind_hamlet',
        unlockedCityIds: ['city_pinewind_hamlet'],
        selectedModuleByCity: { city_pinewind_hamlet: 'outskirts' },
      });
      useGameStore.setState({ realm: { index: 0, substage: 1, name: 'Qi Condensation' }, selectedPath: 'heaven' });
    },
    expectModule: 'apothecary',
  },
  {
    name: 'first gate edge',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_pinewind_hamlet',
        unlockedCityIds: ['city_pinewind_hamlet'],
        selectedModuleByCity: { city_pinewind_hamlet: 'gateTrial' },
      });
      useGameStore.setState({ realm: { index: 0, substage: 3, name: 'Qi Condensation' }, selectedPath: 'earth' });
      useInventoryStore.getState().addItem('cons_healing_pellet_t1', 20);
      useInventoryStore.getState().addItem('cons_ironblood_pellet_t1', 4);
      useInventoryStore.getState().addItem('cons_qi_elixir_t1', 4);
    },
    expectModule: 'forge',
  },
  {
    name: 'midgame prep shortage',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_spirit_cavern_city',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
        selectedModuleByCity: { city_spirit_cavern_city: 'apothecary' },
      });
      useGameStore.setState({ realm: { index: 2, substage: 3, name: 'Core Formation' }, selectedPath: 'earth' });
      useInventoryStore.getState().addItem('cons_healing_pellet_t1', 10);
      useInventoryStore.getState().addItem('cons_qi_elixir_t2', 1);
    },
    expectModule: 'apothecary',
  },
  {
    name: 'late-game forge shortage',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_ironpeak_bastion',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
        selectedModuleByCity: { city_ironpeak_bastion: 'forge' },
      });
      useGameStore.setState({ realm: { index: 4, substage: 3, name: 'Soul Formation' }, selectedPath: 'martial' });
      useInventoryStore.getState().addItem('cons_healing_pellet_t1', 40);
      useInventoryStore.getState().addItem('cons_ironblood_pellet_t2', 5);
      useInventoryStore.getState().addItem('cons_windstep_powder_t2', 5);
      useInventoryStore.getState().addItem('cons_ward_salt_t2', 5);
      useInventoryStore.getState().addItem('cons_mastery_tonic_t1', 5);
      useEquipmentStore.setState({ refineLevelBySlot: { weapon: 5, accessory: 5 } });
    },
    expectModule: 'forge',
  },
  {
    name: 'support-currency shortage',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_lotusford',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford'],
        selectedModuleByCity: { city_lotusford: 'bounties' },
      });
      useGameStore.setState({ realm: { index: 3, substage: 3, name: 'Nascent Soul' }, selectedPath: 'heaven' });
      useInventoryStore.getState().addItem('cons_healing_pellet_t1', 25);
      useInventoryStore.getState().addItem('cons_anti_venom_pellet_t1', 4);
      useInventoryStore.getState().addItem('cons_quiet_breath_tea_t1', 4);
      useInventoryStore.getState().addItem('rune_forge_guard_t1', 1);
      useEquipmentStore.setState({
        refineLevelBySlot: { weapon: 8, accessory: 8 },
        temperBonusesBySlot: {
          weapon: [{ id: 'support_temper_weapon_1', label: 'Support weapon temper', stat: 'atkPct', valuePct: 0.05 }, { id: 'support_temper_weapon_2', label: 'Support weapon temper', stat: 'critPct', valuePct: 0.03 }],
          accessory: [{ id: 'support_temper_accessory_1', label: 'Support accessory temper', stat: 'defPct', valuePct: 0.05 }],
        },
      });
      useInventoryStore.getState().addCurrency('merit', '0');
      useInventoryStore.getState().addCurrency('spiritStones', '0');
    },
    expectModule: 'bounties',
  },
  {
    name: 'content cap',
    setup: () => {
      useCityStore.setState({
        currentCityId: 'city_ironpeak_bastion',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
        selectedModuleByCity: { city_ironpeak_bastion: 'forge' },
      });
      useGameStore.setState({ realm: { index: 5, substage: 3, name: 'Spirit Severing' }, selectedPath: 'martial' });
      useInventoryStore.getState().addItem('cons_healing_pellet_t1', 50);
      useInventoryStore.getState().addItem('cons_ironblood_pellet_t2', 10);
      useInventoryStore.getState().addItem('cons_windstep_powder_t2', 10);
      useInventoryStore.getState().addItem('cons_ward_salt_t2', 10);
      useInventoryStore.getState().addItem('cons_mastery_tonic_t1', 10);
      useInventoryStore.getState().addCurrency('merit', '999');
      useInventoryStore.getState().addCurrency('spiritStones', '999');
      useInventoryStore.getState().addItem('mat_ironpeak_core', 1);
      useInventoryStore.getState().addItem('mat_technique_fragment', 1);
      useInventoryStore.getState().addItem('crate_manual_scraps', 1);
      useInventoryStore.getState().addItem('frag_manual_mortal', 1);
      useEquipmentStore.setState({
        refineLevelBySlot: { weapon: 10, accessory: 10 },
        temperBonusesBySlot: { weapon: [{ id: 'temper_weapon', label: 'Weapon temper', stat: 'atkPct', valuePct: 0.05 }], accessory: [{ id: 'temper_accessory', label: 'Accessory temper', stat: 'defPct', valuePct: 0.05 }] },
      });
      useTrialStore.setState({
        progressByTrialId: Object.fromEntries(useContentStore.getState().raw!.trials.map((trial) => [
          trial.id,
          { attempts: 1, sessionAttempts: 1, eligibleFailures: 0, resolution: 'cleared', cleared: true, lastAttemptAt: 1, lastClearAt: 1, bypassedAt: null, attemptStartAt: null, lastAttemptSummary: null },
        ])),
      });
    },
    expectContentCap: true,
  },
] as const;

test.beforeEach(async () => {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useExpeditionStore.getState().hydrate({ slots: 1, active: [], rareProgressByKey: {} }, 0);
});

for (const scenario of scenarios) {
  test(`economic recommendation fixture matrix: ${scenario.name}`, async () => {
    scenario.setup();
    const result = buildLiveEconomicRecommendationEngine();

    if ('expectModule' in scenario) {
      assert.equal(result.topRecommendation?.destinationModuleKey, scenario.expectModule);
    }
    if ('expectContentCap' in scenario && scenario.expectContentCap) {
      assert.equal(result.snapshot.atContentCap, true);
      assert.equal(result.topRouteCandidates.some((candidate) => candidate.destinationModuleKey === 'alchemy' as never), false);
    }
  });
}
