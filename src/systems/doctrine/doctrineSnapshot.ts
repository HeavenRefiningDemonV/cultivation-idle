import { useCityStore } from '../../stores/cityStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import {
  SEMESTER_SLICE_CONTRACT,
  type MajorRealmId,
} from '../progression/contract/index.js';
import {
  clampRealmIndexToSemesterSlice,
  getLiveRealmByIndex,
} from '../progression/runtime/index.js';
import { buildSelectedTechniqueLoadoutSnapshot } from '../builds/loadoutSnapshot.js';
import type {
  DoctrineSnapshot,
  DoctrineSourceFlags,
  DoctrineSnapshotWarnings,
} from './doctrineTypes.js';

const FALLBACK_AI_PROFILE = 'balanced';
const FALLBACK_CASTING_POLICY = 'balanced';
const LIVE_CITY_IDS = new Set<string>(SEMESTER_SLICE_CONTRACT.liveCityIds);

function normalizeHeartLawChapter(chapter: number): number {
  if (!Number.isFinite(chapter)) {
    return 1;
  }

  return Math.max(1, Math.floor(chapter));
}

function resolveDoctrineRealmIndex(realmIndex: number): number {
  return clampRealmIndexToSemesterSlice(realmIndex);
}

function resolveDoctrineMajorRealmId(realmIndex: number): MajorRealmId {
  return getLiveRealmByIndex(realmIndex).id;
}

function resolveDoctrineCityId(): string | null {
  const cityState = useCityStore.getState();
  const { currentCityId, unlockedCityIds } = cityState;

  if (typeof currentCityId !== 'string' || currentCityId.trim().length === 0) {
    return null;
  }

  if (!LIVE_CITY_IDS.has(currentCityId)) {
    return null;
  }

  if (unlockedCityIds.length > 0 && !unlockedCityIds.includes(currentCityId)) {
    return null;
  }

  return currentCityId;
}

function resolveDoctrineLoadout(): {
  selectedLoadoutId: string | null;
  aiProfile: DoctrineSnapshot['aiProfile'];
  castingPolicy: DoctrineSnapshot['castingPolicy'];
} {
  const snapshot = buildSelectedTechniqueLoadoutSnapshot();

  return {
    selectedLoadoutId: snapshot.selectedLoadoutId,
    aiProfile: snapshot.aiProfile ?? FALLBACK_AI_PROFILE,
    castingPolicy: snapshot.castingPolicy ?? FALLBACK_CASTING_POLICY,
  };
}

export function buildDoctrineSnapshot(): DoctrineSnapshot {
  const gameState = useGameStore.getState();
  const cultivationState = useCultivationStore.getState();
  const prestigeState = usePrestigeStore.getState();

  const realmIndex = resolveDoctrineRealmIndex(gameState.realm.index);
  const loadout = resolveDoctrineLoadout();

  return {
    path: gameState.selectedPath,
    focusMode: gameState.focusMode,
    spiritRoot: prestigeState.spiritRoot,
    heartLawId: cultivationState.selectedHeartLawId,
    heartLawChapter: normalizeHeartLawChapter(cultivationState.chapter),
    breathMode: cultivationState.breathMode,
    selectedLoadoutId: loadout.selectedLoadoutId,
    aiProfile: loadout.aiProfile,
    castingPolicy: loadout.castingPolicy,
    realmIndex,
    majorRealmId: resolveDoctrineMajorRealmId(realmIndex),
    cityId: resolveDoctrineCityId(),
  };
}

export function getDoctrineSourceFlags(snapshot: DoctrineSnapshot): DoctrineSourceFlags {
  return {
    hasPath: snapshot.path !== null,
    hasHeartLaw: snapshot.heartLawId !== null,
    hasSpiritRoot: snapshot.spiritRoot !== null,
    hasLoadout: snapshot.selectedLoadoutId !== null,
    hasCity: snapshot.cityId !== null,
  };
}

export function getDoctrineSnapshotWarnings(snapshot: DoctrineSnapshot): DoctrineSnapshotWarnings {
  const flags = getDoctrineSourceFlags(snapshot);

  return {
    missingPath: !flags.hasPath,
    missingHeartLaw: !flags.hasHeartLaw,
    missingLoadout: !flags.hasLoadout,
    missingSpiritRoot: !flags.hasSpiritRoot,
  };
}
