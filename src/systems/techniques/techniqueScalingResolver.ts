import type { TechniqueDef } from '../../content/types.js';
import type { SpiritRootElement } from '../../types/index.js';
import type { TrainingReadOnlySnapshot } from '../training/trainingReadOnlySnapshot.js';

export type TechniqueScalingRole = 'offense' | 'defense' | 'utility' | 'control' | 'support' | 'ultimate';

export interface TechniqueScalingRoleCaps {
  primaryCoef: number;
  secondaryCoef: number;
  rootCoef: number;
  heartLawCoef: number;
  maxTotalBonusPct: number;
}

export const MP4_TECHNIQUE_ROLE_CAPS: Readonly<Record<TechniqueScalingRole, TechniqueScalingRoleCaps>> = Object.freeze({
  offense: Object.freeze({ primaryCoef: 0.22, secondaryCoef: 0.10, rootCoef: 0.07, heartLawCoef: 0.06, maxTotalBonusPct: 28 }),
  defense: Object.freeze({ primaryCoef: 0.18, secondaryCoef: 0.09, rootCoef: 0.05, heartLawCoef: 0.06, maxTotalBonusPct: 24 }),
  utility: Object.freeze({ primaryCoef: 0.14, secondaryCoef: 0.08, rootCoef: 0.06, heartLawCoef: 0.08, maxTotalBonusPct: 22 }),
  control: Object.freeze({ primaryCoef: 0.14, secondaryCoef: 0.08, rootCoef: 0.06, heartLawCoef: 0.08, maxTotalBonusPct: 22 }),
  support: Object.freeze({ primaryCoef: 0.10, secondaryCoef: 0.06, rootCoef: 0.04, heartLawCoef: 0.06, maxTotalBonusPct: 16 }),
  ultimate: Object.freeze({ primaryCoef: 0.26, secondaryCoef: 0.12, rootCoef: 0.08, heartLawCoef: 0.08, maxTotalBonusPct: 34 }),
});

export interface TechniqueScalingContribution {
  id: 'primary' | 'secondary' | 'root' | 'heartLaw';
  label: string;
  statId: string | null;
  scaledValue: number;
  coef: number;
  bonusPct: number;
  active: boolean;
}

export interface TechniqueScalingSnapshot {
  totalMultiplier: number;
  additiveBonus: number;
  additiveBonusPct: number;
  cappedBonus: number;
  cappedBonusPct: number;
  maxTotalBonusPct: number;
  combatEffectActive: boolean;
  contributions: readonly TechniqueScalingContribution[];
  activeTraits: readonly string[];
  nextTrait: null;
  debug: { mode: 'mp4_v1' | 'inactive_missing_metadata' };
}

