import { buildSpiritRootDoctrineProfile } from './spiritRootDoctrine.js';
function resolvePurityBand(purity) {
    if (purity >= 95) {
        return 'immaculate';
    }
    if (purity >= 75) {
        return 'refined';
    }
    if (purity >= 40) {
        return 'stable';
    }
    return 'muddy';
}
function resolvePowerBand(totalMultiplier) {
    if (totalMultiplier >= 4) {
        return 'transcendent';
    }
    if (totalMultiplier >= 2.5) {
        return 'elite';
    }
    if (totalMultiplier >= 1.5) {
        return 'elevated';
    }
    return 'baseline';
}
export function adaptSpiritRootDoctrineToSemanticView(root) {
    const profile = buildSpiritRootDoctrineProfile(root);
    if (profile === null) {
        return null;
    }
    return Object.freeze({
        element: profile.element,
        grade: profile.grade,
        purity: profile.purity,
        purityBand: resolvePurityBand(profile.purity),
        qualityMultiplier: profile.qualityMultiplier,
        purityMultiplier: profile.purityMultiplier,
        totalMultiplier: profile.totalMultiplier,
        powerBand: resolvePowerBand(profile.totalMultiplier),
    });
}
