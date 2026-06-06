import { normalizeGateItemAlias } from '../../../../src/systems/progression/contract/index.js';
import { normalizeCitySaveState } from '../../../../src/save/cityStateNormalization.js';
import { normalizeOfflineTimestamps } from '../../../../src/save/offlineTimestampNormalization.js';
import { applyPartialResetResidueCleanup } from '../../../../src/save/partialResetResidueCleanup.js';
import { normalizeTrialProgress } from '../../../../src/stores/trialStore.js';
const canonicalizeInventoryItems = (items) => {
    const next = { ...items };
    Object.entries(items).forEach(([itemId, qty]) => {
        const canonicalId = normalizeGateItemAlias(itemId);
        if (!canonicalId || canonicalId === itemId || typeof qty !== 'number' || qty <= 0)
            return;
        const existing = typeof next[canonicalId] === 'number' ? next[canonicalId] : 0;
        next[canonicalId] = existing + qty;
        delete next[itemId];
    });
    return next;
};
const canonicalizeSaveShape = (saveShape) => {
    const inventoryState = saveShape.inventoryState;
    const trialState = saveShape.trialState;
    const gameState = saveShape.gameState;
    const cityState = saveShape.cityState;
    const inventoryRecord = inventoryState && typeof inventoryState === 'object' ? inventoryState : null;
    const trialRecord = trialState && typeof trialState === 'object' ? trialState : null;
    const gameRecord = gameState && typeof gameState === 'object' ? gameState : null;
    const cityRecord = cityState && typeof cityState === 'object' ? cityState : null;
    return normalizeOfflineTimestamps({
        ...saveShape,
        ...(inventoryRecord && inventoryRecord.items && typeof inventoryRecord.items === 'object'
            ? {
                inventoryState: {
                    ...inventoryRecord,
                    items: canonicalizeInventoryItems(inventoryRecord.items),
                },
            }
            : {}),
        ...(trialRecord && trialRecord.progressByTrialId && typeof trialRecord.progressByTrialId === 'object'
            ? {
                trialState: {
                    ...trialRecord,
                    progressByTrialId: Object.fromEntries(Object.entries(trialRecord.progressByTrialId).map(([trialId, progress]) => [
                        trialId,
                        normalizeTrialProgress(progress && typeof progress === 'object'
                            ? progress
                            : null),
                    ])),
                },
            }
            : {}),
        ...(gameRecord
            ? {
                cityState: normalizeCitySaveState({
                    content: null,
                    realmIndex: gameRecord.realm && typeof gameRecord.realm === 'object' && typeof gameRecord.realm.index === 'number'
                        ? gameRecord.realm.index
                        : 0,
                    cityState: cityRecord,
                }),
            }
            : {}),
    }).save;
};
const scenarioToSaveShape = (scenario, contract) => {
    const currentRealm = contract.majorRealms[scenario.realmState.currentRealm];
    const progressByTrialId = contract.gateTransitions.reduce((acc, transition) => {
        const resolution = scenario.gateState.resolutionByTransitionId[transition.id] ?? 'none';
        const cleared = resolution === 'cleared';
        const bypassed = resolution === 'bypassed';
        acc[transition.trialId] = {
            attempts: cleared || bypassed ? 1 : 0,
            sessionAttempts: 0,
            eligibleFailures: 0,
            resolution,
            cleared,
            lastAttemptAt: cleared || bypassed ? 1 : null,
            lastClearAt: cleared ? 1 : null,
            bypassedAt: bypassed ? 1 : null,
        };
        return acc;
    }, {});
    const gameState = {
        realm: { index: currentRealm.index, substage: 0, name: scenario.realmState.currentRealm },
        qi: '0',
        selectedPath: scenario.pathState.selectedPath,
        focusMode: 'balanced',
        pathPerks: [],
        totalAuras: scenario.realmState.enteredRealms.length - 1,
        upgradeTiers: { idle: 0, damage: 0, hp: 0 },
        pityState: { killsSinceUncommon: 0, killsSinceRare: 0, killsSinceEpic: 0, killsSinceLegendary: 0 },
        playerLuck: 0,
    };
    if (scenario.pathState.lifePathAlias !== null) {
        gameState.lifePath = scenario.pathState.lifePathAlias;
    }
    return {
        version: '2.0.0',
        timestamp: 1736035200000,
        meta: { lastActiveAtMs: 1736035100000 },
        gameState,
        cityState: {
            currentCityId: scenario.cityState.currentCityId ?? scenario.cityState.unlockedCityIds.at(-1) ?? 'city_pinewind_hamlet',
            unlockedCityIds: scenario.cityState.unlockedCityIds,
            selectedModuleByCity: { ...scenario.cityState.selectedModuleByCity },
            cityFlagsById: {},
        },
        trialState: {
            activeTrialSessionId: null,
            progressByTrialId,
        },
        prestigeState: {
            totalAP: scenario.prestigeState.projectedAP,
            lifetimeAP: scenario.prestigeState.projectedAP,
            currentRunAP: scenario.prestigeState.projectedAP,
            prestigeCount: scenario.prestigeState.ready ? 1 : 0,
            prestigeRuns: [],
            purchasesById: {},
            highestRealmReached: currentRealm.index,
            runStartTime: 0,
            rerollCount: 0,
            spiritRoot: null,
        },
        inventoryState: {
            currencies: { gold: '0', spiritStones: '0', merit: '0' },
            items: scenario.gateState.inventoryGateItems,
        },
    };
};
export const toSaveShape = (buildResult, contract) => {
    if (buildResult.saveShape)
        return canonicalizeSaveShape(buildResult.saveShape);
    if (buildResult.migrationFixture) {
        return canonicalizeSaveShape(applyPartialResetResidueCleanup(buildResult.migrationFixture.data).save);
    }
    if (buildResult.scenario)
        return canonicalizeSaveShape(scenarioToSaveShape(buildResult.scenario, contract));
    return null;
};
