import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TechniqueDef } from '../content/index.js';
import { useContentStore } from './contentStore.js';
import { useInventoryStore } from './inventoryStore.js';
import { randFloat } from '../utils/rng.js';
import { useUIStore } from './uiStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import type { ManualGrade, TechRarity } from '../types/index.js';
import { bumpVersion } from './versionCounters.js';
import {
  buildTechniqueProgressionSnapshot,
  getMasteryMilestoneContract,
  getNextMasteryMilestoneContract,
  getTechniqueMaxRankForGrade,
  getTechniqueTraitSlotBreakdown,
  getTechniqueEffectiveRuneSockets,
  isHigherTechniqueGrade,
  isHigherTechniqueRarity,
  masteryLevelFromXp,
  masteryMultiplier,
  normalizeManualGrade,
  normalizeTechniqueProgressionState,
  normalizeTechniqueRarity,
  rankMultiplier,
  xpNeededForLevel,
  type TechniqueProgressionSnapshot,
} from '../systems/builds/index.js';

export type { ManualGrade, TechRarity } from '../types/index.js';

export interface TechniqueTrait {
  id: string;
  value: number;
}

export interface TechniqueOwnedState {
  unlocked: boolean;
  masteryXp: number;
  rank: number;
  manualGrade: ManualGrade;
  rarity: TechRarity;
  traits: TechniqueTrait[];
  runes: Array<string | null>;
  tier?: string;
  lastCastAt?: number;
  unlockedAt?: number;
  favorite?: boolean;
}

interface TechCollectionState {
  unlockedTechs: Record<string, TechniqueOwnedState>;
  fragments: Record<string, number>;
  rngSeed: number;
  collectionVersion: number;
  masteryVersion: number;
  hasTech: (techId: string) => boolean;
  ensureTechState: (techId: string) => TechniqueOwnedState;
  unlockTech: (techId: string, meta?: Partial<TechniqueOwnedState>) => void;
  addFragments: (techId: string, qty: number) => void;
  getFragments: (techId: string) => number;
  addMasteryXp: (techId: string, amount: number, now?: number) => void;
  setManualGrade: (techId: string, grade: ManualGrade) => void;
  setRarityIfHigher: (techId: string, rarity: TechRarity) => void;
  getMasteryLevel: (techId: string) => number;
  ensureMasteryLevelAtLeast: (techId: string, level: number) => void;
  getTechniqueProgressionSnapshot: (techId: string) => TechniqueProgressionSnapshot;
  getEffectiveRuneSlots: (techId: string) => number;
  getEffectiveTraitSlots: (techId: string) => number;
  ensureTraits: (techId: string) => void;
  rerollTraits: (
    techId: string,
    options?: { lockIndex?: number; lockEnabled?: boolean },
  ) => { ok: boolean; reason?: string; cost?: { soulInkItemId: string; qty: number }; lockedIndex?: number };
  applyTraitQualityBoost: (techId: string, chance?: number) => void;
  ensureRunes: (techId: string) => void;
  socketRune: (techId: string, slotIndex: number, runeItemId: string) => { ok: boolean; reason?: string };
  unsocketRune: (techId: string, slotIndex: number) => { ok: boolean; reason?: string };
  getRuneModifiers: (
    techId: string,
    technique?: TechniqueDef,
  ) => {
    damageMult: number;
    healMult: number;
    shieldMult: number;
    buffMult: number;
    cooldownReductionPct: number;
    costReductionPct: number;
  };
  getTraitModifiers: (techId: string, isBoss: boolean) => {
    damageMult: number;
    healMult: number;
    shieldMult: number;
    buffMult: number;
    cooldownReductionPct: number;
    costReductionPct: number;
    masteryGainPct: number;
  };
  getTraitDisplay: (techId: string) => string[];
  nextRand: () => number;
  getMasteryCooldownReductionPct: (techId: string) => number;
  getMasteryCostReductionPct: (techId: string) => number;
  getMasteryEffectMultiplier: (techId: string) => number;
  getRankCap: (techId: string) => number;
  getRankUpgradeCost: (nextRank: number) => {
    fragmentsRequired: number;
    runeDustRequired: number;
    soulInkRequired: number;
    soulInkItemId: string;
    requiredGrade?: ManualGrade;
  } | null;
  getNextRankCost: (techId: string) => {
    nextRank: number;
    cost: {
      fragmentsRequired: number;
      runeDustRequired: number;
      soulInkRequired: number;
      soulInkItemId: string;
      requiredGrade?: ManualGrade;
    };
    rankCap: number;
  } | null;
  upgradeRank: (techId: string) => { ok: boolean; reason?: string };
  toggleFavorite: (techId: string) => void;
  isFavorite?: (techId: string) => boolean;
  getTraitDefinition: (traitId: string) => TraitDefinition | null;
  getTraitRollRangeLabel: (traitId: string) => string;
  getTraitQualityPct: (trait: { id: string; value?: number; valuePct?: number }) => number;
  getTraitSlotBreakdown: (
    techId: string,
  ) => { raritySlots: number; gradeCap: number; effectiveSlots: number; rarity: string; grade: ManualGrade };
  getMasteryMilestoneEffects: (level: number) => {
    cooldownMult: number;
    costMult: number;
    effectMult: number;
    secondaryUnlocked: boolean;
    cosmeticTitle?: string;
  };
  getNextMasteryMilestone: (level: number) => { level: number; effectsSummary: string[] } | null;
  hydrate: (data: {
    unlockedTechs?: Record<string, Partial<TechniqueOwnedState>>;
    fragments?: Record<string, number>;
    rngSeed?: number;
  }) => void;
  hardReset: () => void;
}