export interface ResolveTechniqueScalingSnapshotInput {
  technique?: TechniqueDef | null;
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
  rootElementId?: SpiritRootElement | string | null;
  rootResonance?: number | null;
  heartLawTags?: readonly string[] | null;
  heartLawLevel?: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeRole(technique?: TechniqueDef | null): TechniqueScalingRole {
  if (technique?.type === 'ultimate' || technique?.scalingRole === 'ultimate') return 'ultimate';
  const role = String(technique?.scalingRole ?? technique?.role ?? '').toLowerCase();
  if (role === 'control') return 'control';
  if (role === 'support') return 'support';
  if (role === 'defense') return 'defense';
  if (role === 'utility') return 'utility';
  return 'offense';
}

function statRating(snapshot: TrainingReadOnlySnapshot | null | undefined, statId: string | null | undefined): number {
  if (!snapshot || !statId) return 0;
  return snapshot.pathStats.find((row) => row.statId === statId)?.rating ?? 0;
}

function statScale(snapshot: TrainingReadOnlySnapshot | null | undefined, statId: string | null | undefined): number {
  const cap = Math.max(1, finiteNumber(snapshot?.realmCap, 100));
  return clamp(statRating(snapshot, statId) / cap, 0, 1);
}

function hasAnyMatch(values: readonly string[] | undefined, candidates: readonly string[] | null | undefined): boolean {
  if (!values || values.length === 0 || !candidates || candidates.length === 0) return false;
  const set = new Set(values.map((value) => value.toLowerCase()));
  return candidates.some((candidate) => set.has(candidate.toLowerCase()));
}

function roundPct(value: number): number {
  return Math.round(value * 1000) / 10;
}

function roundMultiplier(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function inactiveSnapshot(): TechniqueScalingSnapshot {
  return {
    totalMultiplier: 1,
    additiveBonus: 0,
    additiveBonusPct: 0,
    cappedBonus: 0,
    cappedBonusPct: 0,
    maxTotalBonusPct: 0,
    combatEffectActive: false,
    contributions: [],
    activeTraits: [],
    nextTrait: null,
    debug: { mode: 'inactive_missing_metadata' },
  };
}

export function resolveTechniqueScalingSnapshot(
  input: ResolveTechniqueScalingSnapshotInput = {},
): TechniqueScalingSnapshot {
  const technique = input.technique;
  if (!technique?.primaryScalingStatId || !technique.secondaryScalingStatId || technique.scalingVersion !== 'mp4_v1') {
    return inactiveSnapshot();
  }

  const role = normalizeRole(technique);
  const roleCaps = MP4_TECHNIQUE_ROLE_CAPS[role];
  const primaryCoef = finiteNumber(technique.primaryScalingCoef, roleCaps.primaryCoef);
  const secondaryCoef = finiteNumber(technique.secondaryScalingCoef, roleCaps.secondaryCoef);
  const rootMatches = Boolean(input.rootElementId)
    && hasAnyMatch(technique.rootAffinityIds ?? technique.tags, [String(input.rootElementId)]);
  const heartMatches = hasAnyMatch(technique.heartLawTagIds ?? [], input.heartLawTags);
  const rootCoef = rootMatches ? roleCaps.rootCoef : 0;
  const heartLawCoef = heartMatches ? roleCaps.heartLawCoef : 0;
  const rootScaled = clamp(finiteNumber(input.rootResonance) / 100, 0, 1);
  const heartScaled = clamp(finiteNumber(input.heartLawLevel, 1) / 45, 0, 1);

  const contributionInputs: TechniqueScalingContribution[] = [
    {
      id: 'primary',
      label: 'Primary Stat',
      statId: technique.primaryScalingStatId,
      scaledValue: statScale(input.trainingSnapshot, technique.primaryScalingStatId),
      coef: primaryCoef,
      bonusPct: 0,
      active: true,
    },
    {
      id: 'secondary',
      label: 'Secondary Stat',
      statId: technique.secondaryScalingStatId,
      scaledValue: statScale(input.trainingSnapshot, technique.secondaryScalingStatId),
      coef: secondaryCoef,
      bonusPct: 0,
      active: true,
    },
    {
      id: 'root',
      label: 'Spirit Root',
      statId: null,
      scaledValue: rootScaled,
      coef: rootCoef,
      bonusPct: 0,
      active: rootMatches,
    },
    {
      id: 'heartLaw',
      label: 'Heart Law',
      statId: null,
      scaledValue: heartScaled,
      coef: heartLawCoef,
      bonusPct: 0,
      active: heartMatches,
    },
  ];
  const contributions: TechniqueScalingContribution[] = contributionInputs
    .map((row) => ({ ...row, bonusPct: roundPct(row.scaledValue * row.coef) }));

  const additiveBonus = contributions.reduce((sum, row) => sum + (row.scaledValue * row.coef), 0);
  const maxBonus = roleCaps.maxTotalBonusPct / 100;
  const cappedBonus = clamp(additiveBonus, 0, maxBonus);

  return {
    totalMultiplier: roundMultiplier(1 + cappedBonus),
    additiveBonus: roundMultiplier(additiveBonus),
    additiveBonusPct: roundPct(additiveBonus),
    cappedBonus: roundMultiplier(cappedBonus),
    cappedBonusPct: roundPct(cappedBonus),
    maxTotalBonusPct: roleCaps.maxTotalBonusPct,
    combatEffectActive: cappedBonus > 0,
    contributions,
    activeTraits: contributions.filter((row) => row.active && row.bonusPct > 0).map((row) => row.label),
    nextTrait: null,
    debug: { mode: 'mp4_v1' },
  };
}
