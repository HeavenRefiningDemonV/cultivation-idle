export const STRONG_PATH_FAMILY_BIASES = Object.freeze({
    heaven: Object.freeze(['coreDamage', 'execute', 'setup', 'control', 'buff']),
    earth: Object.freeze(['guard', 'heal', 'setup', 'control', 'execute', 'buff']),
    martial: Object.freeze(['coreDamage', 'execute', 'setup', 'buff', 'mobility']),
});
export const CROSS_PATH_SUPPORT_FAMILIES = Object.freeze([
    'guard',
    'heal',
    'buff',
    'setup',
    'control',
    'mobility',
    'cleanse',
    'farm',
]);
export const CROSS_PATH_OFFENSIVE_FAMILIES = Object.freeze([
    'coreDamage',
    'aoe',
    'execute',
]);
function intersects(families, candidates) {
    const candidateSet = new Set(candidates);
    return families.some((family) => candidateSet.has(family));
}
export function getNativePathAlignment(path, families) {
    return intersects(families, STRONG_PATH_FAMILY_BIASES[path]) ? 'strong' : 'neutral';
}
export function getTechniquePathFit(input) {
    if (input.selectedPath === null) {
        return 'off';
    }
    if (input.selectedPath === input.techPath) {
        return input.nativeAlignment;
    }
    if (intersects(input.families, CROSS_PATH_OFFENSIVE_FAMILIES)) {
        return 'off';
    }
    if (intersects(input.families, CROSS_PATH_SUPPORT_FAMILIES)) {
        return 'neutral';
    }
    return 'off';
}
export function scoreTechniqueForPath(input) {
    const strength = getTechniquePathFit(input);
    if (strength === 'strong') {
        return 2;
    }
    if (strength === 'neutral') {
        return 1;
    }
    return 0;
}
