import { useGameStore } from '../../stores/gameStore.js';
import { useTechniqueStore, type AiProfile, type CastingPolicy, type TechniqueLoadout } from '../../stores/techniqueStore.js';
import {
  BASE_ACTIVE_SLOTS,
  BASE_PASSIVE_SLOTS,
  buildSemesterTechniqueSlotProgressionSnapshot,
  normalizeTechniqueSlotIds,
  resolveSemesterRealmIndex,
} from './semesterTechniqueSlots.js';

export interface TechniqueLoadoutSnapshot {
  selectedLoadoutId: string | null;
  loadoutId: string | null;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  equippedTechIds: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
  combatEquippedTechIds: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
}

export interface TechniqueLoadoutSnapshotInput {
  loadouts: TechniqueLoadout[];
  selectedLoadoutId: string;
  activeSlots: number;
  passiveSlots: number;
  realmIndex: number;
}

const FALLBACK_AI_PROFILE: AiProfile = 'balanced';
const FALLBACK_CASTING_POLICY: CastingPolicy = 'balanced';

function resolveSelectedLoadout(input: TechniqueLoadoutSnapshotInput): TechniqueLoadout | null {
  return input.loadouts.find((loadout) => loadout.id === input.selectedLoadoutId) ?? null;
}

export function buildTechniqueLoadoutSnapshot(
  input: TechniqueLoadoutSnapshotInput,
): TechniqueLoadoutSnapshot {
  const selectedLoadout = resolveSelectedLoadout(input);
  const progression = buildSemesterTechniqueSlotProgressionSnapshot(
    input.activeSlots,
    input.passiveSlots,
    resolveSemesterRealmIndex(input.realmIndex),
  );

  if (selectedLoadout === null) {
    return {
      selectedLoadoutId: null,
      loadoutId: null,
      aiProfile: FALLBACK_AI_PROFILE,
      castingPolicy: FALLBACK_CASTING_POLICY,
      equippedTechIds: {
        active: Array.from({ length: progression.displayed.active }, () => ''),
        passive: Array.from({ length: progression.displayed.passive }, () => ''),
        ultimate: null,
      },
      combatEquippedTechIds: {
        active: [],
        passive: [],
        ultimate: null,
      },
    };
  }

  const equippedTechIds = {
    active: normalizeTechniqueSlotIds([...selectedLoadout.slots.active], progression.displayed.active),
    passive: normalizeTechniqueSlotIds([...selectedLoadout.slots.passive], progression.displayed.passive),
    ultimate: selectedLoadout.slots.ultimate || null,
  };

  return {
    selectedLoadoutId: selectedLoadout.id,
    loadoutId: selectedLoadout.id,
    aiProfile: selectedLoadout.aiProfile ?? FALLBACK_AI_PROFILE,
    castingPolicy: selectedLoadout.castingPolicy ?? FALLBACK_CASTING_POLICY,
    equippedTechIds,
    combatEquippedTechIds: {
      active: equippedTechIds.active.slice(0, progression.unlocked.active).filter((id) => id),
      passive: equippedTechIds.passive.slice(0, progression.unlocked.passive).filter((id) => id),
      ultimate: progression.unlocked.ultimate && equippedTechIds.ultimate ? equippedTechIds.ultimate : null,
    },
  };
}

export function buildSelectedTechniqueLoadoutSnapshot(realmIndex?: number): TechniqueLoadoutSnapshot {
  const techniqueState = useTechniqueStore.getState();
  const resolvedRealmIndex = realmIndex ?? useGameStore.getState().realm.index ?? 0;

  return buildTechniqueLoadoutSnapshot({
    loadouts: techniqueState.loadouts,
    selectedLoadoutId: techniqueState.selectedLoadoutId,
    activeSlots: techniqueState.activeSlots ?? BASE_ACTIVE_SLOTS,
    passiveSlots: techniqueState.passiveSlots ?? BASE_PASSIVE_SLOTS,
    realmIndex: resolvedRealmIndex,
  });
}
