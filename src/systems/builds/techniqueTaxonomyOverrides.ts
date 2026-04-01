import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import type { NativePathAlignmentStrength } from './pathAlignment.js';

export interface TechniqueTaxonomyOverride {
  addFamilies?: readonly TechniqueFamily[];
  removeFamilies?: readonly TechniqueFamily[];
  addSupportFlags?: readonly TechniqueSupportFlag[];
  removeSupportFlags?: readonly TechniqueSupportFlag[];
  nativeAlignment?: NativePathAlignmentStrength;
  addDerivedFrom?: readonly string[];
}

export const TECHNIQUE_TAXONOMY_OVERRIDES: Readonly<Record<string, TechniqueTaxonomyOverride>> = Object.freeze({
  tech_heaven_heavenly_cataclysm: Object.freeze({
    addFamilies: Object.freeze(['aoe'] as const),
    addSupportFlags: Object.freeze(['farm'] as const),
    addDerivedFrom: Object.freeze(['override:family:aoe', 'override:support:farm'] as const),
  }),
  tech_martial_ninefold_sword_rain: Object.freeze({
    addFamilies: Object.freeze(['aoe'] as const),
    addSupportFlags: Object.freeze(['farm'] as const),
    addDerivedFrom: Object.freeze(['override:family:aoe', 'override:support:farm'] as const),
  }),
  tech_heaven_astral_focus: Object.freeze({
    nativeAlignment: 'neutral',
    addDerivedFrom: Object.freeze(['override:alignment:neutral'] as const),
  }),
  tech_earth_forge_bone: Object.freeze({
    nativeAlignment: 'neutral',
    addDerivedFrom: Object.freeze(['override:alignment:neutral'] as const),
  }),
  tech_martial_weapon_forged_will: Object.freeze({
    nativeAlignment: 'neutral',
    addDerivedFrom: Object.freeze(['override:alignment:neutral'] as const),
  }),
  tech_martial_executioner_mark: Object.freeze({
    nativeAlignment: 'neutral',
    addDerivedFrom: Object.freeze(['override:alignment:neutral'] as const),
  }),
});

export function getTechniqueTaxonomyOverride(techId: string): TechniqueTaxonomyOverride | null {
  return TECHNIQUE_TAXONOMY_OVERRIDES[techId] ?? null;
}
