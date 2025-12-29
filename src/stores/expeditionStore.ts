import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RewardService, type RewardBundle } from '../services/rewards';
import { useContentStore } from './contentStore';
import { multiply } from '../utils/numbers';
import { normalizeItemList } from '../utils/itemList';
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
  status: ExpeditionRunStatus;
}

interface ExpeditionState {
  slots: number;
  active: ExpeditionRun[];
  setSlots: (slots: number) => void;
  start: (slotIndex: number, typeId: string, durationId: string, cityId: string, cityIndex: number) => boolean;
  claim: (slotIndex: number) => boolean;
  tick: (now: number) => void;
}

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

function findDurationSeconds(durationId: string): { seconds: number; efficiencyMult?: number } | null {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return null;
  const duration = content.durations.find((entry) => entry.id === durationId);
  if (!duration) return null;
  return { seconds: duration.seconds, efficiencyMult: duration.efficiencyMult };
}

function findTypeYieldTags(typeId: string): string[] {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return [];
  const entry = content.types.find((type) => type.id === typeId);
  return entry?.yieldTags ?? [];
}

function findCityYieldBundles(cityIndex: number, tags: string[]): RewardBundle[] {
  const content = useContentStore.getState().raw?.expeditions;
  if (!content) return [];
  const yields = content.cityYields.find((entry) => entry.cityIndex === cityIndex);
  if (!yields) return [];
  return tags.map((tag) => yields.yieldsByTag?.[tag]).filter(Boolean) as RewardBundle[];
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

      const duration = findDurationSeconds(durationId);
      if (!duration || duration.seconds <= 0) return false;

      const now = Date.now();
      const endsAt = now + duration.seconds * 1000;

      const run: ExpeditionRun = {
        slotIndex,
        expeditionTypeId: typeId,
        durationId,
        cityId,
        cityIndex,
        startedAt: now,
        endsAt,
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
      if (!run) return false;
      const now = Date.now();
      if (run.status !== 'complete' && now < run.endsAt) return false;

      const yieldTags = findTypeYieldTags(run.expeditionTypeId);
      if (yieldTags.length === 0) return false;

      const bundles = findCityYieldBundles(run.cityIndex, yieldTags);
      if (bundles.length === 0) return false;

      const baseBundle = mergeRewardBundles(bundles);
      const efficiencyMult = findDurationSeconds(run.durationId)?.efficiencyMult;
      const finalBundle = applyEfficiency(baseBundle, efficiencyMult);

      RewardService.grantRewards(
        finalBundle,
        `expedition_claim:${run.expeditionTypeId}:${run.durationId}:city=${run.cityId}`,
      );

      useBountyStore.getState().recordEvent({ type: 'EXPEDITION_COMPLETE', cityId: run.cityId, amount: 1 });

      set((state) => {
        state.active = state.active.filter((entry) => entry.slotIndex !== slotIndex);
      });

      return true;
    },
  })),
);
