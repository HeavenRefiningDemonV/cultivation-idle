import type { TechniqueDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import {
  RECOGNIZED_PRIMARY_EFFECT_TYPES,
  RECOGNIZED_SECONDARY_EFFECT_TYPES,
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  buildTechniqueFamilyDerivation,
  buildTechniqueSignalSummary,
} from './techniqueFamilies.js';
import { getNativePathAlignment, type NativePathAlignmentStrength } from './pathAlignment.js';
import { buildTechniqueTaxonomyFromDefinitions } from './techniqueTaxonomy.js';
import { TECHNIQUE_TAXONOMY_OVERRIDES, type TechniqueTaxonomyOverride } from './techniqueTaxonomyOverrides.js';

export interface TechniqueTaxonomyAuditReport {
  totalTechniques: number;
  techniquesMissingFamilies: string[];
  techniquesMissingNativeAlignment: string[];
  unknownPrimaryEffectTypes: string[];
  unknownSecondaryEffectTypes: string[];
  overriddenTechniques: string[];
  deadOverrides: string[];
  familyCoverage: Record<TechniqueFamily, number>;
  supportFlagCoverage: Record<TechniqueSupportFlag, number>;
  nativeAlignmentCoverage: Record<NativePathAlignmentStrength, number>;
  /** @deprecated Use nativeAlignmentCoverage. */
  alignmentCoverage: Record<NativePathAlignmentStrength, number>;
}

function makeZeroedFamilyCoverage(): Record<TechniqueFamily, number> {
  return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0])) as Record<TechniqueFamily, number>;
}

function makeZeroedSupportFlagCoverage(): Record<TechniqueSupportFlag, number> {
  return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0])) as Record<TechniqueSupportFlag, number>;
}

function makeZeroedNativeAlignmentCoverage(): Record<NativePathAlignmentStrength, number> {
  return { strong: 0, neutral: 0 };
}

function detectDeadOverrides(
  defs: readonly TechniqueDef[],
  overrides: Readonly<Record<string, TechniqueTaxonomyOverride>>,
): string[] {
  const liveIds = new Set(defs.map((def) => def.id));
  const dead: string[] = [];

  Object.entries(overrides).forEach(([techId, override]) => {
    if (!liveIds.has(techId)) {
      dead.push(`${techId}:non_live`);
      return;
    }

    const def = defs.find((entry) => entry.id === techId);
    if (!def) {
      dead.push(`${techId}:non_live`);
      return;
    }
    const derivation = buildTechniqueFamilyDerivation(def);
    const baselineFamilies = TECHNIQUE_FAMILY_ORDER.filter((family) => derivation.families.includes(family));
    const baselineSupportFlags = TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => derivation.supportFlags.includes(flag));
    const baselineNativeAlignment = getNativePathAlignment(def.path, baselineFamilies);
    const baselineDerivedFrom = Array.from(new Set(derivation.derivedFrom)).sort((a, b) => a.localeCompare(b));

    const appliedFamilies = TECHNIQUE_FAMILY_ORDER.filter((family) =>
      (
        derivation.families.filter((entry) => !(override.removeFamilies ?? []).includes(entry))
      ).concat(override.addFamilies ?? []).includes(family),
    );
    const appliedSupportFlags = TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) =>
      (
        derivation.supportFlags.filter((entry) => !(override.removeSupportFlags ?? []).includes(entry))
      ).concat(override.addSupportFlags ?? []).includes(flag),
    );
    const appliedNativeAlignment = override.nativeAlignment ?? baselineNativeAlignment;
    const appliedDerivedFrom = Array.from(
      new Set([...derivation.derivedFrom, ...(override.addDerivedFrom ?? [])]),
    ).sort((a, b) => a.localeCompare(b));
    const changed =
      JSON.stringify(appliedFamilies) !== JSON.stringify(baselineFamilies)
      || JSON.stringify(appliedSupportFlags) !== JSON.stringify(baselineSupportFlags)
      || appliedNativeAlignment !== baselineNativeAlignment
      || JSON.stringify(appliedDerivedFrom) !== JSON.stringify(baselineDerivedFrom);
    if (!changed) {
      dead.push(`${techId}:no_effect`);
    }
  });

  return dead.sort((a, b) => a.localeCompare(b));
}

export function auditTechniqueTaxonomyFromDefinitions(
  defs: readonly TechniqueDef[],
  overrides: Readonly<Record<string, TechniqueTaxonomyOverride>> = TECHNIQUE_TAXONOMY_OVERRIDES,
): TechniqueTaxonomyAuditReport {
  const catalog = buildTechniqueTaxonomyFromDefinitions(defs);
  const unknownPrimary = new Set<string>();
  const unknownSecondary = new Set<string>();
  const techniquesMissingFamilies: string[] = [];
  const familyCoverage = makeZeroedFamilyCoverage();
  const supportFlagCoverage = makeZeroedSupportFlagCoverage();
  const nativeAlignmentCoverage = makeZeroedNativeAlignmentCoverage();
  const techniquesMissingNativeAlignment: string[] = [];
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
    const nativeAlignment = profile.nativeAlignment ?? (profile.alignment === 'off' ? null : profile.alignment);
    if (nativeAlignment !== 'strong' && nativeAlignment !== 'neutral') {
      techniquesMissingNativeAlignment.push(def.id);
      return;
    }
    nativeAlignmentCoverage[nativeAlignment] += 1;
  });

  return {
    totalTechniques: defs.length,
    techniquesMissingFamilies: [...techniquesMissingFamilies].sort((a, b) => a.localeCompare(b)),
    techniquesMissingNativeAlignment: [...techniquesMissingNativeAlignment].sort((a, b) => a.localeCompare(b)),
    unknownPrimaryEffectTypes: Array.from(unknownPrimary).sort((a, b) => a.localeCompare(b)),
    unknownSecondaryEffectTypes: Array.from(unknownSecondary).sort((a, b) => a.localeCompare(b)),
    overriddenTechniques: Object.keys(overrides).sort((a, b) => a.localeCompare(b)),
    deadOverrides: detectDeadOverrides(defs, overrides),
    familyCoverage,
    supportFlagCoverage,
    nativeAlignmentCoverage,
    alignmentCoverage: nativeAlignmentCoverage,
  };
}

export function auditTechniqueTaxonomy(): TechniqueTaxonomyAuditReport {
  const defs = useContentStore.getState().raw?.techniques;
  if (!Array.isArray(defs)) {
    return {
      totalTechniques: 0,
      techniquesMissingFamilies: [],
      techniquesMissingNativeAlignment: [],
      unknownPrimaryEffectTypes: [],
      unknownSecondaryEffectTypes: [],
      overriddenTechniques: [],
      deadOverrides: [],
      familyCoverage: makeZeroedFamilyCoverage(),
      supportFlagCoverage: makeZeroedSupportFlagCoverage(),
      nativeAlignmentCoverage: makeZeroedNativeAlignmentCoverage(),
      alignmentCoverage: makeZeroedNativeAlignmentCoverage(),
    };
  }

  return auditTechniqueTaxonomyFromDefinitions(defs);
}
