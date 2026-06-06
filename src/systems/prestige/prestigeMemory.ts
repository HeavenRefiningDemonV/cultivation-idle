import type { PathId, TrialDef } from '../../content/types.js';
import type { SpiritRoot, SpiritRootGrade } from '../../types/index.js';
import {
  buildCompositeRouteMemoryKey,
  buildGateMemoryKey,
  buildHeartLawMemoryKey,
  buildPathTrainingMemoryKey,
  buildSpiritRootMemoryKey,
  createPrestigeMemoryRecord,
  mergePrestigeMemoryRecords,
  sanitizePrestigeMemoryRecord,
  type PrestigeMemoryRecord,
} from './prestigeMemoryResolver.js';
import { getSpiritRootPairKey } from '../spiritRoots/index.js';
import {
  copyTrainingSaveState,
  trainingStatCap,
  type SaveTrainingState,
  type TrainingRuntimeContent,
} from '../training/index.js';

export const PRESTIGE_MEMORY_SCHEMA_VERSION = 2;

export const MP5_PRESTIGE_MEMORY_NODE_IDS = [
  'form_memory',
  'scripture_echo',
  'root_clarity',
  'calm_first_breath',
  'old_sparring_shadows',
  'doctrine_archive',
] as const;

export type Mp5PrestigeMemoryNodeId = (typeof MP5_PRESTIGE_MEMORY_NODE_IDS)[number];

export type PrestigeMemoryAppliedRow = {
  effectId: Mp5PrestigeMemoryNodeId | 'mastery_retention' | 'reclaim_component_memory';
  rank: number;
  value: number;
  targetId?: string;
  detail: string;
  appliedAt: number;
};

export type PrestigeMemoryLedger = {
  schemaVersion: typeof PRESTIGE_MEMORY_SCHEMA_VERSION;
  previousRegimenMasteryMilestonesById: Record<string, number>;
  scriptureEchoByLawId: Record<string, number>;
  records: PrestigeMemoryRecord[];
  lastAppliedRows: PrestigeMemoryAppliedRow[];
  lastResetBucketIds: string[];
  updatedAt: number | null;
};

export type PrestigeMemoryEffects = {
  formMemoryRank: number;
  formMemoryFloor: number;
  scriptureEchoRank: number;
  scriptureVerseRetentionPct: number;
  scriptureXpCatchupMultiplier: number;
  rootClarityRank: number;
  rootClarityGradeFloor: SpiritRootGrade | 0;
  calmFirstBreathRank: number;
  calmFirstBreathRiskReduction: number;
  oldSparringRank: number;
  oldSparringMasteryCatchupMultiplier: number;
  doctrineArchiveRank: number;
  doctrineArchiveRuntime: 'hidden_unsupported';
};

type HeartLawMemoryState = {
  selectedHeartLawId: string | null;
  heartLawLevelById?: Record<string, number>;
  heartLawXpById?: Record<string, number>;
  verseMasteryByLawId: Record<string, number>;
  rootResonanceByPair?: Record<string, number>;
};

type ReclaimTrialProgress = {
  resolution?: string;
  cleared?: boolean;
  attempts?: number;
};

const FORM_MEMORY_FLOOR_BY_RANK = [0, 4, 8, 12] as const;
const SCRIPTURE_RETENTION_BY_RANK = [0, 0.1, 0.25, 0.4] as const;
const SCRIPTURE_XP_CATCHUP_BY_RANK = [0, 0.1, 0.2, 0.3] as const;
const ROOT_CLARITY_GRADE_FLOOR_BY_RANK = [0, 2, 3, 3] as const;
const CALM_FIRST_BREATH_RISK_REDUCTION_BY_RANK = [0, 1, 2, 3] as const;
const OLD_SPARRING_CATCHUP_BY_RANK = [0, 0.2, 0.35] as const;

const clampRank = (value: unknown, max: number): number => {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(max, parsed));
};

const cloneRows = (rows: PrestigeMemoryAppliedRow[]): PrestigeMemoryAppliedRow[] =>
  rows.map((row) => ({ ...row }));

export function createDefaultPrestigeMemoryLedger(): PrestigeMemoryLedger {
  return {
    schemaVersion: PRESTIGE_MEMORY_SCHEMA_VERSION,
    previousRegimenMasteryMilestonesById: {},
    scriptureEchoByLawId: {},
    records: [],
    lastAppliedRows: [],
    lastResetBucketIds: [],
    updatedAt: null,
  };
}

