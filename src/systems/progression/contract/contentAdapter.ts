import type { EconomyConfig } from '../../../content/types.js';
import type { ProgressionAuthoredContent } from './contractTypes.js';
import { resolveCanonicalTrialFailSafe } from '../../../content/trialFailSafe.js';

export interface RawProgressionContentLike {
  economy: EconomyConfig;
  cities: Array<{ id: string; unlockMajorRealm: string }> | { cities: Array<{ id: string; unlockMajorRealm: string }> };
  trials:
    | Array<{
        id: string;
        cityId: string;
        cityIndex?: number;
        gatesToMajorRealm?: string;
        gateItemId: string;
        eligibilityRule?: unknown;
        failSafe?: {
          thresholdAttempts?: number;
          cost?: { gold?: string | number; spiritStones?: string | number; merit?: string | number };
        };
        failSafePurchase?: {
          enabled?: boolean;
          afterEligibleFails?: number;
          costRef?: string;
        };
      }>
    | {
        trials: Array<{
          id: string;
          cityId: string;
          cityIndex?: number;
          gatesToMajorRealm?: string;
          gateItemId: string;
          eligibilityRule?: unknown;
          failSafe?: {
            thresholdAttempts?: number;
            cost?: { gold?: string | number; spiritStones?: string | number; merit?: string | number };
          };
          failSafePurchase?: {
            enabled?: boolean;
            afterEligibleFails?: number;
            costRef?: string;
          };
        }>;
      };
  items: Array<{ id: string }> | { items: Array<{ id: string }> };
  prestige_store?: { upgrades?: Array<{ id: string }> } | { upgrades: Array<{ id: string }> };
}

const readTrials = (raw: RawProgressionContentLike) => (Array.isArray(raw.trials) ? raw.trials : raw.trials.trials);
const readItems = (raw: RawProgressionContentLike) => (Array.isArray(raw.items) ? raw.items : raw.items.items);

export const adaptProgressionAuthoredContent = (raw: RawProgressionContentLike): ProgressionAuthoredContent => ({
  economy: {
    majorRealms: raw.economy.majorRealms.map((realm) => ({ id: realm.id, index: realm.index })),
  },
  cities: (Array.isArray(raw.cities) ? raw.cities : raw.cities.cities).map((city) => ({
    id: city.id,
    unlockMajorRealm: city.unlockMajorRealm,
  })),
  trials: readTrials(raw).map((trial) => {
    const rule =
      trial.eligibilityRule && typeof trial.eligibilityRule === 'object'
        ? { fromMajorRealm: (trial.eligibilityRule as { fromMajorRealm?: string }).fromMajorRealm }
        : typeof trial.eligibilityRule === 'string'
          ? trial.eligibilityRule
          : undefined;

    return {
      id: trial.id,
      cityId: trial.cityId,
      cityIndex: trial.cityIndex,
      gatesToMajorRealm: trial.gatesToMajorRealm,
      gateItemId: trial.gateItemId,
      eligibilityRule: rule,
      failSafe: resolveCanonicalTrialFailSafe(trial, raw.economy),
    };
  }),
  items: {
    items: readItems(raw).map((item) => ({ id: item.id })),
  },
  prestigeStore: {
    upgrades: raw.prestige_store?.upgrades?.map((upgrade) => ({ id: upgrade.id })) ?? [],
  },
});
