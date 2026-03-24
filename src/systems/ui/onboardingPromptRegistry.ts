import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';

export type OnboardingPromptId =
  | 'first_pinewind_arrival'
  | 'city_arrival'
  | 'first_gate_available'
  | 'first_major_failure'
  | 'first_prestige_viable';

export type OnboardingPromptScope = 'profile' | 'life' | 'city';
export type OnboardingPromptSurface = 'callout' | 'city_banner' | 'inline';
export type OnboardingPromptPriority = 'high' | 'medium' | 'low';

export interface OnboardingPromptActionTarget {
  kind: 'none' | 'tab' | 'world_module';
  tab?: GameTab;
  cityId?: string | null;
  moduleKey?: LiveWorldModuleKey;
}

export interface OnboardingPromptAction {
  label: string;
  target: OnboardingPromptActionTarget;
}

export interface OnboardingPromptDefinition {
  id: OnboardingPromptId;
  scope: OnboardingPromptScope;
  surface: OnboardingPromptSurface;
  priority: OnboardingPromptPriority;
  dismissLabel?: string;
}

export interface OnboardingPromptInstance {
  key: string;
  promptId: OnboardingPromptId;
  scope: OnboardingPromptScope;
  scopeKey: string;
  surface: OnboardingPromptSurface;
  priority: OnboardingPromptPriority;
  title: string;
  body: string;
  eyebrow?: string | null;
  badgeLabel?: string | null;
  primaryAction?: OnboardingPromptAction | null;
  secondaryAction?: OnboardingPromptAction | null;
  cityId?: string | null;
}

export const ONBOARDING_PROMPT_DEFINITIONS: Record<OnboardingPromptId, OnboardingPromptDefinition> = {
  first_pinewind_arrival: {
    id: 'first_pinewind_arrival',
    scope: 'profile',
    surface: 'callout',
    priority: 'medium',
    dismissLabel: 'Continue',
  },
  city_arrival: {
    id: 'city_arrival',
    scope: 'city',
    surface: 'city_banner',
    priority: 'high',
    dismissLabel: 'Continue',
  },
  first_gate_available: {
    id: 'first_gate_available',
    scope: 'life',
    surface: 'callout',
    priority: 'medium',
  },
  first_major_failure: {
    id: 'first_major_failure',
    scope: 'life',
    surface: 'callout',
    priority: 'medium',
  },
  first_prestige_viable: {
    id: 'first_prestige_viable',
    scope: 'life',
    surface: 'callout',
    priority: 'medium',
  },
};

export const buildOnboardingScopeKey = (promptId: OnboardingPromptId, scope: OnboardingPromptScope, cityId?: string | null): string => {
  if (scope === 'profile') return `profile:${promptId}`;
  if (scope === 'life') return `life:${promptId}`;
  return `city:${cityId ?? 'unknown'}:${promptId}`;
};

export const buildOnboardingPromptKey = (promptId: OnboardingPromptId, scopeKey: string): string =>
  `${promptId}:${scopeKey}`;

export const createFirstPinewindArrivalPrompt = (cityId: string): OnboardingPromptInstance => {
  const definition = ONBOARDING_PROMPT_DEFINITIONS.first_pinewind_arrival;
  const scopeKey = buildOnboardingScopeKey(definition.id, definition.scope, cityId);
  return {
    key: buildOnboardingPromptKey(definition.id, scopeKey),
    promptId: definition.id,
    scope: definition.scope,
    scopeKey,
    surface: definition.surface,
    priority: definition.priority,
    title: 'Pinewind Hamlet',
    body: 'World teaches the loop: Outskirts for gold/common mats, Ruins for targeted mats, Gate Trial for milestone progress.',
    eyebrow: 'First steps',
    badgeLabel: 'Starter Loop',
    cityId,
    primaryAction: {
      label: 'Open Outskirts',
      target: { kind: 'world_module', cityId, moduleKey: 'outskirts' },
    },
    secondaryAction: {
      label: definition.dismissLabel ?? 'Continue',
      target: { kind: 'none' },
    },
  };
};

export const createCityArrivalPrompt = (args: {
  cityId: string;
  cityName: string;
  supportIdentityLabel: string;
  lesson: string | null;
}): OnboardingPromptInstance => {
  const definition = ONBOARDING_PROMPT_DEFINITIONS.city_arrival;
  const scopeKey = buildOnboardingScopeKey(definition.id, definition.scope, args.cityId);
  return {
    key: buildOnboardingPromptKey(definition.id, scopeKey),
    promptId: definition.id,
    scope: definition.scope,
    scopeKey,
    surface: definition.surface,
    priority: definition.priority,
    title: args.cityName,
    body: args.lesson ?? 'A new phase of the world loop starts here.',
    eyebrow: 'Entered a new city',
    badgeLabel: args.supportIdentityLabel,
    cityId: args.cityId,
    secondaryAction: {
      label: definition.dismissLabel ?? 'Continue',
      target: { kind: 'none' },
    },
  };
};
