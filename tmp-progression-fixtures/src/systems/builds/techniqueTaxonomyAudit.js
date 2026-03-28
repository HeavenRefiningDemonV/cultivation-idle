import { useContentStore } from '../../stores/contentStore.js';
import { RECOGNIZED_PRIMARY_EFFECT_TYPES, RECOGNIZED_SECONDARY_EFFECT_TYPES, TECHNIQUE_FAMILY_ORDER, TECHNIQUE_SUPPORT_FLAG_ORDER, buildTechniqueSignalSummary, } from './techniqueFamilies.js';
import { buildTechniqueTaxonomyFromDefinitions } from './techniqueTaxonomy.js';
import { TECHNIQUE_TAXONOMY_OVERRIDES } from './techniqueTaxonomyOverrides.js';
function makeZeroedFamilyCoverage() {
    return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0]));
}
function makeZeroedSupportFlagCoverage() {
    return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0]));
}
function makeZeroedAlignmentCoverage() {
    return { strong: 0, neutral: 0, off: 0 };
}
export function auditTechniqueTaxonomyFromDefinitions(defs) {
    const catalog = buildTechniqueTaxonomyFromDefinitions(defs);
    const unknownPrimary = new Set();
    const unknownSecondary = new Set();
    const techniquesMissingFamilies = [];
    const familyCoverage = makeZeroedFamilyCoverage();
    const supportFlagCoverage = makeZeroedSupportFlagCoverage();
    const alignmentCoverage = makeZeroedAlignmentCoverage();
    const knownPrimary = new Set(RECOGNIZED_PRIMARY_EFFECT_TYPES);
    const knownSecondary = new Set(RECOGNIZED_SECONDARY_EFFECT_TYPES);
    defs.forEach((def) => {
        const summary = buildTechniqueSignalSummary(def);
        summary.primaryEffectTypes.forEach((type) => {
            if (!knownPrimary.has(type)) {
                unknownPrimary.add(type);
            }
        });
        summary.secondaryEffectTypes.forEach((type) => {
            if (!knownSecondary.has(type)) {
                unknownSecondary.add(type);
            }
        });
        const profile = catalog[def.id];
        if (!profile || profile.families.length === 0) {
            techniquesMissingFamilies.push(def.id);
            return;
        }
        profile.families.forEach((family) => {
            familyCoverage[family] += 1;
        });
        profile.supportFlags.forEach((flag) => {
            supportFlagCoverage[flag] += 1;
        });
        alignmentCoverage[profile.alignment] += 1;
    });
    return {
        totalTechniques: defs.length,
        techniquesMissingFamilies: [...techniquesMissingFamilies].sort((a, b) => a.localeCompare(b)),
        unknownPrimaryEffectTypes: Array.from(unknownPrimary).sort((a, b) => a.localeCompare(b)),
        unknownSecondaryEffectTypes: Array.from(unknownSecondary).sort((a, b) => a.localeCompare(b)),
        overriddenTechniques: Object.keys(TECHNIQUE_TAXONOMY_OVERRIDES).sort((a, b) => a.localeCompare(b)),
        familyCoverage,
        supportFlagCoverage,
        alignmentCoverage,
    };
}
export function auditTechniqueTaxonomy() {
    const defs = useContentStore.getState().raw?.techniques;
    if (!Array.isArray(defs)) {
        return {
            totalTechniques: 0,
            techniquesMissingFamilies: [],
            unknownPrimaryEffectTypes: [],
            unknownSecondaryEffectTypes: [],
            overriddenTechniques: [],
            familyCoverage: makeZeroedFamilyCoverage(),
            supportFlagCoverage: makeZeroedSupportFlagCoverage(),
            alignmentCoverage: makeZeroedAlignmentCoverage(),
        };
    }
    return auditTechniqueTaxonomyFromDefinitions(defs);
}
