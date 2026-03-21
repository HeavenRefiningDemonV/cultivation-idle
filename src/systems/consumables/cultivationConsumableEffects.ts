import { getConsumableSpec } from './consumableCatalog.js';
import {
  createBaseCultivationConsumableModifiers,
  type ActiveCultivationConsumable,
  type CultivationConsumableModifiers,
} from './cultivationConsumableTypes.js';

export function getCultivationConsumableActivation(
  itemId: string,
  activatedAt: number,
): ActiveCultivationConsumable | null {
  const spec = getConsumableSpec(itemId);
  if (!spec || spec.domain !== 'cultivation') return null;

  return {
    itemId,
    family: spec.family,
    activatedAt,
    expiresAt: activatedAt + spec.effect.durationSec * 1000,
    modifiers: { ...spec.effect.modifiers },
    breakthroughChargesRemaining: spec.effect.breakthroughChargesRemaining,
  };
}

export function combineCultivationConsumableModifiers(
  activeConsumables: ActiveCultivationConsumable[],
  now: number,
): CultivationConsumableModifiers {
  const modifiers = createBaseCultivationConsumableModifiers();

  activeConsumables.forEach((entry) => {
    if (!entry || entry.expiresAt <= now) return;
    modifiers.qiRateMult *= entry.modifiers.qiRateMult;
    modifiers.stabilityGainMult *= entry.modifiers.stabilityGainMult;
    modifiers.comprehensionGainMult *= entry.modifiers.comprehensionGainMult;
    modifiers.insightFrequencyMult *= entry.modifiers.insightFrequencyMult;
    modifiers.breakthroughQiCostMult *= entry.modifiers.breakthroughQiCostMult;
    modifiers.breakthroughStabilityBonus += entry.modifiers.breakthroughStabilityBonus;
  });

  return modifiers;
}

export function getCultivationConsumableWindowBreakpoints(
  activeConsumables: ActiveCultivationConsumable[],
  startAt: number,
  endAt: number,
): number[] {
  const breakpoints = new Set<number>([startAt, endAt]);
  activeConsumables.forEach((entry) => {
    if (!entry) return;
    if (entry.expiresAt > startAt && entry.expiresAt < endAt) {
      breakpoints.add(entry.expiresAt);
    }
  });
  return [...breakpoints].sort((a, b) => a - b);
}

export function getActiveCultivationConsumablesAt(
  activeConsumables: ActiveCultivationConsumable[],
  now: number,
): ActiveCultivationConsumable[] {
  return activeConsumables.filter((entry) => entry.expiresAt > now);
}

