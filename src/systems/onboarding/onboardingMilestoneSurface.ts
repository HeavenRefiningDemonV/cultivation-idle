import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';
import type { OnboardingTabPolicy } from './onboardingTabPolicy.js';
import {
  guardOnboardingTabRoute,
  guardOnboardingWorldModuleRoute,
} from './onboardingRouteGuards.js';
import type { OnboardingWorldModulePolicy } from './onboardingWorldModulePolicy.js';
import type {
  OnboardingMilestoneContent,
  OnboardingRuntimeMilestoneId,
  OnboardingRouteTarget,
} from './onboardingTypes.js';
import { getOnboardingMilestoneById } from './onboardingContent.js';
import type { OnboardingSourceSinkGuard } from './onboardingSourceSinkGuards.js';

export type OnboardingMilestoneSurfaceState = 'active' | 'hidden' | 'suppressed';
export type OnboardingMilestoneSuppressionReason =
  | 'life_start'
  | 'story'
  | 'modal'
  | 'combat'
  | 'exact_capture'
  | 'legacy_prompt'
  | 'content_unavailable';

export interface OnboardingMilestoneActionSurface {
  label: string;
  target: OnboardingRouteTarget;
  disabled: boolean;
  reason?: string;
}

export interface OnboardingMilestoneRouteSurface {
  label: string;
  target: OnboardingRouteTarget;
  blocked: boolean;
  reason: string | null;
}

export interface OnboardingMilestoneDetailSurface {
  label: string;
  body: string;
}

export interface OnboardingMilestoneSurface {
  state: OnboardingMilestoneSurfaceState;
  reason: OnboardingMilestoneSuppressionReason | null;
  milestoneId: OnboardingRuntimeMilestoneId | null;
  eyebrow: string;
  phaseLabel: string | null;
  title: string;
  why: string;
  route: OnboardingMilestoneRouteSurface;
  primaryAction: OnboardingMilestoneActionSurface | null;
  fallbackAction: OnboardingMilestoneActionSurface | null;
  rewardPreview: string | null;
  details: OnboardingMilestoneDetailSurface[];
}

export interface BuildOnboardingMilestoneSurfaceInput {
  milestones: readonly OnboardingMilestoneContent[];
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  tabPolicy: OnboardingTabPolicy;
  worldModulePolicy: OnboardingWorldModulePolicy | null;
  currentCityId?: string | null;
  suppressedReason?: OnboardingMilestoneSuppressionReason | null;
  sourceSinkGuards?: readonly OnboardingSourceSinkGuard[];
}

const TAB_LABELS: Record<GameTab, string> = {
  cultivation: 'Cultivation',
  status: 'Status',
  adventure: 'World',
  inventory: 'Inventory',
  techniques: 'Techniques',
  records: 'Manual Pavilion',
  prestige: 'Prestige',
  settings: 'Settings',
};

const WORLD_MODULE_LABELS: Record<LiveWorldModuleKey, string> = {
  outskirts: 'Outskirts',
  ruins: 'Ruins',
  gateTrial: 'Gate Trial',
  trainingHall: 'Training Hall',
  manualPavilion: 'Manual Pavilion',
  apothecary: 'Apothecary',
  forge: 'Forge',
  bounties: 'Bounty Board',
  expeditions: 'Expeditions',
};

const PHASE_LABELS: Record<OnboardingMilestoneContent['phase'], string> = {
  life_start: 'Life Start',
  cultivation: 'Cultivation',
  diagnosis: 'Diagnosis',
  field_loop: 'Field Loop',
  knowledge: 'Knowledge',
  buildcraft: 'Buildcraft',
  preparation: 'Preparation',
  gear_floor: 'Gear Floor',
  support_rotation: 'Support Rotation',
  gate_exam: 'Gate Exam',
  graduation: 'Graduation',
};