export { xpNeededForLevel, masteryLevelFromXp, masteryMultiplier, rankMultiplier } from '../systems/builds/index.js';
export const MASTERY_XP_SCALE = 3;

const DEFAULT_RANK_COSTS: Array<{
  toRank: number;
  fragments: number;
  runeDust: number;
  soulInk?: number;
  soulInkTier: number;
  requiresGradeAtLeast?: ManualGrade;
}> = [
  { toRank: 2, fragments: 20, runeDust: 2, soulInkTier: 0 },
  { toRank: 3, fragments: 40, runeDust: 4, soulInkTier: 0 },
  { toRank: 4, fragments: 80, runeDust: 8, soulInkTier: 0 },
  { toRank: 5, fragments: 160, runeDust: 16, soulInkTier: 0 },
  { toRank: 6, fragments: 240, runeDust: 24, soulInkTier: 1, requiresGradeAtLeast: 'earth' },
  { toRank: 7, fragments: 360, runeDust: 36, soulInkTier: 1, requiresGradeAtLeast: 'earth' },
  { toRank: 8, fragments: 520, runeDust: 52, soulInkTier: 2, requiresGradeAtLeast: 'heaven' },
  { toRank: 9, fragments: 750, runeDust: 75, soulInkTier: 2, requiresGradeAtLeast: 'heaven' },
  { toRank: 10, fragments: 1100, runeDust: 110, soulInkTier: 2, requiresGradeAtLeast: 'mystic' },
];

export const masteryMilestones = (level: number) => {
  const snapshot = getMasteryMilestoneContract(level);
  return {
    at25: snapshot.highestUnlockedMilestone >= 25,
    at50: snapshot.highestUnlockedMilestone >= 50,
    at75: snapshot.highestUnlockedMilestone >= 75,
    at100: snapshot.highestUnlockedMilestone >= 100,
  };
};

export const normalizeGrade = (input?: string): ManualGrade => normalizeManualGrade(input);
export const normalizeRarity = (input?: string): TechRarity => normalizeTechniqueRarity(input);
export const isHigherGrade = (current: ManualGrade, next: ManualGrade): boolean =>
  isHigherTechniqueGrade(current, next);
export const isHigherRarity = (current: TechRarity, next: TechRarity): boolean =>
  isHigherTechniqueRarity(current, next);
export const getMasteryMilestoneEffects = (level: number) => getMasteryMilestoneContract(level);
export const getNextMasteryMilestone = (level: number) => getNextMasteryMilestoneContract(level);

export function getManualGradeFromTechnique(technique?: TechniqueDef): ManualGrade {
  return normalizeGrade(technique?.tier);
}

function getRankCostTable(): Record<
  number,
  {
    fragmentsRequired: number;
    runeDustRequired: number;
    soulInkRequired: number;
    soulInkItemId: string;
    requiredGrade?: ManualGrade;
  }
> {
  return DEFAULT_RANK_COSTS.reduce<Record<number, { fragmentsRequired: number; runeDustRequired: number; soulInkRequired: number; soulInkItemId: string; requiredGrade?: ManualGrade }>>((acc, entry) => {
    const soulInkTier = typeof entry.soulInkTier === 'number' ? entry.soulInkTier : 0;
    const soulInkItemId = `reagent_soul_ink_t${soulInkTier}`;
    const cost = {
      fragmentsRequired: entry.fragments ?? 0,
      runeDustRequired: entry.runeDust ?? 0,
      soulInkRequired: typeof entry.soulInk === 'number' ? entry.soulInk : 1,
      soulInkItemId,
      requiredGrade: entry.requiresGradeAtLeast,
    };
    acc[entry.toRank] = cost;
    return acc;
  }, {});
}

const createDefaultOwnedState = (): TechniqueOwnedState => ({
  unlocked: false,
  masteryXp: 0,
  rank: 1,
  manualGrade: 'mortal',
  rarity: 'common',
  traits: [],
  runes: [],
  unlockedAt: undefined,
  favorite: false,
});

