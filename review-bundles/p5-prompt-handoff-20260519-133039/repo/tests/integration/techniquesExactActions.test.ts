import assert from 'node:assert/strict';
import test from 'node:test';

import { createTechniquesExactMockupFixture } from '../../src/features/techniquesExact/buildTechniquesExactSurface.js';
import { createTechniquesExactActionController } from '../../src/features/techniquesExact/useTechniquesExactActionController.js';

test('techniques exact controller delegates loadout, AI, casting, slot, equip, and modal actions', () => {
  const surface = createTechniquesExactMockupFixture();
  const calls: string[] = [];

  const controller = createTechniquesExactActionController({
    surface,
    selectedLoadoutId: 'loadout_1',
    selectedTechniqueId: surface.meta.selectedTechniqueId,
    selectedSlotKey: surface.meta.selectedSlotKey,
    setSelectedTechniqueId: (techId) => calls.push(`select-tech:${techId}`),
    setSelectedSlotKey: (slotKey) => calls.push(`select-slot:${slotKey}`),
    setFeedback: (feedback) => calls.push(`feedback:${feedback.tone}:${feedback.message}`),
    setSelectedFilter: (filterId) => calls.push(`filter:${filterId}`),
    openDetails: (techId, intent) => calls.push(`details:${techId}:${intent ?? 'none'}`),
    setSelectedLoadout: (loadoutId) => calls.push(`loadout:${loadoutId}`),
    setAiProfile: (loadoutId, profile) => calls.push(`ai:${loadoutId}:${profile}`),
    setCastingPolicy: (loadoutId, policy) => calls.push(`casting:${loadoutId}:${policy}`),
    equipTechnique: (slotType, slotIndex, techId, loadoutId) => {
      calls.push(`equip:${loadoutId}:${slotType}:${slotIndex}:${techId}`);
      return { ok: true };
    },
    setActiveTab: (tab) => calls.push(`tab:${tab}`),
    openWorldBuildingModal: ({ cityId, buildingKey, intent }) => calls.push(`world:${cityId}:${buildingKey}:${intent?.manualPavilionExactMode ?? 'none'}`),
    addNotification: (_type, message) => calls.push(`notify:${message}`),
    resolveManualPavilionCityId: () => 'city_pinewind_hamlet',
  });

  controller.selectLoadout('loadout_2');
  controller.selectAiProfile('farmer');
  controller.selectCastingPolicy('aggressive');
  controller.selectOwnedTechnique('tech_cloudstep');
  controller.selectSlot('passive-0', 'passive', 0);
  controller.requestEquip('active', 0, 'tech_iron_palm');
  controller.requestUnequip('passive', 0);
  controller.openDetails('tech_iron_palm', 'upgradeRank');
  controller.applyLoadout();
  controller.goToManualPavilion();

  assert.deepEqual(calls, [
    'loadout:loadout_2',
    'ai:loadout_1:farmer',
    'casting:loadout_1:aggressive',
    'select-tech:tech_cloudstep',
    'select-slot:passive-0',
    'equip:loadout_1:active:0:tech_iron_palm',
    'feedback:success:Equipped technique.',
    'equip:loadout_1:passive:0:',
    'feedback:success:Technique unequipped.',
    'details:tech_iron_palm:upgradeRank',
    'feedback:info:Loadout applied - survival remains thin.',
    'tab:adventure',
    'world:city_pinewind_hamlet:manualPavilion:live',
  ]);
});

test('techniques exact controller disables Manual Pavilion route when city cannot be resolved', () => {
  const messages: string[] = [];
  const surface = createTechniquesExactMockupFixture();

  createTechniquesExactActionController({
    surface,
    selectedLoadoutId: 'loadout_1',
    selectedTechniqueId: null,
    selectedSlotKey: null,
    setSelectedTechniqueId: () => undefined,
    setSelectedSlotKey: () => undefined,
    setFeedback: (feedback) => messages.push(feedback.message),
    setSelectedFilter: () => undefined,
    openDetails: () => undefined,
    setSelectedLoadout: () => undefined,
    setAiProfile: () => undefined,
    setCastingPolicy: () => undefined,
    equipTechnique: () => ({ ok: true }),
    setActiveTab: () => undefined,
    openWorldBuildingModal: () => undefined,
    addNotification: () => undefined,
    resolveManualPavilionCityId: () => null,
  }).goToManualPavilion();

  assert.deepEqual(messages, ['No city with Manual Pavilion is available.']);
});
