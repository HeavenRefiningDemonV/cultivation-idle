import { getPathDoctrineProfile } from './pathDoctrineRegistry.js';
function freezePathDoctrineSemanticView(profile) {
    const semanticView = {
        id: profile.id,
        label: profile.label,
        summary: profile.summary,
        coreIdentity: profile.coreIdentity,
        prepBias: Object.freeze([...profile.prepBias]),
        forgeBias: Object.freeze([...profile.forgeBias]),
        buildBias: Object.freeze([...profile.buildBias]),
        recommendedAiByPhase: Object.freeze({
            early: Object.freeze([...profile.recommendedAiByPhase.early]),
            boss: Object.freeze([...profile.recommendedAiByPhase.boss]),
        }),
        commonFailureModes: Object.freeze([...profile.commonFailureModes]),
    };
    return Object.freeze(semanticView);
}
export function adaptPathDoctrineToSemanticView(path) {
    const profile = getPathDoctrineProfile(path);
    if (profile === null) {
        return null;
    }
    return freezePathDoctrineSemanticView(profile);
}
