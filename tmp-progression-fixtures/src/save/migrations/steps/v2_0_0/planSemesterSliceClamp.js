import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { SEMESTER_SLICE_CONTRACT } from '../../../../systems/progression/contract/semesterSlice.js';
import { getCanonicalMajorRealmIndex, getCanonicalMajorRealmName } from '../../../../systems/progression/contract/realmMap.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';
const CONTENT_CAP_INDEX = getCanonicalMajorRealmIndex(SEMESTER_SLICE_CONTRACT.contentCapRealm);
const CONTENT_CAP_NAME = getCanonicalMajorRealmName(SEMESTER_SLICE_CONTRACT.contentCapRealm);
export const v2_0_0_plan_semester_slice_clamp = {
    id: 'v2_0_0_plan_semester_slice_clamp',
    title: 'Plan semester slice clamp',
    description: 'Detect progression beyond the authored semester slice and report clamp plan for packet 1.1.',
    kind: 'plannedTransform',
    ownerPacket: '1.1',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 50,
    appliesTo: (save) => isRecord(save.gameState) || isRecord(save.prestigeState),
    run: (save) => {
        const next = cloneSave(save);
        const gameState = isRecord(next.gameState) ? next.gameState : {};
        const prestigeState = isRecord(next.prestigeState) ? next.prestigeState : {};
        const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : null;
        const highestRealmReached = typeof prestigeState.highestRealmReached === 'number' ? prestigeState.highestRealmReached : null;
        const warnings = [];
        const touched = [];
        const plannedMutations = [];
        if (currentRealmIndex != null)
            touched.push(touch('gameState.realm.index', 'inspect', `Detected realm index ${currentRealmIndex}.`));
        if (isRecord(gameState.realm) && typeof gameState.realm.name === 'string') {
            touched.push(touch('gameState.realm.name', 'inspect', `Detected realm display ${gameState.realm.name}.`));
        }
        if (highestRealmReached != null)
            touched.push(touch('prestigeState.highestRealmReached', 'inspect', `Detected highest realm ${highestRealmReached}.`));
        if ((currentRealmIndex ?? -1) > CONTENT_CAP_INDEX || (highestRealmReached ?? -1) > CONTENT_CAP_INDEX) {
            warnings.push(warning('OUT_OF_SLICE_PROGRESS_DETECTED', `Detected progress beyond content cap ${SEMESTER_SLICE_CONTRACT.contentCapRealm} (index ${CONTENT_CAP_INDEX}).`, '1.1', 'warning', 'gameState.realm.index'));
            plannedMutations.push(plan('gameState.realm.index', '1.1', `Clamp current realm index to ${CONTENT_CAP_INDEX} / ${SEMESTER_SLICE_CONTRACT.contentCapRealm}.`), plan('gameState.realm.name', '1.1', `Normalize realm display to canonical cap realm ${CONTENT_CAP_NAME}.`), plan('prestigeState.highestRealmReached', '1.1', `Clamp highest detected realm to ${CONTENT_CAP_INDEX}.`));
        }
        return createStepResult(v2_0_0_plan_semester_slice_clamp, next, plannedMutations.length > 0
            ? `Semester slice clamp planned; content cap realm is ${SEMESTER_SLICE_CONTRACT.contentCapRealm}.`
            : 'Save is within semester slice bounds.', { warnings, touchedFieldPaths: touched, plannedMutations });
    },
};
