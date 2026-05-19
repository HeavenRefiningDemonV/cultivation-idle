import type { GateTransitionId, MajorRealmId, ProgressionContract } from '../../../../src/systems/progression/contract/index.js';
import { getOfflineProgressionContract, getTransitionByFromRealm, normalizeGateItemAlias } from '../../../../src/systems/progression/contract/index.js';
import { normalizeCitySaveState } from '../../../../src/save/cityStateNormalization.js';
import { normalizeOfflineTimestamps } from '../../../../src/save/offlineTimestampNormalization.js';
import { applyPartialResetResidueCleanup } from '../../../../src/save/partialResetResidueCleanup.js';
import type { ProgressionScenario } from '../../../helpers/progression/index.js';
import type { FixtureBuildResult } from '../fixtureTypes.js';

const canonicalizeItems = (items: Record<string, unknown>): Record<string, unknown> => {
  const next: Record<string, unknown> = {};
  Object.entries(items).forEach(([itemId, qty]) => {
    const canonicalId = normalizeGateItemAlias(itemId) ?? itemId;
    if (typeof qty === 'number' && typeof next[canonicalId] === 'number') {
      next[canonicalId] = (next[canonicalId] as number) + qty;
      return;
    }
    next[canonicalId] = qty;
  });
  return next;
};

const realmByIndex = (contract: ProgressionContract, index: number): MajorRealmId => {
  const match = Object.values(contract.majorRealms).find((realm) => realm.index === index);
  return (match?.id ?? 'qi_condensation') as MajorRealmId;
};

export const projectSaveShapeToScenario = (
  saveShape: Record<string, unknown>,
  contract: ProgressionContract,
): ProgressionScenario => {
  const save = normalizeOfflineTimestamps(saveShape).save;
  const saveGameState = save.gameState && typeof save.gameState === 'object' ? (save.gameState as Record<string, unknown>) : {};
  const saveTrialState = save.trialState && typeof save.trialState === 'object' ? (save.trialState as Record<string, unknown>) : {};
  const realm = saveGameState.realm && typeof saveGameState.realm === 'object' ? (saveGameState.realm as Record<string, unknown>) : {};
  const realmIndex = Number(realm.index ?? 0);
  const currentRealm = realmByIndex(contract, realmIndex);
  const enteredRealms = Object.values(contract.majorRealms)
    .filter((entry) => entry.index <= Math.max(0, realmIndex) && entry.index <= Object.keys(contract.majorRealms).length - 1)
    .map((entry) => entry.id);
  const trialProgress = (saveTrialState.progressByTrialId && typeof saveTrialState.progressByTrialId === 'object'
    ? saveTrialState.progressByTrialId
    : {}) as Record<string, { cleared?: boolean; resolution?: string }>;
  const resolutionByTransitionId = contract.gateTransitions.reduce<Partial<Record<GateTransitionId, 'cleared' | 'bypassed'>>>((acc, transition) => {
    const resolution = trialProgress[transition.trialId]?.resolution;
    if (resolution === 'cleared' || resolution === 'bypassed') {
      acc[transition.id] = resolution;
      return acc;
    }
    if (trialProgress[transition.trialId]?.cleared === true) {
      acc[transition.id] = 'cleared';
    }
    return acc;
  }, {});
  const resolvedTransitionIds = Object.keys(resolutionByTransitionId) as GateTransitionId[];
  const offline = getOfflineProgressionContract(contract);
  const nextTransition = getTransitionByFromRealm(contract, currentRealm);
  const normalizedCityState = normalizeCitySaveState({ content: null, realmIndex, cityState: save.cityState });
  const prestigeState = save.prestigeState && typeof save.prestigeState === 'object' ? (save.prestigeState as Record<string, unknown>) : {};
  const inventoryState = save.inventoryState && typeof save.inventoryState === 'object' ? (save.inventoryState as Record<string, unknown>) : {};
  const selectedPath = (saveGameState.selectedPath ?? saveGameState.lifePath ?? null) as ProgressionScenario['pathState']['selectedPath'];
  const lifePathAlias = (saveGameState.lifePath ?? null) as ProgressionScenario['pathState']['lifePathAlias'];

  return {
    kind: 'legacy_alias',
    description: `Projected scenario view of save-shaped fixture ${String(save.__fixtureId ?? 'unknown')}.`,
    pathState: {
      selectedPath,
      lifePathAlias,
    },
    realmState: {
      currentRealm,
      enteredRealms: enteredRealms.length > 0 ? enteredRealms : ['qi_condensation'],
    },
    gateState: {
      resolutionByTransitionId,
      resolvedTransitionIds,
      inventoryGateItems: { ...(((inventoryState.items && typeof inventoryState.items === 'object') ? inventoryState.items : {}) as Record<string, number>) },
      pendingBreakthroughTo: resolvedTransitionIds.length === 0 ? nextTransition?.toRealmId ?? null : null,
    },
    cityState: {
      currentCityId: normalizedCityState.currentCityId,
      unlockedCityIds: normalizedCityState.unlockedCityIds,
      selectedModuleByCity: normalizedCityState.selectedModuleByCity,
    },
    prestigeState: {
      ready: Number(prestigeState.currentRunAP ?? 0) > 0 || Number(prestigeState.highestRealmReached ?? 0) >= 2,
      projectedAP: Number(prestigeState.currentRunAP ?? 0),
    },
    offlineState: {
      pipelineId: offline.pipelineId,
      maxCatchupSeconds: offline.maxCatchupSeconds,
      cultivationPolicy: { ...offline.cultivationPolicy },
      timerAdvancedSystems: [...offline.timerAdvancedSystems],
      summaryParts: [...offline.summaryParts],
    },
    notes: ['Projected from save-shaped data for fixture catalog reuse.'],
  };
};

export const toContractScenario = (
  buildResult: FixtureBuildResult,
  contract: ProgressionContract,
): ProgressionScenario | null => {
  if (buildResult.scenario) return buildResult.scenario;
  if (buildResult.saveShape) return projectSaveShapeToScenario(buildResult.saveShape, contract);
  if (buildResult.migrationFixture) {
    const fixtureData = buildResult.migrationFixture.data as Record<string, unknown>;
    const inventoryState = fixtureData.inventoryState && typeof fixtureData.inventoryState === 'object'
      ? (fixtureData.inventoryState as Record<string, unknown>)
      : null;
    const items = inventoryState?.items && typeof inventoryState.items === 'object'
      ? (inventoryState.items as Record<string, unknown>)
      : null;
    const canonicalItems = items ? canonicalizeItems(items) : undefined;
    return projectSaveShapeToScenario(
      applyPartialResetResidueCleanup({
        ...fixtureData,
        __fixtureId: buildResult.migrationFixture.name,
        inventoryState: inventoryState && canonicalItems ? { ...inventoryState, items: canonicalItems } : fixtureData.inventoryState,
      }).save,
      contract,
    );
  }
  return null;
};
