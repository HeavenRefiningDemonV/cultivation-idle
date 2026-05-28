import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

type SubscribableStore<TState> = {
  subscribe: (listener: (state: TState, previousState: TState) => void) => () => void;
};

function countNotifications<TState>(store: SubscribableStore<TState>, action: () => void): number {
  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });
  action();
  unsubscribe();
  return notifications;
}

describe('store no-op publication guards', () => {
  it('clearExpiredCultivationConsumables does not publish when no visible state changes', () => {
    useCultivationStore.setState({
      activeCultivationConsumables: [],
      nextInsightAt: null,
      consumableVersion: 0,
      insightDisplayVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      useCultivationStore.getState().clearExpiredCultivationConsumables(1000);
    });

    assert.equal(notifications, 0);
  });

  it('ensureInsightCycle does not publish when the current cycle is already correct', () => {
    useCultivationStore.setState({
      insightProgressMs: 100,
      insightTargetMs: 1000,
      nextInsightAt: 1900,
      selectedHeartLawId: 'heart_law_alpha',
      activeCultivationConsumables: [],
      insightDisplayVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      useCultivationStore.getState().ensureInsightCycle(1000);
    });

    assert.equal(notifications, 0);
  });

  it('removeExpiredBuffs does not publish when no buffs or shield expirations exist', () => {
    useGameStore.setState({
      activeBuffs: [],
      absorptionShield: '0',
      absorptionExpiresAt: null,
      statsVersion: 0,
    });

    const notifications = countNotifications(useGameStore, () => {
      useGameStore.getState().removeExpiredBuffs();
    });

    assert.equal(notifications, 0);
  });

  it('same-target UI actions do not publish', () => {
    useUIStore.setState({
      activeTab: 'cultivation',
      showWorldBuildingModal: true,
      worldBuildingModalCityId: 'city_alpha',
      worldBuildingModalKey: 'apothecary',
      worldBuildingModalIntent: { apothecarySurface: 'buy' },
    });

    const sameTabNotifications = countNotifications(useUIStore, () => {
      useUIStore.getState().setActiveTab('cultivation');
    });
    assert.equal(sameTabNotifications, 0);

    const sameModalNotifications = countNotifications(useUIStore, () => {
      useUIStore.getState().openWorldBuildingModal({
        cityId: 'city_alpha',
        buildingKey: 'apothecary',
        intent: { apothecarySurface: 'buy' },
      });
    });
    assert.equal(sameModalNotifications, 0);
  });

  it('same loadout and same AI profile do not publish', () => {
    useTechniqueStore.getState().resetLoadouts();

    const sameLoadoutNotifications = countNotifications(useTechniqueStore, () => {
      useTechniqueStore.getState().setSelectedLoadout('loadout_1');
    });
    assert.equal(sameLoadoutNotifications, 0);

    const sameProfileNotifications = countNotifications(useTechniqueStore, () => {
      useTechniqueStore.getState().setAiProfile('loadout_1', 'balanced');
    });
    assert.equal(sameProfileNotifications, 0);
  });

  it('same pouch config does not publish after clamping', () => {
    useMedicinePouchStore.getState().hardReset();

    const notifications = countNotifications(useMedicinePouchStore, () => {
      useMedicinePouchStore.getState().setSlotConfig('utility', { thresholdPct: 50 });
    });

    assert.equal(notifications, 0);
  });
});
