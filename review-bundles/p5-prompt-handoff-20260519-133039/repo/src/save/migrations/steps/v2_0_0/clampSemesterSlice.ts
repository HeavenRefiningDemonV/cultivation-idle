import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { SEMESTER_SLICE_CONTRACT } from '../../../../systems/progression/contract/semesterSlice.js';
import { getCanonicalMajorRealmIndex, getCanonicalMajorRealmName } from '../../../../systems/progression/contract/realmMap.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from './shared.js';

const CONTENT_CAP_REALM = SEMESTER_SLICE_CONTRACT.contentCapRealm;
const CONTENT_CAP_INDEX = getCanonicalMajorRealmIndex(CONTENT_CAP_REALM);
const CONTENT_CAP_NAME = getCanonicalMajorRealmName(CONTENT_CAP_REALM);

export const v2_0_0_clamp_semester_slice: MigrationStep = {
  id: 'v2_0_0_clamp_semester_slice',
  title: 'Clamp semester slice over-cap progress',
  description: 'Normalize legacy over-cap save realm truth to the live Spirit Severing semester cap while preserving migration reporting.',
  kind: 'transform',
  ownerPacket: '1.1',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 51,
  appliesTo: (save) => {
    const gameState = isRecord(save.gameState) ? save.gameState : {};
    const prestigeState = isRecord(save.prestigeState) ? save.prestigeState : {};
    const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : -1;
    const highestRealmReached = typeof prestigeState.highestRealmReached === 'number' ? prestigeState.highestRealmReached : -1;
    return currentRealmIndex > CONTENT_CAP_INDEX || highestRealmReached > CONTENT_CAP_INDEX;
  },
  run: (save) => {
    const next = cloneSave(save);
    const gameState = isRecord(next.gameState) ? next.gameState : {};
    const prestigeState = isRecord(next.prestigeState) ? next.prestigeState : {};
    const realmState = isRecord(gameState.realm) ? gameState.realm : null;
    const currentRealmIndex = realmState && typeof realmState.index === 'number' ? realmState.index : null;
    const highestRealmReached = typeof prestigeState.highestRealmReached === 'number' ? prestigeState.highestRealmReached : null;

    let didMutate = false;
    const touched = [];

    if (realmState && currentRealmIndex != null && currentRealmIndex > CONTENT_CAP_INDEX) {
      realmState.index = CONTENT_CAP_INDEX;
      realmState.name = CONTENT_CAP_NAME;
      touched.push(
        touch('gameState.realm.index', 'set', `Clamped over-cap realm index ${currentRealmIndex} to ${CONTENT_CAP_INDEX}.`),
        touch('gameState.realm.name', 'set', `Normalized realm display to ${CONTENT_CAP_NAME}.`),
      );
      didMutate = true;
    }

    if (highestRealmReached != null && highestRealmReached > CONTENT_CAP_INDEX) {
      prestigeState.highestRealmReached = CONTENT_CAP_INDEX;
      touched.push(
        touch(
          'prestigeState.highestRealmReached',
          'set',
          `Clamped over-cap highest realm ${highestRealmReached} to ${CONTENT_CAP_INDEX}.`,
        ),
      );
      didMutate = true;
    }

    return createStepResult(
      v2_0_0_clamp_semester_slice,
      next,
      `Normalized out-of-slice realm progress to ${CONTENT_CAP_NAME} (index ${CONTENT_CAP_INDEX}).`,
      {
        didMutate,
        warnings: [
          warning(
            'OUT_OF_SLICE_PROGRESS_NORMALIZED',
            `Legacy save progression beyond ${CONTENT_CAP_REALM} was clamped to the live semester cap.`,
            '1.1',
            'warning',
            'gameState.realm.index',
          ),
        ],
        touchedFieldPaths: touched,
      },
    );
  },
};
