import { validateLoadedContent, type LoadedContentRaw, type ValidatedContent } from '../../src/content/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTrainingStore } from '../../src/stores/trainingStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';
import {
  getValidatedEconomicContent,
  primeContentStore,
  resetEconomicRuntimeStores,
} from '../helpers/economy/setupEconomicRuntimeScenario.js';

let loadedContentPromise: Promise<ValidatedContent> | null = null;

export async function loadValidatedStatusContent(): Promise<ValidatedContent> {
  if (!loadedContentPromise) {
    loadedContentPromise = getValidatedEconomicContent()
      .catch(async () => validateLoadedContent(await loadRawProgressionContent() as LoadedContentRaw));
  }
  return loadedContentPromise;
}

export async function primeStatusObservatoryScenario(): Promise<ValidatedContent> {
  const content = await loadValidatedStatusContent();
  resetEconomicRuntimeStores();
  useTrainingStore.getState().hardResetTraining();
  primeContentStore(content);
  useContentStore.setState((state) => ({
    maps: {
      ...state.maps,
      techniquesById: Object.fromEntries(content.techniques.map((entry) => [entry.id, entry])),
      pavilionsById: Object.fromEntries(content.pavilions.map((entry) => [entry.id, entry])),
      outskirtsById: Object.fromEntries(content.outskirts.map((entry) => [entry.id, entry])),
      enemiesById: Object.fromEntries(content.enemies.map((entry) => [entry.id, entry])),
      ruinsById: Object.fromEntries(content.ruins.map((entry) => [entry.id, entry])),
      prestigeUpgradesById: Object.fromEntries(content.prestige_store.upgrades.map((entry) => [entry.id, entry])),
    },
    techniquesByPath: {
      heaven: content.techniques.filter((entry) => entry.path === 'heaven'),
      earth: content.techniques.filter((entry) => entry.path === 'earth'),
      martial: content.techniques.filter((entry) => entry.path === 'martial'),
    },
  }));
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
  });
  useGameStore.setState({
    selectedPath: 'heaven',
    realm: { index: 1, substage: 1, name: 'Foundation Establishment' },
  });
  useTrainingStore.setState({
    statRatingsById: {
      qi_control: 10,
      dao_resonance: 4,
      divine_sense: 1,
      weapon_intent: 7,
    },
    statXpById: {},
    regimenMasteryXpById: {},
    fatigue: 12,
    activeRegimenId: null,
    activeIntensityId: null,
    lastTickAt: null,
    lastOfflineSummary: null,
    prestigeMemoryAppliedForLife: false,
  });
  return content;
}

