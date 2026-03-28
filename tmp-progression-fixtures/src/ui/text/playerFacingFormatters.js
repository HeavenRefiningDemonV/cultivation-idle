import { getDiagnosisLabel, getReadinessBandLabel, getWorldModuleLabel } from './playerFacingLabels.js';
import { useContentStore } from '../../stores/contentStore.js';
const PATH_LABELS = {
    heaven: 'Heaven Path',
    earth: 'Earth Path',
    martial: 'Martial Path',
};
const FALLBACK_CITY_LABEL = 'Unknown City';
const FALLBACK_TRIAL_LABEL = 'Gate Trial';
const titleCase = (value) => value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
export function formatPathLabel(pathId) {
    if (!pathId)
        return 'Path not selected';
    return PATH_LABELS[pathId] ?? titleCase(pathId);
}
export function formatCityLabel(cityId) {
    if (!cityId)
        return FALLBACK_CITY_LABEL;
    const city = useContentStore.getState().maps.citiesById[cityId];
    return city?.name ?? titleCase(cityId.replace(/^city_/, ''));
}
export function formatGateTrialLabel(trialId) {
    if (!trialId)
        return FALLBACK_TRIAL_LABEL;
    const trial = useContentStore.getState().maps.trialsById[trialId];
    return trial?.name ?? trial?.title ?? `${FALLBACK_TRIAL_LABEL} ${titleCase(trialId.replace(/^trial_/, ''))}`;
}
export function formatReadinessBandLabel(band) {
    if (!band)
        return 'Readiness pending';
    try {
        return getReadinessBandLabel(band);
    }
    catch {
        return titleCase(band);
    }
}
export function formatDiagnosisLabel(code) {
    if (!code)
        return 'No active diagnosis';
    try {
        return getDiagnosisLabel(code);
    }
    catch {
        return titleCase(code);
    }
}
export function formatWorldModuleLabel(moduleKey) {
    if (!moduleKey)
        return 'World Module';
    return getWorldModuleLabel(moduleKey);
}
export function formatArchetypeLabel(archetypeId) {
    if (!archetypeId)
        return 'Build posture pending';
    return titleCase(archetypeId);
}
export function formatHeartLawLabel(heartLawId) {
    if (!heartLawId)
        return 'Heart Law not selected';
    const heartLaw = useContentStore.getState().maps.heartLawsById[heartLawId];
    return heartLaw?.name ?? titleCase(heartLawId.replace(/^heart_law_/, ''));
}
