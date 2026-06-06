import { GameEvents } from '../events/GameEvents.js';
import { getTrialLifecycleSnapshot } from '../../systems/progression/runtime/trialLifecycle.js';
import { getLiveRealmByIndex, isAtSemesterCap } from '../../systems/progression/runtime/liveRealmProjection.js';
import { PROGRESSION_MILESTONE_IDS } from '../../systems/balance/phaseTimingTargets.js';
const emittedMilestones = new Set();
let activeRunStartTime = null;
const makeMilestoneKey = (runStartTime, milestoneId) => `${runStartTime}:${milestoneId}`;
const emitMilestoneOnce = (runStartTime, milestoneId, emit) => {
    const key = makeMilestoneKey(runStartTime, milestoneId);
    if (emittedMilestones.has(key)) {
        return false;
    }
    emittedMilestones.add(key);
    emit();
    return true;
};
const toElapsedMs = (runStartTime, timestamp) => Math.max(0, timestamp - runStartTime);
export const progressionTimingTracker = {
    resetForRun(runStartTime) {
        for (const key of emittedMilestones) {
            if (key.startsWith(`${runStartTime}:`)) {
                emittedMilestones.delete(key);
            }
        }
    },
    emitLifeStarted(runStartTime, timestamp = Date.now(), options) {
        activeRunStartTime = runStartTime;
        emitMilestoneOnce(runStartTime, PROGRESSION_MILESTONE_IDS.LIFE_START, () => {
            GameEvents.emit({
                type: 'progression/life_started',
                payload: {
                    timestamp,
                    runStartTime,
                    elapsedMsSinceLifeStart: toElapsedMs(runStartTime, timestamp),
                    trigger: options?.trigger ?? 'other',
                    lifeOrdinal: options?.lifeOrdinal,
                    sessionKind: options?.sessionKind,
                },
            });
        });
    },
    getActiveRunStartTime() {
        return activeRunStartTime ?? Date.now();
    },
    trackFirstGateAvailability(input) {
        return this.trackGateAvailability({
            ...input,
            milestoneId: PROGRESSION_MILESTONE_IDS.GATE_1_AVAILABLE,
        });
    },
    trackGateAvailability(input) {
        // Gate availability is canonical lifecycle canStart from trialLifecycle.
        const lifecycle = getTrialLifecycleSnapshot({
            content: input.content,
            trial: input.trial,
            progress: input.trialProgress,
            realm: input.realm,
            qi: input.qi,
            breakthroughRequirement: input.breakthroughRequirement,
            requiredItemSatisfied: input.requiredItemSatisfied,
        });
        const trial = input.trial;
        if (!lifecycle.canStart || !trial) {
            return false;
        }
        const milestoneId = input.milestoneId ?? `gate_available:${trial.id}`;
        return emitMilestoneOnce(input.runStartTime, milestoneId, () => {
            GameEvents.emit({
                type: 'progression/gate_available',
                payload: {
                    timestamp: input.timestamp,
                    runStartTime: input.runStartTime,
                    elapsedMsSinceLifeStart: toElapsedMs(input.runStartTime, input.timestamp),
                    trialId: trial.id,
                    fromRealmId: input.fromRealmId,
                    toRealmId: input.toRealmId,
                    gateIndex: input.gateIndex,
                    cityId: input.cityId,
                },
            });
        });
    },
    emitGateResolved(input) {
        const milestoneId = `gate_resolved:${input.trialId}`;
        return emitMilestoneOnce(input.runStartTime, milestoneId, () => {
            GameEvents.emit({
                type: 'progression/gate_resolved',
                payload: {
                    timestamp: input.timestamp,
                    runStartTime: input.runStartTime,
                    elapsedMsSinceLifeStart: toElapsedMs(input.runStartTime, input.timestamp),
                    trialId: input.trialId,
                    fromRealmId: input.fromRealmId,
                    toRealmId: input.toRealmId,
                    gateIndex: input.gateIndex,
                    cityId: input.cityId,
                    resolution: input.resolution,
                },
            });
        });
    },
    emitBreakthrough(input) {
        const resultingRealm = getLiveRealmByIndex(input.toRealmIndex);
        const fromRealm = getLiveRealmByIndex(input.fromRealmIndex);
        GameEvents.emit({
            type: 'progression/breakthrough',
            payload: {
                timestamp: input.timestamp,
                runStartTime: input.runStartTime,
                elapsedMsSinceLifeStart: toElapsedMs(input.runStartTime, input.timestamp),
                fromRealmIndex: input.fromRealmIndex,
                toRealmIndex: input.toRealmIndex,
                fromSubstage: input.fromSubstage,
                toSubstage: input.toSubstage,
                major: input.major,
                fromRealmId: fromRealm.id,
                toRealmId: resultingRealm.id,
            },
        });
        if (input.major && isAtSemesterCap(input.toRealmIndex)) {
            emitMilestoneOnce(input.runStartTime, PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED, () => {
                GameEvents.emit({
                    type: 'progression/content_cap_reached',
                    payload: {
                        timestamp: input.timestamp,
                        runStartTime: input.runStartTime,
                        elapsedMsSinceLifeStart: toElapsedMs(input.runStartTime, input.timestamp),
                        realmId: resultingRealm.id,
                        cityId: 'city_ironpeak_bastion',
                    },
                });
            });
        }
    },
    emitCityEntered(input) {
        const milestoneId = `${PROGRESSION_MILESTONE_IDS.STONECRAG_ENTERED}:${input.cityId}`;
        return emitMilestoneOnce(input.runStartTime, milestoneId, () => {
            GameEvents.emit({
                type: 'progression/city_entered',
                payload: {
                    timestamp: input.timestamp,
                    runStartTime: input.runStartTime,
                    elapsedMsSinceLifeStart: toElapsedMs(input.runStartTime, input.timestamp),
                    cityId: input.cityId,
                    cityIndex: input.cityIndex,
                    majorRealmId: input.majorRealmId,
                },
            });
        });
    },
};