const createInitialState = (): Pick<TechCollectionState, 'unlockedTechs' | 'fragments' | 'rngSeed' | 'collectionVersion' | 'masteryVersion'> => ({
  unlockedTechs: {},
  fragments: {},
  rngSeed: 123456789,
  collectionVersion: 0,
  masteryVersion: 0,
});

const RUNE_DUST_ITEM_ID = 'mat_rune_dust';
const SOUL_INK_REROLL_ITEM_ID = 'reagent_soul_ink_t0';

type TraitDefinition = {
  id: string;
  label: string;
  min: number;
  max: number;
};

const TRAIT_LIBRARY: TraitDefinition[] = [
  { id: 'dmgPct', label: 'Damage', min: 0.03, max: 0.12 },
  { id: 'healPct', label: 'Heal', min: 0.03, max: 0.12 },
  { id: 'shieldPct', label: 'Shield', min: 0.03, max: 0.12 },
  { id: 'cooldownReductionPct', label: 'Cooldown', min: 0.02, max: 0.08 },
  { id: 'costReductionPct', label: 'Cost', min: 0.02, max: 0.1 },
  { id: 'masteryGainPct', label: 'Mastery Gain', min: 0.05, max: 0.2 },
  { id: 'vsBossDamagePct', label: 'Boss Damage', min: 0.04, max: 0.15 },
];

const MAX_TRAIT_CDR = 0.15;
const MAX_TRAIT_COST_REDUCTION = 0.25;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function getTraitDefinition(id: string): TraitDefinition | undefined {
  return TRAIT_LIBRARY.find((trait) => trait.id === id);
}

function getTraitValue(trait: { value?: number; valuePct?: number }) {
  if (typeof trait.valuePct === 'number') return trait.valuePct;
  return trait.value ?? 0;
}

export function getTraitQualityPct(trait: { id: string; value?: number; valuePct?: number }): number {
  const def = getTraitDefinition(trait.id);
  if (!def) return 0;
  const span = def.max - def.min;
  if (span <= 0) return 1;
  const value = getTraitValue(trait);
  return clamp((value - def.min) / span, 0, 1);
}

export function getTraitRollRangeLabel(traitId: string): string {
  const def = getTraitDefinition(traitId);
  if (!def) return '';
  return `${formatPercent(def.min)} to ${formatPercent(def.max)}`;
}

function rollTraitValue(def: TraitDefinition, seed: number) {
  const { value, seed: next } = randFloat(seed);
  const rolled = def.min + (def.max - def.min) * value;
  return { value: Number(rolled.toFixed(4)), seed: next };
}

function rollTraits(
  count: number,
  seed: number,
  existingIds: string[] = [],
): { traits: TechniqueTrait[]; seed: number } {
  const traits: TechniqueTrait[] = [];
  const available = TRAIT_LIBRARY.map((trait) => trait.id);
  let nextSeed = seed;
  const used = new Set(existingIds);

  for (let i = 0; i < count; i += 1) {
    const pool = available.filter((id) => !used.has(id));
    const choices = pool.length > 0 ? pool : available;
    const { value, seed: seeded } = randFloat(nextSeed);
    nextSeed = seeded;
    const index = Math.floor(value * choices.length);
    const traitId = choices[Math.min(index, choices.length - 1)];
    used.add(traitId);
    const def = getTraitDefinition(traitId);
    if (!def) continue;
    const rolled = rollTraitValue(def, nextSeed);
    nextSeed = rolled.seed;
    traits.push({ id: traitId, value: rolled.value });
  }

  return { traits, seed: nextSeed };
}

function normalizeRunes(runes: Array<string | null> | undefined, slots: number) {
  const base = Array.isArray(runes) ? [...runes] : [];
  if (slots <= 0) return [];
  if (base.length > slots) return base.slice(0, slots);
  if (base.length < slots) {
    return [...base, ...Array.from({ length: slots - base.length }, () => null)];
  }
  return base;
}

function getRuneSlotsForGrade(grade: ManualGrade) {
  return getTechniqueEffectiveRuneSockets(grade);
}

