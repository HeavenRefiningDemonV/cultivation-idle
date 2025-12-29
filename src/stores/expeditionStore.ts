import Decimal from 'decimal.js';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RewardService, type RewardBundle } from '../services/rewards';
import { useContentStore } from './contentStore';
import { multiply } from '../utils/numbers';
import { normalizeItemList } from '../utils/itemList';
import { randFloat } from '../utils/rng';
import { useBountyStore } from './bountyStore';

export type ExpeditionRunStatus = 'running' | 'complete';

export interface ExpeditionRun {
  slotIndex: number;
  expeditionTypeId: string;
  durationId: string;
  cityId: string;
  cityIndex: number;
  startedAt: number;
  endsAt: number;
  seed: number;
  status: ExpeditionRunStatus;
}

interface ExpeditionState {
  slots: number;
  active: ExpeditionRun[];
  setSlots: (slots: number) => void;
  start: (slotIndex: number, typeId: string, durationId: string, cityId: string, cityIndex: number) => boolean;
  claim: (slotIndex: number) => ClaimExpeditionResult;
  tick: (now: number) => void;
}

type ClaimExpeditionResult = {
  ok: boolean;
  error?: string;
  run?: ExpeditionRun;
  expected?: RewardBundle;
  rolled?: RewardBundle;
  rareDrop?: { itemId: string; qty: number } | null;
  spotlightItemId?: string | null;
};

type RewardCurrencyBundle = NonNullable<RewardBundle['currencies']>;

function mergeCurrency(target: RewardCurrencyBundle, source: RewardCurrencyBundle) {
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const value = source[key];
    if (!value) return;
    const current = target[key] ?? '0';
    target[key] = multiply(current, 1).plus(multiply(value, 1)).toString();
  });
}

function mergeRewardBundles(bundles: RewardBundle[]): RewardBundle {
  const merged: RewardBundle = {};

  bundles.forEach((bundle) => {
    if (!bundle) return;

    if (bundle.currencies) {
      merged.currencies = merged.currencies ?? {};
      mergeCurrency(merged.currencies, bundle.currencies);
    }

    const items = normalizeItemList(bundle.items);
    if (items.length > 0) {
      merged.items = merged.items ?? [];
      merged.items.push(...items.map((item) => ({ ...item })));
    }

    if (bundle.techniqueFragments && bundle.techniqueFragments.length > 0) {
      merged.techniqueFragments = merged.techniqueFragments ?? [];
      merged.techniqueFragments.push(...bundle.techniqueFragments.map((fragment) => ({ ...fragment })));
    }

    if (typeof bundle.comprehension === 'number') {
      merged.comprehension = (merged.comprehension ?? 0) + bundle.comprehension;
    }
  });

  return merged;
}

function applyEfficiency(bundle: RewardBundle, efficiencyMult?: number): RewardBundle {
  if (!efficiencyMult || efficiencyMult === 1) return bundle;
  const normalizedItems = normalizeItemList(bundle.items);
  const next: RewardBundle = {
    currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
    items: normalizedItems.length > 0 ? normalizedItems.map((item) => ({ ...item })) : undefined,
    techniqueFragments: bundle.techniqueFragments
      ? bundle.techniqueFragments.map((fragment) => ({ ...fragment }))
      : undefined,
    comprehension: bundle.comprehension,
  };

  if (next.currencies) {
    (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
      const value = next.currencies?.[key];
      if (!value) return;
      next.currencies![key] = multiply(value, efficiencyMult).floor().toString();
    });
  }

  if (next.items) {
    next.items = next.items.map((item) => ({
      ...item,
      qty: Math.max(0, Math.floor(item.qty * efficiencyMult)),
    }));
  }

  if (next.techniqueFragments) {
    next.techniqueFragments = next.techniqueFragments.map((fragment) => ({
      ...fragment,
      qty: Math.max(0, Math.floor(fragment.qty * efficiencyMult)),
    }));
  }

  if (typeof next.comprehension === 'number') {
    next.comprehension = Math.floor(next.comprehension * efficiencyMult);
  }

  return next;
}

function findDurationDef(durationId: string):
  | ({ seconds: number; efficiencyMult?: number; variancePct?: number; rareChance?: number } & Record<string, any>)
  | null {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return null;
  const duration = content.durations.find((entry) => entry.id === durationId);
  if (!duration) return null;
  return duration as { seconds: number; efficiencyMult?: number; variancePct?: number; rareChance?: number };
}

function findTypeYieldTags(typeId: string): string[] {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return [];
  const entry = content.types.find((type) => type.id === typeId);
  return entry?.yieldTags ?? [];
}

function findTypeDef(typeId: string) {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return null;
  return content.types.find((type) => type.id === typeId) ?? null;
}

function findCityYieldBundles(cityIndex: number, tags: string[]): RewardBundle[] {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return [];
  const yields = content.cityYields.find((entry) => entry.cityIndex === cityIndex);
  if (!yields) return [];
  return tags.map((tag) => yields.yieldsByTag?.[tag]).filter(Boolean) as RewardBundle[];
}

