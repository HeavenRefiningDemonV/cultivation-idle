import type {
  CultivatorStatDef,
  PathId,
  TrainingIntensityDef,
  TrainingRegimenDef,
} from '../../content/types.js';
import { getCultivatorStatGrade } from '../cultivatorStats/statGrade.js';
import { TRAINING_FATIGUE_DOWNGRADE_AT } from './trainingFatigueResolver.js';
import { fatigueDampening, trainingStatCap, xpToNextTrainingRating } from './trainingProgressionResolver.js';
import { resolveTrainingSupportMultipliers, type ResolveTrainingSupportMultipliersInput, type TrainingSupportMultipliers } from './trainingSupportMultipliers.js';
import { getTrainingUnlockRealmLabel, resolveTrainingUnlockPolicy, type TrainingNextUnlock } from './trainingUnlockPolicy.js';
import type { SaveTrainingOfflineSummary, SaveTrainingState, TrainingRuntimeContent } from './trainingTypes.js';

export type TrainingFatigueTier = 'fresh' | 'tiring' | 'strained' | 'overworked';
export type TrainingCapState = 'open' | 'near_cap' | 'capped';

export interface TrainingStatReadOnlyRow {
  statId: string;
  displayName: string;
  rating: number;
  xp: number;
  xpToNext: number;
  grade: ReturnType<typeof getCultivatorStatGrade>;
  cap: number;
  capPct: number;
  capState: TrainingCapState;
  category: CultivatorStatDef['category'];
  tier: CultivatorStatDef['tier'] | null;
}

export interface TrainingFutureStatReadOnlyRow {
  statId: string;
  displayName: string;
  category: CultivatorStatDef['category'];
  tier: CultivatorStatDef['tier'] | null;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  lockedReason: string;
  maxEffectSummary: string | null;
}

export interface TrainingRegimenReadOnlyRow {
  id: string;
  path: PathId;
  displayName: string;
  roomLabel: string;
  primaryStat: TrainingStatReadOnlyRow;
  secondaryStat: TrainingStatReadOnlyRow;
  foundationStat: TrainingStatReadOnlyRow;
  masteryXp: number;
  nextMasteryMilestone: number | null;
  masteryPct: number;
  regimenRate: number;
  lockedGameplayTrait: string | null;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  locked: false;
  lockedReason: null;
}

export interface TrainingLockedRegimenReadOnlyRow {
  id: string;
  path: PathId;
  displayName: string;
  roomLabel: string;
  primaryStat: TrainingFutureStatReadOnlyRow;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  lockedGameplayTrait: string | null;
  locked: true;
  lockedReason: string;
}

export interface TrainingPathFoundationSummary {
  label: 'Path Foundation';
  valueLabel: string;
  averageRating: number;
  grade: ReturnType<typeof getCultivatorStatGrade>;
  progressPct: number;
}

export interface TrainingReadOnlySnapshot {
  path: PathId | null;
  pathLabel: string;
  roomTitle: string;
  realmCap: number;
  fatigue: number;
  fatigueTier: TrainingFatigueTier;
  fatigueDampening: number;
  pathStats: TrainingStatReadOnlyRow[];
  futureStats: TrainingFutureStatReadOnlyRow[];
  regimensForPath: TrainingRegimenReadOnlyRow[];
  lockedRegimensForPath: TrainingLockedRegimenReadOnlyRow[];
  activeRegimen: TrainingRegimenReadOnlyRow | null;
  activeIntensity: TrainingIntensityDef | null;
  currentBottleneck: TrainingStatReadOnlyRow | null;
  pathFoundation: TrainingPathFoundationSummary;
  nextUnlock: TrainingNextUnlock | null;
  supportMultipliers: TrainingSupportMultipliers;
  offlineSummary: SaveTrainingOfflineSummary | null;
}

export interface BuildTrainingReadOnlySnapshotInput {
  content: TrainingRuntimeContent;
  state: SaveTrainingState;
  selectedPath: PathId | null;
  realmIndex: number;
  substageIndex: number;
  prestigeFloor?: number;
  supportMultipliers?: ResolveTrainingSupportMultipliersInput;
}

