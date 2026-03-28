import { normalizeManualGrade, normalizeTechniqueRarity, } from "../builds/index.js";
export const STUDY_DURATION_BY_GRADE = Object.freeze({
    mortal: 30_000,
    earth: 90_000,
    heaven: 240_000,
    mystic: 600_000,
});
export const STUDY_DURATION_LABEL_BY_GRADE = Object.freeze({
    mortal: "30s",
    earth: "1m 30s",
    heaven: "4m",
    mystic: "10m",
});
export const DUPLICATE_FRAGMENT_BASE_BY_RARITY = Object.freeze({
    common: 20,
    uncommon: 45,
    rare: 110,
    epic: 280,
    legendary: 700,
});
export const DUPLICATE_FRAGMENT_MULTIPLIER_BY_GRADE = Object.freeze({
    mortal: 1,
    earth: 1.2,
    heaven: 1.5,
    mystic: 2,
});
export function getStudyDurationByGrade(grade) {
    return STUDY_DURATION_BY_GRADE[normalizeManualGrade(grade)];
}
export function getStudyDurationLabelByGrade(grade) {
    return STUDY_DURATION_LABEL_BY_GRADE[normalizeManualGrade(grade)];
}
export function getDuplicateFragmentValue(grade, rarity) {
    const normalizedGrade = normalizeManualGrade(grade);
    const normalizedRarity = normalizeTechniqueRarity(rarity);
    const base = DUPLICATE_FRAGMENT_BASE_BY_RARITY[normalizedRarity];
    const multiplier = DUPLICATE_FRAGMENT_MULTIPLIER_BY_GRADE[normalizedGrade];
    return Math.max(0, Math.floor(base * multiplier));
}
