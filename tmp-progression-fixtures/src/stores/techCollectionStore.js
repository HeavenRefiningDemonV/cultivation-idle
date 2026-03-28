import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { useInventoryStore } from './inventoryStore.js';
import { randFloat } from '../utils/rng.js';
import { useUIStore } from './uiStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { buildTechniqueProgressionSnapshot, getMasteryMilestoneContract, getNextMasteryMilestoneContract, getTechniqueMaxRankForGrade, getTechniqueTraitSlotBreakdown, getTechniqueEffectiveRuneSockets, isHigherTechniqueGrade, isHigherTechniqueRarity, masteryLevelFromXp, normalizeManualGrade, normalizeTechniqueProgressionState, normalizeTechniqueRarity, xpNeededForLevel, } from '../systems/builds/index.js';
export { xpNeededForLevel, masteryLevelFromXp, masteryMultiplier, rankMultiplier } from '../systems/builds/index.js';
export const MASTERY_XP_SCALE = 3;
const DEFAULT_RANK_COSTS = [
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
export const masteryMilestones = (level) => {
    const snapshot = getMasteryMilestoneContract(level);
    return {
        at25: snapshot.highestUnlockedMilestone >= 25,
        at50: snapshot.highestUnlockedMilestone >= 50,
        at75: snapshot.highestUnlockedMilestone >= 75,
        at100: snapshot.highestUnlockedMilestone >= 100,
    };
};
export const normalizeGrade = (input) => normalizeManualGrade(input);
export const normalizeRarity = (input) => normalizeTechniqueRarity(input);
export const isHigherGrade = (current, next) => isHigherTechniqueGrade(current, next);
export const isHigherRarity = (current, next) => isHigherTechniqueRarity(current, next);
export const getMasteryMilestoneEffects = (level) => getMasteryMilestoneContract(level);
export const getNextMasteryMilestone = (level) => getNextMasteryMilestoneContract(level);
export function getManualGradeFromTechnique(technique) {
    return normalizeGrade(technique?.tier);
}
function getRankCostTable() {
    return DEFAULT_RANK_COSTS.reduce((acc, entry) => {
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
const createDefaultOwnedState = () => ({
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
const createInitialState = () => ({
    unlockedTechs: {},
    fragments: {},
    rngSeed: 123456789,
});
const RUNE_DUST_ITEM_ID = 'mat_rune_dust';
const SOUL_INK_REROLL_ITEM_ID = 'reagent_soul_ink_t0';
const TRAIT_LIBRARY = [
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
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}
export function getTraitDefinition(id) {
    return TRAIT_LIBRARY.find((trait) => trait.id === id);
}
function getTraitValue(trait) {
    if (typeof trait.valuePct === 'number')
        return trait.valuePct;
    return trait.value ?? 0;
}
export function getTraitQualityPct(trait) {
    const def = getTraitDefinition(trait.id);
    if (!def)
        return 0;
    const span = def.max - def.min;
    if (span <= 0)
        return 1;
    const value = getTraitValue(trait);
    return clamp((value - def.min) / span, 0, 1);
}
export function getTraitRollRangeLabel(traitId) {
    const def = getTraitDefinition(traitId);
    if (!def)
        return '';
    return `${formatPercent(def.min)} to ${formatPercent(def.max)}`;
}
function rollTraitValue(def, seed) {
    const { value, seed: next } = randFloat(seed);
    const rolled = def.min + (def.max - def.min) * value;
    return { value: Number(rolled.toFixed(4)), seed: next };
}
function rollTraits(count, seed, existingIds = []) {
    const traits = [];
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
        if (!def)
            continue;
        const rolled = rollTraitValue(def, nextSeed);
        nextSeed = rolled.seed;
        traits.push({ id: traitId, value: rolled.value });
    }
    return { traits, seed: nextSeed };
}
function normalizeRunes(runes, slots) {
    const base = Array.isArray(runes) ? [...runes] : [];
    if (slots <= 0)
        return [];
    if (base.length > slots)
        return base.slice(0, slots);
    if (base.length < slots) {
        return [...base, ...Array.from({ length: slots - base.length }, () => null)];
    }
    return base;
}
function getRuneSlotsForGrade(grade) {
    return getTechniqueEffectiveRuneSockets(grade);
}
export function normalizeTechEntry(_techId, incoming) {
    const base = createDefaultOwnedState();
    const merged = {
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
    merged.traits = normalized.traits;
    merged.runes = normalizeRunes(normalized.runes, getRuneSlotsForGrade(normalized.manualGrade));
    merged.tier = incoming?.tier ?? merged.tier;
    merged.lastCastAt = incoming?.lastCastAt;
    merged.unlockedAt = typeof incoming?.unlockedAt === 'number' ? incoming.unlockedAt : merged.unlockedAt;
    merged.favorite = incoming?.favorite ?? merged.favorite;
    return merged;
}
export const useTechCollectionStore = create()(immer((set, get) => ({
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
        if (existing)
            return existing;
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
            if (existing?.unlocked)
                return;
            const normalized = normalizeTechEntry(techId, {
                ...existing,
                ...meta,
                unlocked: true,
                unlockedAt: existing?.unlockedAt ?? Date.now(),
                favorite: existing?.favorite,
            });
            state.unlockedTechs[techId] = normalized;
        });
        get().ensureTraits(techId);
    },
    addFragments: (techId, qty) => {
        if (!Number.isFinite(qty) || qty <= 0)
            return;
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
        if (!Number.isFinite(amount) || amount <= 0)
            return;
        const prevLevel = get().getMasteryLevel(techId);
        set((state) => {
            const entry = state.unlockedTechs[techId];
            if (!entry?.unlocked)
                return;
            const masteryGainPct = get().getTraitModifiers(techId, false).masteryGainPct;
            const total = amount * (1 + masteryGainPct);
            entry.masteryXp += total;
            entry.lastCastAt = now;
        });
        const nextLevel = get().getMasteryLevel(techId);
        if (nextLevel > prevLevel) {
            const milestonesCrossed = [25, 50, 75, 100].filter((milestone) => milestone > prevLevel && milestone <= nextLevel);
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
            const entry = state.unlockedTechs[techId] ?? normalizeTechEntry(techId);
            if (!isHigherGrade(entry.manualGrade, grade)) {
                state.unlockedTechs[techId] = entry;
                return;
            }
            state.unlockedTechs[techId] = normalizeTechEntry(techId, {
                ...entry,
                manualGrade: grade,
            });
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
            state.unlockedTechs[techId] = normalizeTechEntry(techId, {
                ...entry,
                rarity,
            });
        });
    },
    getMasteryLevel: (techId) => {
        const entry = get().unlockedTechs[techId];
        return masteryLevelFromXp(entry?.masteryXp ?? 0);
    },
    ensureMasteryLevelAtLeast: (techId, level) => {
        if (level <= 1)
            return;
        set((state) => {
            const entry = state.unlockedTechs[techId];
            if (!entry?.unlocked)
                return;
            const targetXp = xpNeededForLevel(level);
            if (entry.masteryXp >= targetXp)
                return;
            entry.masteryXp = targetXp;
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
            if (!entry)
                return;
            const slots = getTechniqueEffectiveRuneSockets(entry.manualGrade);
            entry.runes = normalizeRunes(entry.runes, slots);
        });
    },
    socketRune: (techId, slotIndex, runeItemId) => {
        const entry = get().unlockedTechs[techId];
        if (!entry?.unlocked)
            return { ok: false, reason: 'Technique not unlocked.' };
        const slots = get().getTechniqueProgressionSnapshot(techId).runeSockets;
        if (slotIndex < 0 || slotIndex >= slots)
            return { ok: false, reason: 'Invalid slot.' };
        const currentRunes = normalizeRunes(entry.runes, slots);
        if (currentRunes[slotIndex])
            return { ok: false, reason: 'Slot already filled.' };
        const content = useContentStore.getState();
        if (!content.maps.runesById[runeItemId]) {
            return { ok: false, reason: 'Unknown rune.' };
        }
        const inventory = useInventoryStore.getState();
        if (inventory.getQty(runeItemId) < 1) {
            return { ok: false, reason: 'Not enough runes.' };
        }
        const removed = inventory.removeItem(runeItemId, 1);
        if (!removed)
            return { ok: false, reason: 'Unable to consume rune.' };
        set((state) => {
            const target = state.unlockedTechs[techId];
            if (!target)
                return;
            target.runes = normalizeRunes(target.runes, slots);
            target.runes[slotIndex] = runeItemId;
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
        });
    },
    isFavorite: (techId) => Boolean(get().unlockedTechs[techId]?.favorite),
    unsocketRune: (techId, slotIndex) => {
        const entry = get().unlockedTechs[techId];
        if (!entry)
            return { ok: false, reason: 'Technique not unlocked.' };
        const slots = get().getTechniqueProgressionSnapshot(techId).runeSockets;
        if (slotIndex < 0 || slotIndex >= slots)
            return { ok: false, reason: 'Invalid slot.' };
        const currentRunes = normalizeRunes(entry.runes, slots);
        const runeId = currentRunes[slotIndex];
        if (!runeId)
            return { ok: false, reason: 'Slot is empty.' };
        const inventory = useInventoryStore.getState();
        inventory.addItem(runeId, 1);
        set((state) => {
            const target = state.unlockedTechs[techId];
            if (!target)
                return;
            target.runes = normalizeRunes(target.runes, slots);
            target.runes[slotIndex] = null;
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
            if (!runeId)
                return;
            const runeDef = content.maps.runesById[runeId];
            if (!runeDef)
                return;
            const effects = runeDef.effects ?? [];
            effects.forEach((effect) => {
                const stat = effect.stat ?? '';
                const pct = typeof effect.pct === 'number' ? effect.pct : 0;
                if (!stat || !pct)
                    return;
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
                        if (isHeaven)
                            costReductionPct += Math.abs(pct);
                        break;
                    case 'heavenCooldown':
                        if (isHeaven)
                            cooldownReductionPct += Math.abs(pct);
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
            if (!entry)
                return;
            const slots = get().getEffectiveTraitSlots(techId);
            if (slots <= 0) {
                entry.traits = [];
                return;
            }
            if (entry.traits.length === slots)
                return;
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
            if (!target)
                return;
            const lockedTrait = hasValidLock ? target.traits[lockIndex] : null;
            const availableSlots = hasValidLock ? slots - 1 : slots;
            const existingIds = lockedTrait ? [lockedTrait.id] : [];
            const next = rollTraits(availableSlots, state.rngSeed, existingIds);
            state.rngSeed = next.seed;
            const traits = hasValidLock
                ? [...next.traits.slice(0, lockIndex), lockedTrait, ...next.traits.slice(lockIndex)]
                : next.traits;
            target.traits = traits.slice(0, slots);
        });
        GameEvents.emit({ type: 'techniques/trait_reroll_result', payload: { techniqueId: techId, ok: true } });
        return { ok: true, lockedIndex: hasValidLock ? lockIndex : undefined, cost: { soulInkItemId: SOUL_INK_REROLL_ITEM_ID, qty: costQty } };
    },
    applyTraitQualityBoost: (techId, chance = 0.05) => {
        if (chance <= 0)
            return;
        set((state) => {
            const entry = state.unlockedTechs[techId];
            if (!entry?.unlocked || !entry.traits?.length)
                return;
            let seed = state.rngSeed;
            entry.traits = entry.traits.map((trait) => {
                const def = getTraitDefinition(trait.id);
                if (!def)
                    return trait;
                const roll = randFloat(seed);
                seed = roll.seed;
                if (roll.value >= chance)
                    return trait;
                const boosted = Math.min(def.max, trait.value + (def.max - trait.value) * 0.5);
                return { ...trait, value: Number(boosted.toFixed(4)) };
            });
            state.rngSeed = seed;
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
        if (!entry)
            return [];
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
        if (!entry?.unlocked)
            return null;
        const rankCap = get().getRankCap(techId);
        const nextRank = entry.rank + 1;
        if (nextRank > rankCap)
            return null;
        const cost = get().getRankUpgradeCost(nextRank);
        if (!cost)
            return null;
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
        if (cost.requiredGrade &&
            !isHigherGrade(entry.manualGrade, cost.requiredGrade) &&
            entry.manualGrade !== cost.requiredGrade) {
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
        });
        GameEvents.emit({ type: 'techniques/rank_upgrade_success', payload: { techniqueId: techId, nextRank } });
        return { ok: true };
    },
    hydrate: (data) => {
        set((state) => {
            const unlockedTechs = {};
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
})));
