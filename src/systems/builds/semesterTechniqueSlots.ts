import { clampRealmIndexToSemesterSlice, getLiveRealmNameByIndex } from '../progression/runtime/index.js';

export type SemesterTechniqueSlotType = 'active' | 'passive' | 'ultimate';

export interface SemesterTechniqueSlotUnlockRequirement {
  realmIndex: number;
  realmName: string;
  reasonText: string;
}

export interface SemesterTechniqueSlotProgression {
  displayed: { active: number; passive: number };
  unlocked: { active: number; passive: number; ultimate: boolean };
}

export interface SemesterTechniqueSlotProgressionSnapshot extends SemesterTechniqueSlotProgression {
  unlockRequirements: {
    active: Record<number, SemesterTechniqueSlotUnlockRequirement | null>;
    passive: Record<number, SemesterTechniqueSlotUnlockRequirement | null>;
    ultimate: SemesterTechniqueSlotUnlockRequirement | null;
  };
}

export const BASE_ACTIVE_SLOTS = 2;
export const BASE_PASSIVE_SLOTS = 1;
export const MIN_DISPLAY_ACTIVE_SLOTS = 3;
export const MIN_DISPLAY_PASSIVE_SLOTS = 2;

export function clampTechniqueSlotCount(value: number, minimum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(minimum, Math.floor(value));
}

export function normalizeTechniqueSlotIds(slots: string[], nextCount: number): string[] {
  if (slots.length === nextCount) {
    return slots;
  }

  if (slots.length > nextCount) {
    return slots.slice(0, nextCount);
  }

  return [...slots, ...Array.from({ length: nextCount - slots.length }, () => '')];
}

export function resolveSemesterRealmIndex(realmIndex: number): number {
  return clampRealmIndexToSemesterSlice(realmIndex);
}

export function getSemesterRealmName(realmIndex: number): string {
  return getLiveRealmNameByIndex(resolveSemesterRealmIndex(realmIndex));
}

export function createSemesterTechniqueUnlockRequirement(
  realmIndex: number,
  reasonText: string,
): SemesterTechniqueSlotUnlockRequirement {
  return {
    realmIndex,
    realmName: getSemesterRealmName(realmIndex),
    reasonText,
  };
}

export function computeSemesterTechniqueSlotProgression(
  activeSlots: number,
  passiveSlots: number,
  realmIndex: number,
): SemesterTechniqueSlotProgression {
  const displayedActive = Math.max(MIN_DISPLAY_ACTIVE_SLOTS, activeSlots);
  const displayedPassive = Math.max(MIN_DISPLAY_PASSIVE_SLOTS, passiveSlots);

  const normalizedRealmIndex = resolveSemesterRealmIndex(realmIndex);
  const baselineUnlockedActive = normalizedRealmIndex >= 1 ? 3 : 2;
  const baselineUnlockedPassive = normalizedRealmIndex >= 2 ? 2 : 1;
  const unlockedActive = Math.max(activeSlots, baselineUnlockedActive);
  const unlockedPassive = Math.max(passiveSlots, baselineUnlockedPassive);
  const ultimateUnlocked = normalizedRealmIndex >= 3;

  return {
    displayed: { active: displayedActive, passive: displayedPassive },
    unlocked: { active: unlockedActive, passive: unlockedPassive, ultimate: ultimateUnlocked },
  };
}

export function getSemesterTechniqueSlotUnlockRequirement(
  slotType: SemesterTechniqueSlotType,
  slotIndex: number,
  progression: SemesterTechniqueSlotProgressionSnapshot['unlocked'],
): SemesterTechniqueSlotUnlockRequirement | null {
  if (slotType === 'ultimate') {
    return progression.ultimate ? null : createSemesterTechniqueUnlockRequirement(3, `Unlocks at: ${getSemesterRealmName(3)}`);
  }

  if (slotType === 'active') {
    if (slotIndex !== 2 || progression.active > 2) {
      return null;
    }

    return createSemesterTechniqueUnlockRequirement(1, `Unlocks at: ${getSemesterRealmName(1)}`);
  }

  if (slotIndex !== 1 || progression.passive > 1) {
    return null;
  }

  return createSemesterTechniqueUnlockRequirement(2, `Unlocks at: ${getSemesterRealmName(2)}`);
}

export function buildSemesterTechniqueSlotProgressionSnapshot(
  activeSlots: number,
  passiveSlots: number,
  realmIndex: number,
): SemesterTechniqueSlotProgressionSnapshot {
  const progression = computeSemesterTechniqueSlotProgression(activeSlots, passiveSlots, realmIndex);

  return {
    ...progression,
    unlockRequirements: {
      active: {
        0: null,
        1: null,
        2: getSemesterTechniqueSlotUnlockRequirement('active', 2, progression.unlocked),
      },
      passive: {
        0: null,
        1: getSemesterTechniqueSlotUnlockRequirement('passive', 1, progression.unlocked),
      },
      ultimate: getSemesterTechniqueSlotUnlockRequirement('ultimate', 0, progression.unlocked),
    },
  };
}

export function isSemesterTechniqueSlotUnlocked(
  slotType: SemesterTechniqueSlotType,
  slotIndex: number,
  progression: SemesterTechniqueSlotProgressionSnapshot['unlocked'],
): boolean {
  if (slotType === 'ultimate') {
    return progression.ultimate;
  }

  const unlockedCount = slotType === 'active' ? progression.active : progression.passive;
  return slotIndex >= 0 && slotIndex < unlockedCount;
}