const PATH_LABELS: Record<PathId, string> = {
  heaven: 'Heaven Path',
  earth: 'Earth Path',
  martial: 'Martial Path',
};

const ROOM_TITLES: Record<PathId, string> = {
  heaven: 'Heaven Star Observatory',
  earth: 'Earth Body Tempering Yard',
  martial: 'Martial Sparring Court',
};

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fatigueTier(fatigue: number): TrainingFatigueTier {
  if (fatigue >= TRAINING_FATIGUE_DOWNGRADE_AT) return 'overworked';
  if (fatigue >= 60) return 'strained';
  if (fatigue >= 35) return 'tiring';
  return 'fresh';
}

function capState(rating: number, cap: number): TrainingCapState {
  if (rating >= cap) return 'capped';
  if (rating >= cap - 4) return 'near_cap';
  return 'open';
}

function statRow(stat: CultivatorStatDef | undefined, state: SaveTrainingState, cap: number, statId: string): TrainingStatReadOnlyRow {
  const rating = Math.max(0, Math.floor(state.statRatingsById[statId] ?? 0));
  const xp = Math.max(0, state.statXpById[statId] ?? 0);
  const safeCap = Math.max(1, cap);
  return {
    statId,
    displayName: stat?.displayName ?? titleCase(statId),
    rating,
    xp,
    xpToNext: rating >= safeCap ? 0 : xpToNextTrainingRating(rating),
    grade: getCultivatorStatGrade(rating),
    cap: safeCap,
    capPct: clampPct((rating / safeCap) * 100),
    capState: capState(rating, safeCap),
    category: stat?.category ?? 'path',
    tier: stat?.tier ?? null,
  };
}

function nextMilestone(milestones: readonly number[], masteryXp: number): number | null {
  return milestones.find((milestone) => masteryXp < milestone) ?? null;
}

function regimenRow(
  regimen: TrainingRegimenDef,
  content: TrainingRuntimeContent,
  state: SaveTrainingState,
  cap: number,
): TrainingRegimenReadOnlyRow {
  const masteryXp = Math.max(0, state.regimenMasteryXpById[regimen.id] ?? 0);
  const next = nextMilestone(regimen.masteryMilestones.length > 0 ? regimen.masteryMilestones : content.masteryMilestones, masteryXp);
  const previous = [...(regimen.masteryMilestones.length > 0 ? regimen.masteryMilestones : content.masteryMilestones)]
    .reverse()
    .find((milestone) => masteryXp >= milestone) ?? 0;
  const span = next ? Math.max(1, next - previous) : 1;
  return {
    id: regimen.id,
    path: regimen.path,
    displayName: regimen.displayName,
    roomLabel: regimen.roomLabel ?? regimen.displayName,
    primaryStat: statRow(content.statsById[regimen.primaryStatId], state, cap, regimen.primaryStatId),
    secondaryStat: statRow(content.statsById[regimen.secondaryStatId], state, cap, regimen.secondaryStatId),
    foundationStat: statRow(content.statsById[regimen.foundationStatId], state, cap, regimen.foundationStatId),
    masteryXp,
    nextMasteryMilestone: next,
    masteryPct: next ? clampPct(((masteryXp - previous) / span) * 100) : 100,
    regimenRate: regimen.regimenRate,
    lockedGameplayTrait: regimen.lockedGameplayTrait ?? null,
    unlockRealmIndex: Math.max(0, Math.floor(regimen.unlockRealmIndex)),
    unlockRealmLabel: getTrainingUnlockRealmLabel(regimen.unlockRealmIndex),
    locked: false,
    lockedReason: null,
  };
}

function futureStatRow(row: ReturnType<typeof resolveTrainingUnlockPolicy>['futureStats'][number]): TrainingFutureStatReadOnlyRow {
  return {
    statId: row.statId,
    displayName: row.displayName,
    category: row.stat?.category ?? 'path',
    tier: row.stat?.tier ?? null,
    unlockRealmIndex: row.unlockRealmIndex,
    unlockRealmLabel: row.unlockRealmLabel,
    lockedReason: row.lockedReason,
    maxEffectSummary: row.stat?.maxEffectSummary ?? null,
  };
}

