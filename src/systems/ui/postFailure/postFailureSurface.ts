import type { LiveWorldModuleKey } from '../../../content/types.js';
import type { GameTab } from '../../../stores/uiStore.js';
import type { TrialAttemptSummary } from '../../../types/index.js';
import type { FailureDiagnosis, FailureFix } from '../../readiness/failureDiagnosisTypes.js';
import { GATE_SUPPORT_LABELS, getDiagnosisLabel, getOpenWorldModuleLabel, getShellTabLabel, getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';

export type PostFailureTarget =
  | { kind: 'tab'; tab: GameTab }
  | { kind: 'world_module'; cityId: string | null; moduleKey: LiveWorldModuleKey }
  | { kind: 'apothecary_surface'; cityId: string | null; surface: 'buy' | 'brew' | 'pouch' }
  | { kind: 'trial_local'; action: 'retry' | 'buy_safety_net' | 'focus_combat_options' | 'focus_safety_net' }
  | { kind: 'none' };

export interface PostFailureFixSurface {
  key: string;
  code: string;
  label: string;
  reason: string;
  destinationLabel: string;
  actionLabel: string | null;
  target: PostFailureTarget;
  blocked: boolean;
  blockedReason: string | null;
}

export interface PostFailureAttemptRecap {
  bossHpRemainingLine: string | null;
  timeSurvivedLine: string | null;
  biggestHitLine: string | null;
}

export interface PostFailureDiagnosisSurface {
  state: 'idle' | 'available' | 'resolved';
  title: string;
  primaryLabel: string | null;
  secondaryBadgeLabel: string | null;
  headline: string;
  explanation: string;
  reasons: string[];
  fixes: PostFailureFixSurface[];
  attemptRecap: PostFailureAttemptRecap | null;
}

interface BuildPostFailureDiagnosisSurfaceInput {
  diagnosis: FailureDiagnosis | null;
  summary: TrialAttemptSummary | null;
  lifecycleResolved: boolean;
  context: {
    cityId: string | null;
    canRetry: boolean;
    canBuySafetyNet: boolean;
    gateLabel?: string;
  };
}

function buildAttemptRecap(summary: TrialAttemptSummary | null): PostFailureAttemptRecap | null {
  if (!summary) return null;
  const bossHpRemainingLine = Number.isFinite(summary.bossHpPct)
    ? `Boss HP remaining: ${summary.bossHpPct.toFixed(1)}%`
    : null;
  const timeSurvivedLine = Number.isFinite(summary.durationSec)
    ? `Time survived: ${summary.durationSec.toFixed(1)}s`
    : null;
  const biggestHitLine = Number.isFinite(summary.maxHit)
    ? `Biggest hit taken: ${Math.max(0, summary.maxHit).toLocaleString()} (${summary.maxHitLabel || 'Hit'})`
    : null;

  if (!bossHpRemainingLine && !timeSurvivedLine && !biggestHitLine) return null;
  return {
    bossHpRemainingLine,
    timeSurvivedLine,
    biggestHitLine,
  };
}

function resolveSecondaryLabel(diagnosis: FailureDiagnosis | null): string | null {
  if (!diagnosis?.secondary) return null;
  return diagnosis.secondary === 'bypassAvailable' ? `${GATE_SUPPORT_LABELS.support} Available` : getDiagnosisLabel(diagnosis.secondary);
}

function resolveHeadline(primary: FailureDiagnosis['primary']): string {
  switch (primary) {
    case 'undercultivated':
      return 'This life is still short on raw cultivation power.';
    case 'underforged':
      return 'Forge floor is below what this gate punishes for.';
    case 'underprepared':
      return 'Consumables, reserves, or pouch posture are still unstable.';
    case 'underbuilt':
      return 'The build is missing slot coverage or technique floor.';
    case 'close':
      return 'This gate is close; one targeted fix can clear it.';
    default:
      return 'A focused adjustment should stabilize the next attempt.';
  }
}

function resolveExplanation(input: { diagnosis: FailureDiagnosis; gateLabel: string }): string {
  const reason = input.diagnosis.reasons[0] ?? null;
  if (reason) return reason;
  return `${input.gateLabel} still has one or more active readiness shortfalls.`;
}

function mapFixToSurface(input: {
  fix: FailureFix;
  cityId: string | null;
  canRetry: boolean;
  canBuySafetyNet: boolean;
}): PostFailureFixSurface {
  const { fix, cityId, canRetry, canBuySafetyNet } = input;

  if (fix.code === 'continue_cultivating') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Cultivate for more power',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('cultivation'),
      actionLabel: 'Open Cultivation',
      target: { kind: 'tab', tab: 'cultivation' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'fill_slots') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Fill unlocked slots',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('techniques'),
      actionLabel: 'Open Techniques',
      target: { kind: 'tab', tab: 'techniques' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'raise_alignment') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Correct path alignment',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('techniques'),
      actionLabel: 'Open Techniques',
      target: { kind: 'tab', tab: 'techniques' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'raise_mastery') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Raise core mastery',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('techniques'),
      actionLabel: 'Open Techniques',
      target: { kind: 'tab', tab: 'techniques' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'raise_rank') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Raise technique rank',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('techniques'),
      actionLabel: 'Open Techniques',
      target: { kind: 'tab', tab: 'techniques' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'socket_runes') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Raise rune coverage',
      reason: fix.reason,
      destinationLabel: getWorldModuleLabel('forge'),
      actionLabel: getOpenWorldModuleLabel('forge'),
      target: { kind: 'world_module', cityId, moduleKey: 'forge' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'raise_forge_floor') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Raise forge floor',
      reason: fix.reason,
      destinationLabel: getWorldModuleLabel('forge'),
      actionLabel: getOpenWorldModuleLabel('forge'),
      target: { kind: 'world_module', cityId, moduleKey: 'forge' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'close_prep_shortfalls') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Restock gate prep',
      reason: fix.reason,
      destinationLabel: getWorldModuleLabel('apothecary'),
      actionLabel: getOpenWorldModuleLabel('apothecary'),
      target: { kind: 'world_module', cityId, moduleKey: 'apothecary' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'configure_pouch') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Configure Medicine Pouch',
      reason: fix.reason,
      destinationLabel: 'Medicine Pouch',
      actionLabel: 'Open Medicine Pouch',
      target: { kind: 'apothecary_surface', cityId, surface: 'pouch' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'retry_clean') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Retry a cleaner attempt',
      reason: fix.reason,
      destinationLabel: 'Gate Trial',
      actionLabel: 'Retry Gate',
      target: { kind: 'trial_local', action: 'retry' },
      blocked: !canRetry,
      blockedReason: canRetry ? null : 'Gate entry requirements are not met yet.',
    };
  }

  if (fix.code === 'buy_fail_safe') {
    return {
      key: fix.code,
      code: fix.code,
      label: `Use the ${GATE_SUPPORT_LABELS.support}`,
      reason: fix.reason,
      destinationLabel: 'Gate Trial',
      actionLabel: `Buy ${GATE_SUPPORT_LABELS.support}`,
      target: { kind: 'trial_local', action: 'buy_safety_net' },
      blocked: !canBuySafetyNet,
      blockedReason: canBuySafetyNet ? null : `${GATE_SUPPORT_LABELS.support} is not available yet.`,
    };
  }

  if (fix.code === 'fix_ai_posture') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Correct AI posture',
      reason: fix.reason,
      destinationLabel: 'Gate Trial',
      actionLabel: 'Focus Combat Options',
      target: { kind: 'trial_local', action: 'focus_combat_options' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'fix_casting_posture') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Correct casting posture',
      reason: fix.reason,
      destinationLabel: 'Gate Trial',
      actionLabel: 'Focus Combat Options',
      target: { kind: 'trial_local', action: 'focus_combat_options' },
      blocked: false,
      blockedReason: null,
    };
  }

  if (fix.code === 'review_build') {
    return {
      key: fix.code,
      code: fix.code,
      label: 'Review the build',
      reason: fix.reason,
      destinationLabel: getShellTabLabel('techniques'),
      actionLabel: 'Open Techniques',
      target: { kind: 'tab', tab: 'techniques' },
      blocked: false,
      blockedReason: null,
    };
  }

  return {
    key: fix.code,
    code: fix.code,
    label: 'Review the build',
    reason: fix.reason,
    destinationLabel: 'Gate Trial',
    actionLabel: null,
    target: { kind: 'none' },
    blocked: false,
    blockedReason: null,
  };
}

