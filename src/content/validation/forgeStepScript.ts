import type { ForgeStepDef } from '../../systems/crafting/craftingTypes';

export type ForgeStepScriptValidation = {
  ok: boolean;
  errors: string[];
};

const HEAT_STEPS = new Set<ForgeStepDef['type']>(['HEAT_TO', 'HEAT_MATERIAL']);
const STRIKE_STEPS = new Set<ForgeStepDef['type']>(['HAMMER_PATTERN']);
const SPECIAL_STEPS = new Set<ForgeStepDef['type']>(['ENGRAVE_RUNE', 'LAY_FORMATION']);
const FINISH_STEPS = new Set<ForgeStepDef['type']>(['FINISH']);
const ALLOWED_STEPS = new Set<ForgeStepDef['type']>([
  ...HEAT_STEPS,
  ...STRIKE_STEPS,
  ...SPECIAL_STEPS,
  ...FINISH_STEPS,
]);

export function validateForgeStepScript(stepScript: ForgeStepDef[]): ForgeStepScriptValidation {
  const errors: string[] = [];

  if (!stepScript || stepScript.length === 0) {
    return { ok: false, errors: ['Forge step script is empty.'] };
  }

  let heatCount = 0;
  let strikeCount = 0;
  let specialCount = 0;
  let expecting: 'HEAT' | 'STRIKE' = 'HEAT';

  stepScript.forEach((step, index) => {
    if (!ALLOWED_STEPS.has(step.type)) {
      errors.push(`Unexpected step type "${step.type}" at index ${index}.`);
      return;
    }

    if (FINISH_STEPS.has(step.type)) {
      if (index !== stepScript.length - 1) {
        errors.push('FINISH step must be the last step.');
      }
      return;
    }

    if (SPECIAL_STEPS.has(step.type)) {
      if (heatCount < 3 || strikeCount < 2) {
        errors.push('Special step must occur after at least 3 heat steps and 2 strike steps.');
      }
      if (expecting !== 'STRIKE') {
        errors.push('Special step must follow a heat step.');
      }
      specialCount += 1;
      return;
    }

    if (HEAT_STEPS.has(step.type)) {
      if (expecting !== 'HEAT') {
        errors.push(`Expected a strike step at index ${index}, found heat step.`);
      }
      heatCount += 1;
      expecting = 'STRIKE';
      return;
    }

    if (STRIKE_STEPS.has(step.type)) {
      if (expecting !== 'STRIKE') {
        errors.push(`Expected a heat step at index ${index}, found strike step.`);
      }
      strikeCount += 1;
      expecting = 'HEAT';
    }
  });

  if (stepScript.length > 0 && stepScript[stepScript.length - 1].type !== 'FINISH') {
    errors.push('Forge step script must end with FINISH.');
  }

  if (specialCount !== 1) {
    errors.push('Forge step script must include exactly one special step.');
  }

  if (heatCount < 3) {
    errors.push('Forge step script must include at least 3 heat steps.');
  }

  if (strikeCount < 2) {
    errors.push('Forge step script must include at least 2 strike steps.');
  }

  return { ok: errors.length === 0, errors };
}

export function isForgeStepScriptValid(stepScript: ForgeStepDef[]): boolean {
  return validateForgeStepScript(stepScript).ok;
}
