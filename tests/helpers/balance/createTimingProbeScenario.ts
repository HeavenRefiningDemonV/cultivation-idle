import { PATH_MODIFIERS } from '../../../src/constants/index.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../economy/setupEconomicRuntimeScenario.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { getDefaultUnlockedHeartLawIds, useCultivationStore } from '../../../src/stores/cultivationStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useTelemetryStore } from '../../../src/stores/telemetryStore.js';

const chooseRepresentativePath = () => {
  const entries = Object.entries(PATH_MODIFIERS)
    .map(([path, modifiers]) => ({ path, qiMultiplier: modifiers.qiMultiplier }))
    .sort((a, b) => a.qiMultiplier - b.qiMultiplier || a.path.localeCompare(b.path));

  return entries[Math.floor(entries.length / 2)] ?? entries[0];
};

const chooseHighestQiPath = () => {
  const entries = Object.entries(PATH_MODIFIERS)
    .map(([path, modifiers]) => ({ path, qiMultiplier: modifiers.qiMultiplier }))
    .sort((a, b) => b.qiMultiplier - a.qiMultiplier || a.path.localeCompare(b.path));

  return entries[0] ?? chooseRepresentativePath();
};

export type TimingProbeScenario = {
  representativePath: keyof typeof PATH_MODIFIERS;
  representativePathQiMultiplier: number;
};

export async function createTimingProbeScenario(options: { pathStrategy?: 'representative' | 'highest_qi'; pathId?: keyof typeof PATH_MODIFIERS } = {}): Promise<TimingProbeScenario> {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(content.cities);
  useCultivationStore.getState().resetForNewLife();
  useCultivationStore.getState().setBreathMode('balanced');
  useGameStore.getState().hardResetGameState();
  useGameStore.getState().setFocusMode('balanced');
  useTelemetryStore.getState().clear();

  const representative = options.pathId
    ? { path: options.pathId, qiMultiplier: PATH_MODIFIERS[options.pathId].qiMultiplier }
    : options.pathStrategy === 'highest_qi'
      ? chooseHighestQiPath()
      : chooseRepresentativePath();
  const selectedPath = representative.path as keyof typeof PATH_MODIFIERS;
  if (!useGameStore.getState().selectedPath) {
    useGameStore.getState().selectPath(selectedPath as never);
  }
  const starterHeartLawId = useCultivationStore.getState().selectedHeartLawId ?? getDefaultUnlockedHeartLawIds()[0];
  if (starterHeartLawId && !useCultivationStore.getState().selectedHeartLawId) {
    useCultivationStore.getState().selectHeartLaw(starterHeartLawId);
  }
  useCultivationStore.getState().setBreathMode('balanced');

  return {
    representativePath: selectedPath,
    representativePathQiMultiplier: representative.qiMultiplier,
  };
}
