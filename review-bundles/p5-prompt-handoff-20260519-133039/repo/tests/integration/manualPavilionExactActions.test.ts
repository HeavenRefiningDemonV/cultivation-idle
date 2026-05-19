import assert from 'node:assert/strict';
import test from 'node:test';

import { createManualPavilionExactMockupFixture } from '../../src/features/world/manualPavilionExact/buildManualPavilionExactSurface.js';
import { createManualPavilionExactActionController } from '../../src/features/world/manualPavilionExact/useManualPavilionExactActionController.js';

test('manual pavilion exact controller selects surfaced spine slots without opening a detail modal', () => {
  const selected: Array<number | null> = [];
  const surface = createManualPavilionExactMockupFixture();
  const controller = createManualPavilionExactActionController({
    cityId: 'city_pinewind_hamlet',
    pavilionId: 'pavilion_pinewind_manual',
    surface,
    selectedSlotIndex: surface.meta.selectedSlotIndex,
    setSelectedSlotIndex: (slotIndex) => selected.push(slotIndex),
    closeWorldBuildingModal: () => undefined,
    refreshStock: () => ({ ok: true }),
    buyManual: () => ({ ok: true }),
    startStudy: () => ({ ok: true }),
    openManualSatchel: () => undefined,
    requestTechniqueFocus: () => undefined,
    addNotification: () => undefined,
    now: () => 1000,
  });

  controller.selectSpine(surface.shelf.primarySlots[2]);
  assert.deepEqual(selected, [3]);
});

test('manual pavilion exact controller routes return, satchel, refresh, buy/study, and preview through injected side effects', () => {
  const calls: string[] = [];
  const surface = createManualPavilionExactMockupFixture();
  const controller = createManualPavilionExactActionController({
    cityId: 'city_pinewind_hamlet',
    pavilionId: 'pavilion_pinewind_manual',
    surface,
    selectedSlotIndex: surface.meta.selectedSlotIndex,
    setSelectedSlotIndex: (slotIndex) => calls.push(`select:${String(slotIndex)}`),
    closeWorldBuildingModal: () => calls.push('close-world'),
    refreshStock: (pavilionId, nowMs) => {
      calls.push(`refresh:${pavilionId}:${nowMs}`);
      return { ok: false, reason: 'ready later' };
    },
    buyManual: (args) => {
      calls.push(`buy:${args.pavilionId}:${args.stockId}:${args.mode}`);
      return { ok: true, manualGranted: true, manualInstanceId: 'manual-instance-1', manualName: 'Iron Palm Sutra' };
    },
    startStudy: (manualInstanceId) => {
      calls.push(`study:${manualInstanceId}`);
      return { ok: true };
    },
    openManualSatchel: () => calls.push('open-satchel'),
    requestTechniqueFocus: (techId, action) => calls.push(`focus:${techId}:${action}`),
    addNotification: (_type, message) => calls.push(`notify:${message}`),
    now: () => 1000,
  });

  controller.returnToWorld();
  controller.refreshStock();
  controller.buyManual();
  controller.studyLater();
  controller.openSatchel();
  controller.viewTechniques();

  assert.deepEqual(calls, [
    'close-world',
    'refresh:pavilion_pinewind_manual:1000',
    'notify:Ready Later',
    'buy:pavilion_pinewind_manual:1:buyAndStudy',
    'study:manual-instance-1',
    'notify:Studying "Iron Palm Sutra".',
    'buy:pavilion_pinewind_manual:1:buy',
    'notify:Manual secured in the satchel.',
    'open-satchel',
    'notify:Preview available in the inspector; study this manual before opening it in Techniques.',
  ]);
});

test('manual pavilion exact controller only opens techniques for learned lifecycle actions', () => {
  const calls: string[] = [];
  const surface = createManualPavilionExactMockupFixture();
  const learnedSurface = {
    ...surface,
    shelf: {
      ...surface.shelf,
      selectedSlot: surface.shelf.selectedSlot
        ? {
            ...surface.shelf.selectedSlot,
            lifecycleState: 'learned' as const,
            lifecycleLabel: 'Learned',
            stockState: 'sold' as const,
            stateLabel: 'Learned',
          }
        : null,
    },
    inspector: {
      ...surface.inspector,
      lifecycleState: 'learned' as const,
      viewTechniquesButton: {
        ...surface.inspector.viewTechniquesButton,
        label: 'Open in Techniques',
        actionKind: 'open_techniques' as const,
        enabled: true,
      },
    },
  };

  createManualPavilionExactActionController({
    cityId: 'city_pinewind_hamlet',
    pavilionId: 'pavilion_pinewind_manual',
    surface: learnedSurface,
    selectedSlotIndex: learnedSurface.meta.selectedSlotIndex,
    setSelectedSlotIndex: () => undefined,
    closeWorldBuildingModal: () => calls.push('close-world'),
    refreshStock: () => ({ ok: true }),
    buyManual: () => ({ ok: true }),
    startStudy: () => ({ ok: true }),
    openManualSatchel: () => undefined,
    requestTechniqueFocus: (techId, action) => calls.push(`focus:${techId}:${action}`),
    addNotification: (_type, message) => calls.push(`notify:${message}`),
    now: () => 1000,
  }).viewTechniques();

  assert.deepEqual(calls, [
    'close-world',
    'focus:tech_iron_palm:open',
  ]);
});

test('manual pavilion exact controller reports duplicate conversion through notification feedback', () => {
  const messages: string[] = [];
  const surface = createManualPavilionExactMockupFixture();
  const duplicateSlot = surface.shelf.primarySlots.find((slot) => slot.duplicate);
  assert.ok(duplicateSlot);

  const duplicateSurface = {
    ...surface,
    meta: {
      ...surface.meta,
      selectedSlotIndex: duplicateSlot.slotIndex,
      selectedTechniqueId: duplicateSlot.techniqueId,
    },
    shelf: {
      ...surface.shelf,
      selectedSlot: {
        ...duplicateSlot,
        lifecycleState: 'duplicate_fragment' as const,
        lifecycleLabel: 'Duplicate Fragments',
        primaryReasonLabel: 'Fragments +2',
      },
      primarySlots: surface.shelf.primarySlots.map((slot) => ({ ...slot, selected: slot.id === duplicateSlot.id })),
    },
    inspector: {
      ...surface.inspector,
      lifecycleState: 'duplicate_fragment' as const,
      buyButton: {
        ...surface.inspector.buyButton,
        label: 'Buy Duplicate for Fragments',
        actionKind: 'buy_duplicate_fragments' as const,
      },
    },
  };

  createManualPavilionExactActionController({
    cityId: 'city_pinewind_hamlet',
    pavilionId: 'pavilion_pinewind_manual',
    surface: duplicateSurface,
    selectedSlotIndex: duplicateSlot.slotIndex,
    setSelectedSlotIndex: () => undefined,
    closeWorldBuildingModal: () => undefined,
    refreshStock: () => ({ ok: true }),
    buyManual: () => ({ ok: true, duplicateConverted: true, fragmentsGranted: 2 }),
    startStudy: () => ({ ok: true }),
    openManualSatchel: () => undefined,
    requestTechniqueFocus: () => undefined,
    addNotification: (_type, message) => messages.push(message),
    now: () => 1000,
  }).buyManual();

  assert.deepEqual(messages, ['Duplicate converted (+2 fragments).']);
});
