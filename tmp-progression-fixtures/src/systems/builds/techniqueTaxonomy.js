import { useContentStore } from '../../stores/contentStore.js';
import { TECHNIQUE_FAMILY_ORDER, TECHNIQUE_SUPPORT_FLAG_ORDER, buildTechniqueFamilyDerivation, } from './techniqueFamilies.js';
import { getNativePathAlignment, getTechniquePathFit, scoreTechniqueForPath } from './pathAlignment.js';
import { getTechniqueTaxonomyOverride } from './techniqueTaxonomyOverrides.js';
function sortFamilies(values) {
    const set = new Set(values);
    return TECHNIQUE_FAMILY_ORDER.filter((family) => set.has(family));
}
function sortSupportFlags(values) {
    const set = new Set(values);
    return TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => set.has(flag));
}
function freezeProfile(profile) {
    Object.freeze(profile.families);
    Object.freeze(profile.supportFlags);
    Object.freeze(profile.derivedFrom);
    return Object.freeze(profile);
}
export function buildTechniqueTaxonomyProfile(def) {
    const derivation = buildTechniqueFamilyDerivation(def);
    const override = getTechniqueTaxonomyOverride(def.id);
    const families = sortFamilies([
        ...derivation.families.filter((family) => !(override?.removeFamilies ?? []).includes(family)),
        ...(override?.addFamilies ?? []),
    ]);
    const supportFlags = sortSupportFlags([
        ...derivation.supportFlags.filter((flag) => !(override?.removeSupportFlags ?? []).includes(flag)),
        ...(override?.addSupportFlags ?? []),
    ]);
    const alignment = override?.nativeAlignment ?? getNativePathAlignment(def.path, families);
    const derivedFrom = Array.from(new Set([
        ...derivation.derivedFrom,
        ...(override?.addDerivedFrom ?? []),
    ])).sort((a, b) => a.localeCompare(b));
    return freezeProfile({
        techId: def.id,
        path: def.path,
        type: def.type,
        families,
        alignment,
        supportFlags,
        derivedFrom,
    });
}
export function buildTechniqueTaxonomyFromDefinitions(defs) {
    const entries = defs.map((def) => [def.id, buildTechniqueTaxonomyProfile(def)]);
    return Object.freeze(Object.fromEntries(entries));
}
export function buildTechniqueTaxonomy() {
    const defs = useContentStore.getState().raw?.techniques;
    if (!Array.isArray(defs)) {
        return {};
    }
    return buildTechniqueTaxonomyFromDefinitions(defs);
}
export function getTechniqueTaxonomyProfile(techId) {
    if (techId === null) {
        return null;
    }
    const catalog = buildTechniqueTaxonomy();
    return catalog[techId] ?? null;
}
export function getTechniqueFamilies(techId) {
    return [...(getTechniqueTaxonomyProfile(techId)?.families ?? [])];
}
export function getTechniqueSupportFlags(techId) {
    return [...(getTechniqueTaxonomyProfile(techId)?.supportFlags ?? [])];
}
export function getPathAlignmentStrengthForTechnique(techId, path) {
    const profile = getTechniqueTaxonomyProfile(techId);
    if (profile === null) {
        return 'off';
    }
    return getTechniquePathFit({
        techPath: profile.path,
        families: profile.families,
        nativeAlignment: profile.alignment,
        selectedPath: path,
    });
}
export function getPathAlignmentScoreForTechnique(techId, path) {
    const profile = getTechniqueTaxonomyProfile(techId);
    if (profile === null) {
        return 0;
    }
    return scoreTechniqueForPath({
        techPath: profile.path,
        families: profile.families,
        nativeAlignment: profile.alignment,
        selectedPath: path,
    });
}
