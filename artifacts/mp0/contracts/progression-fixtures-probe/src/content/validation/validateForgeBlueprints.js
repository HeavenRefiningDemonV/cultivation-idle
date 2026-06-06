import { validateForgeStepScript } from './forgeStepScript.js';
const isRuneBlueprint = (blueprint) => {
    if (blueprint.id.startsWith('rune_'))
        return true;
    const outputs = blueprint.outputs ?? {};
    return Object.keys(outputs).some((itemId) => itemId.startsWith('rune_'));
};
const isFormationBlueprint = (blueprint) => {
    if (blueprint.id.includes('formation'))
        return true;
    const outputs = blueprint.outputs ?? {};
    return Object.keys(outputs).some((itemId) => itemId.includes('formation'));
};
export function validateForgeBlueprintStepScript(blueprint, label, addErr) {
    if (!Array.isArray(blueprint.stepScript) || blueprint.stepScript.length === 0) {
        return;
    }
    const validation = validateForgeStepScript(blueprint.stepScript);
    if (!validation.ok) {
        validation.errors.forEach((message) => addErr(`${label}.stepScript ${message}`));
    }
    const hasSpecial = blueprint.stepScript.some((step) => step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION');
    if (isRuneBlueprint(blueprint) && !hasSpecial) {
        addErr(`${label}.stepScript must include ENGRAVE_RUNE for rune blueprints.`);
    }
    if (isFormationBlueprint(blueprint) && !hasSpecial) {
        addErr(`${label}.stepScript must include LAY_FORMATION for formation blueprints.`);
    }
}
