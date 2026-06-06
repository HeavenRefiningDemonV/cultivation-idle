import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { isCombatUsableConsumable } from '../systems/consumables/consumableCatalog.js';
import { bumpVersion } from './versionCounters.js';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const validTriggers = [
    'manual',
    'hpBelowPct',
    'qiBelowPct',
    'intentBelowPct',
    'fightStart',
    'bossStart',
];
const isValidTrigger = (value) => typeof value === 'string' && validTriggers.includes(value);
const createDefaultSlot = (slotKey, overrides = {}) => ({
    slotKey,
    equippedItemId: null,
    enabled: true,
    trigger: 'manual',
    thresholdPct: 50,
    cooldownSec: 30,
    bossOnly: false,
    lastUsedAt: null,
    ...overrides,
});
const createDefaultSlots = () => ({
    healing: createDefaultSlot('healing', {
        trigger: 'hpBelowPct',
        thresholdPct: 35,
        cooldownSec: 10,
    }),
    utility: createDefaultSlot('utility', {
        trigger: 'manual',
        thresholdPct: 50,
        cooldownSec: 30,
    }),
    specialty: createDefaultSlot('specialty', {
        trigger: 'manual',
        thresholdPct: 50,
        cooldownSec: 60,
        bossOnly: true,
    }),
});
const sameSlotState = (left, right) => left.slotKey === right.slotKey
    && left.equippedItemId === right.equippedItemId
    && left.enabled === right.enabled
    && left.trigger === right.trigger
    && left.thresholdPct === right.thresholdPct
    && left.cooldownSec === right.cooldownSec
    && left.bossOnly === right.bossOnly
    && left.lastUsedAt === right.lastUsedAt;
const sameSlotMap = (left, right) => sameSlotState(left.healing, right.healing)
    && sameSlotState(left.utility, right.utility)
    && sameSlotState(left.specialty, right.specialty);
function sanitizeSlot(slotKey, raw, fallback) {
    if (!raw || typeof raw !== 'object')
        return fallback;
    const equippedItemId = typeof raw.equippedItemId === 'string' && isCombatUsableConsumable(raw.equippedItemId) ? raw.equippedItemId : null;
    const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : fallback.enabled;
    const trigger = isValidTrigger(raw.trigger) ? raw.trigger : fallback.trigger;
    const thresholdPct = clamp(typeof raw.thresholdPct === 'number' ? raw.thresholdPct : fallback.thresholdPct, 0, 100);
    const cooldownSec = clamp(typeof raw.cooldownSec === 'number' ? raw.cooldownSec : fallback.cooldownSec, 0, 3600);
    const bossOnly = raw.bossOnly !== undefined ? Boolean(raw.bossOnly) : fallback.bossOnly;
    const lastUsedAt = typeof raw.lastUsedAt === 'number' ? raw.lastUsedAt : null;
    return {
        slotKey,
        equippedItemId,
        enabled,
        trigger,
        thresholdPct,
        cooldownSec,
        bossOnly,
        lastUsedAt,
    };
}
export const useMedicinePouchStore = create()(immer((set, get) => ({
    slots: createDefaultSlots(),
    pouchVersion: 0,
    equip: (slotKey, itemId) => {
        const slot = get().slots[slotKey];
        if (!slot)
            return;
        const nextItemId = itemId && isCombatUsableConsumable(itemId) ? itemId : null;
        if (slot.equippedItemId === nextItemId)
            return;
        set((state) => {
            state.slots[slotKey].equippedItemId = nextItemId;
            state.pouchVersion = bumpVersion(state.pouchVersion);
        });
    },
    setSlotConfig: (slotKey, partial) => {
        const current = get().slots[slotKey];
        if (!current)
            return;
        const next = { ...current };
        if (partial.enabled !== undefined)
            next.enabled = Boolean(partial.enabled);
        if (partial.trigger !== undefined && isValidTrigger(partial.trigger)) {
            next.trigger = partial.trigger;
        }
        if (partial.thresholdPct !== undefined) {
            next.thresholdPct = clamp(Number(partial.thresholdPct), 0, 100);
        }
        if (partial.cooldownSec !== undefined) {
            next.cooldownSec = clamp(Number(partial.cooldownSec), 0, 3600);
        }
        if (partial.bossOnly !== undefined)
            next.bossOnly = Boolean(partial.bossOnly);
        if (sameSlotState(current, next))
            return;
        set((state) => {
            const slot = state.slots[slotKey];
            if (!slot)
                return;
            Object.assign(slot, next);
            state.pouchVersion = bumpVersion(state.pouchVersion);
        });
    },
    markUsed: (slotKey, now = Date.now()) => {
        const slot = get().slots[slotKey];
        if (!slot || slot.lastUsedAt === now)
            return;
        set((state) => {
            state.slots[slotKey].lastUsedAt = now;
            state.pouchVersion = bumpVersion(state.pouchVersion);
        });
    },
    hydrate: (slice) => {
        const defaults = createDefaultSlots();
        const incomingSlots = slice?.slots;
        if (!incomingSlots || typeof incomingSlots !== 'object') {
            if (sameSlotMap(get().slots, defaults))
                return;
            set((state) => {
                state.slots = defaults;
                state.pouchVersion = bumpVersion(state.pouchVersion);
            });
            return;
        }
        const nextSlots = { ...defaults };
        Object.keys(defaults).forEach((slotKey) => {
            nextSlots[slotKey] = sanitizeSlot(slotKey, incomingSlots[slotKey], defaults[slotKey]);
        });
        if (sameSlotMap(get().slots, nextSlots))
            return;
        set((state) => {
            state.slots = nextSlots;
            state.pouchVersion = bumpVersion(state.pouchVersion);
        });
    },
    toSaveState: () => {
        const { slots } = get();
        const clone = {
            healing: { ...slots.healing },
            utility: { ...slots.utility },
            specialty: { ...slots.specialty },
        };
        return { slots: clone };
    },
    hardReset: () => {
        set(() => ({ slots: createDefaultSlots(), pouchVersion: 0 }));
    },
})));
export const createDefaultMedicinePouchState = () => ({
    slots: createDefaultSlots(),
});
