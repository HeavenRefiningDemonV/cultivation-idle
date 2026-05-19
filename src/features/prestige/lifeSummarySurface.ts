import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
import { buildSection5StatusSurface } from '../../systems/readiness/section5Adapters.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useBreakthroughEchoStore } from '../breakthroughEchoes/index.js';
import { captureMemoryEligibleDaoImpressions } from '../../systems/daoImpressions/index.js';
import { captureResolvedFailureReflections } from '../../systems/failureReflection/index.js';
import { getPrestigeAdvisorSurface, type PrestigeAdvisorStateLabel } from './prestigeAdvisorSurface.js';
import { buildPostResetObjectivePreview, type PrestigePostResetObjective } from './prestigeForecastSurface.js';
import {
  formatArchetypeLabel,
  formatCityLabel,
  formatDiagnosisLabel,
  formatGateTrialLabel,
  formatHeartLawLabel,
  formatPathLabel,
  formatReadinessBandLabel,
} from '../../ui/text/playerFacingFormatters.js';

export type LifeSummaryBlockKey =
  | 'life_arc'
  | 'breakthrough_echoes'
  | 'doctrine_build'
  | 'world_progress'
  | 'gate_trials'
  | 'ruins_supply'
  | 'economy_support'
  | 'offline_background'
  | 'next_life_focus';

export type LifeSummaryMode = 'current' | 'last_completed' | 'post_reset';

export type LifeSummarySeal =
  | 'quiet_life'
  | 'gate_challenger'
  | 'realm_successor'
  | 'chapter_exhausted'
  | 'reclaimer';

export type LifeMemoryLine = {
  id: string;
  title: string;
  detail: string;
  source: 'breakthrough_echo' | 'gate_trial' | 'city_arrival' | 'dao_impression' | 'ruins' | 'bounty' | 'expedition' | 'offline' | 'prestige';
  summaryEligible: boolean;
};

export interface LifeSummaryBlock {
  key: LifeSummaryBlockKey;
  title: string;
  lines: string[];
}

export interface PrestigeLifeSummarySnapshot {
  version: 2;
  capturedAt: number;
  lifeOrdinal: number;
  advisorLabel: PrestigeAdvisorStateLabel;
  apForecastGain: number;
  apAfterRitual: number;
  headline: string;
  summarySeal: LifeSummarySeal;
  blocks: LifeSummaryBlock[];
  majorMemories: LifeMemoryLine[];
  nextLifeFocus: PrestigePostResetObjective;
  warnings: string[];
}

export interface LifeSummarySurface {
  version: 2;
  mode: LifeSummaryMode;
  capturedAt: number;
  lifeOrdinal: number;
  advisorLabel: PrestigeAdvisorStateLabel;
  apForecastGain: number;
  apAfterRitual: number;
  headline: string;
  summarySeal: LifeSummarySeal;
  blocks: LifeSummaryBlock[];
  majorMemories: LifeMemoryLine[];
  nextLifeFocus: PrestigePostResetObjective;
  warnings: string[];
}

const BLOCKS: ReadonlyArray<{ key: LifeSummaryBlockKey; title: string }> = Object.freeze([
  { key: 'life_arc', title: 'Life Arc' },
  { key: 'breakthrough_echoes', title: 'Breakthrough Echoes' },
  { key: 'doctrine_build', title: 'Doctrine & Build' },
  { key: 'world_progress', title: 'World Progress' },
  { key: 'gate_trials', title: 'Gate Trials' },
  { key: 'ruins_supply', title: 'Ruins & Supply' },
  { key: 'economy_support', title: 'Economy Support' },
  { key: 'offline_background', title: 'Offline & Background' },
  { key: 'next_life_focus', title: 'Next Life Focus' },
]);

const clampLines = (lines: string[], fallback: string): string[] => {
  const normalized = lines.filter((line) => typeof line === 'string' && line.trim().length > 0).map((line) => line.trim());
  const deduped = normalized.filter((line, index, values) => values.indexOf(line) === index);
  if (deduped.length === 0) return [fallback];
  return deduped.slice(0, 5);
};

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const resolveSummarySeal = (args: {
  advisor: PrestigeAdvisorStateLabel;
  clearedTrials: number;
  highestRealmIndex: number;
  prestigeCount: number;
}): LifeSummarySeal => {
  if (args.advisor === 'Recommended') return 'chapter_exhausted';
  if (args.prestigeCount > 0) return 'reclaimer';
  if (args.highestRealmIndex >= 2) return 'realm_successor';
  if (args.clearedTrials > 0) return 'gate_challenger';
  return 'quiet_life';
};