export function normalizeTechEntry(
  _techId: string,
  incoming?: Partial<TechniqueOwnedState> | null,
): TechniqueOwnedState {
  const base = createDefaultOwnedState();
  const merged: TechniqueOwnedState = {
    ...base,
    ...(incoming ?? {}),
  };

  const normalized = normalizeTechniqueProgressionState({
    manualGrade: incoming?.manualGrade ?? merged.manualGrade,
    rarity: incoming?.rarity ?? merged.rarity,
    masteryXp: Number(incoming?.masteryXp ?? merged.masteryXp ?? 0),
    rank: Number(incoming?.rank ?? merged.rank ?? 1),
    traits: Array.isArray(incoming?.traits) ? incoming.traits.filter(Boolean) : base.traits,
    runes: Array.isArray(incoming?.runes) ? incoming.runes.map((rune) => rune ?? null) : base.runes,
  });

  merged.unlocked = Boolean(incoming?.unlocked ?? merged.unlocked);
  merged.masteryXp = normalized.masteryXp;
  merged.rank = normalized.rank;
  merged.manualGrade = normalized.manualGrade;
  merged.rarity = normalized.rarity;
  merged.traits = normalized.traits as TechniqueTrait[];
  merged.runes = normalizeRunes(normalized.runes, getRuneSlotsForGrade(normalized.manualGrade));
  merged.tier = incoming?.tier ?? merged.tier;
  merged.lastCastAt = incoming?.lastCastAt;
  merged.unlockedAt = typeof incoming?.unlockedAt === 'number' ? incoming.unlockedAt : merged.unlockedAt;
  merged.favorite = incoming?.favorite ?? merged.favorite;

  return merged;
}

