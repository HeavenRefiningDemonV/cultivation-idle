import { normalizeForgeBlueprint, isRuneBlueprint } from '../../content/forge';
import { useContentStore } from '../../stores/contentStore';
import { nextSeed, randFloat } from '../../utils/rng';
import type { CraftScript, CraftStep } from './craftingTypes';

function createRng(seed: number): () => number {
  let current = seed;
  return () => {
    const value = randFloat(current);
    current = nextSeed(current);
    return value;
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildHoldStep(id: string, label: string, durationMs: number): CraftStep {
  return { id, type: 'HOLD_HEAT', uiLabel: label, durationMs: Math.max(500, Math.floor(durationMs)) };
}

export function buildAlchemyScript(recipeId: string, seed: number): CraftScript {
  const recipes = useContentStore.getState().raw?.alchemy_recipes ?? [];
  const recipe = recipes.find((entry) => entry.id === recipeId);
  const roll = createRng(seed);
  const steps: CraftStep[] = [];

  const targetHeat = 250 + Math.round(roll() * 400);
  const tolerance = 8 + Math.round(roll() * 16);
  steps.push({ id: 'heat', type: 'HEAT_TO', uiLabel: 'Heat cauldron', targetHeat, tolerance });

  const inputs = Object.entries(recipe?.inputs ?? {})
    .map(([itemId, qty]) => ({ itemId, qty: Math.max(1, Math.floor(Number(qty))) }))
    .filter((entry) => entry.qty > 0)
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  const groupCap = Math.min(3, Math.max(1, inputs.length));
  const groupCount = inputs.length > 0 ? Math.max(1, Math.min(groupCap, 1 + Math.floor(roll() * groupCap))) : 0;
  const groupSize = groupCount > 0 ? Math.ceil(inputs.length / groupCount) : 0;
  const holdBase = (recipe?.timeSec ?? 30) * 1000;

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const start = groupIndex * groupSize;
    const end = start + groupSize;
    const groupEntries = inputs.slice(start, end);
    groupEntries.forEach((entry, idx) => {
      steps.push({
        id: `add_${groupIndex}_${idx}_${entry.itemId}`,
        type: 'ADD_INGREDIENT',
        uiLabel: `Add ${entry.itemId}`,
        itemId: entry.itemId,
        qty: entry.qty,
      });
    });
    if (groupIndex < groupCount - 1) {
      const durationMs = holdBase / (groupCount + 1) + roll() * 1500;
      steps.push(buildHoldStep(`hold_${groupIndex}`, 'Let the mixture settle', durationMs));
    }
  }

  if (groupCount === 0) {
    steps.push(buildHoldStep('stabilize', 'Stabilize mixture', 2000 + roll() * 2000));
  }

  const finalHold = clampNumber(holdBase * 0.2 + roll() * 1200, 750, 6000);
  steps.push(buildHoldStep('finish_hold', 'Finish simmer', finalHold));
  steps.push({ id: 'finish', type: 'FINISH', uiLabel: 'Bottle the batch' });

  return {
    version: 1,
    station: 'alchemy',
    sourceId: recipeId,
    steps,
    baselineTimeSec: recipe?.timeSec,
  };
}

export function buildForgeScript(blueprintId: string, seed: number): CraftScript {
  const blueprints = useContentStore.getState().raw?.forge_blueprints ?? [];
  const rawBlueprint = blueprints.find((entry) => entry.id === blueprintId);
  const blueprint = rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
  const roll = createRng(seed);
  const steps: CraftStep[] = [];

  const targetHeat = 450 + Math.round(roll() * 650);
  const tolerance = 10 + Math.round(roll() * 20);
  steps.push({ id: 'heat', type: 'HEAT_TO', uiLabel: 'Heat the billet', targetHeat, tolerance });

  const hammerHits = 3 + Math.floor(roll() * 4);
  const rhythmRoll = roll();
  const rhythm = rhythmRoll < 0.33 ? 'slow' : rhythmRoll < 0.67 ? 'steady' : 'fast';
  steps.push({ id: 'hammer', type: 'HAMMER', uiLabel: 'Hammer into shape', hits: hammerHits, rhythm });

  const quenchMedium = roll() < 0.5 ? 'water' : 'oil';
  steps.push({ id: 'quench', type: 'QUENCH', uiLabel: 'Quench', medium: quenchMedium });

  const temperHeat = clampNumber(targetHeat - 120 + Math.round(roll() * 120), 300, 900);
  const temperDuration = clampNumber(((blueprint?.timeSec ?? 45) * 500 + roll() * 1500), 1000, 12000);
  steps.push({ id: 'temper', type: 'TEMPER', uiLabel: 'Temper carefully', targetHeat: temperHeat, durationMs: temperDuration });

  const runeVariant = blueprint ? isRuneBlueprint(blueprint) : blueprintId.startsWith('rune_');
  if (runeVariant) {
    const extraRhythm = roll() < 0.5 ? 'steady' : 'fast';
    steps.push({
      id: 'inscribe',
      type: 'HAMMER',
      uiLabel: 'Inscribe rune strikes',
      hits: 2 + Math.floor(roll() * 3),
      rhythm: extraRhythm,
    });
  } else if (roll() > 0.6) {
    const extraDuration = clampNumber(((blueprint?.timeSec ?? 30) * 300 + roll() * 1000), 800, 8000);
    steps.push({
      id: 'temper_extra',
      type: 'TEMPER',
      uiLabel: 'Fine temper',
      targetHeat: clampNumber(temperHeat - 40 + Math.round(roll() * 60), 250, 800),
      durationMs: extraDuration,
    });
  }

  steps.push({ id: 'finish', type: 'FINISH', uiLabel: 'Finish forging' });

  return {
    version: 1,
    station: 'forge',
    sourceId: blueprintId,
    steps,
    baselineTimeSec: blueprint?.timeSec,
  };
}
