import { getSemesterBalanceTargets } from './semesterBalanceTargets.js';

export const PROGRESSION_MILESTONE_IDS = {
  LIFE_START: 'life_start',
  GATE_1_AVAILABLE: 'gate_1_available',
  FOUNDATION_ENTRY: 'foundation_entry',
  STONECRAG_ENTERED: 'stonecrag_entered',
  CONTENT_CAP_REACHED: 'content_cap_reached',
} as const;

export type ProgressionMilestoneId = (typeof PROGRESSION_MILESTONE_IDS)[keyof typeof PROGRESSION_MILESTONE_IDS];

export const GATE_1_TRANSITION = Object.freeze({
  fromRealmId: 'qi_condensation',
  toRealmId: 'foundation_establishment',
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
  const entry = getSemesterBalanceTargets().cityPhaseTimingTargets.find((target) => target.phaseId === 'pinewind_qi_condensation');
  return entry?.targetSeconds ?? 55 * 60;
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
  return getPinewindTargetDurationSeconds();
}

export function getDeferredRealmEntryTargetSecondsFromLifeStart() {
  return getLockedCityPhaseTargetDurations()
    .filter((entry) => entry.realmIndex >= 2)
    .map((entry) => ({
      realmId: entry.realmId,
      targetSecondsFromLifeStart: undefined,
      sourcePacket: '6.2b',
    }));
}
