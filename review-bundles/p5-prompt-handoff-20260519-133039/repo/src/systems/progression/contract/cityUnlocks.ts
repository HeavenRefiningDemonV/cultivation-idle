import type { CityUnlockContract } from './contractTypes.js';

export const SEMESTER_0_CITY_UNLOCKS: CityUnlockContract[] = [
  { cityId: 'city_pinewind_hamlet', unlockOnRealmEntry: 'qi_condensation' },
  { cityId: 'city_stonecrag_town', unlockOnRealmEntry: 'foundation_establishment' },
  { cityId: 'city_spirit_cavern_city', unlockOnRealmEntry: 'core_formation' },
  { cityId: 'city_lotusford', unlockOnRealmEntry: 'nascent_soul' },
  { cityId: 'city_ironpeak_bastion', unlockOnRealmEntry: 'soul_formation' },
];

export const sortCityUnlocks = (unlocks: CityUnlockContract[]): CityUnlockContract[] =>
  [...unlocks].sort((a, b) => a.cityId.localeCompare(b.cityId));
