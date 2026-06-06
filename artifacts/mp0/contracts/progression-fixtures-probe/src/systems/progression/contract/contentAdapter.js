import { resolveCanonicalTrialFailSafe } from '../../../content/trialFailSafe.js';
const readTrials = (raw) => (Array.isArray(raw.trials) ? raw.trials : raw.trials.trials);
const readItems = (raw) => (Array.isArray(raw.items) ? raw.items : raw.items.items);
export const adaptProgressionAuthoredContent = (raw) => ({
    economy: {
        majorRealms: raw.economy.majorRealms.map((realm) => ({ id: realm.id, index: realm.index })),
    },
    cities: (Array.isArray(raw.cities) ? raw.cities : raw.cities.cities).map((city) => ({
        id: city.id,
        unlockMajorRealm: city.unlockMajorRealm,
    })),
    trials: readTrials(raw).map((trial) => {
        const rule = trial.eligibilityRule && typeof trial.eligibilityRule === 'object'
            ? { fromMajorRealm: trial.eligibilityRule.fromMajorRealm }
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
