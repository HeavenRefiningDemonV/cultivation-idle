import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TechniqueDef } from '../content';
import { useContentStore } from './contentStore';
import { useInventoryStore } from './inventoryStore';
import { randFloat } from '../utils/rng';

export type ManualGrade = 'mortal' | 'earth' | 'heaven' | 'mystic';
export type TechRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

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
}

interface TechCollectionState {
  unlockedTechs: Record<string, TechniqueOwnedState>;
  fragments: Record<string, number>;
  rngSeed: number;
  hasTech: (techId: string) => boolean;
  ensureTechState: (techId: string) => TechniqueOwnedState;
  unlockTech: (techId: string, meta?: Partial<TechniqueOwnedState>) => void;
  addFragments: (techId: string, qty: number) => void;
  getFragments: (techId: string) => number;
  addMasteryXp: (techId: string, amount: number, now?: number) => void;
  setManualGrade: (techId: string, grade: ManualGrade) => void;
  setRarityIfHigher: (techId: string, rarity: TechRarity) => void;
  getMasteryLevel: (techId: string) => number;
  getEffectiveRuneSlots: (techId: string) => number;
  getEffectiveTraitSlots: (techId: string) => number;
  ensureTraits: (techId: string) => void;
  rerollTraits: (techId: string) => { ok: boolean; reason?: string };
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
  getRankCap: (techId: string) => number;
  getRankUpgradeCost: (nextRank: number) => {
    fragmentsRequired: number;
    runeDustRequired: number;
    soulInkRequired: number;
    soulInkItemId: string;
  } | null;
  upgradeRank: (techId: string) => { ok: boolean; reason?: string };
  hydrate: (data: {
    unlockedTechs?: Record<string, Partial<TechniqueOwnedState>>;
    fragments?: Record<string, number>;
    rngSeed?: number;
  }) => void;
  hardReset: () => void;
}

const XP_SCALE = 3;
export const MASTERY_XP_SCALE = XP_SCALE;

const gradeOrder: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const rarityOrder: TechRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function masteryLevelFromXp(xp: number): number {
  const normalized = Math.max(0, xp);
  const level = 1 + Math.floor(Math.sqrt(normalized / XP_SCALE));
  return Math.min(100, Math.max(1, level));
}

export function masteryMultiplier(level: number): number {
  const clamped = Math.min(100, Math.max(1, level));
  return 1 + 0.003 * clamped;
}

export function rankMultiplier(rank: number): number {
  const clamped = Math.min(10, Math.max(1, rank));
  return 1 + 0.1 * (clamped - 1);
}

export function masteryMilestones(level: number) {
  return {
    at25: level >= 25,
    at50: level >= 50,
    at75: level >= 75,
    at100: level >= 100,
  };
}

export function normalizeGrade(input?: string): ManualGrade {
  const value = (input ?? '').toLowerCase();
  if (value === 'earth' || value === 'heaven' || value === 'mystic' || value === 'mortal') {
    return value;
  }
  return 'mortal';
}

export function normalizeRarity(input?: string): TechRarity {
  const value = (input ?? '').toLowerCase();
  if (value === 'uncommon' || value === 'rare' || value === 'epic' || value === 'legendary') {
    return value;
  }
  return 'common';
}

export function isHigherGrade(current: ManualGrade, next: ManualGrade): boolean {
  return gradeOrder.indexOf(next) > gradeOrder.indexOf(current);
}

export function isHigherRarity(current: TechRarity, next: TechRarity): boolean {
  return rarityOrder.indexOf(next) > rarityOrder.indexOf(current);
}

export function getManualGradeFromTechnique(technique?: TechniqueDef): ManualGrade {
  return normalizeGrade(technique?.tier);
}

const createDefaultOwnedState = (): TechniqueOwnedState => ({
  unlocked: false,
  masteryXp: 0,
  rank: 1,
  manualGrade: 'mortal',
  rarity: 'common',
  traits: [],
  runes: [],
});

