import { getTechniqueGradePolicy, getTechniqueMaxRankForGrade, getTechniqueRuneSocketsForGrade, getTechniqueSecondaryPotencyBonusForGrade, getTechniqueTraitCapForGrade, normalizeManualGrade, } from './techniqueGradePolicy.js';
const DEFAULT_RARITY = 'common';
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const sanitizeFiniteNonNegative = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(0, value ?? 0);
};
const MASTERY_SUMMARIES = Object.freeze({
    25: Object.freeze(['Cooldown 5%']),
    50: Object.freeze(['Cost 10%']),
    75: Object.freeze(['Secondary effect unlock']),
    100: Object.freeze(['Effect 10%', 'Title: Perfected']),
});
export const TECHNIQUE_RARITY_ORDER = Object.freeze([
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
]);
export const TECHNIQUE_RARITY_TRAIT_SLOTS = Object.freeze({
    common: 1,
    uncommon: 1,
    rare: 2,
    epic: 2,
    legendary: 3,
});
export const MASTERY_MILESTONE_ORDER = Object.freeze([25, 50, 75, 100]);
export const MASTERY_XP_SCALE = 3;
export const MAX_TECHNIQUE_MASTERY_LEVEL = 100;
export const TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL = 0.003;
export const TECHNIQUE_RANK_MULTIPLIER_PER_RANK = 0.1;
export function normalizeTechniqueRarity(input) {
    const normalized = (input ?? '').toLowerCase();
    return TECHNIQUE_RARITY_ORDER.includes(normalized)
        ? normalized
        : DEFAULT_RARITY;
}
export function isHigherTechniqueRarity(current, next) {
    return TECHNIQUE_RARITY_ORDER.indexOf(next) > TECHNIQUE_RARITY_ORDER.indexOf(current);
}
export function xpNeededForLevel(level) {
    if (level <= 1)
        return 0;
    return Math.max(0, (level - 1) ** 2 * MASTERY_XP_SCALE);
}
export function masteryLevelFromXp(xp) {
    const normalized = Math.max(0, xp);
    const level = 1 + Math.floor(Math.sqrt(normalized / MASTERY_XP_SCALE));
    return Math.min(MAX_TECHNIQUE_MASTERY_LEVEL, Math.max(1, level));
}
export function masteryMilestones(level) {
    const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
    return {
        at25: clampedLevel >= 25,
        at50: clampedLevel >= 50,
        at75: clampedLevel >= 75,
        at100: clampedLevel >= 100,
    };
}
export function rankMultiplier(rank) {
    const clampedRank = clamp(Math.floor(Number.isFinite(rank) ? rank : 1), 1, 10);
    return 1 + TECHNIQUE_RANK_MULTIPLIER_PER_RANK * (clampedRank - 1);
}
export function masteryMultiplier(level) {
    const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
    const base = 1 + TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL * clampedLevel;
    return base * getMasteryMilestoneContract(clampedLevel).effectMult;
}
export function getMasteryMilestoneContract(level) {
    const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
    if (clampedLevel >= 100) {
        return {
            highestUnlockedMilestone: 100,
            effectMult: 1.1,
            cooldownMult: 0.95,
            costMult: 0.9,
            secondaryUnlocked: true,
            cosmeticTitle: 'Perfected',
        };
    }
    if (clampedLevel >= 75) {
        return {
            highestUnlockedMilestone: 75,
            effectMult: 1,
            cooldownMult: 0.95,
            costMult: 0.9,
            secondaryUnlocked: true,
        };
    }
    if (clampedLevel >= 50) {
        return {
            highestUnlockedMilestone: 50,
            effectMult: 1,
            cooldownMult: 0.95,
            costMult: 0.9,
            secondaryUnlocked: false,
        };
    }
    if (clampedLevel >= 25) {
        return {
            highestUnlockedMilestone: 25,
            effectMult: 1,
            cooldownMult: 0.95,
            costMult: 1,
            secondaryUnlocked: false,
        };
    }
    return {
        highestUnlockedMilestone: 0,
        effectMult: 1,
        cooldownMult: 1,
        costMult: 1,
        secondaryUnlocked: false,
    };
}
export function getNextMasteryMilestoneContract(level) {
    const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
    const nextLevel = MASTERY_MILESTONE_ORDER.find((milestone) => clampedLevel < milestone);
    return nextLevel
        ? { level: nextLevel, effectsSummary: [...MASTERY_SUMMARIES[nextLevel]] }
        : null;
}
export function getTechniqueRarityTraitSlots(rarity) {
    return TECHNIQUE_RARITY_TRAIT_SLOTS[normalizeTechniqueRarity(rarity)];
}
export function getTechniqueTraitSlotBreakdown(input) {
    const grade = normalizeManualGrade(input.grade);
    const rarity = normalizeTechniqueRarity(input.rarity);
    const raritySlots = getTechniqueRarityTraitSlots(rarity);
    const gradeCap = getTechniqueTraitCapForGrade(grade);
    return {
        raritySlots,
        gradeCap,
        effectiveSlots: Math.min(raritySlots, gradeCap),
        rarity,
        grade,
    };
}
export function getTechniqueEffectiveTraitSlots(input) {
    return getTechniqueTraitSlotBreakdown(input).effectiveSlots;
}
export function getTechniqueEffectiveRuneSockets(grade) {
    return getTechniqueRuneSocketsForGrade(grade);
}
export function getTechniqueSecondaryPotencyMultiplier(input) {
    const grade = normalizeManualGrade(input.grade);
    const masteryLevel = clamp(Math.floor(Number.isFinite(input.masteryLevel) ? input.masteryLevel : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
    if (grade !== 'heaven' || masteryLevel < 75)
        return 1;
    return 1 + getTechniqueSecondaryPotencyBonusForGrade(grade);
}
export function normalizeTechniqueProgressionState(source) {
    const manualGrade = normalizeManualGrade(source.manualGrade);
    const rarity = normalizeTechniqueRarity(source.rarity);
    const masteryXp = sanitizeFiniteNonNegative(source.masteryXp);
    const rankCap = getTechniqueMaxRankForGrade(manualGrade);
    const rank = clamp(Math.floor(Number.isFinite(source.rank) ? source.rank ?? 1 : 1), 1, rankCap);
    const effectiveTraitSlots = getTechniqueEffectiveTraitSlots({ grade: manualGrade, rarity });
    const runeSockets = getTechniqueEffectiveRuneSockets(manualGrade);
    const traits = Array.isArray(source.traits)
        ? source.traits
            .filter((trait) => {
            return !!trait && typeof trait === 'object' && typeof trait.id === 'string';
        })
            .slice(0, effectiveTraitSlots)
            .map((trait) => ({ ...trait }))
        : [];
    const normalizedRunes = Array.isArray(source.runes)
        ? source.runes.slice(0, runeSockets).map((rune) => rune ?? null)
        : [];
    while (normalizedRunes.length < runeSockets) {
        normalizedRunes.push(null);
    }
    return {
        manualGrade,
        rarity,
        masteryXp,
        rank,
        traits,
        runes: normalizedRunes,
    };
}
export function buildTechniqueProgressionSnapshot(source) {
    const normalized = normalizeTechniqueProgressionState(source);
    const masteryLevel = masteryLevelFromXp(normalized.masteryXp);
    const gradePolicy = getTechniqueGradePolicy(normalized.manualGrade);
    const masteryMilestoneEffects = getMasteryMilestoneContract(masteryLevel);
    const nextMasteryMilestone = getNextMasteryMilestoneContract(masteryLevel);
    const effectMultiplier = masteryMultiplier(masteryLevel) * rankMultiplier(normalized.rank);
    const cooldownReductionPct = clamp(1 - masteryMilestoneEffects.cooldownMult, 0, 1);
    const costReductionPct = clamp(1 - masteryMilestoneEffects.costMult, 0, 1);
    const secondaryPotencyMult = getTechniqueSecondaryPotencyMultiplier({
        grade: normalized.manualGrade,
        masteryLevel,
    });
    const traitSlotBreakdown = getTechniqueTraitSlotBreakdown({
        grade: normalized.manualGrade,
        rarity: normalized.rarity,
    });
    const runeSockets = getTechniqueEffectiveRuneSockets(normalized.manualGrade);
    return {
        grade: normalized.manualGrade,
        rarity: normalized.rarity,
        gradePolicy,
        masteryXp: normalized.masteryXp,
        masteryLevel,
        rank: normalized.rank,
        rankCap: getTechniqueMaxRankForGrade(normalized.manualGrade),
        masteryMilestoneEffects,
        nextMasteryMilestone,
        effectMultiplier,
        cooldownReductionPct,
        costReductionPct,
        secondaryPotencyMult,
        traitSlotBreakdown,
        runeSockets,
        appliedTraitCount: normalized.traits.length,
        appliedRuneCount: normalized.runes.filter((runeId) => Boolean(runeId)).length,
    };
}
export function getRetainedMasteryXp(masteryXp, retentionRatio) {
    const sanitizedXp = sanitizeFiniteNonNegative(masteryXp);
    const sanitizedRatio = clamp(Number.isFinite(retentionRatio) ? retentionRatio : 0, 0, 1);
    return Math.min(xpNeededForLevel(MAX_TECHNIQUE_MASTERY_LEVEL), sanitizedXp * sanitizedRatio);
}
