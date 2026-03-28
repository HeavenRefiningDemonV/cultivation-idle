import { getHeartLawProfile } from '../doctrine/heartLawCatalog.js';
import { evaluateSpiritRootResonance } from '../doctrine/spiritRootResonance.js';
const MULTIPLIER_KEY_TO_FIELD = {
    cultivateQiMult: 'cultivateRateMult',
    combatDamageMult: 'combatDamageMult',
    breakthroughRequirementMult: 'breakthroughRequirementMult',
    stabilityCostMult: 'stabilityCostMult',
    maxQiMult: 'maxQiMult',
    maxHpMult: 'maxHpMult',
    defMult: 'defMult',
    regenMult: 'regenMult',
    bossDamageTakenMult: 'bossDamageTakenMult',
    cooldownMult: 'cooldownMult',
    ultimateCooldownMult: 'ultimateCooldownMult',
    shieldStrength: 'shieldStrengthMult',
    bossUltimateDamageTakenMult: 'bossUltimateDamageTakenMult',
    critDmgMult: 'critDmgMult',
    hasteMult: 'hasteMult',
    techniqueMasteryGainMult: 'techniqueMasteryGainMult',
    forgeSpeed: 'forgeSpeedMult',
    herbYieldMult: 'herbYieldMult',
    alchemyYieldMult: 'alchemyYieldMult',
};
const ADDITIVE_KEY_TO_FIELD = {
    offlineEfficiencyAdd: 'offlineEfficiencyAdd',
    damageReduction: 'damageReductionAdd',
    dodgeAddPctPoints: 'dodgeAddPctPoints',
    poisonResist: 'poisonResistAdd',
    critChanceAddPctPoints: 'critChanceAddPctPoints',
    intentMaxAdd: 'intentMaxAdd',
    cooldownRefundChance: 'cooldownRefundChance',
    cooldownRefundPct: 'cooldownRefundPct',
    bossUltimateWarningAddSec: 'bossUltimateWarningAddSec',
    lifestealMaxHpPct: 'lifestealMaxHpPct',
    tribulationResist: 'tribulationResistAdd',
};
function createNeutralHeartLawBonuses() {
    return {
        cultivateRateMult: 1,
        combatDamageMult: 1,
        professionSpeedMult: 1,
        professionYieldMult: 1,
        breakthroughRequirementMult: 1,
        offlineEfficiencyAdd: 0,
        stabilityCostMult: 1,
        maxQiMult: 1,
        maxHpMult: 1,
        defMult: 1,
        regenMult: 1,
        damageReductionAdd: 0,
        bossDamageTakenMult: 1,
        cooldownMult: 1,
        ultimateCooldownMult: 1,
        shieldStrengthMult: 1,
        dodgeAddPctPoints: 0,
        poisonResistAdd: 0,
        bossUltimateDamageTakenMult: 1,
        critChanceAddPctPoints: 0,
        critDmgMult: 1,
        hasteMult: 1,
        techniqueMasteryGainMult: 1,
        intentMaxAdd: 0,
        forgeSpeedMult: 1,
        herbYieldMult: 1,
        alchemyYieldMult: 1,
        cooldownRefundChance: 0,
        cooldownRefundPct: 0,
        bossUltimateWarningAddSec: 0,
        lifestealMaxHpPct: 0,
        tribulationResistAdd: 0,
        affinityMultiplier: 1,
        affinityStatus: 'none',
        notes: [],
    };
}
function normalizeRequestedChapter(chapter) {
    if (!Number.isFinite(chapter)) {
        return 1;
    }
    return Math.max(1, Math.floor(chapter));
}
function getResonanceTierCompatStatus(tier) {
    switch (tier) {
        case 'strong':
            return { status: 'match', percent: 12 };
        case 'partial':
            return { status: 'match', percent: 6 };
        case 'mismatch':
            return { status: 'mismatch', percent: 4 };
        case 'neutral':
        default:
            return { status: 'none', percent: 0 };
    }
}
function shouldApplyAffinityScaling(source) {
    return source === 'signature';
}
export function computeAffinityMultiplier(heartLawDef, spiritRoot) {
    const profile = getHeartLawProfile(heartLawDef?.id ?? null);
    return evaluateSpiritRootResonance(spiritRoot, profile).heartLawEffectMult;
}
export function getAffinityStatus(heartLawDef, spiritRoot) {
    const profile = getHeartLawProfile(heartLawDef?.id ?? null);
    return getResonanceTierCompatStatus(evaluateSpiritRootResonance(spiritRoot, profile).tier);
}
export function getHeartLawBonuses(options) {
    const { heartLawDef, chapter, spiritRoot } = options;
    const bonuses = createNeutralHeartLawBonuses();
    const profile = getHeartLawProfile(heartLawDef?.id ?? null);
    if (!heartLawDef || !profile) {
        return bonuses;
    }
    const requestedChapter = normalizeRequestedChapter(chapter);
    const resonance = evaluateSpiritRootResonance(spiritRoot, profile);
    const affinityMultiplier = resonance.heartLawEffectMult;
    const affinityStatus = getResonanceTierCompatStatus(resonance.tier).status;
    bonuses.affinityMultiplier = affinityMultiplier;
    bonuses.affinityStatus = affinityStatus;
    const activeEffects = [
        ...profile.signatureEffects,
        ...Object.entries(profile.chapterEffectsByChapter)
            .filter(([chapterKey]) => Number(chapterKey) <= requestedChapter)
            .flatMap(([, effects]) => effects),
    ];
    const multiplierDeltas = {};
    activeEffects.forEach((effect) => {
        if (typeof effect.value !== 'number') {
            return;
        }
        const scaledValue = effect.appliesAffinity && shouldApplyAffinityScaling(effect.source)
            ? effect.value * affinityMultiplier
            : effect.value;
        const multiplierField = MULTIPLIER_KEY_TO_FIELD[effect.normalizedKey];
        if (multiplierField) {
            multiplierDeltas[multiplierField] = (multiplierDeltas[multiplierField] ?? 0) + scaledValue;
            return;
        }
        const additiveField = ADDITIVE_KEY_TO_FIELD[effect.normalizedKey];
        if (additiveField) {
            bonuses[additiveField] += scaledValue;
        }
    });
    Object.values(MULTIPLIER_KEY_TO_FIELD).forEach((field) => {
        bonuses[field] = 1 + (multiplierDeltas[field] ?? 0);
    });
    bonuses.professionSpeedMult = bonuses.forgeSpeedMult;
    bonuses.professionYieldMult = Math.max(0, 1 + ((bonuses.herbYieldMult - 1) + (bonuses.alchemyYieldMult - 1)));
    const seenNotes = new Set();
    bonuses.notes = profile.notes.filter((note) => {
        if (seenNotes.has(note)) {
            return false;
        }
        seenNotes.add(note);
        return true;
    });
    return bonuses;
}
