import {
  COMPREHENSION_PER_MINUTE_BASE,
  STUDY_MASTERY_PER_MINUTE_BASE,
  getBreathModeMultipliers,
} from '../content/tuning/cultivationTuning.js';
import { useActivityStore } from '../stores/activityStore.js';
import { useCultivationStore } from '../stores/cultivationStore.js';
import { useTechCollectionStore } from '../stores/techCollectionStore.js';
import type { InsightChoiceId } from '../types/index.js';
import { buildCultivationConsumableCarryoverWindows } from '../systems/consumables/cultivationConsumableEffects.js';

function ensureInsightScheduled(now: number) {
  const store = useCultivationStore.getState();
  if (!store.selectedHeartLawId) return;
  store.ensureInsightCycle(now);
}

function autoResolveInsight(now: number) {
  const store = useCultivationStore.getState();
  if (!store.insight) return;
  if (store.insight.expiresAt > now) return;
  useCultivationStore.getState().resolveInsight('auto');
}

function applyContinuousGains(deltaMs: number, now = Date.now(), ignoreActivityGate = false) {
  if (deltaMs <= 0) return;
  const heart = useCultivationStore.getState();
  heart.clearExpiredCultivationConsumables(now);
  if (!heart.selectedHeartLawId) return;

  const activity = useActivityStore.getState().active;
  const isCultivating = !activity || activity.type === 'meditate';
  if (!isCultivating && !ignoreActivityGate) return;

  const breath = getBreathModeMultipliers(heart.breathMode);
  const modifiers = heart.getCultivationConsumableModifiers(now);
  const deltaMinutes = deltaMs / 60000;
  const comprehensionGain = COMPREHENSION_PER_MINUTE_BASE * deltaMinutes * breath.comprehensionMult * modifiers.comprehensionGainMult;
  if (comprehensionGain > 0) {
    heart.addComprehension(comprehensionGain, 'meditation');
  }

  if (heart.studyEnabled && heart.studyTechniqueId) {
    const masteryGain = STUDY_MASTERY_PER_MINUTE_BASE * deltaMinutes;
    if (masteryGain > 0) {
      useTechCollectionStore.getState().addMasteryXp(heart.studyTechniqueId, masteryGain);
    }
  }

  heart.advanceInsightTimer(deltaMs, now, modifiers.insightFrequencyMult);
}

function processInsights(startAt: number, endAt: number) {
  ensureInsightScheduled(startAt);
  const windows = buildCultivationConsumableCarryoverWindows(
    useCultivationStore.getState().activeCultivationConsumables,
    startAt,
    endAt,
  );

  let cursor = startAt;
  while (cursor < endAt) {
    const heart = useCultivationStore.getState();
    if (heart.insight) {
      const stepEnd = Math.min(endAt, heart.insight.expiresAt);
      if (stepEnd > cursor) cursor = stepEnd;
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
  tick(deltaMs: number) {
    const now = Date.now();
    applyContinuousGains(deltaMs, now);
    autoResolveInsight(now);
    const store = useCultivationStore.getState();
    if (!store.insight) {
      ensureInsightScheduled(now);
    }
  },
  applyOfflineProgress(deltaMs: number, startAt: number, endAt: number) {
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
  resolveInsight(choiceId: InsightChoiceId) {
    useCultivationStore.getState().resolveInsight(choiceId);
  },
  applyContinuousGains,
};
