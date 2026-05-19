import { useMemo } from 'react';
import type { AiProfile, CastingPolicy, TechniqueSlotType } from '../../types/index.js';
import type { GameTab } from '../../stores/uiStore.js';
import type { EquipResult } from '../../stores/techniqueStore.js';
import { useTechniqueStore } from '../../stores/techniqueStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type {
  TechniquesExactDetailIntent,
  TechniquesExactFilterId,
  TechniquesExactSurfaceV1,
  TechniquesExactFeedbackTone,
} from './techniquesExactTypes.js';
import { resolveManualPavilionCityIdForTechniquesExact } from './buildTechniquesExactSurface.js';

type ActionFeedback = {
  tone: Exclude<TechniquesExactFeedbackTone, 'idle'> | 'info';
  message: string;
};

export interface CreateTechniquesExactActionControllerInput {
  surface: TechniquesExactSurfaceV1;
  selectedLoadoutId: string;
  selectedTechniqueId: string | null;
  selectedSlotKey: string | null;
  setSelectedTechniqueId: (techId: string | null) => void;
  setSelectedSlotKey: (slotKey: string | null) => void;
  setSelectedFilter: (filterId: TechniquesExactFilterId) => void;
  setFeedback: (feedback: ActionFeedback) => void;
  openDetails: (techId: string, intent?: TechniquesExactDetailIntent) => void;
  setSelectedLoadout: (loadoutId: string) => void;
  setAiProfile: (loadoutId: string, profile: AiProfile) => void;
  setCastingPolicy: (loadoutId: string, policy: CastingPolicy) => void;
  equipTechnique: (
    slotType: TechniqueSlotType,
    slotIndex: number,
    techId: string,
    loadoutId?: string,
  ) => EquipResult;
  setActiveTab: (tab: GameTab) => void;
  openWorldBuildingModal: (args: {
    cityId: string;
    buildingKey: 'manualPavilion';
    intent?: { manualPavilionExactMode?: 'live' | 'fixture' | 'legacy' };
  }) => void;
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  resolveManualPavilionCityId: () => string | null;
}

export function createTechniquesExactActionController(input: CreateTechniquesExactActionControllerInput) {
  const notify = (tone: ActionFeedback['tone'], message: string) => {
    input.setFeedback({ tone, message });
    if (tone === 'error') {
      input.addNotification('error', message);
    }
  };

  const selectedLoadoutId = () => input.selectedLoadoutId || input.surface.meta.selectedLoadoutId;

  return {
    selectLoadout(loadoutId: string) {
      input.setSelectedLoadout(loadoutId);
    },
    selectAiProfile(profile: AiProfile) {
      input.setAiProfile(selectedLoadoutId(), profile);
    },
    selectCastingPolicy(policy: CastingPolicy) {
      input.setCastingPolicy(selectedLoadoutId(), policy);
    },
    selectOwnedTechnique(techId: string) {
      input.setSelectedTechniqueId(techId);
    },
    selectFilter(filterId: TechniquesExactFilterId) {
      input.setSelectedFilter(filterId);
    },
    selectSlot(slotKey: string, _slotType?: TechniqueSlotType, _slotIndex?: number) {
      input.setSelectedSlotKey(slotKey);
    },
    requestEquip(slotType: TechniqueSlotType, slotIndex: number, techId?: string | null) {
      const resolvedTechId = techId ?? input.selectedTechniqueId ?? input.surface.meta.selectedTechniqueId;
      if (!resolvedTechId) {
        notify('error', 'Select a technique before equipping.');
        return;
      }
      const result = input.equipTechnique(slotType, slotIndex, resolvedTechId, selectedLoadoutId());
      if (result.ok) {
        notify('success', 'Equipped technique.');
      } else {
        notify('error', result.message);
      }
    },
    requestUnequip(slotType: TechniqueSlotType, slotIndex: number) {
      const result = input.equipTechnique(slotType, slotIndex, '', selectedLoadoutId());
      if (result.ok) {
        notify('success', 'Technique unequipped.');
      } else {
        notify('error', result.message);
      }
    },
    openDetails(techId?: string | null, intent?: TechniquesExactDetailIntent) {
      const resolvedTechId = techId ?? input.selectedTechniqueId ?? input.surface.meta.selectedTechniqueId;
      if (!resolvedTechId) {
        notify('error', 'Select a technique before opening details.');
        return;
      }
      input.openDetails(resolvedTechId, intent ?? 'open');
    },
    applyLoadout() {
      const survival = input.surface.readinessImpact.segments.find((segment) => segment.label === 'Survival')?.value;
      if (survival && survival !== 'Good') {
        notify('info', `Loadout applied - survival remains ${survival.toLowerCase()}.`);
        return;
      }
      notify('success', 'Loadout applied - combat form ready.');
    },
    goToManualPavilion() {
      const cityId = input.resolveManualPavilionCityId();
      if (!cityId) {
        notify('error', 'No city with Manual Pavilion is available.');
        return;
      }
      input.setActiveTab('adventure');
      input.openWorldBuildingModal({
        cityId,
        buildingKey: 'manualPavilion',
        intent: { manualPavilionExactMode: 'live' },
      });
    },
  };
}

export interface UseTechniquesExactActionControllerInput {
  surface: TechniquesExactSurfaceV1;
  selectedTechniqueId: string | null;
  selectedSlotKey: string | null;
  setSelectedTechniqueId: (techId: string | null) => void;
  setSelectedSlotKey: (slotKey: string | null) => void;
  setSelectedFilter: (filterId: TechniquesExactFilterId) => void;
  setFeedback: (feedback: ActionFeedback) => void;
  openDetails: (techId: string, intent?: TechniquesExactDetailIntent) => void;
}

export function useTechniquesExactActionController(input: UseTechniquesExactActionControllerInput) {
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const setAiProfile = useTechniqueStore((state) => state.setAiProfile);
  const setCastingPolicy = useTechniqueStore((state) => state.setCastingPolicy);
  const equipTechnique = useTechniqueStore((state) => state.equipTechnique);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const addNotification = useUIStore((state) => state.addNotification);

  return useMemo(() => createTechniquesExactActionController({
    surface: input.surface,
    selectedLoadoutId: input.surface.meta.selectedLoadoutId,
    selectedTechniqueId: input.selectedTechniqueId,
    selectedSlotKey: input.selectedSlotKey,
    setSelectedTechniqueId: input.setSelectedTechniqueId,
    setSelectedSlotKey: input.setSelectedSlotKey,
    setSelectedFilter: input.setSelectedFilter,
    setFeedback: input.setFeedback,
    openDetails: input.openDetails,
    setSelectedLoadout,
    setAiProfile,
    setCastingPolicy,
    equipTechnique,
    setActiveTab,
    openWorldBuildingModal,
    addNotification: (type, message) => addNotification(type, message),
    resolveManualPavilionCityId: resolveManualPavilionCityIdForTechniquesExact,
  }), [
    addNotification,
    equipTechnique,
    input.openDetails,
    input.selectedSlotKey,
    input.selectedTechniqueId,
    input.setFeedback,
    input.setSelectedFilter,
    input.setSelectedSlotKey,
    input.setSelectedTechniqueId,
    input.surface,
    openWorldBuildingModal,
    setActiveTab,
    setAiProfile,
    setCastingPolicy,
    setSelectedLoadout,
  ]);
}