export function buildPostFailureDiagnosisSurface(input: BuildPostFailureDiagnosisSurfaceInput): PostFailureDiagnosisSurface {
  const gateLabel = input.context.gateLabel ?? 'Gate Trial';

  if (input.lifecycleResolved) {
    return {
      state: 'resolved',
      title: `${gateLabel} Post-Failure Diagnosis`,
      primaryLabel: null,
      secondaryBadgeLabel: null,
      headline: 'No active failure diagnosis.',
      explanation: `${gateLabel} is already resolved.`,
      reasons: [],
      fixes: [],
      attemptRecap: null,
    };
  }

  if (!input.diagnosis || !input.summary) {
    return {
      state: 'idle',
      title: `${gateLabel} Post-Failure Diagnosis`,
      primaryLabel: null,
      secondaryBadgeLabel: null,
      headline: 'No recent defeat summary yet.',
      explanation: 'Attempt this gate once to surface focused diagnosis and fixes.',
      reasons: [],
      fixes: [],
      attemptRecap: null,
    };
  }

  return {
    state: 'available',
    title: `${gateLabel} Post-Failure Diagnosis`,
    primaryLabel: getDiagnosisLabel(input.diagnosis.primary),
    secondaryBadgeLabel: resolveSecondaryLabel(input.diagnosis),
    headline: resolveHeadline(input.diagnosis.primary),
    explanation: resolveExplanation({ diagnosis: input.diagnosis, gateLabel }),
    reasons: input.diagnosis.reasons.slice(0, 3),
    fixes: input.diagnosis.topFixes
      .slice(0, 3)
      .map((fix) => mapFixToSurface({
        fix,
        cityId: input.context.cityId,
        canRetry: input.context.canRetry,
        canBuySafetyNet: input.context.canBuySafetyNet,
      })),
    attemptRecap: buildAttemptRecap(input.summary),
  };
}
