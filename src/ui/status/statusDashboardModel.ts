import type { PlayerStats } from '../../types/index.js';
import { D, formatNumber, formatPercentFromValue } from '../../utils/numbers.js';
import type { RunCompassActionLine } from '../../systems/ui/runCompass/index.js';
import type { StatusActionSurface } from '../../systems/ui/status/statusDashboardSurface.js';

export type StatusDashboardCombatMetricId = 'combat_strength' | 'attack' | 'defense' | 'crit_rate';
export type StatusDashboardCombatMetricTone = 'neutral' | 'attack' | 'defense' | 'crit';

export interface StatusDashboardCombatMetric {
  id: StatusDashboardCombatMetricId;
  label: string;
  value: string;
  tone: StatusDashboardCombatMetricTone;
}

export type StatusDashboardActionTone = 'go' | 'blocked' | 'settled';

export interface StatusDashboardActionState {
  label: 'Go' | 'Blocked' | 'Check';
  disabled: boolean;
  tone: StatusDashboardActionTone;
}

export type StatusDashboardIssueTone = 'danger' | 'warning' | 'info' | 'success';

type CombatMetricStats = Pick<PlayerStats, 'hp' | 'atk' | 'def' | 'crit'>;

export function buildStatusCombatMetrics(stats: CombatMetricStats): StatusDashboardCombatMetric[] {
  const combatStrength = D(stats.hp)
    .plus(stats.atk)
    .plus(stats.def)
    .plus(stats.crit);

  return [
    {
      id: 'combat_strength',
      label: 'Combat Strength',
      value: formatNumber(combatStrength),
      tone: 'neutral',
    },
    {
      id: 'attack',
      label: 'Attack',
      value: formatNumber(stats.atk),
      tone: 'attack',
    },
    {
      id: 'defense',
      label: 'Defense',
      value: formatNumber(stats.def),
      tone: 'defense',
    },
    {
      id: 'crit_rate',
      label: 'Crit Rate',
      value: formatPercentFromValue(stats.crit, 0),
      tone: 'crit',
    },
  ];
}

export function getRunCompassActionState(action: Pick<RunCompassActionLine, 'blocked' | 'target'>): StatusDashboardActionState {
  if (!action.blocked && action.target) {
    return { label: 'Go', disabled: false, tone: 'go' };
  }

  if (action.target) {
    return { label: 'Blocked', disabled: true, tone: 'blocked' };
  }

  return { label: 'Check', disabled: true, tone: 'settled' };
}

export function getStatusDashboardActionState(action: Pick<StatusActionSurface, 'disabled' | 'target'>): StatusDashboardActionState {
  if (!action.disabled && action.target.kind !== 'none') {
    return { label: 'Go', disabled: false, tone: 'go' };
  }

  if (action.target.kind !== 'none') {
    return { label: 'Blocked', disabled: true, tone: 'blocked' };
  }

  return { label: 'Check', disabled: true, tone: 'settled' };
}

export function classifyDashboardIssueTone(line: string): StatusDashboardIssueTone {
  const normalized = line.toLowerCase();
  if (
    normalized.includes('under-supported') ||
    normalized.includes('bad') ||
    normalized.includes('below minimum') ||
    normalized.includes('blocked')
  ) {
    return 'danger';
  }

  if (
    normalized.includes('warning') ||
    normalized.includes('disabled') ||
    normalized.includes('risky') ||
    normalized.includes('below target')
  ) {
    return 'warning';
  }

  if (
    normalized.includes('shortfall') ||
    normalized.includes('visible') ||
    normalized.includes('restock') ||
    normalized.includes('open')
  ) {
    return 'info';
  }

  return 'success';
}
