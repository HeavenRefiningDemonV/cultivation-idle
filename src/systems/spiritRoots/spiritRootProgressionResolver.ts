import type {
  HeartLawDef,
  SpiritRootAwakeningState,
  SpiritRootProgressionDef,
  SpiritRootShape,
} from '../../content/types.js';
import type { SpiritRoot, SpiritRootElement } from '../../types/index.js';
import {
  resolveRootHeartFit,
  type RootHeartFitResult,
} from './rootHeartFitResolver.js';

export const CANONICAL_SPIRIT_ROOT_ELEMENTS = Object.freeze([
  'wood',
  'fire',
  'earth',
  'metal',
  'water',
  'wind',
  'lightning',
  'ice',
  'light',
  'shadow',
  'soul',
  'void',
  'time',
  'astral',
] as const satisfies readonly SpiritRootElement[]);

export type CanonicalSpiritRootElement = (typeof CANONICAL_SPIRIT_ROOT_ELEMENTS)[number];

export const SPIRIT_ROOT_AWAKENING_PROC_MULTIPLIER: Readonly<Record<SpiritRootAwakeningState, number>> = Object.freeze({
  dormant: 0,
  stirring: 0.6,
  open: 1,
  radiant: 1.35,
  transformed: 1.75,
});

const AWAKENING_PROC_CHANCE_BONUS: Readonly<Record<SpiritRootAwakeningState, number>> = Object.freeze({
  dormant: 0,
  stirring: 1,
  open: 3,
  radiant: 5,
  transformed: 7,
});

const BASE_ELEMENT_EFFECT: Readonly<Record<CanonicalSpiritRootElement, number>> = Object.freeze({
  wood: 0.045,
  fire: 0.05,
  earth: 0.05,
  metal: 0.045,
  water: 0.045,
  wind: 0.04,
  lightning: 0.05,
  ice: 0.04,
  light: 0.04,
  shadow: 0.04,
  soul: 0.04,
  void: 0.04,
  time: 0.035,
  astral: 0.04,
});

export interface SpiritRootShapeSnapshot {
  kind: SpiritRootShape;
  effectPeakBonusPct: number;
  offAffinityPenaltyPct?: number;
  crossAffinityBonusPct?: number;
  mismatchVariantChancePct?: number;
  broadResonanceBonusPct?: number;
  turbulenceAddOnMismatch?: number;
}

export interface SpiritRootAwakeningSnapshot {
  state: SpiritRootAwakeningState;
  procMultiplier: number;
}

export interface SpiritRootProcSnapshot {
  effectId: string;
  procName: string;
  chancePct: number;
  cooldownSec: number;
  effectStrength: number;
}

export interface SpiritRootVariantSnapshot {
  id: string;
  displayName: string;
  effectId: string;
  description: string | null;
}

