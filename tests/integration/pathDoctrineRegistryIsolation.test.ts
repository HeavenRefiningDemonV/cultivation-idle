import assert from 'node:assert/strict';
import test from 'node:test';

import { PATH_MODIFIERS } from '../../src/constants/index.js';
import {
  buildDoctrineSnapshot,
  getAllPathDoctrineProfiles,
  getPathDoctrineProfile,
  getPathDoctrineSummary,
} from '../../src/systems/doctrine/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';

function resetDoctrineIntegrationState(): void {
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  useEquipmentStore.getState().hardResetEquipment();
  useTechniqueStore.getState().resetLoadouts();
  useCultivationStore.getState().resetForNewLife();
  useCityStore.getState().hardResetCity();
}

test('path doctrine registry interops cleanly with the packet 4.1 snapshot layer', () => {
  resetDoctrineIntegrationState();
  useGameStore.getState().selectPath('earth');

  const snapshot = buildDoctrineSnapshot();
  const profile = getPathDoctrineProfile(snapshot.path);

  assert.equal(snapshot.path, 'earth');
  assert.ok(profile);
  assert.equal(profile.coreIdentity, 'durable_inevitability');
  assert.equal(
    getPathDoctrineSummary(snapshot.path),
    'Stable body-centered doctrine that converts durability into steady pressure; forgiving overall, but can stall without a finisher.',
  );
});

test('calling the doctrine registry does not mutate gameplay state', () => {
  resetDoctrineIntegrationState();

  const game = useGameStore.getState();
  game.selectPath('heaven');
  game.calculateQiPerSecond();
  game.calculatePlayerStats();

  const before = (() => {
    const state = useGameStore.getState();
    return {
      selectedPath: state.selectedPath,
      qiPerSecond: state.qiPerSecond,
      hp: state.stats.hp,
      maxHp: state.stats.maxHp,
      atk: state.stats.atk,
      def: state.stats.def,
      crit: state.stats.crit,
      dodge: state.stats.dodge,
    };
  })();

  getPathDoctrineProfile('heaven');
  getPathDoctrineSummary('heaven');
  getAllPathDoctrineProfiles();

  const afterState = useGameStore.getState();
  const after = {
    selectedPath: afterState.selectedPath,
    qiPerSecond: afterState.qiPerSecond,
    hp: afterState.stats.hp,
    maxHp: afterState.stats.maxHp,
    atk: afterState.stats.atk,
    def: afterState.stats.def,
    crit: afterState.stats.crit,
    dodge: afterState.stats.dodge,
  };

  assert.deepEqual(after, before);
});

test('doctrine registry getters do not mutate live path modifier constants', () => {
  const originalPathModifiers = JSON.parse(JSON.stringify(PATH_MODIFIERS));

  getPathDoctrineProfile('heaven');
  getPathDoctrineProfile('earth');
  getPathDoctrineProfile('martial');
  getPathDoctrineSummary('heaven');
  getAllPathDoctrineProfiles();
  getAllPathDoctrineProfiles();

  assert.deepEqual(PATH_MODIFIERS, originalPathModifiers);
});
