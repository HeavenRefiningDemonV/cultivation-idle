import { PATH_MODIFIERS } from '../../../src/constants/index.js';
import { progressionTimingTracker } from '../../../src/services/diagnostics/progressionTimingTracker.js';
import { getProgressionContract, adaptProgressionAuthoredContent, type ProgressionContract } from '../../../src/systems/progression/contract/index.js';
import type { TrialId } from '../../../src/systems/progression/contract/contractTypes.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useCultivationStore, getDefaultUnlockedHeartLawIds } from '../../../src/stores/cultivationStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useTelemetryStore } from '../../../src/stores/telemetryStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../economy/setupEconomicRuntimeScenario.js';

export type FreshSaveBootstrapState = {
  representativePath: keyof typeof PATH_MODIFIERS;
  representativePathQiMultiplier: number;
  runStartTime: number;
  contract: ProgressionContract;
  trialIds: TrialId[];
};

const chooseRepresentativePath = () => {
  const entries = Object.entries(PATH_MODIFIERS)
    .map(([path, modifiers]) => ({ path, qiMultiplier: modifiers.qiMultiplier }))
    .sort((a, b) => a.qiMultiplier - b.qiMultiplier || a.path.localeCompare(b.path));

  return entries[Math.floor(entries.length / 2)] ?? entries[0];
};

export async function setupFreshSaveRun(): Promise<FreshSaveBootstrapState> {
  const content = await getValidatedEconomicContent();
  const contract = getProgressionContract(adaptProgressionAuthoredContent(content));

  resetEconomicRuntimeStores();
  primeContentStore(content);
  useContentStore.setState((state) => ({
    ...state,
    maps: {
      ...state.maps,
      enemiesById: Object.fromEntries(content.enemies.map((entry) => [entry.id, entry])) as typeof state.maps.enemiesById,
    },
  }));
  useCityStore.getState().initializeFromContent(content.cities);
  useCultivationStore.getState().resetForNewLife();
  useCultivationStore.getState().setBreathMode('balanced');
  useGameStore.getState().hardResetGameState();
  useGameStore.getState().setFocusMode('balanced');
  useTrialStore.getState().hardResetTrials();
  useTelemetryStore.getState().clear();

  const representative = chooseRepresentativePath();
  const selectedPath = representative.path as keyof typeof PATH_MODIFIERS;

  if (!useGameStore.getState().selectedPath) {
    useGameStore.getState().selectPath(selectedPath as never);
  }

  const starterHeartLawIds = getDefaultUnlockedHeartLawIds();
  useCultivationStore.getState().setUnlocked(starterHeartLawIds);
  if (starterHeartLawIds[0]) {
    useCultivationStore.getState().selectHeartLaw(starterHeartLawIds[0]);
  }

  const runStartTime = useGameStore.getState().runStartTime;
  progressionTimingTracker.resetForRun(runStartTime);
  progressionTimingTracker.emitLifeStarted(runStartTime, Date.now(), {
    trigger: 'fresh_start',
    lifeOrdinal: 1,
    sessionKind: 'first_life',
  });

  return {
    representativePath: selectedPath,
    representativePathQiMultiplier: representative.qiMultiplier,
    runStartTime,
    contract,
    trialIds: contract.gateTransitions.map((entry) => entry.trialId),
  };
}

export function assertFreshSaveBootstrapInvariants() {
  const game = useGameStore.getState();
  const city = useCityStore.getState();

  if (game.realm.index !== 0 || game.realm.substage !== 1) {
    throw new Error(`Fresh-save invariant failed: expected realm index 0 substage 1, got ${game.realm.index}:${game.realm.substage}.`);
  }
  if (city.currentCityId !== 'city_pinewind_hamlet') {
    throw new Error(`Fresh-save invariant failed: expected current city city_pinewind_hamlet, got ${city.currentCityId ?? 'null'}.`);
  }
  if (city.unlockedCityIds.length !== 1 || city.unlockedCityIds[0] !== 'city_pinewind_hamlet') {
    throw new Error(`Fresh-save invariant failed: expected only pinewind unlocked, got [${city.unlockedCityIds.join(', ')}].`);
  }
  if (!useContentStore.getState().raw) {
    throw new Error('Fresh-save invariant failed: content is not loaded.');
  }
}