function cleanPublicCopy(value: string): string {
  return value
    .replace(/\bgate proof\b/gi, 'gate handoff')
    .replace(/\bproof detail\b/gi, 'readiness detail')
    .replace(/\bsource thread\b/gi, 'route detail')
    .replace(/\bmodule source-sink\b/gi, 'module fit')
    .replace(/\bsource-sink note\b/gi, 'where it fits')
    .replace(/\bmandate lens\b/gi, 'route lens')
    .replace(/\bomen\b/gi, 'signal');
}

export function getOnboardingPhaseLabel(phase: OnboardingMilestoneContent['phase']): string {
  return PHASE_LABELS[phase];
}

function withCityTarget(target: OnboardingRouteTarget, currentCityId?: string | null): OnboardingRouteTarget {
  if (target.kind !== 'world_module') return target;
  return {
    ...target,
    cityId: target.cityId ?? currentCityId ?? null,
  };
}

export function getOnboardingRouteLabel(target: OnboardingRouteTarget): string {
  if (target.kind === 'tab') return TAB_LABELS[target.tab];
  if (target.kind === 'world_module') return `World > ${WORLD_MODULE_LABELS[target.moduleKey]}`;
  if (target.kind === 'modal' && target.modalKey === 'tutorialLedger') return 'Tutorial Ledger';
  if (target.kind === 'modal' && target.modalKey === 'manualSatchel') return 'Manual Satchel';
  if (target.kind === 'modal' && target.modalKey === 'medicinePouch') return 'Medicine Pouch';
  if (target.kind === 'life_start') return 'Life Start';
  return 'Current objective';
}

function getActionLabel(target: OnboardingRouteTarget): string {
  if (target.kind === 'world_module') return `Open ${WORLD_MODULE_LABELS[target.moduleKey]}`;
  if (target.kind === 'tab') return `Open ${TAB_LABELS[target.tab]}`;
  if (target.kind === 'modal' && target.modalKey === 'tutorialLedger') return 'Open Tutorial Ledger';
  if (target.kind === 'modal') return `Open ${getOnboardingRouteLabel(target)}`;
  if (target.kind === 'life_start') return 'Begin Life';
  return 'Continue';
}

function getBlockedRouteReason(
  target: OnboardingRouteTarget,
  tabPolicy: OnboardingTabPolicy,
  worldModulePolicy: OnboardingWorldModulePolicy | null,
): string | null {
  if (target.kind === 'tab') {
    const guard = guardOnboardingTabRoute({ policy: tabPolicy, tab: target.tab });
    return guard.allowed ? null : guard.reason;
  }

  if (target.kind === 'world_module') {
    if (!worldModulePolicy) return 'World routing is not ready yet.';
    const guard = guardOnboardingWorldModuleRoute({ policy: worldModulePolicy, moduleKey: target.moduleKey });
    return guard.allowed ? null : guard.reason;
  }

  return null;
}

function selectPromotedGuard(guards: readonly OnboardingSourceSinkGuard[] | undefined): OnboardingSourceSinkGuard | null {
  if (!guards?.length) return null;
  return guards.find((guard) => guard.severity === 'blocked' || guard.severity === 'locked') ?? guards[0] ?? null;
}

function getOnboardingBlockedRouteFallback(
  target: OnboardingRouteTarget,
  currentCityId?: string | null,
): OnboardingMilestoneActionSurface | null {
  if (target.kind === 'world_module') {
    if (target.moduleKey === 'manualPavilion') {
      const fallbackTarget: OnboardingRouteTarget = {
        kind: 'world_module',
        moduleKey: 'outskirts',
        cityId: target.cityId ?? currentCityId ?? null,
      };
      return {
        label: 'Hunt Outskirts first',
        target: fallbackTarget,
        disabled: false,
      };
    }

    if (target.moduleKey === 'gateTrial') {
      const fallbackTarget: OnboardingRouteTarget = {
        kind: 'world_module',
        moduleKey: 'ruins',
        cityId: target.cityId ?? currentCityId ?? null,
      };
      return {
        label: 'Gather support first',
        target: fallbackTarget,
        disabled: false,
      };
    }
  }

  if (target.kind === 'tab' && target.tab === 'adventure') {
    return {
      label: 'Read Status first',
      target: { kind: 'tab', tab: 'status' },
      disabled: false,
    };
  }

  return null;
}

