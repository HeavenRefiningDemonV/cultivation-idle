import { getConsumableSpec } from './consumableCatalog.js';
import {
  CULTIVATION_CONSUMABLE_FAMILY_REGISTRY,
  DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS,
  type ActiveCultivationConsumable,
  type CultivationConsumableCarryoverWindow,
  type CultivationConsumableModifiers,
  type CultivationConsumableReadModel,
  type CultivationConsumableReadModelEntry,
} from './cultivationConsumableTypes.js';

export function mergeCultivationConsumableModifiers(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): CultivationConsumableModifiers {
  return consumables.reduce<CultivationConsumableModifiers>((acc, entry) => {
    if (entry.expiresAt <= now) return acc;
    const isSpentBreakthrough = entry.family === 'breakthrough' && entry.consumedOnMajorBreakthrough;
    acc.qiRateMult *= entry.modifiers.qiRateMult;
    acc.comprehensionGainMult *= entry.modifiers.comprehensionGainMult;
    acc.stabilityGainMult *= entry.modifiers.stabilityGainMult;
    acc.insightFrequencyMult *= entry.modifiers.insightFrequencyMult;
    if (!isSpentBreakthrough) {
      acc.majorBreakthroughQiCostMult *= entry.modifiers.majorBreakthroughQiCostMult;
      acc.majorBreakthroughStabilityBonus += entry.modifiers.majorBreakthroughStabilityBonus;
    }
    return acc;
  }, { ...DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS });
}

export function filterActiveCultivationConsumables(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): ActiveCultivationConsumable[] {
  return consumables.filter((entry) => entry.expiresAt > now).map((entry) => ({ ...entry }));
}

export function getNextCultivationConsumableExpiryAt(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): number | null {
  let nextExpiryAt: number | null = null;
  for (const entry of consumables) {
    if (!Number.isFinite(entry.expiresAt) || entry.expiresAt <= now) continue;
    if (nextExpiryAt === null || entry.expiresAt < nextExpiryAt) {
      nextExpiryAt = entry.expiresAt;
    }
  }
  return nextExpiryAt;
}

function toReadModelEntry(entry: ActiveCultivationConsumable, now: number): CultivationConsumableReadModelEntry {
  const familyDef = CULTIVATION_CONSUMABLE_FAMILY_REGISTRY[entry.family];
  const spec = getConsumableSpec(entry.itemId);
  return {
    itemId: entry.itemId,
    family: entry.family,
    familyLabel: familyDef.label,
    shortLabel: spec?.shortLabel ?? familyDef.shortLabel,
    description: familyDef.description,
    activatedAt: entry.activatedAt,
    expiresAt: entry.expiresAt,
    remainingMs: Math.max(0, entry.expiresAt - now),
    modifiers: { ...entry.modifiers },
    consumedOnMajorBreakthrough: !!entry.consumedOnMajorBreakthrough,
  };
}

export function buildCultivationConsumableReadModel(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): CultivationConsumableReadModel {
  const active = filterActiveCultivationConsumables(consumables, now)
    .map((entry) => toReadModelEntry(entry, now))
    .sort((a, b) => {
      const familyOrder = CULTIVATION_CONSUMABLE_FAMILY_REGISTRY[a.family].sortOrder - CULTIVATION_CONSUMABLE_FAMILY_REGISTRY[b.family].sortOrder;
      if (familyOrder !== 0) return familyOrder;
      return a.expiresAt - b.expiresAt;
    });

  const activeByFamily = active.reduce<CultivationConsumableReadModel['activeByFamily']>((acc, entry) => {
    acc[entry.family] = entry;
    return acc;
  }, {});

  return {
    now,
    entries: active,
    activeByFamily,
    modifiers: mergeCultivationConsumableModifiers(consumables, now),
  };
}

export function buildCultivationConsumableCarryoverWindows(
  consumables: readonly ActiveCultivationConsumable[],
  startAt: number,
  endAt: number,
): CultivationConsumableCarryoverWindow[] {
  if (endAt <= startAt) return [];

  const relevant = consumables
    .filter((entry) => entry.expiresAt > startAt && entry.activatedAt < endAt)
    .map((entry) => ({ ...entry }));
  const checkpoints = new Set<number>([startAt, endAt]);
  relevant.forEach((entry) => {
    if (entry.activatedAt > startAt && entry.activatedAt < endAt) checkpoints.add(entry.activatedAt);
    if (entry.expiresAt > startAt && entry.expiresAt < endAt) checkpoints.add(entry.expiresAt);
  });

  const ordered = Array.from(checkpoints).sort((a, b) => a - b);
  const windows: CultivationConsumableCarryoverWindow[] = [];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const windowStart = ordered[index] ?? startAt;
    const windowEnd = ordered[index + 1] ?? endAt;
    if (windowEnd <= windowStart) continue;
    const readModel = buildCultivationConsumableReadModel(relevant.filter((entry) => entry.activatedAt <= windowStart), windowStart);
    windows.push({
      startedAt: windowStart,
      endedAt: windowEnd,
      elapsedMs: windowEnd - windowStart,
      modifiers: readModel.modifiers,
      activeFamilies: readModel.entries.map((entry) => entry.family),
    });
  }

  return windows;
}
