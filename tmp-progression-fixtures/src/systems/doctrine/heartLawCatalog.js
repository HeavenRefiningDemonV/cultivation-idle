import { useContentStore } from '../../stores/contentStore.js';
import { getHeartLawFamily } from './heartLawFamilyRegistry.js';
import { LIVE_SPIRIT_ROOT_ELEMENTS, getHeartLawChapterThresholds, getNormalizedHeartLawAffinityRules, normalizeHeartLawEffectEntries, } from './heartLawEffectReaders.js';
function normalizeStringList(values) {
    if (!Array.isArray(values)) {
        return [];
    }
    const normalized = values
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);
    return Array.from(new Set(normalized));
}
function getLiveSpiritRootAffinities(values) {
    const liveSet = new Set(LIVE_SPIRIT_ROOT_ELEMENTS);
    return values.filter((value) => liveSet.has(value));
}
function freezeEffectList(effects) {
    return Object.freeze([...effects]);
}
function computeCombatBudgetPct(effects) {
    let combatWeight = 0;
    let innerWeight = 0;
    effects.forEach((effect) => {
        if (effect.budgetWeight <= 0) {
            return;
        }
        if (effect.domain === 'combat') {
            combatWeight += effect.budgetWeight;
            return;
        }
        innerWeight += effect.budgetWeight;
    });
    const total = combatWeight + innerWeight;
    if (total <= 0) {
        return 0;
    }
    return Math.round((combatWeight / total) * 100);
}
function buildHeartLawProfile(law, affinityRules) {
    const family = getHeartLawFamily(law.id);
    if (!family) {
        throw new Error(`[HeartLawCatalog] Missing explicit family registry entry for live heart law '${law.id}'.`);
    }
    const daoTags = normalizeStringList(law.daoTags);
    const spiritRootAffinities = normalizeStringList(law.spiritRootAffinities);
    const liveSpiritRootAffinities = Object.freeze(getLiveSpiritRootAffinities(spiritRootAffinities));
    const chapterThresholds = getHeartLawChapterThresholds();
    const signatureEffects = freezeEffectList(normalizeHeartLawEffectEntries('signature', law.signature ?? null));
    const sortedChapters = [...(law.chapters ?? [])].sort((a, b) => a.chapter - b.chapter);
    const chapterEffectsByChapterEntries = Array.from({ length: 5 }, (_, index) => {
        const chapter = index + 1;
        const chapterEffects = sortedChapters
            .filter((entry) => entry.chapter === chapter)
            .flatMap((entry) => normalizeHeartLawEffectEntries(`chapter:${chapter}`, entry.effects ?? null));
        return [chapter, freezeEffectList(chapterEffects)];
    });
    const chapterEffectsByChapter = Object.freeze(Object.fromEntries(chapterEffectsByChapterEntries));
    const normalizedEffects = freezeEffectList([
        ...signatureEffects,
        ...chapterEffectsByChapterEntries.flatMap(([, effects]) => effects),
    ]);
    const notes = Object.freeze(normalizedEffects
        .filter((effect) => effect.normalizedKey === 'note' && typeof effect.value === 'string')
        .map((effect) => effect.value));
    return Object.freeze({
        id: law.id,
        name: law.name,
        tier: typeof law.tier === 'string' ? law.tier : null,
        family,
        archetype: typeof law.archetype === 'string' ? law.archetype : null,
        daoTags,
        spiritRootAffinities,
        liveSpiritRootAffinities,
        affinityRules,
        chapterThresholds,
        signatureEffects,
        chapterEffectsByChapter,
        normalizedEffects,
        notes,
        combatBudgetPct: computeCombatBudgetPct(normalizedEffects),
    });
}
export function buildHeartLawCatalogFromDefinitions(laws, affinityRules) {
    const catalog = {};
    const normalizedAffinityRules = getNormalizedHeartLawAffinityRules(affinityRules);
    laws.forEach((law) => {
        catalog[law.id] = buildHeartLawProfile(law, normalizedAffinityRules);
    });
    return Object.freeze(catalog);
}
export function buildHeartLawCatalog() {
    const content = useContentStore.getState();
    if (!content.isLoaded || !content.raw) {
        return {};
    }
    return buildHeartLawCatalogFromDefinitions(content.raw.heart_laws, content.raw.heart_law_affinity_rules);
}
export function getHeartLawProfile(id) {
    if (id === null) {
        return null;
    }
    const catalog = buildHeartLawCatalog();
    return catalog[id] ?? null;
}
