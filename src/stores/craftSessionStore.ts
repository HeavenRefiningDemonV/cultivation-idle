import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { normalizeForgeBlueprint } from '../content/forge';
import type {
  CraftMode,
  CraftScript,
  CraftSession,
  CraftSessionPayment,
  CraftSessionSaveState,
  CraftStation,
} from '../systems/crafting/craftingTypes';
import { buildAlchemyScript, buildForgeScript } from '../systems/crafting/craftScripts';
import { useContentStore } from './contentStore';
import { useInventoryStore } from './inventoryStore';
import { multiply } from '../utils/numbers';

interface StartSessionArgs {
  station: CraftStation;
  mode: 'assisted' | 'handsOn';
  sourceId: string;
  qty: number;
  now?: number;
}

interface CraftSessionStoreState extends CraftSessionSaveState {
  setMode: (station: CraftStation, mode: CraftMode) => void;
  startSession: (args: StartSessionArgs) => { ok: true; sessionId: string } | { ok: false; reason: string };
  abortSession: (now?: number) => { ok: boolean; reason?: string };
  hydrate: (slice?: Partial<CraftSessionSaveState>) => void;
  toSaveState: () => CraftSessionSaveState;
  hardReset: () => void;
}

const defaultModes: Record<CraftStation, CraftMode> = {
  alchemy: 'idle',
  forge: 'idle',
  talisman: 'idle',
};

const clampQty = (value: number): number => {
  const qty = Math.floor(value);
  if (!Number.isFinite(qty) || qty <= 0) return 1;
  return Math.min(qty, 999);
};

const isCraftMode = (value: unknown): value is CraftMode =>
  value === 'idle' || value === 'assisted' || value === 'handsOn';

const isSupportedMode = (value: unknown): value is 'assisted' | 'handsOn' => value === 'assisted' || value === 'handsOn';

const hashSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

const cloneScript = (script: CraftScript): CraftScript => ({
  ...script,
  steps: script.steps.map((step) => ({ ...step })),
});

const buildCurrencyCosts = (
  rawCosts: Partial<Record<'gold' | 'spiritStones' | 'merit', number | string>> | undefined,
  qty: number,
): Partial<Record<'gold' | 'spiritStones' | 'merit', string>> => {
  const totals: Partial<Record<'gold' | 'spiritStones' | 'merit', string>> = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const raw = rawCosts?.[key];
    if (raw === undefined || raw === null) return;
    const base = Number(raw);
    if (!Number.isFinite(base) || base <= 0) return;
    totals[key] = multiply(base.toString(), qty).toString();
  });
  return totals;
};

const buildItemCosts = (items: Array<{ itemId: string; qty: number }> | undefined, qty: number) =>
  (items ?? [])
    .map((entry) => ({ ...entry, qty: Math.max(0, Math.floor(entry.qty * qty)) }))
    .filter((entry) => entry.itemId && entry.qty > 0);

const sanitizePayment = (payment: CraftSessionPayment | undefined): CraftSessionPayment => {
  const sanitized: CraftSessionPayment = {};
  if (payment?.currencies) {
    sanitized.currencies = {};
    (Object.keys(payment.currencies) as Array<keyof CraftSessionPayment['currencies']>).forEach((key) => {
      const raw = payment.currencies?.[key];
      if (typeof raw === 'string') {
        sanitized.currencies![key] = raw;
      }
    });
  }
  if (payment?.items) {
    sanitized.items = payment.items
      .filter((entry) => typeof entry.itemId === 'string' && typeof entry.qty === 'number' && entry.qty > 0)
      .map((entry) => ({ itemId: entry.itemId, qty: Math.floor(entry.qty) }));
  }
  return sanitized;
};

const isValidCraftStation = (value: unknown): value is CraftStation =>
  value === 'alchemy' || value === 'forge' || value === 'talisman';

