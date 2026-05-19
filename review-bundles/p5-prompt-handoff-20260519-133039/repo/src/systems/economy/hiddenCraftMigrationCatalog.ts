import type { CurrencyKey, ForgeBlueprintsConfig, TalismanRecipesConfig } from '../../content/types.js';
import type { AlchemyRecipesConfig } from '../../content/types.js';
import { getAlchemyRecipeRuntimeStatus, getItemRuntimeStatus } from './liveEconomyVisibility.js';
import { getLiveForgeRuntimeStatus } from '../forge/index.js';

export type HiddenCraftStation = 'alchemy' | 'forge' | 'talisman';

export interface HiddenCraftRefundDefinition {
  sourceId: string;
  station: HiddenCraftStation;
  output?: { itemId: string; qty: number };
  inputs: Array<{ itemId: string; qty: number }>;
  costs: Partial<Record<CurrencyKey, number>>;
}

const HIDDEN_ALCHEMY_RECIPES: AlchemyRecipesConfig['recipes'] = [
  {
    id: 'alc_reagent_soul_ink_t1',
    unlocksAtCityId: 'city_spirit_cavern_city',
    station: 'alchemy',
    timeSec: 90,
    inputs: { mat_aura_residue: 2, mat_spirit_leaf: 1 },
    outputs: { reagent_soul_ink_t1: 1 },
  },
  {
    id: 'alc_reagent_spirit_solvent_t1',
    unlocksAtCityId: 'city_spirit_cavern_city',
    station: 'alchemy',
    timeSec: 90,
    inputs: { mat_crystal_shard: 2, mat_aura_residue: 1 },
    outputs: { reagent_spirit_solvent_t1: 1 },
  },
  {
    id: 'alc_tribulation_buffer_t1',
    unlocksAtCityId: 'city_ironpeak_bastion',
    station: 'alchemy',
    timeSec: 180,
    inputs: { mat_artifact_shard: 3, mat_soul_ember: 2 },
    outputs: { cons_tribulation_buffer_t1: 1 },
  },
];

const HIDDEN_FORGE_BLUEPRINTS: ForgeBlueprintsConfig['blueprints'] = [
  {
    id: 'rune_inscription_basic',
    unlocksAtCityId: 'city_pinewind_hamlet',
    station: 'forge',
    timeSec: 120,
    inputs: { mat_rune_dust: 6, mat_spirit_leaf: 2 },
    outputs: { rune_ember_t1: 1 },
    cost: { gold: 1000 },
  },
  {
    id: 'rune_inscription_advanced',
    unlocksAtCityId: 'city_stonecrag_town',
    station: 'forge',
    timeSec: 180,
    inputs: { mat_rune_dust: 12, mat_earth_essence: 2 },
    outputs: { rune_fortify_t1: 1 },
    cost: { gold: 15000 },
  },
  {
    id: 'formation_plate_basic',
    unlocksAtCityId: 'city_pinewind_hamlet',
    station: 'forge',
    timeSec: 120,
    inputs: { mat_quarry_ore: 4, mat_spirit_dew: 2 },
    outputs: { tal_guardian_seal_t1: 1 },
    cost: { gold: 900 },
  },
  {
    id: 'forge_jade_core_shell_t1',
    unlocksAtCityId: 'city_spirit_cavern_city',
    station: 'forge',
    timeSec: 600,
    inputs: { mat_artifact_shard: 25, mat_rune_dust: 30, reagent_spirit_solvent_t1: 1 },
    outputs: { item_jade_core_shell_t1: 1 },
    cost: { gold: 150000, spiritStones: 15 },
  },
  {
    id: 'forge_jade_core_upgrade_t2',
    unlocksAtCityId: 'city_lotusford',
    station: 'forge',
    timeSec: 900,
    inputs: { mat_artifact_shard: 60, mat_rune_dust: 80, reagent_spirit_solvent_t1: 2 },
    cost: { gold: 600000, spiritStones: 60 },
  },
  {
    id: 'forge_jade_core_upgrade_t3',
    unlocksAtCityId: 'city_ironpeak_bastion',
    station: 'forge',
    timeSec: 1200,
    inputs: { mat_artifact_shard: 140, mat_rune_dust: 160, reagent_spirit_solvent_t2: 2 },
    cost: { gold: 3000000, spiritStones: 200 },
  },
];