const buildHeadline = (args: {
  realmName: string;
  advisor: PrestigeAdvisorStateLabel;
  apGain: number;
}): string => {
  if (args.advisor === 'Too Early') {
    return `${args.realmName} life is still gathering enough proof for reincarnation.`;
  }
  if (args.advisor === 'Recommended') {
    return `${args.realmName} life has reached a rational reincarnation handoff for +${args.apGain} AP.`;
  }
  return `${args.realmName} life can be sealed now for +${args.apGain} AP, with more value possible if you continue.`;
};

const buildMajorMemories = (args: {
  echoes: { echoId: string; memoryLine: string }[];
  daoImpressions: { awardId: string; title: string; memoryLine: string }[];
  failureReflections: { reflectionId: string; diagnosisCode: string; correctiveRoute: { label: string }; resolvedBy?: string }[];
  clearedTrials: number;
  bypassedTrials: number;
  totalRuinsRuns: number;
  offlineLine: string | null;
}): LifeMemoryLine[] => {
  const memories: LifeMemoryLine[] = args.echoes.slice(-3).map((echo) => ({
    id: `echo_${echo.echoId}`,
    title: 'Breakthrough Echo',
    detail: echo.memoryLine,
    source: 'breakthrough_echo',
    summaryEligible: true,
  }));

  args.daoImpressions.slice(0, 3).forEach((award) => {
    memories.push({
      id: `dao_${award.awardId}`,
      title: award.title,
      detail: award.memoryLine,
      source: 'dao_impression',
      summaryEligible: true,
    });
  });

  args.failureReflections.slice(0, 2).forEach((reflection) => {
    memories.push({
      id: `reflection_${reflection.reflectionId}`,
      title: 'Resolved Inner Demon',
      detail: `Resolved ${reflection.diagnosisCode} gate pattern through ${reflection.correctiveRoute.label}.`,
      source: 'gate_trial',
      summaryEligible: true,
    });
  });

  if (args.clearedTrials > 0 || args.bypassedTrials > 0) {
    memories.push({
      id: 'gate_trial_record',
      title: 'Gate Trial Record',
      detail: `${args.clearedTrials} cleared, ${args.bypassedTrials} bypassed.`,
      source: 'gate_trial',
      summaryEligible: true,
    });
  }
  if (args.totalRuinsRuns > 0) {
    memories.push({
      id: 'ruins_record',
      title: 'Ruins Record',
      detail: `${args.totalRuinsRuns} ruins run${args.totalRuinsRuns === 1 ? '' : 's'} completed this life.`,
      source: 'ruins',
      summaryEligible: true,
    });
  }
  if (args.offlineLine) {
    memories.push({
      id: 'offline_record',
      title: 'Offline Record',
      detail: args.offlineLine,
      source: 'offline',
      summaryEligible: true,
    });
  }
  if (memories.length === 0) {
    memories.push({
      id: 'quiet_life',
      title: 'Quiet Life',
      detail: 'No major breakthrough, gate, ruins, or offline memories have been recorded yet.',
      source: 'prestige',
      summaryEligible: true,
    });
  }
  return memories.slice(0, 6);
};

