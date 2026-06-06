export type TrainingSupportMultiplierId =
  | 'pathAffinity'
  | 'heartLawSupport'
  | 'rootSupport'
  | 'offlineEfficiency'
  | 'prestigeFloor';

export type TrainingSupportMultiplierSource = 'upstream' | 'neutral_default';

export interface ResolveTrainingSupportMultipliersInput {
  pathAffinity?: number | null;
  heartLawSupport?: number | null;
  rootSupport?: number | null;
  offlineEfficiency?: number | null;
  prestigeFloor?: number | null;
}

export interface TrainingSupportMultiplierRow {
  id: TrainingSupportMultiplierId;
  label: string;
  value: number;
  valueLabel: string;
  source: TrainingSupportMultiplierSource;
  detail: string;
}

export interface TrainingSupportMultipliers {
  pathAffinity: number;
  heartLawSupport: number;
  rootSupport: number;
  offlineEfficiency: number;
  prestigeFloor: number;
  totalOnlineMultiplier: number;
  rows: TrainingSupportMultiplierRow[];
}

const MAX_SUPPORT_MULTIPLIER = 1.5;
const MIN_OFFLINE_EFFICIENCY = 0.05;
const MAX_OFFLINE_EFFICIENCY = 1;
const MAX_PRESTIGE_FLOOR = 150;

function sanitizeMultiplier(value: number | null | undefined): {
  value: number;
  source: TrainingSupportMultiplierSource;
} {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return { value: 1, source: 'neutral_default' };
  }
  return {
    value: Math.max(0.5, Math.min(MAX_SUPPORT_MULTIPLIER, value)),
    source: 'upstream',
  };
}

function sanitizeOffline(value: number | null | undefined): {
  value: number;
  source: TrainingSupportMultiplierSource;
} {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return { value: 1, source: 'neutral_default' };
  }
  return {
    value: Math.max(MIN_OFFLINE_EFFICIENCY, Math.min(MAX_OFFLINE_EFFICIENCY, value)),
    source: 'upstream',
  };
}

function sanitizePrestigeFloor(value: number | null | undefined): {
  value: number;
  source: TrainingSupportMultiplierSource;
} {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return { value: 0, source: 'neutral_default' };
  }
  return {
    value: Math.max(0, Math.min(MAX_PRESTIGE_FLOOR, Math.floor(value))),
    source: 'upstream',
  };
}

const multiplierLabel = (value: number): string => `${value.toFixed(value % 1 === 0 ? 0 : 2)}x`;

function row(input: {
  id: TrainingSupportMultiplierId;
  label: string;
  value: number;
  source: TrainingSupportMultiplierSource;
  neutralDetail: string;
  upstreamDetail: string;
  valueLabel?: string;
}): TrainingSupportMultiplierRow {
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    valueLabel: input.valueLabel ?? multiplierLabel(input.value),
    source: input.source,
    detail: input.source === 'upstream' ? input.upstreamDetail : input.neutralDetail,
  };
}

export function resolveTrainingSupportMultipliers(
  input: ResolveTrainingSupportMultipliersInput = {},
): TrainingSupportMultipliers {
  const pathAffinity = sanitizeMultiplier(input.pathAffinity);
  const heartLawSupport = sanitizeMultiplier(input.heartLawSupport);
  const rootSupport = sanitizeMultiplier(input.rootSupport);
  const offlineEfficiency = sanitizeOffline(input.offlineEfficiency);
  const prestigeFloor = sanitizePrestigeFloor(input.prestigeFloor);
  const totalOnlineMultiplier = pathAffinity.value * heartLawSupport.value * rootSupport.value;

  return {
    pathAffinity: pathAffinity.value,
    heartLawSupport: heartLawSupport.value,
    rootSupport: rootSupport.value,
    offlineEfficiency: offlineEfficiency.value,
    prestigeFloor: prestigeFloor.value,
    totalOnlineMultiplier,
    rows: [
      row({
        id: 'pathAffinity',
        label: 'Path Affinity',
        value: pathAffinity.value,
        source: pathAffinity.source,
        neutralDetail: 'No MP2-safe path affinity source is active, so Training remains neutral.',
        upstreamDetail: 'Read from upstream path affinity support and bounded for Training.',
      }),
      row({
        id: 'heartLawSupport',
        label: 'Heart Law Support',
        value: heartLawSupport.value,
        source: heartLawSupport.source,
        neutralDetail: 'No direct Heart Law Training support is active yet.',
        upstreamDetail: 'Read from upstream Heart Law support and bounded for Training.',
      }),
      row({
        id: 'rootSupport',
        label: 'Root Support',
        value: rootSupport.value,
        source: rootSupport.source,
        neutralDetail: 'No Spirit Root Training resonance is active yet.',
        upstreamDetail: 'Read from upstream Spirit Root resonance and bounded for Training.',
      }),
      row({
        id: 'offlineEfficiency',
        label: 'Offline Efficiency',
        value: offlineEfficiency.value,
        source: offlineEfficiency.source,
        neutralDetail: 'Online Training uses full live speed; offline efficiency is neutral here.',
        upstreamDetail: 'Read from Training offline efficiency policy.',
      }),
      row({
        id: 'prestigeFloor',
        label: 'Prestige Floor',
        value: prestigeFloor.value,
        valueLabel: `+${prestigeFloor.value}`,
        source: prestigeFloor.source,
        neutralDetail: 'No prestige floor is active for this life.',
        upstreamDetail: 'Read from Prestige memory and applied as a Training cap floor input.',
      }),
    ],
  };
}
