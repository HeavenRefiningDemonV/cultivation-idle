import type {
  CityPhaseTimingTarget,
  OfflineContributionPolicy,
  PrestigeEconomyPolicy,
  SemesterBalanceTargets,
} from './balanceTargetTypes.js';

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;

export interface RealmQiBaselineInput {
  realmIndex: number;
  realmId?: string;
  qiRequirement: string;
  substages: number;
  breakthroughQiMultiplier: number;
  substageQiMultiplierStep: number;
}

const CITY_PHASE_TIMING_TARGETS = [
  {
    phaseId: 'pinewind_qi_condensation',
    status: 'locked',
    sourcePacket: '6.1a',
    realmIndex: 0,
    realmId: 'qi_condensation',
    cityId: 'city_pinewind_hamlet',
    targetSeconds: 55 * MINUTE_SECONDS,
  },
  {
    phaseId: 'stonecrag_foundation',
    status: 'locked',
    sourcePacket: '6.1a',
    realmIndex: 1,
    realmId: 'foundation_establishment',
    cityId: 'city_stonecrag_town',
    targetSeconds: 80 * MINUTE_SECONDS,
  },
  {
    phaseId: 'spirit_cavern_core_formation',
    status: 'locked',
    sourcePacket: '6.1a',
    realmIndex: 2,
    realmId: 'core_formation',
    cityId: 'city_spirit_cavern_city',
    targetSeconds: 120 * MINUTE_SECONDS,
  },
  {
    phaseId: 'lotusford_nascent_soul',
    status: 'locked',
    sourcePacket: '6.1a',
    realmIndex: 3,
    realmId: 'nascent_soul',
    cityId: 'city_lotusford',
    targetSeconds: 170 * MINUTE_SECONDS,
  },
  {
    phaseId: 'ironpeak_soul_formation',
    status: 'locked',
    sourcePacket: '6.1a',
    realmIndex: 4,
    realmId: 'soul_formation',
    cityId: 'city_ironpeak_bastion',
    targetSeconds: 250 * MINUTE_SECONDS,
  },
] as const satisfies readonly CityPhaseTimingTarget[];

const OFFLINE_CONTRIBUTION_POLICY = {
  status: 'locked',
  sourcePacket: '6.1a',
  mode: 'passive_scaled_efficiency',
  baseEfficiency: 0.5,
  prestigeEfficiencyPerLevel: 0.08,
  maxEfficiency: 0.9,
  meditatingOnly: false,
  maxCatchupSeconds: 43_200,
} as const satisfies OfflineContributionPolicy;

const PRESTIGE_ECONOMY_POLICY = {
  status: 'locked',
  sourcePacket: '6.1b',
  unlockRealmIndex: 2,
  timeBonusEnabled: false,
  recommendedResetRule: 'content_cap_only_for_now',
  realmApBaselines: [
    { realmId: 'qi_condensation', status: 'deferred' },
    { realmId: 'foundation_establishment', status: 'deferred' },
    { realmId: 'core_formation', status: 'deferred' },
    { realmId: 'nascent_soul', status: 'deferred' },
    { realmId: 'soul_formation', status: 'deferred' },
    { realmId: 'spirit_severing', status: 'deferred' },
  ],
  substageApBonusPolicy: {
    status: 'deferred',
    model: 'packet_6_2_pending',
  },
  gateBonusPolicy: {
    status: 'deferred',
    sourcePacket: '6.2',
    model: 'optional_future_gate_bonus_policy',
  },
} as const satisfies PrestigeEconomyPolicy;

