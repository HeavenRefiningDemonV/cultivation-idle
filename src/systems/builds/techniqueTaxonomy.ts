import type { TechniqueDef } from '../../content/index.js';
import type { CultivationPath } from '../../types/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import {
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  buildTechniqueFamilyDerivation,
} from './techniqueFamilies.js';
import type { NativePathAlignmentStrength, PathAlignmentStrength } from './pathAlignment.js';
import { getNativePathAlignment, resolveTechniquePathAlignment } from './pathAlignment.js';
import { getTechniqueTaxonomyOverride } from './techniqueTaxonomyOverrides.js';

export interface TechniqueTaxonomyProfile {
  techId: string;
  path: CultivationPath;
  type: string;
  families: TechniqueFamily[];
  nativeAlignment?: NativePathAlignmentStrength;
  /** @deprecated Use nativeAlignment for intrinsic alignment semantics. */
  alignment: PathAlignmentStrength;
  supportFlags: TechniqueSupportFlag[];
  derivedFrom: string[];
}

function sortFamilies(values: readonly TechniqueFamily[]): TechniqueFamily[] {
  const set = new Set(values);
  return TECHNIQUE_FAMILY_ORDER.filter((family) => set.has(family));
}

function sortSupportFlags(values: readonly TechniqueSupportFlag[]): TechniqueSupportFlag[] {
  const set = new Set(values);
  return TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => set.has(flag));
}

function freezeProfile(profile: TechniqueTaxonomyProfile): TechniqueTaxonomyProfile {
  Object.freeze(profile.families);
  Object.freeze(profile.supportFlags);
  Object.freeze(profile.derivedFrom);
  return Object.freeze(profile);
}

export function buildTechniqueTaxonomyProfile(def: TechniqueDef): TechniqueTaxonomyProfile {
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
  const nativeAlignment = override?.nativeAlignment ?? getNativePathAlignment(def.path, families);
  const derivedFrom = Array.from(new Set([
    ...derivation.derivedFrom,
    ...(override?.addDerivedFrom ?? []),
  ])).sort((a, b) => a.localeCompare(b));

  return freezeProfile({
    techId: def.id,
    path: def.path,
    type: def.type,
    families,
    nativeAlignment,
    alignment: nativeAlignment,
    supportFlags,
    derivedFrom,
  });
}

export function buildTechniqueTaxonomyFromDefinitions(
  defs: readonly TechniqueDef[],
): Record<string, TechniqueTaxonomyProfile> {
  const entries = defs.map((def) => [def.id, buildTechniqueTaxonomyProfile(def)] as const);
  return Object.freeze(Object.fromEntries(entries));
}

export function buildTechniqueTaxonomy(): Record<string, TechniqueTaxonomyProfile> {
  const defs = useContentStore.getState().raw?.techniques;
  if (!Array.isArray(defs)) {
    return {};
  }

  return buildTechniqueTaxonomyFromDefinitions(defs);
}

export function getTechniqueTaxonomyProfile(techId: string | null): TechniqueTaxonomyProfile | null {
  if (techId === null) {
    return null;
  }

  const catalog = buildTechniqueTaxonomy();
  return catalog[techId] ?? null;
}

export function getTechniqueFamilies(techId: string): TechniqueFamily[] {
  return [...(getTechniqueTaxonomyProfile(techId)?.families ?? [])];
}

export function getTechniqueSupportFlags(techId: string): TechniqueSupportFlag[] {
  return [...(getTechniqueTaxonomyProfile(techId)?.supportFlags ?? [])];
}

export function getPathAlignmentStrengthForTechnique(
  techId: string,
  path: CultivationPath | null,
): PathAlignmentStrength {
  const profile = getTechniqueTaxonomyProfile(techId);
  if (profile === null) {
    return 'off';
  }

  const resolved = resolveTechniquePathAlignment({
    techPath: profile.path,
    families: profile.families,
    nativeAlignment: profile.nativeAlignment ?? (profile.alignment === 'off' ? 'neutral' : profile.alignment),
    selectedPath: path,
  });
  return resolved.fit;
}

export function getPathAlignmentScoreForTechnique(
  techId: string,
  path: CultivationPath | null,
): 0 | 1 | 2 {
  const profile = getTechniqueTaxonomyProfile(techId);
  if (profile === null) {
    return 0;
  }

  return resolveTechniquePathAlignment({
    techPath: profile.path,
    families: profile.families,
    nativeAlignment: profile.nativeAlignment ?? (profile.alignment === 'off' ? 'neutral' : profile.alignment),
    selectedPath: path,
  }).score;
}
