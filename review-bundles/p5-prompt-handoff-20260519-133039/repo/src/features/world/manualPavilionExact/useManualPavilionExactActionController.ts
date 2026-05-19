import { useMemo } from 'react';
import { useManualPavilionStore, type ManualPurchaseResult } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { useUIStore, type UINotification } from '../../../stores/uiStore.js';
import type {
  ManualPavilionActionKind,
  ManualPavilionButtonSurface,
  ManualPavilionExactSurfaceV1,
  ManualPavilionSpineSurface,
} from './manualPavilionExactTypes.js';

type RefreshResult = { ok: boolean; reason?: string };
type LoosePurchaseResult =
  | ManualPurchaseResult
  | {
      ok: false;
      reason: string;
    }
  | {
      ok: true;
      manualGranted?: boolean;
      manualInstanceId?: string;
      duplicateConverted?: boolean;
      fragmentsGranted?: number;
      fragmentsGained?: number;
      manualName?: string;
      outcome?: 'manualGranted' | 'duplicateConverted';
    };

export interface ManualPavilionExactActionControllerInput {
  cityId: string;
  pavilionId: string | null;
  surface: ManualPavilionExactSurfaceV1;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  closeWorldBuildingModal: () => void;
  refreshStock: (pavilionId: string, nowMs: number) => RefreshResult;
  buyManual: (args: { pavilionId: string; stockId: number; mode: 'buy' | 'buyAndStudy' }) => LoosePurchaseResult;
  startStudy: (manualInstanceId: string, nowMs?: number) => { ok: boolean; reason?: string };
  openManualSatchel: () => void;
  requestTechniqueFocus: (techId: string, action: 'open' | 'upgradeRank' | 'rerollTraits') => void;
  addNotification: (type: UINotification['type'], message: string, duration?: number) => void;
  now: () => number;
}

export interface ManualPavilionExactActionController {
  selectSpine: (slot: ManualPavilionSpineSurface) => void;
  returnToWorld: () => void;
  refreshStock: () => void;
  performInspectorAction: (button: ManualPavilionButtonSurface) => void;
  buyManual: () => void;
  studyLater: () => void;
  viewTechniques: () => void;
  openSatchel: () => void;
}

function selectedSlot(surface: ManualPavilionExactSurfaceV1): ManualPavilionSpineSurface | null {
  return surface.shelf.selectedSlot
    ?? surface.shelf.primarySlots.find((slot) => slot.slotIndex === surface.meta.selectedSlotIndex)
    ?? null;
}

