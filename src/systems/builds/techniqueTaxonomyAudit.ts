import type { TechniqueDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import {
  RECOGNIZED_PRIMARY_EFFECT_TYPES,
  RECOGNIZED_SECONDARY_EFFECT_TYPES,
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  buildTechniqueSignalSummary,
} from './techniqueFamilies.js';
import type { PathAlignmentStrength } from './pathAlignment.js';
import { buildTechniqueTaxonomyFromDefinitions } from './techniqueTaxonomy.js';
import { TECHNIQUE_TAXONOMY_OVERRIDES } from './techniqueTaxonomyOverrides.js';

export interface TechniqueTaxonomyAuditReport {
  totalTechniques: number;
  techniquesMissingFamilies: string[];
  unknownPrimaryEffectTypes: string[];
  unknownSecondaryEffectTypes: string[];
  overriddenTechniques: string[];
  familyCoverage: Record<TechniqueFamily, number>;
  supportFlagCoverage: Record<TechniqueSupportFlag, number>;
  alignmentCoverage: Record<PathAlignmentStrength, number>;
}

function makeZeroedFamilyCoverage(): Record<TechniqueFamily, number> {
  return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0])) as Record<TechniqueFamily, number>;
}

function makeZeroedSupportFlagCoverage(): Record<TechniqueSupportFlag, number> {
  return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0])) as Record<TechniqueSupportFlag, number>;
}

function makeZeroedAlignmentCoverage(): Record<PathAlignmentStrength, number> {
  return { strong: 0, neutral: 0, off: 0 };
}

export function auditTechniqueTaxonomyFromDefinitions(
  defs: readonly TechniqueDef[],
): TechniqueTaxonomyAuditReport {
  const catalog = buildTechniqueTaxonomyFromDefinitions(defs);
  const unknownPrimary = new Set<string>();
  const unknownSecondary = new Set<string>();
  const techniquesMissingFamilies: string[] = [];
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

export function auditTechniqueTaxonomy(): TechniqueTaxonomyAuditReport {
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