const buildCurrentBlocks = (): LifeSummaryBlock[] => {
  const now = Date.now();
  const game = useGameStore.getState();
  const prestige = usePrestigeStore.getState();
  const cultivation = useCultivationStore.getState();
  const city = useCityStore.getState();
  const trial = useTrialStore.getState();
  const ruins = useRuinsStore.getState();
  const inventory = useInventoryStore.getState();
  const ui = useUIStore.getState();
  const bounties = useBountyStore.getState();
  const expeditions = useExpeditionStore.getState();
  const profession = useProfessionStore.getState();
  const echoes = useBreakthroughEchoStore.getState().echoes;
  const daoImpressions = captureMemoryEligibleDaoImpressions(3);
  const failureReflections = captureResolvedFailureReflections(2);
  const advisor = getPrestigeAdvisorSurface();
  const status = buildSection5StatusSurface();

  const totalTrialAttempts = Object.values(trial.progressByTrialId).reduce((sum, progress) => sum + progress.attempts, 0);
  const clearedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'cleared').length;
  const bypassedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'bypassed').length;
  const totalRuinsRuns = Object.values(ruins.progressByRuinId).reduce((sum, progress) => sum + progress.totalRuns, 0);
  const totalRuinsRooms = Object.values(ruins.progressByRuinId).reduce((sum, progress) => sum + progress.totalRoomsCleared, 0);
  const activeQueues = profession.alchemyQueue.length + profession.talismanQueue.length + profession.forgeQueue.length;
  const activeExpeditions = expeditions.active.length;
  const completedExpeditions = expeditions.active.filter((run) => run.status === 'complete' || now >= run.endsAt).length;
  const bountyRecords = Object.values(bounties.activeByCityId ?? {}).reduce((sum, board) => sum + board.length, 0);
  const lastOffline = ui.lastOfflineSummary;
  const offlineLine = lastOffline
    ? `${lastOffline.offlineDuration} considered at ${Math.round(lastOffline.efficiency * 100)}% efficiency.`
    : null;

  const topPurchase = advisor.topRecommendedPurchase;
  const nextLifeFocus = buildPostResetObjectivePreview();

  const linesByKey: Record<LifeSummaryBlockKey, string[]> = {
    life_arc: clampLines([
      `Current realm: ${getLiveRealmNameByIndex(game.realm.index)}`,
      `Current life time: ${formatDuration(now - prestige.runStartTime)}`,
      `Potential AP on Reincarnation: +${advisor.apForecast.potentialGain}`,
      `Reincarnations completed: ${prestige.prestigeCount}`,
    ], 'This life has only just begun.'),
    breakthrough_echoes: clampLines(
      echoes.map((echo) => echo.memoryLine),
      'No breakthrough echoes have been recorded this life.',
    ),
    doctrine_build: clampLines([
      `Path: ${formatPathLabel(game.selectedPath)}`,
      `Heart Law: ${formatHeartLawLabel(cultivation.selectedHeartLawId)}`,
      `Build posture: ${formatArchetypeLabel(status.archetypeId)}`,
      ...daoImpressions.map((award) => award.memoryLine),
      prestige.spiritRoot ? `Spirit Root: grade ${prestige.spiritRoot.grade}, ${prestige.spiritRoot.element}, purity ${prestige.spiritRoot.purity}%` : 'Spirit Root not rolled yet.',
    ], 'Doctrine data is still sparse for this life.'),
    world_progress: clampLines([
      `Current city: ${formatCityLabel(city.currentCityId)}`,
      `Current gate trial: ${status.currentGateTrialId ? formatGateTrialLabel(status.currentGateTrialId) : 'No active gate trial in focus'}`,
      `Readiness band: ${formatReadinessBandLabel(status.overallBand)}`,
      status.warnings[0] ?? '',
    ], 'World progression details are still loading.'),
    gate_trials: clampLines([
      `Gate trials cleared: ${clearedTrials}`,
      `Gate trials bypassed: ${bypassedTrials}`,
      `Total gate attempts: ${totalTrialAttempts}`,
      ...failureReflections.map((reflection) => `Resolved Inner Demon: ${reflection.diagnosisCode} corrected through ${reflection.correctiveRoute.label}.`),
      status.currentDiagnosis ? `Latest diagnosis: ${formatDiagnosisLabel(status.currentDiagnosis.primary)}` : 'No active gate diagnosis recorded.',
    ], 'No gate trial progress has been recorded yet.'),
    ruins_supply: clampLines([
      `Ruins runs: ${totalRuinsRuns}`,
      `Ruins rooms cleared: ${totalRuinsRooms}`,
      ruins.lastRunSummary ? `Last ruins run: ${ruins.lastRunSummary.victory ? 'Victory' : 'Defeat'} (${ruins.lastRunSummary.roomsCleared}/${ruins.lastRunSummary.roomCount} rooms)` : 'No ruins run completed this life.',
      `Current gold on hand: ${inventory.currencies.gold}`,
    ], 'No ruins or supply activity has been recorded yet.'),
    economy_support: clampLines([
      `Profession queues active: ${activeQueues}`,
      `Bounty records touched: ${bountyRecords}`,
      activeExpeditions > 0 ? `Expeditions running: ${activeExpeditions}` : 'No expedition currently running.',
      completedExpeditions > 0 ? `Expeditions ready: ${completedExpeditions}` : '',
      status.currentDiagnosis ? `Strongest support route: fix ${formatDiagnosisLabel(status.currentDiagnosis.primary)}.` : '',
    ], 'No major support loop has been recorded yet.'),
    offline_background: clampLines([
      offlineLine ?? 'No offline settlement has been recorded in this session.',
      lastOffline?.wasCapped ? 'Last offline settlement hit the cap.' : '',
      lastOffline?.parts.find((part) => part.kind === 'queued_actions') ? 'Queued actions became ready while away.' : '',
      lastOffline?.parts.find((part) => part.kind === 'expeditions') ? 'Expeditions became ready while away.' : '',
      'Combat never progresses offline.',
    ], 'No offline background summary is available yet.'),
    next_life_focus: clampLines([
      `${nextLifeFocus.label}: ${nextLifeFocus.detail}`,
      status.currentDiagnosis ? `Fix diagnosis first: ${formatDiagnosisLabel(status.currentDiagnosis.primary)}` : '',
      status.currentGateTrialId ? `Center prep around ${formatGateTrialLabel(status.currentGateTrialId)} before your next reset.` : '',
      topPurchase ? `${topPurchase.mode === 'buy_now' ? 'Buy now' : 'Save for'} ${topPurchase.name} (${topPurchase.nextCost} AP)` : '',
    ], 'Hold a steady line and gather clearer signals before your next reset.').slice(0, 3),
  };

  return BLOCKS.map((block) => ({
    key: block.key,
    title: block.title,
    lines: linesByKey[block.key],
  }));
};

