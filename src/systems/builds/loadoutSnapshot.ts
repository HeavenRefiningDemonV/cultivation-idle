import type { AiProfile, CastingPolicy, TechniqueSlotType } from '../../types/index.js';
import { useGameStore } from '../../stores/gameStore.js';
import { BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, useTechniqueStore } from '../../stores/techniqueStore.js';
import {
  resolveLoadoutProgressionSnapshot,
} from './loadoutProgressionContract.js';

export interface LoadoutSnapshotSource {
  id: string;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  slots: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
}

export interface EmptyUnlockedLoadoutSlot {
  slotType: TechniqueSlotType;
  slotIndex: number;
}

export interface ParkedLockedAssignment {
  slotType: TechniqueSlotType;
  slotIndex: number;
  techId: string;
}

export interface LoadoutSnapshot {
  loadoutId: string;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  displayed: { active: number; passive: number };
  unlocked: { active: number; passive: number; ultimate: boolean };
  equipped: { active: string[]; passive: string[]; ultimate: string | null };
  filled: { active: number; passive: number; ultimate: number };
  emptyUnlockedCount: number;
  emptyUnlockedSlots: EmptyUnlockedLoadoutSlot[];
  parkedLockedAssignments: ParkedLockedAssignment[];
}

const DISPLAYED_ACTIVE_SLOTS = 4;
const DISPLAYED_PASSIVE_SLOTS = 3;

const normalizeSlotArray = (slots: string[] | null | undefined, length: number): string[] => {
  const safe = Array.isArray(slots) ? slots.slice(0, length) : [];
  while (safe.length < length) {
    safe.push('');
  }
  return safe;
};

const normalizeUltimateSlot = (ultimate: string | null | undefined): string | null => {
  return typeof ultimate === 'string' ? ultimate : null;
};

export function buildLoadoutSnapshotFromLoadout(input: {
  loadout: LoadoutSnapshotSource;
  realmIndex: number;
  activeBonusSlots?: number;
  passiveBonusSlots?: number;
}): LoadoutSnapshot {
  const progression = resolveLoadoutProgressionSnapshot({
    realmIndex: input.realmIndex,
    activeBonusSlots: input.activeBonusSlots,
    passiveBonusSlots: input.passiveBonusSlots,
  });

  const activeSlots = normalizeSlotArray(input.loadout.slots.active, DISPLAYED_ACTIVE_SLOTS);
  const passiveSlots = normalizeSlotArray(input.loadout.slots.passive, DISPLAYED_PASSIVE_SLOTS);
  const ultimateSlot = normalizeUltimateSlot(input.loadout.slots.ultimate);

  const equippedActive = activeSlots
    .slice(0, progression.unlocked.active)
    .filter((techId) => Boolean(techId));
  const equippedPassive = passiveSlots
    .slice(0, progression.unlocked.passive)
    .filter((techId) => Boolean(techId));
  const equippedUltimate = progression.unlocked.ultimate && ultimateSlot ? ultimateSlot : null;

  const emptyUnlockedSlots: EmptyUnlockedLoadoutSlot[] = [];
  for (let slotIndex = 0; slotIndex < progression.unlocked.active; slotIndex += 1) {
    if (!activeSlots[slotIndex]) {
      emptyUnlockedSlots.push({ slotType: 'active', slotIndex });
    }
  }
  for (let slotIndex = 0; slotIndex < progression.unlocked.passive; slotIndex += 1) {
    if (!passiveSlots[slotIndex]) {
      emptyUnlockedSlots.push({ slotType: 'passive', slotIndex });
    }
  }
  if (progression.unlocked.ultimate && !ultimateSlot) {
    emptyUnlockedSlots.push({ slotType: 'ultimate', slotIndex: 0 });
  }

  const parkedLockedAssignments: ParkedLockedAssignment[] = [];
  for (let slotIndex = progression.unlocked.active; slotIndex < DISPLAYED_ACTIVE_SLOTS; slotIndex += 1) {
    const techId = activeSlots[slotIndex];
    if (techId) parkedLockedAssignments.push({ slotType: 'active', slotIndex, techId });
  }
  for (let slotIndex = progression.unlocked.passive; slotIndex < DISPLAYED_PASSIVE_SLOTS; slotIndex += 1) {
    const techId = passiveSlots[slotIndex];
    if (techId) parkedLockedAssignments.push({ slotType: 'passive', slotIndex, techId });
  }
  if (!progression.unlocked.ultimate && ultimateSlot) {
    parkedLockedAssignments.push({ slotType: 'ultimate', slotIndex: 0, techId: ultimateSlot });
  }

  return {
    loadoutId: input.loadout.id,
    aiProfile: input.loadout.aiProfile,
    castingPolicy: input.loadout.castingPolicy,
    displayed: { ...progression.displayed },
    unlocked: { ...progression.unlocked },
    equipped: {
      active: equippedActive,
      passive: equippedPassive,
      ultimate: equippedUltimate,
    },
    filled: {
      active: equippedActive.length,
      passive: equippedPassive.length,
      ultimate: equippedUltimate ? 1 : 0,
    },
    emptyUnlockedCount: emptyUnlockedSlots.length,
    emptyUnlockedSlots,
    parkedLockedAssignments,
  };
}

export function buildLoadoutSnapshot(loadoutId?: string): LoadoutSnapshot {
  const techniqueState = useTechniqueStore.getState();
  const gameState = useGameStore.getState();

  const activeBonusSlots = Math.max(0, Math.floor(techniqueState.activeSlots) - BASE_ACTIVE_SLOTS);
  const passiveBonusSlots = Math.max(0, Math.floor(techniqueState.passiveSlots) - BASE_PASSIVE_SLOTS);

  const requested = loadoutId
    ? techniqueState.loadouts.find((loadout) => loadout.id === loadoutId)
    : undefined;
  const selected = techniqueState.loadouts.find((loadout) => loadout.id === techniqueState.selectedLoadoutId);
  const fallback = techniqueState.loadouts[0];

  const resolvedLoadout: LoadoutSnapshotSource = requested ?? selected ?? fallback ?? {
    id: loadoutId ?? 'default',
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    slots: { active: [], passive: [], ultimate: null },
  };

  return buildLoadoutSnapshotFromLoadout({
    loadout: resolvedLoadout,
    realmIndex: gameState.realm.index,
    activeBonusSlots,
    passiveBonusSlots,
  });
}
