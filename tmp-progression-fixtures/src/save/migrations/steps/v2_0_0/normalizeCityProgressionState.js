import { normalizeCitySaveState } from '../../../cityStateNormalization.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from './shared.js';
const summarizeUnlockedCities = (cityIds) => (cityIds.length > 0 ? cityIds.join(', ') : 'none');
export const v2_0_0_normalize_city_progression_state = {
    id: 'v2_0_0_normalize_city_progression_state',
    title: 'Normalize city progression state',
    description: 'Backfill and normalize city progression state from canonical realm-entry truth for current and legacy saves.',
    kind: 'transform',
    ownerPacket: '1.5',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 72,
    appliesTo: (save) => isRecord(save.gameState),
    run: (save) => {
        const next = cloneSave(save);
        const gameState = isRecord(next.gameState) ? next.gameState : {};
        const realm = isRecord(gameState.realm) ? gameState.realm : {};
        const realmIndex = typeof realm.index === 'number' ? realm.index : 0;
        const existingCityState = isRecord(next.cityState) ? next.cityState : null;
        const normalizedCityState = normalizeCitySaveState({
            content: null,
            realmIndex,
            cityState: existingCityState,
        });
        const beforeSnapshot = JSON.stringify(existingCityState ?? null);
        const afterSnapshot = JSON.stringify(normalizedCityState);
        const didMutate = beforeSnapshot !== afterSnapshot;
        next.cityState = normalizedCityState;
        const warnings = didMutate
            ? [
                warning('CITY_PROGRESSION_NORMALIZED', 'City progression state was backfilled or corrected to match canonical realm-entry unlock truth.', '1.5', 'info', 'cityState'),
            ]
            : [];
        if (!existingCityState) {
            warnings.push(warning('CITY_STATE_MISSING', 'Save omitted cityState; migration backfilled canonical unlocked cities, current city, and selected modules.', '1.5', 'warning', 'cityState'));
        }
        const touched = [
            touch('gameState.realm.index', 'inspect', `Realm index ${realmIndex}.`),
            touch('cityState.unlockedCityIds', didMutate ? 'set' : 'inspect', summarizeUnlockedCities(normalizedCityState.unlockedCityIds)),
            touch('cityState.currentCityId', didMutate ? 'set' : 'inspect', String(normalizedCityState.currentCityId ?? 'null')),
            touch('cityState.selectedModuleByCity', didMutate ? 'set' : 'inspect', `Modules set for ${Object.keys(normalizedCityState.selectedModuleByCity).length} unlocked cities.`),
        ];
        return createStepResult(v2_0_0_normalize_city_progression_state, next, didMutate
            ? 'City progression state normalized to canonical packet-1.5 truth.'
            : 'City progression state already matches canonical packet-1.5 truth.', { warnings, touchedFieldPaths: touched, didMutate });
    },
};
