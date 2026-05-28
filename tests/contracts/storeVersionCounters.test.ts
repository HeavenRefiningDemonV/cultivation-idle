import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import type { BountyInstance } from '../../src/stores/bountyStore.js';

describe('store semantic version counters', () => {
  it('separates inventory item and currency invalidation', () => {
    useInventoryStore.getState().hardResetInventory();

    const initialInventoryVersion = useInventoryStore.getState().inventoryVersion;
    const initialCurrencyVersion = useInventoryStore.getState().currencyVersion;

    assert.equal(useInventoryStore.getState().addItem('test_herb', 0), false);
    assert.equal(useInventoryStore.getState().inventoryVersion, initialInventoryVersion);
    assert.equal(useInventoryStore.getState().currencyVersion, initialCurrencyVersion);

    assert.equal(useInventoryStore.getState().addItem('test_herb', 2), true);
    assert.equal(useInventoryStore.getState().inventoryVersion, initialInventoryVersion + 1);
    assert.equal(useInventoryStore.getState().currencyVersion, initialCurrencyVersion);

    useInventoryStore.getState().addCurrency('gold', '0');
    assert.equal(useInventoryStore.getState().currencyVersion, initialCurrencyVersion);

    useInventoryStore.getState().addCurrency('gold', '5');
    assert.equal(useInventoryStore.getState().inventoryVersion, initialInventoryVersion + 1);
    assert.equal(useInventoryStore.getState().currencyVersion, initialCurrencyVersion + 1);
  });

  it('bumps equipmentVersion only for real equipment changes', () => {
    useEquipmentStore.getState().hardResetEquipment();

    const before = useEquipmentStore.getState().equipmentVersion;
    useEquipmentStore.getState().equipWeapon(null);
    assert.equal(useEquipmentStore.getState().equipmentVersion, before);

    useEquipmentStore.getState().equipWeapon('starter_sword');
    assert.equal(useEquipmentStore.getState().equipmentVersion, before + 1);

    useEquipmentStore.getState().equipWeapon('starter_sword');
    assert.equal(useEquipmentStore.getState().equipmentVersion, before + 1);
  });

  it('scopes trial progress versions to the affected trial id', () => {
    useTrialStore.getState().hardResetTrials();

    const before = useTrialStore.getState().progressVersion;
    useTrialStore.getState().recordFailure('trial_alpha', true);

    assert.equal(useTrialStore.getState().progressVersion, before + 1);
    assert.equal(useTrialStore.getState().progressVersionByTrialId.trial_alpha, 1);
    assert.equal(useTrialStore.getState().progressVersionByTrialId.trial_beta, undefined);
  });

  it('does not rebump trial clear versions when the clear state is unchanged', () => {
    useTrialStore.getState().hardResetTrials();

    useTrialStore.getState().markCleared('trial_alpha');
    const afterFirstClear = useTrialStore.getState().progressVersionByTrialId.trial_alpha;

    useTrialStore.getState().markCleared('trial_alpha');
    assert.equal(useTrialStore.getState().progressVersionByTrialId.trial_alpha, afterFirstClear);
  });

  it('bumps only the current city bounty version on tracked bounty changes', () => {
    const bounty: BountyInstance = {
      instanceId: 'bounty_alpha',
      templateId: 'def_alpha',
      cityId: 'city_alpha',
      cityIndex: 0,
      difficulty: 'easy',
      kind: 'OUTSKIRTS_KILL',
      title: 'Alpha bounty',
      description: 'Test bounty',
      claimed: false,
      progress: 0,
      target: 1,
      rewards: {},
      createdAt: 0,
    };

    useBountyStore.setState({
      activeByCityId: { city_alpha: [bounty], city_beta: [] },
      lastRefreshAtByCityId: {},
      trackedByCityId: {},
      bountyVersion: 0,
      bountyVersionByCityId: {},
    });

    useBountyStore.getState().setTrackedBounty('city_alpha', 'bounty_alpha');
    assert.equal(useBountyStore.getState().bountyVersion, 1);
    assert.equal(useBountyStore.getState().bountyVersionByCityId.city_alpha, 1);
    assert.equal(useBountyStore.getState().bountyVersionByCityId.city_beta, undefined);

    useBountyStore.getState().setTrackedBounty('city_alpha', 'bounty_alpha');
    assert.equal(useBountyStore.getState().bountyVersion, 1);
    assert.equal(useBountyStore.getState().bountyVersionByCityId.city_alpha, 1);
  });

  it('bumps medicine pouch version for visible config changes only', () => {
    useMedicinePouchStore.getState().hardReset();

    const before = useMedicinePouchStore.getState().pouchVersion;
    useMedicinePouchStore.getState().setSlotConfig('utility', { thresholdPct: 50 });
    assert.equal(useMedicinePouchStore.getState().pouchVersion, before);

    useMedicinePouchStore.getState().setSlotConfig('utility', { thresholdPct: 55 });
    assert.equal(useMedicinePouchStore.getState().pouchVersion, before + 1);

    useMedicinePouchStore.getState().setSlotConfig('utility', { thresholdPct: 55 });
    assert.equal(useMedicinePouchStore.getState().pouchVersion, before + 1);
  });

  it('separates technique loadout, AI profile, and slot invalidation', () => {
    useTechniqueStore.getState().resetLoadouts();

    const before = {
      activeSlots: useTechniqueStore.getState().activeSlots,
      passiveSlots: useTechniqueStore.getState().passiveSlots,
      loadoutVersion: useTechniqueStore.getState().loadoutVersion,
      aiProfileVersion: useTechniqueStore.getState().aiProfileVersion,
      slotVersion: useTechniqueStore.getState().slotVersion,
    };
    useTechniqueStore.getState().setSelectedLoadout('loadout_1');
    useTechniqueStore.getState().setAiProfile('loadout_1', 'balanced');
    useTechniqueStore.getState().setSlotCounts({ active: before.activeSlots, passive: before.passiveSlots });

    assert.equal(useTechniqueStore.getState().loadoutVersion, before.loadoutVersion);
    assert.equal(useTechniqueStore.getState().aiProfileVersion, before.aiProfileVersion);
    assert.equal(useTechniqueStore.getState().slotVersion, before.slotVersion);

    useTechniqueStore.getState().setSelectedLoadout('loadout_2');
    assert.equal(useTechniqueStore.getState().loadoutVersion, before.loadoutVersion + 1);

    useTechniqueStore.getState().setAiProfile('loadout_2', 'burst');
    assert.equal(useTechniqueStore.getState().aiProfileVersion, before.aiProfileVersion + 1);

    useTechniqueStore.getState().setSlotCounts({ active: before.activeSlots + 1, passive: before.passiveSlots });
    assert.equal(useTechniqueStore.getState().slotVersion, before.slotVersion + 1);
  });

  it('bumps expeditionVersion for slot changes and not same slot count', () => {
    useExpeditionStore.setState({
      active: [],
      rareProgressByKey: {},
      slots: 1,
      expeditionVersion: 0,
    });

    useExpeditionStore.getState().setSlots(1);
    assert.equal(useExpeditionStore.getState().expeditionVersion, 0);

    useExpeditionStore.getState().setSlots(2);
    assert.equal(useExpeditionStore.getState().expeditionVersion, 1);
  });
});
