import { REALMS } from '../../../constants/index.js';
import type { TrialDef, TrialFailSafeCost } from '../../../content/types.js';
import type { ValidatedContent } from '../../../content/index.js';
import type { Realm } from '../../../types/index.js';
import type { TrialProgress, TrialResolution } from '../../../stores/trialStore.js';
import { greaterThanOrEqualTo } from '../../../utils/numbers.js';
import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../contract/progressionContract.js';
import { clampRealmIndexToSemesterSlice, getLiveRealmByIndex } from './liveRealmProjection.js';
import { getTrialGateItemId } from './gateResolver.js';

export type TrialLifecycleState = 'locked' | 'available' | 'cleared' | 'bypassed';
export type TrialLifecycleReasonCode =
  | 'missing_trial'
  | 'missing_transition'
  | 'resolved'
  | 'wrong_realm_edge'
  | 'not_final_substage'
  | 'insufficient_qi'
  | 'missing_required_item'
  | 'available';
export type TrialFailSafeStatus = 'locked' | 'available' | 'resolved';

interface RawFailSafePurchase {
  enabled?: boolean;
  afterEligibleFails?: number;
  costRef?: string;
}

interface RawEconomyGateTrials {
  manualSystem?: {
    gateTrials?: {
      failSafe?: {
        failThresholdEligibleAttempts?: number;
        purchaseCostByCityIndex?: Array<TrialFailSafeCost | undefined>;
      };
    };
  };
}

interface TrialLifecycleInput {
  content: ValidatedContent | null | undefined;
  trial: TrialDef | null | undefined;
  progress: TrialProgress | null | undefined;
  realm: Realm;
  qi: string;
  breakthroughRequirement: string;
  requiredItemSatisfied: boolean;
}

export interface TrialFailSafeSnapshot {
  threshold: number;
  eligibleFailures: number;
  remainingEligibleFailures: number;
  cost: TrialFailSafeCost | null;
  status: TrialFailSafeStatus;
  canPurchase: boolean;
  blockedReasonCode: Exclude<TrialLifecycleReasonCode, 'available'> | null;
  blockedReason: string | null;
}

export interface TrialLifecycleSnapshot {
  state: TrialLifecycleState;
  canStart: boolean;
  isResolved: boolean;
  resolution: TrialResolution;
  reasonCode: TrialLifecycleReasonCode;
  reason: string;
  gateItemId: string | null;
  requiredItemId: string | null;
  countsTowardFailSafeOnStart: boolean;
  failSafe: TrialFailSafeSnapshot;
}

const DEFAULT_FAIL_SAFE_THRESHOLD = 3;

const getContract = (content: ValidatedContent | null | undefined) => {
  if (!content) return null;
  try {
    return getProgressionContract(adaptProgressionAuthoredContent(content));
  } catch (error) {
    console.warn('[TrialLifecycle] Failed to load progression contract', error);
    return null;
  }
};

const getRawFailSafePurchase = (
  content: ValidatedContent | null | undefined,
  trialId: string | undefined,
): RawFailSafePurchase | null => {
  if (!content || !trialId) return null;
  const rawTrial = content.trials.find(
    (entry: TrialDef) => entry.id === trialId,
  ) as (TrialDef & { failSafePurchase?: RawFailSafePurchase }) | undefined;
  return rawTrial?.failSafePurchase ?? null;
};

const resolveFailSafeCost = (
  content: ValidatedContent | null | undefined,
  trial: TrialDef | null | undefined,
): TrialFailSafeCost | null => {
  if (!trial) return null;
  if (trial.failSafe?.cost) return trial.failSafe.cost;

  const economy = content?.economy as RawEconomyGateTrials | undefined;
  const cityIndex = trial.cityIndex ?? 0;
  const fallback = economy?.manualSystem?.gateTrials?.failSafe?.purchaseCostByCityIndex?.[cityIndex] ?? null;
  if (!fallback) return null;
  return {
    gold: fallback.gold != null ? String(fallback.gold) : undefined,
    spiritStones: fallback.spiritStones != null ? String(fallback.spiritStones) : undefined,
    merit: fallback.merit != null ? String(fallback.merit) : undefined,
  };
};

export const resolveTrialFailSafeConfig = (
  content: ValidatedContent | null | undefined,
  trial: TrialDef | null | undefined,
): { threshold: number; cost: TrialFailSafeCost | null } => {
  const rawPurchase = getRawFailSafePurchase(content, trial?.id);
  const economy = content?.economy as RawEconomyGateTrials | undefined;
  const threshold =
    rawPurchase?.afterEligibleFails ??
    trial?.failSafe?.thresholdAttempts ??
    economy?.manualSystem?.gateTrials?.failSafe?.failThresholdEligibleAttempts ??
    DEFAULT_FAIL_SAFE_THRESHOLD;

  return {
    threshold: Math.max(1, Math.floor(threshold)),
    cost: resolveFailSafeCost(content, trial),
  };
};