const createInitialState = (): Pick<TechCollectionState, 'unlockedTechs' | 'fragments' | 'rngSeed'> => ({
  unlockedTechs: {},
  fragments: {},
  rngSeed: 123456789,
});

const rankCapsByGrade: Record<ManualGrade, number> = {
  mortal: 5,
  earth: 7,
  heaven: 9,
  mystic: 10,
};

const runeSlotsByGrade: Record<ManualGrade, number> = {
  mortal: 0,
  earth: 1,
  heaven: 1,
  mystic: 2,
};

const rankCostTable: Record<
  number,
  {
    fragmentsRequired: number;
    runeDustRequired: number;
    soulInkRequired: number;
    soulInkItemId: string;
  }
> = {
  2: { fragmentsRequired: 20, runeDustRequired: 2, soulInkRequired: 1, soulInkItemId: 'reagent_soul_ink_t0' },
  3: { fragmentsRequired: 40, runeDustRequired: 4, soulInkRequired: 2, soulInkItemId: 'reagent_soul_ink_t0' },
  4: { fragmentsRequired: 80, runeDustRequired: 8, soulInkRequired: 4, soulInkItemId: 'reagent_soul_ink_t0' },
  5: { fragmentsRequired: 160, runeDustRequired: 16, soulInkRequired: 8, soulInkItemId: 'reagent_soul_ink_t0' },
  6: { fragmentsRequired: 240, runeDustRequired: 24, soulInkRequired: 12, soulInkItemId: 'reagent_soul_ink_t1' },
  7: { fragmentsRequired: 360, runeDustRequired: 36, soulInkRequired: 18, soulInkItemId: 'reagent_soul_ink_t1' },
  8: { fragmentsRequired: 520, runeDustRequired: 52, soulInkRequired: 26, soulInkItemId: 'reagent_soul_ink_t2' },
  9: { fragmentsRequired: 750, runeDustRequired: 75, soulInkRequired: 38, soulInkItemId: 'reagent_soul_ink_t2' },
  10: { fragmentsRequired: 1100, runeDustRequired: 110, soulInkRequired: 55, soulInkItemId: 'reagent_soul_ink_t2' },
};

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

function getTraitDefinition(id: string): TraitDefinition | undefined {
  return TRAIT_LIBRARY.find((trait) => trait.id === id);
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
  return runeSlotsByGrade[grade] ?? 0;
}

