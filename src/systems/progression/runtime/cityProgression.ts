import type { ValidatedContent } from '../../../content/index.js';
import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import {
  getCityUnlockForRealm,
  getContentCapRealm,
  getProgressionContract,
  type CityUnlockContract,
  type MajorRealmId,
  type ProgressionContract,
} from '../contract/index.js';
import { getLiveRealmNameById } from './liveRealmProjection.js';

const getContract = (content: ValidatedContent | null | undefined): ProgressionContract | null => {
  if (!content) return null;
  try {
    return getProgressionContract(adaptProgressionAuthoredContent(content));
  } catch (error) {
    console.warn('[CityProgression] Failed to load progression contract', error);
    return null;
  }
};

const sortUnlocksByRealm = (
  contract: ProgressionContract,
  unlocks: CityUnlockContract[],
): CityUnlockContract[] =>
  [...unlocks].sort((a, b) => {
    const realmDelta =
      (contract.majorRealms[a.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER) -
      (contract.majorRealms[b.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER);
    if (realmDelta !== 0) return realmDelta;
    return a.cityId.localeCompare(b.cityId);
  });

export const getCityUnlockForRealmEntry = (
  contract: ProgressionContract,
  majorRealmId: MajorRealmId,
): CityUnlockContract | null => getCityUnlockForRealm(contract, majorRealmId);

export const getUnlockedCitiesForEnteredRealms = (
  contract: ProgressionContract,
  enteredRealmIds: MajorRealmId[],
): string[] => {
  const entered = new Set(enteredRealmIds);
  return sortUnlocksByRealm(
    contract,
    contract.cityUnlocks.filter((unlock) => entered.has(unlock.unlockOnRealmEntry)),
  ).map((unlock) => unlock.cityId);
};

export const isCityProgressionCapRealm = (
  contract: ProgressionContract,
  majorRealmId: MajorRealmId,
): boolean => getContentCapRealm(contract) === majorRealmId && getCityUnlockForRealmEntry(contract, majorRealmId) === null;

export const getCityUnlockRequirementText = (
  contract: ProgressionContract,
  cityId: string,
): string | null => {
  const unlock = contract.cityUnlocks.find((entry) => entry.cityId === cityId);
  if (!unlock) return null;
  return `Reach ${getLiveRealmNameById(unlock.unlockOnRealmEntry)}`;
};

export const syncCityStateToRealmEntry = ({
  contract,
  majorRealmId,
  unlockedCityIds,
}: {
  contract: ProgressionContract;
  majorRealmId: MajorRealmId;
  unlockedCityIds: string[];
}): {
  unlockedCityIds: string[];
  newlyUnlockedCityIds: string[];
  currentCityId: string | null;
  cityUnlock: CityUnlockContract | null;
  isCapRealm: boolean;
} => {
  const targetRealmIndex = contract.majorRealms[majorRealmId]?.index ?? -1;
  const unlockedByRealm = sortUnlocksByRealm(
    contract,
    contract.cityUnlocks.filter((unlock) => (contract.majorRealms[unlock.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER) <= targetRealmIndex),
  );
  const merged = new Set(unlockedCityIds);
  const newlyUnlockedCityIds: string[] = [];

  for (const unlock of unlockedByRealm) {
    if (merged.has(unlock.cityId)) continue;
    merged.add(unlock.cityId);
    newlyUnlockedCityIds.push(unlock.cityId);
  }

  return {
    unlockedCityIds: unlockedByRealm.map((unlock) => unlock.cityId),
    newlyUnlockedCityIds,
    currentCityId: newlyUnlockedCityIds.at(-1) ?? null,
    cityUnlock: getCityUnlockForRealmEntry(contract, majorRealmId),
    isCapRealm: isCityProgressionCapRealm(contract, majorRealmId),
  };
};

export const getRuntimeCityUnlockForRealmEntry = (
  content: ValidatedContent | null | undefined,
  majorRealmId: MajorRealmId,
): CityUnlockContract | null => {
  const contract = getContract(content);
  if (!contract) return null;
  return getCityUnlockForRealmEntry(contract, majorRealmId);
};

export const getRuntimeUnlockedCitiesForEnteredRealms = (
  content: ValidatedContent | null | undefined,
  enteredRealmIds: MajorRealmId[],
): string[] => {
  const contract = getContract(content);
  if (!contract) return [];
  return getUnlockedCitiesForEnteredRealms(contract, enteredRealmIds);
};

export const isRuntimeCityProgressionCapRealm = (
  content: ValidatedContent | null | undefined,
  majorRealmId: MajorRealmId,
): boolean => {
  const contract = getContract(content);
  if (!contract) return false;
  return isCityProgressionCapRealm(contract, majorRealmId);
};

export const syncRuntimeCityStateToRealmEntry = (
  content: ValidatedContent | null | undefined,
  majorRealmId: MajorRealmId,
  unlockedCityIds: string[],
) => {
  const contract = getContract(content);
  if (!contract) {
    return {
      unlockedCityIds: [...unlockedCityIds],
      newlyUnlockedCityIds: [] as string[],
      currentCityId: null,
      cityUnlock: null,
      isCapRealm: false,
    };
  }
  return syncCityStateToRealmEntry({ contract, majorRealmId, unlockedCityIds });
};
