const DEFAULT_GRADE = 'mortal';
export const TECHNIQUE_GRADE_ORDER = Object.freeze([
    'mortal',
    'earth',
    'heaven',
    'mystic',
]);
export const SEMESTER_TECHNIQUE_GRADE_POLICIES = Object.freeze([
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
]);
export const TECHNIQUE_GRADE_POLICY_BY_GRADE = Object.freeze(SEMESTER_TECHNIQUE_GRADE_POLICIES.reduce((acc, policy) => {
    acc[policy.grade] = policy;
    return acc;
}, {}));
export function normalizeManualGrade(input) {
    const normalized = (input ?? '').toLowerCase();
    return TECHNIQUE_GRADE_ORDER.includes(normalized)
        ? normalized
        : DEFAULT_GRADE;
}
export function isHigherTechniqueGrade(current, next) {
    return TECHNIQUE_GRADE_ORDER.indexOf(next) > TECHNIQUE_GRADE_ORDER.indexOf(current);
}
export function getTechniqueGradePolicy(grade) {
    return TECHNIQUE_GRADE_POLICY_BY_GRADE[normalizeManualGrade(grade)];
}
export function getTechniqueMaxRankForGrade(grade) {
    return getTechniqueGradePolicy(grade).maxRank;
}
export function getTechniqueTraitCapForGrade(grade) {
    return getTechniqueGradePolicy(grade).traitSlots;
}
export function getTechniqueRuneSocketsForGrade(grade) {
    return getTechniqueGradePolicy(grade).runeSockets;
}
export function getTechniqueSecondaryPotencyBonusForGrade(grade) {
    return getTechniqueGradePolicy(grade).mastery75SecondaryPotencyBonus;
}