export interface SpiritRootDisplayRow {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface SpiritRootProgressionSnapshot {
  elementId: CanonicalSpiritRootElement;
  displayName: string;
  awakening: SpiritRootAwakeningSnapshot;
  proc: SpiritRootProcSnapshot;
  variant: SpiritRootVariantSnapshot | null;
  fit: RootHeartFitResult;
  shape: SpiritRootShapeSnapshot;
  rows: SpiritRootDisplayRow[];
  hardLocksMismatchRoutes: false;
}

export interface BuildSpiritRootProgressionSnapshotInput {
  root: SpiritRoot | null;
  rootDef?: SpiritRootProgressionDef | null;
  selectedHeartLawId?: string | null;
  heartLawDef?: HeartLawDef | null;
  heartLawLevel?: number | null;
  rootResonance?: number | null;
  shape?: SpiritRootShape | null;
  unlockedVariantIds?: readonly string[] | null;
  trainingRatingsById?: Record<string, number> | null;
  daoHeartClarity?: number | null;
  verseMastery?: number | null;
}

export interface SpiritRootProgressionPreview {
  resonanceGain: number;
  awakeningChanged: boolean;
  hardLocksMismatchRoutes: false;
  snapshot: SpiritRootProgressionSnapshot | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finiteNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toCanonicalElement(value: string | null | undefined): CanonicalSpiritRootElement | null {
  return (CANONICAL_SPIRIT_ROOT_ELEMENTS as readonly string[]).includes(value ?? '')
    ? value as CanonicalSpiritRootElement
    : null;
}

export function getSpiritRootPairKey(elementId: SpiritRootElement | string, heartLawId: string | null | undefined): string {
  return `${elementId}::${heartLawId ?? 'none'}`;
}

export function isCanonicalSpiritRootElement(value: unknown): value is CanonicalSpiritRootElement {
  return typeof value === 'string' && (CANONICAL_SPIRIT_ROOT_ELEMENTS as readonly string[]).includes(value);
}

export function getSpiritRootShapeSnapshot(shape: SpiritRootShape | null | undefined = 'single'): SpiritRootShapeSnapshot {
  switch (shape ?? 'single') {
    case 'dual':
      return { kind: 'dual', effectPeakBonusPct: 8, crossAffinityBonusPct: 10 };
    case 'triple':
      return { kind: 'triple', effectPeakBonusPct: -5, mismatchVariantChancePct: 20 };
    case 'mixed':
      return { kind: 'mixed', effectPeakBonusPct: -12, broadResonanceBonusPct: 30 };
    case 'mutated':
      return { kind: 'mutated', effectPeakBonusPct: 15, turbulenceAddOnMismatch: 6 };
    case 'single':
    default:
      return { kind: 'single', effectPeakBonusPct: 18, offAffinityPenaltyPct: 8 };
  }
}

export function resolveSpiritRootAwakening(input: {
  root: SpiritRoot | null;
  heartLawLevel?: number | null;
  rootResonance?: number | null;
}): SpiritRootAwakeningSnapshot {
  if (!input.root) {
    return { state: 'dormant', procMultiplier: SPIRIT_ROOT_AWAKENING_PROC_MULTIPLIER.dormant };
  }

  const purity = clamp(finiteNumber(input.root.purity), 0, 100);
  const heartLawLevel = Math.max(1, Math.floor(finiteNumber(input.heartLawLevel, 1)));
  const resonance = clamp(finiteNumber(input.rootResonance), 0, 100);
  let state: SpiritRootAwakeningState = 'dormant';

  if (resonance >= 95 && heartLawLevel >= 30 && purity >= 95) state = 'transformed';
  else if (resonance >= 70 && heartLawLevel >= 16 && purity >= 70) state = 'radiant';
  else if (resonance >= 50 && heartLawLevel >= 8) state = 'open';
  else if (resonance >= 35 || heartLawLevel >= 3) state = 'stirring';

  return { state, procMultiplier: SPIRIT_ROOT_AWAKENING_PROC_MULTIPLIER[state] };
}

function resonanceBandBonus(rootResonance: number): number {
  if (rootResonance >= 85) return 4;
  if (rootResonance >= 70) return 2;
  if (rootResonance >= 50) return 1;
  if (rootResonance >= 35) return 1;
  return 0;
}

export function resolveSpiritRootProcSnapshot(input: {
  root: SpiritRoot;
  rootDef: SpiritRootProgressionDef;
  awakening: SpiritRootAwakeningSnapshot;
  rootResonance?: number | null;
  shape?: SpiritRootShapeSnapshot | null;
}): SpiritRootProcSnapshot {
  const elementId = toCanonicalElement(input.rootDef.elementId) ?? 'wood';
  const purityGrade = clamp(Math.floor(finiteNumber(input.root.grade, 1)), 1, 5);
  const rootResonance = clamp(finiteNumber(input.rootResonance), 0, 100);
  const chanceCap = clamp(finiteNumber(input.rootDef.procChanceCapPct, 18), 4, 18);
  const chancePct = clamp(
    3
      + (2 * purityGrade)
      + AWAKENING_PROC_CHANCE_BONUS[input.awakening.state]
      + resonanceBandBonus(rootResonance),
    4,
    chanceCap,
  );
  const purityEffectMult = 0.75 + clamp(finiteNumber(input.root.purity), 0, 100) / 200;
  const resonanceEffectMult = 1 + Math.min(rootResonance, 100) / 400;
  const shapeMult = 1 + (input.shape?.effectPeakBonusPct ?? 0) / 100;
  const effectStrength = BASE_ELEMENT_EFFECT[elementId]
    * purityEffectMult
    * input.awakening.procMultiplier
    * resonanceEffectMult
    * shapeMult;

  return {
    effectId: input.rootDef.effectId,
    procName: input.rootDef.procName,
    chancePct,
    cooldownSec: Math.max(0, Math.floor(finiteNumber(input.rootDef.internalCooldownSec, 10))),
    effectStrength,
  };
}

export function resolveSpiritRootVariant(input: {
  rootDef: SpiritRootProgressionDef;
  selectedHeartLawId?: string | null;
  rootResonance?: number | null;
  unlockedVariantIds?: readonly string[] | null;
  trainingRatingsById?: Record<string, number> | null;
  daoHeartClarity?: number | null;
  verseMastery?: number | null;
}): SpiritRootVariantSnapshot | null {
  const variants = input.rootDef.variants ?? [];
  if (variants.length === 0) return null;
  const unlocked = new Set(input.unlockedVariantIds ?? []);
  const ratings = input.trainingRatingsById ?? {};
  const resonance = finiteNumber(input.rootResonance);
  const clarity = finiteNumber(input.daoHeartClarity);
  const verse = finiteNumber(input.verseMastery);

  const match = variants.find((variant) => {
    if (unlocked.has(variant.id)) return true;
    if (variant.requiredHeartLawId && variant.requiredHeartLawId !== input.selectedHeartLawId) return false;
    if (variant.requiredRootResonance !== undefined && resonance < variant.requiredRootResonance) return false;
    if (variant.requiredStatId && finiteNumber(ratings[variant.requiredStatId]) <= 0) return false;
    if (variant.requiredDaoHeartClarity !== undefined && clarity < variant.requiredDaoHeartClarity) return false;
    if (variant.requiredVerseMastery !== undefined && verse < variant.requiredVerseMastery) return false;
    if (variant.requiredStatRatings?.some((row) => finiteNumber(ratings[row.statId]) < row.minRating)) return false;
    return true;
  });

  return match
    ? {
        id: match.id,
        displayName: match.displayName,
        effectId: match.effectId,
        description: match.description ?? null,
      }
    : null;
}

export function buildSpiritRootProgressionSnapshot(
  input: BuildSpiritRootProgressionSnapshotInput,
): SpiritRootProgressionSnapshot {
  const elementId = toCanonicalElement(input.root?.element ?? input.rootDef?.elementId) ?? 'wood';
  const rootDef: SpiritRootProgressionDef = input.rootDef ?? {
    elementId,
    displayName: `${elementId[0]?.toUpperCase() ?? 'W'}${elementId.slice(1)} Root`,
    procName: 'Root Pulse',
    description: 'Spirit Root response.',
    purityGrades: [1, 2, 3, 4, 5],
    awakeningStates: ['dormant', 'stirring', 'open', 'radiant', 'transformed'],
    effectId: `${elementId}_root_pulse_v1`,
    procChanceCapPct: 18,
    internalCooldownSec: 10,
    hardLocksMismatchRoutes: false,
  };
  const root: SpiritRoot = input.root ?? { element: elementId, grade: 1, purity: 0 };
  const rootResonance = clamp(finiteNumber(input.rootResonance), 0, 100);
  const fit = resolveRootHeartFit({
    root: input.root ? root : null,
    heartLaw: input.heartLawDef ?? null,
    currentRootResonance: rootResonance,
    unlockedVariantIds: input.unlockedVariantIds,
  });
  const effectiveRootExpression = fit.effectiveExpression;
  const awakening = resolveSpiritRootAwakening({
    root,
    heartLawLevel: input.heartLawLevel,
    rootResonance: effectiveRootExpression,
  });
  const shape = getSpiritRootShapeSnapshot(input.shape ?? 'single');
  const proc = resolveSpiritRootProcSnapshot({
    root,
    rootDef,
    awakening,
    rootResonance: effectiveRootExpression,
    shape,
  });
  const variant = resolveSpiritRootVariant({
    rootDef,
    selectedHeartLawId: input.selectedHeartLawId,
    rootResonance,
    unlockedVariantIds: input.unlockedVariantIds,
    trainingRatingsById: input.trainingRatingsById,
    daoHeartClarity: input.daoHeartClarity,
    verseMastery: input.verseMastery,
  });

  return {
    elementId,
    displayName: rootDef.displayName,
    awakening,
    proc: variant ? { ...proc, effectId: variant.effectId } : proc,
    variant,
    fit,
    shape,
    rows: [
      {
        id: 'fit',
        label: 'Root / Heart Fit',
        value: fit.label,
        detail: fit.summary,
      },
      {
        id: 'awakening',
        label: 'Root Awakening',
        value: awakening.state,
        detail: `${proc.procName} chance ${proc.chancePct.toFixed(0)}%; cooldown ${proc.cooldownSec}s.`,
      },
      {
        id: 'resonance',
        label: 'Root Resonance',
        value: `${effectiveRootExpression.toFixed(0)}%`,
        detail: rootResonance > effectiveRootExpression
          ? `Expression capped at ${fit.effects.expressionCap}% by ${fit.label} fit.`
          : variant ? `${variant.displayName} available.` : 'Current Heart Law pairing.',
      },
      {
        id: 'playstyle',
        label: 'Root Playstyle',
        value: fit.style.playstyleLabel,
        detail: fit.style.routeBiases.map((bias) => bias.label).join(', '),
      },
    ],
    hardLocksMismatchRoutes: false,
  };
}

export function resolveSpiritRootProgressionPreview(
  input: BuildSpiritRootProgressionSnapshotInput = { root: null },
): SpiritRootProgressionPreview {
  const snapshot = input.root || input.rootDef ? buildSpiritRootProgressionSnapshot(input) : null;
  return {
    resonanceGain: snapshot ? Math.max(0, 0.5 * snapshot.fit.effects.rootResonanceGainMult) : 0,
    awakeningChanged: false,
    hardLocksMismatchRoutes: false,
    snapshot,
  };
}
