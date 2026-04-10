import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';

export type OnboardingPromptId =
  | 'first_pinewind_arrival'
  | 'city_arrival'
  | 'first_gate_available'
  | 'first_major_failure'
  | 'first_prestige_viable'
  | 'inline_world_loop'
  | 'inline_apothecary_loop'
  | 'inline_bounties_loop'
  | 'inline_expeditions_loop'
  | 'inline_first_failure';

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
    dismissLabel: 'Continue This Life',
  },
  inline_world_loop: {
    id: 'inline_world_loop',
    scope: 'life',
    surface: 'inline',
    priority: 'low',
    dismissLabel: 'Dismiss',
  },
  inline_apothecary_loop: {
    id: 'inline_apothecary_loop',
    scope: 'life',
    surface: 'inline',
    priority: 'low',
    dismissLabel: 'Dismiss',
  },
  inline_bounties_loop: {
    id: 'inline_bounties_loop',
    scope: 'life',
    surface: 'inline',
    priority: 'low',
    dismissLabel: 'Dismiss',
  },
  inline_expeditions_loop: {
    id: 'inline_expeditions_loop',
    scope: 'life',
    surface: 'inline',
    priority: 'low',
    dismissLabel: 'Dismiss',
  },
  inline_first_failure: {
    id: 'inline_first_failure',
    scope: 'life',
    surface: 'inline',
    priority: 'low',
    dismissLabel: 'Got it',
  },
};

export const buildOnboardingScopeKey = (promptId: OnboardingPromptId, scope: OnboardingPromptScope, cityId?: string | null): string => {
  if (scope === 'profile') return `profile:${promptId}`;
  if (scope === 'life') return `life:${promptId}`;
  return `city:${cityId ?? 'unknown'}:${promptId}`;
};

export const buildOnboardingPromptKey = (promptId: OnboardingPromptId, scopeKey: string): string =>
  `${promptId}:${scopeKey}`;

export const ONBOARDING_INLINE_LIFE_KEYS = {
  worldLoop: buildOnboardingPromptKey('inline_world_loop', buildOnboardingScopeKey('inline_world_loop', 'life')),
  apothecaryLoop: buildOnboardingPromptKey('inline_apothecary_loop', buildOnboardingScopeKey('inline_apothecary_loop', 'life')),
  bountiesLoop: buildOnboardingPromptKey('inline_bounties_loop', buildOnboardingScopeKey('inline_bounties_loop', 'life')),
  expeditionsLoop: buildOnboardingPromptKey('inline_expeditions_loop', buildOnboardingScopeKey('inline_expeditions_loop', 'life')),
  firstFailureStrap: buildOnboardingPromptKey('inline_first_failure', buildOnboardingScopeKey('inline_first_failure', 'life')),
} as const;

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

export const createFirstGateAvailablePrompt = (args: {
  cityId: string;
  cityName: string;
}): OnboardingPromptInstance => {
  const definition = ONBOARDING_PROMPT_DEFINITIONS.first_gate_available;
  const scopeKey = buildOnboardingScopeKey(definition.id, definition.scope);
  return {
    key: buildOnboardingPromptKey(definition.id, scopeKey),
    promptId: definition.id,
    scope: definition.scope,
    scopeKey,
    surface: definition.surface,
    priority: definition.priority,
    title: 'First Gate Available',
    body: 'This is your first real milestone wall. Check readiness before brute-forcing the gate.',
    eyebrow: args.cityName,
    badgeLabel: 'Gate Progress',
    cityId: args.cityId,
    primaryAction: {
      label: 'Open Gate Trial',
      target: { kind: 'world_module', cityId: args.cityId, moduleKey: 'gateTrial' },
    },
    secondaryAction: {
      label: 'Dismiss',
      target: { kind: 'none' },
    },
  };
};

export const createFirstMajorFailurePrompt = (args: {
  cityId: string;
}): OnboardingPromptInstance => {
  const definition = ONBOARDING_PROMPT_DEFINITIONS.first_major_failure;
  const scopeKey = buildOnboardingScopeKey(definition.id, definition.scope);
  return {
    key: buildOnboardingPromptKey(definition.id, scopeKey),
    promptId: definition.id,
    scope: definition.scope,
    scopeKey,
    surface: definition.surface,
    priority: definition.priority,
    title: 'Defeat is feedback',
    body: 'Read the diagnosis and take the top fix before retrying. The gate is teaching you what this life is missing.',
    badgeLabel: 'Gate Trial',
    cityId: args.cityId,
    primaryAction: {
      label: 'Open Gate Trial',
      target: { kind: 'world_module', cityId: args.cityId, moduleKey: 'gateTrial' },
    },
    secondaryAction: {
      label: 'Got it',
      target: { kind: 'none' },
    },
  };
};

export const createFirstPrestigeViablePrompt = (): OnboardingPromptInstance => {
  const definition = ONBOARDING_PROMPT_DEFINITIONS.first_prestige_viable;
  const scopeKey = buildOnboardingScopeKey(definition.id, definition.scope);
  return {
    key: buildOnboardingPromptKey(definition.id, scopeKey),
    promptId: definition.id,
    scope: definition.scope,
    scopeKey,
    surface: definition.surface,
    priority: definition.priority,
    title: 'Prestige is now viable',
    body: 'Reincarnation will grant Ascension Points. You can push further, or bank outer-loop power now.',
    badgeLabel: 'Viable',
    primaryAction: {
      label: 'Open Prestige',
      target: { kind: 'tab', tab: 'prestige' },
    },
    secondaryAction: {
      label: definition.dismissLabel ?? 'Continue This Life',
      target: { kind: 'none' },
    },
  };
};
