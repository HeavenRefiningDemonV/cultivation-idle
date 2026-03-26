import type { CityId, MajorRealmId } from '../progression/contract/contractTypes.js';

export type TargetStatus = 'locked' | 'deferred';

export interface NumericWindow {
  minSeconds: number;
  targetSeconds: number;
  maxSeconds: number;
}

export interface DeferredTarget {
  status: 'deferred';
  sourcePacket: string;
  notes?: string;
}

export interface SemesterSliceScopeTarget {
  contentCapRealmId: MajorRealmId;
  status: 'locked';
}

export interface FirstLifeCapTimingTarget {
  status: TargetStatus;
  envelopeSeconds: NumericWindow;
}

export interface CityPhaseTimingTarget {
  phaseId: string;
  status: TargetStatus;
  sourcePacket: string;
  realmIndex: number;
  realmId: MajorRealmId;
  cityId: CityId;
  targetSeconds?: number;
}

export interface GateAvailabilityTarget {
  gateId: string;
  status: TargetStatus;
  sourcePacket: string;
  fromRealmId: MajorRealmId;
  toRealmId: MajorRealmId;
  availabilityWindowSeconds?: Pick<NumericWindow, 'minSeconds' | 'maxSeconds'> & { targetSeconds?: number };
}

export interface EarlyMilestoneWindowTarget {
  milestoneId: string;
  status: TargetStatus;
  sourcePacket: string;
  windowSeconds?: Pick<NumericWindow, 'minSeconds' | 'maxSeconds'> & { targetSeconds?: number };
}

export interface OfflineContributionPolicy {
  status: 'locked';
  sourcePacket: string;
  mode: 'passive_scaled_efficiency';
  baseEfficiency: number;
  prestigeEfficiencyPerLevel: number;
  maxEfficiency: number;
  meditatingOnly: false;
  maxCatchupSeconds: number;
}

export interface PrestigeRealmApCoefficient {
  realmId: MajorRealmId;
  status: TargetStatus;
  baselineAp?: number;
}

export interface PrestigeSubstageApBonusPolicy {
  status: TargetStatus;
  model: string;
  maxBonusAp?: number;
}

export interface PrestigeFutureGateBonusPolicy {
  status: TargetStatus;
  sourcePacket: string;
  model: string;
}

export interface PrestigeEconomyPolicy {
  status: TargetStatus;
  sourcePacket: string;
  unlockRealmIndex: number;
  timeBonusEnabled: boolean;
  recommendedResetRule: 'content_cap_only_for_now' | string;
  realmApBaselines: readonly PrestigeRealmApCoefficient[];
  substageApBonusPolicy: PrestigeSubstageApBonusPolicy;
  gateBonusPolicy?: PrestigeFutureGateBonusPolicy;
}

export interface DeferredCategoryTarget {
  status: 'deferred';
  sourcePacket: string;
  notes: string;
}

export interface SemesterBalanceTargets {
  semesterSlice: SemesterSliceScopeTarget;
  firstLifeCapTiming: FirstLifeCapTimingTarget;
  cityPhaseTimingTargets: readonly CityPhaseTimingTarget[];
  gateAvailabilityTargets: readonly GateAvailabilityTarget[];
  earlyMilestoneWindows: readonly EarlyMilestoneWindowTarget[];
  offlineContributionPolicy: OfflineContributionPolicy;
  prestigeEconomyPolicy: PrestigeEconomyPolicy;
  activityThroughputTargets: DeferredCategoryTarget;
  gateWinRateTargets: DeferredCategoryTarget;
  reclaimSpeedTargets: DeferredCategoryTarget;
  antiStallTargets: DeferredCategoryTarget;
}
