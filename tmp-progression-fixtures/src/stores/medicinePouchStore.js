import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { isCombatUsableConsumable } from '../systems/consumables/consumableCatalog.js';
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
    equip: (slotKey, itemId) => {
        set((state) => {
            const slot = state.slots[slotKey];
            if (!slot)
                return;
            slot.equippedItemId = itemId && isCombatUsableConsumable(itemId) ? itemId : null;
        });
    },
    setSlotConfig: (slotKey, partial) => {
        set((state) => {
            const slot = state.slots[slotKey];
            if (!slot)
                return;
            if (partial.enabled !== undefined)
                slot.enabled = Boolean(partial.enabled);
            if (partial.trigger !== undefined && isValidTrigger(partial.trigger)) {
                slot.trigger = partial.trigger;
            }
            if (partial.thresholdPct !== undefined) {
                slot.thresholdPct = clamp(Number(partial.thresholdPct), 0, 100);
            }
            if (partial.cooldownSec !== undefined) {
                slot.cooldownSec = clamp(Number(partial.cooldownSec), 0, 3600);
            }
            if (partial.bossOnly !== undefined)
                slot.bossOnly = Boolean(partial.bossOnly);
        });
    },
    markUsed: (slotKey, now = Date.now()) => {
        set((state) => {
            const slot = state.slots[slotKey];
            if (!slot)
                return;
            slot.lastUsedAt = now;
        });
    },
    hydrate: (slice) => {
        const defaults = createDefaultSlots();
        const incomingSlots = slice?.slots;
        if (!incomingSlots || typeof incomingSlots !== 'object') {
            set(() => ({ slots: defaults }));
            return;
        }
        const nextSlots = { ...defaults };
        Object.keys(defaults).forEach((slotKey) => {
            nextSlots[slotKey] = sanitizeSlot(slotKey, incomingSlots[slotKey], defaults[slotKey]);
        });
        set(() => ({ slots: nextSlots }));
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
        set(() => ({ slots: createDefaultSlots() }));
    },
})));
export const createDefaultMedicinePouchState = () => ({
    slots: createDefaultSlots(),
});
