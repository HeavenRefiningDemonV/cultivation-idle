import { useEffect, useMemo, useCallback } from 'react';
import type { CityDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import './WorldScreen.scss';
import { RecentTechniqueActivations } from '../combat/RecentTechniqueActivations.js';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import { buildLiveCraftBountyRouteSupportState } from '../../systems/bounties/liveCraftBountyRouteSupport.js';
import { CityMapHub } from './CityMapHub.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import { getCityArrivalLesson, getCityArrivalQuickOpenModules } from '../../systems/world/cityArrivalContract.js';
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
import { getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { buildModulePurposeSourceSurface, buildPurposeSourceContext } from '../../systems/economy/purposeSourceSurface.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import { buildLiveEconomicRecommendationEngine } from '../../systems/economy/economicRecommendationEngine.js';
import { CITY_PACKAGE_REGISTRY_BY_ID } from '../../systems/world/cityPackageRegistry.js';
import { buildWorldCommandSurface, SUPPORT_IDENTITY_LABELS } from '../../systems/ui/world/worldCommandSurface.js';
import { WorldCommandAlert } from '../../ui/world/WorldCommandAlert.js';
import { WorldCommandCard } from '../../ui/world/WorldCommandCard.js';
import { WorldCommandGroup } from '../../ui/world/WorldCommandGroup.js';

const WORLD_SCREEN_HIDDEN_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const EMPTY_CITY_REQUIREMENT_MAP: Readonly<Record<string, string | null>> = Object.freeze({});
const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);

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
  const expeditionSlots = useExpeditionStore((state) => state.slots);
  const expeditionActive = useExpeditionStore((state) => state.active);
  const runCompass = useRunCompassSurface();

  useEffect(() => {
    setHeaderTitles('World', 'Where to go right now');
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
    } catch {
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

  const purposeSourceContext = useMemo(() => (rawContent ? buildPurposeSourceContext(rawContent) : null), [rawContent]);

  const moduleSurfacesByKey = useMemo(() => {
    if (!selectedCity || !rawContent || !purposeSourceContext) return {};
    return Object.fromEntries(
      visibleCityModules
        .map((moduleKey) => buildModulePurposeSourceSurface(rawContent, purposeSourceContext, selectedCity.id, moduleKey as never))
        .filter(Boolean)
        .map((surface) => [surface.moduleKey, surface]),
    );
  }, [purposeSourceContext, rawContent, selectedCity, visibleCityModules]);

  const cityLesson = useMemo(() => {
    if (!selectedCity) return null;
    const lesson = getCityArrivalLesson(selectedCity.id);
    return lesson ? sanitizeLiveCityName(lesson) : null;
  }, [selectedCity]);

  const cityQuickOpenModules = useMemo(() => getCityArrivalQuickOpenModules(visibleCityModules), [visibleCityModules]);

  const citySupportIdentity = useMemo(() => {
    if (!selectedCity) return null;
    const entry = CITY_PACKAGE_REGISTRY_BY_ID[selectedCity.id];
    if (!entry) return null;
    return SUPPORT_IDENTITY_LABELS[entry.leadSupportIdentity] ?? null;
  }, [selectedCity]);

  const runCompassPrimaryAction = runCompass.full?.bestNextActions[0] ?? null;

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
    };
  }, [expeditionActive, expeditionSlots, selectedCity, visibleCityModules]);

  const worldCommandSurface = useMemo(
    () => buildWorldCommandSurface({
      visibleModules: visibleCityModules,
      moduleSurfacesByKey,
      runCompassPrimaryAction,
      economicTopModuleKey: economicPrimary?.cityId === selectedCity?.id ? economicPrimary.moduleKey : null,
      economicReason: economicPrimary?.reason ?? null,
      trackedBountyModuleKey: trackedDestination?.kind === 'module' ? trackedDestination.moduleKey : null,
      trackedBountyAlert: trackedAlert,
      expeditionIdleAlert,
    }),
    [economicPrimary, expeditionIdleAlert, moduleSurfacesByKey, runCompassPrimaryAction, selectedCity?.id, trackedAlert, trackedDestination, visibleCityModules],
  );

  const recommendedHereLine = useMemo(() => {
    if (!selectedCity) return null;
    if (worldCommandSurface.recommendation.moduleKey) {
      return `Recommended here: ${getWorldModuleLabel(worldCommandSurface.recommendation.moduleKey)} — ${worldCommandSurface.recommendation.reason}`;
    }
    return worldCommandSurface.recommendation.reason;
  }, [selectedCity, worldCommandSurface.recommendation]);

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
      if (message) addNotification('warning', message);
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
      <div className={'worldHubTopBar'}>
        <div className={'worldHubCitySelectWrapper'}>
          <label className={'worldHubCityLabel'} htmlFor="world-city-select">City</label>
          <select
            id="world-city-select"
            className={'worldHubCitySelect'}
            value={currentCityId ?? ''}
            onChange={(e) => {
              const next = worldSelectorEntries.find((entry) => entry.city.id === e.target.value)?.city;
              if (next) handleSelectCity(next);
            }}
          >
            <option value="" disabled>Select a city</option>
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
          <section className="worldCommandSummary worldScreenPanel">
            <div className="worldCommandSummaryCity">{sanitizeLiveCityName(selectedCity.name)}</div>
            <div className={`worldScreenCitySummaryStatus ${currentCityTravelBlocked ? 'worldScreenCitySummaryStatus--blocked' : ''}`}>{currentCityStatusLine}</div>
            {cityLesson ? <div className="worldCommandSummaryLine">Phase lesson: {cityLesson}</div> : null}
            {citySupportIdentity ? <div className="worldCommandSummaryLine">City role: {citySupportIdentity}</div> : null}
            {recommendedHereLine ? <div className="worldCommandSummaryRecommended">{recommendedHereLine}</div> : null}
            {cityQuickOpenModules.length > 0 ? (
              <div className="worldCommandQuickOpen">
                {cityQuickOpenModules.map((moduleKey) => (
                  <button key={moduleKey} type="button" className="worldCommandQuickOpenChip" onClick={() => handleOpenModule(moduleKey)}>
                    {getWorldModuleLabel(moduleKey)}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <div className={'worldScreenRunCompassWrapper'}>
            <RunCompass surface={runCompass.full} tone="ink" className="worldScreenRunCompass" onAction={performRunCompassAction} />
          </div>

          {worldCommandSurface.alerts.length > 0 ? (
            <div className="worldCommandAlerts">
              {worldCommandSurface.alerts.map((alert) => (
                <WorldCommandAlert
                  key={alert.id}
                  title={alert.title}
                  detail={alert.detail}
                  ctaLabel={alert.ctaLabel}
                  onCta={() => handleOpenModule(alert.ctaModuleKey)}
                />
              ))}
            </div>
          ) : null}

          <div className="worldCommandDeck">
            {worldCommandSurface.groups.map((group) => (
              <WorldCommandGroup key={group.id} title={group.label}>
                {group.cards.map((card) => (
                  <WorldCommandCard
                    key={card.moduleKey}
                    label={card.moduleLabel}
                    roleTag={card.roleTag}
                    bestUsedWhen={card.bestUsedWhen}
                    outputHint={card.outputHint}
                    recommendedNow={card.recommendedNow}
                    cta={<button type="button" className="worldCommandCardOpen" onClick={() => handleOpenModule(card.moduleKey)}>Open</button>}
                  />
                ))}
              </WorldCommandGroup>
            ))}
          </div>

          <div className={'worldScreenPanel worldScreenHubPanel'}>
            <CityMapHub
              modules={visibleCityModules}
              activeModuleKey={activeModuleKey}
              getModuleLabel={getWorldModuleLabel}
              onOpenModule={handleOpenModule}
            />
          </div>

          {inCombat && (
            <div className={'worldScreenPanel'}>
              <RecentTechniqueActivations />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
