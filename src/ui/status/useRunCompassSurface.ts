import { useMemo } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { buildLiveRunCompassSurface, buildRunCompassCompactSurface } from '../../systems/ui/runCompass/index.js';

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

  return useMemo(() => {
    if (!contentLoaded || !contentRaw) {
      return { full: null, compact: null };
    }
    const full = buildLiveRunCompassSurface();
    return {
      full,
      compact: buildRunCompassCompactSurface(full),
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
    selectedHeartLawId,
    selectedModuleByCity,
    selectedPath,
    trialProgressById,
    unlockedCityIds,
  ]);
}
