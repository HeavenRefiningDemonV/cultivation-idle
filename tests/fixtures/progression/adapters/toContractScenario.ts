import type { GateTransitionId, MajorRealmId, ProgressionContract } from '../../../../src/systems/progression/contract/index.js';
import { getOfflineProgressionContract, getTransitionByFromRealm, normalizeGateItemAlias } from '../../../../src/systems/progression/contract/index.js';
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

const inferUnlockedCities = (contract: ProgressionContract, enteredRealms: MajorRealmId[], save: Record<string, any>): string[] => {
  if (Array.isArray(save.cityState?.unlockedCityIds)) {
    return save.cityState.unlockedCityIds.filter((cityId: unknown): cityId is string => typeof cityId === 'string');
  }
  const unlocked = contract.cityUnlocks
    .filter((unlock) => enteredRealms.includes(unlock.unlockOnRealmEntry))
    .map((unlock) => unlock.cityId);
  return unlocked.length > 0 ? unlocked : ['city_pinewind_hamlet'];
};

export const projectSaveShapeToScenario = (
  saveShape: Record<string, unknown>,
  contract: ProgressionContract,
): ProgressionScenario => {
  const save = saveShape as Record<string, any>;
  const realmIndex = Number(save.gameState?.realm?.index ?? 0);
  const currentRealm = realmByIndex(contract, realmIndex);
  const enteredRealms = Object.values(contract.majorRealms)
    .filter((realm) => realm.index <= Math.max(0, realmIndex) && realm.index <= Object.keys(contract.majorRealms).length - 1)
    .map((realm) => realm.id);
  const trialProgress = (save.trialState?.progressByTrialId ?? {}) as Record<
    string,
    { cleared?: boolean; resolution?: string }
  >;
  const resolutionByTransitionId = contract.gateTransitions.reduce<
    Partial<Record<GateTransitionId, 'cleared' | 'bypassed'>>
  >((acc, transition) => {
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

  const selectedPath = (save.gameState?.selectedPath ?? save.gameState?.lifePath ?? null) as ProgressionScenario['pathState']['selectedPath'];
  const lifePathAlias = (save.gameState?.lifePath ?? null) as ProgressionScenario['pathState']['lifePathAlias'];

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
      inventoryGateItems: { ...((save.inventoryState?.items ?? {}) as Record<string, number>) },
      pendingBreakthroughTo: resolvedTransitionIds.length === 0 ? nextTransition?.toRealmId ?? null : null,
    },
    cityState: {
      unlockedCityIds: inferUnlockedCities(contract, enteredRealms, save),
    },
    prestigeState: {
      ready: Number(save.prestigeState?.currentRunAP ?? 0) > 0 || Number(save.prestigeState?.highestRealmReached ?? 0) >= 2,
      projectedAP: Number(save.prestigeState?.currentRunAP ?? 0),
    },
    offlineState: {
      pipelineId: offline.pipelineId,
      maxCatchupSeconds: offline.maxCatchupSeconds,
      efficiencyModel: offline.efficiencyModel,
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
    const inventoryState = (fixtureData.inventoryState && typeof fixtureData.inventoryState === 'object')
      ? fixtureData.inventoryState as Record<string, unknown>
      : null;
    const items = inventoryState?.items && typeof inventoryState.items === 'object'
      ? inventoryState.items as Record<string, unknown>
      : null;
    const canonicalItems = items ? canonicalizeItems(items) : undefined;
    return projectSaveShapeToScenario({
      ...fixtureData,
      __fixtureId: buildResult.migrationFixture.name,
      inventoryState: inventoryState && canonicalItems ? { ...inventoryState, items: canonicalItems } : fixtureData.inventoryState,
    }, contract);
  }
  return null;
};