const sanitizeActiveSession = (raw: unknown): CraftSession | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.sessionId !== 'string') return null;
  if (!isValidCraftStation(record.station)) return null;
  if (!isSupportedMode(record.mode)) return null;
  if (typeof record.sourceId !== 'string') return null;
  if (typeof record.qty !== 'number' || !Number.isFinite(record.qty)) return null;
  if (typeof record.createdAt !== 'number' || typeof record.seed !== 'number') return null;
  if (!record.script || typeof record.script !== 'object') return null;
  const script = record.script as CraftScript;
  if (!Array.isArray(script.steps)) return null;
  if (!script.steps.every((step) => step && typeof step.id === 'string' && typeof (step as any).type === 'string')) return null;

  const payment = sanitizePayment(record.payment as CraftSessionPayment);
  const cursor =
    typeof record.cursor === 'object' &&
    record.cursor !== null &&
    typeof (record.cursor as any).stepIndex === 'number'
      ? { stepIndex: (record.cursor as any).stepIndex as number }
      : { stepIndex: 0 };

  return {
    sessionId: record.sessionId,
    station: record.station,
    mode: record.mode,
    sourceId: record.sourceId,
    qty: Math.min(Math.max(1, Math.floor(record.qty)), 999),
    createdAt: record.createdAt,
    seed: record.seed,
    script: cloneScript(script),
    cursor,
    payment,
  };
};

export const createDefaultCraftSessionState = (): CraftSessionSaveState => ({
  modeByStation: { ...defaultModes },
  activeSession: null,
});

