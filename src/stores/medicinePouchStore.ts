import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  MedicinePouchSlotKey,
  MedicinePouchSlotState,
  MedicinePouchState,
  MedicinePouchTrigger,
} from '../types';

type SlotConfigUpdate = Partial<
  Pick<MedicinePouchSlotState, 'enabled' | 'trigger' | 'thresholdPct' | 'cooldownSec' | 'bossOnly'>
>;

interface MedicinePouchStoreState extends MedicinePouchState {
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

function sanitizeSlot(
  slotKey: MedicinePouchSlotKey,
  raw: Partial<MedicinePouchSlotState> | null | undefined,
  fallback: MedicinePouchSlotState,
): MedicinePouchSlotState {
  if (!raw || typeof raw !== 'object') return fallback;
  const equippedItemId = typeof raw.equippedItemId === 'string' ? raw.equippedItemId : null;
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

    equip: (slotKey, itemId) => {
      set((state) => {
        const slot = state.slots[slotKey];
        if (!slot) return;
        slot.equippedItemId = itemId ?? null;
      });
    },

    setSlotConfig: (slotKey, partial) => {
      set((state) => {
        const slot = state.slots[slotKey];
        if (!slot) return;
        if (partial.enabled !== undefined) slot.enabled = Boolean(partial.enabled);
        if (partial.trigger !== undefined && isValidTrigger(partial.trigger)) {
          slot.trigger = partial.trigger;
        }
        if (partial.thresholdPct !== undefined) {
          slot.thresholdPct = clamp(Number(partial.thresholdPct), 0, 100);
        }
        if (partial.cooldownSec !== undefined) {
          slot.cooldownSec = clamp(Number(partial.cooldownSec), 0, 3600);
        }
        if (partial.bossOnly !== undefined) slot.bossOnly = Boolean(partial.bossOnly);
      });
    },

    markUsed: (slotKey, now = Date.now()) => {
      set((state) => {
        const slot = state.slots[slotKey];
        if (!slot) return;
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
      const nextSlots = { ...defaults } as Record<MedicinePouchSlotKey, MedicinePouchSlotState>;
      (Object.keys(defaults) as MedicinePouchSlotKey[]).forEach((slotKey) => {
        nextSlots[slotKey] = sanitizeSlot(slotKey, incomingSlots[slotKey] as MedicinePouchSlotState, defaults[slotKey]);
      });
      set(() => ({ slots: nextSlots }));
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
      set(() => ({ slots: createDefaultSlots() }));
    },
  })),
);

export const createDefaultMedicinePouchState = (): MedicinePouchState => ({
  slots: createDefaultSlots(),
});
