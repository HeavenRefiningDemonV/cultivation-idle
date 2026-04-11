import { useEffect, useMemo, useCallback } from 'react';
import type { CityDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import './WorldScreen.scss';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import { buildLiveCraftBountyRouteSupportState } from '../../systems/bounties/liveCraftBountyRouteSupport.js';
import { CityMapHub } from './CityMapHub.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import { DEFERRED_WORLD_MODULES } from '../../systems/world/liveWorldSchema.js';
import {
  getProgressionContract,
  adaptProgressionAuthoredContent,
} from '../../systems/progression/contract/index.js';
import { getCityUnlockRequirementText } from '../../systems/progression/runtime/cityProgression.js';
import {
  buildWorldCitySelectorEntries,
  getWorldTravelBlockMessage,
  getWorldTravelGuard,
} from '../../systems/world/travelContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../../systems/progression/contract/semesterSlice.js';
import { getLiveRealmNameById } from '../../systems/progression/runtime/liveRealmProjection.js';
import { getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { buildLiveEconomicRecommendationEngine } from '../../systems/economy/economicRecommendationEngine.js';
import { buildWorldModuleRoutingSurface } from '../../systems/ui/world/worldModuleRoutingSurface.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { TopRibbon } from '../../ui/shell/index.js';
import '../../ui/world/WorldModuleCard.scss';

const WORLD_SCREEN_HIDDEN_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);
const LOCK_REQUIREMENT_UNAVAILABLE = 'Requirement unavailable';

function deriveCityRequirementText(city: CityDef): string | null {
  if ((city.index ?? 0) <= 0) return null;
  if (!city.unlockMajorRealm) return null;
  const realmName = getLiveRealmNameById(city.unlockMajorRealm as never);
  return realmName ? `Reach ${realmName}` : null;
}

export function WorldScreen() {
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
  const expeditionSlots = useExpeditionStore((state) => state.slots);
  const expeditionActive = useExpeditionStore((state) => state.active);

  const selectedCity = useMemo(() => {
    if (!currentCityId) return null;
    return citiesSorted.find((city) => city.id === currentCityId) ?? null;
  }, [citiesSorted, currentCityId]);

  const cityRequirementById = useMemo(() => {
    if (!rawContent) {
      return Object.fromEntries(citiesSorted.map((city) => [city.id, deriveCityRequirementText(city)])) as Record<string, string | null>;
    }
    try {
      const contract = getProgressionContract(adaptProgressionAuthoredContent(rawContent));
      return Object.fromEntries(
        citiesSorted.map((city) => [city.id, getCityUnlockRequirementText(contract, city.id) ?? deriveCityRequirementText(city)]),
      ) as Record<string, string | null>;
    } catch {
      return Object.fromEntries(citiesSorted.map((city) => [city.id, deriveCityRequirementText(city)])) as Record<string, string | null>;
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

  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const worldModalKey = useUIStore((state) => state.worldBuildingModalKey);
  const worldModalCityId = useUIStore((state) => state.worldBuildingModalCityId);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const combatPresentation = useUIStore((state) => state.combatPresentation);

  const displayedModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored && visibleCityModules.includes(stored)) return stored;
    return visibleCityModules[0] ?? null;
  }, [selectedCity, selectedModuleByCity, visibleCityModules]);

  const combatModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    if (combatPresentation.mode === 'hidden' || !combatPresentation.context) return null;
    if (combatPresentation.context.cityId && combatPresentation.context.cityId !== selectedCity.id) return null;
    return combatPresentation.context.moduleKey ?? (combatPresentation.context.type === 'trial' ? 'gateTrial' : combatPresentation.context.type);
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
      craftRouteSupportState: buildLiveCraftBountyRouteSupportState(selectedCity.id),
    });
  }, [selectedCity, trackedBounty]);

  useEffect(() => {
    if (!showWorldBuildingModal || !selectedCity) return;
    if (worldModalCityId && worldModalCityId !== selectedCity.id) {
      closeWorldBuildingModal();
    }
  }, [closeWorldBuildingModal, selectedCity, showWorldBuildingModal, worldModalCityId]);

  const economicPrimary = useMemo(() => {
    try {
      const engine = buildLiveEconomicRecommendationEngine();
      const top = engine.topRouteCandidates[0] ?? null;
      if (!top) return null;
      return {
        moduleKey: top.destinationModuleKey,
        cityId: top.destinationCityId,
        reason: top.reasonSummary,
      };
    } catch {
      return null;
    }
  }, [currentCityId, selectedCity?.id, rawContent]);

  const trackedAlert = useMemo(() => {
    if (!trackedBounty || !selectedCity) return null;
    const ctaModuleKey = trackedDestination?.kind === 'module' && visibleCityModules.includes(trackedDestination.moduleKey)
      ? trackedDestination.moduleKey
      : 'bounties';
    return {
      id: 'tracked_bounty' as const,
      title: `Tracked bounty: ${trackedBounty.title}`,
      detail: `${trackedBounty.progress}/${trackedBounty.target} progress`,
      ctaLabel: ctaModuleKey === 'bounties' ? 'View bounty board' : `Open ${getWorldModuleLabel(ctaModuleKey)}`,
      ctaModuleKey,
      chipKind: trackedBounty.progress >= trackedBounty.target && !trackedBounty.claimed ? 'claim_ready' : 'useful_soon',
    };
  }, [trackedBounty, selectedCity, trackedDestination, visibleCityModules]);

  const expeditionIdleAlert = useMemo(() => {
    if (!selectedCity || !visibleCityModules.includes('expeditions')) return null;
    const runningInCity = expeditionActive.filter((entry) => entry.cityId === selectedCity.id && entry.status === 'running').length;
    const idle = Math.max(0, expeditionSlots - runningInCity);
    if (idle <= 0) return null;
    return {
      id: 'expedition_idle' as const,
      title: 'Expedition slot idle',
      detail: `${idle} expedition ${idle === 1 ? 'slot is' : 'slots are'} available right now.`,
      ctaLabel: 'Open Expeditions',
      ctaModuleKey: 'expeditions' as const,
      chipKind: 'idle_slot' as const,
    };
  }, [expeditionActive, expeditionSlots, selectedCity, visibleCityModules]);

  const worldCommandSurface = useMemo(
    () => {
      if (!rawContent || !selectedCity) {
        return { groups: [], alerts: [], strongRecommendationModuleKey: null };
      }
      return buildWorldModuleRoutingSurface({
        content: rawContent,
        cityId: selectedCity.id,
        visibleModules: visibleCityModules as never,
        activeModuleKey,
        runCompassPrimaryModuleKey: null,
        runCompassSecondaryModuleKey: null,
        economicModuleKeys: economicPrimary?.cityId === selectedCity.id && economicPrimary.moduleKey ? [economicPrimary.moduleKey] : [],
        economicPrimaryProblemKind: buildLiveEconomicRecommendationEngine().topRouteCandidates[0]?.problemKind ?? null,
        trackedBountyModuleKey: trackedDestination?.kind === 'module' ? trackedDestination.moduleKey as never : null,
        trackedBountyAlert: trackedAlert,
        expeditionIdleAlert,
        readyBountyCount: currentCityId ? (activeByCityId[currentCityId] ?? []).filter((entry) => entry.progress >= entry.target && !entry.claimed).length : 0,
        idleExpeditionSlots: Math.max(0, expeditionSlots - expeditionActive.filter((entry) => entry.cityId === selectedCity.id && entry.status === 'running').length),
      });
    },
    [activeByCityId, activeModuleKey, currentCityId, economicPrimary, expeditionActive, expeditionIdleAlert, expeditionSlots, rawContent, selectedCity, trackedAlert, trackedDestination, visibleCityModules],
  );

  const moduleMetadataByKey = useMemo(() => {
    const byModuleKey: Record<string, {
      roleTag: string;
      bestUsedWhen: string;
      outputs: readonly string[];
      chipKind: WorldRoutingChipKind | null;
    }> = {};
    for (const group of worldCommandSurface.groups) {
      for (const card of group.cards) {
        byModuleKey[card.moduleKey] = {
          roleTag: card.roleTag,
          bestUsedWhen: card.bestUsedWhen,
          outputs: card.outputs,
          chipKind: card.chips[0]?.kind ?? null,
        };
      }
    }
    return byModuleKey;
  }, [worldCommandSurface.groups]);

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
      if (travelGuard.reason === 'city-locked') {
        const requirement = cityRequirementById[city.id] ?? deriveCityRequirementText(city) ?? LOCK_REQUIREMENT_UNAVAILABLE;
        addNotification('warning', `${sanitizeLiveCityName(city.name)} is locked (${requirement}).`);
        return;
      }
      const message = getWorldTravelBlockMessage(travelGuard.reason);
      if (message) addNotification('warning', message);
      return;
    }

    setCurrentCity(city.id);
  };

  const handleRouteToModule = useCallback(
    (moduleKey: string) => {
      if (!selectedCity) return;
      if (!visibleCityModules.includes(moduleKey)) return;
      openWorldModule({ cityId: selectedCity.id, moduleKey, source: 'world-map' });
    },
    [selectedCity, visibleCityModules],
  );

  if (isLoading) return <div className={'worldScreen worldScreenMessage'}>Loading content...</div>;

  if (error) {
    return (
      <div className={'worldScreen worldScreenMessage worldScreenMessageError'}>
        <div>Content failed to load.</div>
        <div className={'worldScreenErrorText'}>{error}</div>
      </div>
    );
  }

  if (!isLoaded || citiesSorted.length === 0) return <div className={'worldScreen worldScreenMessage'}>No cities available.</div>;

  return (
    <div className={'worldScreen'}>
      {!selectedCity ? (
        <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
      ) : (
        <div className={'worldScreenDetailWrapper'}>
          <div className="worldScreenCanvas">
            <div className="worldScreenMapLayer">
              <CityMapHub
                modules={visibleCityModules}
                activeModuleKey={activeModuleKey}
                recommendedModuleKey={worldCommandSurface.strongRecommendationModuleKey}
                moduleMetadataByKey={moduleMetadataByKey}
                getModuleLabel={getWorldModuleLabel}
                onOpenModule={handleRouteToModule}
              />
            </div>

            <div className="worldScreenRibbonLayer">
              <TopRibbon
                className="worldTopRibbon worldTopRibbon--overlay"
                variant="world"
                density="compact"
                tone="ink"
                title="World"
                endSlot={
                  <div className="worldTopRibbon__cityList worldTopRibbon__cityList--overlay" role="group" aria-label="City selector">
                    {worldSelectorEntries.map(({ city, isUnlocked, isCurrent, requirementText }) => (
                      <button
                        key={city.id}
                        type="button"
                        className={`worldTopRibbon__cityChip uiNoShift ${isCurrent ? 'worldTopRibbon__cityChip--current' : ''} ${!isUnlocked ? 'worldTopRibbon__cityChip--locked' : ''}`}
                        onClick={() => handleSelectCity(city)}
                        aria-current={isCurrent ? 'true' : undefined}
                        aria-disabled={!isUnlocked ? 'true' : undefined}
                        title={isUnlocked ? `Travel to ${sanitizeLiveCityName(city.name)}` : `${sanitizeLiveCityName(city.name)} locked: ${requirementText ?? deriveCityRequirementText(city) ?? LOCK_REQUIREMENT_UNAVAILABLE}`}
                      >
                        <span className="worldTopRibbon__cityChipName">{sanitizeLiveCityName(city.name)}</span>
                      </button>
                    ))}
                  </div>
                }
              />
            </div>

            <div className="worldScreenInspectorLayer" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}