export const useCraftSessionStore = create<CraftSessionStoreState>()(
  immer((set, get) => ({
    ...createDefaultCraftSessionState(),

    setMode: (station, mode) => {
      if (!isCraftMode(mode) || !isValidCraftStation(station)) return;
      set((state) => {
        state.modeByStation[station] = mode;
      });
    },

    startSession: (args) => {
      if (get().activeSession) return { ok: false, reason: 'active_session' };
      if (!isSupportedMode(args.mode)) return { ok: false, reason: 'invalid_mode' };
      if (!isValidCraftStation(args.station)) return { ok: false, reason: 'invalid_station' };

      const qty = clampQty(args.qty);
      const createdAt = args.now ?? Date.now();
      const seed = hashSeed(`${args.station}:${args.sourceId}:${createdAt}`);
      const inventory = useInventoryStore.getState();
      const content = useContentStore.getState();

      let script: CraftScript;
      const payment: CraftSessionPayment = {};
      let itemCosts: Array<{ itemId: string; qty: number }> = [];

      if (args.station === 'alchemy') {
        const recipe = content.raw?.alchemy_recipes?.find((entry) => entry.id === args.sourceId);
        if (!recipe) return { ok: false, reason: 'missing_recipe' };
        const inputs = Object.entries(recipe.inputs ?? {}).map(([itemId, baseQty]) => ({
          itemId,
          qty: Math.max(0, Math.floor(Number(baseQty) * qty)),
        }));
        itemCosts = inputs.filter((entry) => entry.itemId && entry.qty > 0);
        const currencies = buildCurrencyCosts((recipe as any).costs, qty);
        if (Object.keys(currencies).length > 0) {
          payment.currencies = currencies;
        }
        script = buildAlchemyScript(args.sourceId, seed);
      } else if (args.station === 'forge') {
        const rawBlueprint = content.raw?.forge_blueprints?.find((entry) => entry.id === args.sourceId);
        const blueprint = rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
        if (!blueprint) return { ok: false, reason: 'missing_blueprint' };
        if (blueprint.type !== 'craft') return { ok: false, reason: 'invalid_blueprint' };
        itemCosts = buildItemCosts(blueprint.costs.items, qty);
        const currencies = buildCurrencyCosts(
          { gold: blueprint.costs.gold, spiritStones: blueprint.costs.spiritStones },
          qty,
        );
        if (Object.keys(currencies).length > 0) {
          payment.currencies = currencies;
        }
        script = buildForgeScript(args.sourceId, seed);
      } else {
        return { ok: false, reason: 'unsupported_station' };
      }

      if (payment.currencies && !inventory.canAffordCurrency(payment.currencies)) {
        return { ok: false, reason: 'insufficient_currency' };
      }
      for (const cost of itemCosts) {
        if (!inventory.canAffordItem(cost.itemId, cost.qty)) {
          return { ok: false, reason: 'insufficient_items' };
        }
      }

      const spentCurrencies: Partial<Record<'gold' | 'spiritStones' | 'merit', string>> = {};
      if (payment.currencies) {
        const success = inventory.spendCurrencies(payment.currencies);
        if (!success) return { ok: false, reason: 'spend_failed' };
        Object.assign(spentCurrencies, payment.currencies);
      }

      const spentItems: Array<{ itemId: string; qty: number }> = [];
      for (const cost of itemCosts) {
        const success = inventory.spendItem(cost.itemId, cost.qty);
        if (!success) {
          if (Object.keys(spentCurrencies).length > 0) {
            (Object.keys(spentCurrencies) as Array<keyof typeof spentCurrencies>).forEach((key) => {
              const amount = spentCurrencies[key];
              if (amount !== undefined) {
                inventory.addCurrency(key, amount);
              }
            });
          }
          spentItems.forEach((entry) => inventory.addItem(entry.itemId, entry.qty));
          return { ok: false, reason: 'spend_failed' };
        }
        spentItems.push(cost);
      }

      const session: CraftSession = {
        sessionId: `craft:${args.station}:${args.sourceId}:${createdAt}`,
        station: args.station,
        mode: args.mode,
        sourceId: args.sourceId,
        qty,
        createdAt,
        seed,
        script,
        cursor: { stepIndex: 0 },
        payment: {
          currencies: payment.currencies,
          items: itemCosts,
        },
      };

      set((state) => {
        state.modeByStation[args.station] = args.mode;
        state.activeSession = session;
      });

      return { ok: true, sessionId: session.sessionId };
    },

    abortSession: () => {
      const active = get().activeSession;
      if (!active) return { ok: false, reason: 'no_session' };
      const inventory = useInventoryStore.getState();
      const payment = sanitizePayment(active.payment);

      if (payment.currencies) {
        (Object.keys(payment.currencies) as Array<keyof typeof payment.currencies>).forEach((key) => {
          const amount = payment.currencies?.[key];
          if (amount !== undefined) {
            inventory.addCurrency(key, amount);
          }
        });
      }

      if (payment.items) {
        payment.items.forEach((entry) => inventory.addItem(entry.itemId, entry.qty));
      }

      set((state) => {
        state.activeSession = null;
      });

      return { ok: true };
    },

    hydrate: (slice) => {
      const defaults = createDefaultCraftSessionState();
      const nextModes: CraftSessionSaveState['modeByStation'] = { ...defaults.modeByStation };
      if (slice?.modeByStation && typeof slice.modeByStation === 'object') {
        (Object.keys(slice.modeByStation) as CraftStation[]).forEach((station) => {
          const mode = slice.modeByStation?.[station];
          if (isCraftMode(mode)) {
            nextModes[station] = mode;
          }
        });
      }
      const activeSession = sanitizeActiveSession(slice?.activeSession);
      set(() => ({ modeByStation: nextModes, activeSession }));
    },

    toSaveState: () => {
      const { modeByStation, activeSession } = get();
      return {
        modeByStation: { ...modeByStation },
        activeSession: activeSession
          ? {
              ...activeSession,
              cursor: { ...activeSession.cursor },
              payment: sanitizePayment(activeSession.payment),
              script: cloneScript(activeSession.script),
            }
          : null,
      };
    },

    hardReset: () => {
      set(() => ({ ...createDefaultCraftSessionState() }));
    },
  })),
);
