import type { LiveWorldModuleKey } from '../../content/types.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useUIStore, type GameTab } from '../../stores/uiStore.js';
import { openWorldModule } from '../world/openWorldModule.js';
import {
  guardOnboardingTabRoute,
  guardOnboardingWorldModuleRoute,
} from './onboardingRouteGuards.js';
import type { OnboardingTabPolicy } from './onboardingTabPolicy.js';
import type { OnboardingWorldModulePolicy } from './onboardingWorldModulePolicy.js';
import type { OnboardingRouteTarget } from './onboardingTypes.js';

export type OnboardingRouteActionStatus = 'performed' | 'blocked' | 'noop' | 'missing_target';

export interface OnboardingRouteActionResult {
  status: OnboardingRouteActionStatus;
  reason: string | null;
  fallbackTab?: GameTab;
}

export interface OnboardingRouteActionDeps {
  setActiveTab: (tab: GameTab) => void;
  openWorldModule: (args: { cityId: string; moduleKey: LiveWorldModuleKey | string; source?: string }) => void;
  openTutorialLedgerDrawer: () => void;
  notifyBlocked: (message: string) => void;
}

export interface PerformOnboardingRouteActionInput {
  target: OnboardingRouteTarget;
  tabPolicy: OnboardingTabPolicy;
  worldModulePolicy: OnboardingWorldModulePolicy | null;
  deps?: OnboardingRouteActionDeps;
}

function getDefaultDeps(): OnboardingRouteActionDeps {
  const uiStore = useUIStore.getState();
  return {
    setActiveTab: uiStore.setActiveTab,
    openWorldModule: (args) => openWorldModule({ ...args, source: args.source ?? 'onboarding-guidance' }),
    openTutorialLedgerDrawer: uiStore.openTutorialLedgerDrawer,
    notifyBlocked: (message) => uiStore.addNotification('warning', message),
  };
}

function blocked(reason: string | null, deps: OnboardingRouteActionDeps, fallbackTab?: GameTab): OnboardingRouteActionResult {
  const message = reason ?? 'This route unlocks later in the first-life curriculum.';
  deps.notifyBlocked(message);
  return {
    status: 'blocked',
    reason: message,
    ...(fallbackTab ? { fallbackTab } : {}),
  };
}

export function performOnboardingRouteAction(
  input: PerformOnboardingRouteActionInput,
): OnboardingRouteActionResult {
  const deps = input.deps ?? getDefaultDeps();

  if (input.target.kind === 'none') {
    return { status: 'noop', reason: null };
  }

  if (input.target.kind === 'life_start') {
    return { status: 'noop', reason: 'Life Start owns this step.' };
  }

  if (input.target.kind === 'modal') {
    if (input.target.modalKey === 'tutorialLedger') {
      deps.openTutorialLedgerDrawer();
      return { status: 'performed', reason: null };
    }
    return { status: 'missing_target', reason: 'This tutorial drawer is not available from here.' };
  }

  if (input.target.kind === 'tab') {
    const guard = guardOnboardingTabRoute({ policy: input.tabPolicy, tab: input.target.tab });
    if (!guard.allowed) {
      return blocked(guard.reason, deps, guard.fallbackTab);
    }
    deps.setActiveTab(input.target.tab);
    return { status: 'performed', reason: null };
  }

  if (!input.worldModulePolicy) {
    return blocked('World routing is not ready yet.', deps);
  }

  const guard = guardOnboardingWorldModuleRoute({
    policy: input.worldModulePolicy,
    moduleKey: input.target.moduleKey,
  });
  if (!guard.allowed) {
    return blocked(guard.reason, deps);
  }

  const cityId = input.target.cityId ?? useCityStore.getState().currentCityId;
  if (!cityId) {
    return { status: 'missing_target', reason: 'No current city is available for this route.' };
  }

  deps.openWorldModule({ cityId, moduleKey: input.target.moduleKey, source: 'onboarding-guidance' });
  return { status: 'performed', reason: null };
}
