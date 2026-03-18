import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TechniqueDef } from '../content';
import type { SaveTechniqueLoadout } from '../types';
import { clampRealmIndexToSemesterSlice, getLiveRealmNameByIndex } from '../systems/progression/runtime/index.js';
import { useContentStore } from './contentStore';
import { useGameStore } from './gameStore';
import { GameEvents } from '../services/events/GameEvents';
import { useTechCollectionStore } from './techCollectionStore';

export type AiProfile = 'balanced' | 'survivor' | 'burst' | 'farmer';
export type CastingPolicy = 'aggressive' | 'balanced' | 'defensive';
export type SlotType = 'active' | 'passive' | 'ultimate';

export type EquipResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'locked' | 'wrong_type' | 'invalid_slot' | 'missing_tech';
      message: string;
      unlockAt?: { realmIndex: number; realmName: string };
    };

export interface TechniqueLoadout {
  id: string;
  name: string;
  slots: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
}

interface TechniqueStoreState {
  loadouts: TechniqueLoadout[];
  selectedLoadoutId: string;
  activeSlots: number;
  passiveSlots: number;
  getSlotProgressionSnapshot: (realmIndex?: number) => {
    displayed: { active: number; passive: number };
    unlocked: { active: number; passive: number; ultimate: boolean };
    unlockRequirements: {
      active: Record<number, SlotUnlockRequirement | null>;
      passive: Record<number, SlotUnlockRequirement | null>;
      ultimate: SlotUnlockRequirement | null;
    };
  };
  isSlotUnlocked: (slotType: SlotType, slotIndex: number, realmIndex?: number) => boolean;
  getSlotUnlockRequirement: (
    slotType: SlotType,
    slotIndex: number,
  ) => SlotUnlockRequirement | null;
  setSelectedLoadout: (id: string) => void;
  setSlotCounts: (slots: { active?: number; passive?: number }) => void;
  setAiProfile: (loadoutId: string, profile: AiProfile) => void;
  setCastingPolicy: (loadoutId: string, policy: CastingPolicy) => void;
  equipTechnique: (
    slotType: SlotType,
    slotIndex: number,
    techId: string,
    loadoutId?: string,
  ) => EquipResult;
  hydrateFromSave: (
    data: { loadouts: SaveTechniqueLoadout[]; selectedLoadoutId: string } | null | undefined,
  ) => void;
  resetLoadouts: () => void;
  getSelectedLoadout: () => TechniqueLoadout | undefined;
  getSelectedAiProfile: () => AiProfile;
  getSelectedCastingPolicy: () => CastingPolicy;
  getEquippedTechIds: (
    loadoutId?: string
  ) => { active: string[]; passive: string[]; ultimate: string | null };
  getCombatEquippedTechIds: (
    loadoutId?: string,
  ) => { active: string[]; passive: string[]; ultimate: string | null };
}

export const BASE_ACTIVE_SLOTS = 2;
export const BASE_PASSIVE_SLOTS = 1;

const MIN_DISPLAY_ACTIVE_SLOTS = 3;
const MIN_DISPLAY_PASSIVE_SLOTS = 2;

type SlotUnlockRequirement = {
  realmIndex: number;
  realmName: string;
  reasonText: string;
};

const mapAiProfileToCastingPolicy = (profile: AiProfile | undefined): CastingPolicy => {
  switch (profile) {
    case 'burst':
      return 'aggressive';
    case 'survivor':
      return 'defensive';
    case 'farmer':
      return 'balanced';
    default:
      return 'balanced';
  }
};

const createEmptyLoadout = (
  id: string,
  name: string,
  aiProfile: AiProfile,
  activeSlots: number,
  passiveSlots: number,
  castingPolicy?: CastingPolicy,
): TechniqueLoadout => ({
  id,
  name,
  aiProfile,
  castingPolicy: castingPolicy ?? mapAiProfileToCastingPolicy(aiProfile),
  slots: {
    active: Array.from({ length: activeSlots }, () => ''),
    passive: Array.from({ length: passiveSlots }, () => ''),
    ultimate: null,
  },
});

