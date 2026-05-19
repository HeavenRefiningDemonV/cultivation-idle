import type { PrestigeUpgradeDef } from '../../content/index.js';

export type { PrestigeUpgradeDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { SEMESTER_SLOT_CAPS } from '../builds/index.js';
import { BASE_ACTIVE_SLOTS, useTechniqueStore } from '../../stores/techniqueStore.js';
import { getVisiblePrestigeUpgrades } from './runtime/prestigeRuntimeCatalog.js';

type PrestigeDerivedUnlocks = {
  extraTechniqueSlots: number;
  expeditionSlots: number;
  unlockedHeartLawIds: string[];
};

const BASE_EXPEDITION_SLOTS = 1;

function getNumericEffect(effect: unknown, key: string): number | null {
  if (!effect || typeof effect !== 'object') return null;
  const record = effect as Record<string, unknown>;
  if (typeof record[key] === 'number') return record[key] as number;
  return null;
}

function applyEffectAccumulator(
  effect: unknown,
  level: number,
  totals: { extraTechniqueSlots: number },
) {
  const extraTechniqueSlots = getNumericEffect(effect, 'extraTechniqueSlots');
  if (extraTechniqueSlots) {
    totals.extraTechniqueSlots += extraTechniqueSlots * level;
  }
}

function getUpgradeLevel(purchases: Record<string, number> | undefined, id: string): number {
  return purchases?.[id] ?? 0;
}

export function computePrestigeDerivedUnlocks(
  purchases: Record<string, number> | undefined,
): PrestigeDerivedUnlocks {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw?.prestige_store) {
    return {
      extraTechniqueSlots: 0,
      expeditionSlots: 0,
      unlockedHeartLawIds: [],
    };
  }

  const upgrades = getVisiblePrestigeUpgrades(content.raw);
  const unlockedTiers = new Set<string>();
  const totals = { extraTechniqueSlots: 0 };

  upgrades.forEach((def: PrestigeUpgradeDef) => {
    const level = getUpgradeLevel(purchases, def.id);
    if (level <= 0) return;

    if (def.unlocks && def.unlocks.length > 0) {
      def.unlocks.forEach((unlock) => unlockedTiers.add(unlock));
    }

    applyEffectAccumulator(def.effect, level, totals);
    applyEffectAccumulator(def.effectPerLevel, level, totals);
  });

  const heartLaws = content.raw.heart_laws ?? [];
  const unlockedHeartLawIds = heartLaws
    .filter((law) => law.tier && unlockedTiers.has(law.tier))
    .map((law) => law.id);

  return {
    extraTechniqueSlots: totals.extraTechniqueSlots,
    expeditionSlots: 0,
    unlockedHeartLawIds,
  };
}

export function applyPrestigeDerivedUnlocks(derived: PrestigeDerivedUnlocks) {
  const techniqueStore = useTechniqueStore.getState();
  const expeditionStore = useExpeditionStore.getState();
  const heartLawStore = useHeartLawStore.getState();

  const activeSlots = Math.min(
    SEMESTER_SLOT_CAPS.active,
    BASE_ACTIVE_SLOTS + Math.max(0, Math.floor(derived.extraTechniqueSlots)),
  );
  techniqueStore.setSlotCounts({ active: activeSlots });

  const expeditionSlots = BASE_EXPEDITION_SLOTS + Math.max(0, Math.floor(derived.expeditionSlots));
  expeditionStore.setSlots(expeditionSlots);

  const nextHeartLawIds = Array.from(new Set(derived.unlockedHeartLawIds));
  const current = heartLawStore.unlockedHeartLawIds;
  const shouldUpdate =
    nextHeartLawIds.length !== current.length ||
    nextHeartLawIds.some((id) => !current.includes(id));
  if (shouldUpdate) {
    heartLawStore.setUnlocked(nextHeartLawIds);
  }
}

export function recomputeAndApplyPrestigeUnlocks(purchases: Record<string, number> | undefined) {
  const derived = computePrestigeDerivedUnlocks(purchases);
  applyPrestigeDerivedUnlocks(derived);
}
