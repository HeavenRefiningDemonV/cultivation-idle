import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { normalizeForgeBlueprint } from '../content/forge';
import { RewardService } from '../services/rewards';
import type {
  CraftMode,
  CraftPromptState,
  CraftPromptStatus,
  CraftScript,
  CraftSession,
  CraftSessionPayment,
  CraftSessionSaveState,
  CraftStation,
  PromptDef,
} from '../systems/crafting/craftingTypes';
import {
  advancePromptStates,
  applyYieldBonuses,
  completePrompt as completeAssistedPrompt,
  instantiatePrompts,
} from '../systems/crafting/assistedPrompts';
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
  updateActiveSessionPrompts: (now?: number) => CraftPromptState[];
  completePrompt: (promptId: string, now?: number) => { ok: boolean; reason?: string };
  claimActiveSession: (
    now?: number,
  ) =>
    | { ok: true; bonus?: { completed: number; total: number; bonusItems: Array<{ itemId: string; qty: number }> } }
    | { ok: false; reason: string };
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

const sanitizePromptStatus = (value: unknown): CraftPromptStatus | null => {
  if (value === 'PENDING' || value === 'AVAILABLE' || value === 'COMPLETED' || value === 'MISSED') {
    return value;
  }
  return null;
};

const calculateAlchemyDurationMs = (timeSec: number | undefined, qty: number): number => {
  const duration = typeof timeSec === 'number' && Number.isFinite(timeSec) ? timeSec : 0;
  return Math.max(0, Math.floor(duration * qty * 1000));
};

const calculateForgeDurationMs = (timeSec: number | undefined, qty: number): number => {
  const duration = typeof timeSec === 'number' && Number.isFinite(timeSec) ? timeSec : 0;
  return Math.max(0, Math.floor(duration * qty * 1000));
};

