import { COMPREHENSION_PER_MINUTE_BASE, STUDY_MASTERY_PER_MINUTE_BASE, getBreathModeMultipliers, } from '../content/tuning/cultivationTuning.js';
import { useActivityStore } from '../stores/activityStore.js';
import { useCultivationStore } from '../stores/cultivationStore.js';
import { useTechCollectionStore } from '../stores/techCollectionStore.js';
import { buildCultivationConsumableCarryoverWindows } from '../systems/consumables/cultivationConsumableEffects.js';
import { PERF_LABELS, time } from './performance/index.js';
function ensureInsightScheduled(now) {
    const store = useCultivationStore.getState();
    if (!store.selectedHeartLawId)
        return;
    store.ensureInsightCycle(now);
}
function autoResolveInsight(now) {
    const store = useCultivationStore.getState();
    if (!store.insight)
        return;
    if (store.insight.expiresAt > now)
        return;
    useCultivationStore.getState().resolveInsight('auto');
}
function applyContinuousGains(deltaMs, now = Date.now(), ignoreActivityGate = false) {
    if (deltaMs <= 0)
        return;
    const heart = useCultivationStore.getState();
    time(PERF_LABELS.cultivationServiceConsumables, () => heart.clearExpiredCultivationConsumables(now));
    if (!heart.selectedHeartLawId)
        return;
    const activity = useActivityStore.getState().active;
    const isCultivating = !activity || activity.type === 'meditate';
    if (!isCultivating && !ignoreActivityGate)
        return;
    const breath = getBreathModeMultipliers(heart.breathMode);
    const modifiers = time(PERF_LABELS.cultivationServiceConsumables, () => heart.getCultivationConsumableModifiers(now));
    const deltaMinutes = deltaMs / 60000;
    const comprehensionGain = COMPREHENSION_PER_MINUTE_BASE * deltaMinutes * breath.comprehensionMult * modifiers.comprehensionGainMult;
    if (comprehensionGain > 0) {
        time(PERF_LABELS.cultivationServiceHeartLaw, () => heart.addComprehension(comprehensionGain, 'meditation'));
    }
    const studyTechniqueId = heart.studyTechniqueId;
    if (heart.studyEnabled && studyTechniqueId) {
        const masteryGain = STUDY_MASTERY_PER_MINUTE_BASE * deltaMinutes;
        if (masteryGain > 0) {
            time(PERF_LABELS.cultivationServiceHeartLaw, () => {
                useTechCollectionStore.getState().addMasteryXp(studyTechniqueId, masteryGain);
            });
        }
    }
    time(PERF_LABELS.cultivationServiceInsight, () => {
        heart.advanceInsightTimer(deltaMs, now, modifiers.insightFrequencyMult);
    });
}
function processInsights(startAt, endAt) {
    ensureInsightScheduled(startAt);
    const windows = buildCultivationConsumableCarryoverWindows(useCultivationStore.getState().activeCultivationConsumables, startAt, endAt);
    let cursor = startAt;
    while (cursor < endAt) {
        const heart = useCultivationStore.getState();
        if (heart.insight) {
            const stepEnd = Math.min(endAt, heart.insight.expiresAt);
            if (stepEnd > cursor)
                cursor = stepEnd;
            autoResolveInsight(cursor);
            continue;
        }
        const nextWindowEnd = windows.find((window) => window.startedAt <= cursor && window.endedAt > cursor)?.endedAt ?? endAt;
        const nextInsight = heart.nextInsightAt ?? endAt;
        const stepEnd = Math.min(endAt, nextWindowEnd, nextInsight);
        const delta = Math.max(0, stepEnd - cursor);
        if (delta > 0) {
            applyContinuousGains(delta, stepEnd, true);
        }
        cursor = stepEnd;
        const latest = useCultivationStore.getState();
        latest.clearExpiredCultivationConsumables(cursor);
        if (latest.insight && latest.insight.startedAt <= cursor) {
            continue;
        }
        if (!latest.insight) {
            latest.ensureInsightCycle(cursor);
        }
    }
}
export const cultivationService = {
    tick(deltaMs) {
        time(PERF_LABELS.cultivationServiceTick, () => {
            const now = Date.now();
            applyContinuousGains(deltaMs, now);
            autoResolveInsight(now);
            const store = useCultivationStore.getState();
            if (!store.insight) {
                time(PERF_LABELS.cultivationServiceInsight, () => ensureInsightScheduled(now));
            }
        });
    },
    applyOfflineProgress(deltaMs, startAt, endAt) {
        if (deltaMs > 0) {
            processInsights(startAt, endAt);
        }
        const now = Date.now();
        const store = useCultivationStore.getState();
        store.clearExpiredCultivationConsumables(now);
        if (!store.insight) {
            store.ensureInsightCycle(now);
        }
    },
    resolveInsight(choiceId) {
        useCultivationStore.getState().resolveInsight(choiceId);
    },
    applyContinuousGains,
};