function lockedRegimenRow(
  entry: ReturnType<typeof resolveTrainingUnlockPolicy>['lockedRegimens'][number],
): TrainingLockedRegimenReadOnlyRow {
  return {
    id: entry.regimen.id,
    path: entry.regimen.path,
    displayName: entry.regimen.displayName,
    roomLabel: entry.regimen.roomLabel ?? entry.regimen.displayName,
    primaryStat: futureStatRow(entry.primaryStat),
    unlockRealmIndex: entry.unlockRealmIndex,
    unlockRealmLabel: entry.unlockRealmLabel,
    lockedGameplayTrait: entry.regimen.lockedGameplayTrait ?? null,
    locked: true,
    lockedReason: entry.lockedReason,
  };
}

function buildFoundationSummary(pathStats: TrainingStatReadOnlyRow[], cap: number): TrainingPathFoundationSummary {
  const average = pathStats.length > 0
    ? pathStats.reduce((sum, row) => sum + row.rating, 0) / pathStats.length
    : 0;
  const rounded = Math.round(average);
  return {
    label: 'Path Foundation',
    valueLabel: `${rounded} / ${Math.max(1, cap)} average`,
    averageRating: average,
    grade: getCultivatorStatGrade(average),
    progressPct: clampPct((average / Math.max(1, cap)) * 100),
  };
}

function pickBottleneck(rows: TrainingStatReadOnlyRow[]): TrainingStatReadOnlyRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort((left, right) => {
    if (left.rating !== right.rating) return left.rating - right.rating;
    return left.displayName.localeCompare(right.displayName);
  })[0] ?? null;
}

export function buildTrainingReadOnlySnapshot(input: BuildTrainingReadOnlySnapshotInput): TrainingReadOnlySnapshot {
  const cap = trainingStatCap({
    realmIndex: input.realmIndex,
    substageIndex: input.substageIndex,
    prestigeFloor: input.prestigeFloor,
  });
  const selectedPath = input.selectedPath;
  const unlockPolicy = selectedPath
    ? resolveTrainingUnlockPolicy({
        content: input.content,
        path: selectedPath,
        realmIndex: input.realmIndex,
      })
    : null;
  const pathStats = selectedPath
    ? (unlockPolicy?.unlockedStatIds ?? [])
      .map((statId) => statRow(input.content.statsById[statId], input.state, cap, statId))
    : [];
  const futureStats = unlockPolicy?.futureStats.map(futureStatRow) ?? [];
  const regimensForPath = selectedPath
    ? (unlockPolicy?.availableRegimens ?? [])
      .map((regimen) => regimenRow(regimen, input.content, input.state, cap))
    : [];
  const lockedRegimensForPath = unlockPolicy?.lockedRegimens.map(lockedRegimenRow) ?? [];
  const activeRegimen = input.state.activeRegimenId
    ? regimensForPath.find((regimen) => regimen.id === input.state.activeRegimenId) ?? null
    : null;
  const activeIntensity = input.state.activeIntensityId
    ? input.content.intensitiesById[input.state.activeIntensityId] ?? null
    : null;

  return {
    path: selectedPath,
    pathLabel: selectedPath ? PATH_LABELS[selectedPath] : 'Path not selected',
    roomTitle: selectedPath ? ROOM_TITLES[selectedPath] : 'Training Hall',
    realmCap: cap,
    fatigue: Math.max(0, Math.min(100, input.state.fatigue)),
    fatigueTier: fatigueTier(input.state.fatigue),
    fatigueDampening: fatigueDampening(input.state.fatigue),
    pathStats,
    futureStats,
    regimensForPath,
    lockedRegimensForPath,
    activeRegimen,
    activeIntensity,
    currentBottleneck: pickBottleneck(pathStats),
    pathFoundation: buildFoundationSummary(pathStats, cap),
    nextUnlock: unlockPolicy?.nextUnlock ?? null,
    supportMultipliers: resolveTrainingSupportMultipliers(input.supportMultipliers),
    offlineSummary: input.state.lastOfflineSummary,
  };
}