function readableReason(reason: string | null | undefined): string {
  if (!reason) return 'Action unavailable.';
  return reason
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function purchaseMessage(result: LoosePurchaseResult, fallbackManualName: string, actionKind: ManualPavilionActionKind): string {
  if (!result.ok) return readableReason(result.reason);
  const duplicate = ('outcome' in result && result.outcome === 'duplicateConverted') || ('duplicateConverted' in result && result.duplicateConverted);
  if (duplicate) {
    const fragments = ('fragmentsGained' in result ? result.fragmentsGained : undefined)
      ?? ('fragmentsGranted' in result ? result.fragmentsGranted : undefined)
      ?? 0;
    return `Duplicate converted (+${fragments} fragments).`;
  }
  const manualName = 'manualName' in result && result.manualName ? result.manualName : fallbackManualName;
  if (actionKind === 'buy_to_satchel') return 'Manual secured in the satchel.';
  return manualName ? `Purchased "${manualName}".` : 'Manual secured for later study.';
}

function buySelected(input: ManualPavilionExactActionControllerInput, button: ManualPavilionButtonSurface): void {
  const slot = selectedSlot(input.surface);
  if (!button.enabled) {
    input.addNotification('warning', button.disabledReason ?? 'Manual purchase is unavailable.', 2500);
    return;
  }
  if (!input.pavilionId) {
    input.addNotification('error', 'Manual Pavilion reference is unavailable.', 2500);
    return;
  }
  if (!slot || typeof slot.stockId !== 'number') {
    input.addNotification('warning', 'Select a live manual before buying.', 2500);
    return;
  }

  const mode = button.actionKind === 'buy_and_study' ? 'buyAndStudy' : 'buy';
  const result = input.buyManual({
    pavilionId: input.pavilionId,
    stockId: slot.stockId,
    mode,
  });
  if (!result.ok) {
    input.addNotification('warning', readableReason(result.reason), 2500);
    return;
  }

  if (button.actionKind === 'buy_and_study') {
    const manualInstanceId = 'manualInstanceId' in result ? result.manualInstanceId : undefined;
    if (manualInstanceId) {
      const study = input.startStudy(manualInstanceId, input.now());
      if (study.ok) {
        input.addNotification('success', `Studying "${'manualName' in result && result.manualName ? result.manualName : slot.title}".`, 2500);
        return;
      }
      input.addNotification('warning', readableReason(study.reason), 2500);
      return;
    }
  }

  input.addNotification('success', purchaseMessage(result, slot.title, button.actionKind), 2500);
}

function startSelectedStudy(input: ManualPavilionExactActionControllerInput, button: ManualPavilionButtonSurface): void {
  const slot = selectedSlot(input.surface);
  if (!button.enabled) {
    input.addNotification('warning', button.disabledReason ?? 'Study is unavailable.', 2500);
    return;
  }
  const manualInstanceId = slot?.manualInstanceId;
  if (!manualInstanceId) {
    input.addNotification('warning', 'Manual instance is not available in Satchel.', 2500);
    return;
  }
  const result = input.startStudy(manualInstanceId, input.now());
  if (!result.ok) {
    input.addNotification('warning', readableReason(result.reason), 2500);
    return;
  }
  input.addNotification('success', `Studying "${slot.title}".`, 2500);
}

function routeTechnique(input: ManualPavilionExactActionControllerInput, actionKind: ManualPavilionActionKind): void {
  const slot = selectedSlot(input.surface);
  const techId = slot?.techniqueId ?? input.surface.meta.selectedTechniqueId;
  if (!techId) {
    input.addNotification('warning', 'No technique is selected.', 2500);
    return;
  }
  if (actionKind === 'preview_technique') {
    input.addNotification('info', 'Preview available in the inspector; study this manual before opening it in Techniques.', 3000);
    return;
  }
  input.closeWorldBuildingModal();
  input.requestTechniqueFocus(techId, actionKind === 'view_rank_progress' ? 'upgradeRank' : 'open');
}

function performAction(input: ManualPavilionExactActionControllerInput, button: ManualPavilionButtonSurface): void {
  if (!button.enabled) {
    input.addNotification('warning', button.disabledReason ?? 'Action unavailable.', 2500);
    return;
  }
  switch (button.actionKind) {
    case 'buy_and_study':
    case 'buy_to_satchel':
    case 'buy_duplicate_fragments':
      buySelected(input, button);
      break;
    case 'start_study':
      startSelectedStudy(input, button);
      break;
    case 'open_satchel':
      input.openManualSatchel();
      break;
    case 'preview_technique':
    case 'open_techniques':
    case 'view_rank_progress':
      routeTechnique(input, button.actionKind);
      break;
    default:
      input.addNotification('warning', button.disabledReason ?? 'Action unavailable.', 2500);
      break;
  }
}

export function createManualPavilionExactActionController(
  input: ManualPavilionExactActionControllerInput,
): ManualPavilionExactActionController {
  return {
    selectSpine(slot) {
      if (slot.state === 'placeholder' || slot.locked && slot.slotIndex === null) return;
      input.setSelectedSlotIndex(slot.slotIndex);
    },
    returnToWorld() {
      input.closeWorldBuildingModal();
    },
    refreshStock() {
      if (!input.pavilionId) {
        input.addNotification('error', 'Manual Pavilion reference is unavailable.', 2500);
        return;
      }
      if (!input.surface.bottomStrip.refreshButton.enabled) {
        input.addNotification('warning', input.surface.bottomStrip.refreshButton.disabledReason ?? 'Stock refresh is not ready.', 2500);
        return;
      }
      const result = input.refreshStock(input.pavilionId, input.now());
      if (!result.ok) {
        input.addNotification('warning', readableReason(result.reason), 2500);
        return;
      }
      input.setSelectedSlotIndex(null);
      input.addNotification('success', 'Manual Pavilion stock refreshed.', 2500);
    },
    performInspectorAction(button) {
      performAction(input, button);
    },
    buyManual() {
      performAction(input, input.surface.inspector.buyButton);
    },
    studyLater() {
      performAction(input, input.surface.inspector.studyLaterButton);
    },
    viewTechniques() {
      performAction(input, input.surface.inspector.viewTechniquesButton);
    },
    openSatchel() {
      input.openManualSatchel();
    },
  };
}

export function useManualPavilionExactActionController(input: {
  cityId: string;
  pavilionId: string | null;
  surface: ManualPavilionExactSurfaceV1;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  nowMs?: number;
}): ManualPavilionExactActionController {
  const refreshStock = useManualPavilionStore((state) => state.refreshStock);
  const buyManual = useManualPavilionStore((state) => state.buyManual);
  const startStudy = useManualSatchelStore((state) => state.startStudy);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const requestTechniqueFocus = useUIStore((state) => state.requestTechniqueFocus);
  const addNotification = useUIStore((state) => state.addNotification);

  return useMemo(
    () => createManualPavilionExactActionController({
      cityId: input.cityId,
      pavilionId: input.pavilionId,
      surface: input.surface,
      selectedSlotIndex: input.selectedSlotIndex,
      setSelectedSlotIndex: input.setSelectedSlotIndex,
      closeWorldBuildingModal,
      refreshStock,
      buyManual: (args) => buyManual(args),
      startStudy,
      openManualSatchel,
      requestTechniqueFocus,
      addNotification: (type, message, duration) => addNotification(type, message, duration),
      now: () => input.nowMs ?? Date.now(),
    }),
    [
      addNotification,
      buyManual,
      closeWorldBuildingModal,
      input.cityId,
      input.nowMs,
      input.pavilionId,
      input.selectedSlotIndex,
      input.setSelectedSlotIndex,
      input.surface,
      openManualSatchel,
      refreshStock,
      requestTechniqueFocus,
      startStudy,
    ],
  );
}
