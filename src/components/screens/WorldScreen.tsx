import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import type { CityDef, LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useOnboardingStore } from '../../stores/onboardingStore.js';
import './WorldScreen.scss';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import { buildLiveCraftBountyRouteSupportState } from '../../systems/bounties/liveCraftBountyRouteSupport.js';
import { CityMapHub, type WorldHotspotChipKind } from './CityMapHub.js';
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
import {
  buildLiveEconomicRecommendationEngine,
  buildMilestoneReadinessScreenGuidance,
  buildMilestoneReadinessSurface,
} from '../../systems/economy/index.js';
import { buildWorldModuleRoutingSurface } from '../../systems/ui/world/worldModuleRoutingSurface.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { WorldOverlayRibbon } from '../../ui/world/WorldOverlayRibbon.js';
import { WorldOverlayInspector } from '../../ui/world/WorldOverlayInspector.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import { InspectorDrawer } from '../../ui/shell/InspectorDrawer.js';
import { buildWorldCombatHandoffSurface } from '../../systems/world/worldCombatHandoff.js';
import { resolveWorldInspectorBoundaryLine } from '../../systems/ui/world/worldInspectorSurface.js';
import { buildCityPhaseSurfaceFromSnapshot } from '../../systems/world/cityPhaseSurface.js';
import { buildOnboardingWorldModulePolicy } from '../../systems/onboarding/onboardingWorldModulePolicy.js';
import { isOnboardingExactFixtureOrCaptureModeEnabled } from '../../systems/onboarding/onboardingRouteGuards.js';

const EMPTY_VISIBLE_CITY_MODULES: readonly string[] = Object.freeze([]);
const LOCK_REQUIREMENT_UNAVAILABLE = 'Requirement unavailable';
const HOTSPOT_CUE_PRIORITY: Record<WorldHotspotChipKind, number> = {
  GATE: 0,
  NOW: 1,
  FIX: 2,
  LOW: 3,
  CLAIM: 4,
  IDLE: 5,
  SOON: 6,
};
const ROUTING_CHIP_TO_HOTSPOT_CUE: Partial<Record<WorldRoutingChipKind, WorldHotspotChipKind>> = {
  recommended_now: 'NOW',
  useful_soon: 'SOON',
  claim_ready: 'CLAIM',
  idle_slot: 'IDLE',
  build_fix: 'FIX',
  gate_critical: 'GATE',
  stock_low: 'LOW',
};

function deriveCityRequirementText(city: CityDef): string | null {
  if ((city.index ?? 0) <= 0) return null;
  if (!city.unlockMajorRealm) return null;
  const realmName = getLiveRealmNameById(city.unlockMajorRealm as never);
  return realmName ? `Reach ${realmName}` : null;
}

export function WorldScreen() {
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);
  const citiesSorted = useContentStore((state) => state.citiesSorted);
  const rawContent = useContentStore((state) => state.raw);

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

  return <LoadedWorldScreen citiesSorted={citiesSorted} rawContent={rawContent} />;
}

interface LoadedWorldScreenProps {
  citiesSorted: CityDef[];
  rawContent: ValidatedContent | null;
}

