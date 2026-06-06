import { LIVE_SPIRIT_ROOT_ELEMENTS } from './heartLawEffectReaders.js';
export const SPIRIT_ROOT_RESONANCE_TABLE = Object.freeze({
    strong: Object.freeze({
        tier: 'strong',
        heartLawEffectMult: 1.12,
        comprehensionMult: 1.08,
        qiMult: 1.05,
    }),
    partial: Object.freeze({
        tier: 'partial',
        heartLawEffectMult: 1.06,
        comprehensionMult: 1.04,
        qiMult: 1.02,
    }),
    neutral: Object.freeze({
        tier: 'neutral',
        heartLawEffectMult: 1,
        comprehensionMult: 1,
        qiMult: 1,
    }),
    mismatch: Object.freeze({
        tier: 'mismatch',
        heartLawEffectMult: 0.96,
        comprehensionMult: 0.97,
        qiMult: 1,
    }),
});
const LIVE_SPIRIT_ROOT_ELEMENT_SET = new Set(LIVE_SPIRIT_ROOT_ELEMENTS);
function getFallbackLiveDaoTags(law) {
    return law.daoTags.filter((tag) => LIVE_SPIRIT_ROOT_ELEMENT_SET.has(tag));
}
export function evaluateSpiritRootResonance(root, law) {
    if (root === null || law === null) {
        return SPIRIT_ROOT_RESONANCE_TABLE.neutral;
    }
    if (law.spiritRootAffinities.includes('any')) {
        return SPIRIT_ROOT_RESONANCE_TABLE.neutral;
    }
    if (law.spiritRootAffinities.length > 0 && law.liveSpiritRootAffinities.length === 0) {
        return SPIRIT_ROOT_RESONANCE_TABLE.neutral;
    }
    if (law.liveSpiritRootAffinities.length > 0) {
        return law.liveSpiritRootAffinities.includes(root.element)
            ? SPIRIT_ROOT_RESONANCE_TABLE.strong
            : SPIRIT_ROOT_RESONANCE_TABLE.mismatch;
    }
    const fallbackLiveDaoTags = getFallbackLiveDaoTags(law);
    if (fallbackLiveDaoTags.length === 0) {
        return SPIRIT_ROOT_RESONANCE_TABLE.neutral;
    }
    return fallbackLiveDaoTags.includes(root.element)
        ? SPIRIT_ROOT_RESONANCE_TABLE.partial
        : SPIRIT_ROOT_RESONANCE_TABLE.neutral;
}
