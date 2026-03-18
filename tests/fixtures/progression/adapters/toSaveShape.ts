import type { ProgressionContract } from '../../../../src/systems/progression/contract/index.js';
import type { ProgressionScenario } from '../../../helpers/progression/index.js';
import type { FixtureBuildResult } from '../fixtureTypes.js';

const scenarioToSaveShape = (scenario: ProgressionScenario, contract: ProgressionContract): Record<string, unknown> => {
  const currentRealm = contract.majorRealms[scenario.realmState.currentRealm];
  const progressByTrialId = contract.gateTransitions.reduce<Record<string, { attempts: number; cleared: boolean; lastAttemptAt: number | null; lastClearAt: number | null }>>((acc, transition) => {
    const cleared = scenario.gateState.resolvedTransitionIds.includes(transition.id);
    acc[transition.trialId] = {
      attempts: cleared ? 1 : 0,
      cleared,
      lastAttemptAt: cleared ? 1 : null,
      lastClearAt: cleared ? 1 : null,
    };
    return acc;
  }, {});

  return {
    version: '2.0.0',
    timestamp: 1736035200000,
    meta: { lastActiveAtMs: 1736035100000 },
    gameState: {
      realm: { index: currentRealm.index, substage: 0, name: scenario.realmState.currentRealm },
      qi: '0',
      selectedPath: scenario.pathState.selectedPathAlias,
      lifePath: scenario.pathState.lifePath,
      focusMode: 'balanced',
      pathPerks: [],
      totalAuras: scenario.realmState.enteredRealms.length - 1,
      upgradeTiers: { idle: 0, damage: 0, hp: 0 },
      pityState: { killsSinceUncommon: 0, killsSinceRare: 0, killsSinceEpic: 0, killsSinceLegendary: 0 },
      playerLuck: 0,
    },
    cityState: {
      currentCityId: scenario.cityState.unlockedCityIds.at(-1) ?? 'city_pinewind_hamlet',
      unlockedCityIds: scenario.cityState.unlockedCityIds,
      selectedModuleByCity: {},
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

export const toSaveShape = (
  buildResult: FixtureBuildResult,
  contract: ProgressionContract,
): Record<string, unknown> | null => {
  if (buildResult.saveShape) return buildResult.saveShape;
  if (buildResult.migrationFixture) return buildResult.migrationFixture.data as Record<string, unknown>;
  if (buildResult.scenario) return scenarioToSaveShape(buildResult.scenario, contract);
  return null;
};
