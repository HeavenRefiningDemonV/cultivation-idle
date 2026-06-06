import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { createDefaultOnboardingState, useOnboardingStore } from '../../src/stores/onboardingStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { resolveOnboardingUnlocksThroughMilestone } from '../../src/systems/onboarding/onboardingProgression.js';
import type { OnboardingMilestoneId } from '../../src/systems/onboarding/onboardingTypes.js';
import { openWorldModule } from '../../src/systems/world/openWorldModule.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const PINEWIND_CITY_ID = 'city_pinewind_hamlet';
const NOW = 123_456;

let validatedContentPromise: Promise<ValidatedContent> | null = null;

const loadValidatedContent = async (): Promise<ValidatedContent> => {
  if (!validatedContentPromise) {
    validatedContentPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedContentPromise;
};

async function primeRuntimeStores() {
  const validated = await loadValidatedContent();
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);

  useUIStore.getState().hardResetUI();
  useCityStore.getState().hardResetCity();
  useActivityStore.getState().hardResetActivity();
  useCombatStore.getState().hardResetCombat();

  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(citiesSorted.map((city) => [city.id, city])) as never,
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])) as never,
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])) as never,
      outskirtsById: Object.fromEntries(validated.outskirts.map((outskirts) => [outskirts.id, outskirts])) as never,
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])) as never,
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])) as never,
      pavilionsById: Object.fromEntries(validated.pavilions.map((pavilion) => [pavilion.id, pavilion])) as never,
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])) as never,
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])) as never,
    },
  });

  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.setState({
    currentCityId: PINEWIND_CITY_ID,
    unlockedCityIds: [PINEWIND_CITY_ID],
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'outskirts' },
  });
}

function setOnboardingMilestone(activeMilestoneId: OnboardingMilestoneId) {
  const unlocks = resolveOnboardingUnlocksThroughMilestone({
    completedMilestoneIds: [],
    activeMilestoneId,
  });
  useOnboardingStore.getState().hydrate({
    ...createDefaultOnboardingState(NOW),
    activeMilestoneId,
    ...unlocks,
  });
}

test.beforeEach(async () => {
  await primeRuntimeStores();
});

test('openWorldModule does not open Gate Trial directly at M3', () => {
  setOnboardingMilestone('M3_world_outskirts');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'gateTrial', source: 'onboarding-route-guard-test' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
  assert.notEqual(useUIStore.getState().worldBuildingModalKey, 'gateTrial');
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});

test('openWorldModule does not open Manual Pavilion while it is teaser-only at M3', () => {
  setOnboardingMilestone('M3_world_outskirts');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'manualPavilion', source: 'onboarding-route-guard-test' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
  assert.notEqual(useUIStore.getState().worldBuildingModalKey, 'manualPavilion');
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});

test('openWorldModule opens Outskirts at M3', () => {
  setOnboardingMilestone('M3_world_outskirts');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'outskirts', source: 'onboarding-route-guard-test' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, true);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().worldBuildingModalKey, 'outskirts');
});

test('openWorldModule allows Gate Trial at M9 subject to existing lifecycle', () => {
  setOnboardingMilestone('M9_gate_trial');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'gateTrial', source: 'onboarding-route-guard-test' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, true);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().worldBuildingModalKey, 'gateTrial');
});

test('openWorldModule allows exact fixture route while normal route remains locked', () => {
  setOnboardingMilestone('M3_world_outskirts');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'gateTrial', source: 'onboarding-route-guard-test' });
  assert.equal(useUIStore.getState().showWorldBuildingModal, false);

  openWorldModule({
    cityId: PINEWIND_CITY_ID,
    moduleKey: 'gateTrial',
    source: 'onboarding-route-guard-test',
    intent: { gateTrialExactMode: 'fixture' },
  });

  assert.equal(useUIStore.getState().showWorldBuildingModal, true);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().worldBuildingModalKey, 'gateTrial');
  assert.equal(useOnboardingStore.getState().activeMilestoneId, 'M3_world_outskirts');
});
