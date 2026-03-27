import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
import { buildSection5StatusSurface } from '../../systems/readiness/section5Adapters.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { getPrestigeAdvisorSurface, type PrestigeAdvisorStateLabel } from './prestigeAdvisorSurface.js';
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
  | 'doctrine_build'
  | 'world_progress'
  | 'gate_trials'
  | 'ruins_supply'
  | 'next_life_focus';

export type LifeSummaryMode = 'current' | 'last_completed';

export interface LifeSummaryBlock {
  key: LifeSummaryBlockKey;
  title: string;
  lines: string[];
}

export interface PrestigeLifeSummarySnapshot {
  capturedAt: number;
  advisorLabel: PrestigeAdvisorStateLabel;
  apForecastGain: number;
  apAfterRitual: number;
  blocks: LifeSummaryBlock[];
}

export interface LifeSummarySurface {
  mode: LifeSummaryMode;
  capturedAt: number;
  advisorLabel: PrestigeAdvisorStateLabel;
  apForecastGain: number;
  apAfterRitual: number;
  blocks: LifeSummaryBlock[];
}

const BLOCKS: ReadonlyArray<{ key: LifeSummaryBlockKey; title: string }> = Object.freeze([
  { key: 'life_arc', title: 'Life Arc' },
  { key: 'doctrine_build', title: 'Doctrine & Build' },
  { key: 'world_progress', title: 'World Progress' },
  { key: 'gate_trials', title: 'Gate Trials' },
  { key: 'ruins_supply', title: 'Ruins & Supply' },
  { key: 'next_life_focus', title: 'Next Life Focus' },
]);

const clampLines = (lines: string[], fallback: string): string[] => {
  const normalized = lines.filter((line) => typeof line === 'string' && line.trim().length > 0).map((line) => line.trim());
  if (normalized.length === 0) return [fallback];
  return normalized.slice(0, 5);
};

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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
  const advisor = getPrestigeAdvisorSurface();
  const status = buildSection5StatusSurface();

  const totalTrialAttempts = Object.values(trial.progressByTrialId).reduce((sum, progress) => sum + progress.attempts, 0);
  const clearedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'cleared').length;
  const bypassedTrials = Object.values(trial.progressByTrialId).filter((progress) => progress.resolution === 'bypassed').length;
  const totalRuinsRuns = Object.values(ruins.progressByRuinId).reduce((sum, progress) => sum + progress.totalRuns, 0);
  const totalRuinsRooms = Object.values(ruins.progressByRuinId).reduce((sum, progress) => sum + progress.totalRoomsCleared, 0);

  const topPurchase = advisor.topRecommendedPurchase;

  const linesByKey: Record<LifeSummaryBlockKey, string[]> = {
    life_arc: clampLines([
      `Current realm: ${getLiveRealmNameByIndex(game.realm.index)}`,
      `Current life time: ${formatDuration(now - prestige.runStartTime)}`,
      `Potential AP on Reincarnation: +${advisor.apForecast.potentialGain}`,
      `Reincarnations completed: ${prestige.prestigeCount}`,
    ], 'This life has only just begun.'),
    doctrine_build: clampLines([
      `Path: ${formatPathLabel(game.selectedPath)}`,
      `Heart Law: ${formatHeartLawLabel(cultivation.selectedHeartLawId)}`,
      `Build posture: ${formatArchetypeLabel(status.archetypeId)}`,
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
      status.currentDiagnosis ? `Latest diagnosis: ${formatDiagnosisLabel(status.currentDiagnosis.primary)}` : 'No active gate diagnosis recorded.',
    ], 'No gate trial progress has been recorded yet.'),
    ruins_supply: clampLines([
      `Ruins runs: ${totalRuinsRuns}`,
      `Ruins rooms cleared: ${totalRuinsRooms}`,
      ruins.lastRunSummary ? `Last ruins run: ${ruins.lastRunSummary.victory ? 'Victory' : 'Defeat'} (${ruins.lastRunSummary.roomsCleared}/${ruins.lastRunSummary.roomCount} rooms)` : 'No ruins run completed this life.',
      `Current gold on hand: ${inventory.currencies.gold}`,
    ], 'No ruins or supply activity has been recorded yet.'),
    next_life_focus: clampLines([
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

  return {
    mode: 'current',
    capturedAt: Date.now(),
    advisorLabel: advisor.stateLabel,
    apForecastGain: advisor.apForecast.potentialGain,
    apAfterRitual: prestige.totalAP + advisor.apForecast.potentialGain,
    blocks: buildCurrentBlocks(),
  };
};

export const buildPrestigeLifeSummarySnapshot = (): PrestigeLifeSummarySnapshot => {
  const current = buildCurrentLifeSummarySurface();
  return {
    capturedAt: current.capturedAt,
    advisorLabel: current.advisorLabel,
    apForecastGain: current.apForecastGain,
    apAfterRitual: current.apAfterRitual,
    blocks: current.blocks.map((block) => ({ ...block, lines: [...block.lines] })),
  };
};

export const buildLastCompletedLifeSummarySurface = (
  snapshot: PrestigeLifeSummarySnapshot,
): LifeSummarySurface => {
  const normalizedBlockByKey = new Map(snapshot.blocks.map((block) => [block.key, block]));
  return {
    mode: 'last_completed',
    capturedAt: snapshot.capturedAt,
    advisorLabel: snapshot.advisorLabel,
    apForecastGain: snapshot.apForecastGain,
    apAfterRitual: snapshot.apAfterRitual,
    blocks: BLOCKS.map((block) => {
      const existing = normalizedBlockByKey.get(block.key);
      return {
        key: block.key,
        title: block.title,
        lines: clampLines(existing?.lines ?? [], 'No notable notes were captured for this section.'),
      };
    }),
  };
};