const HIDDEN_TALISMAN_RECIPES: TalismanRecipesConfig['talismans'] = [
  {
    id: 'tal_greed_sigil_t1',
    unlocksAtCityId: 'city_pinewind_hamlet',
    station: 'talismanStudio',
    timeSec: 120,
    inputs: { mat_spirit_leaf: 3, mat_rune_dust: 2 },
    outputs: { tal_greed_sigil_t1: 1 },
    cost: { gold: 2000 },
  },
  {
    id: 'tal_scholar_mark_t1',
    unlocksAtCityId: 'city_pinewind_hamlet',
    station: 'talismanStudio',
    timeSec: 120,
    inputs: { mat_spirit_leaf: 3, reagent_soul_ink_t0: 1 },
    outputs: { tal_scholar_mark_t1: 1 },
    cost: { gold: 2000 },
  },
  {
    id: 'tal_guardian_seal_t1',
    unlocksAtCityId: 'city_stonecrag_town',
    station: 'talismanStudio',
    timeSec: 180,
    inputs: { reagent_soul_ink_t0: 2, mat_rune_dust: 10 },
    outputs: { tal_guardian_seal_t1: 1 },
    cost: { gold: 60000 },
  },
  {
    id: 'tal_boss_hunter_mark_t1',
    unlocksAtCityId: 'city_spirit_cavern_city',
    station: 'talismanStudio',
    timeSec: 240,
    inputs: { reagent_soul_ink_t1: 2, mat_rune_dust: 20 },
    outputs: { tal_boss_hunter_mark_t1: 1 },
    cost: { gold: 120000 },
  },
  {
    id: 'tal_soul_anchor_t1',
    unlocksAtCityId: 'city_lotusford',
    station: 'talismanStudio',
    timeSec: 300,
    inputs: { reagent_soul_ink_t2: 2, mat_rune_dust: 40 },
    outputs: { tal_soul_anchor_t1: 1 },
    cost: { gold: 500000 },
  },
  {
    id: 'tal_guardian_seal_t2',
    unlocksAtCityId: 'city_ironpeak_bastion',
    station: 'talismanStudio',
    timeSec: 360,
    inputs: { reagent_soul_ink_t2: 3, mat_rune_dust: 80 },
    outputs: { tal_guardian_seal_t2: 1 },
    cost: { gold: 2500000 },
  },
  {
    id: 'tal_fragment_magnet_t1',
    unlocksAtCityId: 'city_ironpeak_bastion',
    station: 'talismanStudio',
    timeSec: 360,
    inputs: { reagent_soul_ink_t2: 2, mat_rune_dust: 60 },
    outputs: { tal_fragment_magnet_t1: 1 },
    cost: { gold: 2000000 },
  },
];

function normalizeInputs(inputs: Record<string, number> | undefined): Array<{ itemId: string; qty: number }> {
  return Object.entries(inputs ?? {})
    .map(([itemId, qty]) => ({ itemId, qty: Math.max(0, Math.floor(qty)) }))
    .filter((entry) => entry.qty > 0);
}

function normalizeCosts(cost: Record<string, number> | undefined): Partial<Record<CurrencyKey, number>> {
  const result: Partial<Record<CurrencyKey, number>> = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const value = cost?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      result[key] = value;
    }
  });
  return result;
}

function normalizeOutput(outputs: Record<string, number> | undefined): HiddenCraftRefundDefinition['output'] {
  const [itemId, qty] = Object.entries(outputs ?? {})[0] ?? [];
  if (!itemId || typeof qty !== 'number' || !Number.isFinite(qty) || qty <= 0) return undefined;
  return { itemId, qty: Math.max(1, Math.floor(qty)) };
}

export function listHiddenCraftRefundDefinitions(): HiddenCraftRefundDefinition[] {
  const definitions: HiddenCraftRefundDefinition[] = [];

  HIDDEN_ALCHEMY_RECIPES.forEach((recipe) => {
    const status = getAlchemyRecipeRuntimeStatus(recipe);
    if (status === 'visible_live') return;
    definitions.push({
      sourceId: recipe.id,
      station: 'alchemy',
      output: normalizeOutput(recipe.outputs),
      inputs: normalizeInputs(recipe.inputs),
      costs: {},
    });
  });

  HIDDEN_FORGE_BLUEPRINTS.forEach((blueprint) => {
    const status = getLiveForgeRuntimeStatus(blueprint);
    if (status === 'visible_live') return;
    definitions.push({
      sourceId: blueprint.id,
      station: 'forge',
      output: normalizeOutput(blueprint.outputs),
      inputs: normalizeInputs(blueprint.inputs),
      costs: normalizeCosts(blueprint.cost),
    });
  });

  HIDDEN_TALISMAN_RECIPES.forEach((recipe) => {
    const output = normalizeOutput(recipe.outputs);
    if (!output) return;
    const itemStatus = getItemRuntimeStatus({ id: output.itemId, category: 'talisman' });
    if (itemStatus === 'visible_live') return;
    definitions.push({
      sourceId: recipe.id,
      station: 'talisman',
      output,
      inputs: normalizeInputs(recipe.inputs),
      costs: normalizeCosts(recipe.cost),
    });
  });

  return definitions;
}

export function getHiddenCraftRefundDefinitionBySourceId(sourceId: string): HiddenCraftRefundDefinition | undefined {
  return listHiddenCraftRefundDefinitions().find((entry) => entry.sourceId === sourceId);
}

export function getHiddenCraftRefundDefinitionByOutputItemId(itemId: string): HiddenCraftRefundDefinition | undefined {
  const matches = listHiddenCraftRefundDefinitions().filter((entry) => entry.output?.itemId === itemId);
  return matches.sort((a, b) => {
    const aExact = a.sourceId === itemId ? -2 : 0;
    const bExact = b.sourceId === itemId ? -2 : 0;
    const aForgePenalty = a.station === 'forge' ? 1 : 0;
    const bForgePenalty = b.station === 'forge' ? 1 : 0;
    return aExact + aForgePenalty - (bExact + bForgePenalty);
  })[0];
}

export function listHiddenCraftOutputItemIds(): string[] {
  return listHiddenCraftRefundDefinitions()
    .map((entry) => entry.output?.itemId)
    .filter((itemId): itemId is string => Boolean(itemId))
    .filter((itemId) => {
      const status = getItemRuntimeStatus({ id: itemId, category: itemId.startsWith('tal_') ? 'talisman' : itemId.startsWith('cons_') ? 'consumable' : itemId.startsWith('reagent_') ? 'reagent' : itemId.startsWith('item_') ? 'token' : 'material' as never });
      return status !== 'visible_live';
    });
}
