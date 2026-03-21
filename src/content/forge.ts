import type { ForgeHandsOnBonus, ForgeStepDef, PromptDef } from '../systems/crafting/craftingTypes.js';
import type { ForgeBlueprintsConfig } from './types.js';

import { createLiveEconomyCatalog } from '../systems/economy/liveEconomyCatalog.js';
import type { LiveEconomyContentSnapshot } from '../systems/economy/liveEconomyTypes.js';

export type ForgeBlueprintRaw = ForgeBlueprintsConfig['blueprints'][number];

export type NormalizedForgeBlueprint = {
  id: string;
  name?: string;
  cityId?: string;
  cityIndex?: number;
  type: 'craft' | 'service';
  service?: string;
  timeSec: number;
  costs: {
    gold: number;
    spiritStones: number;
    items: Array<{ itemId: string; qty: number }>;
  };
  output?: { itemId: string; qty: number };
  tags?: string[];
  assistedPrompts?: PromptDef[];
  stepScript?: ForgeStepDef[];
  handsOnBonus?: ForgeHandsOnBonus;
  effect?: Record<string, unknown>;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeItemEntries(value: unknown): Array<{ itemId: string; qty: number }> {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Record<string, unknown>;
        const itemId = typeof record.itemId === 'string' ? record.itemId : typeof record.id === 'string' ? record.id : '';
        const qty = Math.max(0, toNumber(record.qty ?? record.amount ?? record.count));
        if (!itemId || qty <= 0) return null;
        return { itemId, qty };
      })
      .filter((entry): entry is { itemId: string; qty: number } => Boolean(entry));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([itemId, qty]) => {
        const amount = Math.max(0, toNumber(qty));
        if (!itemId || amount <= 0) return null;
        return { itemId, qty: amount };
      })
      .filter((entry): entry is { itemId: string; qty: number } => Boolean(entry));
  }

  return [];
}

function normalizeOutput(value: unknown): { itemId: string; qty: number } | undefined {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    const items = normalizeItemEntries(value);
    return items[0];
  }

  if (typeof value === 'object') {
    const entries = normalizeItemEntries(value);
    return entries[0];
  }

  return undefined;
}

function sanitizeStepScript(raw: unknown): ForgeStepDef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      if (typeof record.id !== 'string' || typeof record.type !== 'string') return null;
      return record as ForgeStepDef;
    })
    .filter((entry): entry is ForgeStepDef => Boolean(entry));
}

function sanitizeHandsOnBonus(raw: unknown): ForgeHandsOnBonus | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const bonus: ForgeHandsOnBonus = {};
  if (typeof record.qualityProcChancePct === 'number') bonus.qualityProcChancePct = record.qualityProcChancePct;
  if (typeof record.masteryMult === 'number') bonus.masteryMult = record.masteryMult;
  if (typeof record.timeReductionPct === 'number') bonus.timeReductionPct = record.timeReductionPct;
  if (typeof record.temperProcChancePct === 'number') bonus.temperProcChancePct = record.temperProcChancePct;
  return Object.keys(bonus).length > 0 ? bonus : undefined;
}

function readCostField(raw: Record<string, unknown>, key: string): number {
  if (key in raw) return toNumber(raw[key]);
  const cost = raw.cost as Record<string, unknown> | undefined;
  if (cost && key in cost) return toNumber(cost[key]);
  const costs = raw.costs as Record<string, unknown> | undefined;
  if (costs && key in costs) return toNumber(costs[key]);
  return 0;
}

