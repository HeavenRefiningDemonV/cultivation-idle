import type { CultivationPath } from '../../types/index.js';
import {
  getPathAlignmentStrengthForTechnique,
  getTechniqueTaxonomyProfile,
  type TechniqueTaxonomyProfile,
} from './techniqueTaxonomy.js';
import type { PathAlignmentStrength } from './pathAlignment.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';

const FAMILY_LABELS: Readonly<Record<TechniqueFamily, string>> = Object.freeze({
  coreDamage: 'Core Damage',
  aoe: 'Area Damage',
  execute: 'Execute',
  guard: 'Guard',
  heal: 'Heal',
  buff: 'Buff',
  setup: 'Setup',
  control: 'Control',
  mobility: 'Mobility',
  cleanse: 'Cleanse',
  farm: 'Farm',
});

const SUPPORT_FLAG_LABELS: Readonly<Record<TechniqueSupportFlag, string>> = Object.freeze({
  survival: 'Survival',
  tempo: 'Tempo',
  boss: 'Boss',
  farm: 'Farm',
});

const ALIGNMENT_LABELS: Readonly<Record<PathAlignmentStrength, string>> = Object.freeze({
  strong: 'Path-Aligned',
  neutral: 'Flex Support',
  off: 'Off-Path',
});

export interface TechniqueTaxonomyPresentation {
  familyLabels: string[];
  supportFlagLabels: string[];
  selectedPathFit: PathAlignmentStrength;
  selectedPathFitLabel: string;
}

export function getTechniqueFamilyLabel(family: TechniqueFamily): string {
  return FAMILY_LABELS[family];
}

export function getTechniqueSupportFlagLabel(flag: TechniqueSupportFlag): string {
  return SUPPORT_FLAG_LABELS[flag];
}

export function getPathAlignmentStrengthLabel(strength: PathAlignmentStrength): string {
  return ALIGNMENT_LABELS[strength];
}

export function buildTechniqueTaxonomyPresentation(input: {
  profile: Pick<TechniqueTaxonomyProfile, 'techId' | 'families' | 'supportFlags'>;
  selectedPath: CultivationPath | null;
}): TechniqueTaxonomyPresentation {
  const selectedPathFit = getPathAlignmentStrengthForTechnique(input.profile.techId, input.selectedPath);
  return {
    familyLabels: input.profile.families.map((family) => getTechniqueFamilyLabel(family)),
    supportFlagLabels: input.profile.supportFlags.map((flag) => getTechniqueSupportFlagLabel(flag)),
    selectedPathFit,
    selectedPathFitLabel: getPathAlignmentStrengthLabel(selectedPathFit),
  };
}

export function getTechniqueTaxonomyPresentationForTechnique(
  techId: string,
  selectedPath: CultivationPath | null,
): TechniqueTaxonomyPresentation | null {
  const profile = getTechniqueTaxonomyProfile(techId);
  if (!profile) {
    return null;
  }

  return buildTechniqueTaxonomyPresentation({ profile, selectedPath });
}