export function sanitizePrestigeMemoryLedger(raw: unknown): PrestigeMemoryLedger {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultPrestigeMemoryLedger();
  }
  const record = raw as Record<string, unknown>;
  const sanitizeNumberRecord = (value: unknown): Record<string, number> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, entry]) => key.trim().length > 0 && typeof entry === 'number' && Number.isFinite(entry) && entry > 0)
        .map(([key, entry]) => [key, Math.max(0, entry as number)]),
    );
  };

  const rows = Array.isArray(record.lastAppliedRows)
    ? record.lastAppliedRows
        .filter((row): row is PrestigeMemoryAppliedRow =>
          Boolean(row)
          && typeof row === 'object'
          && typeof (row as PrestigeMemoryAppliedRow).effectId === 'string'
          && typeof (row as PrestigeMemoryAppliedRow).rank === 'number'
          && typeof (row as PrestigeMemoryAppliedRow).value === 'number'
          && typeof (row as PrestigeMemoryAppliedRow).detail === 'string'
          && typeof (row as PrestigeMemoryAppliedRow).appliedAt === 'number')
        .map((row) => ({ ...row }))
    : [];
  const memoryRecords = Array.isArray(record.records)
    ? mergePrestigeMemoryRecords(record.records.flatMap((entry) => {
        const sanitized = sanitizePrestigeMemoryRecord(entry);
        return sanitized ? [sanitized] : [];
      }))
    : [];

  return {
    schemaVersion: PRESTIGE_MEMORY_SCHEMA_VERSION,
    previousRegimenMasteryMilestonesById: sanitizeNumberRecord(record.previousRegimenMasteryMilestonesById),
    scriptureEchoByLawId: sanitizeNumberRecord(record.scriptureEchoByLawId),
    records: memoryRecords,
    lastAppliedRows: rows.slice(-20),
    lastResetBucketIds: Array.isArray(record.lastResetBucketIds)
      ? record.lastResetBucketIds.filter((id): id is string => typeof id === 'string')
      : [],
    updatedAt: typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt) ? record.updatedAt : null,
  };
}

export function resolvePrestigeMemoryEffects(purchasesById: Record<string, number>): PrestigeMemoryEffects {
  const formMemoryRank = clampRank(purchasesById.form_memory, 3);
  const scriptureEchoRank = clampRank(purchasesById.scripture_echo, 3);
  const rootClarityRank = clampRank(purchasesById.root_clarity, 3);
  const calmFirstBreathRank = clampRank(purchasesById.calm_first_breath, 3);
  const oldSparringRank = clampRank(purchasesById.old_sparring_shadows, 2);
  const doctrineArchiveRank = clampRank(purchasesById.doctrine_archive, 1);

  return {
    formMemoryRank,
    formMemoryFloor: FORM_MEMORY_FLOOR_BY_RANK[formMemoryRank],
    scriptureEchoRank,
    scriptureVerseRetentionPct: SCRIPTURE_RETENTION_BY_RANK[scriptureEchoRank],
    scriptureXpCatchupMultiplier: SCRIPTURE_XP_CATCHUP_BY_RANK[scriptureEchoRank],
    rootClarityRank,
    rootClarityGradeFloor: ROOT_CLARITY_GRADE_FLOOR_BY_RANK[rootClarityRank] as SpiritRootGrade | 0,
    calmFirstBreathRank,
    calmFirstBreathRiskReduction: CALM_FIRST_BREATH_RISK_REDUCTION_BY_RANK[calmFirstBreathRank],
    oldSparringRank,
    oldSparringMasteryCatchupMultiplier: OLD_SPARRING_CATCHUP_BY_RANK[oldSparringRank],
    doctrineArchiveRank,
    doctrineArchiveRuntime: 'hidden_unsupported',
  };
}

const highestMilestoneAtOrBelow = (value: number, milestones: readonly number[]): number => {
  const normalized = Math.max(0, Number.isFinite(value) ? value : 0);
  return [...milestones]
    .filter((milestone) => Number.isFinite(milestone) && milestone > 0 && milestone <= normalized)
    .sort((a, b) => b - a)[0] ?? 0;
};

