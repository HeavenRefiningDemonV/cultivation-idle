import { getSemesterBalanceTargets } from './semesterBalanceTargets.js';

export const PROGRESSION_MILESTONE_IDS = {
  LIFE_START: 'life_start',
  GATE_1_AVAILABLE: 'gate_1_available',
  FOUNDATION_ENTRY: 'foundation_entry',
  CORE_FORMATION_ENTRY: 'core_formation_entry',
  NASCENT_SOUL_ENTRY: 'nascent_soul_entry',
  SOUL_FORMATION_ENTRY: 'soul_formation_entry',
  SPIRIT_SEVERING_ENTRY: 'spirit_severing_entry',
  STONECRAG_ENTERED: 'stonecrag_entered',
  CONTENT_CAP_REACHED: 'content_cap_reached',
} as const;

export type ProgressionMilestoneId = (typeof PROGRESSION_MILESTONE_IDS)[keyof typeof PROGRESSION_MILESTONE_IDS];

export const GATE_1_TRANSITION = Object.freeze({
  fromRealmId: 'qi_condensation',
  toRealmId: 'foundation_establishment',
});

export const PHASE_TIMING_NORMALIZATION = Object.freeze({
  contentCapMilestoneId: PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED,
  contentCapEquivalentRealmEntryMilestoneId: PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY,
  phaseBoundaryAuthority: 'major_realm_entry',
  cityEnteredEventRole: 'telemetry_only',
  laterGateAvailabilityWindowsStatus: 'deferred_unless_locked_source_exists',
});

type PhaseTarget = {
  phaseId: string;
  targetSeconds: number;
  startMilestoneId: ProgressionMilestoneId;
  endMilestoneId: ProgressionMilestoneId;
};

type CumulativeMilestoneTarget = {
  milestoneId: ProgressionMilestoneId;
  targetSecondsFromLifeStart: number;
};

const PHASE_TARGETS = Object.freeze([
  {
    phaseId: 'pinewind_phase_target_seconds',
    targetSeconds: 55 * 60,
    startMilestoneId: PROGRESSION_MILESTONE_IDS.LIFE_START,
    endMilestoneId: PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY,
  },
  {
    phaseId: 'stonecrag_phase_target_seconds',
    targetSeconds: 80 * 60,
    startMilestoneId: PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY,
    endMilestoneId: PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY,
  },
  {
    phaseId: 'spirit_cavern_phase_target_seconds',
    targetSeconds: 120 * 60,
    startMilestoneId: PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY,
    endMilestoneId: PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY,
  },
  {
    phaseId: 'lotusford_phase_target_seconds',
    targetSeconds: 170 * 60,
    startMilestoneId: PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY,
    endMilestoneId: PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY,
  },
  {
    phaseId: 'ironpeak_phase_target_seconds',
    targetSeconds: 250 * 60,
    startMilestoneId: PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY,
    endMilestoneId: PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY,
  },
] as const satisfies readonly PhaseTarget[]);

const CUMULATIVE_MILESTONE_TARGETS = Object.freeze(
  PHASE_TARGETS.reduce<CumulativeMilestoneTarget[]>((acc, phase) => {
    const previousTotal = acc.at(-1)?.targetSecondsFromLifeStart ?? 0;
    acc.push({
      milestoneId: phase.endMilestoneId,
      targetSecondsFromLifeStart: previousTotal + phase.targetSeconds,
    });
    return acc;
  }, []),
);

export const PHASE_TIMING_PROBE_VALIDATION_SLACK = Object.freeze({
  ratio: 0.12,
  minSeconds: 5 * 60,
  maxSeconds: 20 * 60,
  roundingSeconds: 60,
});

export function getGate1AvailabilityWindowSeconds() {
  const target = getSemesterBalanceTargets().gateAvailabilityTargets.find((entry) => entry.gateId === 'gate_1_qi_condensation_to_foundation');
  return target?.availabilityWindowSeconds ?? { minSeconds: 30 * 60, maxSeconds: 55 * 60 };
}

export function getFoundationEntryWindowSeconds() {
  const target = getSemesterBalanceTargets().earlyMilestoneWindows.find((entry) => entry.milestoneId === PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY);
  return target?.windowSeconds ?? { minSeconds: 45 * 60, maxSeconds: 75 * 60 };
}

export function getPinewindTargetDurationSeconds(): number {
  return getPhaseTargetDurationsSeconds().find((entry) => entry.phaseId === 'pinewind_phase_target_seconds')?.targetSeconds ?? 55 * 60;
}

export function getPhaseTargetDurationsSeconds() {
  return [...PHASE_TARGETS];
}

export function getCumulativeMajorEntryTargetSeconds() {
  return [...CUMULATIVE_MILESTONE_TARGETS];
}

export function getCumulativeMajorEntryTargetSecondsByMilestoneId() {
  return new Map(getCumulativeMajorEntryTargetSeconds().map((entry) => [entry.milestoneId, entry.targetSecondsFromLifeStart]));
}

export function getFirstLifeCapBandSeconds() {
  const envelope = getSemesterBalanceTargets().firstLifeCapTiming.envelopeSeconds;
  return {
    minSeconds: envelope.minSeconds,
    maxSeconds: envelope.maxSeconds,
  };
}

