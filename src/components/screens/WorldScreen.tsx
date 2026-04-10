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
import { buildCityPhaseTeachingSurface, getCityArrivalQuickOpenModules } from '../../systems/world/cityArrivalContract.js';
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
import { getShellTabLabel, getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import { buildLiveEconomicRecommendationEngine } from '../../systems/economy/economicRecommendationEngine.js';
import { CITY_PACKAGE_REGISTRY_BY_ID, getSupportIdentityLabel } from '../../systems/world/cityPackageRegistry.js';
import { buildWorldModuleRoutingSurface } from '../../systems/ui/world/worldModuleRoutingSurface.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { WorldCommandAlert } from '../../ui/world/WorldCommandAlert.js';
import { WorldModuleCard } from '../../ui/world/WorldModuleCard.js';
import { WorldModuleGroup } from '../../ui/world/WorldModuleGroup.js';
import { WorldRouteChip } from '../../ui/world/WorldRouteChip.js';
import { InlineOnboardingCallout } from '../system/InlineOnboardingCallout.js';
import { InspectorDrawer, InspectorPanel, TopRibbon } from '../../ui/shell/index.js';
import { ONBOARDING_INLINE_LIFE_KEYS } from '../../systems/ui/onboardingPromptRegistry.js';
import '../../ui/world/WorldModuleCard.scss';

const WORLD_SCREEN_HIDDEN_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);
const WORLD_INSPECTOR_NARROW_QUERY = '(max-width: 1180px)';
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
  const runCompass = useRunCompassSurface();
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [isNarrowInspectorLayout, setIsNarrowInspectorLayout] = useState(false);
  const [isCommandDeckExpanded, setIsCommandDeckExpanded] = useState(false);

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

  const cityQuickOpenModules = useMemo(() => getCityArrivalQuickOpenModules(visibleCityModules), [visibleCityModules]);

  const citySupportIdentity = useMemo(() => {
    if (!selectedCity) return null;
    const entry = CITY_PACKAGE_REGISTRY_BY_ID[selectedCity.id];
    if (!entry) return null;
    return getSupportIdentityLabel(entry.leadSupportIdentity);
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

  const currentCityPhaseTeaching = useMemo(() => {
    if (!selectedCity) return null;
    const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID[selectedCity.id] ?? null;
    const ruinNameRaw = registryEntry?.leadRuinId
      ? rawContent?.ruins.find((entry) => entry.id === registryEntry.leadRuinId)?.name ?? null
      : null;
    const gateTrialNameRaw = registryEntry?.leadGateTrialId
      ? rawContent?.trials.find((entry) => entry.id === registryEntry.leadGateTrialId)?.name ?? null
      : null;

    return buildCityPhaseTeachingSurface({
      cityId: selectedCity.id,
      cityName: sanitizeLiveCityName(selectedCity.name),
      modules: selectedCity.modules,
      ruinName: ruinNameRaw ? sanitizeLiveCityName(ruinNameRaw) : null,
      gateTrialName: gateTrialNameRaw ? sanitizeLiveCityName(gateTrialNameRaw) : null,
      supportIdentityLabel: citySupportIdentity,
    });
  }, [citySupportIdentity, rawContent?.ruins, rawContent?.trials, selectedCity]);

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
        readyBountyCount: currentCityId ? (activeByCityId[currentCityId] ?? []).filter((entry) => entry.progress >= entry.target && !entry.claimed).length : 0,
        idleExpeditionSlots: Math.max(0, expeditionSlots - expeditionActive.filter((entry) => entry.cityId === selectedCity.id && entry.status === 'running').length),
      });
    },
    [activeByCityId, activeModuleKey, currentCityId, economicPrimary, expeditionActive, expeditionIdleAlert, expeditionSlots, rawContent, runCompassPrimaryAction, runCompassSecondaryAction, selectedCity, trackedAlert, trackedDestination, visibleCityModules],
  );

  const recommendedHereLine = useMemo(() => {
    if (!selectedCity) return null;
    if (worldCommandSurface.strongRecommendationModuleKey) {
      return `Recommended here now: ${getWorldModuleLabel(worldCommandSurface.strongRecommendationModuleKey)}.`;
    }
    return null;
  }, [selectedCity, worldCommandSurface.strongRecommendationModuleKey]);

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

  const selectedInspectorSubject = useMemo(() => {
    const cards = worldCommandSurface.groups.flatMap((group) => group.cards);
    if (cards.length === 0) return null;
    const activeCard = cards.find((card) => card.moduleKey === activeModuleKey) ?? null;
    const card = activeCard ?? cards[0] ?? null;
    if (!card) return null;

    const recommendationCard = worldCommandSurface.strongRecommendationModuleKey
      ? cards.find((entry) => entry.moduleKey === worldCommandSurface.strongRecommendationModuleKey) ?? null
      : null;

    let supportLine: string | null = null;
    if (trackedAlert && trackedAlert.ctaModuleKey === card.moduleKey) {
      supportLine = trackedAlert.title;
    } else if (expeditionIdleAlert && expeditionIdleAlert.ctaModuleKey === card.moduleKey) {
      supportLine = expeditionIdleAlert.title;
    }

    return {
      moduleKey: card.moduleKey,
      label: card.label,
      roleTag: card.roleTag,
      bestUsedWhen: card.bestUsedWhen,
      outputs: card.outputs.slice(0, 2),
      openLabel: card.openLabel,
      chips: card.chips.slice(0, 2),
      isStrongRecommendation: worldCommandSurface.strongRecommendationModuleKey === card.moduleKey,
      recommendationLabel: recommendationCard ? recommendationCard.label : null,
      supportLine,
    };
  }, [activeModuleKey, expeditionIdleAlert, trackedAlert, worldCommandSurface.groups, worldCommandSurface.strongRecommendationModuleKey]);

  const inspectorStatusArea = (
    <div className="worldInspectorStatusLine">
      <strong>{sanitizeLiveCityName(selectedCity?.name ?? 'City')}</strong>
      <span className="worldInspectorStatusSeparator" aria-hidden="true">•</span>
      <span>{currentCityStatusLine}</span>
    </div>
  );

  const inspectorRecommendationArea = recommendedHereLine ? (
    <div className="worldInspectorRecommendationLine">Recommendation: {recommendedHereLine}</div>
  ) : (
    <div className="worldInspectorRecommendationLine worldInspectorRecommendationLine--muted">
      No strong module recommendation right now.
    </div>
  );

  const worldCommandBandCitySummary = selectedCity ? (
    <section className="worldCommandSummary worldCommandSummary--cityContext worldScreenCommandBandCitySummary">
      <div className="worldCommandSummarySectionLabel">Current city</div>
      <div className="worldCommandSummaryCity">{currentCityPhaseTeaching?.cityName ?? sanitizeLiveCityName(selectedCity.name)}</div>
      {currentCityPhaseTeaching?.roleStatement ? <div className="worldCommandSummaryLine">City role: {currentCityPhaseTeaching.roleStatement}</div> : null}
      {currentCityPhaseTeaching?.lessonShort ? <div className="worldCommandSummaryLine">Phase lesson: {currentCityPhaseTeaching.lessonShort}</div> : null}
      <div className="worldCommandSummaryLine">Status: {currentCityStatusLine}</div>
      {cityQuickOpenModules.length > 0 ? (
        <div className="worldCommandQuickOpen" aria-label="City quick open">
          {cityQuickOpenModules.map((moduleKey) => (
            <button key={moduleKey} type="button" className="worldCommandQuickOpenChip" onClick={() => handleRouteToModule(moduleKey)}>
              {getWorldModuleLabel(moduleKey)}
            </button>
          ))}
        </div>
      ) : null}
      {showWorldInlineHint ? (
        <InlineOnboardingCallout
          className="worldCommandSummaryInlineHint"
          title="Use World to route the loop"
          body="Outskirts feed gold and common mats. Ruins feed targeted local mats. Gate Trial is the milestone wall."
          actionLabel={visibleCityModules.includes('outskirts') ? 'Open Outskirts' : null}
          onAction={visibleCityModules.includes('outskirts') ? () => handleRouteToModule('outskirts') : undefined}
          onDismiss={() => dismissOnboardingLifeKey(ONBOARDING_INLINE_LIFE_KEYS.worldLoop)}
        />
      ) : null}
    </section>
  ) : null;

  const worldInspectorBody = selectedCity ? (
    <>
      {selectedInspectorSubject ? (
        <section className="worldCommandSummary worldCommandSummary--selectedModule">
          <div className="worldCommandSummaryHeader">
            <div>
              <div className="worldCommandSummarySectionLabel">Selected building</div>
              <div className="worldCommandSummaryCity">{selectedInspectorSubject.label}</div>
            </div>
            <div className="worldCommandSummaryTag">{selectedInspectorSubject.roleTag}</div>
          </div>
          <div className="worldCommandSummaryChipRow">
            <div className="worldCommandSummaryChipSlot">
              {selectedInspectorSubject.chips[0] ? <WorldRouteChip kind={selectedInspectorSubject.chips[0].kind} tone={selectedInspectorSubject.chips[0].tone} /> : null}
            </div>
            <div className="worldCommandSummaryChipSlot">
              {selectedInspectorSubject.chips[1] ? <WorldRouteChip kind={selectedInspectorSubject.chips[1].kind} tone={selectedInspectorSubject.chips[1].tone} /> : null}
            </div>
          </div>
          <p className="worldCommandSummaryLine worldCommandSummaryLine--primary">{selectedInspectorSubject.bestUsedWhen}</p>
          <ul className="worldCommandSummaryOutputs">
            {selectedInspectorSubject.outputs.map((output) => (
              <li key={output}>{output}</li>
            ))}
          </ul>
          <button
            type="button"
            className="worldScreenModuleButton worldScreenModuleButton--direct"
            onClick={() => handleRouteToModule(selectedInspectorSubject.moduleKey)}
          >
            {selectedInspectorSubject.openLabel}
          </button>
          {selectedInspectorSubject.isStrongRecommendation ? (
            <div className="worldCommandSummarySupportLine">Recommended now in this city.</div>
          ) : selectedInspectorSubject.recommendationLabel ? (
            <div className="worldCommandSummarySupportLine">Recommended now: {selectedInspectorSubject.recommendationLabel}.</div>
          ) : null}
          {selectedInspectorSubject.supportLine ? <div className="worldCommandSummarySupportLine">{selectedInspectorSubject.supportLine}</div> : null}
        </section>
      ) : null}

      <section className="worldCommandSummary worldCommandSummary--cityContext worldCommandSummary--cityContextSecondary">
        <div className="worldCommandSummarySectionLabel">Current city context</div>
        <div className="worldCommandSummaryCity">{currentCityPhaseTeaching?.cityName ?? sanitizeLiveCityName(selectedCity.name)}</div>
        {currentCityPhaseTeaching?.roleStatement ? <div className="worldCommandSummaryLine">City role: {currentCityPhaseTeaching.roleStatement}</div> : null}
        {currentCityPhaseTeaching?.lessonShort ? <div className="worldCommandSummaryLine">Phase: {currentCityPhaseTeaching.lessonShort}</div> : null}
        {currentCityPhaseTeaching?.supportIdentityLabel ? <div className="worldCommandSummaryLine">Support identity: {currentCityPhaseTeaching.supportIdentityLabel}</div> : null}
      </section>

      <div className="worldInspectorAlertEmpty">Shortcut alerts stay in the command band above the map.</div>
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
      <TopRibbon
        className="worldTopRibbon"
        variant="world"
        density="compact"
        tone="ink"
        title={getShellTabLabel('adventure')}
        endSlot={
          <div className="worldTopRibbon__citySelectWrapper" role="group" aria-label="City selector">
            <div className="worldTopRibbon__cityList">
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
                  {isCurrent ? (
                    <span className="worldTopRibbon__cityChipMeta">Current city</span>
                  ) : isUnlocked ? (
                    <span className="worldTopRibbon__cityChipMeta">Unlocked</span>
                  ) : (
                    <span className="worldTopRibbon__cityChipMeta">Locked · {requirementText ?? deriveCityRequirementText(city) ?? LOCK_REQUIREMENT_UNAVAILABLE}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {!selectedCity ? (
        <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
      ) : (
        <div className={'worldScreenDetailWrapper'}>
          <section className="worldScreenCommandBand" aria-label="World command band">
            <div className="worldScreenCommandBandCore">
              <div className={'worldScreenRunCompassWrapper'}>
                <RunCompass surface={runCompass.full} tone="ink" className="worldScreenRunCompass" onAction={performRunCompassAction} />
              </div>
              {worldCommandBandCitySummary}
            </div>
            {worldCommandSurface.alerts.length > 0 ? (
              <section className="worldScreenAlerts worldScreenAlerts--aboveFold" aria-label="World support alerts">
                {worldCommandSurface.alerts.map((alert) => (
                  <div key={alert.id} className="worldScreenAlertCard">
                    <WorldCommandAlert
                      title={alert.title}
                      detail={alert.detail}
                      ctaLabel={alert.ctaLabel}
                      onCta={() => handleRouteToModule(alert.ctaModuleKey)}
                    />
                    {alert.chipKind ? <WorldRouteChip kind={alert.chipKind} tone="support" /> : null}
                  </div>
                ))}
              </section>
            ) : (
              <div className="worldScreenCommandBandEmpty">No urgent shortcuts right now.</div>
            )}
          </section>

          <div className="worldScreenShellLayout">
            <div className="worldScreenMainRegion">
              <div className="worldScreenHubShell">
                <div className={'worldScreenPanel worldScreenHubPanel'}>
                  <CityMapHub
                    modules={visibleCityModules}
                    activeModuleKey={activeModuleKey}
                    recommendedModuleKey={worldCommandSurface.strongRecommendationModuleKey}
                    moduleMetadataByKey={moduleMetadataByKey}
                    getModuleLabel={getWorldModuleLabel}
                    onOpenModule={handleRouteToModule}
                  />
                </div>
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
                  density="compact"
                  emptyZoneBehavior="collapse"
                  statusArea={inspectorStatusArea}
                  recommendationArea={inspectorRecommendationArea}
                  sticky
                >
                  {worldInspectorBody}
                </InspectorPanel>
              </div>
            ) : null}
          </div>

          <section className="worldScreenSupportSlot" aria-label="World module routing deck">
            <section className="worldCommandDeckDisclosure" aria-label="World module routing deck">
              <button
                type="button"
                className="worldCommandDeckDisclosureButton uiNoShift"
                aria-expanded={isCommandDeckExpanded}
                onClick={() => setIsCommandDeckExpanded((current) => !current)}
              >
                {isCommandDeckExpanded ? 'Hide module routing deck' : 'Show module routing deck'}
              </button>
              {isCommandDeckExpanded ? (
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
                          onOpen={handleRouteToModule as never}
                        />
                      ))}
                    </WorldModuleGroup>
                  ))}
                </div>
              ) : null}
            </section>
          </section>

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
              density="compact"
              emptyZoneBehavior="collapse"
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