const realmBandFor = (realmIndex: number): string =>
  `realm_${Math.max(0, Math.floor(Number.isFinite(realmIndex) ? realmIndex : 0))}`;

const currentLifeIdFor = (prestigeCount?: number): string =>
  `life-${Math.max(1, Math.floor(Number.isFinite(prestigeCount ?? 0) ? prestigeCount ?? 1 : 1))}`;

const highestRecordValue = (record: PrestigeMemoryRecord): number =>
  record.priorBest.rating
  ?? record.priorBest.lawLevel
  ?? record.priorBest.verseMastery
  ?? record.priorBest.rootResonance
  ?? (record.priorBest.gateCleared ? 1 : 0);

const buildComponentMemoryRow = (
  record: PrestigeMemoryRecord,
  rank: number,
  now: number,
): PrestigeMemoryAppliedRow => ({
  effectId: 'reclaim_component_memory',
  rank,
  value: highestRecordValue(record),
  targetId: record.componentKey,
  detail: `Stored ${record.domain.replaceAll('_', ' ')} memory until ${highestRecordValue(record)}.`,
  appliedAt: now,
});

const buildGateChainId = (
  progressByTrialId: Record<string, ReclaimTrialProgress> | undefined,
  trialContent: TrialDef[] | undefined,
): string | null => {
  if (!progressByTrialId) return null;
  const resolvedTrialIds = Object.entries(progressByTrialId)
    .filter(([, progress]) => progress.cleared || progress.resolution === 'cleared' || progress.resolution === 'bypassed')
    .map(([trialId]) => trialId)
    .sort();
  if (resolvedTrialIds.length === 0) return null;
  const trialById = new Map((trialContent ?? []).map((trial) => [trial.id, trial]));
  return resolvedTrialIds
    .map((trialId) => trialById.get(trialId)?.gateItemId ?? trialId)
    .join('__');
};

const buildCurrentRouteBundleKey = (input: {
  selectedPath: PathId | null | undefined;
  selectedHeartLawId: string | null | undefined;
  spiritRoot: SpiritRoot | null | undefined;
  gateChainId: string | null;
}): { rootKey: string | null; routeBundleKey: string | null } => {
  const rootKey = input.spiritRoot
    ? buildSpiritRootMemoryKey({
        rootElement: input.spiritRoot.element,
        shape: 'single',
        variantKey: `grade_${input.spiritRoot.grade}`,
        lawPair: input.selectedHeartLawId ?? null,
      })
    : null;
  if (!input.selectedPath && !input.selectedHeartLawId && !rootKey && !input.gateChainId) {
    return { rootKey, routeBundleKey: null };
  }
  return {
    rootKey,
    routeBundleKey: buildCompositeRouteMemoryKey({
      pathId: input.selectedPath ?? null,
      heartLawId: input.selectedHeartLawId ?? null,
      rootKey,
      gateChainId: input.gateChainId,
    }),
  };
};