function makeInactiveSurface(
  state: 'hidden' | 'suppressed',
  reason: OnboardingMilestoneSuppressionReason | null,
): OnboardingMilestoneSurface {
  return {
    state,
    reason,
    milestoneId: null,
    eyebrow: 'Next Step',
    phaseLabel: null,
    title: '',
    why: '',
    route: { label: '', target: { kind: 'none' }, blocked: false, reason: null },
    primaryAction: null,
    fallbackAction: null,
    rewardPreview: null,
    details: [],
  };
}

export function buildSuppressedOnboardingMilestoneSurface(
  reason: OnboardingMilestoneSuppressionReason,
): OnboardingMilestoneSurface {
  return makeInactiveSurface('suppressed', reason);
}

export function buildOnboardingMilestoneSurface(
  input: BuildOnboardingMilestoneSurfaceInput,
): OnboardingMilestoneSurface {
  if (input.suppressedReason) {
    return buildSuppressedOnboardingMilestoneSurface(input.suppressedReason);
  }

  if (!input.activeMilestoneId || input.activeMilestoneId === 'complete') {
    return makeInactiveSurface('hidden', null);
  }

  const milestone = getOnboardingMilestoneById(input.milestones, input.activeMilestoneId);
  if (!milestone) {
    return makeInactiveSurface('hidden', 'content_unavailable');
  }

  const promotedGuard = selectPromotedGuard(input.sourceSinkGuards);
  const target = withCityTarget(promotedGuard?.primaryRoute?.target ?? milestone.objective.route, input.currentCityId);
  const blockedReason = getBlockedRouteReason(target, input.tabPolicy, input.worldModulePolicy);
  const route = {
    label: promotedGuard?.primaryRoute?.label ?? getOnboardingRouteLabel(target),
    target,
    blocked: blockedReason !== null,
    reason: blockedReason ? cleanPublicCopy(blockedReason) : null,
  };
  const primaryAction: OnboardingMilestoneActionSurface = {
    label: promotedGuard?.primaryRoute?.label ?? getActionLabel(target),
    target,
    disabled: route.blocked,
    ...(route.reason ? { reason: route.reason } : {}),
  };
  const details: OnboardingMilestoneDetailSurface[] = [
    { label: 'Why this matters', body: cleanPublicCopy(milestone.objective.why) },
  ];

  if (promotedGuard?.detail) {
    details.push({ label: 'Details', body: cleanPublicCopy(promotedGuard.detail) });
  }
  if (milestone.sourceSinkNote) {
    details.push({ label: 'Where it fits', body: cleanPublicCopy(milestone.sourceSinkNote) });
  }
  if (milestone.objective.optionalTip) {
    details.push({ label: 'Tip', body: cleanPublicCopy(milestone.objective.optionalTip) });
  }

  return {
    state: 'active',
    reason: null,
    milestoneId: milestone.id,
    eyebrow: 'Next Step',
    phaseLabel: getOnboardingPhaseLabel(milestone.phase),
    title: cleanPublicCopy(promotedGuard?.title ?? milestone.objective.title),
    why: cleanPublicCopy(promotedGuard?.body ?? milestone.objective.why),
    route,
    primaryAction,
    fallbackAction: route.blocked ? getOnboardingBlockedRouteFallback(target, input.currentCityId) : null,
    rewardPreview: milestone.objective.rewardPreview ? cleanPublicCopy(milestone.objective.rewardPreview) : null,
    details,
  };
}
