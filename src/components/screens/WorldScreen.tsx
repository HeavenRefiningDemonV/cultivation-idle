import { useEffect, useMemo, useCallback } from 'react';
import type { CityDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useCityStore } from '../../stores/cityStore';
import { useUIStore } from '../../stores/uiStore';
import { useCombatStore } from '../../stores/combatStore';
import { useBountyStore } from '../../stores/bountyStore';
import { useActivityStore } from '../../stores/activityStore';
import './WorldScreen.scss';
import { RecentTechniqueActivations } from '../combat/RecentTechniqueActivations';
import { resolveBountyDestination } from '../../utils/bountyRouting';
import { CityMapHub } from './CityMapHub';
import { openWorldModule } from '../../systems/world/openWorldModule';
import { getCityArrivalLesson } from '../../systems/world/cityArrivalContract.js';
import { DEFERRED_WORLD_MODULES } from '../../systems/world/liveWorldSchema.js';
import {
  getProgressionContract,
  adaptProgressionAuthoredContent,
} from '../../systems/progression/contract';
import { getCityUnlockRequirementText } from '../../systems/progression/runtime/cityProgression';
import {
  buildWorldCitySelectorEntries,
  getWorldTravelBlockMessage,
  getWorldTravelGuard,
} from '../../systems/world/travelContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../../systems/progression/contract/semesterSlice.js';

const WORLD_SCREEN_HIDDEN_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const EMPTY_CITY_REQUIREMENT_MAP: Readonly<Record<string, string | null>> = Object.freeze({});
const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);

const MODULE_METADATA: Record<string, { label: string }> = {
  outskirts: { label: 'Outskirts' },
  gateTrial: { label: 'Gate Trial' },
  ruins: { label: 'Ruins' },
  apothecary: { label: 'Apothecary' },
  manualPavilion: { label: 'Manual Pavilion' },
  forge: { label: 'Forge' },
  bounties: { label: 'Bounties' },
  expeditions: { label: 'Expeditions' },
};

function toTitleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getModuleMeta(key: string) {
  if (MODULE_METADATA[key]) return MODULE_METADATA[key];
  return { label: toTitleCase(key) };
}