const buildComponentMemoryRecordsForReset = (input: {
  purchasesById: Record<string, number>;
  selectedPath?: PathId | null;
  realmIndex?: number;
  trainingState: SaveTrainingState;
  trainingContent: TrainingRuntimeContent | null;
  heartLawState: HeartLawMemoryState;
  spiritRoot?: SpiritRoot | null;
  trialProgressByTrialId?: Record<string, ReclaimTrialProgress>;
  trialContent?: TrialDef[];
  currentCityId?: string | null;
  prestigeCount?: number;
}): PrestigeMemoryRecord[] => {
  const reclaimRank = Math.max(
    clampRank(input.purchasesById.form_memory, 3),
    clampRank(input.purchasesById.scripture_echo, 3),
    clampRank(input.purchasesById.root_clarity, 3),
    clampRank(input.purchasesById.old_sparring_shadows, 2),
  );
  if (reclaimRank <= 0) return [];

  const lifeId = currentLifeIdFor(input.prestigeCount);
  const realmIndex = Math.max(0, Math.floor(input.realmIndex ?? 0));
  const selectedHeartLawId = input.heartLawState.selectedHeartLawId;
  const gateChainId = buildGateChainId(input.trialProgressByTrialId, input.trialContent);
  const { rootKey, routeBundleKey } = buildCurrentRouteBundleKey({
    selectedPath: input.selectedPath,
    selectedHeartLawId,
    spiritRoot: input.spiritRoot,
    gateChainId,
  });
  const records: PrestigeMemoryRecord[] = [];

  const selectedPath = input.selectedPath ?? null;
  if (selectedPath && input.trainingContent) {
    input.trainingContent.regimens
      .filter((regimen) => regimen.path === selectedPath)
      .forEach((regimen) => {
        const statIds = new Set([regimen.primaryStatId, regimen.secondaryStatId, regimen.foundationStatId]);
        statIds.forEach((statId) => {
          const rating = input.trainingState.statRatingsById[statId] ?? 0;
          if (rating <= 0) return;
          records.push(createPrestigeMemoryRecord({
            domain: 'path_training',
            componentKey: buildPathTrainingMemoryKey({
              pathId: selectedPath,
              statId,
              regimenId: regimen.id,
              realmBand: realmBandFor(realmIndex),
            }),
            routeBundleKey,
            priorBest: { realmIndex, rating },
            lastLifeId: lifeId,
            reclaimRank,
          }));
        });
      });
  }

  if (selectedHeartLawId) {
    const lawLevel = input.heartLawState.heartLawLevelById?.[selectedHeartLawId] ?? 1;
    const verseMastery = input.heartLawState.verseMasteryByLawId[selectedHeartLawId] ?? 0;
    if (lawLevel > 1 || verseMastery > 0) {
      const chapterBand = `chapter_${Math.max(1, Math.ceil(Math.max(1, lawLevel) / 5))}`;
      records.push(createPrestigeMemoryRecord({
        domain: 'heart_law',
        componentKey: buildHeartLawMemoryKey({
          heartLawId: selectedHeartLawId,
          chapterBand,
          verseId: `verse_${chapterBand}`,
        }),
        routeBundleKey,
        priorBest: { realmIndex, lawLevel, verseMastery },
        lastLifeId: lifeId,
        reclaimRank,
      }));
    }
  }

  if (input.spiritRoot && selectedHeartLawId && rootKey) {
    const pairKey = getSpiritRootPairKey(input.spiritRoot.element, selectedHeartLawId);
    const rootResonance = input.heartLawState.rootResonanceByPair?.[pairKey] ?? 0;
    if (rootResonance > 0) {
      records.push(createPrestigeMemoryRecord({
        domain: 'spirit_root',
        componentKey: rootKey,
        routeBundleKey,
        priorBest: { realmIndex, rootResonance },
        lastLifeId: lifeId,
        reclaimRank,
      }));
    }
  }

  const trialById = new Map((input.trialContent ?? []).map((trial) => [trial.id, trial]));
  Object.entries(input.trialProgressByTrialId ?? {})
    .filter(([, progress]) => progress.cleared || progress.resolution === 'cleared' || progress.resolution === 'bypassed')
    .forEach(([trialId, progress]) => {
      const trial = trialById.get(trialId);
      records.push(createPrestigeMemoryRecord({
        domain: 'gate',
        componentKey: buildGateMemoryKey({
          trialId,
          gateId: trial?.gateItemId ?? trialId,
          cityId: trial?.cityId ?? input.currentCityId ?? 'unknown_city',
        }),
        routeBundleKey,
        priorBest: { realmIndex, gateCleared: progress.cleared || progress.resolution === 'cleared' || progress.resolution === 'bypassed' },
        lastLifeId: lifeId,
        reclaimRank,
      }));
    });

  const strongestRouteValue = Math.max(0, ...records.map(highestRecordValue));
  if (routeBundleKey && records.length > 0) {
    records.push(createPrestigeMemoryRecord({
      domain: 'composite_route',
      componentKey: routeBundleKey,
      routeBundleKey,
      priorBest: { realmIndex, rating: strongestRouteValue },
      lastLifeId: lifeId,
      reclaimRank,
    }));
  }

  return mergePrestigeMemoryRecords(records);
};

