import { PATH_MODIFIERS } from '../../constants/index.js';
const PATH_DOCTRINE_SEMANTICS = Object.freeze({
    heaven: Object.freeze({
        label: 'Heaven',
        summary: 'Fast cultivation and technique-led pressure. Heaven converts qi tempo into precise offensive windows, but its survival floor is thinner and greed is punished.',
        coreIdentity: 'precision_pressure',
        prepBias: Object.freeze(['qi-floor', 'medicine-floor', 'survival-backstop', 'resource-plan']),
        forgeBias: Object.freeze(['weapon-first', 'offense-runes', 'survival-patch-before-push']),
        buildBias: Object.freeze(['technique-pressure', 'utility-setup', 'guard-backstop']),
        recommendedAiByPhase: Object.freeze({
            early: Object.freeze(['balanced', 'farmer']),
            boss: Object.freeze(['burst', 'balanced']),
        }),
        commonFailureModes: Object.freeze([
            'greedy-without-backstop',
            'underdefended-for-gate',
            'resource-starved-rotation',
        ]),
    }),
    earth: Object.freeze({
        label: 'Earth',
        summary: 'Durability-first cultivation with steady inevitability. Earth wins by surviving long fights and holding formation, but it stalls when weapon floor and finishers lag.',
        coreIdentity: 'durable_inevitability',
        prepBias: Object.freeze(['forge-floor', 'sustain-floor', 'medicine-floor']),
        forgeBias: Object.freeze(['armor-first', 'balanced-refine', 'defense-runes']),
        buildBias: Object.freeze(['durable-rotation', 'guard-backstop', 'single-target-finisher']),
        recommendedAiByPhase: Object.freeze({
            early: Object.freeze(['balanced', 'survivor']),
            boss: Object.freeze(['survivor', 'balanced']),
        }),
        commonFailureModes: Object.freeze([
            'stalling-without-finisher',
            'underforged-weapon',
            'overdefended-no-pressure',
        ]),
    }),
    martial: Object.freeze({
        label: 'Martial',
        summary: 'Aggressive tempo with the strongest kill-window feel. Martial wins by chaining pressure and crit-driven bursts, but it falls off quickly when sustain and discipline are ignored.',
        coreIdentity: 'tempo_kill_window',
        prepBias: Object.freeze(['forge-floor', 'medicine-floor', 'tempo-preservation', 'resource-plan']),
        forgeBias: Object.freeze(['weapon-first', 'offense-runes', 'survival-patch-before-push']),
        buildBias: Object.freeze(['tempo-chain', 'single-target-finisher', 'minimum-sustain']),
        recommendedAiByPhase: Object.freeze({
            early: Object.freeze(['farmer', 'burst']),
            boss: Object.freeze(['burst', 'balanced']),
        }),
        commonFailureModes: Object.freeze([
            'overextending-burst-window',
            'resource-starved-rotation',
            'greedy-without-backstop',
        ]),
    }),
});
function clonePathModifierSignature(path) {
    const modifierSignature = PATH_MODIFIERS[path];
    return {
        qiMultiplier: modifierSignature.qiMultiplier,
        hpMultiplier: modifierSignature.hpMultiplier,
        atkMultiplier: modifierSignature.atkMultiplier,
        defMultiplier: modifierSignature.defMultiplier,
        critBonus: modifierSignature.critBonus,
        dodgeBonus: modifierSignature.dodgeBonus,
    };
}
function freezePathDoctrineProfile(profile) {
    Object.freeze(profile.modifierSignature);
    Object.freeze(profile.prepBias);
    Object.freeze(profile.forgeBias);
    Object.freeze(profile.buildBias);
    Object.freeze(profile.recommendedAiByPhase.early);
    Object.freeze(profile.recommendedAiByPhase.boss);
    Object.freeze(profile.recommendedAiByPhase);
    Object.freeze(profile.commonFailureModes);
    return Object.freeze(profile);
}
function buildPathDoctrineProfile(path) {
    const semanticProfile = PATH_DOCTRINE_SEMANTICS[path];
    return freezePathDoctrineProfile({
        id: path,
        label: semanticProfile.label,
        summary: semanticProfile.summary,
        coreIdentity: semanticProfile.coreIdentity,
        modifierSignature: clonePathModifierSignature(path),
        prepBias: [...semanticProfile.prepBias],
        forgeBias: [...semanticProfile.forgeBias],
        buildBias: [...semanticProfile.buildBias],
        recommendedAiByPhase: {
            early: [...semanticProfile.recommendedAiByPhase.early],
            boss: [...semanticProfile.recommendedAiByPhase.boss],
        },
        commonFailureModes: [...semanticProfile.commonFailureModes],
    });
}
export const PATH_DOCTRINE_ORDER = Object.freeze([
    'heaven',
    'earth',
    'martial',
]);
export const PATH_DOCTRINE_REGISTRY = Object.freeze(PATH_DOCTRINE_ORDER.map((path) => buildPathDoctrineProfile(path)));
export const PATH_DOCTRINE_REGISTRY_BY_ID = Object.freeze(Object.fromEntries(PATH_DOCTRINE_REGISTRY.map((profile) => [profile.id, profile])));
export function getAllPathDoctrineProfiles() {
    return [...PATH_DOCTRINE_REGISTRY];
}
export function getPathDoctrineProfile(path) {
    if (path === null) {
        return null;
    }
    return PATH_DOCTRINE_REGISTRY_BY_ID[path];
}
export function getPathDoctrineSummary(path) {
    if (path === null) {
        return 'No path selected.';
    }
    return getPathDoctrineProfile(path)?.summary ?? 'No path selected.';
}
