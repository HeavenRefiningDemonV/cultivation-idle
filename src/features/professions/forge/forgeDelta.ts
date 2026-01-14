import type { PlayerStats } from '../../../types';
import { formatNumber, formatPercentFromValue } from '../../../utils/numbers';

export type ForgeDeltaLine = {
  label: string;
  before: string;
  after: string;
  delta: string;
};

const statLines: Array<{
  key: keyof PlayerStats;
  label: string;
  format: (value: string | number) => string;
  percent?: boolean;
}> = [
  { key: 'hp', label: 'HP', format: formatNumber },
  { key: 'atk', label: 'ATK', format: formatNumber },
  { key: 'def', label: 'DEF', format: formatNumber },
  { key: 'crit', label: 'Crit %', format: (value) => formatPercentFromValue(value, 1), percent: true },
  { key: 'dodge', label: 'Dodge %', format: (value) => formatPercentFromValue(value, 1), percent: true },
];

const toNumber = (value: unknown): number => {
  const num = typeof value === 'string' || typeof value === 'number' ? Number(value) : 0;
  return Number.isFinite(num) ? num : 0;
};

const formatDeltaValue = (value: number, percent?: boolean): string => {
  const sign = value >= 0 ? '+' : '';
  if (percent) {
    return `${sign}${value.toFixed(1)}%`;
  }
  return `${sign}${formatNumber(value)}`;
};

export function buildItemDelta(before: PlayerStats, after: PlayerStats): { lines: ForgeDeltaLine[] } {
  const lines = statLines.map((line) => {
    const beforeValue = toNumber(before[line.key]);
    const afterValue = toNumber(after[line.key]);
    const delta = afterValue - beforeValue;
    return {
      label: line.label,
      before: line.format(beforeValue),
      after: line.format(afterValue),
      delta: formatDeltaValue(delta, line.percent),
    };
  });

  return { lines };
}