export function WorldScreen() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const addNotification = useUIStore((state) => state.addNotification);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);
  const citiesSorted = useContentStore((state) => state.citiesSorted);
  const rawContent = useContentStore((state) => state.raw);

  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const setCurrentCity = useCityStore((state) => state.setCurrentCity);
  const activeByCityId = useBountyStore((state) => state.activeByCityId);
  const trackedByCityId = useBountyStore((state) => state.trackedByCityId);
  const inCombat = useCombatStore((state) => state.inCombat);
  const activeActivityType = useActivityStore((state) => state.active?.type ?? null);

  useEffect(() => {
    setHeaderTitles('World', 'Cities & activities');
  }, [setHeaderTitles]);

  const selectedCity = useMemo(() => {
    if (!currentCityId) return null;
    return citiesSorted.find((city) => city.id === currentCityId) ?? null;
  }, [citiesSorted, currentCityId]);

  const cityRequirementById = useMemo(() => {
    if (!rawContent) return EMPTY_CITY_REQUIREMENT_MAP;
    try {
      const contract = getProgressionContract(adaptProgressionAuthoredContent(rawContent));
      return Object.fromEntries(
        citiesSorted.map((city) => [city.id, getCityUnlockRequirementText(contract, city.id)]),
      ) as Record<string, string | null>;
    } catch (contractError) {
      console.warn('[WorldScreen] Failed to read city unlock requirements', contractError);
      return EMPTY_CITY_REQUIREMENT_MAP;
    }
  }, [citiesSorted, rawContent]);

  const worldSelectorEntries = useMemo(
    () =>
      buildWorldCitySelectorEntries({
        cities: citiesSorted,
        currentCityId,
        unlockedCityIds,
        requirementTextByCityId: cityRequirementById,
      }),
    [citiesSorted, cityRequirementById, currentCityId, unlockedCityIds],
  );

  const visibleCityModules = useMemo(() => {
    if (!selectedCity) return EMPTY_VISIBLE_CITY_MODULES;
    return selectedCity.modules.filter((moduleKey) => !WORLD_SCREEN_HIDDEN_MODULES.has(moduleKey));
  }, [selectedCity]);

  const trackedBounty = useMemo(() => {
    if (!currentCityId) return null;
    const trackedId = trackedByCityId[currentCityId];
    if (!trackedId) return null;
    const activeBounties = activeByCityId[currentCityId];
    if (!activeBounties) return null;
    return activeBounties.find((entry) => entry.instanceId === trackedId) ?? null;
  }, [activeByCityId, currentCityId, trackedByCityId]);

  const displayedModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored && visibleCityModules.includes(stored)) return stored;
    return visibleCityModules[0] ?? null;
  }, [selectedCity, selectedModuleByCity, visibleCityModules]);

  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const worldModalKey = useUIStore((state) => state.worldBuildingModalKey);
  const worldModalCityId = useUIStore((state) => state.worldBuildingModalCityId);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const combatPresentation = useUIStore((state) => state.combatPresentation);

  const combatModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    if (combatPresentation.mode === 'hidden' || !combatPresentation.context) return null;
    if (combatPresentation.context.cityId && combatPresentation.context.cityId !== selectedCity.id) return null;
    return (
      combatPresentation.context.moduleKey ??
      (combatPresentation.context.type === 'trial' ? 'gateTrial' : combatPresentation.context.type)
    );
  }, [combatPresentation, selectedCity]);

  const activeModuleKey = useMemo(() => {
    if (combatModuleKey) return combatModuleKey;
    if (showWorldBuildingModal && worldModalCityId && worldModalCityId === selectedCity?.id && worldModalKey) {
      return worldModalKey;
    }
    return displayedModuleKey;
  }, [combatModuleKey, displayedModuleKey, selectedCity?.id, showWorldBuildingModal, worldModalCityId, worldModalKey]);

  const trackedDestination = useMemo(() => {
    if (!selectedCity || !trackedBounty) return null;
    return resolveBountyDestination({
      cityId: selectedCity.id,
      bountyKind: trackedBounty.kind,
      cityModules: selectedCity.modules,
    });
  }, [selectedCity, trackedBounty]);

  const isTrackedModuleActive = useMemo(() => {
    if (!trackedDestination || !activeModuleKey) return false;
    return trackedDestination.kind === 'module' && trackedDestination.moduleKey === activeModuleKey;
  }, [activeModuleKey, trackedDestination]);

  useEffect(() => {
    if (!showWorldBuildingModal || !selectedCity) return;
    if (worldModalCityId && worldModalCityId !== selectedCity.id) {
      closeWorldBuildingModal();
    }
  }, [closeWorldBuildingModal, selectedCity, showWorldBuildingModal, worldModalCityId]);

  const alternateUnlockedCityId = useMemo(
    () => worldSelectorEntries.find((entry) => entry.isUnlocked && !entry.isCurrent)?.city.id ?? null,
    [worldSelectorEntries],
  );

  const travelGuardForOtherCity = useMemo(
    () =>
      getWorldTravelGuard({
        targetCityId: alternateUnlockedCityId,
        currentCityId,
        unlockedCityIds,
        liveCityIds: SEMESTER_SLICE_CONTRACT.liveCityIds,
        inCombat,
        activeActivityType,
        combatPresentationMode: combatPresentation.mode,
      }),
    [activeActivityType, alternateUnlockedCityId, combatPresentation.mode, currentCityId, inCombat, unlockedCityIds],
  );

  const currentCityTravelBlocked = alternateUnlockedCityId !== null && !travelGuardForOtherCity.allowed;

  const currentCityStatusLine = useMemo(() => {
    const unlockedCount = worldSelectorEntries.filter((entry) => entry.isUnlocked).length;
    if (!selectedCity) return 'Select a city to view its modules.';
    if (!alternateUnlockedCityId) {
      return unlockedCount <= 1 ? 'Only one city is unlocked right now.' : 'Current city ready.';
    }
    if (currentCityTravelBlocked) {
      return getWorldTravelBlockMessage(travelGuardForOtherCity.reason);
    }
    return unlockedCount > 1
      ? `Travel available to ${unlockedCount - 1} other ${unlockedCount - 1 === 1 ? 'city' : 'cities'}.`
      : 'Current city ready.';
  }, [alternateUnlockedCityId, currentCityTravelBlocked, selectedCity, travelGuardForOtherCity.reason, worldSelectorEntries]);

  const cityLesson = useMemo(() => {
    if (!selectedCity) return null;
    return getCityArrivalLesson(selectedCity.id);
  }, [selectedCity]);

  const handleSelectCity = (city: CityDef) => {
    if (!city || city.id === currentCityId) return;

    const travelGuard = getWorldTravelGuard({
      targetCityId: city.id,
      currentCityId,
      unlockedCityIds,
      liveCityIds: SEMESTER_SLICE_CONTRACT.liveCityIds,
      inCombat,
      activeActivityType,
      combatPresentationMode: combatPresentation.mode,
    });

    if (!travelGuard.allowed) {
      const message = getWorldTravelBlockMessage(travelGuard.reason);
      if (message) {
        addNotification('warning', message);
      }
      return;
    }

    setCurrentCity(city.id);
  };

  const handleOpenModule = useCallback(
    (moduleKey: string) => {
      if (!selectedCity) return;
      if (!visibleCityModules.includes(moduleKey)) return;
      openWorldModule({ cityId: selectedCity.id, moduleKey, source: 'world-map' });
    },
    [selectedCity, visibleCityModules],
  );

  if (isLoading) {
    return <div className={'worldScreen worldScreenMessage'}>Loading content...</div>;
  }

  if (error) {
    return (
      <div className={'worldScreen worldScreenMessage worldScreenMessageError'}>
        <div>Content failed to load.</div>
        <div className={'worldScreenErrorText'}>{error}</div>
      </div>
    );
  }

  if (!isLoaded || citiesSorted.length === 0) {
    return <div className={'worldScreen worldScreenMessage'}>No cities available.</div>;
  }

  return (
    <div className={'worldScreen'}>
      <div className={'worldHubTopBar'}>
        <div className={'worldHubCitySelectWrapper'}>
          <label className={'worldHubCityLabel'} htmlFor="world-city-select">
            City
          </label>
          <select
            id="world-city-select"
            className={'worldHubCitySelect'}
            value={currentCityId ?? ''}
            onChange={(e) => {
              const next = worldSelectorEntries.find((entry) => entry.city.id === e.target.value)?.city;
              if (next) handleSelectCity(next);
            }}
          >
            <option value="" disabled>
              Select a city
            </option>
            {worldSelectorEntries.map(({ city, isUnlocked, requirementText }) => (
              <option key={city.id} value={city.id} disabled={!isUnlocked}>
                {city.name}
                {isUnlocked ? '' : requirementText ? ` — Locked (${requirementText})` : ' — Locked'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCity ? (
        <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
      ) : (
        <div className={'worldScreenDetailWrapper'}>
          <div className={'worldScreenPanel worldScreenCitySummary'}>
            <div className={'worldScreenPanelHeader'}>
              <div className={'worldScreenCitySummaryBody'}>
                <div className={'worldScreenCitySummaryName'}>{selectedCity.name}</div>
                <div
                  className={`worldScreenCitySummaryStatus ${currentCityTravelBlocked ? 'worldScreenCitySummaryStatus--blocked' : ''}`}
                >
                  {currentCityStatusLine}
                </div>
                {cityLesson ? <div className={'worldScreenCitySummaryLesson'}>Phase lesson: {cityLesson}</div> : null}
              </div>
              {trackedBounty && isTrackedModuleActive && (
                <div className={'worldScreenTrackedBanner'}>
                  <div className={'worldScreenTrackedBannerText'}>
                    Tracked bounty: <span className={'worldScreenTrackedName'}>{trackedBounty.title}</span> —{' '}
                    {trackedBounty.progress}/{trackedBounty.target}
                  </div>
                  <button
                    className={'worldScreenTrackedLink'}
                    onClick={() => handleOpenModule('bounties')}
                    type="button"
                  >
                    View bounty board
                  </button>
                </div>
              )}
            </div>
          </div>

          {inCombat && (
            <div className={'worldScreenPanel'}>
              <RecentTechniqueActivations />
            </div>
          )}

          <div className={'worldScreenPanel worldScreenHubPanel'}>
            <CityMapHub
              modules={visibleCityModules}
              activeModuleKey={activeModuleKey}
              getModuleLabel={(moduleKey) => getModuleMeta(moduleKey).label}
              onOpenModule={handleOpenModule}
            />
          </div>
        </div>
      )}
    </div>
  );
}
