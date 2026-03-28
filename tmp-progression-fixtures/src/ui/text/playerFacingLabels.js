import { isLiveWorldModule } from '../../systems/world/liveWorldSchema.js';
import { LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS } from '../../systems/world/liveWorldLeakAudit.js';
export const SHELL_TAB_LABELS = {
    cultivation: 'Cultivation',
    status: 'Status',
    adventure: 'World',
    inventory: 'Inventory',
    techniques: 'Techniques',
    prestige: 'Prestige',
    settings: 'Settings',
};
export const WORLD_MODULE_LABELS = {
    outskirts: 'Outskirts',
    gateTrial: 'Gate Trial',
    ruins: 'Ruins',
    apothecary: 'Apothecary',
    manualPavilion: 'Manual Pavilion',
    forge: 'Forge',
    bounties: 'Bounties',
    expeditions: 'Expeditions',
};
export const READINESS_LABELS = {
    below_minimum: 'Blocked',
    minimum_met_below_recommended: 'Preparing',
    recommended_met: 'Ready',
    risky: 'Risky',
    close: 'Close',
    cap_reached: 'Cap Reached',
};
export const DIAGNOSIS_LABELS = {
    undercultivated: 'Undercultivated',
    underforged: 'Underforged',
    underprepared: 'Underprepared',
    underbuilt: 'Underbuilt',
    close: 'Close',
    bypassAvailable: 'Bypass Available',
};
export const PRESTIGE_RECOMMENDATION_LABELS = {
    tooEarly: 'Too Early',
    viable: 'Viable',
    recommended: 'Recommended',
};
export const GATE_SUPPORT_LABELS = {
    support: 'Safety Net',
    eligibleDefeats: 'Eligible Defeats',
};
function toTitleCase(key) {
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
export function getShellTabLabel(tab) {
    return SHELL_TAB_LABELS[tab];
}
export function getWorldModuleLabel(moduleKey) {
    return isLiveWorldModule(moduleKey) ? WORLD_MODULE_LABELS[moduleKey] : toTitleCase(moduleKey);
}
export function getOpenWorldModuleLabel(moduleKey) {
    return `Open ${getWorldModuleLabel(moduleKey)}`;
}
export function getReadinessBandLabel(band) {
    return READINESS_LABELS[band];
}
export function getReadinessMilestoneLabel(kind) {
    return READINESS_LABELS[kind];
}
export function getDiagnosisLabel(code) {
    return DIAGNOSIS_LABELS[code];
}
export function getPrestigeRecommendationLabel(recommendation) {
    return PRESTIGE_RECOMMENDATION_LABELS[recommendation];
}
export function getPrestigeRecommendationForAvailability(isAvailable) {
    return isAvailable ? PRESTIGE_RECOMMENDATION_LABELS.viable : PRESTIGE_RECOMMENDATION_LABELS.tooEarly;
}
export function sanitizeLiveCityName(text) {
    return Object.entries(LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS).reduce((current, [legacyName, replacement]) => current.replace(new RegExp(`\\b${legacyName}\\b`, 'g'), replacement), text);
}