export function buildPrestigeMemoryLedgerForReset(input: {
  purchasesById: Record<string, number>;
  previousLedger: PrestigeMemoryLedger;
  trainingState: SaveTrainingState;
  trainingContent: TrainingRuntimeContent | null;
  heartLawState: HeartLawMemoryState;
  selectedPath?: PathId | null;
  realmIndex?: number;
  substageIndex?: number;
  spiritRoot?: SpiritRoot | null;
  currentCityId?: string | null;
  trialProgressByTrialId?: Record<string, ReclaimTrialProgress>;
  trialContent?: TrialDef[];
  prestigeCount?: number;
  now: number;
}): PrestigeMemoryLedger {
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  const rows: PrestigeMemoryAppliedRow[] = [];
  const previousRegimenMasteryMilestonesById: Record<string, number> = {};
  const scriptureEchoByLawId: Record<string, number> = {};

  if (effects.oldSparringRank > 0 && input.trainingContent) {
    Object.entries(input.trainingState.regimenMasteryXpById).forEach(([regimenId, masteryXp]) => {
      const regimen = input.trainingContent?.regimensById[regimenId];
      const milestones = regimen?.masteryMilestones ?? input.trainingContent?.masteryMilestones ?? [];
      const milestone = highestMilestoneAtOrBelow(masteryXp, milestones);
      if (milestone <= 0) return;
      previousRegimenMasteryMilestonesById[regimenId] = milestone;
      rows.push({
        effectId: 'old_sparring_shadows',
        rank: effects.oldSparringRank,
        value: milestone,
        targetId: regimenId,
        detail: `Stored mastery milestone ${milestone} for Old Sparring Shadows catch-up.`,
        appliedAt: input.now,
      });
    });
  }

  if (effects.scriptureEchoRank > 0 && input.heartLawState.selectedHeartLawId) {
    const lawId = input.heartLawState.selectedHeartLawId;
    const priorVerse = input.heartLawState.verseMasteryByLawId[lawId] ?? 0;
    const retained = Math.min(100, Math.max(0, priorVerse * effects.scriptureVerseRetentionPct));
    if (retained > 0) {
      scriptureEchoByLawId[lawId] = retained;
      rows.push({
        effectId: 'scripture_echo',
        rank: effects.scriptureEchoRank,
        value: retained,
        targetId: lawId,
        detail: `Stored ${Math.round(retained)} verse mastery echo for the same Heart Law.`,
        appliedAt: input.now,
      });
    }
  }
  const componentRecords = buildComponentMemoryRecordsForReset({
    purchasesById: input.purchasesById,
    selectedPath: input.selectedPath,
    realmIndex: input.realmIndex,
    trainingState: input.trainingState,
    trainingContent: input.trainingContent,
    heartLawState: input.heartLawState,
    spiritRoot: input.spiritRoot,
    trialProgressByTrialId: input.trialProgressByTrialId,
    trialContent: input.trialContent,
    currentCityId: input.currentCityId,
    prestigeCount: input.prestigeCount,
  });
  const records = mergePrestigeMemoryRecords([
    ...input.previousLedger.records,
    ...componentRecords,
  ]);
  rows.push(...componentRecords.map((record) => buildComponentMemoryRow(
    record,
    Math.max(
      clampRank(input.purchasesById.form_memory, 3),
      clampRank(input.purchasesById.scripture_echo, 3),
      clampRank(input.purchasesById.root_clarity, 3),
      clampRank(input.purchasesById.old_sparring_shadows, 2),
    ),
    input.now,
  )));

  return {
    schemaVersion: PRESTIGE_MEMORY_SCHEMA_VERSION,
    previousRegimenMasteryMilestonesById,
    scriptureEchoByLawId,
    records,
    lastAppliedRows: [...cloneRows(input.previousLedger.lastAppliedRows), ...rows].slice(-20),
    lastResetBucketIds: [
      'training_raw_ratings',
      'training_fatigue_session',
      'dao_heart_turbulence',
      'root_awakening_state',
      'form_memory',
      'scripture_echo',
      'root_clarity_floor',
      'calm_first_breath',
      'old_sparring_shadows',
      'prestige_reclaim_component_memory',
    ],
    updatedAt: input.now,
  };
}

function collectPathStatIds(content: TrainingRuntimeContent, selectedPath: PathId): Set<string> {
  const ids = new Set<string>();
  content.regimens
    .filter((regimen) => regimen.path === selectedPath)
    .forEach((regimen) => {
      ids.add(regimen.primaryStatId);
      ids.add(regimen.secondaryStatId);
      ids.add(regimen.foundationStatId);
    });
  return ids;
}

