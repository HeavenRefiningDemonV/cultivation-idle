import { useGameStore } from '../../stores/gameStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTrainingStore } from '../../stores/trainingStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { formatNumber, D } from '../../utils/numbers.js';
import type { OfflineContext } from '../../systems/offline.js';
import { formatOfflineDuration, MAX_OFFLINE_MS, resolveOfflineCultivationEfficiency } from './offlineShared.js';
import { cultivationService } from '../cultivationService.js';
import { buildCultivationConsumableCarryoverWindows } from '../../systems/consumables/cultivationConsumableEffects.js';
import { getHeartLawBonuses } from '../../systems/heartLaw/heartLawLogic.js';
import { getExpeditionReadinessDelta, getQueuedActionReadinessDelta } from '../../systems/offline/offlineSummaryReadModel.js';
import { buildOfflineCatchupSurface, type OfflineCatchupSurfaceV1 } from '../../systems/offline/offlineCatchupSurface.js';
import {
  resolveForegroundGrowthMode,
  type ForegroundGrowthKind,
  type ForegroundGrowthMode,
} from '../../systems/cultivation/foregroundGrowthResolver.js';
import type { ForegroundActivityType } from '../../types/activity.js';

export interface OfflineCatchupSummaryPart {
  kind: 'qi_gained' | 'path_training' | 'dao_heart' | 'queued_actions' | 'expeditions';
  label: string;
  value: string;
  detailRows?: Array<{
    id: string;
    label: string;
    value?: string;
    detail?: string;
  }>;
}

export interface OfflineCatchupForegroundFocus {
  mode: ForegroundGrowthKind;
  activeType: ForegroundActivityType | null;
  label: string;
  detail: string;
  pausedLabels: string[];
  pausedLabel: string;
}

export interface OfflineEfficiencySource {
  id: string;
  label: string;
  value: string;
}

export interface OfflineCatchupSummary {
  offlineSeconds: number;
  rawOfflineSeconds?: number;
  maxOfflineSeconds?: number;
  offlineDuration: string;
  efficiency: number;
  efficiencySources?: OfflineEfficiencySource[];
  wasCapped: boolean;
  foregroundFocus?: OfflineCatchupForegroundFocus;
  parts: OfflineCatchupSummaryPart[];
}

