export const LIVE_FORGE_SURFACE_TABS = [
    { id: 'refine', label: 'Refine' },
    { id: 'temper', label: 'Temper' },
    { id: 'runes', label: 'Runes' },
];
const MODE_TO_JOB = {
    idle: 'IDLE',
    assisted: 'ASSISTED',
    handsOn: 'HANDS_ON',
};
const JOB_TO_MODE = {
    IDLE: 'idle',
    ASSISTED: 'assisted',
    HANDS_ON: 'handsOn',
};
export function getForgeSurfaceTabForBlueprint(blueprint) {
    if (blueprint.type === 'service' && blueprint.service === 'refine')
        return 'refine';
    if (blueprint.type === 'service' && blueprint.service === 'temper')
        return 'temper';
    return 'runes';
}
export function getAllowedForgeModes(blueprint) {
    if (blueprint.type === 'service' && blueprint.service === 'refine') {
        return ['idle', 'assisted'];
    }
    if (blueprint.type === 'service' && blueprint.service === 'temper') {
        return (blueprint.stepScript?.length ?? 0) > 0 || blueprint.handsOnBonus
            ? ['idle', 'assisted', 'handsOn']
            : ['idle', 'assisted'];
    }
    if (blueprint.type === 'craft' && blueprint.output?.itemId?.startsWith('rune_')) {
        return ['idle', 'assisted', 'handsOn'];
    }
    return ['idle'];
}
export function isForgeModeAllowed(blueprint, mode) {
    return getAllowedForgeModes(blueprint).includes(mode);
}
export function getDefaultForgeMode(blueprint) {
    return getAllowedForgeModes(blueprint)[0] ?? 'idle';
}
export function toForgeJobMode(mode) {
    return MODE_TO_JOB[mode];
}
export function fromForgeJobMode(mode) {
    return JOB_TO_MODE[mode];
}
