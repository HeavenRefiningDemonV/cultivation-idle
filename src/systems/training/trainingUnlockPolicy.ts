import type { CultivatorStatDef, PathId, TrainingRegimenDef } from '../../content/types.js';
import type { TrainingRuntimeContent } from './trainingTypes.js';

export const TRAINING_STAT_UNLOCK_ORDER_BY_PATH = {
  heaven: ['qi_control', 'dao_resonance', 'divine_sense', 'law_weaving', 'tribulation_insight', 'star_rhythm'],
  earth: ['body_tempering', 'meridian_fortitude', 'rooted_guard', 'blood_essence', 'armor_harmony', 'recovery_depth'],
  martial: ['weapon_intent', 'battle_rhythm', 'flow_step', 'precision', 'counter_sense', 'killing_momentum'],
} as const satisfies Record<PathId, readonly string[]>;

export const TRAINING_UNLOCK_REALM_NAMES = [
  'Qi Condensation',
  'Foundation Establishment',
  'Core Formation',
  'Nascent Soul',
  'Soul Formation',
  'Spirit Severing',
] as const;

export interface TrainingFutureStatUnlock {
  statId: string;
  displayName: string;
  path: PathId;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  lockedReason: string;
  stat: CultivatorStatDef | null;
}

export interface TrainingLockedRegimenUnlock {
  regimen: TrainingRegimenDef;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  lockedReason: string;
  primaryStat: TrainingFutureStatUnlock;
}

export interface TrainingNextUnlock {
  statId: string;
  displayName: string;
  realmIndex: number;
  realmLabel: string;
  regimenId: string | null;
}

export interface TrainingUnlockPolicy {
  path: PathId;
  realmIndex: number;
  unlockedStatIds: string[];
  futureStats: TrainingFutureStatUnlock[];
  availableRegimens: TrainingRegimenDef[];
  lockedRegimens: TrainingLockedRegimenUnlock[];
  nextUnlock: TrainingNextUnlock | null;
}

export interface ResolveTrainingUnlockPolicyInput {
  content: TrainingRuntimeContent;
  path: PathId;
  realmIndex: number;
}

export interface ResolveTrainingRegimenUnlockInput {
  regimen: TrainingRegimenDef;
  selectedPath: PathId | null;
  realmIndex: number;
}

export interface TrainingRegimenUnlockResult {
  unlocked: boolean;
  unlockRealmIndex: number;
  unlockRealmLabel: string;
  reason: 'unlocked' | 'path_not_selected' | 'path_mismatch' | 'regimen_locked' | 'unknown_policy_stat';
  lockedReason: string | null;
}

const clampRealmIndex = (realmIndex: number): number => {
  if (!Number.isFinite(realmIndex)) return 0;
  return Math.max(0, Math.min(TRAINING_UNLOCK_REALM_NAMES.length - 1, Math.floor(realmIndex)));
};

export function getTrainingUnlockRealmLabel(realmIndex: number): string {
  const normalized = clampRealmIndex(realmIndex);
  return TRAINING_UNLOCK_REALM_NAMES[normalized] ?? `Realm ${normalized}`;
}

