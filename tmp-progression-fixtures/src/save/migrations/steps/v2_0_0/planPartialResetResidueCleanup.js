import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { applyPartialResetResidueCleanup } from '../../../partialResetResidueCleanup.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';
const DETECTION_FIELD_PATHS = {
    city: 'cityState.unlockedCityIds',
    trial: 'trialState.progressByTrialId',
    ruins: 'ruinsState.progressByRuinId',
    equipment: 'equipmentState',
    inventory: 'inventoryState',
    activity: 'activityState',
    outskirts: 'outskirtsState.progressByOutskirtsId',
    bounty: 'bountyState.activeByCityId',
    expedition: 'expeditionState.active',
    profession: 'professionState',
    manualPavilion: 'manualPavilionState.stockByPavilionId',
    manualSatchel: 'manualSatchelState',
    techCollection: 'techCollectionState',
    heartLaw: 'heartLawState',
    technique: 'techniqueState.loadouts',
    medicinePouch: 'medicinePouchState.slots',
    craftSession: 'craftSessionState.activeSession',
    shop: 'shopState.purchasedToday',
};
const DETECTION_MESSAGES = {
    city: 'Reset unlocked/current city state to Pinewind baseline.',
    trial: 'Clear per-life trial residue.',
    ruins: 'Clear per-life ruins residue.',
    equipment: 'Clear incompatible equipment residue for a clean new life.',
    inventory: 'Clear life-bound inventory items and currencies.',
    activity: 'Clear foreground activity residue.',
    outskirts: 'Clear outskirts run residue.',
    bounty: 'Clear bounty progress residue.',
    expedition: 'Clear active expedition and rare-progress residue while preserving slot count.',
    profession: 'Clear profession queues and active crafting residue.',
    manualPavilion: 'Clear pavilion stock residue.',
    manualSatchel: 'Clear manual satchel run residue.',
    techCollection: 'Clear per-life technique collection residue.',
    heartLaw: 'Re-derive heart-law progression to fresh-life baseline while preserving unlock ownership.',
    technique: 'Preserve technique loadout shells but clear equipped techniques.',
    medicinePouch: 'Preserve pouch slot config but clear equipped consumables and timestamps.',
    craftSession: 'Preserve station mode preferences but clear active craft session residue.',
    shop: 'Clear per-life shop purchase residue.',
};
export const v2_0_0_plan_partial_reset_residue_cleanup = {
    id: 'v2_0_0_plan_partial_reset_residue_cleanup',
    title: 'Normalize partial prestige-reset residue',
    description: 'Detect clean-life contradictions across per-life and hybrid stores, keep dry-run transparent, and normalize them on apply for packet 1.7.',
    kind: 'transform',
    ownerPacket: '1.7',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 80,
    appliesTo: (save) => isRecord(save.gameState),
    run: (save) => {
        const input = cloneSave(save);
        const gameState = isRecord(input.gameState) ? input.gameState : {};
        const cityState = isRecord(input.cityState) ? input.cityState : {};
        const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : 0;
        const unlockedCities = Array.isArray(cityState.unlockedCityIds) ? cityState.unlockedCityIds : [];
        const cleanup = applyPartialResetResidueCleanup(input);
        const warnings = [];
        const touched = [
            touch('gameState.realm.index', 'inspect', `Detected realm index ${currentRealmIndex}.`),
            touch('cityState.unlockedCityIds', 'inspect', `Unlocked cities ${unlockedCities.length}.`),
        ];
        const plannedMutations = [];
        const detectedCategories = Object.entries(cleanup.detected)
            .filter(([, detected]) => detected)
            .map(([key]) => key);
        if (cleanup.didMutate) {
            warnings.push(warning('PARTIAL_RESET_RESIDUE_DETECTED', `Detected clean-life baseline with lingering reset residue in ${detectedCategories.join(', ')}.`, '1.7', 'warning', 'gameState.realm.index'), warning('CLEAN_NEW_LIFE_NORMALIZATION_PLAN_READY', 'Clean new-life normalization is ready for packet 1.7 and applies on migration apply mode.', '1.7', 'info', 'cityState'));
            detectedCategories.forEach((category) => {
                const path = DETECTION_FIELD_PATHS[category];
                plannedMutations.push(plan(path, '1.7', DETECTION_MESSAGES[category]));
                touched.push(touch(path, 'set', DETECTION_MESSAGES[category]));
            });
        }
        return createStepResult(v2_0_0_plan_partial_reset_residue_cleanup, cleanup.save, cleanup.didMutate
            ? `Partial-reset residue normalized for ${detectedCategories.join(', ')}.`
            : 'No partial-reset residue detected.', { warnings, touchedFieldPaths: touched, plannedMutations, didMutate: cleanup.didMutate });
    },
};
