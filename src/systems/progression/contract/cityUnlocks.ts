import type { CityUnlockContract } from './contractTypes.js';

export const sortCityUnlocks = (unlocks: CityUnlockContract[]): CityUnlockContract[] =>
  [...unlocks].sort((a, b) => a.cityId.localeCompare(b.cityId));
