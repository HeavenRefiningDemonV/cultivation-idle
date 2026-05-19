import type { ValidatedContent } from '../../content/index.js';
import type { TrialFailSafeCost } from '../../content/types.js';

export const CHANGE_HEART_LAW_COST = { gold: '100' } as const;
export const LIVE_ALLOWED_MERIT_SINK_IDS = ['gate_trial_fail_safe'] as const;
export type LiveAllowedMeritSinkId = (typeof LIVE_ALLOWED_MERIT_SINK_IDS)[number];

export interface VisibleCurrencySpendSurface {
  id: string;
  label: string;
  visible: boolean;
  live: boolean;
  costs: Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;
}

export interface MeritRoleAuditReport {
  surfaces: VisibleCurrencySpendSurface[];
  meritUsingSurfaces: VisibleCurrencySpendSurface[];
  violations: VisibleCurrencySpendSurface[];
}

function normalizeCost(cost: TrialFailSafeCost | null | undefined): Partial<Record<'gold' | 'spiritStones' | 'merit', string>> {
  if (!cost) return {};
  return {
    ...(cost.gold ? { gold: cost.gold } : {}),
    ...(cost.spiritStones ? { spiritStones: cost.spiritStones } : {}),
    ...(cost.merit ? { merit: cost.merit } : {}),
  };
}

export function getVisibleCurrencySpendSurfaces(content: Pick<ValidatedContent, 'trials'> | null | undefined): VisibleCurrencySpendSurface[] {
  const failSafeSurfaces = (content?.trials ?? []).map((trial, index) => ({
    id: 'gate_trial_fail_safe',
    label: `Gate Trial fail-safe (${trial.id ?? `city_${index}`})`,
    visible: true,
    live: true,
    costs: normalizeCost(trial.failSafe?.cost ?? null),
  }));

  return [
    ...failSafeSurfaces,
    {
      id: 'heart_law_change',
      label: 'Heart Law change modal',
      visible: true,
      live: true,
      costs: { ...CHANGE_HEART_LAW_COST },
    },
  ];
}

export function buildMeritRoleAudit(content: Pick<ValidatedContent, 'trials'> | null | undefined): MeritRoleAuditReport {
  const surfaces = getVisibleCurrencySpendSurfaces(content);
  const meritUsingSurfaces = surfaces.filter((surface) => Boolean(surface.costs.merit));
  const violations = meritUsingSurfaces.filter((surface) => !LIVE_ALLOWED_MERIT_SINK_IDS.includes(surface.id as LiveAllowedMeritSinkId));

  return {
    surfaces,
    meritUsingSurfaces,
    violations,
  };
}
