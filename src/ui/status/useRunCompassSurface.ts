import { useMemo } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import {
  adaptRunCompassV2ToLegacy,
  buildLiveRunCompassSurfaceV2,
  buildRunCompassCompactSurfaceFromV2,
} from '../../systems/ui/runCompass/index.js';
import { useRunDeltaStore } from '../../systems/runDeltas/runDeltaStore.js';

export function useRunCompassSurface() {
  const contentLoaded = useContentStore((state) => state.isLoaded);
  const contentRaw = useContentStore((state) => state.raw);
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const currencies = useInventoryStore((state) => state.currencies);
  const items = useInventoryStore((state) => state.items);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const trialProgressById = useTrialStore((state) => state.progressByTrialId);
  const highestRealmReached = usePrestigeStore((state) => state.highestRealmReached);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const chapter = useCultivationStore((state) => state.chapter);
  const runDeltas = useRunDeltaStore((state) => state.deltas);

  return useMemo(() => {
    if (!contentLoaded || !contentRaw) {
      return { v2: null, full: null, compact: null, compactV2: null };
    }
    const v2 = buildLiveRunCompassSurfaceV2();
    const full = v2 ? adaptRunCompassV2ToLegacy(v2) : null;
    return {
      v2,
      full,
      compact: buildRunCompassCompactSurfaceFromV2(v2),
      compactV2: buildRunCompassCompactSurfaceFromV2(v2),
    };
  }, [
    chapter,
    contentLoaded,
    contentRaw,
    currencies,
    currentCityId,
    highestRealmReached,
    items,
    qi,
    qiPerSecond,
    realm,
    runDeltas,
    selectedHeartLawId,
    selectedModuleByCity,
    selectedPath,
    trialProgressById,
    unlockedCityIds,
  ]);
}