export function normalizeForgeBlueprint(rawBlueprint: ForgeBlueprintRaw | Record<string, unknown>): NormalizedForgeBlueprint {
  const raw = (rawBlueprint ?? {}) as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const name = typeof raw.name === 'string' ? raw.name : undefined;
  const cityId =
    typeof raw.cityId === 'string'
      ? raw.cityId
      : typeof raw.unlockCityId === 'string'
        ? raw.unlockCityId
        : typeof raw.unlocksAtCityId === 'string'
          ? raw.unlocksAtCityId
          : undefined;
  const cityIndex = typeof raw.cityIndex === 'number' ? raw.cityIndex : toNumber(raw.tier);
  const service =
    typeof raw.service === 'string'
      ? raw.service
      : typeof raw.serviceType === 'string'
        ? raw.serviceType
        : undefined;
  const timeSec = toNumber(raw.timeSec ?? raw.durationSec ?? raw.time ?? raw.seconds);

  const costItems = normalizeItemEntries(
    raw.inputs ?? raw.in ?? raw.ingredients ?? raw.costItems ?? (raw.cost as Record<string, unknown> | undefined)?.items,
  );
  const gold = Math.max(
    0,
    readCostField(raw, 'gold') ||
      readCostField(raw, 'gp') ||
      readCostField(raw, 'goldCost') ||
      readCostField(raw, 'costGold'),
  );
  const spiritStones = Math.max(
    0,
    readCostField(raw, 'spiritStones') || readCostField(raw, 'ss') || readCostField(raw, 'ssCost'),
  );

  const output = normalizeOutput(raw.outputs ?? raw.out ?? raw.output ?? raw.produces ?? raw.result);

  const assistedPrompts = Array.isArray((raw as any).assistedPrompts)
    ? ((raw as any).assistedPrompts as PromptDef[])
    : undefined;
  const stepScript = sanitizeStepScript((raw as any).stepScript);
  const handsOnBonus = sanitizeHandsOnBonus((raw as any).handsOnBonus);
  const effect = typeof raw.effect === 'object' && raw.effect ? (raw.effect as Record<string, unknown>) : undefined;

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : undefined;
  const type: 'craft' | 'service' = service || raw.effect ? 'service' : 'craft';

  return {
    id,
    name,
    cityId,
    cityIndex: Number.isFinite(cityIndex) ? cityIndex : undefined,
    type,
    service,
    timeSec: Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0,
    costs: {
      gold: Number.isFinite(gold) ? gold : 0,
      spiritStones: Number.isFinite(spiritStones) ? spiritStones : 0,
      items: costItems,
    },
    output,
    tags,
    assistedPrompts,
    stepScript,
    handsOnBonus,
    effect,
  };
}

export function isRuneBlueprint(blueprint: NormalizedForgeBlueprint): boolean {
  return blueprint.type === 'craft' && Boolean(blueprint.output?.itemId?.startsWith('rune_'));
}

export function isRefineBlueprint(blueprint: NormalizedForgeBlueprint): boolean {
  return blueprint.type === 'service' && blueprint.service === 'refine';
}

export function isTemperBlueprint(blueprint: NormalizedForgeBlueprint): boolean {
  return blueprint.type === 'service' && blueprint.service === 'temper';
}


export function listNormalizedForgeBlueprints(rawBlueprints: readonly ForgeBlueprintRaw[]): NormalizedForgeBlueprint[] {
  return rawBlueprints.map((blueprint) => normalizeForgeBlueprint(blueprint));
}

export function listVisibleNormalizedForgeBlueprints(content: LiveEconomyContentSnapshot): NormalizedForgeBlueprint[] {
  const catalog = createLiveEconomyCatalog(content);
  return content.forge_blueprints
    .filter((blueprint) => {
      const status = catalog.forgeBlueprintStatuses[blueprint.id];
      return status === 'visible_live' || status === 'visible_live_blocked';
    })
    .map((blueprint) => normalizeForgeBlueprint(blueprint));
}

export function getNormalizedForgeBlueprintById(rawBlueprints: readonly ForgeBlueprintRaw[], blueprintId: string): NormalizedForgeBlueprint | undefined {
  const rawBlueprint = rawBlueprints.find((blueprint) => String(blueprint.id) === blueprintId);
  return rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
}
