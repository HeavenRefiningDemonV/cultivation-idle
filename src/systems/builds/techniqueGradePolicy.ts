import type { ManualGrade } from '../../types/index.js';

export interface TechniqueGradePolicy {
  grade: ManualGrade;
  maxRank: number;
  traitSlots: number;
  runeSockets: number;
  mastery75SecondaryPotencyBonus: number;
}

const DEFAULT_GRADE: ManualGrade = 'mortal';

export const TECHNIQUE_GRADE_ORDER: readonly ManualGrade[] = Object.freeze([
  'mortal',
  'earth',
  'heaven',
  'mystic',
] as const);

export const SEMESTER_TECHNIQUE_GRADE_POLICIES: readonly TechniqueGradePolicy[] = Object.freeze([
  Object.freeze({
    grade: 'mortal',
    maxRank: 3,
    traitSlots: 1,
    runeSockets: 0,
    mastery75SecondaryPotencyBonus: 0,
  }),
  Object.freeze({
    grade: 'earth',
    maxRank: 5,
    traitSlots: 1,
    runeSockets: 1,
    mastery75SecondaryPotencyBonus: 0,
  }),
  Object.freeze({
    grade: 'heaven',
    maxRank: 7,
    traitSlots: 2,
    runeSockets: 2,
    mastery75SecondaryPotencyBonus: 0.25,
  }),
  Object.freeze({
    grade: 'mystic',
    maxRank: 10,
    traitSlots: 3,
    runeSockets: 3,
    mastery75SecondaryPotencyBonus: 0,
  }),
] as const satisfies readonly TechniqueGradePolicy[]);

export const TECHNIQUE_GRADE_POLICY_BY_GRADE: Readonly<Record<ManualGrade, TechniqueGradePolicy>> = Object.freeze(
  SEMESTER_TECHNIQUE_GRADE_POLICIES.reduce((acc, policy) => {
    acc[policy.grade] = policy;
    return acc;
  }, {} as Record<ManualGrade, TechniqueGradePolicy>),
);

export function normalizeManualGrade(input?: string | null): ManualGrade {
  const normalized = (input ?? '').toLowerCase();
  return TECHNIQUE_GRADE_ORDER.includes(normalized as ManualGrade)
    ? normalized as ManualGrade
    : DEFAULT_GRADE;
}

export function isHigherTechniqueGrade(current: ManualGrade, next: ManualGrade): boolean {
  return TECHNIQUE_GRADE_ORDER.indexOf(next) > TECHNIQUE_GRADE_ORDER.indexOf(current);
}

export function getTechniqueGradePolicy(grade: ManualGrade | null | undefined): TechniqueGradePolicy {
  return TECHNIQUE_GRADE_POLICY_BY_GRADE[normalizeManualGrade(grade)];
}

export function getTechniqueMaxRankForGrade(grade: ManualGrade | null | undefined): number {
  return getTechniqueGradePolicy(grade).maxRank;
}

export function getTechniqueTraitCapForGrade(grade: ManualGrade | null | undefined): number {
  return getTechniqueGradePolicy(grade).traitSlots;
}

export function getTechniqueRuneSocketsForGrade(grade: ManualGrade | null | undefined): number {
  return getTechniqueGradePolicy(grade).runeSockets;
}

export function getTechniqueSecondaryPotencyBonusForGrade(grade: ManualGrade | null | undefined): number {
  return getTechniqueGradePolicy(grade).mastery75SecondaryPotencyBonus;
}
