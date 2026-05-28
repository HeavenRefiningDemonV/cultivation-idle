import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  MedicinePouchSlotKey,
  MedicinePouchSlotState,
  MedicinePouchState,
  MedicinePouchTrigger,
} from '../types/index.js';
import { isCombatUsableConsumable } from '../systems/consumables/consumableCatalog.js';
import { bumpVersion } from './versionCounters.js';

type SlotConfigUpdate = Partial<
  Pick<MedicinePouchSlotState, 'enabled' | 'trigger' | 'thresholdPct' | 'cooldownSec' | 'bossOnly'>
>;

interface MedicinePouchStoreState extends MedicinePouchState {
  pouchVersion: number;
  equip: (slotKey: MedicinePouchSlotKey, itemId: string | null) => void;
  setSlotConfig: (slotKey: MedicinePouchSlotKey, partial: SlotConfigUpdate) => void;
  markUsed: (slotKey: MedicinePouchSlotKey, now?: number) => void;
  hydrate: (slice?: Partial<MedicinePouchState>) => void;
  toSaveState: () => MedicinePouchState;
  hardReset: () => void;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const validTriggers: MedicinePouchTrigger[] = [
  'manual',
  'hpBelowPct',
  'qiBelowPct',
  'intentBelowPct',
  'fightStart',
  'bossStart',
];

const isValidTrigger = (value: unknown): value is MedicinePouchTrigger =>
  typeof value === 'string' && (validTriggers as readonly string[]).includes(value);

const createDefaultSlot = (
  slotKey: MedicinePouchSlotKey,
  overrides: Partial<Omit<MedicinePouchSlotState, 'slotKey'>> = {},
): MedicinePouchSlotState => ({
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

const createDefaultSlots = (): Record<MedicinePouchSlotKey, MedicinePouchSlotState> => ({
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

const sameSlotState = (left: MedicinePouchSlotState, right: MedicinePouchSlotState): boolean =>
  left.slotKey === right.slotKey
  && left.equippedItemId === right.equippedItemId
  && left.enabled === right.enabled
  && left.trigger === right.trigger
  && left.thresholdPct === right.thresholdPct
  && left.cooldownSec === right.cooldownSec
  && left.bossOnly === right.bossOnly
  && left.lastUsedAt === right.lastUsedAt;

const sameSlotMap = (
  left: Record<MedicinePouchSlotKey, MedicinePouchSlotState>,
  right: Record<MedicinePouchSlotKey, MedicinePouchSlotState>,
): boolean => sameSlotState(left.healing, right.healing)
  && sameSlotState(left.utility, right.utility)
  && sameSlotState(left.specialty, right.specialty);

function sanitizeSlot(
  slotKey: MedicinePouchSlotKey,
  raw: Partial<MedicinePouchSlotState> | null | undefined,
  fallback: MedicinePouchSlotState,
): MedicinePouchSlotState {
  if (!raw || typeof raw !== 'object') return fallback;
  const equippedItemId = typeof raw.equippedItemId === 'string' && isCombatUsableConsumable(raw.equippedItemId) ? raw.equippedItemId : null;
  const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : fallback.enabled;
  const trigger = isValidTrigger(raw.trigger) ? raw.trigger : fallback.trigger;
  const thresholdPct = clamp(
    typeof raw.thresholdPct === 'number' ? raw.thresholdPct : fallback.thresholdPct,
    0,
    100,
  );
  const cooldownSec = clamp(
    typeof raw.cooldownSec === 'number' ? raw.cooldownSec : fallback.cooldownSec,
    0,
    3600,
  );
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

export const useMedicinePouchStore = create<MedicinePouchStoreState>()(
  immer((set, get) => ({
    slots: createDefaultSlots(),
    pouchVersion: 0,

    equip: (slotKey, itemId) => {
      const slot = get().slots[slotKey];
      if (!slot) return;
      const nextItemId = itemId && isCombatUsableConsumable(itemId) ? itemId : null;
      if (slot.equippedItemId === nextItemId) return;
      set((state) => {
        state.slots[slotKey].equippedItemId = nextItemId;
        state.pouchVersion = bumpVersion(state.pouchVersion);
      });
    },

    setSlotConfig: (slotKey, partial) => {
      const current = get().slots[slotKey];
      if (!current) return;
      const next = { ...current };
      if (partial.enabled !== undefined) next.enabled = Boolean(partial.enabled);
      if (partial.trigger !== undefined && isValidTrigger(partial.trigger)) {
        next.trigger = partial.trigger;
      }
      if (partial.thresholdPct !== undefined) {
        next.thresholdPct = clamp(Number(partial.thresholdPct), 0, 100);
      }
      if (partial.cooldownSec !== undefined) {
        next.cooldownSec = clamp(Number(partial.cooldownSec), 0, 3600);
      }
      if (partial.bossOnly !== undefined) next.bossOnly = Boolean(partial.bossOnly);
      if (sameSlotState(current, next)) return;

      set((state) => {
        const slot = state.slots[slotKey];
        if (!slot) return;
        Object.assign(slot, next);
        state.pouchVersion = bumpVersion(state.pouchVersion);
      });
    },

    markUsed: (slotKey, now = Date.now()) => {
      const slot = get().slots[slotKey];
      if (!slot || slot.lastUsedAt === now) return;
      set((state) => {
        state.slots[slotKey].lastUsedAt = now;
        state.pouchVersion = bumpVersion(state.pouchVersion);
      });
    },

    hydrate: (slice) => {
      const defaults = createDefaultSlots();
      const incomingSlots = slice?.slots;
      if (!incomingSlots || typeof incomingSlots !== 'object') {
        if (sameSlotMap(get().slots, defaults)) return;
        set((state) => {
          state.slots = defaults;
          state.pouchVersion = bumpVersion(state.pouchVersion);
        });
        return;
      }
      const nextSlots = { ...defaults } as Record<MedicinePouchSlotKey, MedicinePouchSlotState>;
      (Object.keys(defaults) as MedicinePouchSlotKey[]).forEach((slotKey) => {
        nextSlots[slotKey] = sanitizeSlot(slotKey, incomingSlots[slotKey] as MedicinePouchSlotState, defaults[slotKey]);
      });
      if (sameSlotMap(get().slots, nextSlots)) return;
      set((state) => {
        state.slots = nextSlots;
        state.pouchVersion = bumpVersion(state.pouchVersion);
      });
    },

    toSaveState: () => {
      const { slots } = get();
      const clone: Record<MedicinePouchSlotKey, MedicinePouchSlotState> = {
        healing: { ...slots.healing },
        utility: { ...slots.utility },
        specialty: { ...slots.specialty },
      };
      return { slots: clone };
    },

    hardReset: () => {
      set(() => ({ slots: createDefaultSlots(), pouchVersion: 0 }));
    },
  })),
);

export const createDefaultMedicinePouchState = (): MedicinePouchState => ({
  slots: createDefaultSlots(),
});