const clampSlotCount = (value: number, minimum: number) => {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.floor(value));
};

const normalizeSlots = (slots: string[], nextCount: number) => {
  if (slots.length === nextCount) return slots;
  if (slots.length > nextCount) return slots.slice(0, nextCount);
  return [...slots, ...Array.from({ length: nextCount - slots.length }, () => '')];
};

const isPassive = (tech: TechniqueDef | undefined) => {
  if (!tech) return false;
  if (tech.type === 'passive') return true;
  return Array.isArray((tech as any).tags) && (tech as any).tags.includes('passive');
};

const isUltimate = (tech: TechniqueDef | undefined) => tech?.type === 'ultimate';

const getRealmIndex = (realmIndex?: number) => {
  if (typeof realmIndex === 'number') return realmIndex;
  return useGameStore.getState().realm.index ?? 0;
};

const getRealmName = (realmIndex: number) => getLiveRealmNameByIndex(clampRealmIndexToSemesterSlice(realmIndex));

// Slot progression: Active 1-2 + Passive 1 always, Active 3 at realm 1, Passive 2 at realm 2, Ultimate at realm 3.
const computeSlotProgression = (
  activeSlots: number,
  passiveSlots: number,
  realmIndex: number,
) => {
  const displayedActive = Math.max(MIN_DISPLAY_ACTIVE_SLOTS, activeSlots);
  const displayedPassive = Math.max(MIN_DISPLAY_PASSIVE_SLOTS, passiveSlots);

  const baselineUnlockedActive = realmIndex >= 1 ? 3 : 2;
  const baselineUnlockedPassive = realmIndex >= 2 ? 2 : 1;
  const unlockedActive = Math.max(activeSlots, baselineUnlockedActive);
  const unlockedPassive = Math.max(passiveSlots, baselineUnlockedPassive);
  const ultimateUnlocked = realmIndex >= 3;

  return {
    displayed: { active: displayedActive, passive: displayedPassive },
    unlocked: { active: unlockedActive, passive: unlockedPassive, ultimate: ultimateUnlocked },
  };
};

const createUnlockRequirement = (
  realmIndex: number,
  reasonText: string,
): SlotUnlockRequirement => ({
  realmIndex,
  realmName: getRealmName(realmIndex),
  reasonText,
});

