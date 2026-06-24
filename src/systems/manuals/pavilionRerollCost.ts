import { useContentStore } from '../../stores/contentStore.js';
import type { RewardCurrencyBundle } from '../../services/rewards/types.js';

/**
 * M.IV.1 ARTS-MECH / Step 2 — the paid Fortune-Draw reroll cost (D7 §fortune).
 *
 * STRUCTURE only. The reroll is the *paid early refresh* (the free refresh is cooldown-gated). Its MAGNITUDE
 * is HELD → D15: the cost is read from economy content (`manualSystem.pavilions.refresh.rerollCost`), flat or
 * per-city. Until D15 deposits it, this returns null and the reroll is gated (`reroll_not_configured`) — the
 * surface shows the reroll row honestly with cost "[tune] → D15". We author NO number in code.
 */
export function resolvePavilionRerollCost(cityIndex = 0): RewardCurrencyBundle | null {
  const economy = useContentStore.getState().raw?.economy?.manualSystem as
    | { pavilions?: { refresh?: { rerollCost?: unknown } } }
    | undefined;
  const raw = economy?.pavilions?.refresh?.rerollCost as
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | undefined;
  if (!raw) return null;
  const idx = Math.max(0, cityIndex);
  const src = Array.isArray(raw) ? raw[Math.min(idx, raw.length - 1)] : raw;
  if (!src || typeof src !== 'object') return null;
  const bundle: RewardCurrencyBundle = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const value = Number((src as Record<string, unknown>)[key]);
    if (Number.isFinite(value) && value > 0) bundle[key] = String((src as Record<string, unknown>)[key]);
  });
  return Object.keys(bundle).length > 0 ? bundle : null;
}