export const useTechCollectionStore = create<TechCollectionState>()(
  immer((set, get) => ({
    ...createInitialState(),

    nextRand: () => {
      const { value, seed } = randFloat(get().rngSeed);
      set((state) => {
        state.rngSeed = seed;
      });
      return value;
    },

    hasTech: (techId) => {
      return Boolean(get().unlockedTechs[techId]?.unlocked);
    },

    ensureTechState: (techId) => {
      const existing = get().unlockedTechs[techId];
      if (existing) return existing;

      const normalized = normalizeTechEntry(techId);
      set((state) => {
        state.unlockedTechs[techId] = normalized;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
      get().ensureRunes(techId);
      return normalized;
    },

    unlockTech: (techId, meta) => {
      set((state) => {
        const existing = state.unlockedTechs[techId];
        if (existing?.unlocked) return;
        const normalized = normalizeTechEntry(techId, {
          ...existing,
          ...meta,
          unlocked: true,
          unlockedAt: existing?.unlockedAt ?? Date.now(),
          favorite: existing?.favorite,
        });
        state.unlockedTechs[techId] = normalized;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
      get().ensureTraits(techId);
    },

    addFragments: (techId, qty) => {
      if (!Number.isFinite(qty) || qty <= 0) return;
      set((state) => {
        const current = state.fragments[techId] ?? 0;
        const next = current + qty;
        state.fragments[techId] = next < 0 ? 0 : next;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
    },

    getFragments: (techId) => {
      return get().fragments[techId] ?? 0;
    },

    addMasteryXp: (techId, amount, now = Date.now()) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      const prevLevel = get().getMasteryLevel(techId);
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry?.unlocked) return;
        const masteryGainPct = get().getTraitModifiers(techId, false).masteryGainPct;
        const total = amount * (1 + masteryGainPct);
        entry.masteryXp += total;
        entry.lastCastAt = now;
        state.masteryVersion = bumpVersion(state.masteryVersion);
      });

      const nextLevel = get().getMasteryLevel(techId);
      if (nextLevel > prevLevel) {
        const milestonesCrossed = [25, 50, 75, 100].filter(
          (milestone) => milestone > prevLevel && milestone <= nextLevel,
        );
        if (milestonesCrossed.length) {
          const ui = useUIStore.getState();
          milestonesCrossed.forEach((milestone) => {
            const summaryParts = getNextMasteryMilestoneContract(milestone - 1)?.effectsSummary ?? [];
            const message = summaryParts.length
              ? `Mastery ${milestone} reached: ${summaryParts.join(', ')}`
              : `Mastery ${milestone} reached.`;
            ui.addNotification('success', message, 2500);
          });
        }
      }
    },

    setManualGrade: (techId, grade) => {
      set((state) => {
        const existing = state.unlockedTechs[techId];
        const entry = existing ?? normalizeTechEntry(techId);
        if (!isHigherGrade(entry.manualGrade, grade)) {
          state.unlockedTechs[techId] = entry;
          if (!existing) {
            state.collectionVersion = bumpVersion(state.collectionVersion);
          }
          return;
        }
        state.unlockedTechs[techId] = normalizeTechEntry(techId, {
          ...entry,
          manualGrade: grade,
        });
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
      get().ensureRunes(techId);
    },

    setRarityIfHigher: (techId, rarity) => {
      set((state) => {
        const existing = state.unlockedTechs[techId];
        const entry = existing ?? normalizeTechEntry(techId);
        if (!isHigherRarity(entry.rarity, rarity)) {
          state.unlockedTechs[techId] = entry;
          if (!existing) {
            state.collectionVersion = bumpVersion(state.collectionVersion);
          }
          return;
        }
        state.unlockedTechs[techId] = normalizeTechEntry(techId, {
          ...entry,
          rarity,
        });
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
    },

    getMasteryLevel: (techId) => {
      const entry = get().unlockedTechs[techId];
      return masteryLevelFromXp(entry?.masteryXp ?? 0);
    },

    ensureMasteryLevelAtLeast: (techId, level) => {
      if (level <= 1) return;
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry?.unlocked) return;
        const targetXp = xpNeededForLevel(level);
        if (entry.masteryXp >= targetXp) return;
        entry.masteryXp = targetXp;
        state.masteryVersion = bumpVersion(state.masteryVersion);
      });
    },

    getTechniqueProgressionSnapshot: (techId) => {
      const entry = get().unlockedTechs[techId];
      return buildTechniqueProgressionSnapshot({
        manualGrade: entry?.manualGrade,
        rarity: entry?.rarity,
        masteryXp: entry?.masteryXp,
        rank: entry?.rank,
        traits: entry?.traits,
        runes: entry?.runes,
      });
    },

    getMasteryCooldownReductionPct: (techId) => {
      const effects = get().getTechniqueProgressionSnapshot(techId).masteryMilestoneEffects;
      return clamp(1 - effects.cooldownMult, 0, 1);
    },

    getMasteryCostReductionPct: (techId) => {
      const effects = get().getTechniqueProgressionSnapshot(techId).masteryMilestoneEffects;
      return clamp(1 - effects.costMult, 0, 1);
    },

    getMasteryEffectMultiplier: (techId) => {
      return get().getTechniqueProgressionSnapshot(techId).effectMultiplier;
    },

    getMasteryMilestoneEffects: (level) => {
      const { cooldownMult, costMult, effectMult, secondaryUnlocked, cosmeticTitle } = getMasteryMilestoneEffects(level);
      return cosmeticTitle
        ? { cooldownMult, costMult, effectMult, secondaryUnlocked, cosmeticTitle }
        : { cooldownMult, costMult, effectMult, secondaryUnlocked };
    },
    getNextMasteryMilestone: (level) => getNextMasteryMilestone(level),

    getEffectiveRuneSlots: (techId) => {
      return get().getTechniqueProgressionSnapshot(techId).runeSockets;
    },

    getEffectiveTraitSlots: (techId) => {
      return get().getTechniqueProgressionSnapshot(techId).traitSlotBreakdown.effectiveSlots;
    },

    ensureRunes: (techId) => {
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry) return;
        const slots = getTechniqueEffectiveRuneSockets(entry.manualGrade);
        const nextRunes = normalizeRunes(entry.runes, slots);
        const changed = nextRunes.length !== entry.runes.length
          || nextRunes.some((rune, index) => rune !== entry.runes[index]);
        if (!changed) return;
        entry.runes = nextRunes;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
    },

    socketRune: (techId, slotIndex, runeItemId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) return { ok: false, reason: 'Technique not unlocked.' };

      const slots = get().getTechniqueProgressionSnapshot(techId).runeSockets;
      if (slotIndex < 0 || slotIndex >= slots) return { ok: false, reason: 'Invalid slot.' };

      const currentRunes = normalizeRunes(entry.runes, slots);
      if (currentRunes[slotIndex]) return { ok: false, reason: 'Slot already filled.' };

      const content = useContentStore.getState();
      if (!content.maps.runesById[runeItemId]) {
        return { ok: false, reason: 'Unknown rune.' };
      }

      const inventory = useInventoryStore.getState();
      if (inventory.getQty(runeItemId) < 1) {
        return { ok: false, reason: 'Not enough runes.' };
      }

      const removed = inventory.removeItem(runeItemId, 1);
      if (!removed) return { ok: false, reason: 'Unable to consume rune.' };

      set((state) => {
        const target = state.unlockedTechs[techId];
        if (!target) return;
        target.runes = normalizeRunes(target.runes, slots);
        target.runes[slotIndex] = runeItemId;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });

      GameEvents.emit({
        type: 'techniques/rune_socketed',
        payload: { techniqueId: techId, slotIndex, runeItemId },
      });
      return { ok: true };
    },

    toggleFavorite: (techId) => {
      set((state) => {
        const entry = state.unlockedTechs[techId] ?? normalizeTechEntry(techId);
        entry.favorite = !entry.favorite;
        state.unlockedTechs[techId] = entry;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
    },

    isFavorite: (techId) => Boolean(get().unlockedTechs[techId]?.favorite),

    unsocketRune: (techId, slotIndex) => {
      const entry = get().unlockedTechs[techId];
      if (!entry) return { ok: false, reason: 'Technique not unlocked.' };

      const slots = get().getTechniqueProgressionSnapshot(techId).runeSockets;
      if (slotIndex < 0 || slotIndex >= slots) return { ok: false, reason: 'Invalid slot.' };
      const currentRunes = normalizeRunes(entry.runes, slots);
      const runeId = currentRunes[slotIndex];
      if (!runeId) return { ok: false, reason: 'Slot is empty.' };

      const inventory = useInventoryStore.getState();
      inventory.addItem(runeId, 1);

      set((state) => {
        const target = state.unlockedTechs[techId];
        if (!target) return;
        target.runes = normalizeRunes(target.runes, slots);
        target.runes[slotIndex] = null;
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });

      GameEvents.emit({
        type: 'techniques/rune_unsocketed',
        payload: { techniqueId: techId, slotIndex, runeItemId: runeId },
      });
      return { ok: true };
    },

    getRuneModifiers: (techId, technique) => {
      const entry = get().unlockedTechs[techId];
      const runes = entry?.runes ?? [];
      const content = useContentStore.getState();
      const tags = technique?.tags?.map((tag) => tag.toLowerCase()) ?? [];
      const isHeaven = technique?.path === 'heaven';

      let damagePct = 0;
      let healPct = 0;
      let shieldPct = 0;
      let buffPct = 0;
      let cooldownReductionPct = 0;
      let costReductionPct = 0;

      runes.forEach((runeId) => {
        if (!runeId) return;
        const runeDef = content.maps.runesById[runeId];
        if (!runeDef) return;
        const effects = (runeDef as { effects?: Array<{ stat?: string; pct?: number }> }).effects ?? [];
        effects.forEach((effect) => {
          const stat = effect.stat ?? '';
          const pct = typeof effect.pct === 'number' ? effect.pct : 0;
          if (!stat || !pct) return;

          switch (stat) {
            case 'shieldStrength':
            case 'wardShieldStrength':
              shieldPct += pct;
              break;
            case 'lightningDamage': {
              const hasLightning = tags.includes('lightning') || tags.includes('storm') || tags.includes('thunder');
              damagePct += hasLightning ? pct : Math.min(0.04, pct * 0.33);
              break;
            }
            case 'burnDamage':
            case 'poisonDamage': {
              const matchesTag = tags.some((tag) => tag.includes('burn') || tag.includes('poison') || tag.includes('fire'));
              if (matchesTag) {
                damagePct += pct;
              }
              break;
            }
            case 'critDmg':
              damagePct += Math.min(0.08, Math.abs(pct) * 0.5);
              break;
            case 'heavenCost':
              if (isHeaven) costReductionPct += Math.abs(pct);
              break;
            case 'heavenCooldown':
              if (isHeaven) cooldownReductionPct += Math.abs(pct);
              break;
            case 'haste':
              cooldownReductionPct += Math.abs(pct);
              break;
            case 'defBuffEffectiveness':
              buffPct += Math.abs(pct);
              break;
            default:
              break;
          }
        });
      });

      return {
        damageMult: 1 + damagePct,
        healMult: 1 + healPct,
        shieldMult: 1 + shieldPct,
        buffMult: 1 + buffPct,
        cooldownReductionPct: clamp(cooldownReductionPct, 0, 0.2),
        costReductionPct: clamp(costReductionPct, 0, 0.25),
      };
    },

    ensureTraits: (techId) => {
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry) return;
        const slots = get().getEffectiveTraitSlots(techId);
        if (slots <= 0) {
          if (entry.traits.length === 0) return;
          entry.traits = [];
          state.collectionVersion = bumpVersion(state.collectionVersion);
          return;
        }

        if (entry.traits.length === slots) return;

        if (entry.traits.length > slots) {
          entry.traits = entry.traits.slice(0, slots);
          state.collectionVersion = bumpVersion(state.collectionVersion);
          return;
        }

        const missing = slots - entry.traits.length;
        const existingIds = entry.traits.map((trait) => trait.id);
        const rolled = rollTraits(missing, state.rngSeed, existingIds);
        state.rngSeed = rolled.seed;
        entry.traits = [...entry.traits, ...rolled.traits];
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });
    },

    rerollTraits: (techId, options) => {
      GameEvents.emit({ type: 'techniques/trait_reroll_attempt', payload: { techniqueId: techId } });
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'Technique not unlocked.' };
      }

      const slots = get().getEffectiveTraitSlots(techId);
      if (slots <= 0) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'No trait slots available.' };
      }

      const content = useContentStore.getState();
      if (!content.maps.itemsById[SOUL_INK_REROLL_ITEM_ID]) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'Soul ink item missing.' };
      }

      const lockEnabled = Boolean(options?.lockEnabled);
      const requestedLockIndex = typeof options?.lockIndex === 'number' ? options.lockIndex : null;
      const lockIndex = lockEnabled && requestedLockIndex !== null ? requestedLockIndex : -1;
      const hasValidLock = lockEnabled && lockIndex >= 0 && lockIndex < slots && Boolean(entry.traits[lockIndex]);
      if (lockEnabled && !hasValidLock) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'invalid_lock', cost: { soulInkItemId: SOUL_INK_REROLL_ITEM_ID, qty: 2 } };
      }

      const costQty = hasValidLock ? 2 : 1;
      const inventory = useInventoryStore.getState();
      if (!inventory.canAffordItem(SOUL_INK_REROLL_ITEM_ID, costQty)) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'insufficient_items', cost: { soulInkItemId: SOUL_INK_REROLL_ITEM_ID, qty: costQty } };
      }

      const removed = inventory.spendItem(SOUL_INK_REROLL_ITEM_ID, costQty);
      if (!removed) {
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: false } });
        return { ok: false, reason: 'Unable to consume soul ink.', cost: { soulInkItemId: SOUL_INK_REROLL_ITEM_ID, qty: costQty } };
      }

      set((state) => {
        const target = state.unlockedTechs[techId];
        if (!target) return;

        const lockedTrait = hasValidLock ? target.traits[lockIndex] : null;
        const availableSlots = hasValidLock ? slots - 1 : slots;
        const existingIds = lockedTrait ? [lockedTrait.id] : [];
        const next = rollTraits(availableSlots, state.rngSeed, existingIds);
        state.rngSeed = next.seed;
        const traits = hasValidLock
          ? [...next.traits.slice(0, lockIndex), lockedTrait!, ...next.traits.slice(lockIndex)]
          : next.traits;
        target.traits = traits.slice(0, slots);
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });

      GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: true } });
      return { ok: true, lockedIndex: hasValidLock ? lockIndex : undefined, cost: { soulInkItemId: SOUL_INK_REROLL_ITEM_ID, qty: costQty } };
    },

    applyTraitQualityBoost: (techId, chance = 0.05) => {
      if (chance <= 0) return;
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry?.unlocked || !entry.traits?.length) return;
        let seed = state.rngSeed;
        let changed = false;
        entry.traits = entry.traits.map((trait) => {
          const def = getTraitDefinition(trait.id);
          if (!def) return trait;
          const roll = randFloat(seed);
          seed = roll.seed;
          if (roll.value >= chance) return trait;
          const boosted = Math.min(def.max, trait.value + (def.max - trait.value) * 0.5);
          const nextValue = Number(boosted.toFixed(4));
          if (nextValue === trait.value) return trait;
          changed = true;
          return { ...trait, value: nextValue };
        });
        state.rngSeed = seed;
        if (changed) {
          state.collectionVersion = bumpVersion(state.collectionVersion);
        }
      });
    },

    getTraitModifiers: (techId, isBoss) => {
      const entry = get().unlockedTechs[techId];
      const traits = entry?.traits ?? [];
      let damagePct = 0;
      let healPct = 0;
      let shieldPct = 0;
      let cooldownReductionPct = 0;
      let costReductionPct = 0;
      let masteryGainPct = 0;
      let vsBossDamagePct = 0;

      traits.forEach((trait) => {
        switch (trait.id) {
          case 'dmgPct':
            damagePct += trait.value;
            break;
          case 'healPct':
            healPct += trait.value;
            break;
          case 'shieldPct':
            shieldPct += trait.value;
            break;
          case 'cooldownReductionPct':
            cooldownReductionPct += trait.value;
            break;
          case 'costReductionPct':
            costReductionPct += trait.value;
            break;
          case 'masteryGainPct':
            masteryGainPct += trait.value;
            break;
          case 'vsBossDamagePct':
            vsBossDamagePct += trait.value;
            break;
          default:
            break;
        }
      });

      if (isBoss) {
        damagePct += vsBossDamagePct;
      }

      const buffPct = Math.max(damagePct, healPct, shieldPct);

      return {
        damageMult: 1 + damagePct,
        healMult: 1 + healPct,
        shieldMult: 1 + shieldPct,
        buffMult: 1 + buffPct,
        cooldownReductionPct: clamp(cooldownReductionPct, 0, MAX_TRAIT_CDR),
        costReductionPct: clamp(costReductionPct, 0, MAX_TRAIT_COST_REDUCTION),
        masteryGainPct,
      };
    },

    getTraitDisplay: (techId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry) return [];
      return entry.traits.map((trait) => {
        const def = getTraitDefinition(trait.id);
        const label = def?.label ?? trait.id;
        const value = formatPercent(trait.value);
        const sign = trait.id.includes('Reduction') ? '-' : '+';
        return `${label} ${sign}${value}`;
      });
    },

    getTraitDefinition: (traitId) => getTraitDefinition(traitId) ?? null,
    getTraitRollRangeLabel: (traitId) => getTraitRollRangeLabel(traitId),
    getTraitQualityPct: (trait) => getTraitQualityPct(trait),
    getTraitSlotBreakdown: (techId) => {
      const entry = get().unlockedTechs[techId];
      return getTechniqueTraitSlotBreakdown({
        grade: entry?.manualGrade,
        rarity: entry?.rarity,
      });
    },

    getRankCap: (techId) => {
      return getTechniqueMaxRankForGrade(get().unlockedTechs[techId]?.manualGrade);
    },

    getRankUpgradeCost: (nextRank) => {
      const table = getRankCostTable();
      return table[nextRank] ?? null;
    },

    getNextRankCost: (techId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) return null;
      const rankCap = get().getRankCap(techId);
      const nextRank = entry.rank + 1;
      if (nextRank > rankCap) return null;
      const cost = get().getRankUpgradeCost(nextRank);
      if (!cost) return null;
      return { nextRank, cost, rankCap };
    },

    upgradeRank: (techId) => {
      GameEvents.emit({ type: 'techniques/rank_upgrade_attempt', payload: { techniqueId: techId } });
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Technique not unlocked.' },
        });
        return { ok: false, reason: 'Technique not unlocked.' };
      }

      const rankCap = get().getRankCap(techId);
      if (entry.rank >= rankCap) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Rank cap reached.' },
        });
        return { ok: false, reason: 'Rank cap reached.' };
      }

      const nextRank = entry.rank + 1;
      const cost = get().getRankUpgradeCost(nextRank);
      if (!cost) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Invalid rank cost.' },
        });
        return { ok: false, reason: 'Invalid rank cost.' };
      }

      if (
        cost.requiredGrade &&
        !isHigherGrade(entry.manualGrade, cost.requiredGrade) &&
        entry.manualGrade !== cost.requiredGrade
      ) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: `Requires ${cost.requiredGrade} grade.` },
        });
        return { ok: false, reason: `Requires ${cost.requiredGrade} grade.` };
      }

      const fragments = get().fragments[techId] ?? 0;
      if (fragments < cost.fragmentsRequired) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Not enough fragments.' },
        });
        return { ok: false, reason: 'Not enough fragments.' };
      }

      const content = useContentStore.getState();
      if (!content.maps.itemsById[RUNE_DUST_ITEM_ID]) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Rune dust item missing.' },
        });
        return { ok: false, reason: 'Rune dust item missing.' };
      }
      if (!content.maps.itemsById[cost.soulInkItemId]) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Soul ink item missing.' },
        });
        return { ok: false, reason: 'Soul ink item missing.' };
      }

      const inventory = useInventoryStore.getState();
      if (!inventory.canAffordItem(RUNE_DUST_ITEM_ID, cost.runeDustRequired)) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Not enough rune dust.' },
        });
        return { ok: false, reason: 'Not enough rune dust.' };
      }

      if (!inventory.canAffordItem(cost.soulInkItemId, cost.soulInkRequired)) {
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Not enough soul ink.' },
        });
        return { ok: false, reason: 'Not enough soul ink.' };
      }

      const removedRuneDust = inventory.spendItem(RUNE_DUST_ITEM_ID, cost.runeDustRequired);
      const removedSoulInk = inventory.spendItem(cost.soulInkItemId, cost.soulInkRequired);

      if (!removedRuneDust || !removedSoulInk) {
        if (removedRuneDust) {
          inventory.addItem(RUNE_DUST_ITEM_ID, cost.runeDustRequired);
        }
        if (removedSoulInk) {
          inventory.addItem(cost.soulInkItemId, cost.soulInkRequired);
        }
        GameEvents.emit({
          type: 'techniques/rank_upgrade_failed',
          payload: { techniqueId: techId, reason: 'Unable to consume materials.' },
        });
        return { ok: false, reason: 'Unable to consume materials.' };
      }

      set((state) => {
        const current = state.fragments[techId] ?? 0;
        state.fragments[techId] = Math.max(0, current - cost.fragmentsRequired);
        const target = state.unlockedTechs[techId];
        if (target) {
          target.rank = nextRank;
        }
        state.collectionVersion = bumpVersion(state.collectionVersion);
      });

      GameEvents.emit({ type: 'techniques/rank_upgrade_success', payload: { techniqueId: techId, nextRank } });
      return { ok: true };
    },

    hydrate: (data) => {
      set((state) => {
        const unlockedTechs: Record<string, TechniqueOwnedState> = {};
        const incoming = data.unlockedTechs ?? {};

        Object.entries(incoming).forEach(([techId, entry]) => {
          unlockedTechs[techId] = normalizeTechEntry(techId, entry);
        });

        state.unlockedTechs = unlockedTechs;
        state.fragments = { ...(data.fragments ?? {}) };
        state.rngSeed = typeof data.rngSeed === 'number' ? data.rngSeed : state.rngSeed;
        state.collectionVersion = bumpVersion(state.collectionVersion);
        state.masteryVersion = bumpVersion(state.masteryVersion);
      });
      Object.keys(get().unlockedTechs).forEach((techId) => {
        get().ensureRunes(techId);
      });
    },

    hardReset: () => {
      set((state) => {
        const base = createInitialState();
        state.unlockedTechs = base.unlockedTechs;
        state.fragments = base.fragments;
        state.rngSeed = base.rngSeed;
        state.collectionVersion = base.collectionVersion;
        state.masteryVersion = base.masteryVersion;
      });
    },
  })),
);