export const useTechniqueStore = create<TechniqueStoreState>()(
  immer((set, get) => ({
    activeSlots: BASE_ACTIVE_SLOTS,
    passiveSlots: BASE_PASSIVE_SLOTS,
    loadouts: (() => {
      const { displayed } = computeSlotProgression(
        BASE_ACTIVE_SLOTS,
        BASE_PASSIVE_SLOTS,
        getRealmIndex(0),
      );
      return [
        createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced', displayed.active, displayed.passive),
        createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor', displayed.active, displayed.passive),
        createEmptyLoadout('loadout_3', 'Loadout 3', 'burst', displayed.active, displayed.passive),
      ];
    })(),
    selectedLoadoutId: 'loadout_1',

    getSlotProgressionSnapshot: (realmIndex) => {
      const state = get();
      const resolvedRealmIndex = getRealmIndex(realmIndex);
      const { displayed, unlocked } = computeSlotProgression(
        state.activeSlots,
        state.passiveSlots,
        resolvedRealmIndex,
      );

      const unlockRequirements = {
        active: {
          0: null,
          1: null,
          2:
            unlocked.active > 2
              ? null
              : createUnlockRequirement(1, `Unlocks at: ${getRealmName(1)}`),
        } as Record<number, SlotUnlockRequirement | null>,
        passive: {
          0: null,
          1:
            unlocked.passive > 1
              ? null
              : createUnlockRequirement(2, `Unlocks at: ${getRealmName(2)}`),
        } as Record<number, SlotUnlockRequirement | null>,
        ultimate:
          unlocked.ultimate || resolvedRealmIndex >= 3
            ? null
            : createUnlockRequirement(3, `Unlocks at: ${getRealmName(3)}`),
      };

      return { displayed, unlocked, unlockRequirements };
    },

    isSlotUnlocked: (slotType, slotIndex, realmIndex) => {
      const state = get();
      const resolvedRealmIndex = getRealmIndex(realmIndex);
      const progression = computeSlotProgression(
        state.activeSlots,
        state.passiveSlots,
        resolvedRealmIndex,
      );
      if (slotType === 'ultimate') {
        return progression.unlocked.ultimate;
      }

      const unlockedCount = slotType === 'active'
        ? progression.unlocked.active
        : progression.unlocked.passive;
      return slotIndex >= 0 && slotIndex < unlockedCount;
    },

    getSlotUnlockRequirement: (slotType, slotIndex) => {
      if (get().isSlotUnlocked(slotType, slotIndex)) return null;
      if (slotType === 'ultimate') {
        return createUnlockRequirement(3, `Unlocks at: ${getRealmName(3)}`);
      }
      if (slotType === 'active') {
        if (slotIndex === 2) return createUnlockRequirement(1, `Unlocks at: ${getRealmName(1)}`);
        return null;
      }
      if (slotType === 'passive') {
        if (slotIndex === 1) return createUnlockRequirement(2, `Unlocks at: ${getRealmName(2)}`);
        return null;
      }
      return null;
    },

    setSelectedLoadout: (id) => {
      const exists = get().loadouts.some((l) => l.id === id);
      if (!exists) return;
      set((state) => {
        state.selectedLoadoutId = id;
      });
      GameEvents.emit({ type: 'techniques/loadout_changed', payload: { loadoutId: id } });
    },

    setSlotCounts: ({ active, passive }) => {
      const current = get();
      const previousActive = current.activeSlots;
      const previousPassive = current.passiveSlots;
      const nextActive = clampSlotCount(active ?? current.activeSlots, BASE_ACTIVE_SLOTS);
      const nextPassive = clampSlotCount(passive ?? current.passiveSlots, BASE_PASSIVE_SLOTS);
      if (nextActive === current.activeSlots && nextPassive === current.passiveSlots) return;

      set((state) => {
        state.activeSlots = nextActive;
        state.passiveSlots = nextPassive;
        const progression = computeSlotProgression(nextActive, nextPassive, getRealmIndex());
        state.loadouts.forEach((loadout) => {
          loadout.slots.active = normalizeSlots(loadout.slots.active, progression.displayed.active);
          loadout.slots.passive = normalizeSlots(loadout.slots.passive, progression.displayed.passive);
        });
      });

      if (nextActive > previousActive) {
        for (let index = previousActive; index < nextActive; index += 1) {
          GameEvents.emit({ type: 'techniques/slot_unlocked', payload: { slotType: 'active', slotIndex: index } });
        }
      }

      if (nextPassive > previousPassive) {
        for (let index = previousPassive; index < nextPassive; index += 1) {
          GameEvents.emit({ type: 'techniques/slot_unlocked', payload: { slotType: 'passive', slotIndex: index } });
        }
      }
    },

    setAiProfile: (loadoutId, profile) => {
      set((state) => {
        const loadout = state.loadouts.find((l) => l.id === loadoutId);
        if (!loadout) return;
        loadout.aiProfile = profile;
      });
    },

    setCastingPolicy: (loadoutId, policy) => {
      set((state) => {
        const loadout = state.loadouts.find((l) => l.id === loadoutId);
        if (!loadout) return;
        loadout.castingPolicy = policy;
      });
    },

    equipTechnique: (slotType, slotIndex, techId, loadoutId) => {
      const state = get();
      const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
      if (!loadout) {
        GameEvents.emit({
          type: 'techniques/equip_failed',
          payload: { techniqueId: techId, slotType, slotIndex, reason: 'invalid_loadout' },
        });
        return { ok: false as const, reason: 'invalid_slot', message: 'Unknown loadout' };
      }

      const progression = get().getSlotProgressionSnapshot();
      const unlocked = get().isSlotUnlocked(slotType, slotIndex);

      const displayedLimit =
        slotType === 'active'
          ? progression.displayed.active
          : slotType === 'passive'
          ? progression.displayed.passive
          : 1;

      if (slotIndex < 0 || slotIndex >= displayedLimit || (slotType === 'ultimate' && slotIndex !== 0)) {
        GameEvents.emit({
          type: 'techniques/equip_failed',
          payload: { techniqueId: techId, slotType, slotIndex, reason: 'invalid_slot' },
        });
        return {
          ok: false,
          reason: 'invalid_slot',
          message: 'That slot does not exist.',
        };
      }

      if (!unlocked) {
        const requirement = get().getSlotUnlockRequirement(slotType, slotIndex);
        GameEvents.emit({
          type: 'techniques/equip_failed',
          payload: { techniqueId: techId, slotType, slotIndex, reason: 'locked' },
        });
        return {
          ok: false,
          reason: 'locked',
          message: 'This slot is locked.',
          unlockAt: requirement ? { realmIndex: requirement.realmIndex, realmName: requirement.realmName } : undefined,
        };
      }

      if (techId !== '') {
        const unlockedTech = useTechCollectionStore.getState().hasTech(techId);
        if (!unlockedTech) {
          GameEvents.emit({
            type: 'techniques/equip_failed',
            payload: { techniqueId: techId, slotType, slotIndex, reason: 'missing_tech' },
          });
          return { ok: false, reason: 'missing_tech', message: 'Technique not learned yet.' };
        }

        const techniqueDef = useContentStore.getState().maps.techniquesById?.[techId];
        if (!techniqueDef) {
          console.warn(`[TechniqueStore] Attempted to equip unknown technique: ${techId}`);
          GameEvents.emit({
            type: 'techniques/equip_failed',
            payload: { techniqueId: techId, slotType, slotIndex, reason: 'missing_tech' },
          });
          return { ok: false, reason: 'missing_tech', message: 'Technique data missing.' };
        }

        const isPassiveTech = isPassive(techniqueDef);
        const isUltimateTech = isUltimate(techniqueDef);
        const isActiveTech = !isPassiveTech && !isUltimateTech;
        const typeLabel = isUltimateTech ? 'Ultimate' : isPassiveTech ? 'Passive' : 'Active';
        const article = ['A', 'E', 'I', 'O', 'U'].includes(typeLabel[0] ?? '') ? 'an' : 'a';

        if (slotType === 'active' && !isActiveTech) {
          GameEvents.emit({
            type: 'techniques/equip_failed',
            payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
          });
          return {
            ok: false,
            reason: 'wrong_type',
            message: `This technique is ${typeLabel}. It must be equipped in ${article} ${typeLabel} slot.`,
          };
        }
        if (slotType === 'passive' && !isPassiveTech) {
          GameEvents.emit({
            type: 'techniques/equip_failed',
            payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
          });
          return {
            ok: false,
            reason: 'wrong_type',
            message: `This technique is ${typeLabel}. It must be equipped in ${article} ${typeLabel} slot.`,
          };
        }
        if (slotType === 'ultimate' && !isUltimateTech) {
          GameEvents.emit({
            type: 'techniques/equip_failed',
            payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
          });
          return {
            ok: false,
            reason: 'wrong_type',
            message: `This technique is ${typeLabel}. It must be equipped in the ${typeLabel} slot.`,
          };
        }
      }

      const previousTechId =
        slotType === 'active'
          ? loadout.slots.active[slotIndex]
          : slotType === 'passive'
          ? loadout.slots.passive[slotIndex]
          : loadout.slots.ultimate ?? '';

      set((draft) => {
        const targetLoadout = draft.loadouts.find((l) => l.id === (loadoutId ?? draft.selectedLoadoutId));
        if (!targetLoadout) return;

        if (techId !== '') {
          targetLoadout.slots.active = targetLoadout.slots.active.map((id, idx) =>
            slotType === 'active' && idx === slotIndex ? id : id === techId ? '' : id,
          );
          targetLoadout.slots.passive = targetLoadout.slots.passive.map((id, idx) =>
            slotType === 'passive' && idx === slotIndex ? id : id === techId ? '' : id,
          );
          if (targetLoadout.slots.ultimate === techId) {
            targetLoadout.slots.ultimate = null;
          }
        }

        if (slotType === 'active') {
          targetLoadout.slots.active[slotIndex] = techId;
        } else if (slotType === 'passive') {
          targetLoadout.slots.passive[slotIndex] = techId;
        } else {
          targetLoadout.slots.ultimate = techId || null;
        }
      });

      GameEvents.emit({
        type: 'techniques/equipped',
        payload: { techniqueId: techId, slot: slotIndex, slotType },
      });
      const action: 'equip' | 'swap' | 'unequip' =
        techId === ''
          ? 'unequip'
          : previousTechId && previousTechId !== '' && previousTechId !== techId
          ? 'swap'
          : 'equip';
      GameEvents.emit({
        type: 'techniques/equip_changed',
        payload: { techniqueId: techId, slotType, slotIndex, action },
      });

      return { ok: true };
    },

    hydrateFromSave: (data) => {
      if (!data || !Array.isArray(data.loadouts) || data.loadouts.length === 0) return;
      const progression = get().getSlotProgressionSnapshot();
      const normalizedLoadouts = data.loadouts.map((loadout) => ({
        ...loadout,
        castingPolicy: loadout.castingPolicy ?? mapAiProfileToCastingPolicy(loadout.aiProfile),
        slots: {
          active: normalizeSlots(loadout.slots?.active ?? [], progression.displayed.active),
          passive: normalizeSlots(loadout.slots?.passive ?? [], progression.displayed.passive),
          ultimate: loadout.slots?.ultimate ?? null,
        },
      }));

      const selectedExists = normalizedLoadouts.some((l) => l.id === data.selectedLoadoutId);
      set((state) => {
        state.loadouts = normalizedLoadouts;
        state.selectedLoadoutId = selectedExists ? data.selectedLoadoutId : normalizedLoadouts[0].id;
      });
    },

    resetLoadouts: () => {
      const progression = get().getSlotProgressionSnapshot();
      set(() => ({
        loadouts: [
          createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced', progression.displayed.active, progression.displayed.passive),
          createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor', progression.displayed.active, progression.displayed.passive),
          createEmptyLoadout('loadout_3', 'Loadout 3', 'burst', progression.displayed.active, progression.displayed.passive),
        ],
        selectedLoadoutId: 'loadout_1',
      }));
    },

    getSelectedLoadout: () => {
      const state = get();
      return state.loadouts.find((l) => l.id === state.selectedLoadoutId);
    },

    getSelectedAiProfile: () => {
      return get().getSelectedLoadout()?.aiProfile ?? 'balanced';
    },

    getSelectedCastingPolicy: () => {
      return get().getSelectedLoadout()?.castingPolicy ?? 'balanced';
    },

    getEquippedTechIds: (loadoutId) => {
      const state = get();
      const progression = state.getSlotProgressionSnapshot();
      const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
      if (!loadout) {
        return {
          active: Array.from({ length: progression.displayed.active }, () => ''),
          passive: Array.from({ length: progression.displayed.passive }, () => ''),
          ultimate: null,
        };
      }
      return {
        active: normalizeSlots([...loadout.slots.active], progression.displayed.active),
        passive: normalizeSlots([...loadout.slots.passive], progression.displayed.passive),
        ultimate: loadout.slots.ultimate || null,
      };
    },

    getCombatEquippedTechIds: (loadoutId) => {
      const state = get();
      const progression = state.getSlotProgressionSnapshot();
      const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
      if (!loadout) {
        return { active: [], passive: [], ultimate: null };
      }

      const ultimate = progression.unlocked.ultimate && loadout.slots.ultimate ? loadout.slots.ultimate : null;
      return {
        active: [...loadout.slots.active].slice(0, progression.unlocked.active).filter((id) => id),
        passive: [...loadout.slots.passive].slice(0, progression.unlocked.passive).filter((id) => id),
        ultimate,
      };
    },
  }))
);
