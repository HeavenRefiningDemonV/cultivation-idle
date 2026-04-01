import { useCityStore } from '../../stores/cityStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useTechniqueStore } from '../../stores/techniqueStore.js';
import {
  SEMESTER_SLICE_CONTRACT,
  type MajorRealmId,
} from '../progression/contract/index.js';
import {
  clampRealmIndexToSemesterSlice,
  getLiveRealmByIndex,
} from '../progression/runtime/index.js';
import { getHeartLawProfile } from './heartLawCatalog.js';
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

function clampSpiritRootPurity(purity: number): number {
  if (!Number.isFinite(purity)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor(purity)));
}

function resolveDoctrineRealmIndex(realmIndex: number): { realmIndex: number; clampedRealmIndex: boolean } {
  const normalized = Number.isFinite(realmIndex) ? Math.floor(realmIndex) : 0;
  const clamped = clampRealmIndexToSemesterSlice(normalized);

  return {
    realmIndex: clamped,
    clampedRealmIndex: clamped !== normalized,
  };
}

function resolveDoctrineMajorRealmId(realmIndex: number): MajorRealmId {
  return getLiveRealmByIndex(realmIndex).id;
}

function resolveDoctrineCityId(): { cityId: string | null; invalidCityFiltered: boolean } {
  const cityState = useCityStore.getState();
  const { currentCityId, unlockedCityIds } = cityState;

  if (typeof currentCityId !== 'string' || currentCityId.trim().length === 0) {
    return { cityId: null, invalidCityFiltered: false };
  }

  if (!LIVE_CITY_IDS.has(currentCityId)) {
    return { cityId: null, invalidCityFiltered: true };
  }

  if (unlockedCityIds.length > 0 && !unlockedCityIds.includes(currentCityId)) {
    return { cityId: null, invalidCityFiltered: true };
  }

  return { cityId: currentCityId, invalidCityFiltered: false };
}

function resolveDoctrineLoadout(): {
  selectedLoadoutId: string | null;
  aiProfile: DoctrineSnapshot['aiProfile'];
  castingPolicy: DoctrineSnapshot['castingPolicy'];
  invalidLoadoutFallback: boolean;
} {
  const techniqueState = useTechniqueStore.getState();
  const selectedLoadout =
    techniqueState.getSelectedLoadout() ??
    techniqueState.loadouts.find((loadout) => loadout.id === techniqueState.selectedLoadoutId);

  if (!selectedLoadout) {
    return {
      selectedLoadoutId: null,
      aiProfile: FALLBACK_AI_PROFILE,
      castingPolicy: FALLBACK_CASTING_POLICY,
      invalidLoadoutFallback: true,
    };
  }

  return {
    selectedLoadoutId: selectedLoadout.id,
    aiProfile: selectedLoadout.aiProfile ?? FALLBACK_AI_PROFILE,
    castingPolicy: selectedLoadout.castingPolicy ?? FALLBACK_CASTING_POLICY,
    invalidLoadoutFallback: false,
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
  if (snapshot.warnings) {
    return { ...snapshot.warnings };
  }

  const flags = getDoctrineSourceFlags(snapshot);
  return {
    missingPath: !flags.hasPath,
    missingHeartLaw: !flags.hasHeartLaw,
    missingSpiritRoot: !flags.hasSpiritRoot,
    missingLoadout: !flags.hasLoadout,
    missingCity: !flags.hasCity,
    clampedRealmIndex: false,
    invalidCityFiltered: false,
    invalidLoadoutFallback: false,
    invalidHeartLawProfile: false,
  };
}

export function buildDoctrineSnapshot(): DoctrineSnapshot {
  const gameState = useGameStore.getState();
  const cultivationState = useCultivationStore.getState();
  const prestigeState = usePrestigeStore.getState();

  const { realmIndex, clampedRealmIndex } = resolveDoctrineRealmIndex(gameState.realm.index);
  const loadout = resolveDoctrineLoadout();
  const city = resolveDoctrineCityId();

  const heartLawId = cultivationState.selectedHeartLawId;
  const heartLawProfile = getHeartLawProfile(heartLawId);
  const invalidHeartLawProfile = heartLawId !== null && heartLawProfile === null;

  const spiritRoot = prestigeState.spiritRoot;
  const spiritRootSummary = spiritRoot
    ? {
        element: spiritRoot.element,
        grade: spiritRoot.grade,
        purity: clampSpiritRootPurity(spiritRoot.purity),
      }
    : null;

  const snapshotWithoutMeta = {
    path: gameState.selectedPath,
    focusMode: gameState.focusMode,
    spiritRoot,
    spiritRootSummary,
    heartLawId,
    heartLawChapter: normalizeHeartLawChapter(cultivationState.chapter),
    heartLawName: heartLawProfile?.name ?? null,
    heartLawFamily: heartLawProfile?.family ?? null,
    breathMode: cultivationState.breathMode,
    selectedLoadoutId: loadout.selectedLoadoutId,
    aiProfile: loadout.aiProfile,
    castingPolicy: loadout.castingPolicy,
    realmIndex,
    majorRealmId: resolveDoctrineMajorRealmId(realmIndex),
    cityId: city.cityId,
  } satisfies Omit<DoctrineSnapshot, 'sourceFlags' | 'warnings'>;

  const sourceFlags: DoctrineSourceFlags = {
    hasPath: snapshotWithoutMeta.path !== null,
    hasHeartLaw: snapshotWithoutMeta.heartLawId !== null,
    hasSpiritRoot: snapshotWithoutMeta.spiritRoot !== null,
    hasLoadout: snapshotWithoutMeta.selectedLoadoutId !== null,
    hasCity: snapshotWithoutMeta.cityId !== null,
  };

  const warnings: DoctrineSnapshotWarnings = {
    missingPath: !sourceFlags.hasPath,
    missingHeartLaw: !sourceFlags.hasHeartLaw,
    missingSpiritRoot: !sourceFlags.hasSpiritRoot,
    missingLoadout: !sourceFlags.hasLoadout,
    missingCity: !sourceFlags.hasCity,
    clampedRealmIndex,
    invalidCityFiltered: city.invalidCityFiltered,
    invalidLoadoutFallback: loadout.invalidLoadoutFallback,
    invalidHeartLawProfile,
  };

  return {
    ...snapshotWithoutMeta,
    sourceFlags,
    warnings,
  };
}