function LoadedWorldScreen({ citiesSorted, rawContent }: LoadedWorldScreenProps) {
  const addNotification = useUIStore((state) => state.addNotification);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const acknowledgedArrivalCityIds = useCityStore((state) => state.acknowledgedArrivalCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const setSelectedModule = useCityStore((state) => state.setSelectedModule);
  const setCurrentCity = useCityStore((state) => state.setCurrentCity);
  const activeByCityId = useBountyStore((state) => state.activeByCityId);
  const trackedByCityId = useBountyStore((state) => state.trackedByCityId);
  const inCombat = useCombatStore((state) => state.inCombat);
  const activeActivityType = useActivityStore((state) => state.active?.type ?? null);
  const expeditionSlots = useExpeditionStore((state) => state.slots);
  const expeditionActive = useExpeditionStore((state) => state.active);
  const { effectiveQuality, prefersReducedMotion } = useFxQuality();

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

  const currentRealmIndex = useGameStore((state) => state.realm.index);
  const onboardingActiveMilestoneId = useOnboardingStore((state) => state.activeMilestoneId);
  const onboardingUnlockedWorldModules = useOnboardingStore((state) => state.unlockedWorldModules);
  const onboardingTeaserWorldModules = useOnboardingStore((state) => state.teaserWorldModules);
  const onboardingFirstLifeOnlyComplete = useOnboardingStore((state) => state.firstLifeOnlyComplete);
  const onboardingDevOverride = useOnboardingStore((state) => state.devOverride);

  const worldModulePolicy = useMemo(() => {
    if (!selectedCity) return null;
    return buildOnboardingWorldModulePolicy({
      activeMilestoneId: onboardingActiveMilestoneId,
      unlockedWorldModules: onboardingUnlockedWorldModules,
      teaserWorldModules: onboardingTeaserWorldModules,
      selectedCityModuleKeys: selectedCity.modules,
      deferredWorldModuleKeys: DEFERRED_WORLD_MODULES,
      firstLifeOnlyComplete: onboardingFirstLifeOnlyComplete,
      devOverride: onboardingDevOverride,
      isExistingAdvancedSave: currentRealmIndex > 0,
      exactFixtureOrCaptureMode: isOnboardingExactFixtureOrCaptureModeEnabled(),
    });
  }, [
    currentRealmIndex,
    onboardingActiveMilestoneId,
    onboardingDevOverride,
    onboardingFirstLifeOnlyComplete,
    onboardingTeaserWorldModules,
    onboardingUnlockedWorldModules,
    selectedCity,
  ]);

  const visibleCityModules = useMemo(() => {
    if (!selectedCity || !worldModulePolicy) return EMPTY_VISIBLE_CITY_MODULES;
    return [...worldModulePolicy.availableModules, ...worldModulePolicy.teaserModules];
  }, [selectedCity, worldModulePolicy]);

  const trackedBounty = useMemo(() => {
    if (!currentCityId) return null;
    const trackedId = trackedByCityId[currentCityId];
    if (!trackedId) return null;
    const activeBounties = activeByCityId[currentCityId];
    if (!activeBounties) return null;
    return activeBounties.find((entry) => entry.instanceId === trackedId) ?? null;
  }, [activeByCityId, currentCityId, trackedByCityId]);

  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const worldModalCityId = useUIStore((state) => state.worldBuildingModalCityId);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const combatPresentation = useUIStore((state) => state.combatPresentation);
  const pendingCityArrivalId = useUIStore((state) => state.pendingCityArrivalId);
  const [hoveredModuleKey, setHoveredModuleKey] = useState<string | null>(null);
  const [lastHoveredModuleKey, setLastHoveredModuleKey] = useState<string | null>(null);
  const inspectorHoverSeedCityRef = useRef<string | null>(null);
  const [isNarrowWorldLayout, setIsNarrowWorldLayout] = useState(false);
  const [isNarrowInspectorOpen, setIsNarrowInspectorOpen] = useState(false);

  const storedLockedModuleKey = selectedCity ? selectedModuleByCity[selectedCity.id] ?? null : null;

  const lockedModuleFallback = useMemo(() => {
    if (worldModulePolicy?.availableModules.includes('outskirts')) return 'outskirts';
    if (worldModulePolicy?.availableModules[0]) return worldModulePolicy.availableModules[0];
    return visibleCityModules[0] ?? null;
  }, [visibleCityModules, worldModulePolicy]);

  const lockedModuleKey = useMemo(() => {
    if (storedLockedModuleKey && visibleCityModules.includes(storedLockedModuleKey)) {
      return storedLockedModuleKey;
    }
    return lockedModuleFallback;
  }, [lockedModuleFallback, storedLockedModuleKey, visibleCityModules]);

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 860px)');
    const update = () => {
      setIsNarrowWorldLayout(media.matches);
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!isNarrowWorldLayout) {
      setIsNarrowInspectorOpen(false);
    }
  }, [isNarrowWorldLayout]);

  useEffect(() => {
    setIsNarrowInspectorOpen(false);
  }, [selectedCity?.id, currentCityId]);

  const economicSnapshot = useMemo(() => {
    try {
      return buildLiveEconomicRecommendationEngine();
    } catch {
      return null;
    }
  }, [currentCityId, selectedCity?.id, rawContent]);
  const milestoneGuidance = useMemo(() => {
    if (!economicSnapshot) return null;
    const milestoneSurface = buildMilestoneReadinessSurface({ engine: economicSnapshot });
    return buildMilestoneReadinessScreenGuidance(milestoneSurface);
  }, [economicSnapshot]);
  const economicTopRoute = economicSnapshot?.topRouteCandidates[0] ?? null;
  const milestoneWorldRoute = milestoneGuidance?.world.primaryRoute ?? null;
  const milestoneWorldModuleKey = milestoneGuidance?.world.recommendedModuleKey ?? null;
  const economicPrimary = milestoneWorldModuleKey
    ? {
        moduleKey: milestoneWorldModuleKey,
        cityId: milestoneWorldRoute?.cityId ?? currentCityId,
        reason: milestoneGuidance?.world.summary ?? milestoneWorldRoute?.reason ?? null,
      }
    : economicTopRoute
    ? {
        moduleKey: economicTopRoute.destinationModuleKey,
        cityId: economicTopRoute.destinationCityId,
        reason: economicTopRoute.reasonSummary,
      }
    : null;
  const economicPrimaryProblemKind = economicTopRoute?.problemKind ?? null;

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
        activeModuleKey: lockedModuleKey,
        economicModuleKeys: economicPrimary?.cityId === selectedCity.id && economicPrimary.moduleKey ? [economicPrimary.moduleKey] : [],
        economicPrimaryProblemKind,
        trackedBountyModuleKey: trackedDestination?.kind === 'module' ? trackedDestination.moduleKey as never : null,
        trackedBountyAlert: trackedAlert,
        expeditionIdleAlert,
        readyBountyCount: currentCityId ? (activeByCityId[currentCityId] ?? []).filter((entry) => entry.progress >= entry.target && !entry.claimed).length : 0,
        idleExpeditionSlots: Math.max(0, expeditionSlots - expeditionActive.filter((entry) => entry.cityId === selectedCity.id && entry.status === 'running').length),
      });
    },
    [activeByCityId, currentCityId, economicPrimary, economicPrimaryProblemKind, expeditionActive, expeditionIdleAlert, expeditionSlots, lockedModuleKey, rawContent, selectedCity, trackedAlert, trackedDestination, visibleCityModules],
  );

  const cityPhaseSurface = useMemo(() => {
    if (!rawContent || !selectedCity) return null;
    return buildCityPhaseSurfaceFromSnapshot({
      content: rawContent,
      cityId: selectedCity.id,
      unlockedCityIds,
      acknowledgedArrivalCityIds,
      pendingCityArrivalId,
      currentRealmIndex,
      mandate: null,
    });
  }, [acknowledgedArrivalCityIds, currentRealmIndex, pendingCityArrivalId, rawContent, selectedCity, unlockedCityIds]);

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

  const worldCardsByModuleKey = useMemo(() => {
    const byKey = new Map<string, {
      moduleKey: string;
      label: string;
      roleTag: string;
      bestUsedWhen: string;
      outputs: readonly string[];
      openLabel: string;
    }>();
    for (const group of worldCommandSurface.groups) {
      for (const card of group.cards) {
        byKey.set(card.moduleKey, {
          moduleKey: card.moduleKey,
          label: card.label,
          roleTag: card.roleTag,
          bestUsedWhen: card.bestUsedWhen,
          outputs: card.outputs,
          openLabel: card.openLabel,
        });
      }
    }
    return byKey;
  }, [worldCommandSurface.groups]);

  const handleSelectCity = useCallback((city: CityDef) => {
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
  }, [activeActivityType, addNotification, cityRequirementById, combatPresentation.mode, currentCityId, inCombat, setCurrentCity, unlockedCityIds]);

  const handleSelectCityById = useCallback(
    (cityId: string) => {
      const city = citiesSorted.find((entry) => entry.id === cityId);
      if (!city) return;
      handleSelectCity(city);
    },
    [citiesSorted, handleSelectCity],
  );

  const handleRouteToModule = useCallback(
    (moduleKey: string) => {
      if (!selectedCity) return;
      if (!visibleCityModules.includes(moduleKey)) return;
      openWorldModule({ cityId: selectedCity.id, moduleKey, source: 'world-map' });
    },
    [selectedCity, visibleCityModules],
  );

  const handleSelectModule = useCallback(
    (moduleKey: string) => {
      if (!selectedCity) return;
      if (!visibleCityModules.includes(moduleKey)) return;
      if (selectedModuleByCity[selectedCity.id] !== moduleKey) {
        setSelectedModule(selectedCity.id, moduleKey);
      }
      if (isNarrowWorldLayout) {
        setIsNarrowInspectorOpen(true);
      }
    },
    [isNarrowWorldLayout, selectedCity, selectedModuleByCity, setSelectedModule, visibleCityModules],
  );

  const handleModuleHoverIntent = useCallback(
    (moduleKey: string | null) => {
      if (!moduleKey) {
        setHoveredModuleKey(null);
        return;
      }
      if (!visibleCityModules.includes(moduleKey)) return;
      setHoveredModuleKey(moduleKey);
      setLastHoveredModuleKey(moduleKey);
    },
    [visibleCityModules],
  );

  const supportCapsuleText = trackedBounty || expeditionIdleAlert
    ? [
      trackedBounty ? '1 Tracked Bounty' : null,
      expeditionIdleAlert ? 'Expedition Slot Idle' : null,
    ].filter(Boolean).join(' · ')
    : null;

  const moduleCueByKey = useMemo(() => {
    const candidatesByModule = new Map<string, Set<WorldHotspotChipKind>>();
    const pushCandidate = (moduleKey: string | null, cue: WorldHotspotChipKind | null) => {
      if (!moduleKey || !cue) return;
      if (!visibleCityModules.includes(moduleKey)) return;
      const bucket = candidatesByModule.get(moduleKey) ?? new Set<WorldHotspotChipKind>();
      bucket.add(cue);
      candidatesByModule.set(moduleKey, bucket);
    };

    if (worldCommandSurface.strongRecommendationModuleKey) {
      const strongest = worldCommandSurface.strongRecommendationModuleKey;
      pushCandidate(strongest, strongest === 'gateTrial' ? 'GATE' : 'NOW');
    }

    for (const [moduleKey, meta] of Object.entries(moduleMetadataByKey)) {
      pushCandidate(moduleKey, meta.chipKind ? ROUTING_CHIP_TO_HOTSPOT_CUE[meta.chipKind] ?? null : null);
    }

    pushCandidate(trackedAlert?.ctaModuleKey ?? null, trackedAlert?.chipKind ? ROUTING_CHIP_TO_HOTSPOT_CUE[trackedAlert.chipKind] ?? null : null);
    pushCandidate(expeditionIdleAlert?.ctaModuleKey ?? null, 'IDLE');
    worldModulePolicy?.teaserModules.forEach((moduleKey) => pushCandidate(moduleKey, 'SOON'));

    const resolved: Partial<Record<string, WorldHotspotChipKind>> = {};
    for (const [moduleKey, candidates] of candidatesByModule.entries()) {
      const sorted = [...candidates].sort((a, b) => HOTSPOT_CUE_PRIORITY[a] - HOTSPOT_CUE_PRIORITY[b]);
      if (sorted[0]) {
        resolved[moduleKey] = sorted[0];
      }
    }
    return resolved;
  }, [expeditionIdleAlert, moduleMetadataByKey, trackedAlert, visibleCityModules, worldCommandSurface.strongRecommendationModuleKey, worldModulePolicy]);

  const strongestRecommendationModuleKey = worldCommandSurface.strongRecommendationModuleKey;
  const seededInspectorModuleKey = useMemo(() => {
    if (strongestRecommendationModuleKey && visibleCityModules.includes(strongestRecommendationModuleKey)) {
      return strongestRecommendationModuleKey;
    }
    return visibleCityModules[0] ?? null;
  }, [strongestRecommendationModuleKey, visibleCityModules]);

  useEffect(() => {
    const cityKey = selectedCity?.id ?? null;
    if (inspectorHoverSeedCityRef.current === cityKey) return;
    inspectorHoverSeedCityRef.current = cityKey;
    setHoveredModuleKey(null);
    setLastHoveredModuleKey(seededInspectorModuleKey);
  }, [seededInspectorModuleKey, selectedCity?.id]);

  useEffect(() => {
    if (!hoveredModuleKey) return;
    if (visibleCityModules.includes(hoveredModuleKey)) return;
    setHoveredModuleKey(null);
  }, [hoveredModuleKey, visibleCityModules]);

  useEffect(() => {
    if (!lastHoveredModuleKey) {
      if (seededInspectorModuleKey) {
        setLastHoveredModuleKey(seededInspectorModuleKey);
      }
      return;
    }
    if (visibleCityModules.includes(lastHoveredModuleKey)) return;
    setLastHoveredModuleKey(seededInspectorModuleKey);
  }, [lastHoveredModuleKey, seededInspectorModuleKey, visibleCityModules]);

  const inspectorModuleKey = useMemo(() => {
    if (hoveredModuleKey && visibleCityModules.includes(hoveredModuleKey)) return hoveredModuleKey;
    if (lastHoveredModuleKey && visibleCityModules.includes(lastHoveredModuleKey)) return lastHoveredModuleKey;
    if (lockedModuleKey && visibleCityModules.includes(lockedModuleKey)) return lockedModuleKey;
    return visibleCityModules[0] ?? null;
  }, [hoveredModuleKey, lastHoveredModuleKey, lockedModuleKey, visibleCityModules]);

  const inspectorCard = inspectorModuleKey ? worldCardsByModuleKey.get(inspectorModuleKey) ?? null : null;
  const inspectorCombatHandoff = useMemo(() => {
    if (!rawContent || !selectedCity || !inspectorModuleKey) return null;
    if (inspectorModuleKey !== 'outskirts' && inspectorModuleKey !== 'ruins' && inspectorModuleKey !== 'gateTrial') return null;
    return buildWorldCombatHandoffSurface({ content: rawContent, cityId: selectedCity.id, moduleKey: inspectorModuleKey });
  }, [inspectorModuleKey, rawContent, selectedCity]);
  const inspectorLabel = inspectorCard?.label ?? (inspectorModuleKey ? getWorldModuleLabel(inspectorModuleKey) : 'No module selected');
  const inspectorRoleTag = inspectorCombatHandoff?.roleTag ?? inspectorCard?.roleTag ?? 'Support · Current Selection';
  const inspectorBestUsedWhen = inspectorCombatHandoff?.bestUsedWhen ?? inspectorCard?.bestUsedWhen ?? 'Select a module on the map, then use Open to enter it.';
  const inspectorOutputs = (
    inspectorCombatHandoff?.outputs.map((entry) => entry.label).slice(0, 3)
    ?? inspectorCard?.outputs.slice(0, 3)
    ?? ['Map selection controls World module routing.']
  ) as string[];
  const inspectorBoundaryLine = resolveWorldInspectorBoundaryLine({
    moduleKey: inspectorModuleKey,
    boundaryLineFromHandoff: inspectorCombatHandoff?.boundaryLine ?? null,
  });
  const inspectorCueKind = inspectorModuleKey ? moduleCueByKey[inspectorModuleKey] ?? null : null;
  const phaseLine = cityPhaseSurface
    ? `City Phase: ${cityPhaseSurface.cityName} - ${cityPhaseSurface.phaseLesson.title.toLowerCase()}`
    : null;
  const pressureLine = cityPhaseSurface
    ? `Pressure: ${cityPhaseSurface.newPressure.explanation}`
    : null;
  const onboardingInspectorLock = inspectorModuleKey
    ? worldModulePolicy?.lockedModules[inspectorModuleKey as LiveWorldModuleKey] ?? null
    : null;
  const inspectorStateLine = onboardingInspectorLock?.state === 'teaser'
    ? onboardingInspectorLock.requirement ?? onboardingInspectorLock.reason
    : inspectorCueKind ? ({
    GATE: 'Gate is your next step.',
    NOW: `Recommended here now: ${inspectorLabel}.`,
    FIX: 'Build fix points here.',
    LOW: 'Stock low: route here to recover.',
    CLAIM: 'Claimable board reward.',
    IDLE: 'Expedition slot idle.',
    SOON: 'Useful soon for your next step.',
  } as const)[inspectorCueKind] : null;
  const inspectorOpenLabel = inspectorCombatHandoff?.openLabel ?? inspectorCard?.openLabel ?? (inspectorModuleKey ? `Open ${inspectorLabel}` : 'Open');

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
                activeModuleKey={lockedModuleKey}
                recommendedModuleKey={worldCommandSurface.strongRecommendationModuleKey}
                moduleMetadataByKey={moduleMetadataByKey}
                moduleCueByKey={moduleCueByKey}
                glintModuleKey={strongestRecommendationModuleKey}
                getModuleLabel={getWorldModuleLabel}
                onOpenModule={handleSelectModule}
                onSelectModule={handleSelectModule}
                onPreviewModuleChange={handleModuleHoverIntent}
                atmosphereQuality={effectiveQuality}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>

            <div className="worldScreenRibbonLayer">
              <WorldOverlayRibbon
                cityOptions={worldSelectorEntries.map(({ city, isUnlocked, isCurrent, requirementText }) => ({
                  cityId: city.id,
                  label: sanitizeLiveCityName(city.name),
                  isUnlocked,
                  isCurrent,
                  requirementText: requirementText ?? deriveCityRequirementText(city) ?? LOCK_REQUIREMENT_UNAVAILABLE,
                }))}
                selectedCityId={selectedCity.id}
                onSelectCity={handleSelectCityById}
                supportCapsuleText={supportCapsuleText}
                phaseLine={phaseLine}
                pressureLine={pressureLine}
              />
            </div>

            <div className="worldScreenInspectorLayer">
              {!isNarrowWorldLayout && inspectorModuleKey ? (
                <WorldOverlayInspector
                  moduleLabel={inspectorLabel}
                  roleTag={inspectorRoleTag}
                  bestUsedWhen={inspectorBestUsedWhen}
                  boundaryLine={inspectorBoundaryLine}
                  outputs={inspectorOutputs}
                  stateLine={inspectorStateLine}
                  openLabel={inspectorOpenLabel}
                  onOpen={() => handleRouteToModule(inspectorModuleKey)}
                  cityName={sanitizeLiveCityName(selectedCity.name)}
                />
              ) : null}
            </div>
            {isNarrowWorldLayout && inspectorModuleKey ? (
              <InspectorDrawer
                open={isNarrowInspectorOpen}
                onClose={() => setIsNarrowInspectorOpen(false)}
                title={`${sanitizeLiveCityName(selectedCity.name)} — ${inspectorLabel}`}
                headerMode="close-only"
                className="worldScreenInspectorDrawerOverlay"
                panelClassName="worldScreenInspectorDrawerPanel"
              >
                <WorldOverlayInspector
                  className="worldOverlayInspector--drawer"
                  moduleLabel={inspectorLabel}
                  roleTag={inspectorRoleTag}
                  bestUsedWhen={inspectorBestUsedWhen}
                  boundaryLine={inspectorBoundaryLine}
                  outputs={inspectorOutputs}
                  stateLine={inspectorStateLine}
                  openLabel={inspectorOpenLabel}
                  onOpen={() => handleRouteToModule(inspectorModuleKey)}
                  cityName={sanitizeLiveCityName(selectedCity.name)}
                />
              </InspectorDrawer>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