export interface OfflineCatchupResult {
  summary: OfflineCatchupSummary | null;
  surface: OfflineCatchupSurfaceV1 | null;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function getLiveOfflineEfficiency(): { value: number; sources: OfflineEfficiencySource[] } {
  const prestigeStore = usePrestigeStore.getState();
  const cultivationStore = useCultivationStore.getState();
  const heartLawId = cultivationStore.selectedHeartLawId;
  const heartLawDef = heartLawId ? useContentStore.getState().maps.heartLawsById[heartLawId] ?? null : null;
  const heartLawBonus = getHeartLawBonuses({
    heartLawDef,
    chapter: cultivationStore.chapter,
    spiritRoot: prestigeStore.spiritRoot,
  }).offlineEfficiencyAdd;

  const prestigeEfficiencyAdd = prestigeStore.getOfflineEfficiencyBonusAdditive();
  const value = resolveOfflineCultivationEfficiency({
    prestigeEfficiencyAdd,
    heartLawBonus,
  });
  const sources: OfflineEfficiencySource[] = [
    { id: 'base', label: 'Base idle settlement', value: formatPercent(resolveOfflineCultivationEfficiency({ prestigeEfficiencyAdd: 0, heartLawBonus: 0 })) },
  ];
  if (prestigeEfficiencyAdd > 0) {
    sources.push({ id: 'prestige', label: 'Prestige decree', value: `+${formatPercent(prestigeEfficiencyAdd)}` });
  }
  if (heartLawBonus > 0) {
    sources.push({ id: 'heart_law', label: 'Heart Law', value: `+${formatPercent(heartLawBonus)}` });
  }
  if (sources.length === 1) {
    sources.push({ id: 'no_bonus', label: 'No active offline bonus', value: '+0%' });
  }
  return { value, sources };
}

function calculateOfflineQiGain(startAt: number, endAt: number, offlineEfficiency: number) {
  if (offlineEfficiency <= 0 || endAt <= startAt) return D(0);
  const cultivation = useCultivationStore.getState();
  const gameStore = useGameStore.getState();
  cultivation.clearExpiredCultivationConsumables(startAt);
  const readModel = cultivation.getCultivationConsumableReadModel(startAt);
  const currentQiPerSecond = D(gameStore.qiPerSecond ?? '0');
  const baseQiPerSecond = readModel.modifiers.qiRateMult > 0
    ? currentQiPerSecond.dividedBy(readModel.modifiers.qiRateMult)
    : currentQiPerSecond;

  return buildCultivationConsumableCarryoverWindows(cultivation.activeCultivationConsumables, startAt, endAt)
    .reduce((total, window) => {
      const seconds = window.elapsedMs / 1000;
      return total.plus(baseQiPerSecond.times(window.modifiers.qiRateMult).times(seconds).times(offlineEfficiency));
    }, D(0));
}

function pausedLabelForForeground(foreground: ForegroundGrowthMode): string {
  if (foreground.mode === 'path_training') {
    return 'Full cultivation was paused while Path Training was active.';
  }
  if (foreground.mode === 'dao_heart') {
    return 'Full cultivation was paused while Dao Heart practice was active.';
  }
  if (foreground.mode === 'combat') {
    return 'Combat never progresses while offline.';
  }
  if (foreground.mode === 'queued_only') {
    return 'Full cultivation was paused while foreground queued work was active.';
  }
  return 'Path Training, Dao Heart practice, and combat did not advance as primary foreground work.';
}

function buildForegroundFocus(foreground: ForegroundGrowthMode): OfflineCatchupForegroundFocus {
  return {
    mode: foreground.mode,
    activeType: foreground.activeType,
    label: foreground.label,
    detail: `While you were away, your active foreground focus was: ${foreground.label}.`,
    pausedLabels: [...foreground.pausedPrimaryLabels],
    pausedLabel: pausedLabelForForeground(foreground),
  };
}

export function apply(context: OfflineContext): OfflineCatchupResult {
  if (context.dtMs <= 0) {
    return {
      summary: null,
      surface: buildOfflineCatchupSurface({
        summary: null,
        generatedAt: context.now,
        rawSeconds: Math.floor(context.rawMs / 1000),
      }),
    };
  }

  const seconds = Math.floor(Math.min(context.dtMs, MAX_OFFLINE_MS) / 1000);
  const summaryParts: OfflineCatchupSummaryPart[] = [];
  const startAt = context.now - seconds * 1000;
  const foreground = resolveForegroundGrowthMode(useActivityStore.getState().active);
  const foregroundFocus = buildForegroundFocus(foreground);

  const gameStore = useGameStore.getState();
  useGameStore.setState({ lastActiveTime: context.now, lastTickTime: context.now });
  const offlineEfficiencyDetail = getLiveOfflineEfficiency();
  const offlineEfficiency = offlineEfficiencyDetail.value;

  if (foreground.mode === 'cultivation') {
    const qiGain = calculateOfflineQiGain(startAt, context.now, offlineEfficiency);
    if (qiGain.greaterThan(0)) {
      const nextQi = D(gameStore.qi ?? '0').plus(qiGain);
      useGameStore.setState({ qi: nextQi.toString() });
      summaryParts.push({ kind: 'qi_gained', label: 'Qi gained', value: formatNumber(qiGain) });
    }
    cultivationService.applyOfflineProgress(seconds * 1000, startAt, context.now);
  } else if (foreground.mode === 'path_training') {
    useCultivationStore.getState().clearExpiredCultivationConsumables(context.now);
    const trainingResult = useTrainingStore.getState().applyOfflineTraining(seconds * 1000, { completedAt: context.now });
    if (trainingResult.appliedMs > 0) {
      const ratingGain = Object.values(trainingResult.totalRatingGainedById).reduce((total, value) => total + value, 0);
      const statXp = Object.values(trainingResult.totalStatXpGainedById).reduce((total, value) => total + value, 0);
      const masteryXp = Object.values(trainingResult.totalMasteryXpGainedByRegimenId).reduce((total, value) => total + value, 0);
      summaryParts.push({
        kind: 'path_training',
        label: 'Training practice',
        value: ratingGain > 0 ? `+${ratingGain} rating` : `${statXp.toFixed(1)} XP`,
        detailRows: [
          { id: 'applied_time', label: 'Applied time', value: formatOfflineDuration(Math.floor(trainingResult.appliedMs / 1000)) },
          { id: 'stat_xp', label: 'Stat XP', value: `+${statXp.toFixed(1)}` },
          { id: 'mastery_xp', label: 'Regimen mastery', value: `+${masteryXp.toFixed(1)}` },
          { id: 'fatigue_dampened', label: 'Fatigue and intensity dampening', value: `${trainingResult.intensityDowngrades} downgrades`, detail: `Fatigue changed by +${trainingResult.totalFatigueGained.toFixed(1)}.` },
          {
            id: 'cap_hits',
            label: 'Cap hits',
            value: ratingGain > 0 ? `${ratingGain} rating gained` : 'No rating cap change',
            detail: trainingResult.blockedReason ? `Stopped early: ${trainingResult.blockedReason}.` : 'Realm and fatigue caps were honored by the Training Hall resolver.',
          },
        ],
      });
    }
  } else if (foreground.mode === 'dao_heart') {
    useCultivationStore.getState().clearExpiredCultivationConsumables(context.now);
    const daoHeartResult = useCultivationStore.getState().applyOfflineDaoHeart(seconds * 1000, { completedAt: context.now });
    if (daoHeartResult.ok && daoHeartResult.appliedMs > 0) {
      summaryParts.push({
        kind: 'dao_heart',
        label: 'Dao Heart practice',
        value: daoHeartResult.levelsGained > 0
          ? `+${daoHeartResult.levelsGained} Heart Law level`
          : `+${daoHeartResult.heartLawXpGain.toFixed(1)} XP`,
        detailRows: [
          { id: 'applied_time', label: 'Applied time', value: formatOfflineDuration(Math.floor(daoHeartResult.appliedMs / 1000)) },
          { id: 'heart_law_xp', label: 'Heart Law XP', value: `+${daoHeartResult.heartLawXpGain.toFixed(1)}` },
          { id: 'verse_mastery', label: 'Verse mastery', value: `+${daoHeartResult.verseMasteryGain.toFixed(1)}` },
          { id: 'clarity_change', label: 'Clarity', value: `${daoHeartResult.clarityGain >= 0 ? '+' : ''}${daoHeartResult.clarityGain.toFixed(1)}` },
          { id: 'turbulence_change', label: 'Turbulence', value: `${daoHeartResult.turbulenceGain >= 0 ? '+' : ''}${daoHeartResult.turbulenceGain.toFixed(1)}` },
          {
            id: 'recommendation',
            label: 'Recommendation',
            value: daoHeartResult.turbulenceGain > 0 ? 'Review turbulence' : 'Continue',
            detail: 'Combat remains excluded from offline progress.',
          },
        ],
      });
    }
  } else {
    useCultivationStore.getState().clearExpiredCultivationConsumables(context.now);
  }

  const professionStore = useProfessionStore.getState();
  const beforeQueueSnapshot = {
    alchemyQueue: [...professionStore.alchemyQueue],
    talismanQueue: [...professionStore.talismanQueue],
    forgeQueue: [...professionStore.forgeQueue],
  } as const;
  professionStore.applyOffline(context.now);
  const afterProfessionStore = useProfessionStore.getState();
  const queuedReadiness = getQueuedActionReadinessDelta({
    before: beforeQueueSnapshot,
    after: {
      alchemyQueue: afterProfessionStore.alchemyQueue,
      talismanQueue: afterProfessionStore.talismanQueue,
      forgeQueue: afterProfessionStore.forgeQueue,
    },
    beforeAt: startAt,
    afterAt: context.now,
  });
  if (queuedReadiness.newlyReady > 0) {
    summaryParts.push({
      kind: 'queued_actions',
      label: 'Queued actions ready',
      value: `${queuedReadiness.newlyReady}`,
    });
  }

  const expeditionStore = useExpeditionStore.getState();
  const beforeExpeditionSnapshot = { active: expeditionStore.active.map((run) => ({ ...run })) } as const;
  expeditionStore.tick(context.now);
  const afterExpeditionStore = useExpeditionStore.getState();
  const expeditionReadiness = getExpeditionReadinessDelta({
    before: beforeExpeditionSnapshot,
    after: { active: afterExpeditionStore.active },
    beforeAt: startAt,
    afterAt: context.now,
  });
  if (expeditionReadiness.newlyComplete > 0) {
    summaryParts.push({ kind: 'expeditions', label: 'Expeditions ready', value: `${expeditionReadiness.newlyComplete}` });
  }

  const summary: OfflineCatchupSummary = {
      offlineSeconds: seconds,
      rawOfflineSeconds: Math.floor(context.rawMs / 1000),
      maxOfflineSeconds: MAX_OFFLINE_MS / 1000,
      offlineDuration: formatOfflineDuration(seconds),
      efficiency: offlineEfficiency,
      efficiencySources: offlineEfficiencyDetail.sources,
      wasCapped: context.wasCapped,
      foregroundFocus,
      parts: summaryParts,
    };

  return {
    summary,
    surface: buildOfflineCatchupSurface({
      summary,
      generatedAt: context.now,
      rawSeconds: Math.floor(context.rawMs / 1000),
    }),
  };
}
