import { useUIStore, type WorldBuildingKey, type WorldBuildingModalIntent } from '../../stores/uiStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useOnboardingStore } from '../../stores/onboardingStore.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import { inspectWorldFacingModuleTarget } from './liveWorldLeakAudit.js';
import { DEFERRED_WORLD_MODULES } from './liveWorldSchema.js';
import { buildOnboardingWorldModulePolicy } from '../onboarding/onboardingWorldModulePolicy.js';
import {
  guardOnboardingWorldModuleRoute,
  isOnboardingExactFixtureOrCaptureModeEnabled,
  shouldEnforceOnboardingRouteGuards,
} from '../onboarding/onboardingRouteGuards.js';
import {
  getWorldTravelBlockMessage,
  getWorldTravelGuard,
} from './travelContract.js';

export type WorldModuleKey = WorldBuildingKey | string;

export type OpenWorldModuleArgs = {
  cityId: string;
  moduleKey: WorldModuleKey;
  open?: boolean;
  source?: string;
  intent?: WorldBuildingModalIntent;
};

export const COMBAT_MODULE_KEYS = new Set<WorldModuleKey>(['outskirts', 'gateTrial', 'ruins']);

export function isCombatModule(moduleKey: string): boolean {
  return COMBAT_MODULE_KEYS.has(moduleKey);
}

export function openWorldModule({ cityId, moduleKey, open = true, source, intent }: OpenWorldModuleArgs): void {
  const uiStore = useUIStore.getState();
  const cityStore = useCityStore.getState();
  const contentStore = useContentStore.getState();
  const activityStore = useActivityStore.getState();
  const combatStore = useCombatStore.getState();

  const normalizedModuleKey = moduleKey;

  const targetAudit = inspectWorldFacingModuleTarget(normalizedModuleKey);
  if (!targetAudit.ok) {
    uiStore.addNotification('warning', 'That module is not available here.');
    return;
  }

  const city = contentStore.maps.citiesById[cityId];
  if (!city || !city.modules.includes(normalizedModuleKey)) return;

  if (shouldEnforceOnboardingRouteGuards(source)) {
    const onboardingStore = useOnboardingStore.getState();
    const onboardingPolicy = buildOnboardingWorldModulePolicy({
      activeMilestoneId: onboardingStore.activeMilestoneId,
      completedMilestoneIds: onboardingStore.completedMilestoneIds,
      unlockedWorldModules: onboardingStore.unlockedWorldModules,
      teaserWorldModules: onboardingStore.teaserWorldModules,
      selectedCityModuleKeys: city.modules,
      deferredWorldModuleKeys: DEFERRED_WORLD_MODULES,
      firstLifeOnlyComplete: onboardingStore.firstLifeOnlyComplete,
      devOverride: onboardingStore.devOverride,
      isExistingAdvancedSave: useGameStore.getState().realm.index > 0,
      exactFixtureOrCaptureMode: isOnboardingExactFixtureOrCaptureModeEnabled(),
    });
    const onboardingGuard = guardOnboardingWorldModuleRoute({
      policy: onboardingPolicy,
      moduleKey: normalizedModuleKey,
      intent,
      source,
    });

    if (!onboardingGuard.allowed) {
      uiStore.addNotification('warning', onboardingGuard.reason ?? 'This city service unlocks later.');
      return;
    }
  }

  const travelGuard = getWorldTravelGuard({
    targetCityId: cityId,
    currentCityId: cityStore.currentCityId,
    unlockedCityIds: cityStore.unlockedCityIds,
    liveCityIds: SEMESTER_SLICE_CONTRACT.liveCityIds,
    inCombat: combatStore.inCombat,
    activeActivityType: activityStore.active?.type,
    combatPresentationMode: uiStore.combatPresentation.mode,
  });

  if (!travelGuard.allowed) {
    const message = getWorldTravelBlockMessage(travelGuard.reason);
    if (message) {
      uiStore.addNotification('warning', message);
    }
    return;
  }

  if (cityStore.currentCityId !== cityId) {
    cityStore.setCurrentCity(cityId);
    if (useCityStore.getState().currentCityId !== cityId) {
      return;
    }
  }

  uiStore.setActiveTab('adventure');
  cityStore.setSelectedModule(cityId, normalizedModuleKey);
  uiStore.closeWorldBuildingModal();

  if (open === false) {
    return;
  }

  const resolvedIntent: WorldBuildingModalIntent =
    normalizedModuleKey === 'gateTrial' && intent === undefined
      ? { gateTrialExactMode: 'live' }
      : intent ?? null;

  uiStore.openWorldBuildingModal({
    cityId,
    buildingKey: normalizedModuleKey as WorldBuildingKey,
    intent: resolvedIntent,
  });
}