export function applyFormMemoryTrainingFloor(input: {
  state: SaveTrainingState;
  content: TrainingRuntimeContent;
  selectedPath: PathId | null;
  realmIndex: number;
  substageIndex: number;
  purchasesById: Record<string, number>;
}): SaveTrainingState {
  const next = copyTrainingSaveState(input.state);
  if (next.prestigeMemoryAppliedForLife) {
    return next;
  }
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  if (!input.selectedPath || effects.formMemoryFloor <= 0) {
    return next;
  }

  next.statXpById = {};
  next.regimenMasteryXpById = {};
  next.fatigue = 0;
  next.activeRegimenId = null;
  next.activeIntensityId = null;
  next.lastTickAt = null;
  next.lastOfflineSummary = null;
  next.prestigeMemoryAppliedForLife = true;

  const cap = trainingStatCap({
    realmIndex: input.realmIndex,
    substageIndex: input.substageIndex,
  });
  const floor = Math.min(cap, effects.formMemoryFloor);
  collectPathStatIds(input.content, input.selectedPath).forEach((statId) => {
    next.statRatingsById[statId] = Math.max(Math.floor(next.statRatingsById[statId] ?? 0), floor);
  });
  return next;
}

export function applyScriptureEchoToHeartLawState<T extends HeartLawMemoryState>(input: {
  state: T;
  ledger: PrestigeMemoryLedger;
  selectedHeartLawId: string | null;
  purchasesById: Record<string, number>;
}): T & {
  heartLawLevelById: Record<string, number>;
  heartLawXpById: Record<string, number>;
  verseMasteryByLawId: Record<string, number>;
} {
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  const selectedHeartLawId = input.selectedHeartLawId ?? input.state.selectedHeartLawId;
  if (!selectedHeartLawId || effects.scriptureEchoRank <= 0) {
    return {
      ...input.state,
      verseMasteryByLawId: { ...input.state.verseMasteryByLawId },
      heartLawLevelById: { ...(input.state.heartLawLevelById ?? {}) },
      heartLawXpById: { ...(input.state.heartLawXpById ?? {}) },
    };
  }
  const retained = input.ledger.scriptureEchoByLawId[selectedHeartLawId] ?? 0;
  return {
    ...input.state,
    selectedHeartLawId,
    heartLawLevelById: { ...(input.state.heartLawLevelById ?? {}) },
    heartLawXpById: { ...(input.state.heartLawXpById ?? {}) },
    verseMasteryByLawId: {
      ...input.state.verseMasteryByLawId,
      [selectedHeartLawId]: Math.max(input.state.verseMasteryByLawId[selectedHeartLawId] ?? 0, retained),
    },
  };
}

export function resolveScriptureEchoXpMultiplier(input: {
  purchasesById: Record<string, number>;
  heartLawStage: number;
  cultivationEffectiveStage: number;
}): number {
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  if (effects.scriptureXpCatchupMultiplier <= 0) return 1;
  if (Math.floor(input.heartLawStage) >= Math.floor(input.cultivationEffectiveStage)) return 1;
  return 1 + effects.scriptureXpCatchupMultiplier;
}

export function resolveCalmFirstBreathRiskReduction(input: {
  purchasesById: Record<string, number>;
  heartLawStage: number;
  cultivationEffectiveStage: number;
}): number {
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  if (effects.calmFirstBreathRiskReduction <= 0) return 0;
  return Math.floor(input.heartLawStage) === Math.floor(input.cultivationEffectiveStage)
    ? effects.calmFirstBreathRiskReduction
    : 0;
}

export function resolveOldSparringMasteryMultiplier(input: {
  purchasesById: Record<string, number>;
  currentMasteryXp: number;
  previousMilestoneXp: number | null | undefined;
}): number {
  const effects = resolvePrestigeMemoryEffects(input.purchasesById);
  const milestone = input.previousMilestoneXp ?? 0;
  if (effects.oldSparringMasteryCatchupMultiplier <= 0 || milestone <= 0) return 1;
  if (input.currentMasteryXp >= milestone) return 1;
  return 1 + effects.oldSparringMasteryCatchupMultiplier;
}

export function clampSpiritRootWithRootClarity(
  root: SpiritRoot,
  purchasesById: Record<string, number>,
): SpiritRoot {
  const floor = resolvePrestigeMemoryEffects(purchasesById).rootClarityGradeFloor;
  if (floor <= 0 || root.grade >= floor) return { ...root };
  return { ...root, grade: floor as SpiritRootGrade };
}
