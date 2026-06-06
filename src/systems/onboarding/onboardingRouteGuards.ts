import type { GameTab, WorldBuildingModalIntent } from '../../stores/uiStore.js';
import type { OnboardingTabPolicy } from './onboardingTabPolicy.js';
import type { OnboardingWorldModulePolicy, OnboardingWorldModuleState } from './onboardingWorldModulePolicy.js';

export type OnboardingRouteGuardKind =
  | 'allowed'
  | 'utility'
  | 'bypass'
  | 'locked'
  | 'teaser'
  | 'hidden'
  | 'deferred';

export interface OnboardingRouteGuardResult {
  allowed: boolean;
  kind: OnboardingRouteGuardKind;
  reason: string | null;
  fallbackTab?: GameTab;
}

export interface GuardOnboardingTabRouteInput {
  policy: OnboardingTabPolicy;
  tab: GameTab;
  exactFixtureOrCaptureMode?: boolean;
}

export interface GuardOnboardingWorldModuleRouteInput {
  policy: OnboardingWorldModulePolicy;
  moduleKey: string;
  intent?: WorldBuildingModalIntent | unknown;
  source?: string;
  exactFixtureOrCaptureMode?: boolean;
}

const EXACT_QUERY_KEYS = [
  'uiAudit',
  'p5Fixture',
  'cultivationExactMode',
  'pavilionExact',
  'recordsExact',
  'techniquesExactMode',
  'techniquesExact',
  'apothecaryExactMode',
  'apothecaryExactFixture',
  'ruinsExactMode',
  'gateTrialExactMode',
  'prestigeLedgerMode',
] as const;

const EXACT_INTENT_KEYS = [
  'apothecaryExactMode',
  'forgeExactMode',
  'manualPavilionExactMode',
  'bountiesExactMode',
  'expeditionsExactMode',
  'ruinsExactMode',
  'gateTrialExactMode',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isWorldModuleExactFixtureIntent(intent: unknown): boolean {
  if (!isRecord(intent)) return false;
  return EXACT_INTENT_KEYS.some((key) => intent[key] === 'fixture');
}

export function isOnboardingFixtureBypassSource(source: string | null | undefined): boolean {
  if (!source) return false;
  const normalized = source.toLowerCase();
  return normalized.includes('exact-fixture') || normalized.includes('fixture-capture');
}

export function isOnboardingExactFixtureOrCaptureModeEnabled(search?: string): boolean {
  const query =
    search ??
    (typeof window !== 'undefined'
      ? `${window.location.search ?? ''}&${window.location.hash.replace(/^#/, '')}`
      : '');
  if (!query) return false;
  const params = new URLSearchParams(query.startsWith('?') ? query : `?${query}`);
  return EXACT_QUERY_KEYS.some((key) => {
    if (!params.has(key)) return false;
    const value = params.get(key);
    return value !== null && value !== '0' && value !== 'false';
  });
}

export function shouldEnforceOnboardingRouteGuards(source?: string | null): boolean {
  return typeof window !== 'undefined' || source === 'onboarding-route-guard-test';
}

export function guardOnboardingTabRoute(input: GuardOnboardingTabRouteInput): OnboardingRouteGuardResult {
  if (input.exactFixtureOrCaptureMode) {
    return { allowed: true, kind: 'bypass', reason: null };
  }

  if (input.policy.visibleTabs.includes(input.tab)) {
    return { allowed: true, kind: 'allowed', reason: null };
  }

  if (input.policy.utilityTabs.includes(input.tab)) {
    return { allowed: true, kind: 'utility', reason: null };
  }

  const locked = input.policy.lockedTabs[input.tab];
  return {
    allowed: false,
    kind: locked?.state === 'deferred' ? 'deferred' : 'hidden',
    reason: locked?.reason ?? 'This tab unlocks later in the first-life curriculum.',
    fallbackTab: input.policy.forcedFallbackTab,
  };
}

function guardKindForModuleState(state: OnboardingWorldModuleState | undefined): OnboardingRouteGuardKind {
  if (state === 'teaser') return 'teaser';
  if (state === 'deferred') return 'deferred';
  return 'hidden';
}

export function guardOnboardingWorldModuleRoute(
  input: GuardOnboardingWorldModuleRouteInput,
): OnboardingRouteGuardResult {
  const state = input.policy.moduleStates[input.moduleKey as keyof typeof input.policy.moduleStates];
  const exactBypass =
    input.exactFixtureOrCaptureMode === true ||
    isWorldModuleExactFixtureIntent(input.intent) ||
    isOnboardingFixtureBypassSource(input.source);

  if (exactBypass && state && state !== 'deferred') {
    return { allowed: true, kind: 'bypass', reason: null };
  }

  if (state === 'available') {
    return { allowed: true, kind: 'allowed', reason: null };
  }

  const moduleKey = input.moduleKey as keyof typeof input.policy.lockedModules;
  const locked = input.policy.lockedModules[moduleKey];
  const kind = guardKindForModuleState(state);
  return {
    allowed: false,
    kind,
    reason:
      locked?.reason ??
      (kind === 'deferred'
        ? 'This service is not part of the current live city schema.'
        : 'This city service unlocks later in the first-life curriculum.'),
  };
}