export function normalizeTechEntry(
  techId: string,
  incoming?: Partial<TechniqueOwnedState> | null,
): TechniqueOwnedState {
  const base = createDefaultOwnedState();
  const merged: TechniqueOwnedState = {
    ...base,
    ...(incoming ?? {}),
  };

  merged.unlocked = Boolean(incoming?.unlocked ?? merged.unlocked);
  merged.masteryXp = Math.max(0, Number(incoming?.masteryXp ?? merged.masteryXp ?? 0));
  merged.rank = Math.max(1, Number(incoming?.rank ?? merged.rank ?? 1));
  merged.manualGrade = normalizeGrade(incoming?.manualGrade);
  merged.rarity = normalizeRarity(incoming?.rarity);
  merged.traits = Array.isArray(incoming?.traits) ? incoming!.traits!.filter(Boolean) : base.traits;
  const normalizedRunes = Array.isArray(incoming?.runes) ? incoming!.runes!.map((rune) => rune ?? null) : base.runes;
  merged.runes = normalizeRunes(normalizedRunes, getRuneSlotsForGrade(merged.manualGrade));
  merged.tier = incoming?.tier ?? merged.tier;
  merged.lastCastAt = incoming?.lastCastAt;

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
        });
        state.unlockedTechs[techId] = normalized;
      });
      get().ensureTraits(techId);
    },

    addFragments: (techId, qty) => {
      if (!Number.isFinite(qty) || qty <= 0) return;
      set((state) => {
        const current = state.fragments[techId] ?? 0;
        const next = current + qty;
        state.fragments[techId] = next < 0 ? 0 : next;
      });
    },

    getFragments: (techId) => {
      return get().fragments[techId] ?? 0;
    },

    addMasteryXp: (techId, amount, now = Date.now()) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry?.unlocked) return;
        const masteryGainPct = get().getTraitModifiers(techId, false).masteryGainPct;
        const total = amount * (1 + masteryGainPct);
        entry.masteryXp += total;
        entry.lastCastAt = now;
      });
    },

    setManualGrade: (techId, grade) => {
      set((state) => {
        const entry = state.unlockedTechs[techId] ?? normalizeTechEntry(techId);
        if (!isHigherGrade(entry.manualGrade, grade)) {
          state.unlockedTechs[techId] = entry;
          return;
        }
        entry.manualGrade = grade;
        entry.runes = normalizeRunes(entry.runes, getRuneSlotsForGrade(entry.manualGrade));
        state.unlockedTechs[techId] = entry;
      });
      get().ensureRunes(techId);
    },

    setRarityIfHigher: (techId, rarity) => {
      set((state) => {
        const entry = state.unlockedTechs[techId] ?? normalizeTechEntry(techId);
        if (!isHigherRarity(entry.rarity, rarity)) {
          state.unlockedTechs[techId] = entry;
          return;
        }
        entry.rarity = rarity;
        state.unlockedTechs[techId] = entry;
      });
    },

    getMasteryLevel: (techId) => {
      const entry = get().unlockedTechs[techId];
      return masteryLevelFromXp(entry?.masteryXp ?? 0);
    },

    getMasteryCooldownReductionPct: (techId) => {
      const level = get().getMasteryLevel(techId);
      const milestones = masteryMilestones(level);
      let reduction = 0;
      if (milestones.at50) reduction += 0.05;
      if (milestones.at75) reduction += 0.05;
      if (milestones.at100) reduction += 0.05;
      return clamp(reduction, 0, 0.15);
    },

    getMasteryCostReductionPct: (techId) => {
      const level = get().getMasteryLevel(techId);
      const milestones = masteryMilestones(level);
      let reduction = 0;
      if (milestones.at50) reduction += 0.05;
      if (milestones.at75) reduction += 0.05;
      if (milestones.at100) reduction += 0.05;
      return clamp(reduction, 0, 0.15);
    },

    getEffectiveRuneSlots: (techId) => {
      const grade = get().unlockedTechs[techId]?.manualGrade ?? 'mortal';
      return getRuneSlotsForGrade(grade);
    },

    getEffectiveTraitSlots: (techId) => {
      const entry = get().unlockedTechs[techId];
      const rarity = entry?.rarity ?? 'common';
      const grade = entry?.manualGrade ?? 'mortal';

      const raritySlots: Record<TechRarity, number> = {
        common: 0,
        uncommon: 1,
        rare: 1,
        epic: 2,
        legendary: 3,
      };
      const gradeCap: Record<ManualGrade, number> = {
        mortal: 0,
        earth: 1,
        heaven: 2,
        mystic: 3,
      };

      return Math.min(raritySlots[rarity], gradeCap[grade]);
    },

    ensureRunes: (techId) => {
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry) return;
        const slots = getRuneSlotsForGrade(entry.manualGrade);
        entry.runes = normalizeRunes(entry.runes, slots);
      });
    },

    socketRune: (techId, slotIndex, runeItemId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) return { ok: false, reason: 'Technique not unlocked.' };

      const slots = getRuneSlotsForGrade(entry.manualGrade);
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
      });

      return { ok: true };
    },

    unsocketRune: (techId, slotIndex) => {
      const entry = get().unlockedTechs[techId];
      if (!entry) return { ok: false, reason: 'Technique not unlocked.' };

      const slots = getRuneSlotsForGrade(entry.manualGrade);
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
          entry.traits = [];
          return;
        }

        if (entry.traits.length === slots) return;

        if (entry.traits.length > slots) {
          entry.traits = entry.traits.slice(0, slots);
          return;
        }

        const missing = slots - entry.traits.length;
        const existingIds = entry.traits.map((trait) => trait.id);
        const rolled = rollTraits(missing, state.rngSeed, existingIds);
        state.rngSeed = rolled.seed;
        entry.traits = [...entry.traits, ...rolled.traits];
      });
    },

    rerollTraits: (techId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) return { ok: false, reason: 'Technique not unlocked.' };

      const slots = get().getEffectiveTraitSlots(techId);
      if (slots <= 0) return { ok: false, reason: 'No trait slots available.' };

      const content = useContentStore.getState();
      if (!content.maps.itemsById[SOUL_INK_REROLL_ITEM_ID]) {
        return { ok: false, reason: 'Soul ink item missing.' };
      }

      const inventory = useInventoryStore.getState();
      if (inventory.getQty(SOUL_INK_REROLL_ITEM_ID) < 1) {
        return { ok: false, reason: 'Not enough soul ink.' };
      }

      const removed = inventory.removeItem(SOUL_INK_REROLL_ITEM_ID, 1);
      if (!removed) return { ok: false, reason: 'Unable to consume soul ink.' };

      set((state) => {
        const next = rollTraits(slots, state.rngSeed);
        state.rngSeed = next.seed;
        const target = state.unlockedTechs[techId];
        if (target) {
          target.traits = next.traits;
        }
      });

      return { ok: true };
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

    getRankCap: (techId) => {
      const grade = get().unlockedTechs[techId]?.manualGrade ?? 'mortal';
      return rankCapsByGrade[grade] ?? 5;
    },

    getRankUpgradeCost: (nextRank) => {
      return rankCostTable[nextRank] ?? null;
    },

    upgradeRank: (techId) => {
      const entry = get().unlockedTechs[techId];
      if (!entry?.unlocked) return { ok: false, reason: 'Technique not unlocked.' };

      const rankCap = get().getRankCap(techId);
      if (entry.rank >= rankCap) return { ok: false, reason: 'Rank cap reached.' };

      const nextRank = entry.rank + 1;
      const cost = get().getRankUpgradeCost(nextRank);
      if (!cost) return { ok: false, reason: 'Invalid rank cost.' };

      const fragments = get().fragments[techId] ?? 0;
      if (fragments < cost.fragmentsRequired) return { ok: false, reason: 'Not enough fragments.' };

      const content = useContentStore.getState();
      if (!content.maps.itemsById[RUNE_DUST_ITEM_ID]) {
        return { ok: false, reason: 'Rune dust item missing.' };
      }
      if (!content.maps.itemsById[cost.soulInkItemId]) {
        return { ok: false, reason: 'Soul ink item missing.' };
      }

      const inventory = useInventoryStore.getState();
      const runeDustQty = inventory.getQty(RUNE_DUST_ITEM_ID);
      if (runeDustQty < cost.runeDustRequired) return { ok: false, reason: 'Not enough rune dust.' };

      const soulInkQty = inventory.getQty(cost.soulInkItemId);
      if (soulInkQty < cost.soulInkRequired) return { ok: false, reason: 'Not enough soul ink.' };

      const removedRuneDust = inventory.removeItem(RUNE_DUST_ITEM_ID, cost.runeDustRequired);
      const removedSoulInk = inventory.removeItem(cost.soulInkItemId, cost.soulInkRequired);

      if (!removedRuneDust || !removedSoulInk) {
        if (removedRuneDust) {
          inventory.addItem(RUNE_DUST_ITEM_ID, cost.runeDustRequired);
        }
        if (removedSoulInk) {
          inventory.addItem(cost.soulInkItemId, cost.soulInkRequired);
        }
        return { ok: false, reason: 'Unable to consume materials.' };
      }

      set((state) => {
        const current = state.fragments[techId] ?? 0;
        state.fragments[techId] = Math.max(0, current - cost.fragmentsRequired);
        const target = state.unlockedTechs[techId];
        if (target) {
          target.rank = nextRank;
        }
      });

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
      });
    },
  })),
);
