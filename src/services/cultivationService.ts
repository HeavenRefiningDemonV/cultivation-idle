import { COMPREHENSION_PER_MINUTE_BASE, INSIGHT_DURATION_MS, INSIGHT_INTERVAL_RANGE_MS, STUDY_MASTERY_PER_MINUTE_BASE, getBreathModeMultipliers } from '../content/tuning/cultivationTuning';
import { useActivityStore } from '../stores/activityStore';
import { useCultivationStore } from '../stores/cultivationStore';
import { useTechCollectionStore } from '../stores/techCollectionStore';
import type { InsightChoiceId } from '../types';

function randomInsightTime(now: number) {
  const span = INSIGHT_INTERVAL_RANGE_MS.max - INSIGHT_INTERVAL_RANGE_MS.min;
  return now + Math.random() * span + INSIGHT_INTERVAL_RANGE_MS.min;
}

function ensureInsightScheduled(now: number) {
  const store = useCultivationStore.getState();
  if (!store.selectedHeartLawId) return;
  if (store.nextInsightAt && store.nextInsightAt > now) return;
  useCultivationStore.getState().scheduleNextInsight(now);
}

function openInsight(now: number) {
  const store = useCultivationStore.getState();
  if (!store.selectedHeartLawId) return;
  useCultivationStore.setState((state) => {
    state.insight = {
      pending: true,
      startedAt: now,
      expiresAt: now + INSIGHT_DURATION_MS,
      defaultChoiceId: 'contemplate',
      choices: [
        { id: 'contemplate', title: 'Contemplate', description: 'Focus inward for a burst of insight.' },
        { id: 'stabilize', title: 'Stabilize', description: 'Calm your breath to steady your foundation.' },
        { id: 'drawQi', title: 'Draw Qi', description: 'Absorb ambient qi for a quick boost.' },
      ],
    };
    state.nextInsightAt = randomInsightTime(now);
  });
}

function autoResolveInsight(now: number) {
  const store = useCultivationStore.getState();
  if (!store.insight) return;
  if (store.insight.expiresAt > now) return;
  useCultivationStore.getState().resolveInsight('auto');
}

function applyContinuousGains(deltaMs: number, ignoreActivityGate = false) {
  if (deltaMs <= 0) return;
  const heart = useCultivationStore.getState();
  if (!heart.selectedHeartLawId) return;

  const activity = useActivityStore.getState().active;
  const isCultivating = !activity || activity.type === 'meditate';
  if (!isCultivating && !ignoreActivityGate) return;

  const breath = getBreathModeMultipliers(heart.breathMode);
  const deltaMinutes = deltaMs / 60000;
  const comprehensionGain = COMPREHENSION_PER_MINUTE_BASE * deltaMinutes * breath.comprehensionMult;
  if (comprehensionGain > 0) {
    useCultivationStore.getState().addComprehension(comprehensionGain, 'meditation');
  }

  if (heart.studyEnabled && heart.studyTechniqueId) {
    const masteryGain = STUDY_MASTERY_PER_MINUTE_BASE * deltaMinutes;
    if (masteryGain > 0) {
      useTechCollectionStore.getState().addMasteryXp(heart.studyTechniqueId, masteryGain);
    }
  }
}

function processInsights(now: number, endAt: number) {
  ensureInsightScheduled(now);
  let cursor = now;
  while (cursor < endAt) {
    const store = useCultivationStore.getState();
    const nextTrigger = store.insight?.expiresAt ?? store.nextInsightAt ?? endAt;
    const stepEnd = Math.min(endAt, nextTrigger ?? endAt);
    const delta = stepEnd - cursor;
    if (delta > 0) {
      applyContinuousGains(delta, true);
      cursor += delta;
    } else {
      cursor = stepEnd;
    }

    const latest = useCultivationStore.getState();
    if (latest.insight && latest.insight.expiresAt <= cursor) {
      useCultivationStore.getState().resolveInsight('auto');
    } else if (!latest.insight && latest.nextInsightAt && latest.nextInsightAt <= cursor) {
      openInsight(latest.nextInsightAt);
      cursor = Math.max(cursor, latest.nextInsightAt);
    } else if (!latest.insight && latest.nextInsightAt && latest.nextInsightAt < cursor) {
      openInsight(cursor);
    }
  }
}

export const cultivationService = {
  tick(deltaMs: number) {
    const now = Date.now();
    applyContinuousGains(deltaMs);
    autoResolveInsight(now);
    const store = useCultivationStore.getState();
    if (!store.insight && store.nextInsightAt && store.nextInsightAt <= now) {
      openInsight(store.nextInsightAt);
    } else if (!store.nextInsightAt) {
      ensureInsightScheduled(now);
    }
  },
  applyOfflineProgress(deltaMs: number, startAt: number, endAt: number) {
    processInsights(startAt, endAt);
    // Ensure next insight is scheduled after offline catch-up
    const now = Date.now();
    const store = useCultivationStore.getState();
    if (!store.nextInsightAt || store.nextInsightAt < now) {
      useCultivationStore.setState((state) => {
        state.nextInsightAt = randomInsightTime(now);
      });
    }
  },
  resolveInsight(choiceId: InsightChoiceId) {
    useCultivationStore.getState().resolveInsight(choiceId);
  },
};