export const SEMESTER_BALANCE_TARGETS: SemesterBalanceTargets = {
  semesterSlice: {
    contentCapRealmId: 'spirit_severing',
    status: 'locked',
  },
  firstLifeCapTiming: {
    status: 'locked',
    envelopeSeconds: {
      minSeconds: Math.round(9.5 * HOUR_SECONDS),
      targetSeconds: Math.round(11.5 * HOUR_SECONDS),
      maxSeconds: Math.round(13.5 * HOUR_SECONDS),
    },
  },
  cityPhaseTimingTargets: CITY_PHASE_TIMING_TARGETS,
  gateAvailabilityTargets: [
    {
      gateId: 'gate_1_qi_condensation_to_foundation',
      status: 'locked',
      sourcePacket: '6.1a',
      fromRealmId: 'qi_condensation',
      toRealmId: 'foundation_establishment',
      availabilityWindowSeconds: {
        minSeconds: 30 * MINUTE_SECONDS,
        maxSeconds: 55 * MINUTE_SECONDS,
      },
    },
    {
      gateId: 'foundation_to_core_availability',
      status: 'locked',
      sourcePacket: '6.1a',
      fromRealmId: 'foundation_establishment',
      toRealmId: 'core_formation',
      availabilityWindowSeconds: {
        minSeconds: 45 * MINUTE_SECONDS,
        maxSeconds: 75 * MINUTE_SECONDS,
      },
    },
    {
      gateId: 'core_to_nascent_availability',
      status: 'deferred',
      sourcePacket: '6.2',
      fromRealmId: 'core_formation',
      toRealmId: 'nascent_soul',
    },
    {
      gateId: 'nascent_to_soul_availability',
      status: 'deferred',
      sourcePacket: '6.2',
      fromRealmId: 'nascent_soul',
      toRealmId: 'soul_formation',
    },
    {
      gateId: 'soul_to_severing_availability',
      status: 'deferred',
      sourcePacket: '6.2',
      fromRealmId: 'soul_formation',
      toRealmId: 'spirit_severing',
    },
  ],
  offlineContributionPolicy: OFFLINE_CONTRIBUTION_POLICY,
  prestigeEconomyPolicy: PRESTIGE_ECONOMY_POLICY,
  activityThroughputTargets: {
    status: 'deferred',
    sourcePacket: '6.3',
    notes: 'Activity throughput envelopes are intentionally deferred to packet 6.3.',
  },
  gateWinRateTargets: {
    status: 'deferred',
    sourcePacket: '6.4',
    notes: 'Gate win-rate percentages are intentionally deferred to packet 6.4.',
  },
  reclaimSpeedTargets: {
    status: 'deferred',
    sourcePacket: '6.5',
    notes: 'Reclaim speed numerical targets are intentionally deferred to packet 6.5.',
  },
  antiStallTargets: {
    status: 'deferred',
    sourcePacket: '6.7',
    notes: 'Anti-stall windows are intentionally deferred to packet 6.7.',
  },
} as const;

export function getSemesterBalanceTargets(): SemesterBalanceTargets {
  return SEMESTER_BALANCE_TARGETS;
}

export function getOfflineContributionPolicy(): OfflineContributionPolicy {
  return SEMESTER_BALANCE_TARGETS.offlineContributionPolicy;
}

export function getPrestigeBaselinePolicy(): PrestigeEconomyPolicy {
  return SEMESTER_BALANCE_TARGETS.prestigeEconomyPolicy;
}

export function getTargetSecondsForRealmBaseline(realmIndex: number): number {
  const explicitCityTarget = SEMESTER_BALANCE_TARGETS.cityPhaseTimingTargets.find((target) => target.realmIndex === realmIndex);
  if (explicitCityTarget?.targetSeconds) {
    return explicitCityTarget.targetSeconds;
  }

  const remainingLifeCapSeconds =
    SEMESTER_BALANCE_TARGETS.firstLifeCapTiming.envelopeSeconds.targetSeconds -
    SEMESTER_BALANCE_TARGETS.cityPhaseTimingTargets.reduce((sum, target) => sum + (target.targetSeconds ?? 0), 0);

  return Math.max(MINUTE_SECONDS, remainingLifeCapSeconds);
}

function toStableDecimalString(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  const fixed = value.toFixed(6);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function deriveRealmBaseQiPerSecond(input: RealmQiBaselineInput): string {
  const targetSeconds = getTargetSecondsForRealmBaseline(input.realmIndex);
  const baseQiRequirement = Number.parseFloat(input.qiRequirement);

  if (!Number.isFinite(targetSeconds) || targetSeconds <= 0 || !Number.isFinite(baseQiRequirement) || baseQiRequirement <= 0) {
    return '0';
  }

  let weightedQiRequirement = 0;
  for (let substageIndex = 0; substageIndex < input.substages; substageIndex += 1) {
    const requirement = baseQiRequirement * input.breakthroughQiMultiplier ** substageIndex;
    const substageMultiplier = 1 + input.substageQiMultiplierStep * substageIndex;
    weightedQiRequirement += requirement / substageMultiplier;
  }

  const baseline = weightedQiRequirement / targetSeconds;
  return toStableDecimalString(baseline);
}