export function getTrainingStatUnlockRealmIndex(path: PathId, statId: string): number | null {
  const order: readonly string[] = TRAINING_STAT_UNLOCK_ORDER_BY_PATH[path];
  const index = order.indexOf(statId);
  return index >= 0 ? index : null;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statUnlockRow(content: TrainingRuntimeContent, path: PathId, statId: string): TrainingFutureStatUnlock {
  const unlockRealmIndex = getTrainingStatUnlockRealmIndex(path, statId) ?? 0;
  const stat = content.statsById[statId] ?? null;
  const displayName = stat?.displayName ?? titleCase(statId);
  const unlockRealmLabel = getTrainingUnlockRealmLabel(unlockRealmIndex);
  return {
    statId,
    displayName,
    path,
    unlockRealmIndex,
    unlockRealmLabel,
    lockedReason: `${displayName} opens at ${unlockRealmLabel}.`,
    stat,
  };
}

function regimenSortIndex(regimen: TrainingRegimenDef): number {
  const index = getTrainingStatUnlockRealmIndex(regimen.path, regimen.primaryStatId);
  return index ?? Number.MAX_SAFE_INTEGER;
}

function sortRegimens(left: TrainingRegimenDef, right: TrainingRegimenDef): number {
  const leftIndex = regimenSortIndex(left);
  const rightIndex = regimenSortIndex(right);
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return left.id.localeCompare(right.id);
}

export function resolveTrainingRegimenUnlock(input: ResolveTrainingRegimenUnlockInput): TrainingRegimenUnlockResult {
  const policyIndex = getTrainingStatUnlockRealmIndex(input.regimen.path, input.regimen.primaryStatId);
  const contentIndex = Number.isFinite(input.regimen.unlockRealmIndex)
    ? Math.max(0, Math.floor(input.regimen.unlockRealmIndex))
    : policyIndex;
  const unlockRealmIndex = policyIndex ?? contentIndex ?? 0;
  const unlockRealmLabel = getTrainingUnlockRealmLabel(unlockRealmIndex);

  if (!input.selectedPath) {
    return {
      unlocked: false,
      unlockRealmIndex,
      unlockRealmLabel,
      reason: 'path_not_selected',
      lockedReason: 'Choose a path before starting Training Hall practice.',
    };
  }
  if (input.selectedPath !== input.regimen.path) {
    return {
      unlocked: false,
      unlockRealmIndex,
      unlockRealmLabel,
      reason: 'path_mismatch',
      lockedReason: 'This regimen belongs to a different path.',
    };
  }
  if (policyIndex === null) {
    return {
      unlocked: false,
      unlockRealmIndex,
      unlockRealmLabel,
      reason: 'unknown_policy_stat',
      lockedReason: `${input.regimen.displayName} has no Training unlock policy entry.`,
    };
  }

  const realmIndex = clampRealmIndex(input.realmIndex);
  const unlocked = policyIndex <= realmIndex && (contentIndex ?? policyIndex) <= realmIndex;
  return {
    unlocked,
    unlockRealmIndex,
    unlockRealmLabel,
    reason: unlocked ? 'unlocked' : 'regimen_locked',
    lockedReason: unlocked
      ? null
      : `${input.regimen.displayName} opens at ${unlockRealmLabel}.`,
  };
}

export function isTrainingRegimenUnlocked(input: ResolveTrainingRegimenUnlockInput): boolean {
  return resolveTrainingRegimenUnlock(input).unlocked;
}

export function resolveTrainingUnlockPolicy(input: ResolveTrainingUnlockPolicyInput): TrainingUnlockPolicy {
  const realmIndex = clampRealmIndex(input.realmIndex);
  const statOrder: readonly string[] = TRAINING_STAT_UNLOCK_ORDER_BY_PATH[input.path];
  const unlockedStatIds = statOrder.slice(0, Math.min(statOrder.length, realmIndex + 1));
  const unlockedStatSet = new Set<string>(unlockedStatIds);
  const futureStats = statOrder
    .slice(unlockedStatIds.length)
    .map((statId) => statUnlockRow(input.content, input.path, statId));

  const pathRegimens = input.content.regimens
    .filter((regimen) => regimen.path === input.path)
    .sort(sortRegimens);
  const availableRegimens = pathRegimens.filter((regimen) => {
    if (!unlockedStatSet.has(regimen.primaryStatId)) return false;
    return resolveTrainingRegimenUnlock({
      regimen,
      selectedPath: input.path,
      realmIndex,
    }).unlocked;
  });
  const lockedRegimens = pathRegimens
    .filter((regimen) => !availableRegimens.some((available) => available.id === regimen.id))
    .map((regimen) => {
      const unlock = resolveTrainingRegimenUnlock({
        regimen,
        selectedPath: input.path,
        realmIndex,
      });
      const primaryStat = statUnlockRow(input.content, input.path, regimen.primaryStatId);
      return {
        regimen,
        unlockRealmIndex: unlock.unlockRealmIndex,
        unlockRealmLabel: unlock.unlockRealmLabel,
        lockedReason: unlock.lockedReason ?? `${regimen.displayName} is locked.`,
        primaryStat,
      };
    });
  const firstFuture = futureStats[0] ?? null;
  const nextUnlock = firstFuture
    ? {
        statId: firstFuture.statId,
        displayName: firstFuture.displayName,
        realmIndex: firstFuture.unlockRealmIndex,
        realmLabel: firstFuture.unlockRealmLabel,
        regimenId: lockedRegimens.find((entry) => entry.regimen.primaryStatId === firstFuture.statId)?.regimen.id ?? null,
      }
    : null;

  return {
    path: input.path,
    realmIndex,
    unlockedStatIds,
    futureStats,
    availableRegimens,
    lockedRegimens,
    nextUnlock,
  };
}
