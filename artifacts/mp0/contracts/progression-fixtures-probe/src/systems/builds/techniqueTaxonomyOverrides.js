export const TECHNIQUE_TAXONOMY_OVERRIDES = Object.freeze({
    tech_heaven_heavenly_cataclysm: Object.freeze({
        addFamilies: Object.freeze(['aoe']),
        addSupportFlags: Object.freeze(['farm']),
        addDerivedFrom: Object.freeze(['override:family:aoe', 'override:support:farm']),
    }),
    tech_martial_ninefold_sword_rain: Object.freeze({
        addFamilies: Object.freeze(['aoe']),
        addSupportFlags: Object.freeze(['farm']),
        addDerivedFrom: Object.freeze(['override:family:aoe', 'override:support:farm']),
    }),
    tech_heaven_astral_focus: Object.freeze({
        nativeAlignment: 'neutral',
        addDerivedFrom: Object.freeze(['override:alignment:neutral']),
    }),
    tech_earth_forge_bone: Object.freeze({
        nativeAlignment: 'neutral',
        addDerivedFrom: Object.freeze(['override:alignment:neutral']),
    }),
    tech_martial_weapon_forged_will: Object.freeze({
        nativeAlignment: 'neutral',
        addDerivedFrom: Object.freeze(['override:alignment:neutral']),
    }),
    tech_martial_executioner_mark: Object.freeze({
        nativeAlignment: 'neutral',
        addDerivedFrom: Object.freeze(['override:alignment:neutral']),
    }),
});
export function getTechniqueTaxonomyOverride(techId) {
    return TECHNIQUE_TAXONOMY_OVERRIDES[techId] ?? null;
}