function collapseRewardBundle(bundle: RewardBundle): RewardBundle {
  const normalizedItems = normalizeItemList(bundle.items);
  const itemTotals: Record<string, number> = {};
  normalizedItems.forEach((item) => {
    if (!item.itemId || !Number.isFinite(item.qty) || item.qty <= 0) return;
    itemTotals[item.itemId] = (itemTotals[item.itemId] ?? 0) + item.qty;
  });

  const fragmentTotals: Record<string, number> = {};
  bundle.techniqueFragments?.forEach((fragment) => {
    if (!fragment.techId || !Number.isFinite(fragment.qty) || fragment.qty <= 0) return;
    fragmentTotals[fragment.techId] = (fragmentTotals[fragment.techId] ?? 0) + fragment.qty;
  });

  const collapsed: RewardBundle = {
    currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
    items: Object.entries(itemTotals).map(([itemId, qty]) => ({ itemId, qty })),
    techniqueFragments: Object.entries(fragmentTotals).map(([techId, qty]) => ({ techId, qty })),
    comprehension: bundle.comprehension,
    manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
  };

  if (collapsed.items && collapsed.items.length === 0) delete collapsed.items;
  if (collapsed.techniqueFragments && collapsed.techniqueFragments.length === 0)
    delete collapsed.techniqueFragments;
  if (collapsed.currencies && Object.keys(collapsed.currencies).length === 0) delete collapsed.currencies;
  if (collapsed.manuals && collapsed.manuals.length === 0) delete collapsed.manuals;

  return collapsed;
}

function computeExpectedBundle(run: ExpeditionRun): RewardBundle | null {
  const yieldTags = findTypeYieldTags(run.expeditionTypeId);
  if (yieldTags.length === 0) return null;

  const bundles = findCityYieldBundles(run.cityIndex, yieldTags);
  if (bundles.length === 0) return null;

  const baseBundle = mergeRewardBundles(bundles);
  const efficiencyMult = findDurationDef(run.durationId)?.efficiencyMult;
  const finalBundle = applyEfficiency(baseBundle, efficiencyMult);

  return collapseRewardBundle(finalBundle);
}

function rollVariance(bundle: RewardBundle, variancePct: number, seed: number): { bundle: RewardBundle; seed: number } {
  const clampedVariance = Math.max(0, Math.min(0.5, variancePct));
  let currentSeed = seed >>> 0;

  const next: RewardBundle = {
    currencies: bundle.currencies ? {} : undefined,
    items: [],
    techniqueFragments: [],
    comprehension: bundle.comprehension,
    manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
  };

  if (bundle.currencies) {
    (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
      const value = bundle.currencies?.[key];
      if (!value) return;
      const base = multiply(value, 1);
      if (!base.greaterThan(0)) return;
      const roll = randFloat(currentSeed);
      currentSeed = roll.seed;
      const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
      const rolled = base.times(multiplier);
      const rounded = rolled.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      if (rounded.greaterThan(0)) {
        next.currencies![key] = rounded.lessThan(1) ? '1' : rounded.toString();
      }
    });
    if (next.currencies && Object.keys(next.currencies).length === 0) {
      delete next.currencies;
    }
  }

  const items = normalizeItemList(bundle.items);
  items.forEach((item) => {
    if (!item.itemId || !Number.isFinite(item.qty) || item.qty <= 0) return;
    const roll = randFloat(currentSeed);
    currentSeed = roll.seed;
    const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
    const rolledQty = Math.max(1, Math.round(item.qty * multiplier));
    if (rolledQty > 0) {
      next.items!.push({ ...item, qty: rolledQty });
    }
  });
  if (next.items && next.items.length === 0) delete next.items;

  bundle.techniqueFragments?.forEach((fragment) => {
    if (!fragment.techId || !Number.isFinite(fragment.qty) || fragment.qty <= 0) return;
    const roll = randFloat(currentSeed);
    currentSeed = roll.seed;
    const multiplier = (1 - clampedVariance) + roll.value * (2 * clampedVariance);
    const rolledQty = Math.max(1, Math.round(fragment.qty * multiplier));
    if (rolledQty > 0) {
      next.techniqueFragments!.push({ ...fragment, qty: rolledQty });
    }
  });
  if (next.techniqueFragments && next.techniqueFragments.length === 0) delete next.techniqueFragments;

  return { bundle: collapseRewardBundle(next), seed: currentSeed >>> 0 };
}

