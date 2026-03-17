import type { ProgressionAuthoredContent } from './contractTypes.js';

export interface RawProgressionContentLike {
  economy: { majorRealms: Array<{ id: string; index: number }> };
  cities: Array<{ id: string; unlockMajorRealm: string }> | { cities: Array<{ id: string; unlockMajorRealm: string }> };
  trials: {
    trials: Array<{
      id: string;
      cityId: string;
      gatesToMajorRealm?: string;
      gateItemId: string;
      eligibilityRule?: unknown;
      failSafe?: unknown;
      failSafePurchase?: unknown;
    }>;
  };
  items: { items: Array<{ id: string }> };
  prestige_store?: { upgrades?: Array<{ id: string }> };
}

export const adaptProgressionAuthoredContent = (raw: RawProgressionContentLike): ProgressionAuthoredContent => ({
  economy: {
    majorRealms: raw.economy.majorRealms.map((realm) => ({ id: realm.id, index: realm.index })),
  },
  cities: (Array.isArray(raw.cities) ? raw.cities : raw.cities.cities).map((city) => ({
    id: city.id,
    unlockMajorRealm: city.unlockMajorRealm,
  })),
  trials: raw.trials.trials.map((trial) => {
    const rule =
      trial.eligibilityRule && typeof trial.eligibilityRule === 'object'
        ? { fromMajorRealm: (trial.eligibilityRule as { fromMajorRealm?: string }).fromMajorRealm }
        : typeof trial.eligibilityRule === 'string'
          ? trial.eligibilityRule
          : undefined;

    return {
      id: trial.id,
      cityId: trial.cityId,
      gatesToMajorRealm: trial.gatesToMajorRealm,
      gateItemId: trial.gateItemId,
      eligibilityRule: rule,
      failSafe: trial.failSafe,
      failSafePurchase: trial.failSafePurchase,
    };
  }),
  items: {
    items: raw.items.items.map((item) => ({ id: item.id })),
  },
  prestigeStore: {
    upgrades: raw.prestige_store?.upgrades?.map((upgrade) => ({ id: upgrade.id })) ?? [],
  },
});