export const buildCurrentLifeSummarySurface = (): LifeSummarySurface => {
  const advisor = getPrestigeAdvisorSurface();
  const prestige = usePrestigeStore.getState();
  const game = useGameStore.getState();
  const trial = useTrialStore.getState();
  const ruins = useRuinsStore.getState();
  const ui = useUIStore.getState();
  const echoes = useBreakthroughEchoStore.getState().echoes;
  const daoImpressions = captureMemoryEligibleDaoImpressions(3);
  const failureReflections = captureResolvedFailureReflections(2);
  const clearedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'cleared').length;
  const bypassedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'bypassed').length;
  const totalRuinsRuns = Object.values(ruins.progressByRuinId).reduce((sum, progress) => sum + progress.totalRuns, 0);
  const highestRealmIndex = Math.max(prestige.highestRealmReached, game.realm?.index ?? 0);
  const realmName = getLiveRealmNameByIndex(highestRealmIndex);
  const nextLifeFocus = buildPostResetObjectivePreview();
  const summarySeal = resolveSummarySeal({
    advisor: advisor.stateLabel,
    clearedTrials,
    highestRealmIndex,
    prestigeCount: prestige.prestigeCount,
  });

  return {
    version: 2,
    mode: 'current',
    capturedAt: Date.now(),
    lifeOrdinal: prestige.prestigeCount + 1,
    advisorLabel: advisor.stateLabel,
    apForecastGain: advisor.apForecast.potentialGain,
    apAfterRitual: prestige.totalAP + advisor.apForecast.potentialGain,
    headline: buildHeadline({
      realmName,
      advisor: advisor.stateLabel,
      apGain: advisor.apForecast.potentialGain,
    }),
    summarySeal,
    blocks: buildCurrentBlocks(),
    majorMemories: buildMajorMemories({
      echoes,
      daoImpressions,
      failureReflections,
      clearedTrials,
      bypassedTrials,
      totalRuinsRuns,
      offlineLine: ui.lastOfflineSummary
        ? `${ui.lastOfflineSummary.offlineDuration} at ${Math.round(ui.lastOfflineSummary.efficiency * 100)}% efficiency.`
        : null,
    }),
    nextLifeFocus,
    warnings: advisor.apForecast.potentialGain <= 0 ? ['Potential AP gain is zero; do not treat this as a strong reset.'] : [],
  };
};

export const buildPrestigeLifeSummarySnapshot = (): PrestigeLifeSummarySnapshot => {
  const current = buildCurrentLifeSummarySurface();
  return {
    version: 2,
    capturedAt: current.capturedAt,
    lifeOrdinal: current.lifeOrdinal,
    advisorLabel: current.advisorLabel,
    apForecastGain: current.apForecastGain,
    apAfterRitual: current.apAfterRitual,
    headline: current.headline,
    summarySeal: current.summarySeal,
    blocks: current.blocks.map((block) => ({ ...block, lines: [...block.lines] })),
    majorMemories: current.majorMemories.map((memory) => ({ ...memory })),
    nextLifeFocus: current.nextLifeFocus,
    warnings: [...current.warnings],
  };
};

export const buildLastCompletedLifeSummarySurface = (
  snapshot: PrestigeLifeSummarySnapshot,
): LifeSummarySurface => {
  const normalizedBlockByKey = new Map(snapshot.blocks.map((block) => [block.key, block]));
  return {
    version: 2,
    mode: 'last_completed',
    capturedAt: snapshot.capturedAt,
    lifeOrdinal: snapshot.lifeOrdinal,
    advisorLabel: snapshot.advisorLabel,
    apForecastGain: snapshot.apForecastGain,
    apAfterRitual: snapshot.apAfterRitual,
    headline: snapshot.headline,
    summarySeal: snapshot.summarySeal,
    blocks: BLOCKS.map((block) => {
      const existing = normalizedBlockByKey.get(block.key);
      return {
        key: block.key,
        title: block.title,
        lines: clampLines(existing?.lines ?? [], 'No notable notes were captured for this section.'),
      };
    }),
    majorMemories: snapshot.majorMemories.map((memory) => ({ ...memory })),
    nextLifeFocus: snapshot.nextLifeFocus,
    warnings: [...snapshot.warnings],
  };
};
