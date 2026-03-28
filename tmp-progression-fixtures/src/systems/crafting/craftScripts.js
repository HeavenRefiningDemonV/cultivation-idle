import { normalizeForgeBlueprint } from '../../content/forge.js';
import { resolveForgeStepScript } from '../../features/professions/forge/forgeScriptBuilder.js';
import { useContentStore } from '../../stores/contentStore.js';
import { randFloat } from '../../utils/rng.js';
function createRng(seed) {
    let current = seed;
    return () => {
        const roll = randFloat(current);
        current = roll.seed;
        return roll.value;
    };
}
function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function toCraftStepFromForgeDef(def) {
    switch (def.type) {
        case 'HEAT_MATERIAL':
            return {
                id: def.id,
                type: 'HEAT_MATERIAL',
                uiLabel: def.uiLabel ?? 'Heat material',
                targetMin: def.targetMin,
                targetMax: def.targetMax,
                holdMs: Math.max(500, Math.floor(def.holdMs)),
                jitter: def.jitter,
            };
        case 'ALLOY_MIX':
            return {
                id: def.id,
                type: 'ALLOY_MIX',
                uiLabel: def.uiLabel ?? 'Mix alloys',
                options: def.options ?? [],
            };
        case 'CAST_OR_SHAPE':
            return {
                id: def.id,
                type: 'CAST_OR_SHAPE',
                uiLabel: def.uiLabel ?? 'Cast or shape',
                variant: def.variant,
                difficulty: def.difficulty,
            };
        case 'HAMMER_PATTERN':
            return {
                id: def.id,
                type: 'HAMMER_PATTERN',
                uiLabel: def.uiLabel ?? 'Hammer pattern',
                hits: Math.max(1, Math.floor(def.hits)),
                shrinkMs: Math.max(200, Math.floor(def.shrinkMs)),
                tolerance: Math.max(0.01, Math.min(1, def.tolerance)),
                difficulty: def.difficulty,
                patternId: def.patternId,
            };
        case 'QUENCH':
            return {
                id: def.id,
                type: 'QUENCH',
                uiLabel: def.uiLabel ?? 'Quench',
                medium: def.medium ?? def.mediumOptions?.[0] ?? 'water',
                mediumOptions: def.mediumOptions,
                timingWindow: def.timingWindow,
            };
        case 'TEMPER':
            return {
                id: def.id,
                type: 'TEMPER',
                uiLabel: def.uiLabel ?? 'Temper',
                targetHeat: def.targetHeat ?? Math.round(((def.targetMin ?? def.targetMax ?? 0) + (def.targetMax ?? def.targetMin ?? 0)) / 2),
                targetMin: def.targetMin,
                targetMax: def.targetMax,
                durationMs: def.durationMs ?? Math.max(800, Math.floor(def.holdMs ?? 0)),
                holdMs: def.holdMs,
            };
        case 'ENGRAVE_RUNE':
            return {
                id: def.id,
                type: 'ENGRAVE_RUNE',
                uiLabel: def.uiLabel ?? 'Engrave rune',
                hits: def.hits,
                difficulty: def.difficulty,
                patternId: def.patternId,
                optional: def.optional,
                runeFamily: def.runeFamily,
            };
        case 'LAY_FORMATION':
            return {
                id: def.id,
                type: 'LAY_FORMATION',
                uiLabel: def.uiLabel ?? 'Lay formation',
                hits: def.hits,
                difficulty: def.difficulty,
                patternId: def.patternId,
                optional: def.optional,
                formationId: def.formationId,
            };
        default:
            return def;
    }
}
function buildForgeStepsFromScript(stepScript) {
    return stepScript.map((step) => toCraftStepFromForgeDef(step));
}
function ensureFinishStep(steps, defaultLabel = 'Finish forging') {
    if (steps.some((step) => step.type === 'FINISH')) {
        return steps;
    }
    return [...steps, { id: 'finish', type: 'FINISH', uiLabel: defaultLabel }];
}
function buildHoldStep(id, label, durationMs) {
    return { id, type: 'HOLD_HEAT', uiLabel: label, durationMs: Math.max(500, Math.floor(durationMs)) };
}
export function buildAlchemyScript(recipeId, seed) {
    const recipes = useContentStore.getState().raw?.alchemy_recipes ?? [];
    const recipe = recipes.find((entry) => entry.id === recipeId);
    const roll = createRng(seed);
    const steps = [];
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
    const sealWindow = clampNumber(2000 + roll() * 2000, 750, 6000);
    steps.push({ id: 'seal_lid', type: 'SEAL_LID', uiLabel: 'Seal the lid', windowMs: sealWindow });
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
export function buildForgeScript(blueprintId, seed) {
    const blueprints = useContentStore.getState().raw?.forge_blueprints ?? [];
    const rawBlueprint = blueprints.find((entry) => entry.id === blueprintId);
    const blueprint = rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
    const resolvedStepScript = blueprint ? resolveForgeStepScript(blueprint) : [];
    const scriptSteps = ensureFinishStep(resolvedStepScript.length ? buildForgeStepsFromScript(resolvedStepScript) : [], 'Finish forging');
    const handsOnBonus = blueprint?.handsOnBonus;
    return {
        version: 1,
        station: 'forge',
        sourceId: blueprintId,
        steps: scriptSteps,
        baselineTimeSec: blueprint?.timeSec,
        handsOnBonus,
    };
}