const describeReason = (code: TrialLifecycleReasonCode, resolution: TrialResolution): string => {
  switch (code) {
    case 'missing_trial':
      return 'Trial definition unavailable.';
    case 'missing_transition':
      return 'Trial transition is unavailable.';
    case 'resolved':
      return resolution === 'bypassed' ? 'Trial already resolved via bypass.' : 'Trial already cleared.';
    case 'wrong_realm_edge':
      return 'Trial locked for a different realm edge.';
    case 'not_final_substage':
      return 'Not at final substage yet.';
    case 'insufficient_qi':
      return 'Insufficient Qi for breakthrough readiness.';
    case 'missing_required_item':
      return 'Missing required item.';
    case 'available':
      return 'Ready to challenge.';
  }
};

export const getTrialLifecycleSnapshot = ({
  content,
  trial,
  progress,
  realm,
  qi,
  breakthroughRequirement,
  requiredItemSatisfied,
}: TrialLifecycleInput): TrialLifecycleSnapshot => {
  const contract = getContract(content);
  const transition = trial && contract ? getTransitionByTrialId(contract, trial.id) : null;
  const resolution = progress?.resolution ?? (progress?.cleared ? 'cleared' : 'none');
  const gateItemId = getTrialGateItemId(content, trial);
  const currentRealmIndex = clampRealmIndexToSemesterSlice(realm.index);
  const currentRealm = REALMS[currentRealmIndex] ?? REALMS[0];
  const currentRealmId = getLiveRealmByIndex(currentRealmIndex).id;
  const atCorrectRealmEdge = Boolean(transition && transition.fromRealmId === currentRealmId);
  const atFinalSubstage = realm.substage >= currentRealm.substages;
  const qiReady = greaterThanOrEqualTo(qi, breakthroughRequirement);
  const isResolved = resolution === 'cleared' || resolution === 'bypassed';
  const { threshold, cost } = resolveTrialFailSafeConfig(content, trial);
  const eligibleFailures = progress?.eligibleFailures ?? 0;

  let state: TrialLifecycleState = 'locked';
  let reasonCode: TrialLifecycleReasonCode = 'missing_trial';

  if (!trial) {
    reasonCode = 'missing_trial';
  } else if (!transition) {
    reasonCode = 'missing_transition';
  } else if (isResolved) {
    state = resolution;
    reasonCode = 'resolved';
  } else if (!atCorrectRealmEdge) {
    reasonCode = 'wrong_realm_edge';
  } else if (!atFinalSubstage) {
    reasonCode = 'not_final_substage';
  } else if (!qiReady) {
    reasonCode = 'insufficient_qi';
  } else if (!requiredItemSatisfied) {
    reasonCode = 'missing_required_item';
  } else {
    state = 'available';
    reasonCode = 'available';
  }

  const canStart = state === 'available';
  const canPurchase = state === 'available' && eligibleFailures >= threshold;
  const failSafeStatus: TrialFailSafeStatus = isResolved ? 'resolved' : canPurchase ? 'available' : 'locked';
  const failSafeBlockedReasonCode: Exclude<TrialLifecycleReasonCode, 'available'> | null = isResolved
    ? 'resolved'
    : state === 'available'
      ? null
      : reasonCode === 'available'
        ? null
        : reasonCode;
  const failSafeBlockedReason = isResolved
    ? describeReason('resolved', resolution)
    : canPurchase
      ? null
      : state === 'available'
        ? `Fail-safe unlocks after ${threshold} eligible defeats.`
        : failSafeBlockedReasonCode
          ? describeReason(failSafeBlockedReasonCode, resolution)
          : null;

  return {
    state,
    canStart,
    isResolved,
    resolution,
    reasonCode,
    reason: describeReason(reasonCode, resolution),
    gateItemId,
    requiredItemId: trial?.requiredItemId ?? null,
    countsTowardFailSafeOnStart: canStart,
    failSafe: {
      threshold,
      eligibleFailures,
      remainingEligibleFailures: Math.max(0, threshold - eligibleFailures),
      cost,
      status: failSafeStatus,
      canPurchase,
      blockedReasonCode: failSafeBlockedReasonCode,
      blockedReason: failSafeBlockedReason,
    },
  };
};

export const isTrialResolved = (snapshot: TrialLifecycleSnapshot): boolean => snapshot.isResolved;
