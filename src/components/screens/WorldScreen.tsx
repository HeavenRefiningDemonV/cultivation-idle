import { useEffect, useMemo, useCallback, useState } from 'react';
import type { CityDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
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
import { getShellTabLabel, getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import { buildLiveEconomicRecommendationEngine } from '../../systems/economy/economicRecommendationEngine.js';
import { CITY_PACKAGE_REGISTRY_BY_ID } from '../../systems/world/cityPackageRegistry.js';
import { SUPPORT_IDENTITY_LABELS } from '../../systems/ui/world/worldCommandSurface.js';
import { buildWorldModuleRoutingSurface } from '../../systems/ui/world/worldModuleRoutingSurface.js';
import { WorldCommandAlert } from '../../ui/world/WorldCommandAlert.js';
import { WorldModuleCard } from '../../ui/world/WorldModuleCard.js';
import { WorldModuleGroup } from '../../ui/world/WorldModuleGroup.js';
import { WorldRouteChip } from '../../ui/world/WorldRouteChip.js';
import { InlineOnboardingCallout } from '../system/InlineOnboardingCallout.js';
import { InspectorDrawer, InspectorPanel, TopRibbon } from '../../ui/shell/index.js';
import { ONBOARDING_INLINE_LIFE_KEYS } from '../../systems/ui/onboardingPromptRegistry.js';
import '../../ui/world/WorldModuleCard.scss';

const WORLD_SCREEN_HIDDEN_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const EMPTY_CITY_REQUIREMENT_MAP: Readonly<Record<string, string | null>> = Object.freeze({});
const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);
const WORLD_INSPECTOR_NARROW_QUERY = '(max-width: 1180px)';

export function WorldScreen() {
  const addNotification = useUIStore((state) => state.addNotification);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);
  const citiesSorted = useContentStore((state) => state.citiesSorted);
  const rawContent = useContentStore((state) => state.raw);

  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const acknowledgedArrivalCityIds = useCityStore((state) => state.acknowledgedArrivalCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const setCurrentCity = useCityStore((state) => state.setCurrentCity);
  const activeByCityId = useBountyStore((state) => state.activeByCityId);
  const trackedByCityId = useBountyStore((state) => state.trackedByCityId);
  const inCombat = useCombatStore((state) => state.inCombat);
  const activeActivityType = useActivityStore((state) => state.active?.type ?? null);
  const expeditionSlots = useExpeditionStore((state) => state.slots);
  const expeditionActive = useExpeditionStore((state) => state.active);
  const runCompass = useRunCompassSurface();
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [isNarrowInspectorLayout, setIsNarrowInspectorLayout] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia(WORLD_INSPECTOR_NARROW_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrowInspectorLayout(event.matches);
      if (!event.matches) {
        setInspectorDrawerOpen(false);
      }
    };
    setIsNarrowInspectorLayout(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

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
  const activeOnboardingPrompt = useUIStore((state) => state.activeOnboardingPrompt);
  const queuedOnboardingPrompts = useUIStore((state) => state.queuedOnboardingPrompts);
  const onboardingLifeKeys = useUIStore((state) => state.dismissedOnboardingLifeKeys);
  const dismissOnboardingLifeKey = useUIStore((state) => state.dismissOnboardingLifeKey);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);

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
  const runCompassSecondaryAction = runCompass.full?.bestNextActions[1] ?? null;

  const showWorldInlineHint = useMemo(() => {
    if (!selectedCity) return false;
    const dismissed = onboardingLifeKeys.includes(ONBOARDING_INLINE_LIFE_KEYS.worldLoop);
    if (dismissed) return false;
    const pinewindFocus = selectedCity.id === 'city_pinewind_hamlet' || prestigeCount === 0;
    if (!pinewindFocus) return false;
    const firstPinewindPromptActive = activeOnboardingPrompt?.promptId === 'first_pinewind_arrival';
    const firstPinewindPromptQueued = queuedOnboardingPrompts.some((entry) => entry.promptId === 'first_pinewind_arrival');
    return !firstPinewindPromptActive && !firstPinewindPromptQueued;
  }, [activeOnboardingPrompt?.promptId, onboardingLifeKeys, prestigeCount, queuedOnboardingPrompts, selectedCity]);

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

  const newCityAlert = useMemo(() => {
    if (!selectedCity || acknowledgedArrivalCityIds.includes(selectedCity.id)) return null;
    return {
      id: 'new_city' as const,
      title: `${sanitizeLiveCityName(selectedCity.name)} is newly unlocked`,
      detail: 'Quick-open the combat learning loop modules in this city.',
      ctaLabel: 'Open Outskirts',
      ctaModuleKey: 'outskirts' as const,
      chipKind: 'new_city' as const,
    };
  }, [acknowledgedArrivalCityIds, selectedCity]);

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
        runCompassPrimaryModuleKey:
          runCompassPrimaryAction?.target?.kind === 'world_module' ? runCompassPrimaryAction.target.moduleKey ?? null : null,
        runCompassSecondaryModuleKey:
          runCompassSecondaryAction?.target?.kind === 'world_module' ? runCompassSecondaryAction.target.moduleKey ?? null : null,
        economicModuleKeys: economicPrimary?.cityId === selectedCity.id && economicPrimary.moduleKey ? [economicPrimary.moduleKey] : [],
        economicPrimaryProblemKind: buildLiveEconomicRecommendationEngine().topRouteCandidates[0]?.problemKind ?? null,
        trackedBountyModuleKey: trackedDestination?.kind === 'module' ? trackedDestination.moduleKey as never : null,
        trackedBountyAlert: trackedAlert,
        expeditionIdleAlert,
        newCityAlert,
        readyBountyCount: currentCityId ? (activeByCityId[currentCityId] ?? []).filter((entry) => entry.progress >= entry.target && !entry.claimed).length : 0,
        idleExpeditionSlots: Math.max(0, expeditionSlots - expeditionActive.filter((entry) => entry.cityId === selectedCity.id && entry.status === 'running').length),
      });
    },
    [activeByCityId, activeModuleKey, currentCityId, economicPrimary, expeditionActive, expeditionIdleAlert, expeditionSlots, newCityAlert, rawContent, runCompassPrimaryAction, runCompassSecondaryAction, selectedCity, trackedAlert, trackedDestination, visibleCityModules],
  );

  const recommendedHereLine = useMemo(() => {
    if (!selectedCity) return null;
    if (worldCommandSurface.strongRecommendationModuleKey) {
      return `Recommended here now: ${getWorldModuleLabel(worldCommandSurface.strongRecommendationModuleKey)}.`;
    }
    return null;
  }, [selectedCity, worldCommandSurface.strongRecommendationModuleKey]);

  const inspectorStatusArea = (
    <div className="worldInspectorStatusLine">
      <strong>{sanitizeLiveCityName(selectedCity?.name ?? 'City')}</strong>
      <span>{currentCityStatusLine}</span>
    </div>
  );

  const inspectorRecommendationArea = recommendedHereLine ? (
    <div className="worldInspectorRecommendationLine">{recommendedHereLine}</div>
  ) : (
    <div className="worldInspectorRecommendationLine worldInspectorRecommendationLine--muted">
      No strong module recommendation right now.
    </div>
  );

  const worldInspectorBody = selectedCity ? (
    <>
      <section className="worldCommandSummary worldScreenPanel">
        <div className="worldCommandSummaryCity">{sanitizeLiveCityName(selectedCity.name)}</div>
        {cityLesson ? <div className="worldCommandSummaryLine">Phase lesson: {cityLesson}</div> : null}
        {citySupportIdentity ? <div className="worldCommandSummaryLine">City role: {citySupportIdentity}</div> : null}
        {showWorldInlineHint ? (
          <InlineOnboardingCallout
            className="worldCommandSummaryInlineHint"
            title="Use World to route the loop"
            body="Outskirts feed gold and common mats. Ruins feed targeted local mats. Gate Trial is the milestone wall."
            actionLabel={visibleCityModules.includes('outskirts') ? 'Open Outskirts' : null}
            onAction={visibleCityModules.includes('outskirts') ? () => handleOpenModule('outskirts') : undefined}
            onDismiss={() => dismissOnboardingLifeKey(ONBOARDING_INLINE_LIFE_KEYS.worldLoop)}
          />
        ) : null}
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
        <div className="worldScreenAlerts">
          {worldCommandSurface.alerts.map((alert) => (
            <div key={alert.id} className="worldScreenAlertCard">
              <WorldCommandAlert
                title={alert.title}
                detail={alert.detail}
                ctaLabel={alert.ctaLabel}
                onCta={() => handleOpenModule(alert.ctaModuleKey)}
              />
              {alert.chipKind ? <WorldRouteChip kind={alert.chipKind} tone="support" /> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="worldInspectorAlertEmpty">No urgent alerts right now.</div>
      )}
    </>
  ) : null;

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
      <TopRibbon
        className="worldTopRibbon"
        variant="world"
        density="compact"
        tone="ink"
        title={getShellTabLabel('adventure')}
        subtitle="Choose your current city and route your loop."
        endSlot={
          <div className="worldTopRibbon__citySelectWrapper">
            <label className="worldTopRibbon__cityLabel" htmlFor="world-city-select">City</label>
            <select
              id="world-city-select"
              className="worldTopRibbon__citySelect"
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
        }
      />

      {!selectedCity ? (
        <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
      ) : (
        <div className={'worldScreenDetailWrapper'}>
          <div className="worldScreenShellLayout">
            <div className="worldScreenMainRegion">
              <div className="worldScreenHubShell">
                <div className="worldScreenHubShellHeader">
                  <h2 className="worldScreenHubShellTitle">City Map</h2>
                  <p className="worldScreenHubShellSubtitle">Map ownership is primary. Command cards below are support routing only.</p>
                </div>
                <div className={'worldScreenPanel worldScreenHubPanel'}>
                  <CityMapHub
                    modules={visibleCityModules}
                    activeModuleKey={activeModuleKey}
                    recommendedModuleKey={worldCommandSurface.strongRecommendationModuleKey}
                    getModuleLabel={getWorldModuleLabel}
                    onOpenModule={handleOpenModule}
                  />
                </div>
              </div>

              <div className="worldCommandDeck worldCommandDeck--subordinate">
                {worldCommandSurface.groups.map((group) => (
                  <WorldModuleGroup key={group.id} title={group.label}>
                    {group.cards.map((card) => (
                      <WorldModuleCard
                        key={card.moduleKey}
                        moduleKey={card.moduleKey}
                        moduleName={card.label}
                        roleTag={card.roleTag}
                        bestUsedWhen={card.bestUsedWhen}
                        outputs={card.outputs}
                        chips={card.chips}
                        active={card.active}
                        openLabel={card.openLabel}
                        onOpen={handleOpenModule as never}
                    />
                    ))}
                  </WorldModuleGroup>
                ))}
              </div>

              {isNarrowInspectorLayout ? (
                <button
                  type="button"
                  className="worldInspectorDrawerButton uiNoShift"
                  onClick={() => setInspectorDrawerOpen(true)}
                >
                  Open World Details
                </button>
              ) : null}

              {inCombat && (
                <div className={'worldScreenPanel'}>
                  <RecentTechniqueActivations />
                </div>
              )}
            </div>

            {!isNarrowInspectorLayout ? (
              <div className="worldScreenInspectorRegion">
                <InspectorPanel
                  className="worldScreenInspector"
                  variant="world"
                  title="World Details"
                  subtitle="Context, compass, and urgent route alerts"
                  statusArea={inspectorStatusArea}
                  recommendationArea={inspectorRecommendationArea}
                  sticky
                >
                  {worldInspectorBody}
                </InspectorPanel>
              </div>
            ) : null}
          </div>

          <InspectorDrawer
            open={isNarrowInspectorLayout && inspectorDrawerOpen}
            onClose={() => setInspectorDrawerOpen(false)}
            title="World Details"
            headerMode="close-only"
            hostAttrs={{
              'data-world-inspector-drawer': 'narrow-fallback',
            }}
          >
            <InspectorPanel
              className="worldScreenInspector worldScreenInspector--drawer"
              variant="world"
              title="World Details"
              subtitle="Context, compass, and urgent route alerts"
              statusArea={inspectorStatusArea}
              recommendationArea={inspectorRecommendationArea}
            >
              {worldInspectorBody}
            </InspectorPanel>
          </InspectorDrawer>
        </div>
      )}
    </div>
  );
}
