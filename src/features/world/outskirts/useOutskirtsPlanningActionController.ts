import { useCallback } from 'react';
import type { OutskirtsDef } from '../../../types/index.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { OutskirtsSetupCard } from './types.js';

interface OutskirtsPlanningActionControllerOptions {
  cityId: string;
  outskirtsDef: OutskirtsDef | undefined;
  onStartOutskirts: () => void;
  onOpenSettings: () => void;
  onToggleAutoRepeat: () => void;
  onPreviewPreviousEncounter: () => void;
  onPreviewNextEncounter: () => void;
  onSelectEncounterPreview: (encounterId: string) => void;
  onOpenMedicinePouch: () => void;
}

export function useOutskirtsPlanningActionController(options: OutskirtsPlanningActionControllerOptions) {
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);

  const openTechniquesTab = useCallback(() => {
    useUIStore.getState().setActiveTab('techniques');
    closeWorldBuildingModal();
  }, [closeWorldBuildingModal]);

  const openTrackedBounties = useCallback(() => {
    if (!options.outskirtsDef) return;
    openWorldBuildingModal({ cityId: options.cityId, buildingKey: 'bounties' });
  }, [openWorldBuildingModal, options.cityId, options.outskirtsDef]);

  const openExpeditions = useCallback(() => {
    if (!options.outskirtsDef) return;
    openWorldBuildingModal({ cityId: options.cityId, buildingKey: 'expeditions' });
  }, [openWorldBuildingModal, options.cityId, options.outskirtsDef]);

  const openEquipmentSlot = useCallback((slotId: OutskirtsSetupCard['equipmentGrid'][number]['slotId']) => {
    if (slotId === 'weapon' || slotId === 'ring') {
      openTechniquesTab();
      return;
    }
    useUIStore.getState().setActiveTab('inventory');
    closeWorldBuildingModal();
  }, [closeWorldBuildingModal, openTechniquesTab]);

  const handleTacticalCellAction = useCallback((cellId: 'hp' | 'danger' | 'loadout' | 'aiProfile' | 'healing' | 'bounty' | 'expedition') => {
    if (cellId === 'loadout' || cellId === 'aiProfile') {
      openTechniquesTab();
      return;
    }
    if (cellId === 'bounty') {
      openTrackedBounties();
      return;
    }
    if (cellId === 'expedition') {
      openExpeditions();
    }
  }, [openExpeditions, openTechniquesTab, openTrackedBounties]);

  return {
    onStartHunt: options.onStartOutskirts,
    onOpenSettings: options.onOpenSettings,
    onToggleAutoRepeat: options.onToggleAutoRepeat,
    onPreviewPreviousEncounter: options.onPreviewPreviousEncounter,
    onPreviewNextEncounter: options.onPreviewNextEncounter,
    onSelectEncounterPreview: options.onSelectEncounterPreview,
    onOpenMedicinePouch: options.onOpenMedicinePouch,
    onOpenLoadout: openTechniquesTab,
    onOpenAiProfile: openTechniquesTab,
    onOpenAttackFocus: options.onOpenSettings,
    onOpenEquipmentSlot: openEquipmentSlot,
    onOpenTrackedBounties: openTrackedBounties,
    onOpenTacticalCell: handleTacticalCellAction,
    onOpenAreaSelector: undefined as (() => void) | undefined,
  };
}