function rollRareDrop(typeId: string, durationId: string, seed: number): {
  hit: boolean;
  drop: { itemId: string; qty: number } | null;
  seed: number;
} {
  const typeDef = findTypeDef(typeId);
  const durationDef = findDurationDef(durationId);
  const rareChance = durationDef?.rareChance ?? 0;
  const drops = typeDef?.rareDrops;
  if (!drops || drops.length === 0 || rareChance <= 0) {
    return { hit: false, drop: null, seed };
  }

  let currentSeed = seed >>> 0;
  const roll = randFloat(currentSeed);
  currentSeed = roll.seed;
  if (roll.value >= rareChance) {
    return { hit: false, drop: null, seed: currentSeed };
  }

  const totalWeight = drops.reduce((sum, entry) => {
    const weight = Number.isFinite(entry.weight) && entry.weight !== undefined ? Number(entry.weight) : 1;
    const safeWeight = weight > 0 ? weight : 1;
    return sum + safeWeight;
  }, 0);

  if (totalWeight <= 0) {
    return { hit: false, drop: null, seed: currentSeed };
  }
  const pickRoll = randFloat(currentSeed);
  currentSeed = pickRoll.seed;
  let cursor = pickRoll.value * totalWeight;
  for (const entry of drops) {
    const weight = Number.isFinite(entry.weight) && entry.weight !== undefined ? Number(entry.weight) : 1;
    const safeWeight = weight > 0 ? weight : 1;
    cursor -= safeWeight;
    if (cursor <= 0) {
      return { hit: true, drop: { itemId: entry.itemId, qty: entry.qty }, seed: currentSeed };
    }
  }

  const fallback = drops[drops.length - 1];
  return { hit: true, drop: { itemId: fallback.itemId, qty: fallback.qty }, seed: currentSeed };
}

function selectBestDropSpotlight(bundle: RewardBundle, rareDrop?: { itemId: string; qty: number } | null) {
  if (rareDrop) return rareDrop.itemId;
  const items = normalizeItemList(bundle.items);
  if (items.length === 0) return null;

  const itemsById = useContentStore.getState().maps.itemsById;
  let bestId: string | null = null;
  let bestScore = -Infinity;

  items.forEach((item) => {
    const def = itemsById[item.itemId];
    const sellValue = def?.sellValue;
    const score = Number.isFinite(sellValue) ? sellValue * item.qty : item.qty;
    if (score > bestScore) {
      bestScore = score;
      bestId = item.itemId;
    }
  });

  return bestId;
}

export const useExpeditionStore = create<ExpeditionState>()(
  immer((set, get) => ({
    slots: 1,
    active: [],

    setSlots: (slots) => {
      const nextSlots = Number.isFinite(slots) ? Math.max(1, Math.floor(slots)) : 1;
      if (nextSlots === get().slots) return;
      set((state) => {
        state.slots = nextSlots;
        state.active = state.active.filter((run) => run.slotIndex < nextSlots);
      });
    },

    start: (slotIndex, typeId, durationId, cityId, cityIndex) => {
      const { slots, active } = get();
      if (slotIndex < 0 || slotIndex >= slots) return false;
      if (active.some((run) => run.slotIndex === slotIndex)) return false;

      const duration = findDurationDef(durationId);
      if (!duration || duration.seconds <= 0) return false;

      const now = Date.now();
      const endsAt = now + duration.seconds * 1000;
      const seed = (Math.random() * 0x100000000) >>> 0;

      const run: ExpeditionRun = {
        slotIndex,
        expeditionTypeId: typeId,
        durationId,
        cityId,
        cityIndex,
        startedAt: now,
        endsAt,
        seed,
        status: 'running',
      };

      set((state) => {
        state.active.push(run);
      });

      return true;
    },

    tick: (now) => {
      set((state) => {
        state.active.forEach((run) => {
          if (run.status === 'running' && now >= run.endsAt) {
            run.status = 'complete';
          }
        });
      });
    },

    claim: (slotIndex) => {
      const run = get().active.find((entry) => entry.slotIndex === slotIndex);
      if (!run) return { ok: false, error: 'not_found' };
      const now = Date.now();
      if (run.status !== 'complete' && now < run.endsAt) return { ok: false, error: 'not_complete', run };

      const expected = computeExpectedBundle(run);
      if (!expected) return { ok: false, error: 'invalid_yield', run };

      const durationDef = findDurationDef(run.durationId);
      const variancePct = durationDef?.variancePct ?? 0.15;

      const startSeed = typeof run.seed === 'number' ? run.seed >>> 0 : ((run.startedAt ?? Date.now()) >>> 0);
      const varianceResult = rollVariance(expected, variancePct, startSeed);
      const rareResult = rollRareDrop(run.expeditionTypeId, run.durationId, varianceResult.seed);

      let rolledBundle = varianceResult.bundle;
      if (rareResult.hit && rareResult.drop) {
        rolledBundle = collapseRewardBundle(
          mergeRewardBundles([
            rolledBundle,
            {
              items: [{ itemId: rareResult.drop.itemId, qty: rareResult.drop.qty }],
            },
          ]),
        );
      }

      const spotlightItemId = selectBestDropSpotlight(rolledBundle, rareResult.hit ? rareResult.drop : null);

      RewardService.grantRewards(
        rolledBundle,
        `expedition_claim:${run.expeditionTypeId}:${run.durationId}:city=${run.cityId}`,
      );

      useBountyStore.getState().recordEvent({ type: 'EXPEDITION_COMPLETE', cityId: run.cityId, amount: 1 });

      set((state) => {
        state.active = state.active.filter((entry) => entry.slotIndex !== slotIndex);
      });

      return {
        ok: true,
        run,
        expected,
        rolled: rolledBundle,
        rareDrop: rareResult.hit ? rareResult.drop : null,
        spotlightItemId,
      };
    },
  })),
);