const sanitizePromptState = (raw: unknown): CraftPromptState | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.type !== 'string') return null;
  if (typeof record.dueAtMs !== 'number' || typeof record.expiresAtMs !== 'number') return null;
  const status = sanitizePromptStatus(record.status);
  if (!status) return null;
  const completedAtMs =
    record.completedAtMs === null || typeof record.completedAtMs === 'number' ? (record.completedAtMs as number | null) : null;
  const bonus = record.bonus && typeof record.bonus === 'object' ? record.bonus : undefined;
  const ui = record.ui && typeof record.ui === 'object' ? record.ui : undefined;
  return {
    id: record.id,
    type: record.type as CraftPromptState['type'],
    dueAtMs: record.dueAtMs,
    expiresAtMs: record.expiresAtMs,
    status,
    completedAtMs,
    bonus,
    ui,
  };
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
  const startedAt = typeof record.startedAt === 'number' ? record.startedAt : record.createdAt;
  const endsAt = typeof record.endsAt === 'number' ? record.endsAt : startedAt;
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

  const prompts = Array.isArray((record as any).prompts)
    ? ((record as any).prompts as unknown[])
        .map((prompt) => sanitizePromptState(prompt))
        .filter((prompt): prompt is CraftPromptState => Boolean(prompt))
    : [];

  return {
    sessionId: record.sessionId,
    station: record.station,
    mode: record.mode,
    sourceId: record.sourceId,
    qty: Math.min(Math.max(1, Math.floor(record.qty)), 999),
    createdAt: record.createdAt,
    seed: record.seed,
    startedAt,
    endsAt,
    script: cloneScript(script),
    cursor,
    payment,
    prompts,
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
      let startedAt = createdAt;
      let endsAt = createdAt;
      let prompts: CraftPromptState[] = [];

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
        const durationMs = calculateAlchemyDurationMs(recipe.timeSec ?? (recipe as { craftTimeSec?: number }).craftTimeSec, qty);
        startedAt = createdAt;
        endsAt = startedAt + durationMs;
        const promptDefs = Array.isArray((recipe as any).assistedPrompts)
          ? ((recipe as any).assistedPrompts as PromptDef[])
          : [];
        if (args.mode === 'assisted') {
          prompts = instantiatePrompts(promptDefs, startedAt, endsAt, seed);
        }
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
        const durationMs = calculateForgeDurationMs(blueprint.timeSec, qty);
        startedAt = createdAt;
        endsAt = startedAt + durationMs;
        const promptDefs = Array.isArray((rawBlueprint as any)?.assistedPrompts)
          ? ((rawBlueprint as any).assistedPrompts as PromptDef[])
          : [];
        if (args.mode === 'assisted') {
          prompts = instantiatePrompts(promptDefs, startedAt, endsAt, seed);
        }
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
        startedAt,
        endsAt,
        script,
        cursor: { stepIndex: 0 },
        payment: {
          currencies: payment.currencies,
          items: itemCosts,
        },
        prompts,
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

    updateActiveSessionPrompts: (now = Date.now()) => {
      const active = get().activeSession;
      if (!active || !active.prompts || active.prompts.length === 0) {
        return active?.prompts ?? [];
      }
      const nextPrompts = advancePromptStates(active.prompts, now);
      set((state) => {
        if (state.activeSession) {
          state.activeSession.prompts = nextPrompts;
        }
      });
      return nextPrompts;
    },

    completePrompt: (promptId, now = Date.now()) => {
      const active = get().activeSession;
      if (!active) return { ok: false, reason: 'no_session' };
      if (active.mode !== 'assisted') return { ok: false, reason: 'wrong_mode' };

      const result = completeAssistedPrompt(active.prompts ?? [], promptId, now);
      set((state) => {
        if (state.activeSession) {
          state.activeSession.prompts = result.prompts;
        }
      });

      if (!result.ok) {
        return { ok: false, reason: result.reason };
      }
      return { ok: true };
    },

    claimActiveSession: (now = Date.now()) => {
      const active = get().activeSession;
      if (!active) return { ok: false, reason: 'no_session' };
      if (now < active.endsAt) return { ok: false, reason: 'not_ready' };

      const settledPrompts = advancePromptStates(active.prompts ?? [], now);

      if (active.station === 'alchemy') {
        const recipe = useContentStore.getState().raw?.alchemy_recipes?.find((entry) => entry.id === active.sourceId);
        if (!recipe) return { ok: false, reason: 'missing_recipe' };
        const outputs = recipe.outputs ?? {};
        const baseItems = Object.entries(outputs)
          .map(([itemId, baseQty]) => {
            const perJob = Math.floor(Number(baseQty));
            if (!Number.isFinite(perJob) || perJob <= 0) return null;
            return { itemId, qty: perJob * active.qty };
          })
          .filter((entry): entry is { itemId: string; qty: number } => Boolean(entry));

        const bonusResult = applyYieldBonuses(baseItems, settledPrompts);

        if (bonusResult.items.length > 0) {
          RewardService.grantRewards({ items: bonusResult.items }, `Alchemy Session: ${active.sourceId}`);
        }

        set((state) => {
          if (state.activeSession) {
            state.activeSession.prompts = settledPrompts;
          }
          state.activeSession = null;
        });

        return {
          ok: true,
          bonus: { completed: bonusResult.completed, total: bonusResult.total, bonusItems: bonusResult.bonusItems },
        };
      }

      if (active.station === 'forge') {
        const rawBlueprint = useContentStore.getState().raw?.forge_blueprints?.find((entry) => entry.id === active.sourceId);
        const blueprint = rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
        if (!blueprint || blueprint.type !== 'craft' || !blueprint.output) {
          return { ok: false, reason: 'missing_blueprint' };
        }

        const baseItems = [{ itemId: blueprint.output.itemId, qty: blueprint.output.qty * active.qty }];
        const bonusResult = applyYieldBonuses(baseItems, settledPrompts);

        if (bonusResult.items.length > 0) {
          RewardService.grantRewards({ items: bonusResult.items }, `Forge Session: ${active.sourceId}`);
        }

        set((state) => {
          if (state.activeSession) {
            state.activeSession.prompts = settledPrompts;
          }
          state.activeSession = null;
        });

        return {
          ok: true,
          bonus: { completed: bonusResult.completed, total: bonusResult.total, bonusItems: bonusResult.bonusItems },
        };
      }

      return { ok: false, reason: 'unsupported_station' };
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
      let activeSession = sanitizeActiveSession(slice?.activeSession);
      if (activeSession && activeSession.mode === 'assisted') {
        if (activeSession.station === 'alchemy') {
          const recipe = useContentStore.getState().raw?.alchemy_recipes?.find((entry) => entry.id === activeSession?.sourceId);
          const promptDefs = Array.isArray((recipe as any)?.assistedPrompts)
            ? ((recipe as any).assistedPrompts as PromptDef[])
            : [];
          const durationMs = calculateAlchemyDurationMs(
            recipe?.timeSec ?? (recipe as { craftTimeSec?: number })?.craftTimeSec,
            activeSession.qty,
          );
          const endsAt = activeSession.endsAt || activeSession.startedAt + durationMs;
          const prompts =
            activeSession.prompts && activeSession.prompts.length > 0
              ? activeSession.prompts
              : instantiatePrompts(promptDefs, activeSession.startedAt, endsAt, activeSession.seed);
          activeSession = { ...activeSession, endsAt, prompts };
        } else if (activeSession.station === 'forge') {
          const rawBlueprint = useContentStore.getState().raw?.forge_blueprints?.find((entry) => entry.id === activeSession.sourceId);
          const blueprint = rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : null;
          const promptDefs = Array.isArray((rawBlueprint as any)?.assistedPrompts)
            ? ((rawBlueprint as any).assistedPrompts as PromptDef[])
            : [];
          const durationMs = calculateForgeDurationMs(blueprint?.timeSec, activeSession.qty);
          const endsAt = activeSession.endsAt || activeSession.startedAt + durationMs;
          const prompts =
            activeSession.prompts && activeSession.prompts.length > 0
              ? activeSession.prompts
              : instantiatePrompts(promptDefs, activeSession.startedAt, endsAt, activeSession.seed);
          activeSession = { ...activeSession, endsAt, prompts };
        }
      }
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
              prompts: activeSession.prompts?.map((prompt) => ({ ...prompt })),
            }
          : null,
      };
    },

    hardReset: () => {
      set(() => ({ ...createDefaultCraftSessionState() }));
    },
  })),
);