export function getLockedCityPhaseTargetDurations() {
  return getSemesterBalanceTargets().cityPhaseTimingTargets
    .filter((target) => target.status === 'locked' && typeof target.targetSeconds === 'number')
    .map((target) => ({
      phaseId: target.phaseId,
      realmIndex: target.realmIndex,
      realmId: target.realmId,
      cityId: target.cityId,
      targetSeconds: target.targetSeconds as number,
    }));
}

export function getDeferredGateAvailabilityTargets() {
  return getSemesterBalanceTargets().gateAvailabilityTargets
    .filter((target) => target.status === 'deferred')
    .map((target) => ({ gateId: target.gateId, sourcePacket: target.sourcePacket }));
}

export function getFoundationEntryTargetSecondsFromLifeStart(): number {
  return getCumulativeMajorEntryTargetSecondsByMilestoneId().get(PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY) ?? getPinewindTargetDurationSeconds();
}

export function getDeferredRealmEntryTargetSecondsFromLifeStart() {
  return getDeferredGateAvailabilityTargets().map((entry) => ({
    gateId: entry.gateId,
    targetSecondsFromLifeStart: undefined,
    sourcePacket: '6.2d',
  }));
}

export function getPhaseValidationToleranceSeconds(targetSeconds: number): number {
  const rawSeconds = targetSeconds * PHASE_TIMING_PROBE_VALIDATION_SLACK.ratio;
  const rounded = Math.round(rawSeconds / PHASE_TIMING_PROBE_VALIDATION_SLACK.roundingSeconds) * PHASE_TIMING_PROBE_VALIDATION_SLACK.roundingSeconds;
  return Math.max(PHASE_TIMING_PROBE_VALIDATION_SLACK.minSeconds, Math.min(PHASE_TIMING_PROBE_VALIDATION_SLACK.maxSeconds, rounded));
}

type TimingReportInput = {
  milestoneOrder: string[];
  cumulativeMilestoneSeconds: Partial<Record<string, number>>;
};

export function buildPhaseTimingReport(input: TimingReportInput) {
  const cumulativeTargets = getCumulativeMajorEntryTargetSecondsByMilestoneId();
  const phaseRows = getPhaseTargetDurationsSeconds().map((phase) => {
    const startSeconds = input.cumulativeMilestoneSeconds[phase.startMilestoneId];
    const endSeconds = input.cumulativeMilestoneSeconds[phase.endMilestoneId];
    const actualSeconds = typeof startSeconds === 'number' && typeof endSeconds === 'number' ? Math.max(0, endSeconds - startSeconds) : null;
    const toleranceSeconds = getPhaseValidationToleranceSeconds(phase.targetSeconds);
    const driftSeconds = typeof actualSeconds === 'number' ? actualSeconds - phase.targetSeconds : null;
    const driftRatio = typeof driftSeconds === 'number' ? driftSeconds / phase.targetSeconds : null;
    return {
      phaseId: phase.phaseId,
      startMilestoneId: phase.startMilestoneId,
      endMilestoneId: phase.endMilestoneId,
      targetSeconds: phase.targetSeconds,
      actualSeconds,
      driftSeconds,
      driftRatio,
      driftPercent: typeof driftRatio === 'number' ? driftRatio * 100 : null,
      toleranceSeconds,
      withinValidationSlack: typeof driftSeconds === 'number' ? Math.abs(driftSeconds) <= toleranceSeconds : false,
    };
  });

  const cumulativeRows = getCumulativeMajorEntryTargetSeconds().map((target) => {
    const actualSeconds = input.cumulativeMilestoneSeconds[target.milestoneId];
    const driftSeconds = typeof actualSeconds === 'number' ? actualSeconds - target.targetSecondsFromLifeStart : null;
    const driftRatio = typeof driftSeconds === 'number' ? driftSeconds / target.targetSecondsFromLifeStart : null;
    return {
      milestoneId: target.milestoneId,
      targetSecondsFromLifeStart: target.targetSecondsFromLifeStart,
      actualSecondsFromLifeStart: typeof actualSeconds === 'number' ? actualSeconds : null,
      driftSeconds,
      driftRatio,
      driftPercent: typeof driftRatio === 'number' ? driftRatio * 100 : null,
    };
  });

  const capBand = getFirstLifeCapBandSeconds();
  const capSeconds = input.cumulativeMilestoneSeconds[PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY]
    ?? input.cumulativeMilestoneSeconds[PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED];

  return {
    milestoneOrder: [...input.milestoneOrder],
    cumulativeMilestones: cumulativeRows,
    phaseDurations: phaseRows,
    capBandSeconds: capBand,
    capSecondsFromLifeStart: typeof capSeconds === 'number' ? capSeconds : null,
    capWithinBand: typeof capSeconds === 'number' ? capSeconds >= capBand.minSeconds && capSeconds <= capBand.maxSeconds : false,
    contentCapRepresentsSpiritSeveringEntry: true,
    phaseBoundariesUseMajorRealmEntry: true,
    cumulativeTargetsByMilestoneId: Object.fromEntries(cumulativeTargets.entries()),
  };
}
